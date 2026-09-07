import type { Lab, RGB } from '../types';

export function rgbToLab(rgb: RGB): Lab {
  const linear = (value: number) => {
    const channel = value / 255;
    return channel > .04045 ? ((channel + .055) / 1.055) ** 2.4 : channel / 12.92;
  };
  const r = linear(rgb.r);
  const g = linear(rgb.g);
  const b = linear(rgb.b);
  const x = (r * .4124564 + g * .3575761 + b * .1804375) / .95047;
  const y = (r * .2126729 + g * .7151522 + b * .072175) / 1;
  const z = (r * .0193339 + g * .119192 + b * .9503041) / 1.08883;
  const transform = (value: number) => value > .008856 ? Math.cbrt(value) : 7.787 * value + 16 / 116;
  const fx = transform(x);
  const fy = transform(y);
  const fz = transform(z);
  return { l: 116 * fy - 16, a: 500 * (fx - fy), b: 200 * (fy - fz) };
}
