import { generateSEO } from "@/lib/seo/metadata";
import LandingWrapper from "@/components/individual/landing/Landing-wrapper";

export const metadata = generateSEO({
  title: "SheetSync — Real-Time Collaborative Spreadsheets",
  description:
    "SheetSync is a cloud spreadsheet platform with live collaboration, 100+ formulas, ready-made templates, team organizations, and full import/export — all in one workspace.",
  path: "/",
  ogImage: "/og-image.png",
});

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "SheetSync",
    description:
      "Cloud spreadsheets built for real-time collaboration. Formulas, templates, organizations — all in one beautiful workspace.",
    applicationCategory: "ProductivityApplication",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingWrapper />
    </>
  );
}