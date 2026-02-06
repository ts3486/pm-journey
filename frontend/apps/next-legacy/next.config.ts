import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: [
    "@pm-journey/types",
    "@pm-journey/ui",
    "@pm-journey/hooks",
    "@pm-journey/config",
    "@pm-journey/storage",
  ],
  experimental: {
    // Disable Turbopack's filesystem cache to avoid SST write errors in dev.
    turbopackFileSystemCacheForDev: false,
    // Work around missing dev manifests in isolated dev builds.
    isolatedDevBuild: false,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
