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
import { LayoutTemplate, Check, Sparkles } from "lucide-react";

interface Template {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
}

interface UseTemplateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: Template | null;
}

const UseTemplateModal = ({ open, onOpenChange, template }: UseTemplateModalProps) => {
  const [sheetName, setSheetName] = useState(template?.title || "");
  const [organization, setOrganization] = useState("personal");

  const handleCreate = () => {
    console.log({ sheetName, organization, template: template?.title });
    onOpenChange(false);
    setSheetName("");
    setOrganization("personal");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <LayoutTemplate className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <DialogTitle>Use Template</DialogTitle>
              <DialogDescription>
                Create a new sheet from the selected template
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {template && (
          <div className="space-y-4 py-4">
            {/* Template Preview */}
            <div className="bg-muted/30 border rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  {template.icon}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">{template.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {template.description}
                  </p>
                </div>
              </div>

              {template.features && template.features.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <h5 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    INCLUDED FEATURES
                  </h5>
                  <div className="grid grid-cols-2 gap-2">
                    {template.features.map((feature, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 text-sm"
                      >
                        <Check className="h-3 w-3 text-primary" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-sheet-name">Sheet Name</Label>
              <Input
                id="template-sheet-name"
                placeholder={`My ${template.title}`}
                value={sheetName}
                onChange={(e) => setSheetName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Save to</Label>
              <Select value={organization} onValueChange={setOrganization}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="personal">Personal Sheets</SelectItem>
                  <SelectItem value="acme">Acme Corporation</SelectItem>
                  <SelectItem value="design">Design Team</SelectItem>
                  <SelectItem value="marketing">Marketing Dept</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!sheetName.trim()}>
            Create from Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UseTemplateModal;
