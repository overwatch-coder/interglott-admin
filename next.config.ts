import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  serverExternalPackages: ["argon2"],
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
