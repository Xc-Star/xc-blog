import { NextResponse } from 'next/server';
import { createSessionToken } from '@/lib/session';
import { shouldUseSecureCookie } from '@/lib/cookieSecurity';

const encoder = new TextEncoder();
const attempts = new Map<string, { count: number; resetAt: number }>();

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getClientKey(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
}

function registerFailure(request: Request): number {
  const now = Date.now();
  const key = getClientKey(request);
  const record = attempts.get(key);
  if (!record || record.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + 60_000 });
    return 350;
  }
  record.count += 1;
  return Math.min(1500, 350 + record.count * 150);
}

function clearFailures(request: Request) {
  attempts.delete(getClientKey(request));
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest('SHA-256', encoder.encode(value));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function verifyWithBackend(password: string): Promise<{ reachable: boolean; success: boolean; message: string }> {
  const base = process.env.CMS_INTERNAL_URL ?? 'http://backend:8000';
  const headers = new Headers({ 'Content-Type': 'application/json' });
  if (process.env.CMS_TOKEN) headers.set('X-CMS-Token', process.env.CMS_TOKEN);

  try {
    const res = await fetch(`${base.replace(/\/$/, '')}/api/auth/verify`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ username: 'admin', password }),
      cache: 'no-store',
    });
    const data = await res.json().catch(() => ({}));
    return {
      reachable: true,
      success: res.ok && data.success === true,
      message: typeof data.message === 'string' ? data.message : '密码不对哦，请再试一次。',
    };
  } catch (error) {
    console.warn('⚠️ 后端登录校验不可达，准备尝试 ADMIN_PASSWORD 降级分支：', error);
    return { reachable: false, success: false, message: '认证服务暂时不可达' };
  }
}

async function verifyWithFallback(password: string): Promise<boolean> {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return false;
  const [inputHash, expectedHash] = await Promise.all([sha256Hex(password), sha256Hex(adminPassword)]);
  return constantTimeEqual(inputHash, expectedHash);
}

async function issueSession(request: Request) {
  const session = await createSessionToken();
  const response = NextResponse.json({ success: true, message: '✅ 登录成功，欢迎回来！' });
  response.cookies.set('xh_admin', session.value, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: shouldUseSecureCookie(request),
    expires: session.expires,
  });
  return response;
}

export async function POST(request: Request) {
  let password = '';
  try {
    const body = await request.json();
    password = typeof body?.password === 'string' ? body.password : '';
  } catch {
    password = '';
  }

  const backend = await verifyWithBackend(password);
  if (backend.success) {
    clearFailures(request);
    return issueSession(request);
  }

  if (!backend.reachable && process.env.ADMIN_PASSWORD) {
    console.warn('⚠️ 正在使用 ADMIN_PASSWORD 本地降级校验，请尽快恢复后端认证服务。');
    if (await verifyWithFallback(password)) {
      clearFailures(request);
      return issueSession(request);
    }
  }

  await sleep(registerFailure(request));
  return NextResponse.json({ success: false, message: backend.message }, { status: backend.reachable ? 401 : 503 });
}
