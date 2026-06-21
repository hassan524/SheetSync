const stripTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const PROD_ORIGIN = "https://sheetsync.site";

export function getConfiguredAppOrigin() {
  return stripTrailingSlash(
    process.env.NEXT_PUBLIC_PROD_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    PROD_ORIGIN,
  );
}

// lib/app-url.ts
export function getCurrentAppOrigin(): string {
  return PROD_ORIGIN;
}

export function buildAppUrl(path = "") {
  const origin = getConfiguredAppOrigin();
  const safePath = path.startsWith("/") ? path : `/${path}`;

  return `${origin}${safePath}`;
}