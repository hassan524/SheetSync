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
      ],
    },
  },
  allowedDevOrigins: [
    "*.replit.dev",
    "*.pike.replit.dev",
    "*.repl.co",
  ],
};

export default nextConfig;
