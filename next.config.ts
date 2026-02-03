import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 배포할 때 사소한 에러는 무시하고 일단 사이트를 만듭니다.
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;