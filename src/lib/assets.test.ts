import { describe, expect, it } from 'vitest';
import { resolvePhotoUrl } from './assets';

describe('resolvePhotoUrl', () => {
  it('prefixes bundled paths with the deployment base', () => {
    expect(resolvePhotoUrl('/species/whale.jpg', '/TreeTale/')).toBe('/TreeTale/species/whale.jpg');
    expect(resolvePhotoUrl('/species/whale.jpg', './')).toBe('./species/whale.jpg');
    expect(resolvePhotoUrl('/species/whale.jpg', '/')).toBe('/species/whale.jpg');
  });

  it('does not double up slashes', () => {
    expect(resolvePhotoUrl('species/whale.jpg', '/TreeTale/')).toBe('/TreeTale/species/whale.jpg');
  });

  it('passes absolute and inline addresses through', () => {
    const remote = 'https://example.com/a.jpg';
    const dataUrl = 'data:image/png;base64,AAAA';
    expect(resolvePhotoUrl(remote, '/TreeTale/')).toBe(remote);
    expect(resolvePhotoUrl(dataUrl, '/TreeTale/')).toBe(dataUrl);
    expect(resolvePhotoUrl('//cdn.example.com/a.jpg', '/TreeTale/')).toBe('//cdn.example.com/a.jpg');
  });

  it('returns undefined for empty input', () => {
    expect(resolvePhotoUrl(undefined)).toBeUndefined();
    expect(resolvePhotoUrl('   ', '/TreeTale/')).toBeUndefined();
  });
});
