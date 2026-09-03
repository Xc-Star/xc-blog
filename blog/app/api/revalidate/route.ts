import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

import { loadRuntime } from '../../../lib/content.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * 管理端保存内容后调用此接口刷新博客缓存。
 * 页面本身已经是 force-dynamic，这里主要是把 globalThis 上的配置快照顶掉。
 */
export async function POST(request: Request) {
  const expected = process.env.REVALIDATE_TOKEN;
  if (expected) {
    const provided = request.headers.get('x-revalidate-token');
    if (provided !== expected) {
      return NextResponse.json({ success: false, message: '未授权' }, { status: 401 });
    }
  }

  await loadRuntime();
  revalidatePath('/', 'layout');

  return NextResponse.json({ success: true, message: '博客缓存已刷新' });
}
