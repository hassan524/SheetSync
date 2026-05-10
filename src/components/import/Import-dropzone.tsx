"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  FileSpreadsheet,
  X,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { createSheet } from "@/lib/querys/sheets/sheets";
import { saveAllColumns } from "@/lib/querys/sheet/columns";
import { saveAllRows } from "@/lib/querys/sheet/rows";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import type { ColumnDef, SheetRow } from "@/types";

interface ImportedFile {
  name: string;
  size: string;
  status: "uploading" | "success" | "error";
  progress: number;
  error?: string;
}

const BLANK_TEMPLATE_ID = "f628aed8-bca7-4f51-b687-6db9f932be34";

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

function inferType(values: Array<string | number | boolean>): ColumnDef["type"] {
  const nonEmpty = values.filter((v) => v !== "" && v !== null && v !== undefined);
  if (nonEmpty.length === 0) return "text";
  const allBool = nonEmpty.every((v) => typeof v === "boolean");
  if (allBool) return "checkbox";
  const allNum = nonEmpty.every((v) => typeof v === "number");
  if (allNum) return "number";
  return "text";
}

function buildImportedSheetData(file: File, buffer: ArrayBuffer): {
  columns: ColumnDef[];
  rows: SheetRow[];
  source: "csv" | "excel";
} {
  const wb = XLSX.read(buffer, { type: "array", cellDates: false });
  const firstSheetName = wb.SheetNames[0];
  const ws = wb.Sheets[firstSheetName];
  const matrix = XLSX.utils.sheet_to_json<(string | number | boolean)[]>(ws, {
    header: 1,
    raw: true,
    blankrows: false,
  });

  if (!matrix || matrix.length === 0) {
    throw new Error("The selected file has no data.");
  }

  const [rawHeader, ...body] = matrix;
  const maxCols = Math.max(
    rawHeader?.length ?? 0,
    ...body.map((row) => row.length),
    1,
  );
  const headers = Array.from({ length: maxCols }, (_, i) => {
    const val = rawHeader?.[i];
    const title = val ? String(val).trim() : "";
    return title || `Column ${i + 1}`;
  });

  const columns: ColumnDef[] = headers.map((h, idx) => ({
    key: `col${idx}`,
    name: h,
    width: 160,
    editable: true,
    type: "text",
  }));

  const rows: SheetRow[] = body.map((row, ri) => {
    const mapped: SheetRow = { id: String(ri + 1) };
    columns.forEach((c, ci) => {
      mapped[c.key] = normalizeValue(row?.[ci] ?? "");
    });
    return mapped;
  });

  columns.forEach((c, ci) => {
    c.type = inferType(rows.map((r) => r[c.key]));
  });

  const lower = file.name.toLowerCase();
  const source: "csv" | "excel" =
    lower.endsWith(".csv") ? "csv" : "excel";
  return { columns, rows, source };
}

const ImportDropzone = () => {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<ImportedFile[]>([]);
  const [busy, setBusy] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  };

  const importFiles = useCallback(
    async (selectedFiles: File[]) => {
      if (selectedFiles.length === 0) return;
      setBusy(true);
      const initial = selectedFiles.map((file) => ({
        name: file.name,
        size: formatFileSize(file.size),
        status: "uploading" as const,
        progress: 5,
      }));
      setFiles((prev) => [...prev, ...initial]);

      for (const file of selectedFiles) {
        try {
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
          });
          await saveAllColumns(created.id, parsed.columns);
          await saveAllRows(created.id, parsed.rows);

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
    [router],
  );

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    importFiles(droppedFiles);
  }, [importFiles]);

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
                  <span className="text-xs text-muted-foreground">
                    {file.size}
                  </span>
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
