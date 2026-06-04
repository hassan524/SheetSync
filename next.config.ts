import type { NextConfig } from "next";
import withPWA from "next-pwa";

const devDomain = process.env.REPLIT_DEV_DOMAIN;

const nextConfig: NextConfig = {
  compress: true,
  turbopack: {},

  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:3000",
        "localhost:3001",
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
    config.output = {
      ...config.output,
      chunkLoadTimeout: 120000,
    };
    return config;
  },
};

export default (withPWA({
  dest: "public",
  importScripts: ["/firebase-messaging-sw.js"],
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
}) as any)(nextConfig);
