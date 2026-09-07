import { describe, expect, it } from 'vitest';
import { applyProcess, hexToRgba } from '../src/core/image';
import { calculateDrawRect, calculateGridSize, clampLongEdge } from '../src/core/resize';

describe('image sizing', () => {
  it('preserves a landscape aspect ratio', () => {
    expect(calculateGridSize(1600, 900, 48)).toEqual({ width: 48, height: 27 });
  });

  it('preserves a portrait aspect ratio', () => {
    expect(calculateGridSize(900, 1600, 64)).toEqual({ width: 36, height: 64 });
  });

  it('clamps unsafe grid sizes', () => {
    expect(clampLongEdge(2)).toBe(8);
    expect(clampLongEdge(500)).toBe(160);
  });

  it('contains without cropping', () => {
    expect(calculateDrawRect(200, 100, 100, 100, 'contain')).toEqual({ sx: 0, sy: 0, sw: 200, sh: 100, dx: 0, dy: 25, dw: 100, dh: 50 });
  });

  it('covers with a centered crop', () => {
    expect(calculateDrawRect(200, 100, 100, 100, 'cover')).toEqual({ sx: 50, sy: 0, sw: 100, sh: 100, dx: 0, dy: 0, dw: 100, dh: 100 });
  });
});

describe('pixel processing', () => {
  it('parses short colors and posterizes', () => {
    expect(hexToRgba('#f06')).toEqual({ r: 255, g: 0, b: 102, a: 255 });
    const pixel = applyProcess({ r: 140, g: 90, b: 200, a: 255 }, 'cartoon');
    expect(pixel.a).toBe(255);
    expect(pixel.r % 42.5).toBe(0);
  });
});
