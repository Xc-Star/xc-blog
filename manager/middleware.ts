import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/session';

const PUBLIC_FILE = /\.[^/]+$/;

function isPublicPath(pathname: string): boolean {
  return (
    pathname === '/login' ||
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/_next/') ||
    pathname === '/favicon.ico' ||
    PUBLIC_FILE.test(pathname)
  );
}

function passThroughCms(request: NextRequest): NextResponse {
  const headers = new Headers(request.headers);
  const cmsToken = process.env.CMS_TOKEN;
  if (cmsToken) headers.set('X-CMS-Token', cmsToken);
  return NextResponse.next({ request: { headers } });
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isCms = pathname === '/cms' || pathname.startsWith('/cms/');

  if (!process.env.ADMIN_PASSWORD) {
    console.warn('⚠️ ADMIN_PASSWORD 未配置，管理控制台保持开放。');
    return isCms ? passThroughCms(request) : NextResponse.next();
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const authed = await verifySessionToken(request.cookies.get('xh_admin')?.value);
  if (authed) {
    if (isCms) return passThroughCms(request);
    if (pathname === '/login') return NextResponse.redirect(new URL('/', request.url));
    return NextResponse.next();
  }

  if (isCms) {
    return NextResponse.json({ success: false, message: '登录已过期，请重新进入管理台。' }, { status: 401 });
  }

  const acceptsHtml = request.headers.get('accept')?.includes('text/html');
  if (acceptsHtml) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.json({ success: false, message: '请先登录管理台。' }, { status: 401 });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
};
