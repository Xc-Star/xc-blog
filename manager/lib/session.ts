const encoder = new TextEncoder();
const SESSION_DAYS = 7;

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error('SESSION_SECRET 未配置，无法签发管理会话');
  return secret;
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer), byte => byte.toString(16).padStart(2, '0')).join('');
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function sign(expiry: string): Promise<string> {
  const key = await globalThis.crypto.subtle.importKey(
    'raw',
    encoder.encode(getSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await globalThis.crypto.subtle.sign('HMAC', key, encoder.encode(expiry));
  return toHex(signature);
}

export async function createSessionToken(): Promise<{ value: string; expires: Date }> {
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  const expiry = String(expires.getTime());
  return { value: `${expiry}.${await sign(expiry)}`, expires };
}

export async function verifySessionToken(value?: string | null): Promise<boolean> {
  if (!value) return false;
  const [expiry, hmac, ...extra] = value.split('.');
  if (!expiry || !hmac || extra.length > 0) return false;

  const expiryMs = Number(expiry);
  if (!Number.isFinite(expiryMs) || expiryMs <= Date.now()) return false;

  try {
    return constantTimeEqual(hmac, await sign(expiry));
  } catch {
    return false;
  }
}
