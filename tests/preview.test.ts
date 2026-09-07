import { expect, it } from 'vitest';
import { calculatePreviewPlacement } from '../src/canvas/preview';

it('preserves the bead object aspect ratio inside preview scenes', () => {
  const placement = calculatePreviewPlacement(48, 32, 420, 330);
  expect(placement.width / placement.height).toBeCloseTo(48 / 32, 6);
  expect(placement.width).toBeLessThanOrEqual(420);
  expect(placement.height).toBeLessThanOrEqual(330);
});
