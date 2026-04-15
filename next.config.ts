import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  env: {
    NEXT_PUBLIC_AI_WORKER_URL: process.env.WORKER_URL ?? "",
  },
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
