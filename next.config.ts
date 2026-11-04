import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Every route is static: home, five service pages, 404.
  trailingSlash: true,
  // A package-lock.json in the parent folder would otherwise be picked up as the workspace root.
  turbopack: { root: process.cwd() },
};

export default nextConfig;
