import { useWindowDimensions } from 'react-native';

type Options = {
  /** Total horizontal padding around the grid. */
  horizontalPadding?: number;
  /** Max share of the window height the grid may take. */
  maxHeightRatio?: number;
  /** Cap for tablets/web so cells don't become huge. */
  maxGridWidth?: number;
};

/**
 * Cell size that makes a `gridSize`×`gridSize` grid fit the screen width
 * (and a share of its height), rounded down to whole pixels.
 */
export function useCellSize(gridSize: number, options: Options = {}): number {
  const { width, height } = useWindowDimensions();
  const { horizontalPadding = 24, maxHeightRatio = 0.56, maxGridWidth = 560 } = options;
  const available = Math.min(width - horizontalPadding, height * maxHeightRatio, maxGridWidth);
  return Math.max(16, Math.floor(available / gridSize));
}
