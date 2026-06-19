import dynamic from "next/dynamic";
import { generateSEO } from "@/lib/seo/metadata";
import { getSharedWithMeSheets } from "@/lib/querys/sheets/sheets";
import { FileSpreadsheet, Info, Share2, UserCheck } from "lucide-react";

const DashboardLayout = dynamic(
  () => import("@/components/layout/Dashboard-layout"),
);
const SharedWithMeList = dynamic(
  () => import("@/components/individual/shared/Shared-with-me-list"),
);

export const metadata = generateSEO({
  title: "Shared",
  description:
    "View sheets shared directly with you, separate from organization workspaces.",
  path: "/shared-with-me",
});

export default async function SharedWithMePage() {
  const sharedSheets = await getSharedWithMeSheets();
  const editableCount = sharedSheets.filter(
    (sheet: any) => sheet.sharedRole === "editor" || sheet.sharedRole === "admin",
  ).length;

  return (
    <DashboardLayout breadcrumbItems={["SheetSync", "Shared"]}>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Share2 className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-0.5 truncate">
              <h1 className="text-lg sm:text-xl font-semibold tracking-tight truncate">
                Shared
              </h1>
              <p className="text-[11px] sm:text-xs text-muted-foreground truncate">
                Sheets shared directly with you, without organization workspaces
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3">
          <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <p className="text-xs text-muted-foreground">
            This page only shows direct sheet shares. Organization sheets stay in
            their organization views.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            {
              label: "Shared Total",
              value: sharedSheets.length,
              icon: Share2,
              description: "Direct sheet shares",
            },
            {
              label: "Can Edit",
              value: editableCount,
              icon: UserCheck,
              description: "Editor access",
            },
            {
              label: "View Only",
              value: sharedSheets.length - editableCount,
              icon: FileSpreadsheet,
              description: "Viewer access",
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

        <SharedWithMeList sheets={sharedSheets} />
      </div>
    </DashboardLayout>
  );
}
