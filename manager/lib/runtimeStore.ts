/**
 * 通用运行时数据仓库（服务端 / 客户端同构，不包含任何 fs 依赖）。
 *
 * 内容全部存放在 globalThis 上，因此服务端的多个 bundle（layout、page、route handler）
 * 共享同一份数据；客户端则由 layout 注入的 <script> 预先填充。
 */

export const RUNTIME_GLOBAL_KEY = '__XH_RUNTIME__';

export type RuntimeSnapshot = {
  site: Record<string, unknown>;
  albums: unknown[];
  friends: unknown[];
  projects: unknown[];
  projectCategories: unknown[];
};

type GlobalWithRuntime = typeof globalThis & {
  [RUNTIME_GLOBAL_KEY]?: Partial<RuntimeSnapshot>;
};

export function getRuntime(): Partial<RuntimeSnapshot> {
  return (globalThis as GlobalWithRuntime)[RUNTIME_GLOBAL_KEY] ?? {};
}

export function setRuntime(next: Partial<RuntimeSnapshot>): void {
  const g = globalThis as GlobalWithRuntime;
  g[RUNTIME_GLOBAL_KEY] = { ...g[RUNTIME_GLOBAL_KEY], ...next };
}

/**
 * 生成一个始终反映最新值的对象代理。
 * 让 `import { siteConfig } from '../siteConfig'` 这种写法在运行时热更新后依然拿到新值。
 */
export function liveObject<T extends object>(read: () => T): T {
  return new Proxy({} as T, {
    get: (_target, key) => (read() as Record<PropertyKey, unknown>)[key],
    has: (_target, key) => key in read(),
    ownKeys: () => Reflect.ownKeys(read()),
    getOwnPropertyDescriptor: (_target, key) => {
      const descriptor = Object.getOwnPropertyDescriptor(read(), key);
      return descriptor ? { ...descriptor, configurable: true } : undefined;
    },
  });
}

/** 数组版本的实时代理，方法需要绑定到真实数组上才能正常工作。 */
export function liveArray<T>(read: () => T[]): T[] {
  return new Proxy([] as unknown as T[], {
    get: (_target, key) => {
      const source = read();
      const value = (source as unknown as Record<PropertyKey, unknown>)[key];
      return typeof value === 'function' ? (value as (...args: unknown[]) => unknown).bind(source) : value;
    },
    has: (_target, key) => key in read(),
    ownKeys: () => Reflect.ownKeys(read()),
    getOwnPropertyDescriptor: (_target, key) => {
      const descriptor = Object.getOwnPropertyDescriptor(read(), key);
      return descriptor ? { ...descriptor, configurable: true } : undefined;
    },
  });
}
