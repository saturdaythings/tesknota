import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  env: {
    NEXT_PUBLIC_SUPABASE_URL: "https://tofzctbkxuzvwirgobgh.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "sb_publishable_AbwvJKX2ToPy6VpfHjaB7w_Ot28lISQ",
    NEXT_PUBLIC_USER_KIANA_EMAIL: "kianamicari1@gmail.com",
    NEXT_PUBLIC_USER_SYLVIA_EMAIL: "sylvia.m.safin@gmail.com",
    NEXT_PUBLIC_AI_WORKER_URL: process.env.WORKER_URL ?? "",
  },
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
