import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Docker 部署：产出自带最小 node_modules 的 standalone 服务
  output: 'standalone',

  images: {
    unoptimized: true,
  },

  typescript: {
    ignoreBuildErrors: true,
  },

  // 注意：这里刻意不使用 rewrites 转发 /cms。
  // next.config 的 rewrites 会在构建期被固化进 routes-manifest，
  // 导致 CMS_INTERNAL_URL 在运行时改了也不生效。
  // 转发逻辑改由 app/cms/[...path]/route.ts 在请求期处理。
};

export default nextConfig;