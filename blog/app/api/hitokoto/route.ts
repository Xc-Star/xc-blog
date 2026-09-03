import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** 一言接口偶尔会抽风，兜底句子保证起始页不至于空着 */
const FALLBACK = [
  { text: '愿你在自己存在的地方，成为一束不需要许可的光。', from: '本地词库' },
  { text: '慢慢来，比较快。', from: '本地词库' },
  { text: '我们所经历的每个平凡的日常，也许就是连续发生的奇迹。', from: '本地词库' },
  { text: '代码是写给人看的，只是顺便能在机器上跑。', from: '本地词库' },
  { text: '不要因为走得太远，忘了当初为什么出发。', from: '本地词库' },
];

export async function GET() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3000);

  try {
    const res = await fetch('https://v1.hitokoto.cn/?encode=json&c=d&c=i&c=k', {
      signal: controller.signal,
      cache: 'no-store',
    });
    if (res.ok) {
      const data = (await res.json()) as { hitokoto?: string; from?: string; from_who?: string };
      if (data?.hitokoto) {
        return NextResponse.json(
          { text: data.hitokoto, from: data.from_who || data.from || '一言' },
          { headers: { 'Cache-Control': 'no-store' } },
        );
      }
    }
  } catch {
    // 落到兜底词库
  } finally {
    clearTimeout(timer);
  }

  const pick = FALLBACK[Math.floor(Math.random() * FALLBACK.length)];
  return NextResponse.json(pick, { headers: { 'Cache-Control': 'no-store' } });
}
