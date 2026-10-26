import { describe, expect, it } from 'vitest';
import { parseNewick } from './newick';
import { compareTrees } from './rf';
import { buildExampleTrees } from '../data/examples';

describe('compareTrees', () => {
  it('returns RF 0 for identical topologies', () => {
    const left = parseNewick('((A:1,B:1):1,(C:1,D:1):1);');
    const right = parseNewick('((A:2,B:2):2,(C:2,D:2):2);');
    const result = compareTrees(left, right);
    expect(result.rf).toBe(0);
    expect(result.normalizedRf).toBe(0);
    expect(result.identical).toBe(true);
  });

  it('detects a full topology conflict for four taxa', () => {
    const left = parseNewick('((A,B),(C,D));');
    const right = parseNewick('((A,C),(B,D));');
    const result = compareTrees(left, right);
    expect(result.sharedTaxa).toBe(4);
    expect(result.maxRf).toBe(4);
    expect(result.rf).toBe(4);
    expect(result.normalizedRf).toBe(1);
    expect(result.leftOnly).toHaveLength(2);
    expect(result.rightOnly).toHaveLength(2);
  });

  it('counts one-sided clade differences', () => {
    const left = parseNewick('((A,B),(C,D));');
    const right = parseNewick('((A,B),C,D);');
    const result = compareTrees(left, right);
    expect(result.leftOnly).toHaveLength(1);
    expect(result.rightOnly).toHaveLength(0);
    expect(result.rf).toBe(1);
  });

  it('finds the intended conflict in the bundled gene/species tree pair', () => {
    const records = buildExampleTrees();
    const gene = records.find((record) => record.id === 'gene-tree')!;
    const species = records.find((record) => record.id === 'species-tree')!;
    const result = compareTrees(gene.tree, species.tree);
    expect(result.sharedTaxa).toBe(10);
    expect(result.rf).toBeGreaterThan(0);
    expect(result.identical).toBe(false);
  });

  it('compares the two 26-taxon vertebrate examples without unmatched taxa', () => {
    const records = buildExampleTrees();
    const species = records.find((record) => record.id === 'vertebrates')!;
    const gene = records.find((record) => record.id === 'vertebrate-gene')!;
    const result = compareTrees(species.tree, gene.tree);
    expect(result.sharedTaxa).toBe(26);
    expect(result.unmatchedLeft).toHaveLength(0);
    expect(result.unmatchedRight).toHaveLength(0);
    expect(result.rf).toBeGreaterThan(0);
  });
});
