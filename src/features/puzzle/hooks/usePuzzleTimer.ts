import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

export type PuzzleTimer = {
  elapsedMs: number;
  isRunning: boolean;
  start: () => void;
  /** Stops the clock and returns the final elapsed time. */
  stop: () => number;
  reset: () => void;
};

const TICK_MS = 250;

/**
 * Wall-clock puzzle timer. Pauses while the app is backgrounded so a
 * player who switches apps isn't penalised.
 */
export function usePuzzleTimer(): PuzzleTimer {
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const startedAt = useRef<number | null>(null);
  const accumulated = useRef(0);

  const read = () => accumulated.current + (startedAt.current === null ? 0 : Date.now() - startedAt.current);

  const start = useCallback(() => {
    if (startedAt.current !== null) return;
    startedAt.current = Date.now();
    setIsRunning(true);
  }, []);

  const stop = useCallback(() => {
    if (startedAt.current !== null) {
      accumulated.current += Date.now() - startedAt.current;
      startedAt.current = null;
      setElapsedMs(accumulated.current);
      setIsRunning(false);
    }
    return accumulated.current;
  }, []);

  const reset = useCallback(() => {
    startedAt.current = null;
    accumulated.current = 0;
    setElapsedMs(0);
    setIsRunning(false);
  }, []);

  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => setElapsedMs(read()), TICK_MS);
    return () => clearInterval(id);
  }, [isRunning]);

  // Pause in background, resume on return.
  const pausedByBackground = useRef(false);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active' && startedAt.current !== null) {
        accumulated.current += Date.now() - startedAt.current;
        startedAt.current = null;
        pausedByBackground.current = true;
      } else if (state === 'active' && pausedByBackground.current) {
        pausedByBackground.current = false;
        startedAt.current = Date.now();
      }
    });
    return () => sub.remove();
  }, []);

  return { elapsedMs, isRunning, start, stop, reset };
}

export function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
