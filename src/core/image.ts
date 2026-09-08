import { calculateDrawRect } from './resize';
import type { BackgroundMode, FitMode, ProcessMode, RGBA } from '../types';

export interface DecodedImage {
  source: CanvasImageSource;
  width: number;
  height: number;
  dispose: () => void;
}

export async function decodeImageFile(file: File): Promise<DecodedImage> {
  if (!file.type.startsWith('image/')) throw new Error('请选择 PNG、JPG 或 WebP 图片');
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    return { source: bitmap, width: bitmap.width, height: bitmap.height, dispose: () => bitmap.close() };
  } catch {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.decoding = 'async';
    image.src = url;
    await image.decode();
    return { source: image, width: image.naturalWidth, height: image.naturalHeight, dispose: () => URL.revokeObjectURL(url) };
  }
}

export function hexToRgba(hex: string): RGBA {
  const clean = hex.replace('#', '');
  const expanded = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean.padEnd(6, '0').slice(0, 6);
  return {
    r: Number.parseInt(expanded.slice(0, 2), 16),
    g: Number.parseInt(expanded.slice(2, 4), 16),
    b: Number.parseInt(expanded.slice(4, 6), 16),
    a: 255,
  };
}

export function applyProcess(pixel: RGBA, mode: ProcessMode): RGBA {
  if (mode === 'original') return pixel;
  if (mode === 'soft') {
    return { ...pixel, r: pixel.r * .86 + 24, g: pixel.g * .86 + 24, b: pixel.b * .86 + 24 };
  }
  const amount = mode === 'sharp' ? 1.08 : mode === 'contrast' ? 1.2 : 1.45;
  const channel = (value: number) => Math.max(0, Math.min(255, (value - 128) * amount + 128));
  const adjusted = { ...pixel, r: channel(pixel.r), g: channel(pixel.g), b: channel(pixel.b) };
  if (mode !== 'cartoon') return adjusted;
  const posterize = (value: number) => Math.round(value / 42.5) * 42.5;
  return { ...adjusted, r: posterize(adjusted.r), g: posterize(adjusted.g), b: posterize(adjusted.b) };
}

export function sharpenRgbaPixels(source: Uint8ClampedArray, width: number, height: number, amount = .28): Uint8ClampedArray {
  const output = new Uint8ClampedArray(source);
  if (width < 2 || height < 2 || amount <= 0) return output;

  const indexAt = (x: number, y: number) => (Math.max(0, Math.min(height - 1, y)) * width + Math.max(0, Math.min(width - 1, x))) * 4;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const center = indexAt(x, y);
      if (source[center + 3]! < 8) continue;
      const neighbors = [indexAt(x - 1, y), indexAt(x + 1, y), indexAt(x, y - 1), indexAt(x, y + 1)];
      for (let channel = 0; channel < 3; channel += 1) {
        const centerValue = source[center + channel]!;
        const neighborSum = neighbors.reduce((sum, index) => sum + (source[index + 3]! < 8 ? centerValue : source[index + channel]!), 0);
        output[center + channel] = Math.round(centerValue * (1 + amount * 4) - neighborSum * amount);
      }
    }
  }
  return output;
}

export function rasterizeImage(
  decoded: DecodedImage,
  width: number,
  height: number,
  fit: FitMode,
  background: BackgroundMode,
  backgroundColor: string,
  process: ProcessMode,
): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('当前浏览器不支持 Canvas');

  if (background === 'white' || background === 'custom') {
    ctx.fillStyle = background === 'white' ? '#ffffff' : backgroundColor;
    ctx.fillRect(0, 0, width, height);
  } else {
    ctx.clearRect(0, 0, width, height);
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  const rect = calculateDrawRect(decoded.width, decoded.height, width, height, fit);
  ctx.drawImage(decoded.source, rect.sx, rect.sy, rect.sw, rect.sh, rect.dx, rect.dy, rect.dw, rect.dh);
  const data = ctx.getImageData(0, 0, width, height);
  for (let i = 0; i < data.data.length; i += 4) {
    const next = applyProcess({ r: data.data[i]!, g: data.data[i + 1]!, b: data.data[i + 2]!, a: data.data[i + 3]! }, process);
    data.data[i] = next.r;
    data.data[i + 1] = next.g;
    data.data[i + 2] = next.b;
    if (background === 'transparent' && next.a < 245) data.data[i + 3] = 0;
  }
  if (process === 'sharp') data.data.set(sharpenRgbaPixels(data.data, width, height));
  return data;
}
