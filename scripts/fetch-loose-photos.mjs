import fs from 'node:fs';
import path from 'node:path';

const UA = 'TreeTale/2.1 (student course project)';
const OUT_DIR = path.resolve('public/species');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const slug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const missing = JSON.parse(fs.readFileSync('missing.json', 'utf8'));

const RANK = { cc0: 0, 'cc-by': 1, 'cc-by-sa': 2, 'cc-by-nc': 3, 'cc-by-nc-sa': 4 };
const ALLOWED = new Set(Object.keys(RANK));

async function getJson(url, attempt = 0) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
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
  if (buffer.length < 4000) throw new Error(`too small ${buffer.length}B`);
  fs.writeFileSync(file, buffer);
  return buffer.length;
}

const results = [];
for (const name of missing) {
  const query = name.replace(/_/g, ' ');
  try {
    const search = await getJson(
      `https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(query)}&per_page=5`,
    );
    const taxon = (search.results ?? []).find(
      (item) => item.name?.toLowerCase() === query.toLowerCase(),
    );
    if (!taxon) {
      console.log(`MISS ${name} (no taxon)`);
      continue;
    }

    // Deliberately no quality_grade filter: microbes rarely reach "research grade".
    const obs = await getJson(
      `https://api.inaturalist.org/v1/observations?taxon_id=${taxon.id}&photos=true` +
        '&photo_license=cc0,cc-by,cc-by-sa,cc-by-nc,cc-by-nc-sa&order_by=votes&per_page=50',
    );

    const candidates = [];
    for (const observation of obs.results ?? []) {
      for (const photo of observation.photos ?? []) {
        if (!photo.url || !ALLOWED.has(photo.license_code ?? '')) continue;
        candidates.push({ photo, observationId: observation.id });
      }
    }
    candidates.sort((a, b) => RANK[a.photo.license_code] - RANK[b.photo.license_code]);

    if (!candidates.length) {
      console.log(`MISS ${name} (no cc photo, total obs ${obs.total_results})`);
      continue;
    }

    const chosen = candidates[0];
    const file = path.join(OUT_DIR, `${slug(name)}.jpg`);
    const bytes = await download(chosen.photo.url.replace('/square.', '/large.'), file);
    results.push({
      name,
      taxonName: taxon.name,
      file: `/species/${slug(name)}.jpg`,
      license: chosen.photo.license_code,
      attribution: chosen.photo.attribution ?? '',
      pageUrl: `https://www.inaturalist.org/observations/${chosen.observationId}`,
      source: 'iNaturalist',
      kind: 'observation',
      bytes,
    });
    console.log(`OK ${name} ${chosen.photo.license_code} ${bytes}B`);
  } catch (error) {
    console.log(`FAIL ${name}: ${error.message}`);
  }
  await sleep(700);
}

fs.writeFileSync('photo-loose.json', JSON.stringify(results, null, 2));
console.log(`recovered ${results.length}/${missing.length}`);
