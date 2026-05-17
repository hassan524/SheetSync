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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { createSheet } from "@/lib/querys/sheets/sheets";
import { saveAllColumns } from "@/lib/querys/sheet/columns";
import { saveAllRows } from "@/lib/querys/sheet/rows";
import { saveAllCellFormats } from "@/lib/querys/sheet/format";
import { saveAllFormulas } from "@/lib/querys/sheet/formulas";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import type { CellFormat, ColumnDef, SheetRow } from "@/types";

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

const BLANK_TEMPLATE_ID = "f628aed8-bca7-4f51-b687-6db9f932be34";
const MAX_IMPORT_BYTES = 50 * 1024 * 1024;
const MIN_IMPORT_COLUMNS = 26;
const INDEXED_COLORS = [
  "000000",
  "FFFFFF",
  "FF0000",
  "00FF00",
  "0000FF",
  "FFFF00",
  "FF00FF",
  "00FFFF",
  "000000",
  "FFFFFF",
  "FF0000",
  "00FF00",
  "0000FF",
  "FFFF00",
  "FF00FF",
  "00FFFF",
  "800000",
  "008000",
  "000080",
  "808000",
  "800080",
  "008080",
  "C0C0C0",
  "808080",
  "9999FF",
  "993366",
  "FFFFCC",
  "CCFFFF",
  "660066",
  "FF8080",
  "0066CC",
  "CCCCFF",
  "000080",
  "FF00FF",
  "FFFF00",
  "00FFFF",
  "800080",
  "800000",
  "008080",
  "0000FF",
  "00CCFF",
  "CCFFFF",
  "CCFFCC",
  "FFFF99",
  "99CCFF",
  "FF99CC",
  "CC99FF",
  "FFCC99",
  "3366FF",
  "33CCCC",
  "99CC00",
  "FFCC00",
  "FF9900",
  "FF6600",
  "666699",
  "969696",
  "003366",
  "339966",
  "003300",
  "333300",
  "993300",
  "993366",
  "333399",
  "333333",
];

function columnIndexToName(index: number): string {
  let n = index + 1;
  let name = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    name = String.fromCharCode(65 + rem) + name;
    n = Math.floor((n - 1) / 26);
  }
  return name;
}

function normalizeValue(v: unknown): string | number | boolean {
  if (v === null || v === undefined) return "";
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return Number.isFinite(v) ? v : "";
  const s = String(v).trim();
  if (s === "") return "";
  const lower = s.toLowerCase();
  if (lower === "true") return true;
  if (lower === "false") return false;
  const asNum = Number(s);
  if (!Number.isNaN(asNum) && s !== "") return asNum;
  return s;
}

function normalizeCellValue(cell: XLSX.CellObject | undefined) {
  if (!cell) return "";
  if (cell.f) return normalizeValue(cell.v ?? "");
  return normalizeValue(cell.v ?? "");
}

function normalizeFormula(formula: string): string {
  return formula
    .replace(/^=/, "")
    .replace(/_xlfn\./gi, "")
    .replace(/;/g, ",")
    .trim();
}

function applyTint(hex: string, tint?: number): string {
  if (typeof tint !== "number" || tint === 0) return hex;
  const channels = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const tinted = channels.map((value) => {
    const next = tint < 0 ? value * (1 + tint) : value + (255 - value) * tint;
    return Math.max(0, Math.min(255, Math.round(next)));
  });
  return tinted.map((value) => value.toString(16).padStart(2, "0")).join("");
}

function excelColorToHex(color: any): string | undefined {
  const rgb =
    typeof color?.rgb === "string"
      ? color.rgb
      : typeof color?.argb === "string"
        ? color.argb
        : typeof color?.indexed === "number"
          ? INDEXED_COLORS[color.indexed]
          : undefined;
  if (!rgb || typeof rgb !== "string") return undefined;
  const normalized = rgb.length === 8 ? rgb.slice(2) : rgb;
  if (!/^([0-9a-f]{6})$/i.test(normalized)) return undefined;
  return `#${applyTint(normalized, color?.tint)}`;
}

function getCellFormatFromStyle(cell: XLSX.CellObject | undefined) {
  const style = (cell as any)?.s;
  if (!style || typeof style !== "object") return null;

  const format: CellFormat = {};
  if (style.font?.bold) format.bold = true;
  if (style.font?.italic) format.italic = true;
  if (style.font?.underline) format.underline = true;

  const fontColor = excelColorToHex(style.font?.color);
  if (fontColor) format.textColor = fontColor;

  const fillColor =
    excelColorToHex(style.fill?.fgColor) ??
    excelColorToHex(style.fill?.bgColor) ??
    excelColorToHex(style.fill?.patternColor);
  if (
    fillColor &&
    fillColor.toLowerCase() !== "#ffffff" &&
    style.fill?.patternType !== "none"
  ) {
    format.bgColor = fillColor;
  }

  const horizontal = style.alignment?.horizontal;
  if (
    horizontal === "center" ||
    horizontal === "right" ||
    horizontal === "left"
  ) {
    format.align = horizontal;
  }

  if (style.alignment?.wrapText) format.textWrap = true;

  return Object.keys(format).length > 0 ? format : null;
}

function inferType(
  values: Array<string | number | boolean>,
): ColumnDef["type"] {
  const nonEmpty = values.filter(
    (v) => v !== "" && v !== null && v !== undefined,
  );
  if (nonEmpty.length === 0) return "text";
  const allBool = nonEmpty.every((v) => typeof v === "boolean");
  if (allBool) return "checkbox";
  const allNum = nonEmpty.every((v) => typeof v === "number");
  if (allNum) return "number";
  const asText = nonEmpty.map((v) => String(v).trim());
  const allDates = asText.every((v) => !Number.isNaN(Date.parse(v)));
  if (allDates) return "date";
  const statusValues = new Set([
    "todo",
    "to do",
    "not started",
    "in progress",
    "in review",
    "done",
    "blocked",
  ]);
  if (asText.every((v) => statusValues.has(v.toLowerCase()))) return "status";
  const priorityValues = new Set([
    "low",
    "medium",
    "high",
    "critical",
    "urgent",
  ]);
  if (asText.every((v) => priorityValues.has(v.toLowerCase())))
    return "priority";
  const unique = new Set(asText.map((v) => v.toLowerCase()));
  if (
    unique.size > 1 &&
    unique.size <= 12 &&
    unique.size <= nonEmpty.length / 2
  ) {
    return "select";
  }
  return "text";
}

function buildImportedSheetData(
  file: File,
  buffer: ArrayBuffer,
): {
  columns: ColumnDef[];
  rows: SheetRow[];
  formulas: Record<string, string>;
  cellFormats: Record<string, CellFormat>;
  source: "csv" | "excel";
} {
  const wb = XLSX.read(buffer, {
    type: "array",
    cellDates: false,
    cellStyles: true,
  });
  const firstSheetName = wb.SheetNames[0];
  const ws = wb.Sheets[firstSheetName];
  const range = ws?.["!ref"] ? XLSX.utils.decode_range(ws["!ref"]) : null;

  if (!ws || !range) {
    throw new Error("The selected file has no data.");
  }

  const maxCols = Math.max(MIN_IMPORT_COLUMNS, range.e.c - range.s.c + 1);
  const maxRows = Math.max(1, range.e.r - range.s.r + 1);

  const columns: ColumnDef[] = Array.from({ length: maxCols }, (_, idx) => ({
    key: `col_${idx}`,
    name: columnIndexToName(idx),
    width: 160,
    editable: true,
    type: "text",
  }));

  const formulas: Record<string, string> = {};
  const cellFormats: Record<string, CellFormat> = {};
  const rows: SheetRow[] = Array.from({ length: maxRows }, (_, ri) => {
    const mapped: SheetRow = { id: String(ri + 1) };
    columns.forEach((c, ci) => {
      const address = XLSX.utils.encode_cell({
        r: range.s.r + ri,
        c: range.s.c + ci,
      });
      const cell = ws[address];
      const cellKey = `${ri}-${c.key}`;
      if (cell?.f) formulas[cellKey] = `=${normalizeFormula(cell.f)}`;
      const format = getCellFormatFromStyle(cell);
      if (format) cellFormats[cellKey] = format;
      mapped[c.key] = normalizeCellValue(cell);
    });
    return mapped;
  });

  columns.forEach((c) => {
    c.type = inferType(rows.map((r) => r[c.key]));
    if (c.type === "select") {
      c.selectOptions = Array.from(
        new Set(
          rows
            .map((r) => r[c.key])
            .filter((v) => v !== null && v !== undefined && v !== "")
            .map((v) => String(v)),
        ),
      ).slice(0, 24);
    }
  });

  const lower = file.name.toLowerCase();
  const source: "csv" | "excel" = lower.endsWith(".csv") ? "csv" : "excel";
  return { columns, rows, formulas, cellFormats, source };
}

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
    "skip" | "personal" | "organization" | null
  >(null);
  const [selectedFolderId, setSelectedFolderId] = useState("");
  const [selectedOrganizationId, setSelectedOrganizationId] = useState("");

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
      window.removeEventListener("__sheet-ready", removeOverlay);
    };
    window.addEventListener("__sheet-ready", removeOverlay);
  };

  const importFiles = useCallback(
    async (selectedFiles: File[]) => {
      if (selectedFiles.length === 0) return;
      if (!destinationType) {
        toast.error("Choose where to save this imported sheet first.");
        return;
      }
      if (destinationType === "organization" && !selectedOrganizationId) {
        toast.error("Choose an organization for this imported sheet.");
        return;
      }
      setBusy(true);
      const initial = selectedFiles.map((file) => ({
        name: file.name,
        status: "uploading" as const,
        progress: 5,
      }));
      setFiles((prev) => [...prev, ...initial]);

      for (const file of selectedFiles) {
        try {
          if (file.size > MAX_IMPORT_BYTES) {
            throw new Error("File is larger than the 50 MB import limit.");
          }
          if (!/\.(csv|xlsx|xls)$/i.test(file.name)) {
            throw new Error(
              "Unsupported file type. Upload a CSV, XLSX, or XLS file.",
            );
          }
          setFiles((prev) =>
            prev.map((f) =>
              f.name === file.name ? { ...f, progress: 25 } : f,
            ),
          );
          const buffer = await file.arrayBuffer();
          const parsed = buildImportedSheetData(file, buffer);
          setFiles((prev) =>
            prev.map((f) =>
              f.name === file.name ? { ...f, progress: 55 } : f,
            ),
          );

          // Ensure title always meets the 5-char minimum for createSheet validation
          let title = file.name.replace(/\.(xlsx|xls|csv)$/i, "").trim();
          if (title.length < 5) {
            title = `Imported ${title || "Sheet"}`;
          }
          // Final safety: pad if still too short
          while (title.length < 5) {
            title = title + " Sheet";
          }

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
      const droppedFiles = Array.from(e.dataTransfer.files);
      importFiles(droppedFiles);
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

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div>
          <p className="text-sm font-medium">Import destination</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Choose whether to save this import in your personal workspace, an
            organization, or no folder.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setDestinationType("skip")}
            disabled={busy}
            className={`h-12 rounded-lg border px-3 text-left flex items-center gap-2 transition-colors ${
              destinationType === "skip"
                ? "border-primary bg-primary/10"
                : "border-border hover:bg-muted"
            }`}
          >
            <FileSpreadsheet className="h-4 w-4 text-primary" />
            <span>
              <span className="block text-sm font-medium">No folder</span>
              <span className="block text-[11px] text-muted-foreground">
                Import without saving to a folder
              </span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => setDestinationType("personal")}
            disabled={busy}
            className={`h-12 rounded-lg border px-3 text-left flex items-center gap-2 transition-colors ${
              destinationType === "personal"
                ? "border-primary bg-primary/10"
                : "border-border hover:bg-muted"
            }`}
          >
            <User className="h-4 w-4 text-primary" />
            <span>
              <span className="block text-sm font-medium">Personal</span>
              <span className="block text-[11px] text-muted-foreground">
                Save in my workspace
              </span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              setDestinationType("organization");
              setSelectedOrganizationId(
                (prev) => prev || organizations[0]?.id || "",
              );
            }}
            disabled={busy || organizations.length === 0}
            className={`h-12 rounded-lg border px-3 text-left flex items-center gap-2 transition-colors disabled:opacity-50 ${
              destinationType === "organization"
                ? "border-primary bg-primary/10"
                : "border-border hover:bg-muted"
            }`}
          >
            <Building2 className="h-4 w-4 text-primary" />
            <span>
              <span className="block text-sm font-medium">Organization</span>
              <span className="block text-[11px] text-muted-foreground">
                Choose org below
              </span>
            </span>
          </button>
        </div>
        {destinationType === "personal" && (
          <label className="block">
            <span className="text-xs font-medium">Folder</span>
            <select
              className="mt-1 h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/25"
              value={selectedFolderId}
              onChange={(e) => setSelectedFolderId(e.target.value)}
              disabled={busy}
            >
              <option value="">No folder</option>
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>
          </label>
        )}
        {destinationType === "organization" && (
          <label className="block">
            <span className="text-xs font-medium">Organization</span>
            <select
              className="mt-1 h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/25"
              value={selectedOrganizationId}
              onChange={(e) => setSelectedOrganizationId(e.target.value)}
              disabled={busy}
            >
              <option value="">No organization</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
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

      {/* Uploaded Files */}
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
