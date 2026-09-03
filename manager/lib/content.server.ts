import defaultSiteConfig from '../site.config.default.json';
import { parseJsonColumn, query, queryOne } from './db';
import { setRuntime, type RuntimeSnapshot } from './runtimeStore';

export type DocType = 'post' | 'chatter';

/** 涓庢棫鐗?front matter 杈撳嚭淇濇寔涓€鑷寸殑缁撴瀯锛岄〉闈㈤噷鐨勬槧灏勪唬鐮佸洜姝ゅ嚑涔庝笉鐢ㄦ敼銆?*/
export type DocumentEntry = {
  slug: string;
  data: {
    title: string;
    description: string;
    cover: string;
    mood: string;
    tags: string[];
    date: string;
  };
  content: string;
};

export type MomentEntry = {
  id: string;
  date: string;
  location: string;
  images: string[];
  content: string;
};

type DocumentRow = {
  slug: string;
  title: string | null;
  description: string | null;
  cover: string | null;
  mood: string | null;
  tags: unknown;
  content: string | null;
  published_at: string | null;
};

function toEntry(row: DocumentRow): DocumentEntry {
  return {
    slug: row.slug,
    data: {
      title: row.title ?? '',
      description: row.description ?? '',
      cover: row.cover ?? '',
      mood: row.mood ?? '',
      tags: parseJsonColumn<string[]>(row.tags, []),
      date: row.published_at ?? '1970-01-01',
    },
    content: row.content ?? '',
  };
}

const DOC_COLUMNS = 'slug, title, description, cover, mood, tags, content, published_at';

/** 鎸夊彂甯冩椂闂村€掑簭鍙栨煇涓€绫绘枃妗ｏ紱slug 浣滀负娆＄骇鎺掑簭淇濊瘉椤哄簭绋冲畾銆?*/
export async function getDocuments(docType: DocType): Promise<DocumentEntry[]> {
  const rows = await query<DocumentRow>(
    `SELECT ${DOC_COLUMNS} FROM documents WHERE doc_type = ? ORDER BY published_at DESC, slug DESC`,
    [docType],
  );
  return rows.map(toEntry);
}

export async function getDocument(docType: DocType, slug: string): Promise<DocumentEntry | null> {
  const row = await queryOne<DocumentRow>(
    `SELECT ${DOC_COLUMNS} FROM documents WHERE doc_type = ? AND slug = ? LIMIT 1`,
    [docType, slug],
  );
  return row ? toEntry(row) : null;
}

export async function getMoments(): Promise<MomentEntry[]> {
  const rows = await query<{
    id: string;
    content: string | null;
    location: string | null;
    images: unknown;
    published_at: string | null;
  }>('SELECT id, content, location, images, published_at FROM moments ORDER BY published_at DESC, id DESC');

  return rows.map((row) => ({
    id: row.id,
    date: row.published_at ?? '1970-01-01',
    location: row.location ?? '',
    images: parseJsonColumn<string[]>(row.images, []),
    content: (row.content ?? '').trim(),
  }));
}

export async function getPage(slug: string): Promise<{ title: string; cover: string; content: string } | null> {
  const row = await queryOne<{ title: string | null; cover: string | null; content: string | null }>(
    'SELECT title, cover, content FROM pages WHERE slug = ? LIMIT 1',
    [slug],
  );
  if (!row) return null;
  return { title: row.title ?? '', cover: row.cover ?? '', content: row.content ?? '' };
}

export async function getAlbums() {
  const rows = await query<{
    id: string;
    title: string | null;
    description: string | null;
    cover: string | null;
    album_date: string | null;
    photos: unknown;
  }>('SELECT id, title, description, cover, album_date, photos FROM albums ORDER BY sort_order ASC, id ASC');

  return rows.map((row) => ({
    id: row.id,
    title: row.title ?? '',
    description: row.description ?? '',
    cover: row.cover ?? '',
    date: row.album_date ?? '',
    photos: parseJsonColumn<{ url: string; caption?: string }[]>(row.photos, []),
  }));
}

export async function getFriends() {
  const rows = await query<{
    id: string;
    name: string | null;
    url: string | null;
    description: string | null;
    avatar: string | null;
    theme_color: string | null;
  }>('SELECT id, name, url, description, avatar, theme_color FROM friends ORDER BY sort_order ASC, id ASC');

  return rows.map((row) => ({
    id: row.id,
    name: row.name ?? '',
    url: row.url ?? '',
    description: row.description ?? '',
    avatar: row.avatar ?? '',
    themeColor: row.theme_color ?? '',
  }));
}

export async function getProjects() {
  const rows = await query<{
    id: string;
    name: string | null;
    description: string | null;
    icon: string | null;
    github_url: string | null;
    tags: unknown;
  }>('SELECT id, name, description, icon, github_url, tags FROM projects ORDER BY sort_order ASC, id ASC');

  return rows.map((row) => ({
    id: row.id,
    name: row.name ?? '',
    description: row.description ?? '',
    icon: row.icon ?? '',
    githubUrl: row.github_url ?? '',
    tags: parseJsonColumn<string[]>(row.tags, []),
  }));
}

export async function getSiteConfig(): Promise<Record<string, unknown>> {
  const rows = await query<{ config_key: string; config_value: unknown }>(
    'SELECT config_key, config_value FROM site_config',
  );

  const fromDb: Record<string, unknown> = {};
  for (const row of rows) {
    if (row.config_value === null || row.config_value === undefined) continue;
    fromDb[row.config_key] = parseJsonColumn<unknown>(row.config_value, null);
  }

  // 鏁版嵁搴撶己瀛楁鏃跺洖钀藉埌闀滃儚鍐呯疆榛樿鍊硷紝淇濊瘉椤甸潰姘歌繙鏈変笢瑗垮彲娓叉煋
  return { ...(defaultSiteConfig as Record<string, unknown>), ...fromDb };
}

/**
 * 鎷夊彇绔欑偣閰嶇疆涓庣粨鏋勫寲鏁版嵁骞跺啓鍏?globalThis锛?
 * 渚涘叏绔欙紙鍚鎴风缁勪欢锛夐€氳繃 siteConfig / albums / friendsData / projectsData 浠ｇ悊璇诲彇銆?
 */
export async function loadRuntime(): Promise<RuntimeSnapshot> {
  const [site, albums, friends, projects] = await Promise.all([
    getSiteConfig(),
    getAlbums(),
    getFriends(),
    getProjects(),
  ]);

  const snapshot: RuntimeSnapshot = { site, albums, friends, projects };
  setRuntime(snapshot);
  return snapshot;
}
