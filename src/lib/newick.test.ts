import { describe, expect, it } from 'vitest';
import { NewickParseError, parseNewick, toNewick } from './newick';
import { buildExampleTrees } from '../data/examples';

describe('parseNewick', () => {
  it('parses leaves, branch lengths, and support values', () => {
    const tree = parseNewick('((A:0.1,B:0.2)95:0.3,C:0.4);', { id: 'test' });
    expect(tree.leaves).toHaveLength(3);
    expect(tree.leaves.find((leaf) => leaf.name === 'A')?.length).toBe(0.1);
    const internal = tree.nodes.find((node) => node.support === 95);
    expect(internal?.support).toBe(95);
    expect(internal?.length).toBe(0.3);
  });

  it('parses quoted labels with spaces and apostrophes', () => {
    const tree = parseNewick("('Homo sapiens':0.1,'Pan paniscus':0.2);");
    expect(tree.leaves.map((leaf) => leaf.name)).toEqual(['Homo sapiens', 'Pan paniscus']);
  });

  it('parses support from comments', () => {
    const tree = parseNewick('((A,B)[&support=87]:0.1,C);');
    const internal = tree.nodes.find((node) => node.support === 87);
    expect(internal?.support).toBe(87);
  });

  it('normalises posterior probabilities between 0 and 1', () => {
    const tree = parseNewick('((A,B)0.98,C);');
    const internal = tree.nodes.find((node) => node.support === 98);
    expect(internal?.support).toBe(98);
  });

  it('accepts scientific notation branch lengths', () => {
    const tree = parseNewick('(A:1e-5,B:2.5E-3);');
    expect(tree.leaves[0].length).toBeCloseTo(0.00001);
    expect(tree.leaves[1].length).toBeCloseTo(0.0025);
  });

  it('rejects malformed trees with a useful error', () => {
    expect(() => parseNewick('((A,B);')).toThrow(NewickParseError);
    expect(() => parseNewick('(A:0.1,B:-0.2);')).toThrow(/分支长度/);
    expect(() => parseNewick('(A,B);(C,D);')).toThrow(/多余内容/);
  });

  it('round-trips a tree through toNewick', () => {
    const tree = parseNewick("((A:0.1,'B c':0.2)90:0.3,C:0.4);");
    const reparsed = parseNewick(toNewick(tree));
    expect(reparsed.leaves.map((leaf) => leaf.name).sort()).toEqual(['A', 'B c', 'C']);
    expect(reparsed.leaves.find((leaf) => leaf.name === 'B c')?.length).toBe(0.2);
  });

  it('parses every bundled example', () => {
    const records = buildExampleTrees();
    for (const record of records) {
      expect(record.tree.leaves.length).toBeGreaterThan(2);
      expect(record.tree.root.children.length).toBeGreaterThan(0);
    }
    expect(records.find((record) => record.id === 'vertebrates')?.tree.leaves).toHaveLength(26);
  });
});
