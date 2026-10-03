import { useLayoutEffect, useRef, useState } from 'react';
import { PanResponder, type GestureResponderEvent, type PanResponderInstance } from 'react-native';

import type { Cell } from '../engine/types';
import { getCellFromTouchPoint, snapSelectionFromPoint } from '../game/selection';

export type Selection = { start: Cell; end: Cell };

type Options = {
  gridSize: number;
  cellSize: number;
  enabled: boolean;
  onSelectionStart?: () => void;
  /** Called on release with the straight-line selection. */
  onSelectionEnd: (selection: Selection) => void;
};

/**
 * Turns touch gestures on the grid into a straight-line selection.
 *
 * Only translates coordinates → cells; word matching happens in the caller
 * via the pure `matchSelection`. State only updates when the snapped end
 * cell changes, so dragging within a cell causes no re-render.
 */
export function usePuzzleSelection(options: Options): {
  panHandlers: PanResponderInstance['panHandlers'];
  selection: Selection | null;
} {
  const [selection, setSelection] = useState<Selection | null>(null);
  const latest = useRef(options);
  useLayoutEffect(() => {
    latest.current = options;
  });
  const startCell = useRef<Cell | null>(null);
  const endCell = useRef<Cell | null>(null);
  // Page offset of the grid, derived from the grant event (robust to scrolling/layout).
  const offset = useRef({ x: 0, y: 0 });

  // Handlers read refs only at gesture time, never during render; the
  // compiler rule can't see that through PanResponder.create.
  // eslint-disable-next-line react-hooks/refs
  const [responder] = useState(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => latest.current.enabled,
      onMoveShouldSetPanResponder: () => latest.current.enabled,
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,

      onPanResponderGrant: (event: GestureResponderEvent) => {
        const { locationX, locationY, pageX, pageY } = event.nativeEvent;
        const { cellSize, gridSize } = latest.current;
        offset.current = { x: pageX - locationX, y: pageY - locationY };
        const cell = getCellFromTouchPoint({ x: locationX, y: locationY }, cellSize, gridSize, { clamp: true });
        if (!cell) return;
        startCell.current = cell;
        endCell.current = cell;
        setSelection({ start: cell, end: cell });
        latest.current.onSelectionStart?.();
      },

      onPanResponderMove: (event: GestureResponderEvent) => {
        const start = startCell.current;
        if (!start) return;
        const { cellSize, gridSize } = latest.current;
        const point = { x: event.nativeEvent.pageX - offset.current.x, y: event.nativeEvent.pageY - offset.current.y };
        const end = snapSelectionFromPoint(start, point, cellSize, gridSize);
        const previous = endCell.current;
        if (previous && previous.row === end.row && previous.col === end.col) return;
        endCell.current = end;
        setSelection({ start, end });
      },

      onPanResponderRelease: () => {
        const start = startCell.current;
        const end = endCell.current;
        startCell.current = null;
        endCell.current = null;
        setSelection(null);
        if (start && end) latest.current.onSelectionEnd({ start, end });
      },

      onPanResponderTerminate: () => {
        startCell.current = null;
        endCell.current = null;
        setSelection(null);
      },
    }),
  );

  return { panHandlers: responder.panHandlers, selection };
}
