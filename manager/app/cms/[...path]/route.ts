import { NextRequest, NextResponse } from 'next/server';

/**
 * 管理端 → CMS 后端的运行时反向代理。
 *
 * 刻意不用 next.config 的 rewrites：那份配置会在构建期固化进 routes-manifest，
 * 部署时改 CMS_INTERNAL_URL 根本不生效。放在路由处理器里则每次请求都重新读环境变量。
 *
 * 鉴权由 middleware 负责（未登录的 /cms/* 直接 401），这里只负责补上后端要的内部令牌。
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function backendBase(): string {
  return (process.env.CMS_INTERNAL_URL ?? 'http://backend:8000').replace(/\/+$/, '');
}

/** 逐跳首部不能转发，Cookie 也不该泄露给后端 */
const STRIPPED_REQUEST_HEADERS = [
  'host',
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'content-length',
  'cookie',
  'accept-encoding',
];

const STRIPPED_RESPONSE_HEADERS = ['content-encoding', 'content-length', 'transfer-encoding', 'connection'];
async function proxy(request: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  const { path } = await context.params;
  const suffix = (path ?? []).map(encodeURIComponent).join('/');
  const target = `${backendBase()}/${suffix}${request.nextUrl.search}`;

  const headers = new Headers(request.headers);
  for (const name of STRIPPED_REQUEST_HEADERS) headers.delete(name);

  const token = process.env.CMS_TOKEN;
  if (token) headers.set('x-cms-token', token);

  const method = request.method.toUpperCase();
  let body: ArrayBuffer | undefined;
  if (method !== 'GET' && method !== 'HEAD') {
    // 缓冲而非流式转发：图片上传体积可控，缓冲能避开 undici 的 duplex 限制
    body = await request.arrayBuffer();
  }

  try {
    const upstream = await fetch(target, {
      method,
      headers,
      body,
      cache: 'no-store',
      redirect: 'manual',
    });

    // 必须整体缓冲：若原样透传流又抹掉了 content-length，
    // 响应就失去了长度框定，keep-alive 连接上的后续请求会解析错位。
    const payload = await upstream.arrayBuffer();

    const responseHeaders = new Headers(upstream.headers);
    for (const name of STRIPPED_RESPONSE_HEADERS) responseHeaders.delete(name);
    responseHeaders.set('content-length', String(payload.byteLength));

    return new NextResponse(payload, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('[cms-proxy] 后端不可达：', target, error);
    return NextResponse.json(
      { success: false, message: '无法连接到 CMS 后端服务，请检查该容器是否正常运行。' },
      { status: 502 },
    );
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const HEAD = proxy;
export const OPTIONS = proxy;
