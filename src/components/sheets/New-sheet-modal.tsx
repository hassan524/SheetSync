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
import { Check, X, Folder, FolderPlus, FileSpreadsheet } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";

import CreateFolderDialog from "../individual/Personalsheets/Create-folder-dialog";
import { createFolder } from "@/lib/querys/folder/folders";
import { createSheet } from "@/lib/querys/sheets/sheets";
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

  // extract organizationId from URL
  const organizationId = useMemo(() => {
    const match = pathname.match(/^\/organizations\/([^/]+)/);
    return match ? match[1] : null;
  }, [pathname]);

  // Update selected folder if currentFolder changes
  useEffect(() => {
    if (currentFolder) setSelectedFolder(currentFolder);
  }, [currentFolder]);

  const activeTemplate = useMemo(
    () => SHEET_TEMPLATES.find((t) => t.id === selectedTemplate),
    [selectedTemplate]
  );

  const accent = activeTemplate?.accent ?? {
    from: "from-slate-50 to-slate-100/60",
    bubble1: "#94a3b8",
    bubble2: "#cbd5e1",
    iconRing: "bg-slate-100 border-slate-200",
  };

  const copy = activeTemplate?.copy ?? {
    tagline: "Set up your sheet",
    body: "Configure your new spreadsheet below.",
  };

  // CREATE SHEET
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

      if (onSheetCreated)
        onSheetCreated(createdSheet, selectedFolder === "personal" ? "" : selectedFolder);

      toast.success(`Sheet "${sheetName}" created`);
      setSheetName("");
      setSelectedTemplate(SHEET_TEMPLATES[0].id);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Error creating sheet");
    } finally {
      setLoading(false);
    }
  };

  // CREATE FOLDER
  const handleCreateFolder = async (name: string) => {
    try {
      const newFolder = organizationId
        ? await createFolder(name, organizationId)
        : await createFolder(name);

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
          <div className={`relative h-[152px] overflow-hidden bg-gradient-to-br ${accent.from}`}>
            <div className="absolute rounded-full blur-[64px]" style={{ width: 200, height: 200, background: accent.bubble1, opacity: 0.45, top: -70, left: -30 }} />
            <div className="absolute rounded-full blur-[48px]" style={{ width: 140, height: 140, background: accent.bubble2, opacity: 0.28, top: -20, right: 0 }} />
            <div className="absolute rounded-full blur-[28px]" style={{ width: 70, height: 70, background: "#ffffff", opacity: 0.6, bottom: 12, right: 80 }} />

            <button onClick={() => onOpenChange(false)} className="absolute top-3.5 right-3.5 h-7 w-7 rounded-full bg-black/5 hover:bg-black/10 border flex items-center justify-center">
              <X className="h-3.5 w-3.5 text-zinc-500" />
            </button>

            <div className="absolute inset-0 flex flex-col justify-end px-6 pb-5">
              <div className="flex items-center gap-2.5 mb-2">
                <div className={`h-7 w-7 rounded-lg border ${accent.iconRing} flex items-center justify-center shadow-sm`}>
                  <FileSpreadsheet className="h-3.5 w-3.5 text-zinc-600" />
                </div>
                <span className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
                  {activeTemplate?.title ?? "New Spreadsheet"}
                </span>
              </div>
              <p className="text-[19px] font-bold">{copy.tagline}</p>
            </div>
          </div>

          {/* BODY */}
          <div className="px-6 py-5 space-y-5 overflow-y-auto bg-white" style={{ maxHeight: "calc(580px - 152px - 64px)" }}>
            <p className="text-[13.5px] text-zinc-500">{copy.body}</p>

            {/* TEMPLATE */}
            <div className="space-y-1.5">
              <Label className="text-[10.5px] font-semibold uppercase text-zinc-400">Template</Label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger className="h-9 text-sm border-zinc-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SHEET_TEMPLATES.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* SHEET NAME */}
            <div className="space-y-1.5">
              <Label className="text-[10.5px] font-semibold uppercase text-zinc-400">Sheet name</Label>
              <Input
                placeholder={`My ${activeTemplate?.title ?? "Sheet"}`}
                value={sheetName}
                onChange={(e) => setSheetName(e.target.value)}
                className="h-9 text-sm border-zinc-200 focus-visible:ring-emerald-500/30"
              />
            </div>

            {/* SAVE TO */}
            {ShowSaveTo && (
              <div className="space-y-2">
                <Label className="text-[10.5px] font-semibold uppercase text-zinc-400">Save to</Label>
                <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                  <SelectTrigger className="h-9 text-sm border-zinc-200">
                    <SelectValue placeholder="Select folder…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personal">
                      <div className="flex items-center gap-2">
                        <Folder className="h-3.5 w-3.5 text-zinc-400" />
                        Personal Sheets
                      </div>
                    </SelectItem>
                    {folders?.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        <div className="flex items-center gap-2">
                          <Folder className="h-3.5 w-3.5 text-zinc-400" />
                          {f.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <button
                  type="button"
                  className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
                  onClick={() => setCreateFolderOpen(true)}
                >
                  <FolderPlus className="h-3.5 w-3.5" />
                  New folder
                </button>
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-zinc-100 bg-white">
            <p className="text-xs text-zinc-400 truncate">
              {selectedFolder === "personal"
                ? "Saving to Personal Sheets"
                : `Saving to ${folders?.find((f) => f.id === selectedFolder)?.name ?? "folder"}`}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
              <Button size="sm" onClick={handleCreate} disabled={!canCreate || loading}>
                {loading ? "Creating…" : "Create Sheet"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* CREATE FOLDER DIALOG */}
      <CreateFolderDialog
        open={createFolderOpen}
        onOpenChange={setCreateFolderOpen}
        onConfirm={handleCreateFolder}
      />
    </>
  );
};

export default NewSheetModal;