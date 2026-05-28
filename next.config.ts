import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || undefined,
  serverExternalPackages: ["better-sqlite3"],
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
