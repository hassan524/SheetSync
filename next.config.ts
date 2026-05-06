import type { NextConfig } from "next";

const devDomain = process.env.REPLIT_DEV_DOMAIN || "";

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
        ...(devDomain ? [devDomain, `${devDomain}:*`] : []),
      ],
    },
  },
  allowedDevOrigins: [
    "*.replit.dev",
    "*.pike.replit.dev",
    "*.repl.co",
    "why-latrine-swizzle.ngrok-free.dev",
    ...(devDomain ? [devDomain] : []),
  ],
  webpack: (config) => {
    config.output = config.output || {};
    config.output.chunkLoadTimeout = 120000;
    return config;
  },
};

export default nextConfig;
