import dynamic from "next/dynamic";
import { generateSEO } from "@/lib/seo/metadata";
import { getAllFolders } from "@/lib/querys/folder/folders";
const SheetsPageClient = dynamic(
  () => import("@/components/individual/Personalsheets/Personal-sheet-client"),
);

export const metadata = generateSEO({
  title: "Personal Sheets — My Workspace",
  description:
    "Organize, manage, and collaborate on your personal spreadsheets. Browse folders, filter sheets, and create new ones with ease.",
  path: "/sheets",
  ogImage: "/og/sheets-og.png",
});

export default async function SheetsPage() {
  const folders = await getAllFolders();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "SheetSync - Personal Sheets",
    description:
      "Manage and organize your personal spreadsheets in folders with collaboration features.",
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
      {/* Pass server-fetched data down as props */}
      <SheetsPageClient initialFolders={folders} />
    </>
  );
}

