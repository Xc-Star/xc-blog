import { NextResponse } from 'next/server';
import { shouldUseSecureCookie } from '@/lib/cookieSecurity';

export async function POST(request: Request) {
  const response = NextResponse.json({ success: true, message: '已安全退出管理台' });
  response.cookies.set('xh_admin', '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: shouldUseSecureCookie(request),
    maxAge: 0,
  });
  return response;
}
