"use client";

import { useState } from "react";
import TemplateCard from "@/components/sheets/Template-card";
import UseTemplateModal from "@/components/sheets/Use-template-modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Sparkles,
  BarChart3,
  Calendar,
  Clock,
  Globe,
  Layers,
  MessageSquare,
  PieChart,
  ShoppingCart,
  Target,
  Truck,
  Workflow,
  Zap,
} from "lucide-react";
import { LucideIcon } from "lucide-react";

interface Template {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: LucideIcon;
  bgColor: string;
  color: string;
  features: string[];
}

interface TemplatesListProps {
  templates: Template[];
  categories: string[];
}

const comingSoonTemplates = [
  {
    id: "cs-1",
    icon: BarChart3,
    title: "KPI Dashboard",
    description: "Track key performance indicators across your business with visual summaries.",
    category: "Analytics",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    id: "cs-2",
    icon: Calendar,
    title: "Content Calendar",
    description: "Plan and schedule content across channels with deadlines and status tracking.",
    category: "Marketing",
    color: "text-pink-600",
    bg: "bg-pink-50",
  },
  {
    id: "cs-3",
    icon: Truck,
    title: "Supply Chain Tracker",
    description: "Monitor suppliers, orders, delivery timelines, and inventory in one view.",
    category: "Operations",
    color: "text-orange-600",
    bg: "bg-orange-50",
  },
  {
    id: "cs-4",
    icon: Target,
    title: "OKR Planner",
    description: "Set and track objectives and key results at team or company level.",
    category: "Strategy",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    id: "cs-5",
    icon: PieChart,
    title: "Financial Forecast",
    description: "Model revenue, costs, and growth scenarios with automated projections.",
    category: "Finance",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    id: "cs-6",
    icon: ShoppingCart,
    title: "E-commerce Tracker",
    description: "Track products, orders, returns, and revenue for your online store.",
    category: "Sales",
    color: "text-yellow-700",
    bg: "bg-yellow-50",
  },
  {
    id: "cs-7",
    icon: Globe,
    title: "Market Research",
    description: "Compile competitor data, customer insights, and market sizing analysis.",
    category: "Research",
    color: "text-indigo-600",
    bg: "bg-indigo-50",
  },
  {
    id: "cs-8",
    icon: Workflow,
    title: "Sprint Planner",
    description: "Manage agile sprints, story points, velocity, and team workload.",
    category: "Product",
    color: "text-violet-600",
    bg: "bg-violet-50",
  },
  {
    id: "cs-9",
    icon: MessageSquare,
    title: "Customer Feedback",
    description: "Collect, categorize, and prioritize feedback from users and customers.",
    category: "Customer Success",
    color: "text-teal-600",
    bg: "bg-teal-50",
  },
  {
    id: "cs-10",
    icon: Clock,
    title: "Time Tracker",
    description: "Log hours per project and client, calculate billing rates automatically.",
    category: "Operations",
    color: "text-slate-600",
    bg: "bg-slate-50",
  },
  {
    id: "cs-11",
    icon: Layers,
    title: "Product Roadmap",
    description: "Visualize features across quarters with priority, status, and team assignment.",
    category: "Product",
    color: "text-cyan-600",
    bg: "bg-cyan-50",
  },
  {
    id: "cs-12",
    icon: Zap,
    title: "Event Planning",
    description: "Organize tasks, vendors, budgets, and guest lists for any event.",
    category: "General",
    color: "text-rose-600",
    bg: "bg-rose-50",
  },
];

const TemplatesList = ({ templates, categories }: TemplatesListProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  const filtered = templates.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || t.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleTemplateClick = (id: string) => {
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

      {/* Coming Soon Templates */}
      {(!searchQuery || comingSoonTemplates.some((t) =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase())
      )) && (
        <div className="mt-12 space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <div className="flex items-center gap-2 text-muted-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">More templates coming soon</span>
            </div>
            <div className="flex-1 h-px bg-border" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {comingSoonTemplates
              .filter((t) =>
                !searchQuery ||
                t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                t.description.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((template) => {
                const Icon = template.icon;
                return (
                  <div
                    key={template.id}
                    className="relative rounded-xl border border-border bg-muted/20 p-4 opacity-60 cursor-not-allowed select-none"
                  >
                    <Badge
                      variant="outline"
                      className="absolute top-3 right-3 text-[10px] font-semibold border-primary/30 text-primary bg-primary/5"
                    >
                      Coming Soon
                    </Badge>
                    <div className={`h-9 w-9 rounded-lg ${template.bg} flex items-center justify-center mb-3`}>
                      <Icon className={`h-5 w-5 ${template.color}`} />
                    </div>
                    <p className="text-sm font-semibold text-foreground mb-1">{template.title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{template.description}</p>
                    <div className="mt-3 pt-3 border-t border-border/50">
                      <span className="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        {template.category}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
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
