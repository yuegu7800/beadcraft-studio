import type { Lab } from '../types';

const degrees = (radians: number) => radians * 180 / Math.PI;
const radians = (degreesValue: number) => degreesValue * Math.PI / 180;

export function ciede2000(first: Lab, second: Lab): number {
  const c1 = Math.hypot(first.a, first.b);
  const c2 = Math.hypot(second.a, second.b);
  const cMean = (c1 + c2) / 2;
  const g = .5 * (1 - Math.sqrt(cMean ** 7 / (cMean ** 7 + 25 ** 7)));
  const a1 = (1 + g) * first.a;
  const a2 = (1 + g) * second.a;
  const cp1 = Math.hypot(a1, first.b);
  const cp2 = Math.hypot(a2, second.b);
  const hue = (a: number, b: number) => {
    const angle = degrees(Math.atan2(b, a));
    return angle < 0 ? angle + 360 : angle;
  };
  const h1 = cp1 === 0 ? 0 : hue(a1, first.b);
  const h2 = cp2 === 0 ? 0 : hue(a2, second.b);
  const deltaL = second.l - first.l;
  const deltaC = cp2 - cp1;
  let deltaHue = 0;
  if (cp1 * cp2 !== 0) {
    const difference = h2 - h1;
    deltaHue = Math.abs(difference) <= 180 ? difference : difference > 180 ? difference - 360 : difference + 360;
  }
  const deltaH = 2 * Math.sqrt(cp1 * cp2) * Math.sin(radians(deltaHue / 2));
  const lightMean = (first.l + second.l) / 2;
  const chromaMean = (cp1 + cp2) / 2;
  let hueMean = h1 + h2;
  if (cp1 * cp2 !== 0) {
    hueMean = Math.abs(h1 - h2) <= 180 ? (h1 + h2) / 2 : (h1 + h2 < 360 ? (h1 + h2 + 360) / 2 : (h1 + h2 - 360) / 2);
  }
  const t = 1
    - .17 * Math.cos(radians(hueMean - 30))
    + .24 * Math.cos(radians(2 * hueMean))
    + .32 * Math.cos(radians(3 * hueMean + 6))
    - .2 * Math.cos(radians(4 * hueMean - 63));
  const sl = 1 + .015 * (lightMean - 50) ** 2 / Math.sqrt(20 + (lightMean - 50) ** 2);
  const sc = 1 + .045 * chromaMean;
  const sh = 1 + .015 * chromaMean * t;
  const rotation = 30 * Math.exp(-Math.pow((hueMean - 275) / 25, 2));
  const rc = 2 * Math.sqrt(chromaMean ** 7 / (chromaMean ** 7 + 25 ** 7));
  const rt = -rc * Math.sin(radians(2 * rotation));
  const lTerm = deltaL / sl;
  const cTerm = deltaC / sc;
  const hTerm = deltaH / sh;
  return Math.sqrt(lTerm ** 2 + cTerm ** 2 + hTerm ** 2 + rt * cTerm * hTerm);
}
