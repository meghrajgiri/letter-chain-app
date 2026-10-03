import type { ChainPlacement } from '../../engine/types';
import { extendPath, getCellNearCenter, matchChainPath } from '../pathSelection';

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
