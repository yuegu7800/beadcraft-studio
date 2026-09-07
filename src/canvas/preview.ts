import type { BeadPattern, Palette } from '../types';

export type PreviewKind = 'finished' | 'keychain' | 'magnet' | 'standee';

export interface PreviewProvider {
  render(canvas: HTMLCanvasElement, pattern: BeadPattern, palette: Palette, kind: PreviewKind): void;
}

export function calculatePreviewPlacement(patternWidth: number, patternHeight: number, areaWidth: number, areaHeight: number): { width: number; height: number; x: number; y: number } {
  const scale = Math.min(areaWidth / patternWidth, areaHeight / patternHeight);
  const width = patternWidth * scale;
  const height = patternHeight * scale;
  return { width, height, x: (areaWidth - width) / 2, y: (areaHeight - height) / 2 };
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number): void {
  ctx.beginPath(); ctx.roundRect(x, y, width, height, radius); ctx.fill();
}

export class LocalPreviewProvider implements PreviewProvider {
  render(canvas: HTMLCanvasElement, pattern: BeadPattern, palette: Palette, kind: PreviewKind): void {
    canvas.width = 720; canvas.height = 540;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('无法创建产品预览');
    this.drawScene(ctx, kind, canvas.width, canvas.height);
    const area = kind === 'keychain' ? { x: 150, y: 145, w: 420, h: 300 } : { x: 150, y: 105, w: 420, h: 330 };
    const placement = calculatePreviewPlacement(pattern.width, pattern.height, area.w, area.h);
    const cellSize = Math.min(placement.width / pattern.width, placement.height / pattern.height);
    const objectWidth = cellSize * pattern.width;
    const objectHeight = cellSize * pattern.height;
    const x = area.x + (area.w - objectWidth) / 2;
    const y = area.y + (area.h - objectHeight) / 2;
    if (kind === 'keychain') this.drawKeychainHardware(ctx, x + objectWidth / 2, y);
    if (kind === 'standee') this.drawStand(ctx, x, y + objectHeight, objectWidth);
    ctx.save();
    ctx.shadowColor = 'rgba(37,39,43,.28)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 10;
    this.drawBeads(ctx, pattern, palette, x, y, cellSize);
    ctx.restore();
  }

  private drawScene(ctx: CanvasRenderingContext2D, kind: PreviewKind, width: number, height: number): void {
    if (kind === 'finished') {
      ctx.fillStyle = '#E7E9EC'; ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#F5F5F3'; roundedRect(ctx, 52, 45, width - 104, height - 90, 22);
      ctx.fillStyle = 'rgba(50,54,60,.05)'; for (let x = 70; x < width; x += 70) ctx.fillRect(x, 45, 1, height - 90);
    } else if (kind === 'keychain') {
      ctx.fillStyle = '#D9DEE4'; ctx.fillRect(0, 0, width, height);
      const glow = ctx.createRadialGradient(230, 120, 20, 230, 120, 440); glow.addColorStop(0, '#F7F8F8'); glow.addColorStop(1, '#CFD4DB'); ctx.fillStyle = glow; ctx.fillRect(0, 0, width, height);
    } else if (kind === 'magnet') {
      ctx.fillStyle = '#D8DCDE'; ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#C5C9CC'; ctx.fillRect(width - 92, 0, 4, height);
      ctx.fillStyle = '#A9ADB0'; roundedRect(ctx, width - 70, 130, 10, 210, 5);
      ctx.fillStyle = 'rgba(255,255,255,.28)'; ctx.fillRect(0, 0, width, 35);
    } else {
      ctx.fillStyle = '#E8EAEC'; ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#D1B59A'; ctx.fillRect(0, height - 102, width, 102);
      ctx.fillStyle = 'rgba(96,70,50,.1)'; ctx.fillRect(0, height - 102, width, 3);
    }
  }

  private drawKeychainHardware(ctx: CanvasRenderingContext2D, centerX: number, objectY: number): void {
    ctx.strokeStyle = '#777D83'; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(centerX, 78, 31, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = '#9CA1A6'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(centerX, 108); ctx.lineTo(centerX, objectY - 8); ctx.stroke();
    for (let y = 119; y < objectY - 2; y += 13) { ctx.beginPath(); ctx.arc(centerX, y, 7, 0, Math.PI * 2); ctx.stroke(); }
  }

  private drawStand(ctx: CanvasRenderingContext2D, x: number, bottom: number, width: number): void {
    ctx.fillStyle = '#A68062'; roundedRect(ctx, x - 22, bottom - 3, width + 44, 25, 8);
    ctx.fillStyle = '#856349'; roundedRect(ctx, x + width * .22, bottom - 14, width * .56, 18, 5);
  }

  private drawBeads(ctx: CanvasRenderingContext2D, pattern: BeadPattern, palette: Palette, x: number, y: number, cell: number): void {
    const colors = new Map(palette.colors.map((color) => [color.code, color.hex]));
    for (let row = 0; row < pattern.height; row += 1) for (let col = 0; col < pattern.width; col += 1) {
      const code = pattern.cells[row * pattern.width + col] ?? null;
      if (!code) continue;
      const cx = x + col * cell + cell / 2; const cy = y + row * cell + cell / 2;
      ctx.fillStyle = colors.get(code) ?? '#888888'; ctx.beginPath(); ctx.arc(cx, cy, cell * .48, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(35,38,42,.18)'; ctx.lineWidth = Math.max(.5, cell * .035); ctx.stroke();
      ctx.fillStyle = 'rgba(245,245,243,.62)'; ctx.beginPath(); ctx.arc(cx, cy, cell * .105, 0, Math.PI * 2); ctx.fill();
    }
  }
}

export function createPreviewGrid(pattern: BeadPattern, palette: Palette, provider = new LocalPreviewProvider()): HTMLCanvasElement {
  const canvas = document.createElement('canvas'); canvas.width = 1440; canvas.height = 1080;
  const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('无法创建预览画布');
  const kinds: PreviewKind[] = ['finished', 'keychain', 'magnet', 'standee'];
  kinds.forEach((kind, index) => { const tile = document.createElement('canvas'); provider.render(tile, pattern, palette, kind); ctx.drawImage(tile, index % 2 * 720, Math.floor(index / 2) * 540); });
  return canvas;
}
