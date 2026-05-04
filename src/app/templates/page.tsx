"use client";

import { useState } from "react";
import DashboardLayout from "@/components/layout/Dashboard-layout";
import TemplateCard from "@/components/sheets/Template-card";
import UseTemplateModal from "@/components/sheets/Use-template-modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Sparkles, Info, LayoutTemplate } from "lucide-react";
import { SHEET_TEMPLATES } from "../../constants/Sheet-templates";

const categories = [
  "All",
  ...Array.from(new Set(SHEET_TEMPLATES.map((t) => t.category))),
];

const TemplatesPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  const filteredTemplates = SHEET_TEMPLATES.filter((template) => {
    const matchesSearch =
      template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleTemplateClick = (templateId: string) => {
    setSelectedTemplateId(templateId);
    setTemplateModalOpen(true);
  };

  return (
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

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search templates..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Templates Grid */}
        {filteredTemplates.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                onClick={() => handleTemplateClick(template.id)}
                className="cursor-pointer"
              >
                <TemplateCard {...template} />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-medium text-foreground">No templates found</p>
            <p className="text-sm text-muted-foreground max-w-xs">
              Try a different search term or browse by category using the filters above.
            </p>
            <Button variant="outline" size="sm" onClick={() => { setSearchQuery(""); setSelectedCategory("All"); }}>
              Clear filters
            </Button>
          </div>
        )}
      </div>

      {selectedTemplateId && (
        <UseTemplateModal
          open={templateModalOpen}
          onOpenChange={(open) => {
            setTemplateModalOpen(open);
            if (!open) setSelectedTemplateId(null);
          }}
          templateId={selectedTemplateId}
        />
      )}
    </DashboardLayout>
  );
};

export default TemplatesPage;
