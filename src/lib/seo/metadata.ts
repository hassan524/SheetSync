import { Metadata } from "next";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://sheetsync.app";

type SEOProps = {
  title: string;
  description: string;
  path?: string;
  ogImage?: string;
  noIndex?: boolean;
};

export function generateSEO({
  title,
  description,
  path = "/",
  ogImage = "/og-image.png",
  noIndex = false,
}: SEOProps): Metadata {
  const url = `${APP_URL}${path}`;

  return {
    title,
    description,
    metadataBase: new URL(APP_URL),
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "SheetSync",
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };
}
