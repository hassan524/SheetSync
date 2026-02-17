import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileSpreadsheet,
  Calculator,
  Calendar,
  BarChart3,
  Folder,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NewSheetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const templates = [
  {
    id: "blank",
    title: "Blank Sheet",
    description: "Start fresh with a clean spreadsheet",
    icon: FileSpreadsheet,
    color: "bg-slate-500",
    features: [
      "100+ columns",
      "10,000+ rows",
      "All formulas",
      "Custom styling",
    ],
  },
  {
    id: "budget",
    title: "Budget Tracker",
    description:
      "Track income, expenses, and savings with automated calculations",
    icon: Calculator,
    color: "bg-emerald-500",
    features: [
      "Auto-sum formulas",
      "Monthly breakdown",
      "Expense categories",
      "Savings goals",
    ],
  },
  {
    id: "timeline",
    title: "Project Timeline",
    description: "Plan and visualize project milestones and deadlines",
    icon: Calendar,
    color: "bg-blue-500",
    features: [
      "Gantt view",
      "Milestone tracking",
      "Team assignments",
      "Due date alerts",
    ],
  },
  {
    id: "inventory",
    title: "Inventory Tracker",
    description: "Track products, assets, and stock levels",
    icon: BarChart3,
    color: "bg-purple-500",
    features: [
      "Quantity & price tracking",
      "Low stock alerts",
      "Total value calculations",
      "Category management",
    ],
  },
];

const NewSheetModal = ({ open, onOpenChange }: NewSheetModalProps) => {
  const [sheetName, setSheetName] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("blank");
  const [folder, setFolder] = useState("personal");

  const handleCreate = () => {
    console.log({ sheetName, selectedTemplate, folder });
    onOpenChange(false);
    setSheetName("");
    setSelectedTemplate("blank");
    setFolder("personal");
  };

  const activeTemplate = templates.find((t) => t.id === selectedTemplate);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Create New Sheet</DialogTitle>
          <DialogDescription>
            Set up your spreadsheet with a template and organize it in your
            workspace
          </DialogDescription>
        </DialogHeader>

        <div
          className="space-y-4 overflow-y-auto pr-1 max-h-[calc(85vh-180px)] scrollbar-hide"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          <style jsx>{`
            .scrollbar-hide::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          {/* Sheet Name */}
          <div className="space-y-2">
            <Label htmlFor="sheet-name" className="text-sm font-medium">
              Sheet Name
            </Label>
            <Input
              id="sheet-name"
              placeholder="Enter a descriptive name for your sheet"
              value={sheetName}
              onChange={(e) => setSheetName(e.target.value)}
              className="h-10"
            />
            <p className="text-xs text-muted-foreground">
              Give your sheet a clear, memorable name
            </p>
          </div>

          {/* Template Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Choose Template</Label>
            <Select
              value={selectedTemplate}
              onValueChange={setSelectedTemplate}
            >
              <SelectTrigger className="h-10">
                <div className="flex items-center gap-2">
                  {activeTemplate && (
                    <>
                      <div className={cn("p-1 rounded", activeTemplate.color)}>
                        <activeTemplate.icon className="h-3.5 w-3.5 text-white" />
                      </div>
                      <SelectValue />
                    </>
                  )}
                </div>
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => {
                  const Icon = template.icon;
                  return (
                    <SelectItem key={template.id} value={template.id}>
                      <div className="flex items-center gap-2">
                        <div className={cn("p-1 rounded", template.color)}>
                          <Icon className="h-3.5 w-3.5 text-white" />
                        </div>
                        <span>{template.title}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Template Info */}
          {activeTemplate && (
            <div className="rounded-lg border bg-gradient-to-br from-muted/40 to-muted/20 p-3 space-y-2.5">
              <div className="flex items-start gap-2.5">
                <div
                  className={cn(
                    "p-2 rounded-lg flex-shrink-0 shadow-sm",
                    activeTemplate.color,
                  )}
                >
                  <activeTemplate.icon className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">
                    {activeTemplate.title}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {activeTemplate.description}
                  </p>
                </div>
              </div>
              <div className="space-y-1.5 pt-1 border-t">
                <p className="text-xs font-medium text-foreground/80">
                  What's included:
                </p>
                <div className="space-y-1">
                  {activeTemplate.features.map((feature, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 text-xs text-muted-foreground"
                    >
                      <CheckCircle2 className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Folder Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Save Location</Label>
            <Select value={folder} onValueChange={setFolder}>
              <SelectTrigger className="h-10">
                <div className="flex items-center gap-2">
                  <Folder className="h-4 w-4 text-muted-foreground" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="personal">
                  <div className="flex items-center gap-2">
                    <Folder className="h-4 w-4" />
                    <span>Personal Sheets</span>
                  </div>
                </SelectItem>
                <SelectItem value="acme">
                  <div className="flex items-center gap-2">
                    <Folder className="h-4 w-4" />
                    <span>Acme Corporation</span>
                  </div>
                </SelectItem>
                <SelectItem value="design">
                  <div className="flex items-center gap-2">
                    <Folder className="h-4 w-4" />
                    <span>Design Team</span>
                  </div>
                </SelectItem>
                <SelectItem value="marketing">
                  <div className="flex items-center gap-2">
                    <Folder className="h-4 w-4" />
                    <span>Marketing Dept</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Choose where to organize this sheet in your workspace
            </p>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!sheetName.trim()}>
            Create Sheet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewSheetModal;
