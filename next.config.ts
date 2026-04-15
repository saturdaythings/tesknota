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
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvZnpjdGJreHV6dndpcmdvYmdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyMDg4MzcsImV4cCI6MjA5MTc4NDgzN30.xd_9OnCNyAC4Mayvib7GhVO1-l-6wFTOHgnAypXgNzg",
    NEXT_PUBLIC_USER_KIANA_EMAIL: "kianamicari1@gmail.com",
    NEXT_PUBLIC_USER_SYLVIA_EMAIL: "sylvia.m.safin@gmail.com",
    NEXT_PUBLIC_AI_WORKER_URL: process.env.WORKER_URL ?? "",
  },
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
