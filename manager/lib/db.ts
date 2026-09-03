import mysql from 'mysql2/promise';

/**
 * MySQL 连接池（服务端专用）。
 * 博客端对数据库是只读的，写入统一由管理端后台 API 负责。
 */

type GlobalWithPool = typeof globalThis & { __XH_MYSQL_POOL__?: mysql.Pool };

function createPool(): mysql.Pool {
  return mysql.createPool({
    host: process.env.MYSQL_HOST ?? 'mysql',
    port: Number(process.env.MYSQL_PORT ?? 3306),
    user: process.env.MYSQL_USER ?? 'xhblogs',
    password: process.env.MYSQL_PASSWORD ?? '',
    database: process.env.MYSQL_DATABASE ?? 'xhblogs',
    charset: 'utf8mb4',
    waitForConnections: true,
    connectionLimit: Number(process.env.MYSQL_POOL_SIZE ?? 8),
    maxIdle: 4,
    idleTimeout: 60_000,
    enableKeepAlive: true,
    // DATETIME 直接返回 'YYYY-MM-DD HH:mm:ss' 字符串，避免时区漂移
    dateStrings: true,
  });
}

export function pool(): mysql.Pool {
  const g = globalThis as GlobalWithPool;
  if (!g.__XH_MYSQL_POOL__) {
    g.__XH_MYSQL_POOL__ = createPool();
  }
  return g.__XH_MYSQL_POOL__;
}

/** 查询失败时返回空数组而不是让整页 500，博客端可用性优先。 */
export async function query<T = Record<string, unknown>>(
  sql: string,
  params: ReadonlyArray<string | number | boolean | null> = [],
): Promise<T[]> {
  try {
    const [rows] = await pool().execute(sql, params as any[]);
    return rows as T[];
  } catch (error) {
    console.error('[db] 查询失败：', sql, error);
    return [];
  }
}

export async function queryOne<T = Record<string, unknown>>(
  sql: string,
  params: ReadonlyArray<string | number | boolean | null> = [],
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * MySQL 的 JSON 列行为不统一：mysql2 对原生 JSON 类型会自动解析，
 * 而 MariaDB 的 JSON（LONGTEXT 别名）或旧版驱动可能原样返回字符串。
 * 这里把两种情况都收敛掉——已经是对象就直接用，是字符串就尝试解析，
 * 解析不了说明它本来就是普通字符串，原样返回而不是丢弃。
 */
export function parseJsonColumn<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined) return fallback;

  if (value instanceof Buffer) {
    return parseJsonColumn(value.toString('utf8'), fallback);
  }

  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as unknown as T;
    }
  }

  return value as T;
}
