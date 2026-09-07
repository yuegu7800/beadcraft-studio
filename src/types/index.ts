export type FitMode = 'contain' | 'cover';
export type BackgroundMode = 'keep' | 'transparent' | 'white' | 'custom';
export type ProcessMode = 'original' | 'contrast' | 'soft' | 'cartoon';
export type ToolMode = 'paint' | 'erase' | 'picker';

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface RGBA extends RGB {
  a: number;
}

export interface Lab {
  l: number;
  a: number;
  b: number;
}

export interface PaletteColor {
  code: string;
  name: string;
  hex: string;
  rgb: RGB;
  lab: Lab;
}

export interface Palette {
  id: string;
  name: string;
  disclaimer: string;
  colors: PaletteColor[];
}

export interface PatternSettings {
  longEdge: number;
  maxColors: number | null;
  fit: FitMode;
  background: BackgroundMode;
  backgroundColor: string;
  process: ProcessMode;
}

export interface BeadPattern {
  version: 1;
  paletteId: string;
  paletteName: string;
  width: number;
  height: number;
  cells: Array<string | null>;
  settings: PatternSettings;
  createdAt: string;
}

export interface GridSize {
  width: number;
  height: number;
}

export interface DrawRect {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
  dx: number;
  dy: number;
  dw: number;
  dh: number;
}
