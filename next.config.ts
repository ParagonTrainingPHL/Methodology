import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Tracker workbooks are uploaded through a server action, and the default
    // 1MB cap rejects them once a few clients have a season of history.
    serverActions: {
      bodySizeLimit: "16mb",
    },
  },
};

export default nextConfig;
