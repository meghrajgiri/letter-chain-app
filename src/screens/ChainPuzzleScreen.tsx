import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { CHAIN_WELL_PADDING, ChainGrid } from '@/features/chain/components/ChainGrid';
import { ChainWordList } from '@/features/chain/components/ChainWordList';
import type { ChainDifficulty, ChainPuzzle } from '@/features/chain/engine/types';
import { cellKeySet, resolveChainTap, type ChainMatch } from '@/features/chain/game/pathSelection';
import { useChainPuzzle } from '@/features/chain/hooks/useChainPuzzle';
import { useChainSelection } from '@/features/chain/hooks/useChainSelection';
import { buildShareText, pointsPerWord, type CompletionSummary, type GameResult } from '@/features/progress';
import { shareText } from '@/features/progress/shareResult';
import { SHARE_URL } from '@/config/app';
import { SignInPrompt } from '@/features/account/SignInPrompt';
import { playFeedback } from '@/features/feedback/feedback';
import { useProgress } from '@/features/progress/ProgressProvider';
import { TutorialSheet } from '@/features/tutorial/TutorialSheet';
import { CompletionView } from '@/features/puzzle/components/CompletionView';
import { PausedOverlay } from '@/features/puzzle/components/PausedOverlay';
import { PuzzleHeader, PuzzleStatusRow } from '@/features/puzzle/components/PuzzleChrome';
import { SelectionChip, type SelectionFeedback } from '@/features/puzzle/components/SelectionChip';
import { getTheme } from '@/features/puzzle/data/themes';
import { cellKey } from '@/features/puzzle/engine/gridScan';
import { randomSeed } from '@/features/puzzle/engine/random';
import type { Cell } from '@/features/puzzle/engine/types';
import { latestOpenHint } from '@/features/puzzle/game/hints';
import { boardSizeFor, getTileLayout } from '@/features/puzzle/game/tileLayout';
import { wordHistory } from '@/features/puzzle/game/wordHistory';
import { usePuzzleTimer } from '@/features/puzzle/hooks/usePuzzleTimer';
import { announceFeedback, useScreenReader } from '@/lib/useScreenReader';
import { startAutoGame } from '@/features/play/autoPlay';
import { canOfferAdHint } from '@/features/ads/adPolicy';
import { useAds } from '@/features/ads/AdsProvider';
import { useInterstitialBreak } from '@/features/ads/useInterstitialBreak';
import { useRewarded } from '@/features/ads/useRewarded';
import { LIP, colors, radius, shadows, spacing } from '@/theme/tokens';

type Props = {
  theme: string;
  difficulty: ChainDifficulty;
  seed?: number;
  avoidWords?: string[];
  mode?: 'free' | 'daily';
  /** The daily puzzle (already built), when `mode` is 'daily'. */
  preset?: ChainPuzzle;
  /** UTC date of the daily puzzle ('YYYY-MM-DD'). */
  dailyDate?: string;
};

const PADDING = spacing.md;
const GAP = 10;
const BOARD_PADDING = 10;
const BOARD_CHROME = (BOARD_PADDING + 1 + CHAIN_WELL_PADDING) * 2;
const MAX_BOARD = 520;

/** Wider gaps than Classic so the path connectors between tiles are visible. */
const chainGap = (n: number) => (n <= 6 ? 8 : n <= 7 ? 7 : 6);

const NO_PATH: Cell[] = [];

const nextGame = (theme: string) => ({ seed: randomSeed(), avoidWords: wordHistory.recentWords(theme) });

export function ChainPuzzleScreen({ theme, difficulty, seed: initialSeed, avoidWords, mode = 'free', preset, dailyDate }: Props) {
  const toast = useToast();
  const { recordGame, results, settings, updateSettings } = useProgress();
  const [completion, setCompletion] = useState<{ puzzleId: string; summary: CompletionSummary; result: GameResult } | null>(null);
  const [game] = useState(() =>
    initialSeed !== undefined ? { seed: initialSeed, avoidWords: avoidWords ?? [] } : nextGame(theme),
  );
  const { puzzle, found, foundWords, hinted, hintCells, hintsLeft, adHints, addAdHint, submitPath, revealHint, isComplete } = useChainPuzzle({
    theme,
    difficulty,
    preset,
    ...game,
  });

  useEffect(() => {
    if (mode === 'free') wordHistory.record(puzzle.theme, puzzle.id, puzzle.words);
  }, [puzzle, mode]);

  const { elapsedMs, start: startTimer, stop: stopTimer, reset: resetTimer } = usePuzzleTimer();
  const [paused, setPaused] = useState(false);
  const [reviewing, setReviewing] = useState(false);

  // First play of this mode shows the tutorial; the clock waits until it's closed.
  const [tutorialOpen, setTutorialOpen] = useState(() => !settings.tutorialsSeen.chain);
  const tutorialOpenRef = useRef(tutorialOpen);
  useEffect(() => {
    tutorialOpenRef.current = tutorialOpen;
  }, [tutorialOpen]);

  // The clock starts as soon as a puzzle is on screen, and restarts for each new puzzle.
  useEffect(() => {
    resetTimer();
    if (!tutorialOpenRef.current) startTimer();
  }, [puzzle.id, resetTimer, startTimer]);

  // The board always spans the full content width (same as the word list), so
  // it never changes mid-game. Short screens scroll (never while dragging).
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const compact = windowHeight < 700;
  const n = Math.max(puzzle.rows, puzzle.cols);
  const boardSize = boardSizeFor(windowWidth, windowHeight, PADDING, MAX_BOARD);
  const layout = getTileLayout(n, boardSize - BOARD_CHROME, chainGap(n));

  const [feedback, setFeedback] = useState<SelectionFeedback>(null);
  const feedbackTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showFeedback = useCallback((next: SelectionFeedback) => {
    if (feedbackTimeout.current) clearTimeout(feedbackTimeout.current);
    setFeedback(next);
    feedbackTimeout.current = setTimeout(() => setFeedback(null), 1600);
  }, []);
  useEffect(() => () => {
    if (feedbackTimeout.current) clearTimeout(feedbackTimeout.current);
  }, []);

  const foundCells = useMemo(() => cellKeySet(found.flatMap((f) => f.cells)), [found]);
  const isBlocked = useCallback((cell: Cell) => foundCells.has(cellKey(cell)), [foundCells]);

  /** Called when the last word is found: stop the clock and save the game. */
  const ads = useAds();
  const finishGame = useCallback(() => {
    const durationMs = Math.max(1, stopTimer());
    playFeedback('complete');
    ads.recordGameFinished(mode === 'daily');
    const { completion: done, result } = recordGame({
      mode: 'chain',
      puzzleId: puzzle.id,
      theme: puzzle.theme,
      difficulty: puzzle.difficulty,
      isDaily: mode === 'daily',
      dailyDate: mode === 'daily' ? (dailyDate ?? null) : null,
      wordCount: puzzle.words.length,
      durationMs,
      hintsUsed: hinted.length,
    });
    setCompletion({ puzzleId: puzzle.id, summary: done, result });
  }, [stopTimer, recordGame, puzzle, hinted.length, mode, dailyDate, ads]);

  const report = useCallback(
    (result: ChainMatch) => {
      if (result.type === 'found') {
        playFeedback('found');
        showFeedback({ tone: 'found', text: `${result.word} +${pointsPerWord('chain', puzzle.difficulty)} pts` });
        announceFeedback(`Found ${result.word}`);
        if (found.length + 1 === puzzle.words.length) finishGame();
      } else if (result.type === 'wrong-path') {
        playFeedback('warning');
        showFeedback({ tone: 'info', text: `${result.word} is right, but not that path` });
        announceFeedback(`${result.word} is right, but not that path`);
      } else if (result.type === 'already-found') showFeedback({ tone: 'info', text: `${result.word} already found` });
    },
    [showFeedback, puzzle, found.length, finishGame],
  );

  const screenReader = useScreenReader();
  // Tap-to-select: the path built so far, tied to the puzzle id so a new puzzle starts clean.
  const [tapState, setTapState] = useState<{ puzzleId: string; path: Cell[] }>({ puzzleId: '', path: NO_PATH });
  const tapPath = tapState.puzzleId === puzzle.id ? tapState.path : NO_PATH;

  const handlePath = useCallback(
    (path: Cell[]) => {
      setTapState({ puzzleId: puzzle.id, path: NO_PATH }); // a drag replaces any half-built tap path
      report(submitPath(path));
    },
    [puzzle.id, report, submitPath],
  );

  const handleTap = useCallback(
    (cell: Cell) => {
      if (isComplete || paused || tutorialOpen) return;
      const tap = resolveChainTap(tapPath, cell, isBlocked, puzzle.grid, puzzle.placements, foundWords);
      if (tap.type === 'submit') {
        setTapState({ puzzleId: puzzle.id, path: NO_PATH });
        report(submitPath(tap.path));
        return;
      }
      if (tap.path === tapPath) return; // tapped a found letter
      playFeedback('select');
      setTapState({ puzzleId: puzzle.id, path: tap.path });
      announceFeedback(
        tap.path.length === 0 ? 'Path cleared' : `${tap.path.map((c) => puzzle.grid[c.row][c.col]).join(' ')}. Tap the next letter.`,
      );
    },
    [isComplete, paused, tutorialOpen, tapPath, isBlocked, puzzle, foundWords, report, submitPath],
  );

  const { panHandlers, path } = useChainSelection({
    rows: puzzle.rows,
    cols: puzzle.cols,
    pitch: layout.pitch,
    tile: layout.tile,
    enabled: !isComplete && !paused && !tutorialOpen,
    isBlocked,
    onSelectionStart: () => playFeedback('select'),
    onSelectionEnd: handlePath,
    onTap: handleTap,
  });

  const pause = useCallback(() => {
    stopTimer();
    setPaused(true);
  }, [stopTimer]);
  const resume = useCallback(() => {
    setPaused(false);
    startTimer();
  }, [startTimer]);

  const openHelp = useCallback(() => {
    stopTimer();
    setTutorialOpen(true);
  }, [stopTimer]);
  const closeHelp = useCallback(() => {
    setTutorialOpen(false);
    if (!settings.tutorialsSeen.chain) updateSettings({ tutorialsSeen: { ...settings.tutorialsSeen, chain: true } });
    if (!isComplete && !paused) startTimer();
  }, [settings.tutorialsSeen, updateSettings, isComplete, paused, startTimer]);

  const hint = useCallback(() => {
    const word = revealHint();
    // The hint itself stays pinned above the board (see pinnedHint) until the word is found.
    if (word) {
      playFeedback('hint');
      announceFeedback(`Hint: ${word} starts at the yellow ring`);
    } else toast.show(hintsLeft === 0 ? 'No hints left for this puzzle' : 'Every word is already revealed');
  }, [revealHint, toast, hintsLeft]);

  // Out of hints: offer one more for watching a rewarded ad. The clock pauses while it plays.
  const rewardedHint = useRewarded({
    unit: 'rewardedHint',
    enabled: !isComplete,
    onReward: () => {
      addAdHint();
      showFeedback({ tone: 'found', text: '+1 hint earned' });
    },
    onClosed: () => {
      if (!isComplete && !paused) startTimer();
    },
  });
  const offerAdHint = canOfferAdHint(hintsLeft, adHints) && rewardedHint.available;
  const watchAdForHint = useCallback(() => {
    stopTimer();
    rewardedHint.show();
  }, [stopTimer, rewardedHint]);

  // Between free-play puzzles, Continue may show an interstitial first (never for the daily).
  const interstitial = useInterstitialBreak({ enabled: mode === 'free', isDaily: mode === 'daily' });

  // Next game: a fresh theme at the difficulty for the player's (maybe new) Chain level.
  const continueAfterWin = useCallback(() => {
    if (mode === 'daily') router.back();
    else interstitial.proceed(() => startAutoGame('chain', results, { replace: true }));
  }, [mode, results, interstitial]);

  // A live drag wins; otherwise show the tap path (a press on one cell is still just a tap).
  const shownPath = path.length > 1 || tapPath.length === 0 ? path : tapPath;
  const selectionText = shownPath.length > 1 ? shownPath.map((c) => puzzle.grid[c.row][c.col]).join('') : '';
  // The latest hint whose word is still unfound stays on screen until it's found.
  const pinnedHint = latestOpenHint(hinted, foundWords);
  const themeConfig = getTheme(puzzle.theme);

  const difficultyLabel = difficulty[0].toUpperCase() + difficulty.slice(1);
  const header = (
    <PuzzleHeader icon={themeConfig?.icon} title={puzzle.themeName} caption={mode === 'daily' ? 'Daily puzzle · Chain' : `Chain · ${difficultyLabel}`} onHelp={isComplete ? undefined : openHelp} />
  );

  if (isComplete && !reviewing) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
        {header}
        <CompletionView
          elapsedMs={elapsedMs}
          wordCount={puzzle.words.length}
          hintsUsed={hinted.length}
          mode="chain"
          completion={completion?.puzzleId === puzzle.id ? completion.summary : null}
          isDaily={mode === 'daily'}
          continueLabel={mode === 'daily' ? 'Back Home' : 'Next Chain'}
          onContinue={continueAfterWin}
          onShare={async () => {
            if (!completion) return;
            const ok = await shareText(
              buildShareText({
                result: completion.result,
                themeName: puzzle.themeName,
                themeIcon: themeConfig?.icon,
                score: completion.summary.score,
                streakDays: completion.summary.streak.current,
                isPersonalBest: completion.summary.isPersonalBest,
                url: SHARE_URL,
              }),
            );
            if (!ok) toast.show('Sharing isn’t available on this device');
          }}
          onReview={() => setReviewing(true)}
          promo={<SignInPrompt completion={completion?.puzzleId === puzzle.id ? completion.summary : null} />}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
      {header}
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        scrollEnabled={path.length === 0}
        showsVerticalScrollIndicator={false}
      >
        <PuzzleStatusRow
          elapsedMs={elapsedMs}
          countIcon="grid-on"
          countLabel={`${foundCells.size} / ${puzzle.rows * puzzle.cols} Letters`}
          countAccessibilityLabel={`${foundCells.size} of ${puzzle.rows * puzzle.cols} letters used`}
          showPause={!isComplete}
          onPause={pause}
        />

        <SelectionChip
          selectionText={selectionText}
          feedback={feedback}
          hint={
            tapPath.length === 1
              ? `${puzzle.grid[tapPath[0].row][tapPath[0].col]} selected — tap the next letter`
              : pinnedHint
                ? `${pinnedHint} starts at the yellow ring`
                : found.length === 0
                  ? 'Trace or tap words up, down or sideways'
                  : ' '
          }
          hintTone={tapPath.length !== 1 && pinnedHint ? 'hint' : 'idle'}
        />

        <View style={[styles.board, { width: boardSize }]}>
          <ChainGrid
            grid={puzzle.grid}
            layout={layout}
            found={found}
            path={shownPath}
            hintCells={hintCells}
            panHandlers={panHandlers}
            screenReader={screenReader}
            onTileTap={handleTap}
            accessibilityLabel={`Chain grid, ${puzzle.rows} by ${puzzle.cols}`}
            accessibilityHint="Tap a word's letters in order, moving up, down or sideways"
          />
          {paused && <PausedOverlay onResume={resume} />}
        </View>

        <ChainWordList words={puzzle.words} found={found} hinted={hinted} themeName={puzzle.themeName} />

        {reviewing ? (
          <Button label="Back to results" icon="emoji-events" size={compact ? 'md' : 'lg'} onPress={() => setReviewing(false)} />
        ) : (
          <Button
            label={offerAdHint ? (windowWidth < 380 ? '+1 Hint' : 'Watch ad: +1 hint') : windowWidth < 380 ? 'Hint' : 'Use Hint'}
            icon={offerAdHint ? 'ondemand-video' : 'lightbulb-outline'}
            size={compact ? 'md' : 'lg'}
            disabled={hintsLeft === 0 && !offerAdHint}
            onPress={offerAdHint ? watchAdForHint : hint}
            trailing={
              offerAdHint ? undefined : (
                <View style={styles.hintBadge}>
                  <AppText variant="labelMd" color={colors.primaryInk}>
                    {hintsLeft} Left
                  </AppText>
                </View>
              )
            }
          />
        )}
      </ScrollView>
      <TutorialSheet mode="chain" visible={tutorialOpen} onDone={closeHelp} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { paddingHorizontal: PADDING, paddingBottom: spacing.md, gap: GAP },
  board: {
    alignSelf: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    // Chunky bottom edge: the board reads as a physical game tile. The side
    // borders stay 1px so the lip is the only change to the tile maths.
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomWidth: LIP.lg,
    borderBottomColor: colors.lip,
    padding: BOARD_PADDING,
    boxShadow: shadows.card,
  },
  hintBadge: { backgroundColor: 'rgba(255,255,255,0.22)', borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 2 },
});
