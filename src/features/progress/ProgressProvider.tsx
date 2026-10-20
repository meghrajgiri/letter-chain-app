import Constants from 'expo-constants';
import { randomUUID } from 'expo-crypto';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { dailyKey as dailyKeyFor } from '../daily/daily';
import { mergeSynced } from '../account/sync';
import { setHapticsEnabled } from '../feedback/haptics';
import { setMusicEnabled } from '../feedback/music';
import { setSoundEnabled } from '../feedback/sounds';
import { THEMES } from '../puzzle/data/themes';
import { DEFAULT_HISTORY_SIZE, wordHistory } from '../puzzle/game/wordHistory';
import { DEFAULT_SETTINGS, parseSettings, SETTINGS_KEY, type AppSettings } from '../settings/settings';
import { localDateKey } from './dates';
import { computeProgress, summarizeCompletion, type CompletionSummary, type ProgressSummary } from './summary';
import { openProgressStore } from './storage/store';
import type { ProgressStore } from './storage/types';
import type { GameResult, NewGameResult, StreakSave } from './types';

type ProgressApi = {
  /** False until saved progress has been loaded from the device. */
  ready: boolean;
  results: readonly GameResult[];
  summary: ProgressSummary;
  /** Local date. */
  todayKey: string;
  /** Today's daily puzzle date (UTC; the whole world shares one daily). */
  dailyKey: string;
  /** Saves a finished game and returns it with what the completion screen shows. */
  recordGame: (game: NewGameResult) => { result: GameResult; completion: CompletionSummary };
  /** Missed dailies kept by a streak save. */
  streakSaves: readonly StreakSave[];
  /** Records that the missed daily `day` was saved (call only after the reward is earned). */
  saveStreak: (day: string) => void;
  settings: AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => void;
  /** Sync hooks (used by AccountProvider). */
  sync: {
    pending: () => GameResult[];
    apply: (outcome: { uploadedIds: readonly string[]; downloaded: readonly GameResult[]; syncedAt: string }) => Promise<void>;
    pendingSaves: () => StreakSave[];
    applySaves: (outcome: { uploadedIds: readonly string[]; downloaded: readonly StreakSave[]; syncedAt: string }) => Promise<void>;
    clearSynced: () => Promise<void>;
    clearAll: () => Promise<void>;
    readValue: (key: string) => Promise<string | null>;
    writeValue: (key: string, value: string) => Promise<void>;
  };
};

const ProgressContext = createContext<ProgressApi | null>(null);

export function useProgress(): ProgressApi {
  const api = useContext(ProgressContext);
  if (!api) throw new Error('useProgress must be used inside <ProgressProvider>');
  return api;
}

const dateKeys = (now: Date) => `${localDateKey(now)}|${dailyKeyFor(now)}`;

/** Haptics, sound effects and music read their switches from module state, not React. */
function applyFeedbackSettings(settings: AppSettings) {
  setHapticsEnabled(settings.haptics);
  setSoundEnabled(settings.sound);
  setMusicEnabled(settings.music);
}

/**
 * Local date and daily (UTC) date keys, refreshed every minute and when the
 * app returns to the foreground (so midnight rollovers show up).
 */
function useDateKeys(): { todayKey: string; dailyKey: string } {
  const [keys, setKeys] = useState(() => dateKeys(new Date()));
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') setKeys(dateKeys(new Date()));
    });
    const timer = setInterval(() => setKeys(dateKeys(new Date())), 60_000);
    return () => {
      sub.remove();
      clearInterval(timer);
    };
  }, []);
  const [todayKey, dailyKey] = keys.split('|');
  return { todayKey, dailyKey };
}

/**
 * Loads the player's finished games from device storage and derives all
 * progress from them (see docs/progression-and-sync.md). Also restores and
 * persists the recent-word history used to avoid repeats.
 */
export function ProgressProvider({ children }: { children: ReactNode }) {
  const [results, setResults] = useState<GameResult[]>([]);
  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const settingsRef = useRef<AppSettings>(DEFAULT_SETTINGS);
  const store = useRef<ProgressStore | null>(null);
  const resultsRef = useRef<GameResult[]>([]);
  const [streakSaves, setStreakSaves] = useState<StreakSave[]>([]);
  const savesRef = useRef<StreakSave[]>([]);
  const { todayKey, dailyKey } = useDateKeys();

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;
    (async () => {
      try {
        const s = await openProgressStore();
        const [saved, history, rawSettings, saves] = await Promise.all([
          s.loadResults(),
          s.loadWordHistory(),
          s.getSetting(SETTINGS_KEY),
          s.loadStreakSaves(),
        ]);
        if (cancelled) return;
        const loadedSettings = parseSettings(rawSettings);
        settingsRef.current = loadedSettings;
        setSettings(loadedSettings);
        applyFeedbackSettings(loadedSettings);
        // Restore recent words before listening, so restoring isn't saved again.
        for (const entry of history) wordHistory.record(entry.theme, entry.puzzleId, entry.words);
        unsubscribe = wordHistory.subscribe((theme, puzzleId, words) => {
          s.addWordHistory({ theme, puzzleId, words: [...words], playedAt: new Date().toISOString() }, DEFAULT_HISTORY_SIZE).catch(() => {});
        });
        store.current = s;
        resultsRef.current = saved;
        setResults(saved);
        savesRef.current = saves;
        setStreakSaves(saves);
      } catch (error) {
        // Storage unavailable: play still works, progress lives in memory for this session.
        console.warn('Progress storage unavailable', error);
        if (!cancelled) applyFeedbackSettings(DEFAULT_SETTINGS);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  const recordGame = useCallback((game: NewGameResult) => {
    const now = new Date();
    const result: GameResult = {
      ...game,
      id: randomUUID(),
      completedAt: now.toISOString(),
      localDate: localDateKey(now),
      appVersion: game.appVersion ?? Constants.expoConfig?.version ?? null,
      syncedAt: null,
    };
    const next = [...resultsRef.current, result];
    resultsRef.current = next;
    setResults(next);
    store.current?.addResult(result).catch((error) => console.warn('Could not save result', error));
    return { result, completion: summarizeCompletion(result, next, dailyKeyFor(now), THEMES.length, savesRef.current) };
  }, []);

  const saveStreak = useCallback((day: string) => {
    if (savesRef.current.some((s) => s.day === day)) return;
    const save: StreakSave = { id: randomUUID(), day, savedAt: new Date().toISOString(), syncedAt: null };
    const next = [...savesRef.current, save];
    savesRef.current = next;
    setStreakSaves(next);
    store.current?.addStreakSave(save).catch((error) => console.warn('Could not save streak save', error));
  }, []);

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    const next = { ...settingsRef.current, ...patch };
    settingsRef.current = next;
    setSettings(next);
    applyFeedbackSettings(next);
    store.current?.setSetting(SETTINGS_KEY, JSON.stringify(next)).catch((error) => console.warn('Could not save settings', error));
  }, []);

  const sync = useMemo<ProgressApi['sync']>(
    () => ({
      pending: () => resultsRef.current.filter((r) => !r.syncedAt),
      async apply({ uploadedIds, downloaded, syncedAt }) {
        const { next, fresh } = mergeSynced(resultsRef.current, uploadedIds, downloaded, syncedAt, (r) => r.completedAt);
        resultsRef.current = next;
        setResults(next);
        const s = store.current;
        if (!s) return;
        await s.markSynced(uploadedIds, syncedAt);
        for (const r of fresh) await s.addResult(r);
      },
      pendingSaves: () => savesRef.current.filter((s) => !s.syncedAt),
      async applySaves({ uploadedIds, downloaded, syncedAt }) {
        const { next, fresh } = mergeSynced(savesRef.current, uploadedIds, downloaded, syncedAt, (s) => s.savedAt);
        savesRef.current = next;
        setStreakSaves(next);
        const s = store.current;
        if (!s) return;
        await s.markStreakSavesSynced(uploadedIds, syncedAt);
        for (const save of fresh) await s.addStreakSave(save);
      },
      async clearSynced() {
        const next = resultsRef.current.filter((r) => !r.syncedAt);
        resultsRef.current = next;
        setResults(next);
        const saves = savesRef.current.filter((s) => !s.syncedAt);
        savesRef.current = saves;
        setStreakSaves(saves);
        await store.current?.deleteSyncedResults();
      },
      async clearAll() {
        resultsRef.current = [];
        setResults([]);
        savesRef.current = [];
        setStreakSaves([]);
        await store.current?.deleteAllResults();
      },
      readValue: async (key) => (await store.current?.getSetting(key)) ?? null,
      writeValue: async (key, value) => {
        await store.current?.setSetting(key, value);
      },
    }),
    [],
  );

  const summary = useMemo(
    () => computeProgress(results, todayKey, THEMES.length, dailyKey, streakSaves),
    [results, todayKey, dailyKey, streakSaves],
  );
  const api = useMemo<ProgressApi>(
    () => ({ ready, results, summary, todayKey, dailyKey, recordGame, streakSaves, saveStreak, settings, updateSettings, sync }),
    [ready, results, summary, todayKey, dailyKey, recordGame, streakSaves, saveStreak, settings, updateSettings, sync],
  );

  return <ProgressContext.Provider value={api}>{children}</ProgressContext.Provider>;
}
