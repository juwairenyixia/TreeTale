import type {
  CladeLabel,
  SupportType,
  TaxonMeta,
  TreeRecord,
  ViewSettings,
} from '../types';

export interface ProjectFile {
  format: 'treetale-project';
  version: 1;
  name: string;
  newick: string;
  metadata: Record<string, TaxonMeta>;
  cladeLabels?: CladeLabel[];
  source?: string;
  supportType?: SupportType;
  branchUnit?: string;
  method?: string;
  settings?: ViewSettings;
  search?: string;
  exportedAt: string;
}

export function buildProjectFile(
  record: TreeRecord,
  settings?: ViewSettings,
  search?: string,
): ProjectFile {
  return {
    format: 'treetale-project',
    version: 1,
    name: record.name,
    newick: record.newick,
    metadata: record.metadata,
    cladeLabels: record.cladeLabels,
    source: record.source,
    supportType: record.supportType,
    branchUnit: record.branchUnit,
    method: record.method,
    settings,
    search,
    exportedAt: new Date().toISOString(),
  };
}

function cleanMetadata(input: unknown): Record<string, TaxonMeta> {
  if (!input || typeof input !== 'object') return {};
  const output: Record<string, TaxonMeta> = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (!value || typeof value !== 'object') continue;
    const raw = value as Record<string, unknown>;
    const meta: TaxonMeta = {};
    for (const field of ['cn', 'common', 'group', 'habitat', 'note'] as const) {
      if (typeof raw[field] === 'string' && raw[field]) meta[field] = raw[field];
    }
    if (Object.keys(meta).length) output[key] = meta;
  }
  return output;
}

function cleanClades(input: unknown): CladeLabel[] | undefined {
  if (!Array.isArray(input)) return undefined;
  const output: CladeLabel[] = [];
  for (const value of input) {
    if (!value || typeof value !== 'object') continue;
    const raw = value as Record<string, unknown>;
    if (typeof raw.name !== 'string' || !Array.isArray(raw.tips)) continue;
    const tips = raw.tips.filter((tip): tip is string => typeof tip === 'string');
    if (tips.length < 2) continue;
    output.push({
      id: typeof raw.id === 'string' ? raw.id : `clade-${output.length + 1}`,
      name: raw.name,
      tips,
      description: typeof raw.description === 'string' ? raw.description : undefined,
      offsetX: typeof raw.offsetX === 'number' ? raw.offsetX : undefined,
      offsetY: typeof raw.offsetY === 'number' ? raw.offsetY : undefined,
    });
  }
  return output.length ? output : undefined;
}

function cleanSettings(input: unknown): ViewSettings | undefined {
  if (!input || typeof input !== 'object') return undefined;
  const raw = input as Record<string, unknown>;
  return {
    layout: raw.layout === 'circular' ? 'circular' : 'rectangular',
    branchMode: raw.branchMode === 'cladogram' ? 'cladogram' : 'phylogram',
    supportThreshold:
      typeof raw.supportThreshold === 'number'
        ? Math.max(0, Math.min(100, raw.supportThreshold))
        : 0,
    ladderize: raw.ladderize !== false,
    showSupport: raw.showSupport !== false,
    colorBy: raw.colorBy === 'habitat' || raw.colorBy === 'none' ? raw.colorBy : 'group',
  };
}

export function parseProjectFile(text: string): ProjectFile {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error('不是有效的 JSON 文件');
  }
  if (!raw || typeof raw !== 'object') throw new Error('项目文件内容为空');
  const value = raw as Record<string, unknown>;
  if (typeof value.newick !== 'string' || !value.newick.trim()) {
    throw new Error('项目 JSON 缺少 newick 字段');
  }
  return {
    format: 'treetale-project',
    version: 1,
    name: typeof value.name === 'string' && value.name ? value.name : '导入的项目',
    newick: value.newick,
    metadata: cleanMetadata(value.metadata),
    cladeLabels: cleanClades(value.cladeLabels),
    source: typeof value.source === 'string' ? value.source : '项目 JSON 导入',
    supportType:
      value.supportType === 'bootstrap' ||
      value.supportType === 'posterior' ||
      value.supportType === 'unknown'
        ? value.supportType
        : 'unknown',
    branchUnit: typeof value.branchUnit === 'string' ? value.branchUnit : undefined,
    method: typeof value.method === 'string' ? value.method : undefined,
    settings: cleanSettings(value.settings),
    search: typeof value.search === 'string' ? value.search : undefined,
    exportedAt: new Date().toISOString(),
  };
}
