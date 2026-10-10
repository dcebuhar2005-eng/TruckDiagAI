import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Aplikacija živi u podmapi repozitorija – ne miješati je s nadređenim projektom.
  turbopack: { root: path.join(__dirname) },
  outputFileTracingRoot: path.join(__dirname),
  experimental: {
    viewTransition: true,
  },
};

export default nextConfig;
