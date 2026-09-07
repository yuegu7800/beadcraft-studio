import { readableTextColor } from '../core/color';
import type { BeadPattern, Palette } from '../types';

export interface RenderOptions {
  cellSize: number;
  showGrid: boolean;
  showCodes: boolean;
  showCoordinates: boolean;
  highlightCode: string | null;
  zoom: number;
}

export interface RenderMetrics {
  logicalWidth: number;
  logicalHeight: number;
  originX: number;
  originY: number;
  cellSize: number;
}

export const DEFAULT_RENDER_OPTIONS: RenderOptions = {
  cellSize: 22,
  showGrid: true,
  showCodes: false,
  showCoordinates: true,
  highlightCode: null,
  zoom: 1,
};

export function renderPattern(canvas: HTMLCanvasElement, pattern: BeadPattern, palette: Palette, options: RenderOptions): RenderMetrics {
  const gutter = options.showCoordinates ? 32 : 10;
  const logicalWidth = pattern.width * options.cellSize + gutter * 2;
  const logicalHeight = pattern.height * options.cellSize + gutter * 2;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(logicalWidth * dpr);
  canvas.height = Math.round(logicalHeight * dpr);
  canvas.style.width = `${Math.round(logicalWidth * options.zoom)}px`;
  canvas.style.height = `${Math.round(logicalHeight * options.zoom)}px`;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('无法创建画布');
  ctx.scale(dpr, dpr);
  ctx.fillStyle = '#F8F8F6';
  ctx.fillRect(0, 0, logicalWidth, logicalHeight);

  const colorMap = new Map(palette.colors.map((color) => [color.code, color]));
  for (let y = 0; y < pattern.height; y += 1) {
    for (let x = 0; x < pattern.width; x += 1) {
      const code = pattern.cells[y * pattern.width + x] ?? null;
      const px = gutter + x * options.cellSize;
      const py = gutter + y * options.cellSize;
      const color = code ? colorMap.get(code) : undefined;
      ctx.fillStyle = color?.hex ?? '#F8F8F6';
      ctx.fillRect(px, py, options.cellSize, options.cellSize);
      if (color) {
        const isDimmed = options.highlightCode && options.highlightCode !== code;
        if (isDimmed) {
          ctx.fillStyle = 'rgba(248,248,246,.72)';
          ctx.fillRect(px, py, options.cellSize, options.cellSize);
        } else {
          ctx.beginPath();
          ctx.arc(px + options.cellSize / 2, py + options.cellSize / 2, options.cellSize * .34, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(25,28,31,.16)';
          ctx.lineWidth = 1;
          ctx.stroke();
          if (!options.showCodes && options.cellSize >= 16) {
            ctx.beginPath();
            ctx.arc(px + options.cellSize / 2, py + options.cellSize / 2, options.cellSize * .07, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(248,248,246,.56)';
            ctx.fill();
          }
        }
      }
      if (options.showCodes && color && (!options.highlightCode || options.highlightCode === code)) {
        ctx.fillStyle = readableTextColor(color.rgb);
        ctx.font = `600 ${Math.max(7, options.cellSize * .32)}px "Segoe UI", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(code!, px + options.cellSize / 2, py + options.cellSize / 2, options.cellSize - 2);
      }
    }
  }
  if (options.showGrid) {
    ctx.strokeStyle = 'rgba(45,48,52,.22)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= pattern.width; x += 1) {
      const px = gutter + x * options.cellSize + .5;
      ctx.moveTo(px, gutter); ctx.lineTo(px, gutter + pattern.height * options.cellSize);
    }
    for (let y = 0; y <= pattern.height; y += 1) {
      const py = gutter + y * options.cellSize + .5;
      ctx.moveTo(gutter, py); ctx.lineTo(gutter + pattern.width * options.cellSize, py);
    }
    ctx.stroke();
  }
  if (options.showCoordinates) {
    ctx.fillStyle = '#666A70';
    ctx.font = '600 9px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let x = 0; x < pattern.width; x += 1) {
      if (x % 5 !== 0 && x !== pattern.width - 1) continue;
      const px = gutter + x * options.cellSize + options.cellSize / 2;
      ctx.fillText(String(x + 1), px, gutter / 2); ctx.fillText(String(x + 1), px, logicalHeight - gutter / 2);
    }
    for (let y = 0; y < pattern.height; y += 1) {
      if (y % 5 !== 0 && y !== pattern.height - 1) continue;
      const py = gutter + y * options.cellSize + options.cellSize / 2;
      ctx.fillText(String(y + 1), gutter / 2, py); ctx.fillText(String(y + 1), logicalWidth - gutter / 2, py);
    }
  }
  return { logicalWidth, logicalHeight, originX: gutter, originY: gutter, cellSize: options.cellSize };
}

export function canvasPointToCell(event: PointerEvent, canvas: HTMLCanvasElement, metrics: RenderMetrics, pattern: BeadPattern): { x: number; y: number; index: number } | null {
  const bounds = canvas.getBoundingClientRect();
  const x = Math.floor(((event.clientX - bounds.left) * metrics.logicalWidth / bounds.width - metrics.originX) / metrics.cellSize);
  const y = Math.floor(((event.clientY - bounds.top) * metrics.logicalHeight / bounds.height - metrics.originY) / metrics.cellSize);
  if (x < 0 || y < 0 || x >= pattern.width || y >= pattern.height) return null;
  return { x, y, index: y * pattern.width + x };
}
