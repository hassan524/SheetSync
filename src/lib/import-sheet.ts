import * as XLSX from "xlsx";
import type { CellFormat, ColumnDef, SheetRow } from "@/types";

export const BLANK_IMPORT_TEMPLATE_ID = "f628aed8-bca7-4f51-b687-6db9f932be34";
export const MAX_IMPORT_BYTES = 50 * 1024 * 1024;
export const MIN_IMPORT_COLUMNS = 26;

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

function inferType(values: Array<string | number | boolean>): ColumnDef["type"] {
  const nonEmpty = values.filter(
    (v) => v !== "" && v !== null && v !== undefined,
  );
  if (nonEmpty.length === 0) return "text";
  if (nonEmpty.every((v) => typeof v === "boolean")) return "checkbox";
  if (nonEmpty.every((v) => typeof v === "number")) return "number";
  const asText = nonEmpty.map((v) => String(v).trim());
  if (asText.every((v) => !Number.isNaN(Date.parse(v)))) return "date";
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
  if (asText.every((v) => priorityValues.has(v.toLowerCase()))) {
    return "priority";
  }
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

export function buildImportedSheetData(
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

export function getImportedSheetTitle(fileName: string): string {
  let title = fileName.replace(/\.(xlsx|xls|csv)$/i, "").trim();
  if (title.length < 5) {
    title = `Imported ${title || "Sheet"}`;
  }
  while (title.length < 5) {
    title = title + " Sheet";
  }
  return title;
}
