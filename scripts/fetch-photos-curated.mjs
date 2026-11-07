import fs from 'node:fs';
import path from 'node:path';

const UA = 'TreeTale/2.1 (student course project)';
const OUT_DIR = path.resolve('public/species');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const slug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const LICENSE_RANK = {
  cc0: 0,
  'cc-by': 1,
  'cc-by-sa': 2,
  'cc-by-nc': 3,
  'cc-by-nc-sa': 4,
};

const ALLOWED = new Set(['cc0', 'cc-by', 'cc-by-sa', 'cc-by-nc', 'cc-by-nc-sa']);

async function getJson(url, attempt = 0) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
    return await res.json();
  } catch (error) {
    if (attempt >= 3) throw error;
    await sleep(1000 * (attempt + 1));
    return getJson(url, attempt + 1);
  }
}

async function download(url, file) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`image HTTP ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(file, buffer);
  return buffer.length;
}

const rank = (code) => LICENSE_RANK[code] ?? 9;

/** Curated, community-selected representative photos for an exact taxon. */
async function fromTaxonPhotos(query) {
  const search = await getJson(
    `https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(query)}&per_page=6`,
  );
  const exact = (search.results ?? []).find(
    (item) => item.name?.toLowerCase() === query.toLowerCase(),
  );
  if (!exact) return null;

  const detail = await getJson(`https://api.inaturalist.org/v1/taxa/${exact.id}`);
  const taxon = detail.results?.[0];
  if (!taxon) return null;

  const photos = (taxon.taxon_photos ?? [])
    .map((entry) => entry.photo)
    .filter((photo) => photo?.url && ALLOWED.has(photo.license_code ?? ''))
    .sort((a, b) => rank(a.license_code) - rank(b.license_code));

  if (!photos.length) return null;
  return {
    url: photos[0].url.replace('/square.', '/large.'),
    license: photos[0].license_code,
    attribution: photos[0].attribution ?? '',
    taxonName: taxon.name,
    taxonId: taxon.id,
    pageUrl: `https://www.inaturalist.org/taxa/${taxon.id}`,
    source: 'iNaturalist',
    kind: 'curated',
  };
}

/** Fallback: research-grade observations with a CC photo. */
async function fromObservations(query) {
  const search = await getJson(
    `https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(query)}&per_page=6`,
  );
  const exact = (search.results ?? []).find(
    (item) => item.name?.toLowerCase() === query.toLowerCase(),
  );
  if (!exact) return null;

  const obs = await getJson(
    `https://api.inaturalist.org/v1/observations?taxon_id=${exact.id}` +
      '&photos=true&photo_license=cc0,cc-by,cc-by-sa,cc-by-nc,cc-by-nc-sa' +
      '&quality_grade=research&order_by=votes&per_page=20',
  );

  const photos = [];
  for (const observation of obs.results ?? []) {
    for (const photo of observation.photos ?? []) {
      if (!photo.url || !ALLOWED.has(photo.license_code ?? '')) continue;
      photos.push({ photo, observationId: observation.id });
    }
  }
  photos.sort((a, b) => rank(a.photo.license_code) - rank(b.photo.license_code));
  if (!photos.length) return null;
  const chosen = photos[0];
  return {
    url: chosen.photo.url.replace('/square.', '/large.'),
    license: chosen.photo.license_code,
    attribution: chosen.photo.attribution ?? '',
    taxonName: exact.name,
    taxonId: exact.id,
    pageUrl: `https://www.inaturalist.org/observations/${chosen.observationId}`,
    source: 'iNaturalist',
    kind: 'observation',
  };
}

const species = JSON.parse(fs.readFileSync('species-list.json', 'utf8'));
fs.mkdirSync(OUT_DIR, { recursive: true });

const entries = [];
const failures = [];

for (const key of species) {
  const query = key.replace(/_/g, ' ');
  let photo = null;
  try {
    photo = await fromTaxonPhotos(query);
    if (!photo) photo = await fromObservations(query);
  } catch (error) {
    console.log(`ERR ${key}: ${error.message}`);
  }

  if (!photo) {
    failures.push(key);
    console.log(`MISS ${key}`);
    await sleep(500);
    continue;
  }

  try {
    const file = path.join(OUT_DIR, `${slug(key)}.jpg`);
    const bytes = await download(photo.url, file);
    entries.push({
      name: key,
      taxonName: photo.taxonName,
      file: `/species/${slug(key)}.jpg`,
      license: photo.license,
      attribution: photo.attribution,
      pageUrl: photo.pageUrl,
      source: photo.source,
      kind: photo.kind,
      bytes,
    });
    console.log(`OK ${key} ${photo.kind} ${photo.license} ${bytes}B`);
  } catch (error) {
    failures.push(key);
    console.log(`FAIL ${key}: ${error.message}`);
  }
  await sleep(600);
}

fs.writeFileSync('photo-manifest.json', JSON.stringify({ entries, failures }, null, 2));
console.log(`total ${entries.length}/${species.length}; failed: ${failures.join(', ')}`);
