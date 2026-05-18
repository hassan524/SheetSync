import dynamic from "next/dynamic";
import { generateSEO } from "@/lib/seo/metadata";
import { getStarredSheets } from "@/lib/querys/sheets/sheets";
const DashboardLayout = dynamic(
  () => import("@/components/layout/Dashboard-layout"),
);
const StarredList = dynamic(
  () => import("@/components/individual/starred/Starred-list"),
);
import { Star, FileSpreadsheet, Building2, Info } from "lucide-react";

export const metadata = generateSEO({
  title: "Starred — Quick Access",
  description:
    "Access your most important spreadsheets instantly. View and manage all sheets you've starred across personal folders and organizations.",
  path: "/starred",
});

export default async function StarredPage() {
  const starredSheets = await getStarredSheets();

  const orgCount = starredSheets.filter((s) => s.isOrganization).length;
  const personalCount = starredSheets.length - orgCount;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "SheetSync - Starred Sheets",
    description:
      "Quick access to your most important spreadsheets, starred across all workspaces.",
    applicationCategory: "ProductivityApplication",
    operatingSystem: "Web",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <DashboardLayout breadcrumbItems={["SheetSync", "Starred"]}>
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Page Header */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center flex-shrink-0">
                <Star className="h-5 w-5 text-amber-500 fill-amber-400" />
              </div>
              <div className="space-y-0.5 truncate">
                <h1 className="text-lg sm:text-xl font-semibold tracking-tight truncate">
                  Starred
                </h1>
                <p className="text-[11px] sm:text-xs text-muted-foreground truncate">
                  Sheets you&apos;ve marked as important — quick access to what
                  matters most
                </p>
              </div>
            </div>
          </div>

          {/* Info Banner */}
          <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3">
            <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              Star any sheet from the sheet editor or right-click menu to pin it
              here. Starred sheets appear across your personal folders and
              organizations.
            </p>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              {
                label: "Starred Total",
                value: starredSheets.length,
                icon: Star,
                description: "Sheets you've starred",
              },
              {
                label: "Personal",
                value: personalCount,
                icon: FileSpreadsheet,
                description: "From personal folders",
              },
              {
                label: "Organization",
                value: orgCount,
                icon: Building2,
                description: "From organizations",
              },
            ].map(({ label, value, icon: Icon, description }) => (
              <div
                key={label}
                className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-3"
              >
                <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-bold leading-none">{value}</p>
                  <p className="text-xs font-medium text-foreground mt-0.5 truncate">
                    {label}
                  </p>
                  <p className="text-[10px] text-muted-foreground hidden sm:block truncate">
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <StarredList starredSheets={starredSheets} />
        </div>
      </DashboardLayout>
    </>
  );
}
