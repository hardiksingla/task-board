import type { NextConfig } from "next";

const nextConfig = {
  images: {
    domains: ['lh3.googleusercontent.com'],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}

export default nextConfig;
