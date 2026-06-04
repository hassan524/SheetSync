"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  FileSpreadsheet,
  X,
  CheckCircle2,
  AlertCircle,
  Building2,
  User,
  Folder,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { createSheet } from "@/lib/querys/sheets/sheets";
import { saveAllColumns } from "@/lib/querys/sheet/columns";
import { saveAllRows } from "@/lib/querys/sheet/rows";
import { saveAllCellFormats } from "@/lib/querys/sheet/format";
import { saveAllFormulas } from "@/lib/querys/sheet/formulas";
import { toast } from "sonner";
import { buildImportedSheetData } from "@/lib/import-sheet";

// ─── types ────────────────────────────────────────────────────────────────────

interface ImportedFile {
  name: string;
  status: "uploading" | "success" | "error";
  progress: number;
  error?: string;
}

interface OrganizationOption {
  id: string;
  name: string;
}

interface FolderOption {
  id: string;
  name: string;
}

// ─── constants ────────────────────────────────────────────────────────────────

const BLANK_TEMPLATE_ID = "f628aed8-bca7-4f51-b687-6db9f932be34";
const MAX_IMPORT_BYTES = 50 * 1024 * 1024;

// ─── component ────────────────────────────────────────────────────────────────

const ImportDropzone = ({
  organizations = [],
  folders = [],
}: {
  organizations?: OrganizationOption[];
  folders?: FolderOption[];
}) => {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<ImportedFile[]>([]);
  const [busy, setBusy] = useState(false);
  const [destinationType, setDestinationType] = useState<
    "skip" | "personal" | "organization"
  >("skip");
  const [selectedFolderId, setSelectedFolderId] = useState("");
  const [selectedOrganizationId, setSelectedOrganizationId] = useState("");

  const handleDestinationTypeChange = (
    type: "skip" | "personal" | "organization",
  ) => {
    setDestinationType(type);
    if (type === "skip") {
      setSelectedFolderId("");
      setSelectedOrganizationId("");
      return;
    }
    if (type === "personal") {
      setSelectedOrganizationId("");
      setSelectedFolderId((prev) => prev || folders[0]?.id || "");
      return;
    }
    setSelectedFolderId("");
    setSelectedOrganizationId((prev) => prev || organizations[0]?.id || "");
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  }, []);

  const showSheetLoadingOverlay = () => {
    if (typeof document === "undefined") return;
    const existing = document.getElementById("sheet-import-transition");
    if (existing) return;

    const overlay = document.createElement("div");
    overlay.id = "sheet-import-transition";
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      background: #ffffff;
      z-index: 99999;
      pointer-events: all;
    `;

    const bar = document.createElement("div");
    bar.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      height: 2px;
      width: 0%;
      background: #16a34a;
      box-shadow: 0 0 10px rgba(22,163,74,0.45);
      transition: width 3s cubic-bezier(0.1, 0.02, 0, 1);
    `;

    overlay.appendChild(bar);
    document.body.appendChild(overlay);
    requestAnimationFrame(() => {
      bar.style.width = "85%";
    });

    const removeOverlay = () => {
      bar.style.transition = "width 0.12s ease-out";
      bar.style.width = "100%";
      setTimeout(() => overlay.remove(), 160);
      window.removeEventListener("__sheet-ready" as any, removeOverlay);
    };
    window.addEventListener("__sheet-ready" as any, removeOverlay);
  };

  const importFiles = useCallback(
    async (selectedFiles: File[]) => {
      if (selectedFiles.length === 0) return;
      if (destinationType === "organization" && !selectedOrganizationId) {
        toast.error("Choose an organization for this imported sheet.");
        return;
      }

      setBusy(true);

      const initial: ImportedFile[] = selectedFiles.map((file) => ({
        name: file.name,
        status: "uploading",
        progress: 5,
      }));
      setFiles((prev) => [...prev, ...initial]);

      for (const file of selectedFiles) {
        const bump = (progress: number) =>
          setFiles((prev) =>
            prev.map((f) => (f.name === file.name ? { ...f, progress } : f)),
          );

        try {
          // ── validations ──
          if (file.size > MAX_IMPORT_BYTES) {
            throw new Error("File is larger than the 50 MB import limit.");
          }
          if (!/\.(csv|xlsx|xls)$/i.test(file.name)) {
            throw new Error(
              "Unsupported file type. Upload a CSV, XLSX, or XLS file.",
            );
          }

          bump(25);
          const buffer = await file.arrayBuffer();

          // ── parse with ExcelJS (async) — properly awaited ──
          const parsed = await buildImportedSheetData(file, buffer);

          bump(55);

          // ── build title ──
          let title = file.name.replace(/\.(xlsx|xls|csv)$/i, "").trim();
          if (title.length < 5) title = `Imported ${title || "Sheet"}`;
          while (title.length < 5) title = title + " Sheet";

          // ── create sheet ──
          const created = await createSheet({
            name: title,
            templateId: BLANK_TEMPLATE_ID,
            folder_id:
              destinationType === "personal" && selectedFolderId
                ? selectedFolderId
                : undefined,
            organizationId:
              destinationType === "organization" && selectedOrganizationId
                ? selectedOrganizationId
                : undefined,
            markRecent: true,
          });

          bump(75);

          // ── save all data in parallel ──
          await Promise.all([
            saveAllColumns(created.id, parsed.columns),
            saveAllRows(created.id, parsed.rows),
            saveAllFormulas(created.id, parsed.formulas),
            saveAllCellFormats(created.id, parsed.cellFormats),
          ]);

          setFiles((prev) =>
            prev.map((f) =>
              f.name === file.name
                ? { ...f, progress: 100, status: "success" }
                : f,
            ),
          );

          toast.success(
            `Imported ${parsed.source === "excel" ? "Excel" : "CSV"} file successfully.`,
          );

          setBusy(false);
          showSheetLoadingOverlay();
          router.push(`/sheet/${created.id}?imported=${parsed.source}`);
          return;
        } catch (error: any) {
          setFiles((prev) =>
            prev.map((f) =>
              f.name === file.name
                ? {
                    ...f,
                    status: "error",
                    progress: 100,
                    error: error?.message ?? "Import failed",
                  }
                : f,
            ),
          );
          toast.error(error?.message ?? `Failed to import "${file.name}"`);
        }
      }

      setBusy(false);
    },
    [destinationType, router, selectedFolderId, selectedOrganizationId],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      importFiles(Array.from(e.dataTransfer.files));
    },
    [importFiles],
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      importFiles(Array.from(e.target.files));
      e.target.value = "";
    }
  };

  const removeFile = (fileName: string) => {
    setFiles((prev) => prev.filter((f) => f.name !== fileName));
  };

  // ─── render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4 animate-fade-in">
      {/* ── destination selector ── */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div>
          <p className="text-sm font-medium">Import destination</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            By default the imported sheet opens now and appears in Recent. You
            can also save it to a personal folder or organization.
          </p>
        </div>

        <div className="grid grid-cols-1 cursor-pointer sm:grid-cols-3 gap-2">
          {(
            [
              {
                type: "skip" as const,
                icon: FileSpreadsheet,
                label: "Recent only",
                sub: "Open now without a folder",
                disabled: organizations.length === 0,

              },
              {
                type: "personal" as const,
                icon: User,
                label: "Personal",
                sub: "Save in my workspace",
                disabled: organizations.length === 0,

              },
              {
                type: "organization" as const,
                icon: Building2,
                label: "Organization",
                sub: "Choose org below",
                disabled: organizations.length === 0,
              },
            ] as const
          ).map(({ type, icon: Icon, label, sub, disabled }) => (
            <button
              key={type}
              type="button"
              onClick={() => handleDestinationTypeChange(type)}
              disabled={busy || disabled}
              className={`h-12 rounded-lg border px-3 py-8 text-left flex items-center gap-2 transition-colors disabled:opacity-50 ${
                destinationType === type
                  ? "border-primary bg-primary/10"
                  : "border-border hover:bg-muted"
              }`}
            >
              <Icon className="h-4 w-4 text-primary" />
              <span>
                <span className="block text-sm font-medium">{label}</span>
                <span className="block text-[11px] text-muted-foreground">
                  {sub}
                </span>
              </span>
            </button>
          ))}
        </div>

        {destinationType === "personal" &&
          (folders.length > 0 ? (
            <label className="block">
              <span className="text-xs font-medium">Personal folder</span>
              <select
                className="mt-1 h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/25"
                value={selectedFolderId}
                onChange={(e) => setSelectedFolderId(e.target.value)}
                disabled={busy}
              >
                {folders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <div className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              <Folder className="h-4 w-4" />
              Create a personal folder first, or use No folder.
            </div>
          ))}

        {destinationType === "organization" && (
          <label className="block">
            <span className="text-xs font-medium">Organization</span>
            <select
              className="mt-1 h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/25"
              value={selectedOrganizationId}
              onChange={(e) => setSelectedOrganizationId(e.target.value)}
              disabled={busy}
            >
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {/* ── dropzone ── */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
          isDragging
            ? "border-primary bg-primary/5 scale-[1.02]"
            : "border-border hover:border-primary/50 hover:bg-muted/50"
        }`}
      >
        <input
          type="file"
          id="file-input"
          multiple={false}
          accept=".csv,.xlsx,.xls"
          onChange={handleFileInput}
          className="hidden"
          disabled={busy}
        />
        <div className="flex flex-col items-center gap-3">
          <div
            className={`h-14 w-14 rounded-2xl flex items-center justify-center transition-colors duration-300 ${
              isDragging ? "bg-primary/20" : "bg-muted"
            }`}
          >
            <Upload
              className={`h-7 w-7 transition-colors duration-300 ${
                isDragging ? "text-primary" : "text-muted-foreground"
              }`}
            />
          </div>
          <div>
            <p className="font-medium">
              Drop your spreadsheets here, or{" "}
              <label
                htmlFor="file-input"
                className="text-primary cursor-pointer hover:underline"
              >
                browse
              </label>
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Supports CSV, XLSX, XLS files up to 50MB
            </p>
          </div>
        </div>
      </div>

      {/* ── file list ── */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                </div>
                {file.status === "uploading" && (
                  <Progress value={file.progress} className="h-1" />
                )}
                {file.status === "error" && file.error && (
                  <p className="text-[11px] text-destructive mt-1 truncate">
                    {file.error}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {file.status === "success" && (
                  <CheckCircle2 className="h-5 w-5 text-success" />
                )}
                {file.status === "error" && (
                  <AlertCircle className="h-5 w-5 text-destructive" />
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => removeFile(file.name)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImportDropzone;