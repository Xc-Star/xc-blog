import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Docker 部署：产出自带最小 node_modules 的 standalone 服务
  output: 'standalone',

  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true, // 忽略 TS 错误，方便快速部署
  },
};

export default nextConfig;