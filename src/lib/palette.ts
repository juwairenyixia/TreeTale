import type { ColorMode, TaxonMeta } from '../types';

const palette = [
  '#1f6f5c',
  '#d9a441',
  '#4c7fb0',
  '#7b5ea7',
  '#d96c4b',
  '#4b8f8c',
  '#a5526d',
  '#6d8c3a',
  '#9a6b3f',
  '#577590',
];

export interface LegendItem {
  label: string;
  color: string;
  count: number;
}

export interface ColorScale {
  byTaxon: Map<string, string>;
  legend: LegendItem[];
}

export function buildColorScale(
  metadata: Record<string, TaxonMeta>,
  mode: ColorMode,
): ColorScale {
  const values = new Map<string, number>();
  const byTaxon = new Map<string, string>();

  if (mode === 'none') return { byTaxon, legend: [] };

  for (const [taxon, meta] of Object.entries(metadata)) {
    const value = mode === 'group' ? meta.group : meta.habitat;
    if (!value) continue;
    values.set(value, (values.get(value) ?? 0) + 1);
  }

  const sorted = [...values.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const colorByValue = new Map<string, string>();
  sorted.forEach(([label], index) => {
    colorByValue.set(label, palette[index % palette.length]);
  });

  for (const [taxon, meta] of Object.entries(metadata)) {
    const value = mode === 'group' ? meta.group : meta.habitat;
    if (!value) continue;
    byTaxon.set(taxon, colorByValue.get(value) ?? palette[0]);
  }

  return {
    byTaxon,
    legend: sorted.map(([label, count]) => ({
      label,
      count,
      color: colorByValue.get(label) ?? palette[0],
    })),
  };
}

export function supportColor(support: number | undefined): string {
  if (support === undefined) return 'rgba(16,35,28,.28)';
  if (support >= 90) return '#1f6f5c';
  if (support >= 75) return '#b98524';
  return '#d96c4b';
}

export function supportLabel(support: number | undefined): string {
  if (support === undefined) return '—';
  return `${Math.round(support)}`;
}

export function accentAlpha(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return hex;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
