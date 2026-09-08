import { describe, expect, it } from 'vitest';
import { calculateCanvasBackingScale } from '../src/canvas/renderer';

describe('canvas backing resolution', () => {
  it('keeps browser zoom and high-density screens sharp', () => {
    expect(calculateCanvasBackingScale(1000, 500, 2, 3)).toBe(4);
    expect(calculateCanvasBackingScale(1000, 500, .5, 2)).toBe(1);
  });

  it('caps large canvases at a safe backing dimension', () => {
    expect(calculateCanvasBackingScale(4000, 3000, 2, 2)).toBeCloseTo(8192 / 4000, 6);
  });
});
