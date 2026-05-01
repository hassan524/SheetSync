"use client";

import { useState, useMemo, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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
import { X, Folder, FolderPlus, FileSpreadsheet } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";

import CreateFolderDialog from "../individual/Personalsheets/Create-folder-dialog";
import { createFolder } from "@/lib/querys/folder/folders";
import { createSheet } from "@/lib/querys/sheets/sheets";
import { logActivity } from "@/lib/querys/activity/activity";
import { SHEET_TEMPLATES } from "@/constants/Sheet-templates";
import { FolderWithSheets, Sheet } from "@/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ShowSaveTo: boolean;
  folders?: FolderWithSheets[];
  currentFolder?: string;
  onSheetCreated?: (sheet: Sheet, folderId: string) => void;
}

const NewSheetModal = ({
  open,
  onOpenChange,
  ShowSaveTo,
  folders,
  currentFolder,
  onSheetCreated,
}: Props) => {
  const [sheetName, setSheetName] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState(SHEET_TEMPLATES[0].id);
  const [selectedFolder, setSelectedFolder] = useState(currentFolder || "personal");
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const pathname = usePathname();
  const router = useRouter();

  const organizationId = useMemo(() => {
    const match = pathname.match(/^\/organizations\/([^/]+)/);
    return match ? match[1] : null;
  }, [pathname]);

  useEffect(() => {
    if (currentFolder) setSelectedFolder(currentFolder);
  }, [currentFolder]);

  const activeTemplate = useMemo(
    () => SHEET_TEMPLATES.find((t) => t.id === selectedTemplate),
    [selectedTemplate]
  );

  const handleCreate = async () => {
    if (!sheetName.trim()) return;

    try {
      setLoading(true);

      const createdSheet = await createSheet({
        name: sheetName,
        templateId: selectedTemplate,
        folder_id: selectedFolder !== "personal" ? selectedFolder : undefined,
        organizationId: organizationId || undefined,
      });

      // ✅ LOG SHEET CREATION ACTIVITY
      await logActivity({
        // userId: "", // backend already uses auth user (safe)
        sheetId: createdSheet.id,
        organizationId: organizationId || null,
        action: organizationId
          ? "created sheet in organization"
          : "created sheet",
        target: sheetName,
      });

      onSheetCreated?.(
        createdSheet,
        selectedFolder === "personal" ? "" : selectedFolder
      );

      toast.success(`Sheet "${sheetName}" created`);
      setSheetName("");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Error creating sheet");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFolder = async (name: string) => {
    try {
      const newFolder = organizationId
        ? await createFolder(name, organizationId)
        : await createFolder(name);

      await logActivity({
        // userId: "", 
        organizationId: organizationId || null,
        action: organizationId
          ? "created folder in organization"
          : "created folder",
        target: name,
      });

      toast.success(`Folder "${name}" created`);
    } catch (err: any) {
      toast.error(err.message || "Error creating folder");
    }
  };

  const canCreate = !!sheetName.trim();

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[460px] p-0 overflow-hidden rounded-2xl border border-zinc-200/80 shadow-xl [&>button]:hidden">

          {/* HEADER */}
          <div className="relative h-[152px] overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100/60">
            <button
              onClick={() => onOpenChange(false)}
              className="absolute top-3.5 right-3.5 h-7 w-7 rounded-full bg-black/5 hover:bg-black/10 border flex items-center justify-center"
            >
              <X className="h-3.5 w-3.5 text-zinc-500" />
            </button>

            <div className="absolute inset-0 flex flex-col justify-end px-6 pb-5">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="h-7 w-7 rounded-lg border bg-white flex items-center justify-center">
                  <FileSpreadsheet className="h-3.5 w-3.5 text-zinc-600" />
                </div>
                <span className="text-[10.5px] font-semibold uppercase text-zinc-400">
                  {activeTemplate?.title}
                </span>
              </div>

              <p className="text-[19px] font-bold">
                {activeTemplate?.copy?.tagline}
              </p>
            </div>
          </div>

          {/* BODY */}
          <div className="px-6 py-5 space-y-5 bg-white">

            <div className="space-y-1.5">
              <Label>Sheet name</Label>
              <Input
                value={sheetName}
                onChange={(e) => setSheetName(e.target.value)}
              />
            </div>

            {ShowSaveTo && (
              <div className="space-y-2">
                <Label>Save to</Label>

                <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="personal">
                      <Folder className="h-3 w-3 mr-2" />
                      Personal
                    </SelectItem>

                    {folders?.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <button
                  className="text-xs text-zinc-500 flex items-center gap-1"
                  onClick={() => setCreateFolderOpen(true)}
                >
                  <FolderPlus className="h-3 w-3" />
                  New folder
                </button>
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div className="flex justify-end gap-2 p-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>

            <Button onClick={handleCreate} disabled={!canCreate || loading}>
              {loading ? "Creating..." : "Create"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <CreateFolderDialog
        open={createFolderOpen}
        onOpenChange={setCreateFolderOpen}
        onConfirm={handleCreateFolder}
      />
    </>
  );
};

export default NewSheetModal;