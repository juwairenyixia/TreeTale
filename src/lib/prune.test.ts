import { describe, expect, it } from 'vitest';
import { parseNewick } from './newick';
import { matchTaxa, pruneTree } from './tree';

describe('tree pruning and aliases', () => {
  const tree = parseNewick('((A:1,B:1):1,(C:1,D:1):1,E:1);');

  it('prunes to a requested taxon set and drops unary nodes', () => {
    const pruned = pruneTree(tree, ['A', 'B', 'C']);
    expect(pruned?.leaves.map((leaf) => leaf.name).sort()).toEqual(['A', 'B', 'C']);
    expect(pruned?.nodes.every((node) => node.children.length !== 1)).toBe(true);
  });

  it('returns null when fewer than two taxa remain', () => {
    expect(pruneTree(tree, ['A'])).toBeNull();
  });

  it('uses aliases during taxon matching', () => {
    const right = parseNewick('(Homo,Pan,Mus);');
    const left = parseNewick('(Homo_sapiens,Pan_troglodytes,Mus_musculus);');
    const matched = matchTaxa(left, right, {
      Homo_sapiens: 'Homo',
      Pan_troglodytes: 'Pan',
      Mus_musculus: 'Mus',
    });
    expect(matched.matches).toHaveLength(3);
    expect(matched.unmatchedLeft).toHaveLength(0);
    expect(matched.unmatchedRight).toHaveLength(0);
  });
});
