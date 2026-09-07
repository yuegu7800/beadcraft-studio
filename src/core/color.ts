import type { RGB } from '../types';

export function clampChannel(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

export function hexToRgb(hex: string): RGB {
  const clean = hex.trim().replace(/^#/, '');
  if (!/^[0-9a-f]{3}([0-9a-f]{3})?$/i.test(clean)) throw new Error(`无效颜色：${hex}`);
  const full = clean.length === 3 ? clean.split('').map((char) => char + char).join('') : clean;
  return {
    r: Number.parseInt(full.slice(0, 2), 16),
    g: Number.parseInt(full.slice(2, 4), 16),
    b: Number.parseInt(full.slice(4, 6), 16),
  };
}

export function rgbToHex(rgb: RGB): string {
  return `#${[rgb.r, rgb.g, rgb.b].map((value) => clampChannel(value).toString(16).padStart(2, '0')).join('')}`.toUpperCase();
}

export function relativeLuminance(rgb: RGB): number {
  const values = [rgb.r, rgb.g, rgb.b].map((value) => {
    const channel = value / 255;
    return channel <= .03928 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4;
  });
  return .2126 * values[0]! + .7152 * values[1]! + .0722 * values[2]!;
}

export function readableTextColor(rgb: RGB): '#25272B' | '#F7F7F8' {
  return relativeLuminance(rgb) > .43 ? '#25272B' : '#F7F7F8';
}
