import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';

const STACK = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const CONTENT = path.join(STACK, 'db', 'seed-source');
const OUT = path.join(STACK, 'db', 'init', '02-seed.sql');

const q = (value) => {
  if (value === null || value === undefined) return 'NULL';
  return `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
};
const json = (value) => (value === null || value === undefined ? 'NULL' : q(JSON.stringify(value)));

/** front-matter 的 date 可能是 Date、字符串或缺失，统一成 MySQL DATETIME */
function toDateTime(raw) {
  if (!raw) return null;
  const d = raw instanceof Date ? raw : new Date(String(raw).replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return null;
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

function readMarkdownDir(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((file) => {
      const parsed = matter(fs.readFileSync(path.join(dir, file), 'utf8'));
      return { slug: file.replace(/\.md$/, ''), data: parsed.data ?? {}, content: parsed.content ?? '' };
    });
}

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

const lines = [
  '-- =====================================================================',
  '--  初始种子数据（由 xhblogs-stack/tools/generate-seed.mjs 生成）',
  '--  仅在数据库首次初始化时执行一次。',
  '-- =====================================================================',
  '',
  'SET NAMES utf8mb4;',
  '',
];

// ---- site_config ----
const site = readJson(path.join(CONTENT, 'site.config.json'), {});
lines.push('-- 站点配置');
for (const [key, value] of Object.entries(site)) {
  lines.push(
    `INSERT INTO site_config (config_key, config_value) VALUES (${q(key)}, ${json(value)}) ` +
      'ON DUPLICATE KEY UPDATE config_value = VALUES(config_value);',
  );
}
lines.push('');

// ---- documents ----
lines.push('-- 文章与杂谈');
for (const [dir, type] of [
  ['posts', 'post'],
  ['chatters', 'chatter'],
]) {
  for (const item of readMarkdownDir(path.join(CONTENT, dir))) {
    const d = item.data;
    const tags = Array.isArray(d.tags) ? d.tags : d.tags ? [d.tags] : [];
    const published = toDateTime(d.date);
    lines.push(
      'INSERT INTO documents (slug, doc_type, title, description, cover, mood, tags, content, published_at) VALUES (' +
        [
          q(item.slug),
          q(type),
          q(d.title ?? ''),
          q(d.description ?? ''),
          q(d.cover ?? ''),
          q(d.mood ?? ''),
          json(tags),
          q(item.content),
          published ? q(published) : 'NULL',
        ].join(', ') +
        ') ON DUPLICATE KEY UPDATE title = VALUES(title);',
    );
  }
}
lines.push('');

// ---- moments ----
lines.push('-- 说说');
for (const item of readMarkdownDir(path.join(CONTENT, 'moments'))) {
  const d = item.data;
  const published = toDateTime(d.date);
  lines.push(
    'INSERT INTO moments (id, content, location, images, published_at) VALUES (' +
      [
        q(d.id ?? item.slug),
        q(item.content.trim()),
        q(d.location ?? ''),
        json(Array.isArray(d.images) ? d.images : []),
        published ? q(published) : 'NULL',
      ].join(', ') +
      ') ON DUPLICATE KEY UPDATE content = VALUES(content);',
  );
}
lines.push('');

// ---- pages (about) ----
lines.push('-- 单页内容');
const aboutPath = path.join(CONTENT, 'about.md');
if (fs.existsSync(aboutPath)) {
  const about = matter(fs.readFileSync(aboutPath, 'utf8'));
  lines.push(
    'INSERT INTO pages (slug, title, cover, content) VALUES (' +
      [q('about'), q(about.data?.title ?? '关于我'), q(about.data?.cover ?? ''), q(about.content ?? '')].join(', ') +
      ') ON DUPLICATE KEY UPDATE content = VALUES(content);',
  );
}
lines.push('');

// ---- albums / friends / projects ----
lines.push('-- 相册');
readJson(path.join(CONTENT, 'data', 'albums.json'), []).forEach((a, i) => {
  lines.push(
    'INSERT INTO albums (id, title, description, cover, album_date, photos, sort_order) VALUES (' +
      [q(a.id), q(a.title ?? ''), q(a.description ?? ''), q(a.cover ?? ''), q(a.date ?? ''), json(a.photos ?? []), i].join(', ') +
      ') ON DUPLICATE KEY UPDATE title = VALUES(title);',
  );
});
lines.push('');

lines.push('-- 友链');
readJson(path.join(CONTENT, 'data', 'friends.json'), []).forEach((f, i) => {
  lines.push(
    'INSERT INTO friends (id, name, url, description, avatar, theme_color, sort_order) VALUES (' +
      [q(f.id), q(f.name ?? ''), q(f.url ?? ''), q(f.description ?? ''), q(f.avatar ?? ''), q(f.themeColor ?? ''), i].join(', ') +
      ') ON DUPLICATE KEY UPDATE name = VALUES(name);',
  );
});
lines.push('');

lines.push('-- 项目矩阵');
readJson(path.join(CONTENT, 'data', 'projects.json'), []).forEach((p, i) => {
  lines.push(
    'INSERT INTO projects (id, name, description, icon, github_url, tags, sort_order) VALUES (' +
      [q(p.id), q(p.name ?? ''), q(p.description ?? ''), q(p.icon ?? ''), q(p.githubUrl ?? ''), json(p.tags ?? []), i].join(', ') +
      ') ON DUPLICATE KEY UPDATE name = VALUES(name);',
  );
});
lines.push('');

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, lines.join('\n'), 'utf8');
console.log(`wrote ${OUT}`);
