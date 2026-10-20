import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { useToast } from '@/components/ui/Toast';
import { buildShareText, pointsPerWord, type CompletionSummary, type GameResult } from '@/features/progress';
import { shareText } from '@/features/progress/shareResult';
import { SHARE_URL } from '@/config/app';
import { SignInPrompt } from '@/features/account/SignInPrompt';
import { haptic } from '@/features/feedback/haptics';
import { useProgress } from '@/features/progress/ProgressProvider';
import { TutorialSheet } from '@/features/tutorial/TutorialSheet';
import { CompletionView } from '@/features/puzzle/components/CompletionView';
import { PausedOverlay } from '@/features/puzzle/components/PausedOverlay';
import { PuzzleHeader, PuzzleStatusRow } from '@/features/puzzle/components/PuzzleChrome';
import { SelectionChip, type SelectionFeedback } from '@/features/puzzle/components/SelectionChip';
import { TILE_WELL_PADDING, TileGrid } from '@/features/puzzle/components/TileGrid';
import { WordList } from '@/features/puzzle/components/WordList';
import { getTheme } from '@/features/puzzle/data/themes';
import { getCellsBetween } from '@/features/puzzle/engine/getCellsBetween';
import { randomSeed } from '@/features/puzzle/engine/random';
import type { Cell, Difficulty, Puzzle } from '@/features/puzzle/engine/types';
import { readCells, resolveTap } from '@/features/puzzle/game/selection';
import { getTileLayout } from '@/features/puzzle/game/tileLayout';
import { wordHistory } from '@/features/puzzle/game/wordHistory';
import { usePuzzle } from '@/features/puzzle/hooks/usePuzzle';
import { usePuzzleSelection, type Selection } from '@/features/puzzle/hooks/usePuzzleSelection';
import { usePuzzleTimer } from '@/features/puzzle/hooks/usePuzzleTimer';
import { announceFeedback, useScreenReader } from '@/lib/useScreenReader';
import { startAutoGame } from '@/features/play/autoPlay';
import { canOfferAdHint } from '@/features/ads/adPolicy';
import { useAds } from '@/features/ads/AdsProvider';
import { useInterstitialBreak } from '@/features/ads/useInterstitialBreak';
import { useRewardedHint } from '@/features/ads/useRewardedHint';
import { colors, radius, shadows, spacing } from '@/theme/tokens';

export type PuzzleMode = 'free' | 'daily';

type Props = {
  theme: string;
  difficulty: Difficulty;
  mode?: PuzzleMode;
  seed?: number;
  gridSize?: number;
  wordCount?: number;
  /** Used only with an explicit `seed`, to reproduce a specific puzzle. */
  avoidWords?: string[];
  /** UTC date ('YYYY-MM-DD') of the daily puzzle, when `mode` is 'daily'. */
  dailyDate?: string;
  /** The daily puzzle (already built), when `mode` is 'daily'. */
  preset?: Puzzle;
};

const PADDING = spacing.md;
const GAP = 10;
const BOARD_PADDING = 10;
/** Card padding + border + lavender well padding, on each side. */
const BOARD_CHROME = (BOARD_PADDING + 1 + TILE_WELL_PADDING) * 2;
const MAX_BOARD = 560;

/** A fresh random game that steers away from this theme's recently played words. */
const nextGame = (theme: string) => ({ seed: randomSeed(), avoidWords: wordHistory.recentWords(theme) });

export function PuzzleScreen({ theme, difficulty, mode = 'free', seed: initialSeed, gridSize, wordCount, avoidWords, dailyDate, preset }: Props) {
  const toast = useToast();
  const { recordGame, results, settings, updateSettings } = useProgress();
  const [completion, setCompletion] = useState<{ puzzleId: string; summary: CompletionSummary; result: GameResult } | null>(null);
  // An explicit seed (daily puzzle, Studio link) reproduces that exact puzzle, so it ignores history.
  const [game] = useState(() =>
    initialSeed !== undefined ? { seed: initialSeed, avoidWords: avoidWords ?? [] } : nextGame(theme),
  );
  const { puzzle, found, hinted, hintCells, hintsUsed, hintsLeft, adHints, addAdHint, submitSelection, revealHint, revealWord, isComplete } = usePuzzle({
    theme,
    difficulty,
    gridSize,
    wordCount,
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
  const [tutorialOpen, setTutorialOpen] = useState(() => !settings.tutorialsSeen.classic);
  const tutorialOpenRef = useRef(tutorialOpen);
  useEffect(() => {
    tutorialOpenRef.current = tutorialOpen;
  }, [tutorialOpen]);

  // The clock starts as soon as a puzzle is on screen, and restarts for each new puzzle.
  useEffect(() => {
    resetTimer();
    if (!tutorialOpenRef.current) startTimer();
  }, [puzzle.id, resetTimer, startTimer]);

  // The board always spans the full content width (same as the word list). Its
  // size depends only on the screen width, so it never changes mid-game. If a
  // short screen can't fit everything, the page scrolls (never while dragging).
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const compact = windowHeight < 700;
  const boardSize = Math.min(windowWidth - PADDING * 2, MAX_BOARD);
  const tileLayout = getTileLayout(puzzle.gridSize, boardSize - BOARD_CHROME);

  const [feedback, setFeedback] = useState<SelectionFeedback>(null);
  const feedbackTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showFeedback = useCallback((next: SelectionFeedback) => {
    if (feedbackTimeout.current) clearTimeout(feedbackTimeout.current);
    setFeedback(next);
    feedbackTimeout.current = setTimeout(() => setFeedback(null), 1400);
  }, []);
  useEffect(() => () => {
    if (feedbackTimeout.current) clearTimeout(feedbackTimeout.current);
  }, []);

  /** Called when the last word is found: stop the clock and save the game. */
  const ads = useAds();
  const finishGame = useCallback((hintsUsedFinal: number) => {
    const durationMs = Math.max(1, stopTimer());
    haptic('complete');
    ads.recordGameFinished(mode === 'daily');
    const { completion: done, result } = recordGame({
      mode: 'classic',
      puzzleId: puzzle.id,
      theme: puzzle.theme,
      difficulty: puzzle.difficulty,
      isDaily: mode === 'daily',
      dailyDate: mode === 'daily' ? (dailyDate ?? null) : null,
      wordCount: puzzle.words.length,
      durationMs,
      hintsUsed: hintsUsedFinal,
    });
    setCompletion({ puzzleId: puzzle.id, summary: done, result });
  }, [stopTimer, recordGame, puzzle, mode, dailyDate, ads]);

  const screenReader = useScreenReader();
  // Tap-to-select: the first tapped letter waits here for the last one. Tied to
  // the puzzle id so a new puzzle starts without a stale anchor.
  const [tapAnchor, setTapAnchor] = useState<{ puzzleId: string; cell: Cell } | null>(null);
  const anchor = tapAnchor?.puzzleId === puzzle.id ? tapAnchor.cell : null;

  /** Checks a straight line (from a drag or two taps). Returns false when it isn't a word. */
  const submitLine = useCallback(
    (start: Cell, end: Cell): boolean => {
      const result = submitSelection(start, end);
      if (result.type === 'found') {
        haptic('found');
        showFeedback({ tone: 'found', text: `${result.word} +${pointsPerWord('classic', puzzle.difficulty)} pts` });
        announceFeedback(`Found ${result.word}`);
        if (found.length + 1 === puzzle.words.length) finishGame(hintsUsed);
        return true;
      }
      if (result.type === 'backwards') {
        haptic('warning');
        showFeedback({ tone: 'info', text: `Close! Start ${result.word} from its first letter` });
        announceFeedback(`${result.word} runs the other way. Start from its first letter.`);
        return true;
      }
      if (result.type === 'already-found') {
        showFeedback({ tone: 'info', text: `${result.word} already found` });
        announceFeedback(`${result.word} already found`);
        return true;
      }
      return false;
    },
    [submitSelection, showFeedback, found.length, puzzle, finishGame, hintsUsed],
  );

  const handleSelectionEnd = useCallback(
    ({ start, end }: Selection) => {
      setTapAnchor(null); // a drag replaces any half-finished tap selection
      submitLine(start, end);
    },
    [submitLine],
  );

  const handleTap = useCallback(
    (cell: Cell) => {
      if (isComplete || paused || tutorialOpen) return;
      const tap = resolveTap(anchor, cell);
      if (tap.type === 'anchor') {
        haptic('select');
        setTapAnchor({ puzzleId: puzzle.id, cell: tap.anchor });
        announceFeedback(`${puzzle.grid[cell.row][cell.col]} selected. Tap the last letter of the word.`);
      } else if (tap.type === 'cancel') {
        setTapAnchor(null);
        announceFeedback('Selection cleared');
      } else {
        setTapAnchor(null);
        if (!submitLine(tap.start, tap.end)) {
          haptic('warning');
          showFeedback({ tone: 'info', text: 'No word there — try again' });
          announceFeedback('No word there');
        }
      }
    },
    [isComplete, paused, tutorialOpen, anchor, puzzle, submitLine, showFeedback],
  );

  const hint = useCallback(() => {
    const word = revealHint();
    if (word) showFeedback({ tone: 'info', text: `${word} starts at the ring` });
    else toast.show(hintsLeft < 1 ? 'No hints left for this puzzle' : 'Every remaining word is already hinted');
  }, [revealHint, showFeedback, toast, hintsLeft]);

  const reveal = useCallback(() => {
    const revealed = revealWord();
    if (!revealed) {
      toast.show('Revealing a word needs 2 hints');
      return;
    }
    showFeedback({ tone: 'found', text: `Revealed ${revealed.word}` });
    if (found.length + 1 === puzzle.words.length) finishGame(revealed.hintsUsed);
  }, [revealWord, toast, showFeedback, found.length, puzzle.words.length, finishGame]);

  const { panHandlers, selection } = usePuzzleSelection({
    gridSize: puzzle.gridSize,
    cellSize: tileLayout.pitch,
    enabled: !isComplete && !paused && !tutorialOpen,
    onSelectionStart: () => haptic('select'),
    onSelectionEnd: handleSelectionEnd,
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
    if (!settings.tutorialsSeen.classic) updateSettings({ tutorialsSeen: { ...settings.tutorialsSeen, classic: true } });
    if (!isComplete && !paused) startTimer();
  }, [settings.tutorialsSeen, updateSettings, isComplete, paused, startTimer]);

  // Out of hints: offer one more for watching a rewarded ad. The clock pauses while it plays.
  const rewardedHint = useRewardedHint({
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

  const continueAfterWin = useCallback(() => {
    if (mode === 'daily') {
      router.back();
      return;
    }
    // Next game: a fresh theme at the difficulty for the player's (maybe new) Classic level.
    interstitial.proceed(() => startAutoGame('classic', results, { replace: true }));
  }, [mode, results, interstitial]);

  // While a tap anchor waits, keep it lit (pressing another cell is still just a tap).
  const isLine = selection !== null && (selection.start.row !== selection.end.row || selection.start.col !== selection.end.col);
  const shownSelection = isLine || !anchor ? selection : { start: anchor, end: anchor };
  const selectionCells = selection ? getCellsBetween(selection.start, selection.end) : null;
  const selectionText = selectionCells && selectionCells.length > 1 ? readCells(puzzle.grid, selectionCells) : '';
  const themeConfig = getTheme(puzzle.theme);
  const difficultyLabel = puzzle.difficulty[0].toUpperCase() + puzzle.difficulty.slice(1);
  const header = (
    <PuzzleHeader
      icon={themeConfig?.icon}
      title={puzzle.themeName}
      caption={mode === 'daily' ? 'Daily puzzle · Classic' : difficultyLabel}
      onHelp={isComplete ? undefined : openHelp}
    />
  );

  if (isComplete && !reviewing) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
        {header}
        <CompletionView
          elapsedMs={elapsedMs}
          wordCount={puzzle.words.length}
          hintsUsed={hintsUsed}
          mode="classic"
          completion={completion?.puzzleId === puzzle.id ? completion.summary : null}
          isDaily={mode === 'daily'}
          continueLabel={mode === 'daily' ? 'Back Home' : 'Continue'}
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
        // Never scroll while a word is being dragged.
        scrollEnabled={selection === null}
        showsVerticalScrollIndicator={false}
      >
        <PuzzleStatusRow
          elapsedMs={elapsedMs}
          countIcon="donut-large"
          countLabel={`${found.length} / ${puzzle.words.length} Words`}
          countAccessibilityLabel={`${found.length} of ${puzzle.words.length} words found`}
          showPause={!isComplete}
          onPause={pause}
        />

        <SelectionChip
          selectionText={selectionText}
          feedback={feedback}
          hint={
            anchor
              ? `${puzzle.grid[anchor.row][anchor.col]} selected — now tap the word’s last letter`
              : found.length === 0
                ? 'Drag across a word, or tap its first and last letters'
                : ' '
          }
        />

        <View style={[styles.board, { width: boardSize }]}>
          <TileGrid
            grid={puzzle.grid}
            layout={tileLayout}
            found={found}
            selection={shownSelection}
            hintCells={hintCells}
            panHandlers={panHandlers}
            screenReader={screenReader}
            onTileTap={handleTap}
            accessibilityLabel={`Word search grid, ${puzzle.gridSize} by ${puzzle.gridSize}`}
            accessibilityHint="Tap a word's first letter, then its last letter"
          />
          {paused && <PausedOverlay onResume={resume} />}
        </View>

        <WordList words={puzzle.words} found={found} hinted={hinted} />

        {reviewing ? (
          <Button label="Back to results" icon="emoji-events" size={compact ? 'md' : 'lg'} onPress={() => setReviewing(false)} />
        ) : (
          <View style={styles.actions}>
            <Button
              label={offerAdHint ? (windowWidth < 380 ? '+1 Hint' : 'Watch ad: +1 hint') : windowWidth < 380 ? 'Hint' : 'Use Hint'}
              icon={offerAdHint ? 'ondemand-video' : 'lightbulb-outline'}
              size={compact ? 'md' : 'lg'}
              style={styles.flex}
              disabled={hintsLeft < 1 && !offerAdHint}
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
            <IconButton
              icon="visibility"
              label="Reveal a word (uses 2 hints)"
              variant="muted"
              size={compact ? 48 : 56}
              disabled={hintsLeft < 2}
              onPress={reveal}
            />
          </View>
        )}
      </ScrollView>
      <TutorialSheet mode="classic" visible={tutorialOpen} onDone={closeHelp} />
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
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: BOARD_PADDING,
    boxShadow: shadows.card,
  },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  hintBadge: { backgroundColor: 'rgba(255,255,255,0.22)', borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 2 },
});
