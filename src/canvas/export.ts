import { readableTextColor } from '../core/color';
import { countBeads, getPatternStats } from '../core/pattern';
import type { BeadPattern, Palette } from '../types';

export interface ProjectFile {
  app: 'BeadCraft Studio';
  version: 1;
  pattern: BeadPattern;
  palette: Palette;
}

const xml = (value: string) => value.replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[char]!);
const csvCell = (value: string | number) => {
  let text = String(value);
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export function createCsvExport(pattern: BeadPattern, palette: Palette): string {
  const rows = getPatternStats(pattern, palette).sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
  return `\uFEFFcode,name,count,hex,percent\r\n${rows.map((row) => [row.code, row.name, row.count, row.hex, row.percent.toFixed(2)].map(csvCell).join(',')).join('\r\n')}`;
}

export function createProjectJson(pattern: BeadPattern, palette: Palette): string {
  return JSON.stringify({ app: 'BeadCraft Studio', version: 1, pattern, palette } satisfies ProjectFile, null, 2);
}

export function parseProjectJson(text: string): ProjectFile {
  const parsed = JSON.parse(text) as Partial<ProjectFile>;
  if (parsed.app !== 'BeadCraft Studio' || parsed.version !== 1 || !parsed.pattern || !parsed.palette) throw new Error('这不是有效的 BeadCraft Studio 工程文件');
  const pattern = parsed.pattern;
  if (!Number.isInteger(pattern.width) || !Number.isInteger(pattern.height) || pattern.width < 1 || pattern.height < 1 || pattern.width * pattern.height !== pattern.cells.length) throw new Error('工程文件的网格尺寸不正确');
  if (!Array.isArray(parsed.palette.colors) || !parsed.palette.colors.length) throw new Error('工程文件缺少色卡');
  const codes = new Set(parsed.palette.colors.map((color) => color.code));
  if (pattern.cells.some((code) => code !== null && !codes.has(code))) throw new Error('工程文件包含色卡中不存在的色号');
  return parsed as ProjectFile;
}

export function createSvgExport(pattern: BeadPattern, palette: Palette): string {
  const cell = 24;
  const gutter = 36;
  const stats = getPatternStats(pattern, palette).sort((a, b) => b.count - a.count);
  const legendColumns = Math.min(5, Math.max(1, stats.length));
  const legendRows = Math.ceil(stats.length / legendColumns);
  const boardWidth = pattern.width * cell;
  const boardHeight = pattern.height * cell;
  const width = Math.max(boardWidth + gutter * 2, 760);
  const boardX = (width - boardWidth) / 2;
  const legendHeight = 76 + legendRows * 32;
  const height = boardHeight + gutter * 2 + legendHeight;
  const colorMap = new Map(palette.colors.map((color) => [color.code, color]));
  const cells: string[] = [];
  for (let y = 0; y < pattern.height; y += 1) {
    for (let x = 0; x < pattern.width; x += 1) {
      const code = pattern.cells[y * pattern.width + x] ?? null;
      const color = code ? colorMap.get(code) : undefined;
      const px = boardX + x * cell;
      const py = gutter + y * cell;
      cells.push(`<rect x="${px}" y="${py}" width="${cell}" height="${cell}" fill="${color?.hex ?? '#F8F8F6'}" stroke="#B9BDC2" stroke-width="0.6"/>`);
      if (color) {
        cells.push(`<circle cx="${px + cell / 2}" cy="${py + cell / 2}" r="${cell * .34}" fill="none" stroke="#25272B" stroke-opacity=".16"/>`);
        cells.push(`<text x="${px + cell / 2}" y="${py + cell / 2 + 3}" fill="${readableTextColor(color.rgb)}" text-anchor="middle" font-family="Arial,sans-serif" font-size="7" font-weight="700">${xml(code!)}</text>`);
      }
    }
  }
  const coordinates: string[] = [];
  for (let x = 0; x < pattern.width; x += 5) coordinates.push(`<text x="${boardX + x * cell + cell / 2}" y="22" text-anchor="middle">${x + 1}</text>`);
  for (let y = 0; y < pattern.height; y += 5) coordinates.push(`<text x="${boardX - 15}" y="${gutter + y * cell + cell / 2 + 3}" text-anchor="middle">${y + 1}</text>`);
  const legendTop = gutter + boardHeight + 42;
  const colWidth = width / legendColumns;
  const legend = stats.map((stat, index) => {
    const x = index % legendColumns * colWidth + 24;
    const y = legendTop + Math.floor(index / legendColumns) * 32;
    return `<g><rect x="${x}" y="${y}" width="18" height="18" rx="4" fill="${stat.hex}" stroke="#25272B" stroke-opacity=".18"/><text x="${x + 27}" y="${y + 13}" font-size="11"><tspan font-weight="700">${xml(stat.code)}</tspan><tspan dx="6">${stat.count} 颗</tspan></text></g>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#F8F8F6"/><g fill="#62666D" font-family="Arial,sans-serif" font-size="9">${coordinates.join('')}</g>${cells.join('')}<text x="24" y="${legendTop - 17}" fill="#25272B" font-family="Arial,sans-serif" font-size="15" font-weight="700">BeadCraft Studio 拼豆图纸</text><text x="${width - 24}" y="${legendTop - 17}" fill="#62666D" text-anchor="end" font-family="Arial,sans-serif" font-size="10">${pattern.width} × ${pattern.height} | ${countBeads(pattern)} 颗 | ${stats.length} 色</text><g fill="#25272B" font-family="Arial,sans-serif">${legend}</g></svg>`;
}

export function createPngExport(pattern: BeadPattern, palette: Palette): HTMLCanvasElement {
  const cell = 30;
  const gutter = 46;
  const stats = getPatternStats(pattern, palette).sort((a, b) => b.count - a.count);
  const columns = Math.min(4, Math.max(1, stats.length));
  const legendRows = Math.ceil(stats.length / columns);
  const boardWidth = pattern.width * cell;
  const width = Math.max(boardWidth + gutter * 2, 900);
  const boardX = (width - boardWidth) / 2;
  const boardHeight = pattern.height * cell;
  const legendTop = gutter + boardHeight + 54;
  const height = legendTop + legendRows * 38 + 52;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('无法创建导出画布');
  ctx.fillStyle = '#F8F8F6'; ctx.fillRect(0, 0, width, height);
  const colorMap = new Map(palette.colors.map((color) => [color.code, color]));
  for (let y = 0; y < pattern.height; y += 1) for (let x = 0; x < pattern.width; x += 1) {
    const code = pattern.cells[y * pattern.width + x] ?? null;
    const color = code ? colorMap.get(code) : undefined;
    const px = boardX + x * cell; const py = gutter + y * cell;
    ctx.fillStyle = color?.hex ?? '#F8F8F6'; ctx.fillRect(px, py, cell, cell);
    ctx.strokeStyle = '#B9BDC2'; ctx.lineWidth = .7; ctx.strokeRect(px, py, cell, cell);
    if (color) { ctx.fillStyle = readableTextColor(color.rgb); ctx.font = '700 9px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(code!, px + cell / 2, py + cell / 2, cell - 2); }
  }
  ctx.fillStyle = '#62666D'; ctx.font = '600 10px Arial'; ctx.textAlign = 'center';
  for (let x = 0; x < pattern.width; x += 5) ctx.fillText(String(x + 1), boardX + x * cell + cell / 2, 25);
  for (let y = 0; y < pattern.height; y += 5) ctx.fillText(String(y + 1), boardX - 20, gutter + y * cell + cell / 2);
  ctx.fillStyle = '#25272B'; ctx.textAlign = 'left'; ctx.font = '700 19px Arial'; ctx.fillText('BeadCraft Studio 拼豆图纸', 28, legendTop - 21);
  ctx.fillStyle = '#62666D'; ctx.textAlign = 'right'; ctx.font = '12px Arial'; ctx.fillText(`${pattern.width} × ${pattern.height}  |  ${countBeads(pattern)} 颗  |  ${stats.length} 色`, width - 28, legendTop - 21);
  const colWidth = width / columns;
  stats.forEach((stat, index) => { const x = index % columns * colWidth + 28; const y = legendTop + Math.floor(index / columns) * 38; ctx.fillStyle = stat.hex; ctx.fillRect(x, y, 22, 22); ctx.strokeStyle = 'rgba(37,39,43,.2)'; ctx.strokeRect(x, y, 22, 22); ctx.fillStyle = '#25272B'; ctx.textAlign = 'left'; ctx.font = '700 12px Arial'; ctx.fillText(stat.code, x + 32, y + 9); ctx.font = '11px Arial'; ctx.fillStyle = '#62666D'; ctx.fillText(`${stat.count} 颗`, x + 32, y + 23); });
  return canvas;
}
