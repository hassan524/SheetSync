import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:3001",
        "localhost:3000",
        "*.replit.dev",
        "*.replit.dev:*",
        "*.pike.replit.dev",
        "*.pike.replit.dev:*",
        "*.repl.co",
        "*.repl.co:*",
        "why-latrine-swizzle.ngrok-free.dev",
      ],
    },
  },
  allowedDevOrigins: [
    "*.replit.dev",
    "*.pike.replit.dev",
    "*.repl.co",
    "why-latrine-swizzle.ngrok-free.dev",
  ],
};

export default nextConfig;
