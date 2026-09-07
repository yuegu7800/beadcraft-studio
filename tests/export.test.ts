import { describe, expect, it } from 'vitest';
import { createCsvExport, createProjectJson, createSvgExport, parseProjectJson } from '../src/canvas/export';
import { DEMO_PALETTE } from '../src/core/palette';
import type { BeadPattern } from '../src/types';

const pattern: BeadPattern = { version: 1, paletteId: DEMO_PALETTE.id, paletteName: DEMO_PALETTE.name, width: 2, height: 2, cells: ['H01', 'F01', null, 'F01'], settings: { longEdge: 2, maxColors: 2, fit: 'contain', background: 'transparent', backgroundColor: '#FFFFFF', process: 'original' }, createdAt: '2026-01-01T00:00:00.000Z' };

describe('exports', () => {
  it('creates a formula-safe materials CSV', () => { const csv = createCsvExport(pattern, DEMO_PALETTE); expect(csv).toContain('code,name,count,hex,percent'); expect(csv).toContain('F01'); expect(csv).toContain(',2,'); });
  it('creates real vector cells and labels', () => { const svg = createSvgExport(pattern, DEMO_PALETTE); expect(svg).toContain('<svg'); expect(svg).toContain('<rect'); expect(svg).toContain('F01'); });
  it('round-trips a project file', () => { const result = parseProjectJson(createProjectJson(pattern, DEMO_PALETTE)); expect(result.pattern.cells).toEqual(pattern.cells); expect(result.palette.colors.length).toBe(32); });
  it('rejects malformed projects', () => { expect(() => parseProjectJson('{"app":"other"}')).toThrow('有效'); });
});
