import { describe, expect, it } from 'vitest';
import { isNexus, parseNexus } from './nexus';

const nexus = `#NEXUS
BEGIN TREES;
  TREE first = [&R] ((A:0.1,B:0.2):0.3,C:0.4);
  TREE 'second tree' = [&R] ((A,C),B);
END;
`;

describe('NEXUS trees', () => {
  it('detects NEXUS input', () => {
    expect(isNexus(nexus)).toBe(true);
    expect(isNexus('(A,B);')).toBe(false);
  });

  it('reads multiple trees and quoted names', () => {
    const trees = parseNexus(nexus);
    expect(trees).toHaveLength(2);
    expect(trees[0].name).toBe('first');
    expect(trees[1].name).toBe('second tree');
    expect(trees[0].newick).toContain('A:0.1');
  });

  it('rejects files without a TREE statement', () => {
    expect(() => parseNexus('#NEXUS\nBEGIN TREES;\nEND;')).toThrow(/TREE/);
  });
});
