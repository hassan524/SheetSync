import dynamic from "next/dynamic";
import { generateSEO } from "@/lib/seo/metadata";
import { getAllFolders } from "@/lib/querys/folder/folders";
import { getAllOrganizations } from "@/lib/querys/organization/organization";
const DashboardLayout = dynamic(
  () => import("@/components/layout/Dashboard-layout"),
);

export const metadata = generateSEO({
  title: "Import — Upload Spreadsheets",
  description:
    "Upload your existing spreadsheets to start collaborating in SheetSync. Supports Excel, CSV, and Google Sheets exports.",
  path: "/import",
});
const ImportDropzone = dynamic(
  () => import("@/components/import/Import-dropzone"),
);
import {
  FileSpreadsheet,
  FileText,
  FileCode,
  HelpCircle,
  Upload,
  Zap,
  ShieldCheck,
} from "lucide-react";
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
    description: "Microsoft Excel spreadsheets with full formula support",
  },
  {
    icon: <FileText className="h-5 w-5" />,
    name: "CSV",
    extensions: ".csv",
    description: "Comma-separated values, compatible with any tool",
  },
  {
    icon: <FileCode className="h-5 w-5" />,
    name: "Google Sheets",
    extensions: "Export as .xlsx",
    description: "Export from Google Sheets, then import here",
  },
];

const benefits = [
  {
    icon: <Zap className="h-4 w-4 text-primary" />,
    title: "Instant Import",
    description: "Your data is parsed and ready to edit in seconds.",
  },
  {
    icon: <ShieldCheck className="h-4 w-4 text-primary" />,
    title: "Non-destructive",
    description: "Your original file is never modified — we create a copy.",
  },
  {
    icon: <FileSpreadsheet className="h-4 w-4 text-primary" />,
    title: "Formula Preserved",
    description: "Most standard formulas carry over automatically.",
  },
];

const ImportPage = async () => {
  let organizations: { id: string; name: string }[] = [];
  let folders: { id: string; name: string }[] = [];
  try {
    const data = await getAllOrganizations();
    organizations = data.map((org: any) => ({ id: org.id, name: org.name }));
  } catch {
    organizations = [];
  }
  try {
    const data = await getAllFolders();
    folders = data.map((folder: any) => ({ id: folder.id, name: folder.name }));
  } catch {
    folders = [];
  }

  return (
    <DashboardLayout breadcrumbItems={["SheetSync", "Import"]}>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Page Header */}
        <div className="flex items-start gap-3">
          <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Upload className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-0.5 min-w-0">
            <h1 className="text-lg sm:text-xl font-semibold tracking-tight truncate">
              Import Spreadsheets
            </h1>
            <p className="text-[11px] sm:text-xs text-muted-foreground truncate">
              Upload your existing spreadsheets to start collaborating in
              SheetSync
            </p>
          </div>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {benefits.map((b) => (
            <div
              key={b.title}
              className="flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3"
            >
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                {b.icon}
              </div>
              <div>
                <p className="text-sm font-medium">{b.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {b.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Import Dropzone */}
        <div>
          <ImportDropzone organizations={organizations} folders={folders} />
        </div>

        {/* Supported Formats */}
        <div>
          <h2 className="text-base font-semibold mb-3">Supported Formats</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {supportedFormats.map((format, index) => (
              <div
                key={format.name}
                className="p-4 rounded-xl border border-border bg-card"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3 text-primary">
                  {format.icon}
                </div>
                <h3 className="font-semibold text-sm mb-1">{format.name}</h3>
                <p className="text-xs text-primary font-medium mb-1">
                  {format.extensions}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <HelpCircle className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-base font-semibold">
              Frequently Asked Questions
            </h2>
          </div>
          <Accordion
            type="single"
            collapsible
            className="border rounded-xl divide-y"
          >
            <AccordionItem value="item-1" className="px-4 border-0">
              <AccordionTrigger className="hover:no-underline text-sm">
                What happens to my original file?
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                Your original file remains unchanged on your device. SheetSync
                creates a new copy in your workspace that you can freely edit
                and share.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2" className="px-4 border-0">
              <AccordionTrigger className="hover:no-underline text-sm">
                What&apos;s the maximum file size?
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                You can upload files up to 50 MB. For larger files, we recommend
                splitting them into smaller sheets or reaching out to support
                for an enterprise limit increase.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3" className="px-4 border-0">
              <AccordionTrigger className="hover:no-underline text-sm">
                Will my formulas be preserved?
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                Yes — most standard formulas (SUM, AVERAGE, IF, VLOOKUP, etc.)
                are automatically converted to SheetSync format. Complex macros
                or VBA scripts may need manual adjustment.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4" className="px-4 border-0">
              <AccordionTrigger className="hover:no-underline text-sm">
                Can I import from Google Sheets?
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                Yes. In Google Sheets, go to{" "}
                <strong>
                  File &rarr; Download &rarr; Microsoft Excel (.xlsx)
                </strong>
                , then upload that file here. All data and most formulas will be
                preserved.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ImportPage;
