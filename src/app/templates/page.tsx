import dynamic from "next/dynamic";
import { generateSEO } from "@/lib/seo/metadata";
const DashboardLayout = dynamic(
  () => import("@/components/layout/Dashboard-layout"),
);
const TemplatesList = dynamic(
  () => import("@/components/individual/templates/Templates-list"),
);
import { LayoutTemplate, Sparkles, Info } from "lucide-react";
import { SHEET_TEMPLATES } from "../../constants/Sheet-templates";

export const metadata = generateSEO({
  title: "Templates — Get Started Fast",
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
        <div className="max-w-7xl mx-auto space-y-10 md:space-y-12">
          {/* Page Header */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <LayoutTemplate className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-0.5 truncate">
                <h1 className="text-lg sm:text-xl font-semibold tracking-tight truncate">
                  Templates
                </h1>
                <p className="text-[11px] sm:text-xs text-muted-foreground truncate">
                  Start quickly with professionally designed spreadsheet
                  templates
                </p>
              </div>
            </div>
          </div>

          {/* Info Banner */}
          <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3">
            <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              Templates are ready-to-use spreadsheets pre-configured with
              columns, formulas, and structure. Click any template to preview
              it, then create a new sheet from it instantly.
            </p>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-3">
              <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-lg font-bold leading-none">
                  {SHEET_TEMPLATES.length}
                </p>
                <p className="text-xs font-medium text-foreground mt-0.5 truncate">
                  Total Templates
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-3">
              <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <LayoutTemplate className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-lg font-bold leading-none">
                  {categories.length - 1}
                </p>
                <p className="text-xs font-medium text-foreground mt-0.5 truncate">
                  Categories
                </p>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card px-3 py-3 col-span-2 flex items-center">
              <div>
                <p className="text-xs font-medium text-foreground mb-1">
                  How to use
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  Browse templates below, click one to preview, then choose a
                  folder to save it in. Your new sheet will be pre-filled and
                  ready to edit.
                </p>
              </div>
            </div>
          </div>

          <TemplatesList
            templates={SHEET_TEMPLATES as any}
            categories={categories}
          />
        </div>
      </DashboardLayout>
    </>
  );
}

