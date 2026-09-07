import { describe, expect, it } from 'vitest';
import { ciede2000 } from '../src/core/ciede2000';
import { rgbToLab } from '../src/core/lab';
import { createPaletteColor, parsePaletteCsv } from '../src/core/palette';
import { nearestColor } from '../src/core/quantize';

describe('color science', () => {
  it('converts RGB endpoints to expected LAB values', () => {
    expect(rgbToLab({ r: 255, g: 255, b: 255 }).l).toBeCloseTo(100, 3);
    expect(rgbToLab({ r: 0, g: 0, b: 0 }).l).toBeCloseTo(0, 3);
  });

  it('matches the published CIEDE2000 reference pair', () => {
    const distance = ciede2000(
      { l: 50, a: 2.6772, b: -79.7751 },
      { l: 50, a: 0, b: -82.7485 },
    );
    expect(distance).toBeCloseTo(2.0425, 4);
  });

  it('chooses perceptually nearest palette color', () => {
    const colors = [createPaletteColor('R', '红', '#EE3333'), createPaletteColor('B', '蓝', '#3355EE')];
    expect(nearestColor({ r: 230, g: 45, b: 50 }, colors).code).toBe('R');
  });
});

describe('palette CSV', () => {
  it('imports a valid palette', () => {
    const palette = parsePaletteCsv('code,name,hex\nX1,White,#FFFFFF\nX2,Black,#111111');
    expect(palette.colors).toHaveLength(2);
    expect(palette.colors[1]?.code).toBe('X2');
  });

  it('rejects duplicate codes', () => {
    expect(() => parsePaletteCsv('code,hex\nX,#fff\nX,#000')).toThrow('色号重复');
  });
});
