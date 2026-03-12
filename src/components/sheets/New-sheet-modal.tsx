"use client";

import { useState, useMemo } from "react";
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

import CreateFolderDialog from "../individual/Personalsheets/Create-folder-dialog";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { createFolder } from "@/lib/querys/folder/folders";
import { createSheet } from "@/lib/querys/sheets/sheets";
import { SHEET_TEMPLATES } from "@/constants/Sheet-templates";
import { FolderItem } from "@/data/sheets";

interface NewSheetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ShowSaveTo: boolean;
  folders?: FolderItem[];
  onSheetCreated?: (sheet: any, folderId: string) => void;
  currentFolder: string;
}

const NewSheetModal = ({
  open,
  onOpenChange,
  ShowSaveTo,
  folders,
  onSheetCreated,
  currentFolder
}: NewSheetModalProps) => {
  const [sheetName, setSheetName] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState(
    SHEET_TEMPLATES[0].id
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

  const handleCreate = async () => {
    if (!sheetName.trim()) return;
    try {
      setLoading(true);
     const createdSheet = await createSheet({
        name: sheetName,
        templateId: selectedTemplate,
        folder_id: currentFolder,
        organizationId: organizationId || undefined,
      });
      if (onSheetCreated) onSheetCreated(createdSheet, folder);
      toast.success(`Sheet "${sheetName}" created`);
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

  const canCreate = !!sheetName.trim();

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[460px] p-0 gap-0 overflow-hidden rounded-2xl border border-zinc-200/80 shadow-xl shadow-black/[0.08] [&>button]:hidden">
          {/* ── Header ── */}
          <div
            className={`relative h-[152px] overflow-hidden flex-shrink-0 bg-gradient-to-br ${accent.from}`}
          >
            {/* Bubbles */}
            <div
              className="absolute rounded-full blur-[64px]"
              style={{
                width: 200,
                height: 200,
                background: accent.bubble1,
                opacity: 0.45,
                top: -70,
                left: -30,
              }}
            />
            <div
              className="absolute rounded-full blur-[48px]"
              style={{
                width: 140,
                height: 140,
                background: accent.bubble2,
                opacity: 0.28,
                top: -20,
                right: 0,
              }}
            />
            <div
              className="absolute rounded-full blur-[28px]"
              style={{
                width: 70,
                height: 70,
                background: "#ffffff",
                opacity: 0.6,
                bottom: 12,
                right: 80,
              }}
            />

            <button
              onClick={() => onOpenChange(false)}
              className="absolute top-3.5 right-3.5 h-7 w-7 rounded-full bg-black/5 hover:bg-black/10 border border-black/[0.06] flex items-center justify-center transition-colors z-10"
            >
              <X className="h-3.5 w-3.5 text-zinc-500" />
            </button>

            <div className="absolute inset-0 flex flex-col justify-end px-6 pb-5 z-10">
              <div className="flex items-center gap-2.5 mb-2">
                <div
                  className={`h-7 w-7 rounded-lg border ${accent.iconRing} flex items-center justify-center flex-shrink-0 shadow-sm`}
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 text-zinc-600" />
                </div>
                <span className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
                  {activeTemplate?.title ?? "New Spreadsheet"}
                </span>
              </div>
              <p className="text-[19px] font-bold leading-tight tracking-tight text-zinc-800">
                {copy.tagline}
              </p>
            </div>
          </div>

          {/* ── Body ── */}
          <div
            className="px-6 py-5 space-y-5 overflow-y-auto bg-white"
            style={{ maxHeight: "calc(580px - 152px - 64px)" }}
          >
            <p className="text-[13.5px] text-zinc-500 leading-relaxed">
              {copy.body}
            </p>

            {activeTemplate?.features?.length > 0 && (
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                {activeTemplate?.features.map((f, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-[13px] text-zinc-600"
                  >
                    <span className="h-4 w-4 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
                      <Check className="h-2.5 w-2.5 text-emerald-500" />
                    </span>
                    {f}
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-zinc-100" />

            {/* Template Selector */}
            <div className="space-y-1.5">
              <Label className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-zinc-400">
                Template
              </Label>
              <Select
                value={selectedTemplate}
                onValueChange={setSelectedTemplate}
              >
                <SelectTrigger className="h-9 text-sm border-zinc-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SHEET_TEMPLATES.map((t) => (
                    <SelectItem key={t.id} value={t.id} className="text-sm">
                      {t.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sheet Name */}
            <div className="space-y-1.5">
              <Label className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-zinc-400">
                Sheet name
              </Label>
              <Input
                placeholder={`My ${activeTemplate?.title ?? "Sheet"}`}
                value={sheetName}
                onChange={(e) => setSheetName(e.target.value)}
                className="h-9 text-sm border-zinc-200 focus-visible:ring-emerald-500/30"
              />
            </div>

            {/* Save To */}
            {ShowSaveTo && (
              <div className="space-y-2">
                <Label className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-zinc-400">
                  Save to
                </Label>
                <Select value={folder} onValueChange={setFolder}>
                  <SelectTrigger className="h-9 text-sm border-zinc-200">
                    <SelectValue placeholder="Select folder…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personal" className="text-sm">
                      <span className="flex items-center gap-2">
                        <Folder className="h-3.5 w-3.5 text-zinc-400" />
                        Personal Sheets
                      </span>
                    </SelectItem>
                    {folders?.map((f) => (
                      <SelectItem key={f.id} value={f.id} className="text-sm">
                        <span className="flex items-center gap-2">
                          <Folder className="h-3.5 w-3.5 text-zinc-400" />
                          {f.name}
                        </span>
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

          {/* ── Footer ── */}
          <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-zinc-100 bg-white flex-shrink-0">
            <p className="text-xs text-zinc-400 truncate">
              {folder === "personal"
                ? "Saving to Personal Sheets"
                : `Saving to ${
                    folders?.find((f) => f.id === folder)?.name ?? "folder"
                  }`}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                disabled={loading}
                className="h-8 text-sm px-3 border-zinc-200 text-zinc-600 hover:bg-zinc-50"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleCreate}
                disabled={!canCreate || loading}
                className="h-8 text-sm px-4 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
              >
                {loading ? "Creating…" : "Create Sheet"}
              </Button>
            </div>
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