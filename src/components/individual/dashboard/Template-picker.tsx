"use client";

import React, { useEffect } from "react";
import { SHEET_TEMPLATES } from "@/constants/Sheet-templates";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import TemplateCard from "@/components/sheets/Template-card";
import UseTemplateModal from "@/components/sheets/Use-template-modal";
import { getAllFolders } from "@/lib/querys/folder/folders";
import { getAllOrganizations } from "@/lib/querys/organization/organization";
import { ArrowRight, LayoutTemplate } from "lucide-react";

const TemplatePicker = () => {
  const router = useRouter();

  const [templateModalOpen, setTemplateModalOpen] = React.useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = React.useState<string | null>(null);
  const [folders, setFolders] = React.useState<any[]>([]);
  const [organizations, setOrganizations] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);

  const handleTemplateClick = (templateId: string) => {
    setSelectedTemplateId(templateId);
    setTemplateModalOpen(true);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [folderData, orgData] = await Promise.all([
          getAllFolders(),
          getAllOrganizations(),
        ]);
        setFolders(folderData || []);
        setOrganizations(orgData || []);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <section className="animate-fade-in">
      {/* Header — stacks on mobile, side-by-side on sm+ */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <LayoutTemplate className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-semibold leading-tight">Start with a template</h2>
            <p className="text-xs text-muted-foreground">
              Pre-built sheets ready in seconds
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full sm:w-auto text-primary border-primary/30 hover:bg-primary/5"
          onClick={() => router.push("/templates")}
        >
          View all templates
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* Templates — 1 col on mobile, 2 on sm, 4 on lg */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {(SHEET_TEMPLATES ?? []).slice(0, 8).map((template, index) => (
          <div
            key={template.id}
            className="cursor-pointer"
            onClick={() => handleTemplateClick(template.id)}
          >
            <TemplateCard {...template} />
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
