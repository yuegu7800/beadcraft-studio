import type { DrawRect, FitMode, GridSize } from '../types';

export function clampLongEdge(value: number): number {
  return Math.max(8, Math.min(160, Math.round(value)));
}

export function calculateGridSize(
  sourceWidth: number,
  sourceHeight: number,
  requestedLongEdge: number,
): GridSize {
  if (sourceWidth <= 0 || sourceHeight <= 0) throw new Error('图片尺寸无效');
  const longEdge = clampLongEdge(requestedLongEdge);
  if (sourceWidth >= sourceHeight) {
    return { width: longEdge, height: Math.max(1, Math.round(longEdge * sourceHeight / sourceWidth)) };
  }
  return { width: Math.max(1, Math.round(longEdge * sourceWidth / sourceHeight)), height: longEdge };
}

export function calculateDrawRect(
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number,
  fit: FitMode,
): DrawRect {
  const sourceRatio = sourceWidth / sourceHeight;
  const targetRatio = targetWidth / targetHeight;

  if (fit === 'cover') {
    if (sourceRatio > targetRatio) {
      const sw = sourceHeight * targetRatio;
      return { sx: (sourceWidth - sw) / 2, sy: 0, sw, sh: sourceHeight, dx: 0, dy: 0, dw: targetWidth, dh: targetHeight };
    }
    const sh = sourceWidth / targetRatio;
    return { sx: 0, sy: (sourceHeight - sh) / 2, sw: sourceWidth, sh, dx: 0, dy: 0, dw: targetWidth, dh: targetHeight };
  }

  if (sourceRatio > targetRatio) {
    const dh = targetWidth / sourceRatio;
    return { sx: 0, sy: 0, sw: sourceWidth, sh: sourceHeight, dx: 0, dy: (targetHeight - dh) / 2, dw: targetWidth, dh };
  }
  const dw = targetHeight * sourceRatio;
  return { sx: 0, sy: 0, sw: sourceWidth, sh: sourceHeight, dx: (targetWidth - dw) / 2, dy: 0, dw, dh: targetHeight };
}
