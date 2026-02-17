"use client";

import React from "react";
import { templates } from "@/data/templates";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import TemplateCard from "@/components/sheets/Template-card";
import UseTemplateModal from "@/components/sheets/Use-template-modal";
import { ArrowRight } from "lucide-react";

const TemplatePicker = () => {
  const router = useRouter();

  const [templateModalOpen, setTemplateModalOpen] = React.useState(false);
  const [selectedTemplate, setSelectedTemplate] = React.useState<
    (typeof templates)[0] | null
  >(null);

  const handleTemplateClick = (template: (typeof templates)[0]) => {
    setSelectedTemplate(template);
    setTemplateModalOpen(true);
  };

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {templates.map((template, index) => (
          <div
            key={template.id}
            className={`stagger-${index + 1}`}
            onClick={() => handleTemplateClick(template)}
          >
            <TemplateCard {...template} />
          </div>
        ))}
      </div>

      {/* Modals */}
      <UseTemplateModal
        open={templateModalOpen}
        onOpenChange={setTemplateModalOpen}
        template={selectedTemplate}
      />
    </section>
  );
};

export default TemplatePicker;
