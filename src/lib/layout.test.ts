import { describe, expect, it } from 'vitest';
import { buildExampleTrees } from '../data/examples';
import { layoutTree } from './layout';

describe('tree layout', () => {
  it('fills the available width even when total branch length is below 1', () => {
    const record = buildExampleTrees().find((item) => item.id === 'microbes')!;
    const layout = layoutTree(record.tree, {
      kind: 'rectangular',
      branchMode: 'phylogram',
      width: 1120,
      height: 700,
      padding: 44,
      labelSpace: 188,
    });
    const maxTipX = Math.max(...layout.tips.map((tip) => tip.x));
    expect(maxTipX).toBeCloseTo(888, 0);
  });

  it('keeps every tip inside the rectangular plot', () => {
    for (const record of buildExampleTrees()) {
      const layout = layoutTree(record.tree, {
        kind: 'rectangular',
        branchMode: 'phylogram',
        width: 1120,
        height: 700,
        padding: 44,
        labelSpace: 188,
      });
      for (const tip of layout.tips) {
        expect(tip.x).toBeGreaterThanOrEqual(44);
        expect(tip.x).toBeLessThanOrEqual(888.001);
      }
    }
  });
});
