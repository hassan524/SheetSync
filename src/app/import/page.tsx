import DashboardLayout from "@/components/layout/Dashboard-layout";
import ImportDropzone from "@/components/import/Import-dropzone";
import { FileSpreadsheet, FileText, FileCode, HelpCircle } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const supportedFormats = [
  {
    icon: <FileSpreadsheet className="h-5 w-5" />,
    name: "Excel",
    extensions: ".xlsx, .xls",
    description: "Microsoft Excel spreadsheets",
  },
  {
    icon: <FileText className="h-5 w-5" />,
    name: "CSV",
    extensions: ".csv",
    description: "Comma-separated values",
  },
  {
    icon: <FileCode className="h-5 w-5" />,
    name: "Google Sheets",
    extensions: "Export as .xlsx",
    description: "Export from Google Sheets",
  },
];

const ImportPage = () => {
  return (
    <DashboardLayout breadcrumbItems={["SheetSync", "Import"]}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold mb-2 animate-fade-in">
            Import Spreadsheets
          </h1>
          <p className="text-muted-foreground animate-fade-in">
            Upload your existing spreadsheets to start collaborating in
            SheetSync
          </p>
        </div>

        {/* Import Dropzone */}
        <div className="mb-10">
          <ImportDropzone />
        </div>

        {/* Supported Formats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10 animate-slide-up">
          {supportedFormats.map((format, index) => (
            <div
              key={format.name}
              className="p-4 rounded-xl border border-border bg-card"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3 text-primary">
                {format.icon}
              </div>
              <h3 className="font-medium mb-1">{format.name}</h3>
              <p className="text-sm text-muted-foreground mb-1">
                {format.extensions}
              </p>
              <p className="text-xs text-muted-foreground">
                {format.description}
              </p>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="animate-slide-up">
          <div className="flex items-center gap-2 mb-4">
            <HelpCircle className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">
              Frequently Asked Questions
            </h2>
          </div>
          <Accordion type="single" collapsible className="border rounded-xl">
            <AccordionItem value="item-1" className="px-4">
              <AccordionTrigger className="hover:no-underline">
                What happens to my original file?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Your original file remains unchanged. SheetSync creates a new
                copy in your workspace that you can edit and share with others.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2" className="px-4">
              <AccordionTrigger className="hover:no-underline">
                What's the maximum file size?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                You can upload files up to 50MB. For larger files, we recommend
                splitting them into smaller sheets.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3" className="px-4 border-0">
              <AccordionTrigger className="hover:no-underline">
                Will my formulas be preserved?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes, most common formulas are automatically converted to
                SheetSync format. Complex macros may need manual adjustment.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ImportPage;
