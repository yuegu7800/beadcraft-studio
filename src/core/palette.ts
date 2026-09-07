import { hexToRgb, rgbToHex } from './color';
import { rgbToLab } from './lab';
import type { Palette, PaletteColor } from '../types';

const DEMO_SWATCHES: Array<[string, string, string]> = [
  ['H01', '亮白', '#F4F2EC'], ['H02', '浅灰', '#D3D5D4'], ['H03', '中灰', '#909597'], ['H04', '炭黑', '#27292A'],
  ['A01', '柠檬黄', '#F3D54E'], ['A02', '向日葵', '#EAB42F'], ['A03', '杏橙', '#EF9845'], ['A04', '南瓜橙', '#D96A32'],
  ['B01', '嫩芽绿', '#A5C95F'], ['B02', '草绿', '#61A85B'], ['B03', '松针绿', '#357463'], ['B04', '深墨绿', '#294A43'],
  ['C01', '冰蓝', '#A7D8DB'], ['C02', '湖蓝', '#55B4C7'], ['C03', '晴空蓝', '#4C8EC9'], ['C04', '深海蓝', '#365A91'],
  ['D01', '雾紫', '#B8A5CE'], ['D02', '葡萄紫', '#8665A8'], ['D03', '蓝紫', '#625487'], ['D04', '深紫', '#493D61'],
  ['E01', '贝壳粉', '#F2C4C5'], ['E02', '樱花粉', '#E99AAE'], ['E03', '莓果粉', '#CE6688'], ['E04', '梅红', '#98455E'],
  ['F01', '珊瑚红', '#E76B61'], ['F02', '正红', '#CB4545'], ['F03', '砖红', '#994A42'], ['F04', '酒红', '#6F3841'],
  ['G01', '奶油色', '#EADBB9'], ['G02', '浅肤色', '#DDBA91'], ['G03', '焦糖棕', '#A6754F'], ['G04', '深咖棕', '#60483D'],
];

export function createPaletteColor(code: string, name: string, hex: string): PaletteColor {
  const rgb = hexToRgb(hex);
  return { code: code.trim(), name: name.trim() || code.trim(), hex: rgbToHex(rgb), rgb, lab: rgbToLab(rgb) };
}

export const DEMO_PALETTE: Palette = {
  id: 'mard-compatible-demo-32',
  name: 'MARD 兼容 DEMO 32 色',
  disclaimer: '非官方 MARD 色卡，仅用于功能演示。购买前请以品牌实体色卡校准。',
  colors: DEMO_SWATCHES.map(([code, name, hex]) => createPaletteColor(code, name, hex)),
};

export function parsePaletteCsv(text: string, name = '自定义色卡'): Palette {
  const rows = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((row) => row.trim());
  if (rows.length < 2) throw new Error('色卡 CSV 至少需要表头和一种颜色');
  const headers = rows[0]!.split(',').map((value) => value.trim().toLowerCase());
  const codeIndex = headers.indexOf('code');
  const hexIndex = headers.indexOf('hex');
  const nameIndex = headers.indexOf('name');
  if (codeIndex < 0 || hexIndex < 0) throw new Error('色卡 CSV 需要 code 和 hex 列');
  const seen = new Set<string>();
  const colors = rows.slice(1).map((row, index) => {
    const values = row.split(',').map((value) => value.trim());
    const code = values[codeIndex];
    const hex = values[hexIndex];
    if (!code || !hex) throw new Error(`色卡第 ${index + 2} 行缺少 code 或 hex`);
    if (seen.has(code)) throw new Error(`色号重复：${code}`);
    seen.add(code);
    return createPaletteColor(code, nameIndex >= 0 ? values[nameIndex] ?? code : code, hex);
  });
  return { id: `custom-${Date.now()}`, name, disclaimer: '用户导入色卡，请自行确认颜色准确性与使用授权。', colors };
}
