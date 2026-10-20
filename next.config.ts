import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep unrelated lockfiles above this checkout out of Turbopack's workspace.
  turbopack: { root: __dirname },
};

export default nextConfig;
