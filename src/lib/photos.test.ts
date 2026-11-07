import { describe, expect, it } from 'vitest';
import { buildExampleTrees } from '../data/examples';
import { bundledPhotos } from '../data/speciesPhotos';
import { applyAnnotationCsv, buildAnnotationCsv } from './csv';
import { parseProjectFile } from './project';

describe('species photos', () => {
  it('ships a photo entry for every bundled species that has one on disk', () => {
    const entries = Object.entries(bundledPhotos);
    expect(entries.length).toBeGreaterThan(30);
    for (const [name, photo] of entries) {
      expect(photo.url, `${name} 缺少图片地址`).toMatch(/^\/species\/[a-z0-9-]+\.jpg$/);
      expect(photo.source, `${name} 缺少来源`).toBeTruthy();
      expect(photo.license, `${name} 缺少许可`).toBeTruthy();
      expect(photo.pageUrl, `${name} 缺少原始页面`).toMatch(/^https?:\/\//);
    }
  });

  it('attaches photos to the built-in example trees', () => {
    const record = buildExampleTrees().find((item) => item.id === 'vertebrates')!;
    expect(record.metadata.Homo_sapiens.photo?.url).toBe('/species/homo-sapiens.jpg');
    expect(record.metadata.Balaenoptera_musculus.photo?.license).toBe('CC BY');
    const withPhoto = record.tree.leaves.filter((leaf) => record.metadata[leaf.name ?? '']?.photo);
    expect(withPhoto.length).toBeGreaterThanOrEqual(25);
  });

  it('round-trips photo columns through the annotation CSV', () => {
    const record = buildExampleTrees().find((item) => item.id === 'gene-tree')!;
    const csv = buildAnnotationCsv(record.tree, record.metadata);
    expect(csv).toContain('photo,photo_source,photo_license,photo_credit');
    expect(csv).toContain('/species/homo-sapiens.jpg');

    const result = applyAnnotationCsv(csv, record.tree, {});
    expect(result.matched).toBe(record.tree.leaves.length);
    expect(result.metadata.Homo_sapiens.photo?.url).toBe('/species/homo-sapiens.jpg');
    expect(result.metadata.Homo_sapiens.photo?.license).toBe('Unsplash License');
  });

  it('imports photo metadata from a CSV with only the photo column', () => {
    const record = buildExampleTrees().find((item) => item.id === 'gene-tree')!;
    const csv = [
      'name,cn,photo,photo_source,photo_license',
      'Homo_sapiens,智人,https://example.com/h.jpg,自定义,CC BY',
    ].join('\n');
    const result = applyAnnotationCsv(csv, record.tree, record.metadata);
    expect(result.metadata.Homo_sapiens.photo).toEqual({
      url: 'https://example.com/h.jpg',
      source: '自定义',
      license: 'CC BY',
      credit: undefined,
    });
  });

  it('keeps photo credits when importing a project file', () => {
    const project = parseProjectFile(
      JSON.stringify({
        name: 'photo project',
        newick: '(A,B);',
        metadata: {
          A: {
            cn: '甲',
            photo: {
              url: '/species/a.jpg',
              source: 'iNaturalist',
              license: 'CC BY-NC',
              credit: 'Someone',
              pageUrl: 'https://example.com/a',
            },
          },
        },
      }),
    );
    expect(project.metadata.A.photo).toEqual({
      url: '/species/a.jpg',
      source: 'iNaturalist',
      license: 'CC BY-NC',
      credit: 'Someone',
      pageUrl: 'https://example.com/a',
    });
  });
});
