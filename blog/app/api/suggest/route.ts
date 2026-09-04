import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

async function fetchWithTimeout(url: string, ms: number): Promise<Response | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': UA, Accept: '*/*' },
      cache: 'no-store',
    });
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function baiduSuggest(query: string): Promise<string[]> {
  const url = `https://suggestion.baidu.com/su?ie=utf-8&wd=${encodeURIComponent(query)}&p=3&cb=cb`;
  const res = await fetchWithTimeout(url, 3500);
  if (!res || !res.ok) return [];

  // 百度这个接口的编码不稳定：带 ie=utf-8 时通常是 UTF-8，但也可能回落到 GBK。
  // 优先按响应头判断，没有明确 charset 就先试 UTF-8，出现替换字符再按 GB18030 重解。
  const buffer = await res.arrayBuffer();
  const charset = /charset=([\w-]+)/i.exec(res.headers.get('content-type') ?? '')?.[1]?.toLowerCase();

  let text: string;
  if (charset && /^(gb|gbk|gb2312|gb18030)/.test(charset)) {
    text = new TextDecoder('gb18030').decode(buffer);
  } else {
    text = new TextDecoder('utf-8').decode(buffer);
    if (text.includes('\uFFFD')) {
      text = new TextDecoder('gb18030').decode(buffer);
    }
  }

  const match = text.match(/s:\[([\s\S]*?)\]/);
  if (!match) return [];
  try {
    return JSON.parse(`[${match[1]}]`) as string[];
  } catch {
    return [];
  }
}

async function googleSuggest(query: string): Promise<string[]> {
  const url = `https://suggestqueries.google.com/complete/search?client=firefox&hl=zh-CN&q=${encodeURIComponent(query)}`;
  const res = await fetchWithTimeout(url, 3500);
  if (!res || !res.ok) return [];
  try {
    const parsed = JSON.parse(await res.text()) as [string, string[]];
    return Array.isArray(parsed?.[1]) ? parsed[1] : [];
  } catch {
    return [];
  }
}

async function duckduckgoSuggest(query: string): Promise<string[]> {
  const url = `https://duckduckgo.com/ac/?kl=wt-wt&type=list&q=${encodeURIComponent(query)}`;
  const res = await fetchWithTimeout(url, 3500);
  if (!res || !res.ok) return [];
  try {
    // type=list 返回 ["query", [...]]，接口偶尔回落成 [{ phrase }]
    const parsed = JSON.parse(await res.text());
    if (Array.isArray(parsed?.[1])) return parsed[1] as string[];
    if (Array.isArray(parsed)) {
      return parsed
        .map((item: unknown) => (item && typeof item === 'object' ? (item as { phrase?: string }).phrase : undefined))
        .filter((item): item is string => typeof item === 'string');
    }
    return [];
  } catch {
    return [];
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get('q') ?? '').trim();
  const provider = searchParams.get('provider') ?? 'baidu';

  if (!query || query.length > 100) {
    return NextResponse.json({ suggestions: [] });
  }

  let suggestions: string[] = [];
  if (provider === 'google') {
    suggestions = await googleSuggest(query);
    if (suggestions.length === 0) suggestions = await baiduSuggest(query);
  } else if (provider === 'duckduckgo') {
    suggestions = await duckduckgoSuggest(query);
    if (suggestions.length === 0) suggestions = await baiduSuggest(query);
  } else {
    suggestions = await baiduSuggest(query);
  }

  return NextResponse.json(
    { suggestions: suggestions.filter((s) => typeof s === 'string' && s.trim()).slice(0, 8) },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
