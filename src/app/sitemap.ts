import type { MetadataRoute } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://sheetsync.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    { path: "/", priority: 1 },
    { path: "/templates", priority: 0.8 },
    { path: "/import", priority: 0.6 },
  ];

  return routes.map((route) => ({
    url: `${APP_URL}${route.path === "/" ? "" : route.path}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: route.priority,
  }));
}

