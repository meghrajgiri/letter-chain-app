import type { ChainPlacement } from '../../engine/types';
import { extendPath, getCellNearCenter, matchChainPath, resolveChainTap } from '../pathSelection';

const free = () => false;
const c = (row: number, col: number) => ({ row, col });

describe('extendPath', () => {
  it('starts, extends orthogonally and ignores diagonals', () => {
    let p = extendPath([], c(0, 0), free);
    p = extendPath(p, c(0, 1), free);
    expect(p).toEqual([c(0, 0), c(0, 1)]);
    expect(extendPath(p, c(1, 2), free)).toEqual(p); // diagonal
  });

  it('steps back when returning to the previous cell', () => {
    const p = [c(0, 0), c(0, 1), c(1, 1)];
    expect(extendPath(p, c(0, 1), free)).toEqual([c(0, 0), c(0, 1)]);
  });

  it('truncates when returning to an earlier cell', () => {
    const p = [c(0, 0), c(0, 1), c(1, 1), c(1, 0)];
    expect(extendPath(p, c(0, 0), free)).toEqual([c(0, 0)]);
  });

  it('fills a straight run on fast drags', () => {
    expect(extendPath([c(2, 0)], c(2, 3), free)).toEqual([c(2, 0), c(2, 1), c(2, 2), c(2, 3)]);
  });

  it('refuses blocked (already found) cells', () => {
    const blocked = (cell: { row: number; col: number }) => cell.row === 0 && cell.col === 1;
    expect(extendPath([c(0, 0)], c(0, 1), blocked)).toEqual([c(0, 0)]);
    expect(extendPath([], c(0, 1), blocked)).toEqual([]);
    expect(extendPath([c(0, 0)], c(0, 2), blocked)).toEqual([c(0, 0)]);
  });
});

describe('getCellNearCenter', () => {
  it('only registers near the tile centre', () => {
    // pitch 50, tile 44 → centre of (0,0) at 22,22
    expect(getCellNearCenter({ x: 22, y: 22 }, 50, 44, 6, 6)).toEqual(c(0, 0));
    expect(getCellNearCenter({ x: 47, y: 47 }, 50, 44, 6, 6)).toBeNull(); // corner/gap
    expect(getCellNearCenter({ x: 400, y: 10 }, 50, 44, 6, 6)).toBeNull(); // outside
  });
});

describe('matchChainPath', () => {
  const grid = ['CAT', 'DOG', 'EMU'].map((r) => r.split(''));
  const placements: ChainPlacement[] = [
    { word: 'CAT', cells: [c(0, 0), c(0, 1), c(0, 2)] },
    { word: 'DOG', cells: [c(1, 0), c(1, 1), c(1, 2)] },
    { word: 'EMU', cells: [c(2, 0), c(2, 1), c(2, 2)] },
  ];

  it('accepts the solution path forwards and backwards', () => {
    expect(matchChainPath(placements[0].cells, grid, placements, new Set())).toEqual({ type: 'found', word: 'CAT' });
    expect(matchChainPath([...placements[1].cells].reverse(), grid, placements, new Set())).toEqual({ type: 'found', word: 'DOG' });
  });

  it('reports already-found words', () => {
    expect(matchChainPath(placements[0].cells, grid, placements, new Set(['CAT']))).toEqual({ type: 'already-found', word: 'CAT' });
  });

  it('reports the right word on the wrong path', () => {
    const g = ['CAT', 'ATX', 'XXX'].map((r) => r.split(''));
    const pl: ChainPlacement[] = [{ word: 'CAT', cells: [c(0, 0), c(0, 1), c(0, 2)] }];
    expect(matchChainPath([c(0, 0), c(1, 0), c(1, 1)], g, pl, new Set())).toEqual({ type: 'wrong-path', word: 'CAT' });
  });

  it('misses non-words', () => {
    expect(matchChainPath([c(0, 0), c(1, 0)], grid, placements, new Set())).toEqual({ type: 'miss' });
  });
});

describe('resolveChainTap', () => {
  // C A T
  // D O G
  // E M U   words: CAT (row 0), DOG (row 1), EMU (row 2), plus a decoy route for COD.
  const grid = ['CAT', 'DOG', 'EMU'].map((r) => r.split(''));
  const row = (r: number) => [c(r, 0), c(r, 1), c(r, 2)];
  const placements: ChainPlacement[] = [
    { word: 'CAT', cells: row(0) },
    { word: 'DOG', cells: row(1) },
    { word: 'EMU', cells: row(2) },
  ] as ChainPlacement[];
  const tap = (path: { row: number; col: number }[], cell: { row: number; col: number }, found = new Set<string>(), blocked: (cell: { row: number; col: number }) => boolean = free) =>
    resolveChainTap(path, cell, blocked, grid, placements, found);

  it('starts, extends with neighbours and starts over on a far tap', () => {
    expect(tap([], c(0, 0))).toEqual({ type: 'path', path: [c(0, 0)] });
    expect(tap([c(0, 0)], c(1, 0))).toEqual({ type: 'path', path: [c(0, 0), c(1, 0)] });
    expect(tap([c(0, 0)], c(2, 2))).toEqual({ type: 'path', path: [c(2, 2)] });
    expect(tap([c(0, 0)], c(1, 1))).toEqual({ type: 'path', path: [c(1, 1)] }); // diagonal starts over
  });

  it('undoes the last cell and truncates to an earlier one', () => {
    expect(tap([c(0, 0), c(1, 0)], c(1, 0))).toEqual({ type: 'path', path: [c(0, 0)] });
    expect(tap([c(0, 0), c(1, 0), c(1, 1)], c(0, 0))).toEqual({ type: 'path', path: [c(0, 0)] });
  });

  it('ignores found cells', () => {
    const blocked = (cell: { row: number; col: number }) => cell.row === 0;
    expect(tap([c(1, 0)], c(0, 0), new Set(['CAT']), blocked)).toEqual({ type: 'path', path: [c(1, 0)] });
  });

  it('submits as soon as the path covers a word, in either direction', () => {
    expect(tap([c(0, 0), c(0, 1)], c(0, 2))).toEqual({ type: 'submit', path: row(0), match: { type: 'found', word: 'CAT' } });
    expect(tap([c(1, 2), c(1, 1)], c(1, 0))).toEqual({
      type: 'submit',
      path: [c(1, 2), c(1, 1), c(1, 0)],
      match: { type: 'found', word: 'DOG' },
    });
  });

  it('reports a word on the wrong route unless it could still grow into a longer word', () => {
    const cods: ChainPlacement[] = [
      { word: 'COD', cells: [c(2, 0), c(2, 1), c(2, 2)] },
      { word: 'CODA', cells: [c(0, 0), c(0, 1), c(0, 2), c(1, 2)] },
    ] as ChainPlacement[];
    const g = ['COD', 'XXA', 'COD'].map((r) => r.split(''));
    // C-O-D on row 0 spells COD on the wrong route, but CODA is still possible → keep going.
    expect(resolveChainTap([c(0, 0), c(0, 1)], c(0, 2), free, g, cods, new Set())).toEqual({ type: 'path', path: row(0) });
    // Once CODA is found there's nothing to grow into → wrong-path feedback.
    expect(resolveChainTap([c(0, 0), c(0, 1)], c(0, 2), free, g, cods, new Set(['CODA']))).toEqual({
      type: 'submit',
      path: row(0),
      match: { type: 'wrong-path', word: 'COD' },
    });
  });
});
