export async function cmsFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const res = await fetch(`/cms${normalizedPath}`, {
    ...init,
    credentials: 'include',
    cache: 'no-store',
  });

  if (res.status === 401 && typeof window !== 'undefined') {
    window.location.assign('/login');
  }

  return res;
}

export async function cmsJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await cmsFetch(path, init);
  const text = await res.text();
  let data: unknown = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`CMS 返回了无法解析的 JSON（HTTP ${res.status}）`);
    }
  }

  if (!res.ok) {
    const message =
      data && typeof data === 'object' && 'message' in data
        ? String((data as { message?: unknown }).message)
        : `CMS 请求失败（HTTP ${res.status}）`;
    throw new Error(message);
  }

  return data as T;
}
