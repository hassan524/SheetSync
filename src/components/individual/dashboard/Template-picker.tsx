"use client";

import React, { useEffect } from "react";
import { SHEET_TEMPLATES } from "@/constants/Sheet-templates";
import { useRouter } from "next/navigation";
import TemplateCard from "@/components/sheets/Template-card";
import UseTemplateModal from "@/components/sheets/Use-template-modal";
import { getAllFolders } from "@/lib/querys/folder/folders";
import { getAllOrganizations } from "@/lib/querys/organization/organization";
import { ArrowRight, LayoutTemplate } from "lucide-react";

const DASHBOARD_TEMPLATE_TITLES = [
  "Blank Sheet",
  "Finance Tracker",
  "QA Tracker",
  "Project Tracker",
];

const TemplatePicker = () => {
  const router = useRouter();

  const [templateModalOpen, setTemplateModalOpen] = React.useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = React.useState<
    string | null
  >(null);
  const [folders, setFolders] = React.useState<any[]>([]);
  const [organizations, setOrganizations] = React.useState<any[]>([]);
  const handleTemplateClick = (templateId: string) => {
    setSelectedTemplateId(templateId);
    setTemplateModalOpen(true);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [folderData, orgData] = await Promise.all([
          getAllFolders(),
          getAllOrganizations(),
        ]);
        setFolders(folderData || []);
        setOrganizations(orgData || []);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };
    fetchData();
  }, []);

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
              className="cursor-pointer"
              onClick={() => handleTemplateClick(template!.id)}
            >
              <TemplateCard {...template!} />
            </div>
          ))}
      </div>

      {selectedTemplateId && (
        <UseTemplateModal
          open={templateModalOpen}
          onOpenChange={(open) => {
            setTemplateModalOpen(open);
            if (!open) setSelectedTemplateId(null);
          }}
          templateId={selectedTemplateId}
          folders={folders}
          organizations={organizations}
        />
      )}
    </section>
  );
};

export default TemplatePicker;

