import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The e2e suite builds into its own directory beside a running dev server.
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  // Images come from arbitrary IIIF hosts and are shown at thumbnail size, so
  // the optimiser is off; enabled with open remotePatterns it is a public proxy.
  images: { unoptimized: true },
};

export default nextConfig;
