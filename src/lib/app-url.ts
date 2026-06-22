const stripTrailingSlash = (value: string) => value.replace(/\/+$/, "");

export function getConfiguredAppOrigin() {
  return stripTrailingSlash(
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_PROD_APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "",
  );
}

export function getCurrentAppOrigin(): string {
  if (typeof window !== "undefined") {
    const { protocol, hostname, port } = window.location;
    const host = hostname === "0.0.0.0" ? "localhost" : hostname;
    return `${protocol}//${host}${port ? `:${port}` : ""}`;
  }
  return process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export function buildAppUrl(path = "") {
  const origin = getConfiguredAppOrigin();
  const safePath = path.startsWith("/") ? path : `/${path}`;
  return `${origin}${safePath}`;
}
