import { useLayoutEffect, useRef, useState } from 'react';
import { PanResponder, type GestureResponderEvent, type PanResponderInstance } from 'react-native';

import type { Cell } from '../../puzzle/engine/types';
import { getCellFromTouchPoint } from '../../puzzle/game/selection';
import { extendPath, getCellNearCenter } from '../game/pathSelection';

type Options = {
  rows: number;
  cols: number;
  pitch: number;
  tile: number;
  enabled: boolean;
  /** Cells that can't be selected (already part of a found word). */
  isBlocked: (cell: Cell) => boolean;
  onSelectionStart?: () => void;
  onSelectionEnd: (path: Cell[]) => void;
  /** Called instead of `onSelectionEnd` when the finger lifts without leaving the first cell. */
  onTap?: (cell: Cell) => void;
};

/**
 * Turns a drag into a winding path of orthogonally adjacent cells. Pure path
 * rules live in `extendPath`; this hook only maps touches to cells. State
 * updates only when the path actually changes.
 */
export function useChainSelection(options: Options): {
  panHandlers: PanResponderInstance['panHandlers'];
  path: Cell[];
} {
  const [path, setPath] = useState<Cell[]>([]);
  const latest = useRef(options);
  useLayoutEffect(() => {
    latest.current = options;
  });
  const current = useRef<Cell[]>([]);
  const moved = useRef(false);
  const offset = useRef({ x: 0, y: 0 });

  const update = (next: Cell[]) => {
    if (next === current.current) return;
    current.current = next;
    setPath(next);
  };

  // Handlers read refs only at gesture time, never during render.
  // eslint-disable-next-line react-hooks/refs
  const [responder] = useState(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => latest.current.enabled,
      onMoveShouldSetPanResponder: () => latest.current.enabled,
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,

      onPanResponderGrant: (event: GestureResponderEvent) => {
        const { locationX, locationY, pageX, pageY } = event.nativeEvent;
        const { pitch, rows, cols, isBlocked } = latest.current;
        offset.current = { x: pageX - locationX, y: pageY - locationY };
        const cell = getCellFromTouchPoint({ x: locationX, y: locationY }, pitch, Math.max(rows, cols), { clamp: true });
        if (!cell || cell.row >= rows || cell.col >= cols) return;
        moved.current = false;
        update(extendPath([], cell, isBlocked));
        latest.current.onSelectionStart?.();
      },

      onPanResponderMove: (event: GestureResponderEvent) => {
        if (current.current.length === 0) return;
        const { pitch, tile, rows, cols, isBlocked } = latest.current;
        const point = { x: event.nativeEvent.pageX - offset.current.x, y: event.nativeEvent.pageY - offset.current.y };
        const cell = getCellNearCenter(point, pitch, tile, rows, cols);
        if (!cell) return;
        const next = extendPath(current.current, cell, isBlocked);
        if (next.length > 1) moved.current = true;
        update(next);
      },

      onPanResponderRelease: () => {
        const done = current.current;
        update([]);
        if (done.length === 0) return;
        if (!moved.current && done.length === 1 && latest.current.onTap) latest.current.onTap(done[0]);
        else latest.current.onSelectionEnd(done);
      },

      onPanResponderTerminate: () => update([]),
    }),
  );

  return { panHandlers: responder.panHandlers, path };
}
