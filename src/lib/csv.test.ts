import { describe, expect, it } from 'vitest';
import { parseNewick } from './newick';
import { applyAnnotationCsv, buildAnnotationCsv, stringifyCsv } from './csv';

const tree = parseNewick('(Homo_sapiens:0.1,Pan_troglodytes:0.2,Mus_musculus:0.3);');

describe('CSV annotations', () => {
  it('round-trips quoted cells', () => {
    const text = stringifyCsv([['name', 'note'], ['A', 'hello, "world"']]);
    expect(text).toContain('"hello, ""world"""');
  });

  it('applies Chinese annotations and reports unmatched taxa', () => {
    const csv = [
      'name,cn,group,habitat,note',
      'Homo_sapiens,智人,哺乳类,陆地,"现代人类，也就是我们自己。"',
      'Pan_troglodytes,黑猩猩,哺乳类,陆地,与人类亲缘关系最近的动物之一。',
      'Unknown,未知,未分类,未知,不存在。',
    ].join('\n');
    const result = applyAnnotationCsv(csv, tree, {});
    expect(result.matched).toBe(2);
    expect(result.unmatched).toEqual(['Unknown']);
    expect(result.metadata.Homo_sapiens.cn).toBe('智人');
    expect(result.metadata.Homo_sapiens.note).toContain('现代人类');
  });

  it('accepts Chinese header aliases', () => {
    const csv = ['学名,中文名,类群,生境,说明', 'Mus_musculus,小家鼠,啮齿类,陆地,实验小鼠。'].join(
      '\n',
    );
    const result = applyAnnotationCsv(csv, tree, {});
    expect(result.metadata.Mus_musculus.cn).toBe('小家鼠');
  });

  it('builds a template with one row per leaf', () => {
    const csv = buildAnnotationCsv(tree, { Homo_sapiens: { cn: '智人', note: '人类' } });
    expect(csv).toContain('Homo_sapiens,智人');
    expect(csv.split('\r\n')).toHaveLength(4);
  });
});
