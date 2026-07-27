import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/me",
  assetPrefix: "/me",
  trailingSlash: true,
  images: {
    unoptimized: true,
    remotePatterns: [{ hostname: "avatars.githubusercontent.com" }],
  },
};

export default nextConfig;
