import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    // Surface type errors at build time (was true during scaffolding).
    // tsc --noEmit is clean, so this is safe to enforce now.
    ignoreBuildErrors: false,
  },
  reactStrictMode: false,
};

export default nextConfig;
