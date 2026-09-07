import { ciede2000 } from './ciede2000';
import { rgbToLab } from './lab';
import type { PaletteColor, RGB } from '../types';

export function nearestColor(rgb: RGB, colors: PaletteColor[]): PaletteColor {
  if (!colors.length) throw new Error('色卡没有可用颜色');
  const lab = rgbToLab(rgb);
  let best = colors[0]!;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const color of colors) {
    const distance = ciede2000(lab, color.lab);
    if (distance < bestDistance) {
      best = color;
      bestDistance = distance;
    }
  }
  return best;
}

function pixelKey(rgb: RGB): number {
  return ((rgb.r >> 3) << 10) | ((rgb.g >> 3) << 5) | (rgb.b >> 3);
}

function mapPixels(data: Uint8ClampedArray, colors: PaletteColor[]): Array<string | null> {
  const cache = new Map<number, string>();
  const cells: Array<string | null> = [];
  for (let index = 0; index < data.length; index += 4) {
    if (data[index + 3]! < 96) {
      cells.push(null);
      continue;
    }
    const rgb = { r: data[index]!, g: data[index + 1]!, b: data[index + 2]! };
    const key = pixelKey(rgb);
    let code = cache.get(key);
    if (!code) {
      code = nearestColor(rgb, colors).code;
      cache.set(key, code);
    }
    cells.push(code);
  }
  return cells;
}

export function quantizePixels(
  imageData: ImageData,
  colors: PaletteColor[],
  maxColors: number | null,
): Array<string | null> {
  const initial = mapPixels(imageData.data, colors);
  if (!maxColors || maxColors >= colors.length) return initial;
  const counts = new Map<string, number>();
  for (const code of initial) if (code) counts.set(code, (counts.get(code) ?? 0) + 1);
  const allowedCodes = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, maxColors).map(([code]) => code);
  const subset = colors.filter((color) => allowedCodes.includes(color.code));
  return mapPixels(imageData.data, subset.length ? subset : colors);
}
