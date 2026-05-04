import { generateSEO } from "@/lib/seo/metadata";
import { getRecentSheets } from "@/lib/querys/sheets/sheets";
import DashboardLayout from "@/components/layout/Dashboard-layout";
import RecentList from "@/components/individual/recent/Recent-list";
import { Clock, FileSpreadsheet, Info } from "lucide-react";

export const metadata = generateSEO({
  title: "Recent Sheets | SheetSync",
  description:
    "View your most recently opened and edited spreadsheets across all your organizations and personal folders.",
  path: "/recent",
});

export default async function RecentPage() {
  const recentSheets = await getRecentSheets();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "SheetSync - Recent",
    description:
      "View your most recently opened and edited spreadsheets.",
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">Recent</h1>
                <p className="text-sm text-muted-foreground">
                  Sheets you&apos;ve recently opened or edited
                </p>
              </div>
            </div>
          </div>

          {/* Info Banner */}
          <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3">
            <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">About Recent Activity</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                This page shows spreadsheets you&apos;ve opened or modified in the last 30 days — across your personal folders and all your organizations. Sheets are sorted by most recently accessed.
              </p>
            </div>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                label: "Total Recent",
                value: recentSheets?.length ?? 0,
                icon: Clock,
                description: "Sheets opened recently",
              },
              {
                label: "Last 7 Days",
                value: recentSheets?.filter((s: any) => {
                  const d = new Date(s.updated_at || s.created_at);
                  return Date.now() - d.getTime() < 7 * 24 * 60 * 60 * 1000;
                }).length ?? 0,
                icon: FileSpreadsheet,
                description: "Active in this week",
              },
              {
                label: "Last 24 Hours",
                value: recentSheets?.filter((s: any) => {
                  const d = new Date(s.updated_at || s.created_at);
                  return Date.now() - d.getTime() < 24 * 60 * 60 * 1000;
                }).length ?? 0,
                icon: FileSpreadsheet,
                description: "Modified today",
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

          <RecentList recentSheets={recentSheets} />
        </div>
      </DashboardLayout>
    </>
  );
}
