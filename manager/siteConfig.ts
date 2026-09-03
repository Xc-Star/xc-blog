// siteConfig.ts — 全站“控制中心”
//
// 真实数据来自共享内容卷中的 site.config.json，由服务端在每次请求时读取并注入 globalThis，
// 客户端则通过 layout 注入的 <script> 拿到同一份快照。
// 这里导出的 siteConfig 是一个实时代理，因此全站原有的 `import { siteConfig }` 写法无需改动。

import defaults from './site.config.default.json';
import { getRuntime, liveObject } from './lib/runtimeStore';

export type SiteConfig = typeof defaults & Record<string, any>;

export const siteConfigDefaults = defaults as SiteConfig;

export const siteConfig: SiteConfig = liveObject<SiteConfig>(
  () => (getRuntime().site as SiteConfig | undefined) ?? siteConfigDefaults,
);
