"use client";

import { useState } from "react";
import DashboardLayout from "@/components/layout/Dashboard-layout";
import TemplateCard from "@/components/sheets/Template-card";
import UseTemplateModal from "@/components/sheets/Use-template-modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Sparkles } from "lucide-react";
import { SHEET_TEMPLATES } from "../../constants/Sheet-templates";

const categories = [
  "All",
  ...Array.from(new Set(SHEET_TEMPLATES.map((t) => t.category))),
];

const TemplatesPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null
  );

  const filteredTemplates = SHEET_TEMPLATES.filter((template) => {
    const matchesSearch =
      template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

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
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">Templates</h1>
              <p className="text-muted-foreground">
                Start quickly with pre-built spreadsheet templates
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-card border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Total Templates</p>
            <p className="text-2xl font-semibold">
              {SHEET_TEMPLATES.length}
            </p>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Categories</p>
            <p className="text-2xl font-semibold">
              {categories.length - 1}
            </p>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative max-w-md flex-1">
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
                variant={
                  selectedCategory === category ? "default" : "outline"
                }
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

        {filteredTemplates.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No templates found matching your criteria.
            </p>
          </div>
        )}
      </div>

      {/* Modal (only render when ID exists) */}
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