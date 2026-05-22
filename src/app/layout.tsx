import type { Metadata, Viewport } from "next";
import "./app.css";
import "./index.css";
import { Providers } from "@/layout/providers";
import { Toaster } from "sonner";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://sheetsync.app";

export const viewport: Viewport = {
  themeColor: "#0d7c5f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "SheetSync — Real-Time Collaborative Spreadsheets",
    template: "%s | SheetSync",
  },
  description:
    "SheetSync is a cloud spreadsheet platform with real-time collaboration, 100+ formulas, templates, team organizations, and full import/export — all in one workspace.",
  keywords: [
    "spreadsheet",
    "collaborative spreadsheet",
    "real-time collaboration",
    "google sheets alternative",
    "online spreadsheet",
    "team spreadsheet",
    "formula spreadsheet",
  ],
  authors: [{ name: "SheetSync" }],
  creator: "SheetSync",
  publisher: "SheetSync",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: APP_URL,
    siteName: "SheetSync",
    title: "SheetSync — Real-Time Collaborative Spreadsheets",
    description:
      "Real-time collaboration, 100+ formulas, templates, and team workspaces. The smarter spreadsheet for modern teams.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "SheetSync — Collaborative Spreadsheets",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SheetSync — Real-Time Collaborative Spreadsheets",
    description:
      "Real-time collaboration, 100+ formulas, templates, and team workspaces.",
    images: ["/og-image.png"],
  },
  manifest: "/manifest.json",
  icons: {
    icon: [{ url: "/icon.png", type: "image/png" }],
    apple: [{ url: "/icon.png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SheetSync",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="SheetSync" />
      </head>
      <body>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#ffffff",
              border: "none",
              boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
              color: "#1a1a1a",
              fontSize: "13px",
              fontFamily: "Manrope, sans-serif",
            },
          }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}