import { generateSEO } from "@/lib/seo/metadata";
import DashboardLayout from "@/components/layout/Dashboard-layout";
import TemplatesList from "@/components/individual/templates/Templates-list";
import { LayoutTemplate, Sparkles, Info } from "lucide-react";
import { SHEET_TEMPLATES } from "../../constants/Sheet-templates";

export const metadata = generateSEO({
  title: "Templates | SheetSync",
  description:
    "Browse professionally designed spreadsheet templates. Start quickly with pre-configured columns, formulas, and structure.",
  path: "/templates",
});

export default function TemplatesPage() {
  const categories = [
    "All",
    ...Array.from(new Set(SHEET_TEMPLATES.map((t) => t.category))),
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "SheetSync - Templates",
    description:
      "Browse and use professionally designed spreadsheet templates for productivity.",
    applicationCategory: "ProductivityApplication",
    operatingSystem: "Web",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <DashboardLayout breadcrumbItems={["SheetSync", "Templates"]}>
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <LayoutTemplate className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">Templates</h1>
                <p className="text-sm text-muted-foreground">
                  Start quickly with professionally designed spreadsheet templates
                </p>
              </div>
            </div>
          </div>

          {/* Info Banner */}
          <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3">
            <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              Templates are ready-to-use spreadsheets pre-configured with columns, formulas, and structure. Click any template to preview it, then create a new sheet from it instantly.
            </p>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-border bg-card px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <p className="text-xs font-medium text-muted-foreground">Total Templates</p>
              </div>
              <p className="text-2xl font-bold">{SHEET_TEMPLATES.length}</p>
            </div>
            <div className="rounded-xl border border-border bg-card px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
                <LayoutTemplate className="h-3.5 w-3.5 text-primary" />
                <p className="text-xs font-medium text-muted-foreground">Categories</p>
              </div>
              <p className="text-2xl font-bold">{categories.length - 1}</p>
            </div>
            <div className="rounded-xl border border-border bg-card px-4 py-3 col-span-2 sm:col-span-2">
              <p className="text-xs font-medium text-muted-foreground mb-1">How to use</p>
              <p className="text-xs text-muted-foreground">
                Browse templates below, click one to preview, then choose a folder to save it in. Your new sheet will be pre-filled and ready to edit.
              </p>
            </div>
          </div>

          <TemplatesList templates={SHEET_TEMPLATES as any} categories={categories} />
        </div>
      </DashboardLayout>
    </>
  );
}
