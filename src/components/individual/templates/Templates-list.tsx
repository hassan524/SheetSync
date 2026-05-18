"use client";

import { useState } from "react";
import TemplateCard from "@/components/sheets/Template-card";
import UseTemplateModal from "@/components/sheets/Use-template-modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

const ACTIVE_TEMPLATE_TITLES = new Set([
  "Blank Sheet",
  "Finance Tracker",
  "QA Tracker",
  "Project Tracker",
]);

interface Template {
  id: string;
  title: string;
  description: string;
  category: string;

  // ✅ FIXED: use string instead of LucideIcon
  iconName: string;

  bgColor: string;
  color: string;
  features: string[];
}

interface TemplatesListProps {
  templates: Template[];
  categories: string[];
}

const TemplatesList = ({ templates, categories }: TemplatesListProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null,
  );

  const filtered = templates.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === "All" || t.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleTemplateClick = (id: string) => {
    const template = templates.find((t) => t.id === id);
    if (!template || !ACTIVE_TEMPLATE_TITLES.has(template.title)) return;

    setSelectedTemplateId(id);
    setTemplateModalOpen(true);
  };

  return (
    <>
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
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((template) => (
            <div
              key={template.id}
              onClick={() => handleTemplateClick(template.id)}
              className={
                ACTIVE_TEMPLATE_TITLES.has(template.title)
                  ? "cursor-pointer"
                  : "cursor-not-allowed"
              }
            >
              {/* 🔥 FIX: convert iconName → icon */}
              <TemplateCard
                id={template.id}
                title={template.title}
                description={template.description}
                iconName={template.iconName}
                color={template.color}
                features={template.features}
                disabled={!ACTIVE_TEMPLATE_TITLES.has(template.title)}
              />
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
            Try a different search term or browse by category.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("All");
            }}
          >
            Clear filters
          </Button>
        </div>
      )}

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
    </>
  );
};

export default TemplatesList;
