"use client";

import { useState, useMemo } from "react";
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

import CreateFolderDialog from "../individual/Personalsheets/Create-folder-dialog";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { createFolder } from "@/lib/querys/folder/folders";
import { createSheet } from "@/lib/querys/sheets/sheets";
import { SHEET_TEMPLATES } from "@/app/constants/Sheet-templates";

interface NewSheetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ShowSaveTo: boolean;
  folders?: any[];
}

const NewSheetModal = ({
  open,
  onOpenChange,
  ShowSaveTo,
  folders,
}: NewSheetModalProps) => {
  const [sheetName, setSheetName] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState(
    SHEET_TEMPLATES[0].id,
  );
  const [folder, setFolder] = useState("personal");
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const pathname = usePathname();

  const organizationId = useMemo(() => {
    const match = pathname.match(/^\/organizations\/([^/]+)/);
    return match ? match[1] : null;
  }, [pathname]);

  const activeTemplate = useMemo(
    () => SHEET_TEMPLATES.find((t) => t.id === selectedTemplate),
    [selectedTemplate],
  );

  const handleCreate = async () => {
    if (!sheetName.trim()) return;

    try {
      setLoading(true);

      await createSheet({
        name: sheetName,
        templateId: selectedTemplate,
        folder_id: folder !== "personal" ? folder : undefined,
        organizationId: organizationId || undefined,
      });

      toast.success(`Sheet "${sheetName}" created`);

      // reset
      setSheetName("");
      setSelectedTemplate(SHEET_TEMPLATES[0].id);
      setFolder("personal");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Error creating sheet");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFolder = async (name: string) => {
    try {
      if (organizationId) {
        await createFolder(name, organizationId);
      } else {
        await createFolder(name);
      }

      toast.success(`Folder "${name}" created`);
    } catch (err: any) {
      toast.error(err.message || "Error creating folder");
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[520px] max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>Create New Sheet</DialogTitle>
            <DialogDescription>Set up your spreadsheet</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 overflow-y-auto pr-1">
            {/* Sheet Name */}
            <div className="space-y-2">
              <Label>Sheet Name</Label>
              <Input
                placeholder="Enter sheet name..."
                value={sheetName}
                onChange={(e) => setSheetName(e.target.value)}
              />
            </div>

            {/* Template */}
            <div className="space-y-2">
              <Label>Template</Label>

              <Select
                value={selectedTemplate}
                onValueChange={setSelectedTemplate}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  {SHEET_TEMPLATES.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Template Preview */}
              {activeTemplate && (
                <div className="p-3 border rounded-md text-sm text-muted-foreground">
                  <p className="font-medium">{activeTemplate.title}</p>
                  <p>{activeTemplate.description}</p>

                  {/* Optional Features */}
                  {activeTemplate.features && (
                    <ul className="mt-2 list-disc list-inside text-xs">
                      {activeTemplate.features.map((f, i) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* Save Location */}
            {ShowSaveTo && (
              <div className="space-y-2">
                <Label>Save Location</Label>

                <Select value={folder} onValueChange={setFolder}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="personal">Personal Sheets</SelectItem>

                    {folders?.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.name}
                      </SelectItem>
                    ))}

                    <div className="border-t mt-1 pt-1">
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-sm"
                        onClick={() => setCreateFolderOpen(true)}
                      >
                        + Create New Folder
                      </Button>
                    </div>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>

            <Button onClick={handleCreate} disabled={!sheetName || loading}>
              {loading ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Folder Modal */}
      <CreateFolderDialog
        open={createFolderOpen}
        onOpenChange={setCreateFolderOpen}
        onConfirm={handleCreateFolder}
      />
    </>
  );
};

export default NewSheetModal;
