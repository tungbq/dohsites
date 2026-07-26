import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/dohsites",
  assetPrefix: "/dohsites",
  trailingSlash: true,
  images: {
    unoptimized: true,
    remotePatterns: [{ hostname: "avatars.githubusercontent.com" }],
  },
};

export default nextConfig;
