import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // The demo has no ESLint setup; type-checking still runs during `next build`.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
