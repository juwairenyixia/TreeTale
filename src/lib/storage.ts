import type { CladeLabel, SupportType, TaxonMeta, TreeRecord, ViewSettings } from '../types';
import { parseNewick } from './newick';

const DB_NAME = 'treetale';
const DB_VERSION = 1;
const STORE = 'workspace';
const KEY = 'current';
const FALLBACK_KEY = 'treetale-workspace-v1';
const SETTINGS_KEY = 'treetale-view-settings-v1';

export interface StoredTree {
  id: string;
  name: string;
  subtitle: string;
  newick: string;
  metadata: Record<string, TaxonMeta>;
  cladeLabels?: CladeLabel[];
  source: string;
  accent: string;
  compareWith?: string;
  supportType?: SupportType;
  branchUnit?: string;
  method?: string;
  importedAt?: string;
}

export interface WorkspaceSnapshot {
  version: 1;
  customRecords: StoredTree[];
  metadataOverrides: Record<string, Record<string, TaxonMeta>>;
  provenanceOverrides?: Record<
    string,
    {
      supportType?: SupportType;
      branchUnit?: string;
      method?: string;
    }
  >;
  activeId?: string;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) {
        request.result.createObjectStore(STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB open failed'));
  });
}

function readFallback(): WorkspaceSnapshot | null {
  try {
    const raw = localStorage.getItem(FALLBACK_KEY);
    return raw ? (JSON.parse(raw) as WorkspaceSnapshot) : null;
  } catch {
    return null;
  }
}

function writeFallback(snapshot: WorkspaceSnapshot): void {
  try {
    localStorage.setItem(FALLBACK_KEY, JSON.stringify(snapshot));
  } catch {
    // Ignore quota/storage errors; the session still works in memory.
  }
}

export async function loadWorkspace(): Promise<WorkspaceSnapshot | null> {
  try {
    const db = await openDatabase();
    const result = await new Promise<WorkspaceSnapshot | null>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const request = tx.objectStore(STORE).get(KEY);
      request.onsuccess = () => resolve((request.result as WorkspaceSnapshot | undefined) ?? null);
      request.onerror = () => reject(request.error);
      tx.oncomplete = () => db.close();
    });
    return result ?? readFallback();
  } catch {
    return readFallback();
  }
}

export async function saveWorkspace(snapshot: WorkspaceSnapshot): Promise<void> {
  writeFallback(snapshot);
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(snapshot, KEY);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // localStorage fallback already written.
  }
}

export function recordToStored(record: TreeRecord): StoredTree {
  return {
    id: record.id,
    name: record.name,
    subtitle: record.subtitle,
    newick: record.newick,
    metadata: record.metadata,
    cladeLabels: record.cladeLabels,
    source: record.source,
    accent: record.accent,
    compareWith: record.compareWith,
    supportType: record.supportType,
    branchUnit: record.branchUnit,
    method: record.method,
    importedAt: record.importedAt,
  };
}

export function storedToRecord(stored: StoredTree): TreeRecord | null {
  try {
    const tree = parseNewick(stored.newick, { id: stored.id, name: stored.name });
    return {
      ...stored,
      tree,
      custom: true,
    };
  } catch {
    return null;
  }
}

export function loadViewSettings(): ViewSettings | null {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ViewSettings>;
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      layout: parsed.layout === 'circular' ? 'circular' : 'rectangular',
      branchMode: parsed.branchMode === 'cladogram' ? 'cladogram' : 'phylogram',
      supportThreshold:
        typeof parsed.supportThreshold === 'number'
          ? Math.max(0, Math.min(100, parsed.supportThreshold))
          : 0,
      ladderize: parsed.ladderize !== false,
      showSupport: parsed.showSupport !== false,
      colorBy:
        parsed.colorBy === 'habitat' || parsed.colorBy === 'none' ? parsed.colorBy : 'group',
    };
  } catch {
    return null;
  }
}

export function saveViewSettings(settings: ViewSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage errors.
  }
}

export function loadLastTreeId(): string | null {
  try {
    return localStorage.getItem('treetale-last-tree');
  } catch {
    return null;
  }
}

export function saveLastTreeId(id: string): void {
  try {
    localStorage.setItem('treetale-last-tree', id);
  } catch {
    // Ignore storage errors.
  }
}
