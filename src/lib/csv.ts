import type { TaxonMeta, Tree } from '../types';
import { taxonKey } from './tree';

export interface CsvResult {
  metadata: Record<string, TaxonMeta>;
  matched: number;
  unmatched: string[];
  errors: string[];
}

function parseRows(text: string): string[][] {
  const source = text.replace(/^\uFEFF/, '');
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  let index = 0;

  const pushCell = () => {
    row.push(cell);
    cell = '';
  };
  const pushRow = () => {
    pushCell();
    if (row.some((value) => value.trim() !== '')) rows.push(row);
    row = [];
  };

  while (index < source.length) {
    const char = source[index];
    if (quoted) {
      if (char === '"') {
        if (source[index + 1] === '"') {
          cell += '"';
          index += 2;
          continue;
        }
        quoted = false;
        index += 1;
        continue;
      }
      cell += char;
      index += 1;
      continue;
    }

    if (char === '"') {
      quoted = true;
      index += 1;
      continue;
    }
    if (char === ',') {
      pushCell();
      index += 1;
      continue;
    }
    if (char === '\n' || char === '\r') {
      pushRow();
      if (char === '\r' && source[index + 1] === '\n') index += 1;
      index += 1;
      continue;
    }
    cell += char;
    index += 1;
  }

  if (quoted) throw new Error('CSV 中的引号没有闭合');
  if (cell !== '' || row.length > 0) pushRow();
  return rows;
}

function escapeCell(value: string): string {
  if (/[",\r\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function stringifyCsv(rows: string[][]): string {
  return rows.map((row) => row.map(escapeCell).join(',')).join('\r\n');
}

function headerIndex(header: string[], aliases: string[]): number {
  const normalized = header.map((item) => item.trim().toLowerCase());
  for (const alias of aliases) {
    const index = normalized.indexOf(alias.toLowerCase());
    if (index >= 0) return index;
  }
  return -1;
}

export function buildAnnotationCsv(tree: Tree, metadata: Record<string, TaxonMeta>): string {
  const rows: string[][] = [['name', 'cn', 'group', 'habitat', 'note']];
  for (const leaf of tree.leaves) {
    const name = leaf.name ?? '';
    const meta = metadata[name] ?? {};
    rows.push([name, meta.cn ?? '', meta.group ?? '', meta.habitat ?? '', meta.note ?? '']);
  }
  return `\uFEFF${stringifyCsv(rows)}`;
}

export function applyAnnotationCsv(
  text: string,
  tree: Tree,
  current: Record<string, TaxonMeta>,
): CsvResult {
  const rows = parseRows(text);
  if (rows.length < 2) {
    return { metadata: current, matched: 0, unmatched: [], errors: ['CSV 没有数据行'] };
  }

  const header = rows[0];
  const nameIndex = headerIndex(header, ['name', 'taxon', 'species', '学名', '物种', '名称']);
  const cnIndex = headerIndex(header, ['cn', 'chinese', 'common_cn', '中文名', '中文名称']);
  const groupIndex = headerIndex(header, ['group', 'clade', '类群', '分类']);
  const habitatIndex = headerIndex(header, ['habitat', '生境', '环境']);
  const noteIndex = headerIndex(header, ['note', 'description', '说明', '注释']);

  if (nameIndex < 0) {
    return {
      metadata: current,
      matched: 0,
      unmatched: [],
      errors: ['缺少 name 列（也支持 taxon / 学名 / 物种）'],
    };
  }
  if (cnIndex < 0) {
    return {
      metadata: current,
      matched: 0,
      unmatched: [],
      errors: ['缺少 cn 列（也支持 中文名 / 中文名称）'],
    };
  }

  const treeKeys = new Map<string, string>();
  for (const leaf of tree.leaves) {
    if (leaf.name) treeKeys.set(taxonKey(leaf.name), leaf.name);
  }

  const metadata = { ...current };
  const unmatched: string[] = [];
  const errors: string[] = [];
  let matched = 0;

  rows.slice(1).forEach((row, rowIndex) => {
    const rawName = (row[nameIndex] ?? '').trim();
    if (!rawName) return;
    const matchedName = treeKeys.get(taxonKey(rawName));
    if (!matchedName) {
      unmatched.push(rawName);
      return;
    }

    const patch: TaxonMeta = {};
    const cn = (row[cnIndex] ?? '').trim();
    if (cn) patch.cn = cn;
    if (groupIndex >= 0) {
      const value = (row[groupIndex] ?? '').trim();
      if (value) patch.group = value;
    }
    if (habitatIndex >= 0) {
      const value = (row[habitatIndex] ?? '').trim();
      if (value) patch.habitat = value;
    }
    if (noteIndex >= 0) {
      const value = (row[noteIndex] ?? '').trim();
      if (value) patch.note = value;
    }
    if (!patch.cn) {
      errors.push(`第 ${rowIndex + 2} 行缺少中文名`);
      return;
    }
    metadata[matchedName] = { ...(metadata[matchedName] ?? {}), ...patch };
    matched += 1;
  });

  return { metadata, matched, unmatched, errors };
}
