import { describe, expect, it } from 'vitest';
import { buildExampleTrees } from '../data/examples';
import { descendantTipNames, displayName, findTip, getMrca, taxonLabel } from './tree';

describe('Chinese annotations', () => {
  it('gives every built-in species a Chinese name and a simple Chinese note', () => {
    const records = buildExampleTrees();
    for (const record of records) {
      for (const leaf of record.tree.leaves) {
        const name = leaf.name ?? '';
        const meta = record.metadata[name];
        expect(meta, `${record.id} 缺少 ${name} 的 metadata`).toBeTruthy();
        expect(meta?.cn, `${name} 缺少中文名`).toBeTruthy();
        expect(meta?.note, `${name} 缺少中文说明`).toBeTruthy();
        expect(meta?.group, `${name} 缺少中文类群`).toBeTruthy();
        expect(meta?.habitat, `${name} 缺少中文生境`).toBeTruthy();
      }
    }
  });

  it('does not duplicate Chinese names inside one tree', () => {
    for (const record of buildExampleTrees()) {
      const names = record.tree.leaves.map((leaf) => record.metadata[leaf.name ?? '']?.cn);
      expect(new Set(names).size).toBe(names.length);
    }
  });

  it('prefers the Chinese name for display and falls back to the scientific name', () => {
    const record = buildExampleTrees().find((item) => item.id === 'vertebrates')!;
    const human = findTip(record.tree, 'Homo_sapiens')!;
    expect(displayName(human, record.metadata)).toBe('智人');
    expect(taxonLabel('Unknown_species', record.metadata)).toBe('Unknown species');
  });

  it('attaches every clade label to a complete, non-trivial clade', () => {
    for (const record of buildExampleTrees()) {
      const labels = record.cladeLabels ?? [];
      expect(labels.length).toBeGreaterThan(0);
      expect(new Set(labels.map((label) => label.id)).size).toBe(labels.length);

      for (const label of labels) {
        expect(label.tips.length).toBeGreaterThan(1);
        const mrca = getMrca(record.tree, label.tips);
        expect(mrca, `${record.id} / ${label.name} 找不到 MRCA`).toBeTruthy();
        const descendants = new Set(descendantTipNames(mrca!));
        expect(descendants.size).toBe(label.tips.length);
        for (const tip of label.tips) {
          expect(descendants.has(tip), `${record.id} / ${label.name} 不是完整进化枝`).toBe(true);
        }
      }
    }
  });
});
