"use client";

import React, { useState } from "react";
import { SHEET_TEMPLATES } from "@/constants/Sheet-templates";
import { useRouter } from "next/navigation";
import TemplateCard from "@/components/sheets/Template-card";
import { createSheet } from "@/lib/querys/sheets/sheets";
import { logActivity } from "@/lib/querys/activity/activity";
import { ArrowRight, LayoutTemplate } from "lucide-react";
import { toast } from "sonner";

const DASHBOARD_TEMPLATE_TITLES = [
  "Blank Sheet",
  "Finance Tracker",
  "QA Tracker",
  "Project Tracker",
];

const TemplatePicker = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleTemplateClick = async (templateId: string, templateTitle: string) => {
    if (loading) return;
    const toastId = toast.loading("Creating sheet from template...");
    try {
      setLoading(true);
      const createdSheet = await createSheet({
        name: "Untitled Sheet",
        templateId: templateId,
        markRecent: true,
      });

      await logActivity({
        sheetId: createdSheet.id,
        organizationId: null,
        action: "created sheet",
        target: `Untitled Sheet (${templateTitle})`,
      });

      toast.success("Sheet created successfully", { id: toastId });
      router.refresh();
      router.push(`/sheet/${createdSheet.id}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to create sheet", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <LayoutTemplate className="h-5 w-5 text-primary" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-base font-bold text-foreground leading-tight flex items-center gap-2">
              Start with a template
            </h2>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-0.5">
              <p className="text-xs text-muted-foreground">
                Pre-built sheets ready in seconds
              </p>
              <span className="hidden sm:inline text-muted-foreground/40 text-[10px]">
                •
              </span>
              <button
                onClick={() => router.push("/templates")}
                className="flex items-center text-xs font-semibold text-primary hover:text-primary/80 transition-colors group w-fit"
              >
                View all templates
                <ArrowRight className="h-3 w-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Templates — 1 col on mobile, 2 on sm, 4 on lg */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {DASHBOARD_TEMPLATE_TITLES.map((title) =>
          (SHEET_TEMPLATES ?? []).find((template) => template.title === title),
        )
          .filter((template) => Boolean(template))
          .map((template) => (
            <div
              key={template!.id}
              className="cursor-pointer h-full"
              onClick={() => handleTemplateClick(template!.id, template!.title)}
            >
              <TemplateCard {...template!} />
            </div>
          ))}
      </div>
    </section>
  );
};

export default TemplatePicker;
