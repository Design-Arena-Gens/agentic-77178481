import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@napi-rs/canvas",
    "google-trends-api",
    "ffmpeg-static",
  ],
};

export default nextConfig;
