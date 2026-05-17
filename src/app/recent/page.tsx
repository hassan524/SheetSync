import dynamic from "next/dynamic";
import { generateSEO } from "@/lib/seo/metadata";
import { getRecentSheets } from "@/lib/querys/sheets/sheets";
const DashboardLayout = dynamic(
  () => import("@/components/layout/Dashboard-layout"),
);
const RecentList = dynamic(
  () => import("@/components/individual/recent/Recent-list"),
);
import { Clock, FileSpreadsheet, Info } from "lucide-react";

export const metadata = generateSEO({
  title: "Recent — Activity",
  description:
    "View your most recently opened and edited spreadsheets across all your organizations and personal folders.",
  path: "/recent",
});

export default async function RecentPage() {
  const recentSheets = await getRecentSheets();

  // Capture now once on the server — this is an async server component, not a re-rendering client component

  const now = Date.now(); // eslint-disable-line react-hooks/purity

  const last7Days =
    recentSheets?.filter((s: any) => {
      const d = new Date(s.updated_at || s.created_at);
      return now - d.getTime() < 7 * 24 * 60 * 60 * 1000;
    }).length ?? 0;

  const last24Hours =
    recentSheets?.filter((s: any) => {
      const d = new Date(s.updated_at || s.created_at);
      return now - d.getTime() < 24 * 60 * 60 * 1000;
    }).length ?? 0;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "SheetSync - Recent",
    description: "View your most recently opened and edited spreadsheets.",
    applicationCategory: "ProductivityApplication",
    operatingSystem: "Web",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <DashboardLayout breadcrumbItems={["SheetSync", "Recent"]}>
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Page Header */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-5 min-w-0">
              <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-0.5 truncate">
                <h1 className="text-lg sm:text-xl font-semibold tracking-tight truncate">
                  Recent
                </h1>
                <p className="text-[11px] sm:text-xs text-muted-foreground truncate">
                  Sheets you&apos;ve recently opened or edited
                </p>
              </div>
            </div>
          </div>

          {/* Info Banner */}
          <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3">
            <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">
                About Recent Activity
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                This page shows spreadsheets you&apos;ve opened or modified in
                the last 30 days — across your personal folders and all your
                organizations. Sheets are sorted by most recently accessed.
              </p>
            </div>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              {
                label: "Total Recent",
                value: recentSheets?.length ?? 0,
                icon: Clock,
                description: "Sheets opened recently",
              },
              {
                label: "Last 7 Days",
                value: last7Days,
                icon: FileSpreadsheet,
                description: "Active in this week",
              },
              {
                label: "Last 24 Hours",
                value: last24Hours,
                icon: FileSpreadsheet,
                description: "Modified today",
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

          <RecentList recentSheets={recentSheets} />
        </div>
      </DashboardLayout>
    </>
  );
}
