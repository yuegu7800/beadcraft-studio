import { quantizePixels } from './quantize';
import type { BeadPattern, Palette, PatternSettings } from '../types';

export interface ColorStat {
  code: string;
  name: string;
  hex: string;
  count: number;
  percent: number;
}

export function createPattern(imageData: ImageData, palette: Palette, settings: PatternSettings): BeadPattern {
  return {
    version: 1,
    paletteId: palette.id,
    paletteName: palette.name,
    width: imageData.width,
    height: imageData.height,
    cells: quantizePixels(imageData, palette.colors, settings.maxColors),
    settings: { ...settings },
    createdAt: new Date().toISOString(),
  };
}

export function getPatternStats(pattern: BeadPattern, palette: Palette): ColorStat[] {
  const counts = new Map<string, number>();
  let total = 0;
  for (const code of pattern.cells) {
    if (!code) continue;
    counts.set(code, (counts.get(code) ?? 0) + 1);
    total += 1;
  }
  return [...counts.entries()].map(([code, count]) => {
    const color = palette.colors.find((item) => item.code === code);
    return { code, name: color?.name ?? code, hex: color?.hex ?? '#000000', count, percent: total ? count / total * 100 : 0 };
  });
}

export function countBeads(pattern: BeadPattern): number {
  return pattern.cells.reduce((total, code) => total + (code ? 1 : 0), 0);
}
