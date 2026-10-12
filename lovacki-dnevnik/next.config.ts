import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Oznaka verzije: aplikacija s početnog zaslona po njoj prepoznaje da je objavljena nova verzija.
  env: {
    NEXT_PUBLIC_VERZIJA: (process.env.VERCEL_GIT_COMMIT_SHA ?? "").slice(0, 12) || String(Date.now()),
  },
  experimental: {
    viewTransition: true,
  },
};

export default nextConfig;
