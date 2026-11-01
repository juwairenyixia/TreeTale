import { describe, expect, it } from 'vitest';
import { parseProjectFile } from './project';

describe('project files', () => {
  it('accepts a full project file', () => {
    const project = parseProjectFile(
      JSON.stringify({
        format: 'treetale-project',
        name: 'Demo',
        newick: '(A,B);',
        metadata: { A: { cn: '甲' } },
        cladeLabels: [{ id: 'ab', name: '甲乙', tips: ['A', 'B'], description: '测试' }],
      }),
    );
    expect(project.name).toBe('Demo');
    expect(project.metadata.A.cn).toBe('甲');
    expect(project.cladeLabels?.[0].name).toBe('甲乙');
  });

  it('rejects JSON without a tree', () => {
    expect(() => parseProjectFile('{"name":"x"}')).toThrow(/newick/);
    expect(() => parseProjectFile('not json')).toThrow(/JSON/);
  });
});
