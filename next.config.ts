import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The e2e suite builds into its own directory beside a running dev server.
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
