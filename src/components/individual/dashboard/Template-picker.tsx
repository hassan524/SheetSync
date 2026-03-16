"use client";

import React, {useEffect} from "react";
import { SHEET_TEMPLATES } from "@/constants/Sheet-templates";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import TemplateCard from "@/components/sheets/Template-card";
import UseTemplateModal from "@/components/sheets/Use-template-modal";
import { getAllFolders } from "@/lib/querys/folder/folders";
import { ArrowRight } from "lucide-react";

const TemplatePicker = () => {
  const router = useRouter();

  const [templateModalOpen, setTemplateModalOpen] = React.useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = React.useState<string | null>(null);

  const [folders, setFolders] = React.useState<any[]>([]);
  const [loadingFolders, setLoadingFolders] = React.useState(false);

  const handleTemplateClick = (templateId: string) => {
    setSelectedTemplateId(templateId);
    setTemplateModalOpen(true);
  };

    useEffect(() => {
    const fetchFolders = async () => {
      try {
        setLoadingFolders(true);
        const data = await getAllFolders();
        setFolders(data || []);
      } catch (error) {
        console.error("Failed to fetch folders:", error);
      } finally {
        setLoadingFolders(false);
      }
    };

    fetchFolders();
  }, []);

  return (
    <section className="animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">Start with a template</h2>
          <p className="text-sm text-muted-foreground">
            Get started quickly with pre-built spreadsheet templates
          </p>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="text-primary"
          onClick={() => router.push("/templates")}
        >
          View all templates
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* Templates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
       {(SHEET_TEMPLATES ?? []).map((template, index) => (
          <div
            key={template.id}
            className={`stagger-${index + 1} cursor-pointer`}
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
        />
      )}
    </section>
  );
};

export default TemplatePicker;