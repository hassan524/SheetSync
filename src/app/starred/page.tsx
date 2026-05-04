import { generateSEO } from "@/lib/seo/metadata";
import { getStarredSheets } from "@/lib/querys/sheets/sheets";
import DashboardLayout from "@/components/layout/Dashboard-layout";
import StarredList from "@/components/individual/starred/Starred-list";
import { Star, FileSpreadsheet, Building2, Info } from "lucide-react";

export const metadata = generateSEO({
  title: "Starred Sheets | SheetSync",
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center flex-shrink-0">
                <Star className="h-5 w-5 text-amber-500 fill-amber-400" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">Starred</h1>
                <p className="text-sm text-muted-foreground">
                  Sheets you&apos;ve marked as important — quick access to what matters most
                </p>
              </div>
            </div>
          </div>

          {/* Info Banner */}
          <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3">
            <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              Star any sheet from the sheet editor or right-click menu to pin it here. Starred sheets appear across your personal folders and organizations.
            </p>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
              >
                <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-lg font-bold leading-none">{value}</p>
                  <p className="text-xs font-medium text-foreground mt-0.5">{label}</p>
                  <p className="text-[11px] text-muted-foreground">{description}</p>
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
