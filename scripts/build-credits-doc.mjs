import fs from 'node:fs';

/**
 * Writes `docs/PHOTO-CREDITS.md` from the generated photo module, so the
 * attribution table always matches what the app actually shows.
 */

const source = fs.readFileSync('src/data/speciesPhotos.ts', 'utf8');
const start = source.indexOf('{', source.indexOf('bundledPhotos'));
const end = source.lastIndexOf('}');

const entries = [];
let current = null;
for (const line of source.slice(start, end).split('\n')) {
  const keyMatch = line.match(/^ {2}(\w+):\s*\{$/);
  if (keyMatch) {
    current = { name: keyMatch[1] };
    continue;
  }
  if (!current) continue;

  const field = (name) => {
    const match = line.match(new RegExp(`${name}:\\s*("(?:[^"\\\\]|\\\\.)*"|'[^']*')`));
    if (!match) return null;
    const raw = match[1];
    return raw.startsWith('"') ? JSON.parse(raw) : raw.slice(1, -1);
  };

  if (line.includes('url:')) current.file = field('url');
  if (line.includes('source:')) current.source = field('source');
  if (line.includes('license:')) current.license = field('license');
  if (line.includes('credit:')) current.credit = field('credit');
  if (line.includes('pageUrl:')) current.page = field('pageUrl');
  if (line.includes('caption:')) current.caption = field('caption');

  if (/^ {2}\},$/.test(line)) {
    entries.push(current);
    current = null;
  }
}

entries.sort((a, b) => a.name.localeCompare(b.name));

const noPhoto = [
  'Vibrio cholerae',
  'Prochlorococcus marinus',
  'Nitrosopumilus maritimus',
  'Methanobrevibacter smithii',
  'Deinococcus radiodurans',
  'Synechococcus elongatus',
];

const out = [
  '# 物种照片来源与许可',
  '',
  'TreeTale 内置示例树中的物种照片来自 **iNaturalist**（社区精选的分类单元照片或研究级观察记录）与 **Unsplash**。',
  '每张照片在界面上都显示来源、许可和作者；点击“查看原始页面”可以核对原始记录。',
  '',
  `共 ${entries.length} 张。重新抓取与生成：\`node scripts/fetch-photos-curated.mjs\`、\`node scripts/build-photo-data.mjs\`、\`node scripts/build-credits-doc.mjs\`。`,
  '',
  '| 物种（学名） | 来源 | 许可 | 作者 / 版权 | 原始页面 |',
  '| --- | --- | --- | --- | --- |',
];

for (const entry of entries) {
  const name = entry.name.replace(/_/g, ' ');
  out.push(
    `| *${name}* | ${entry.source ?? '—'} | ${entry.license ?? '—'} | ${entry.credit || '—'} | [查看](${entry.page ?? '#'}) |`,
  );
}

out.push('', '## 说明', '');
out.push('- 照片仅用于教学演示，帮助读者建立“这个物种长什么样”的直观印象。');
out.push('- 转载或二次发布时请保留来源、许可和作者；CC BY-SA / CC BY-NC-SA 要求以相同方式共享。');
out.push('- 天蓝色链霉菌使用链霉菌属（*Streptomyces*）的菌落照片作为属级代表，界面上已注明。');
out.push(`- 以下物种目前没有可靠且许可清晰的照片，界面显示“还没有照片”，用户可自行补充：${noPhoto.join('、')}。`);
out.push('- 用户自行上传的图片不会进入仓库，只保存在上传者浏览器的本地工作区。');
out.push('');

fs.writeFileSync('docs/PHOTO-CREDITS.md', out.join('\n'));
console.log(`wrote ${entries.length} entries to docs/PHOTO-CREDITS.md`);
