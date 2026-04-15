import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  env: {
    NEXT_PUBLIC_AI_WORKER_URL: process.env.WORKER_URL ?? "",
  },
};

export default nextConfig;
