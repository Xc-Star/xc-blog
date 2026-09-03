/**
 * 会话 Cookie 的 Secure 标志。
 *
 * 默认部署（docker compose 直出 3001 端口）是纯 HTTP，此时若带上 Secure，
 * 浏览器不会回传 Cookie，表现为「登录成功却一直跳回登录页」。
 * 因此默认关闭，交由部署者在挂了 HTTPS 反代之后用 COOKIE_SECURE=true 显式开启；
 * 也支持通过反代传来的 x-forwarded-proto 自动判定。
 */
export function shouldUseSecureCookie(request?: Request): boolean {
  const explicit = (process.env.COOKIE_SECURE ?? '').trim().toLowerCase();
  if (explicit === 'true' || explicit === '1') return true;
  if (explicit === 'false' || explicit === '0') return false;

  if (request) {
    const forwardedProto = request.headers.get('x-forwarded-proto');
    if (forwardedProto) {
      return forwardedProto.split(',')[0].trim().toLowerCase() === 'https';
    }
    try {
      return new URL(request.url).protocol === 'https:';
    } catch {
      return false;
    }
  }

  return false;
}
