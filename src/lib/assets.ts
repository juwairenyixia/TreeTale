/**
 * Resolves a stored photo address into something an <img> can load.
 *
 * Bundled photos are recorded as root-relative paths (`/species/x.jpg`), but the
 * site can be served from a sub-path such as GitHub Pages project pages
 * (`https://user.github.io/TreeTale/`). A leading slash would then point at the
 * domain root and 404, so those paths are resolved against Vite's base URL.
 *
 * Absolute addresses the user pasted (https:, data:, blob:) pass through.
 */
const ABSOLUTE_URL = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;

export function resolvePhotoUrl(url?: string, base?: string): string | undefined {
  if (!url) return undefined;
  const value = url.trim();
  if (!value) return undefined;
  if (ABSOLUTE_URL.test(value)) return value;

  const root = base ?? import.meta.env?.BASE_URL ?? '/';
  const path = value.replace(/^\.?\//, '');
  return `${root}${path}`;
}
