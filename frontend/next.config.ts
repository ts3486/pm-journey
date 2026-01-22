import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Disable Turbopack's filesystem cache to avoid SST write errors in dev.
    turbopackFileSystemCacheForDev: false,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
