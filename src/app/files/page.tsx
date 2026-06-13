import dynamic from "next/dynamic";
import { generateSEO } from "@/lib/seo/metadata";
import { getAllSheets } from "@/lib/querys/sheets/sheets";
const DashboardLayout = dynamic(
  () => import("@/components/layout/Dashboard-layout"),
);
const FilesList = dynamic(
  () => import("@/components/individual/files/Files-list"),
);
import { Folder, Info, FileSpreadsheet, Star, Users } from "lucide-react";

export const metadata = generateSEO({
  title: "All Files — Browse Spreadsheets",
  description:
    "Browse every spreadsheet you own or collaborate on — sheets and organizational — in one unified view.",
  path: "/files",
});

export default async function AllFilesPage() {
  const allSheets = await getAllSheets();

  const starredCount = allSheets?.filter((s: any) => s.is_starred).length ?? 0;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "SheetSync - All Files",
    description: "Browse and manage all your spreadsheets in one place.",
    applicationCategory: "ProductivityApplication",
    operatingSystem: "Web",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <DashboardLayout breadcrumbItems={["SheetSync", "All Files"]}>
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Folder className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-0.5 min-w-0">
                <h1 className="text-lg sm:text-xl font-semibold tracking-tight truncate">
                  All Files
                </h1>
                <p className="text-[11px] sm:text-xs text-muted-foreground truncate">
                  Every spreadsheet you own or have access to — in one place
                </p>
              </div>
            </div>
          </div>

          {/* Info Banner */}
          <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3">
            <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              All Files shows every spreadsheet you own or have access to, across your sheets and organizations.
              Use the search to quickly find what you need.
            </p>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                label: "Total Files",
                value: allSheets?.length ?? 0,
                icon: FileSpreadsheet,
                description: "All your spreadsheets",
              },
              {
                label: "Starred",
                value: starredCount,
                icon: Star,
                description: "Marked as important",
              },
              {
                label: "Shared",
                value:
                  allSheets?.filter((s: any) => s.organization_id).length ?? 0,
                icon: Users,
                description: "In organizations",
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
                  <p className="text-xs font-medium text-foreground mt-0.5">
                    {label}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <FilesList sheets={allSheets ?? []} />
        </div>
      </DashboardLayout>
    </>
  );
}

