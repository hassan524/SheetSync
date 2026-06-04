import dynamic from "next/dynamic";
import { FileSpreadsheet, ShieldCheck, Sparkles, UploadCloud } from "lucide-react";
import { generateSEO } from "@/lib/seo/metadata";

const DashboardLayout = dynamic(
  () => import("@/components/layout/Dashboard-layout"),
);

export const metadata = generateSEO({
  title: "Import - Coming Soon",
  description:
    "Spreadsheet import is temporarily disabled while SheetSync prepares realistic Excel and CSV importing.",
  path: "/import",
});

const ImportPage = async () => {
  return (
    <DashboardLayout breadcrumbItems={["SheetSync", "Import"]}>
      <div className="mx-auto flex min-h-[calc(100vh-170px)] max-w-4xl items-center justify-center px-4 py-10">
        <section className="w-full rounded-lg border border-dashed border-border bg-card p-6 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <UploadCloud className="h-6 w-6 text-primary" />
            </div>

            <div className="min-w-0 flex-1 space-y-4">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-md border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                  <Sparkles className="h-3.5 w-3.5" />
                  Import is temporarily disabled
                </div>
                <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
                  Real Excel import is in progress
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  I am working on making this realistic so users can import real
                  Excel and CSV files into SheetSync without losing sheet data,
                  formulas, formatting, or workspace context. Uploads are paused
                  for now while that flow is being finished.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-md border border-border bg-background p-3">
                  <FileSpreadsheet className="mb-2 h-4 w-4 text-primary" />
                  <p className="text-sm font-medium">Excel files</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    XLSX and XLS parsing with real workbook data.
                  </p>
                </div>
                <div className="rounded-md border border-border bg-background p-3">
                  <ShieldCheck className="mb-2 h-4 w-4 text-primary" />
                  <p className="text-sm font-medium">Safe imports</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Files will create a SheetSync copy, not modify originals.
                  </p>
                </div>
                <div className="rounded-md border border-border bg-background p-3">
                  <UploadCloud className="mb-2 h-4 w-4 text-primary" />
                  <p className="text-sm font-medium">Coming back soon</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    The upload control will return after the import flow is stable.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
};

export default ImportPage;
