// lib/import-sheet.ts
import ExcelJS from "exceljs";
import type { CellFormat, ColumnDef, SheetRow } from "@/types";

export const BLANK_IMPORT_TEMPLATE_ID = "f628aed8-bca7-4f51-b687-6db9f932be34";
export const MAX_IMPORT_BYTES        = 50 * 1024 * 1024;
export const MIN_IMPORT_COLUMNS      = 26;

const AUTO_WRAP_CHAR_THRESHOLD  = 60;
const EXCEL_COL_WIDTH_TO_PX     = 7;
const DEFAULT_COL_WIDTH_PX      = 160;
const MIN_COL_WIDTH_PX          = 60;
const MAX_COL_WIDTH_PX          = 600;
// px per character used when auto-sizing column widths from content
const CHAR_WIDTH_PX             = 8;
const CELL_PADDING_PX           = 24;

// ─── helpers ──────────────────────────────────────────────────────────────────

function columnIndexToName(index: number): string {
  let n    = index + 1;
  let name = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    name      = String.fromCharCode(65 + rem) + name;
    n         = Math.floor((n - 1) / 26);
  }
  return name;
}

function argbToHex(argb: string | undefined): string | undefined {
  if (!argb || typeof argb !== "string") return undefined;
  const hex   = argb.length === 8 ? argb.slice(2) : argb;
  if (!/^[0-9a-f]{6}$/i.test(hex)) return undefined;
  const lower = hex.toLowerCase();
  if (lower === "ffffff" || lower === "000000") return undefined;
  return `#${lower}`;
}

/** Rough luminance check — returns true when a hex colour is "dark" */
function isDarkColor(hex: string | undefined): boolean {
  if (!hex) return false;
  const raw = hex.replace("#", "");
  if (raw.length !== 6) return false;
  const r   = parseInt(raw.slice(0, 2), 16);
  const g   = parseInt(raw.slice(2, 4), 16);
  const b   = parseInt(raw.slice(4, 6), 16);
  // perceived luminance
  return (0.299 * r + 0.587 * g + 0.114 * b) < 128;
}

function normalizeValue(v: ExcelJS.CellValue): string | number | boolean {
  if (v === null || v === undefined) return "";
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return Number.isFinite(v) ? v : "";

  if (typeof v === "object" && "richText" in (v as any)) {
    return (v as ExcelJS.CellRichTextValue).richText.map((r) => r.text).join("");
  }
  if (typeof v === "object" && "result" in (v as any)) {
    const result = (v as ExcelJS.CellFormulaValue).result;
    if (result === null || result === undefined) return "";
    if (typeof result === "number") return Number.isFinite(result) ? result : "";
    if (typeof result === "boolean") return result;
    return String(result).trim();
  }
  if (typeof v === "object" && "sharedStrings" in (v as any)) return "";
  if (v instanceof Date) {
    if (isNaN(v.getTime())) return "";
    return v.toISOString().slice(0, 10);
  }

  const s     = String(v).trim();
  if (s === "") return "";
  const lower = s.toLowerCase();
  if (lower === "true")  return true;
  if (lower === "false") return false;
  const asNum = Number(s);
  if (!Number.isNaN(asNum) && s !== "") return asNum;
  return s;
}

function normalizeFormula(formula: string): string {
  return formula
    .replace(/^=/, "")
    .replace(/_xlfn\./gi, "")
    .replace(/;/g, ",")
    .trim();
}

function getCellFormat(cell: ExcelJS.Cell): CellFormat | null {
  const format: CellFormat = {};

  const font = cell.font;
  if (font) {
    if (font.bold)      format.bold      = true;
    if (font.italic)    format.italic    = true;
    if (font.underline) format.underline = true;
    if (typeof font.size === "number" && font.size >= 6 && font.size <= 96) {
      format.fontSize = Math.round(font.size);
    }
    if (font.name?.trim()) format.fontFamily = font.name.trim();
    const textColor = argbToHex(font.color?.argb);
    if (textColor) format.textColor = textColor;
  }

  const fill = cell.fill as any;
  if (fill) {
    const fgArgb: string | undefined =
      fill.fgColor?.argb ?? fill.gradient?.stops?.[0]?.color?.argb;
    const bgColor = argbToHex(fgArgb);
    if (bgColor) format.bgColor = bgColor;
  }

  const alignment = cell.alignment;
  if (alignment) {
    if (
      alignment.horizontal === "center" ||
      alignment.horizontal === "right"  ||
      alignment.horizontal === "left"
    ) {
      format.align = alignment.horizontal;
    }
    if (alignment.wrapText) format.textWrap = true;
  }

  return Object.keys(format).length > 0 ? format : null;
}

// ─── Type inference ────────────────────────────────────────────────────────────
// Dash / hyphen "-" values are treated as "empty" so they don't block select detection.
function inferType(
  values: Array<string | number | boolean>,
  _columnName = "",
): ColumnDef["type"] {
  // Treat bare dash as empty placeholder
  const nonEmpty = values.filter(
    (v) => v !== "" && v !== null && v !== undefined && String(v).trim() !== "-",
  );
  if (nonEmpty.length === 0) return "text";

  if (nonEmpty.every((v) => typeof v === "boolean")) return "checkbox";

  const isNumericVal = (v: any) =>
    typeof v === "number" ||
    (typeof v === "string" && v.trim() !== "" && !isNaN(Number(v)));
  if (nonEmpty.every(isNumericVal)) return "number";

  const asText = nonEmpty.map((v) => String(v).trim());

  const looksLikeDate = (s: string) =>
    /^\d{4}-\d{2}-\d{2}/.test(s) ||
    /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/.test(s);
  if (asText.every((v) => looksLikeDate(v) && !Number.isNaN(Date.parse(v)))) {
    return "date";
  }

  const STATUS_VALUES = new Set([
    "todo", "to do", "not started", "in progress", "in review", "done", "blocked",
    "completed", "approved", "on hold", "cancelled", "pending", "active",
  ]);
  if (asText.every((v) => STATUS_VALUES.has(v.toLowerCase()))) return "status";

  const PRIORITY_VALUES = new Set([
    "low", "medium", "high", "critical", "urgent", "done",
  ]);
  if (asText.every((v) => PRIORITY_VALUES.has(v.toLowerCase()))) return "priority";

  // select — blocked entirely if any cell looks numeric
  const hasAnyNumeric = asText.some((v) => !isNaN(Number(v)) && v.trim() !== "");
  if (!hasAnyNumeric) {
    const unique    = new Set(asText.map((v) => v.toLowerCase()));
    const minRepeat = nonEmpty.length > 0 ? Math.floor(nonEmpty.length / unique.size) : 0;
    const longValue = asText.some((v) => v.length > 40);

    if (
      !longValue          &&
      unique.size >= 2    &&
      unique.size <= 8    &&
      nonEmpty.length >= 3 &&
      (minRepeat >= 2 || (unique.size <= 5 && nonEmpty.length >= 3))
    ) {
      return "select";
    }
  }

  return "text";
}

// ─── Merge helpers ─────────────────────────────────────────────────────────────

function buildMergeSlaveSet(ws: ExcelJS.Worksheet): Set<string> {
  const slaves = new Set<string>();
  const merges: Record<string, { model: { top: number; left: number; bottom: number; right: number } }> =
    (ws as any)._merges ?? {};
  for (const masterAddr of Object.keys(merges)) {
    const { top, left, bottom, right } = merges[masterAddr].model;
    for (let r = top; r <= bottom; r++) {
      for (let c = left; c <= right; c++) {
        const addr = `${columnIndexToName(c - 1)}${r}`;
        if (addr !== masterAddr) slaves.add(addr);
      }
    }
  }
  return slaves;
}

function buildMergeSpanMap(
  ws: ExcelJS.Worksheet,
): Map<string, { rowSpan: number; colSpan: number }> {
  const map = new Map<string, { rowSpan: number; colSpan: number }>();
  const merges: Record<string, { model: { top: number; left: number; bottom: number; right: number } }> =
    (ws as any)._merges ?? {};
  for (const masterAddr of Object.keys(merges)) {
    const { top, left, bottom, right } = merges[masterAddr].model;
    map.set(masterAddr, { rowSpan: bottom - top + 1, colSpan: right - left + 1 });
  }
  return map;
}

// ─── Row classification helpers ────────────────────────────────────────────────

/** Wide single-value heading merged across most columns */
function isTitleRow(
  vals: Array<string | number | boolean>,
  usedColCount: number,
): boolean {
  const nonEmpty = vals.filter((v) => v !== "" && v !== null && v !== undefined);
  if (nonEmpty.length !== 1) return false;
  if (typeof nonEmpty[0] !== "string") return false;
  const idx        = vals.findIndex((v) => v !== "" && v !== null && v !== undefined);
  if (idx > 2) return false;
  const emptyCount = vals
    .slice(0, usedColCount)
    .filter((v) => v === "" || v === null || v === undefined).length;
  return emptyCount >= Math.floor(usedColCount * 0.4);
}

/**
 * Column header row: multiple short text labels, no numbers, no colon-labels.
 * Also accepts rows where ALL non-empty values are short text even if a few
 * cells are empty (sparse header rows).
 */
function isColumnHeaderRow(vals: Array<string | number | boolean>): boolean {
  const nonEmpty = vals.filter((v) => v !== "" && v !== null && v !== undefined);
  if (nonEmpty.length === 0) return false;
  if (
    nonEmpty.some(
      (v) =>
        typeof v === "number" ||
        (typeof v === "string" && v.trim() !== "" && !isNaN(Number(v))),
    )
  ) {
    return false;
  }
  if (
    nonEmpty.some(
      (v) =>
        typeof v === "string" &&
        (v.endsWith(":") || v.startsWith("Select")),
    )
  ) {
    return false;
  }
  return nonEmpty.every((v) => typeof v === "string" && v.length < 60);
}

// ─── Width calculator ──────────────────────────────────────────────────────────

/**
 * Given every value that will appear in a column (header rows + data rows),
 * compute a sensible pixel width:
 *   width = max( excelWidth, longestContentWidth )
 * clamped to [MIN_COL_WIDTH_PX, MAX_COL_WIDTH_PX].
 */
function calcColumnWidth(
  excelRawWidth: number,
  contentValues: Array<string | number | boolean>,
): number {
  const excelPx = excelRawWidth > 0
    ? Math.round(excelRawWidth * EXCEL_COL_WIDTH_TO_PX)
    : 0;

  const longestChars = contentValues.reduce<number>((max, v) => {
    const len = String(v ?? "").length;
    return len > max ? len : max;
  }, 0);
  const contentPx = longestChars * CHAR_WIDTH_PX + CELL_PADDING_PX;

  const raw = Math.max(excelPx, contentPx, DEFAULT_COL_WIDTH_PX);
  return Math.min(MAX_COL_WIDTH_PX, Math.max(MIN_COL_WIDTH_PX, raw));
}

// ─── main export ──────────────────────────────────────────────────────────────

export async function buildImportedSheetData(
  file: File,
  buffer: ArrayBuffer,
): Promise<{
  columns:     ColumnDef[];
  rows:        SheetRow[];
  formulas:    Record<string, string>;
  cellFormats: Record<string, CellFormat>;
  source:      "csv" | "excel";
}> {
  const lower  = file.name.toLowerCase();
  const source: "csv" | "excel" = lower.endsWith(".csv") ? "csv" : "excel";

  const workbook = new ExcelJS.Workbook();

  // ── CSV ────────────────────────────────────────────────────────────────────
  if (source === "csv") {
    const blob  = new Blob([buffer], { type: "text/csv" });
    const text  = await blob.text();
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    const maxW  = lines.reduce((m, l) => Math.max(m, l.split(",").length), 0);

    const columns: ColumnDef[] = Array.from(
      { length: Math.max(MIN_IMPORT_COLUMNS, maxW) },
      (_, i) => ({
        key:      `col_${i}`,
        name:     columnIndexToName(i),
        width:    DEFAULT_COL_WIDTH_PX,
        editable: true,
        type:     "text" as ColumnDef["type"],
      }),
    );

    const formulas:    Record<string, string>     = {};
    const cellFormats: Record<string, CellFormat> = {};

    const rows: SheetRow[] = lines.map((line, ri) => {
      const cells  = line.split(",");
      const mapped: SheetRow = { id: String(ri + 1) };
      columns.forEach((col, ci) => {
        const raw = cells[ci]?.replace(/^"|"$/g, "").trim() ?? "";
        mapped[col.key] = normalizeValue(raw as any);
        if (raw.length > AUTO_WRAP_CHAR_THRESHOLD) {
          cellFormats[`${ri}-${col.key}`] = { textWrap: true };
        }
      });
      return mapped;
    });

    // Auto-size columns from content
    columns.forEach((col, ci) => {
      const vals = rows.map((r) => r[col.key]);
      col.width  = calcColumnWidth(0, vals);
      col.type   = inferType(vals, col.name);
      if (col.type === "select") {
        col.selectOptions = Array.from(
          new Set(vals.filter(Boolean).map(String)),
        ).slice(0, 24);
      }
    });

    return { columns, rows, formulas, cellFormats, source };
  }

  // ── XLSX / XLS ─────────────────────────────────────────────────────────────
  await workbook.xlsx.load(buffer);
  const ws = workbook.worksheets[0];
  if (!ws) throw new Error("The selected file has no data.");

  const { rowCount, columnCount } = ws;
  if (!rowCount || !columnCount) throw new Error("The selected file has no data.");

  const maxCols  = Math.max(MIN_IMPORT_COLUMNS, columnCount);
  const maxRows  = Math.max(1, rowCount);
  const usedCols = columnCount;

  const mergeSlaves  = buildMergeSlaveSet(ws);
  const mergeSpanMap = buildMergeSpanMap(ws);

  // ── Initial column definitions (widths from Excel; names = A/B/C/…) ────────
  // Column names are ALWAYS the alphabetical letter labels.
  // The Excel header text will appear as a real styled row inside the grid.
  const columns: ColumnDef[] = Array.from({ length: maxCols }, (_, idx) => {
    const excelCol = ws.getColumn(idx + 1);
    const rawWidth = typeof excelCol.width === "number" ? excelCol.width : 0;
    const widthPx  = rawWidth > 0
      ? Math.min(
          MAX_COL_WIDTH_PX,
          Math.max(MIN_COL_WIDTH_PX, Math.round(rawWidth * EXCEL_COL_WIDTH_TO_PX)),
        )
      : DEFAULT_COL_WIDTH_PX;
    return {
      key:      `col_${idx}`,
      name:     columnIndexToName(idx), // always A/B/C/…
      width:    widthPx,
      editable: true,
      type:     "text" as ColumnDef["type"],
    };
  });

  const formulas:    Record<string, string>     = {};
  const cellFormats: Record<string, CellFormat> = {};

  // ── Read helpers ───────────────────────────────────────────────────────────

  function readRowValues(ri: number): Array<string | number | boolean> {
    const wsRow = ws.getRow(ri);
    return columns.map((_, ci) => {
      const addr = `${columnIndexToName(ci)}${ri}`;
      if (mergeSlaves.has(addr)) return "";
      return normalizeValue(wsRow.getCell(ci + 1).value);
    });
  }

  function readRowCellFormats(
    ri: number,
    rowIdx: number,
  ): Record<string, CellFormat> {
    const result: Record<string, CellFormat> = {};
    const wsRow  = ws.getRow(ri);

    columns.forEach((col, ci) => {
      const addr    = `${columnIndexToName(ci)}${ri}`;
      const cellKey = `${rowIdx}-${col.key}`;
      if (mergeSlaves.has(addr)) return;

      const cell = wsRow.getCell(ci + 1);

      // Merge span
      const span = mergeSpanMap.get(addr);
      if (span && (span.colSpan > 1 || span.rowSpan > 1)) {
        result[cellKey] = {
          ...(result[cellKey] ?? {}),
          ...(span.colSpan > 1 ? { colSpan: span.colSpan } : {}),
          ...(span.rowSpan > 1 ? { rowSpan: span.rowSpan } : {}),
        } as any;
      }

      const fmt = getCellFormat(cell);
      if (fmt) result[cellKey] = { ...(result[cellKey] ?? {}), ...fmt };

      const rawVal = normalizeValue(cell.value);
      const strVal = String(rawVal ?? "");
      if (strVal.length > AUTO_WRAP_CHAR_THRESHOLD) {
        result[cellKey] = { ...(result[cellKey] ?? {}), textWrap: true };
      }
    });

    return result;
  }

  // ── SCAN: classify every row before data ───────────────────────────────────
  type RowKind = "title" | "metadata" | "header" | "data";

  interface ClassifiedRow {
    ri:     number;
    kind:   RowKind;
    values: Array<string | number | boolean>;
  }

  const classified: ClassifiedRow[] = [];
  let   hitData   = false;
  let   hitHeader = false;

  for (let ri = 1; ri <= Math.min(20, maxRows); ri++) {
    const vals     = readRowValues(ri);
    const nonEmpty = vals.filter((v) => v !== "" && v !== null && v !== undefined);

    if (nonEmpty.length === 0) {
      if (!hitHeader && !hitData) continue;
      break;
    }

    if (hitData) break;

    if (!hitHeader) {
      if (isTitleRow(vals, usedCols)) {
        classified.push({ ri, kind: "title", values: vals });
        continue;
      }
      if (isColumnHeaderRow(vals)) {
        hitHeader = true;
        classified.push({ ri, kind: "header", values: vals });
        continue;
      }
      classified.push({ ri, kind: "metadata", values: vals });
      continue;
    }

    // Inside the header section
    if (isColumnHeaderRow(vals)) {
      classified.push({ ri, kind: "header", values: vals });
    } else {
      hitData = true;
      break;
    }
  }

  const lastClassifiedRi = classified.length > 0
    ? classified[classified.length - 1].ri
    : 0;
  const dataStartRow = lastClassifiedRi + 1;

  // ── Convert ALL pre-data rows (title + metadata + header) into sheet rows ──
  //
  // KEY CHANGE from the original:
  //   Previously, "header" rows were used only to set column names and then
  //   discarded.  Now we keep them as real rows in the grid — styled exactly
  //   as they appear in Excel — so the imported sheet looks identical.
  //
  //   Column names remain A / B / C / … always.

  const preRows: SheetRow[] = [];

  classified.forEach(({ ri, kind, values }, preIdx) => {
    const rowIdx = preIdx;
    const mapped: SheetRow = { id: `pre_${ri}` };
    columns.forEach((col, ci) => {
      mapped[col.key] = values[ci] ?? "";
    });

    // Read the raw Excel cell formats for this row
    const fmts = readRowCellFormats(ri, rowIdx);
    Object.assign(cellFormats, fmts);

    if (kind === "title") {
      // Title rows: bold + centred, slightly larger
      const masterKey = columns.find((_, ci) => values[ci] !== "" && values[ci] !== null && values[ci] !== undefined)?.key ?? columns[0].key;
      const cellKey   = `${rowIdx}-${masterKey}`;
      cellFormats[cellKey] = {
        bold:     true,
        align:    "center",
        fontSize: 14,
        ...(cellFormats[cellKey] ?? {}),
      };
    }

    if (kind === "metadata") {
      // Metadata rows (label:value pairs): keep Excel formatting but ensure
      // they are at least readable
      columns.forEach((col, ci) => {
        const cellKey = `${rowIdx}-${col.key}`;
        if (!cellFormats[cellKey] && values[ci] !== "" && values[ci] !== null) {
          cellFormats[cellKey] = {};
        }
      });
    }

    if (kind === "header") {
      // Header rows: enforce bold.  If the Excel cell already has a dark
      // background we keep it (e.g. the blue band in the template), and we
      // make sure the text is white so it's legible.
      columns.forEach((col, ci) => {
        const cellKey  = `${rowIdx}-${col.key}`;
        const existing = cellFormats[cellKey] ?? {};
        const hasDarkBg = isDarkColor(existing.bgColor);

        cellFormats[cellKey] = {
          bold: true,
          // If Excel gave a dark background, force white text so it's readable
          ...(hasDarkBg ? { textColor: "#ffffff" } : {}),
          // Excel's own format wins for everything else
          ...existing,
          // Always bold for header rows
          // bold: true,
        };
      });
    }

    // Mark this row as an imported header/title/metadata row.
    // SheetClient reads this flag and forces cell type = "text" so the row
    // always renders as plain styled text — never as a status dropdown,
    // date picker, checkbox, etc.
    mapped._isHeaderRow = true;

    preRows.push(mapped);
  });

  // ── Build data rows ────────────────────────────────────────────────────────
  const dataRows: SheetRow[] = [];

  for (let ri = dataStartRow; ri <= maxRows; ri++) {
    const wsRow  = ws.getRow(ri);
    const rowIdx = preRows.length + (ri - dataStartRow);
    const mapped: SheetRow = { id: String(ri) };

    columns.forEach((col, ci) => {
      const colName = columnIndexToName(ci);
      const addr    = `${colName}${ri}`;
      const cellKey = `${rowIdx}-${col.key}`;
      const cell    = wsRow.getCell(ci + 1);

      if (mergeSlaves.has(addr)) {
        mapped[col.key] = "";
        return;
      }

      const span = mergeSpanMap.get(addr);
      if (span && (span.colSpan > 1 || span.rowSpan > 1)) {
        cellFormats[cellKey] = {
          ...(cellFormats[cellKey] ?? {}),
          ...(span.colSpan > 1 ? { colSpan: span.colSpan } : {}),
          ...(span.rowSpan > 1 ? { rowSpan: span.rowSpan } : {}),
        } as any;
      }

      if (cell.type === ExcelJS.ValueType.Formula) {
        const f = (cell.value as ExcelJS.CellFormulaValue)?.formula;
        if (f) formulas[cellKey] = `=${normalizeFormula(f)}`;
      }

      const fmt = getCellFormat(cell);
      if (fmt) cellFormats[cellKey] = { ...(cellFormats[cellKey] ?? {}), ...fmt };

      const rawVal = normalizeValue(cell.value);
      if (String(rawVal ?? "").length > AUTO_WRAP_CHAR_THRESHOLD) {
        cellFormats[cellKey] = { ...(cellFormats[cellKey] ?? {}), textWrap: true };
      }

      mapped[col.key] = rawVal;
    });

    dataRows.push(mapped);
  }

  // Drop fully-empty trailing data rows
  const dataColKeys      = columns.map((c) => c.key);
  const filteredDataRows = dataRows.filter((row) =>
    dataColKeys.some((key) => {
      const v = row[key];
      return v !== "" && v !== null && v !== undefined;
    }),
  );
  const finalDataRows = filteredDataRows.length > 0 ? filteredDataRows : dataRows;

  // ── Combine ────────────────────────────────────────────────────────────────
  const allRows = [...preRows, ...finalDataRows];
  allRows.forEach((row, idx) => { row.id = String(idx + 1); });

  // ── Infer column types from data rows only ─────────────────────────────────
  columns.forEach((col) => {
    const dataVals = finalDataRows.map((r) => r[col.key]);
    col.type       = inferType(dataVals, col.name);
    if (col.type === "select") {
      col.selectOptions = Array.from(
        new Set(
          dataVals
            .filter((v) => v !== null && v !== undefined && v !== "" && String(v).trim() !== "-")
            .map(String),
        ),
      ).slice(0, 24);
    }
  });

  // ── Auto-size column widths from ALL content (header rows + data rows) ─────
  //
  // We iterate every column and find the longest rendered string across
  // every row (pre-rows + data rows), then pick the larger of Excel's own
  // width vs the content-driven width.  This ensures that header labels
  // like "Project / Task" or "Deliverable(s)" are never clipped.
  columns.forEach((col, ci) => {
    const excelCol   = ws.getColumn(ci + 1);
    const rawWidth   = typeof excelCol.width === "number" ? excelCol.width : 0;
    const allValues  = allRows.map((r) => r[col.key]);
    col.width        = calcColumnWidth(rawWidth, allValues);
  });

  return { columns, rows: allRows, formulas, cellFormats, source };
}

export function getImportedSheetTitle(fileName: string): string {
  let title = fileName.replace(/\.(xlsx|xls|csv)$/i, "").trim();
  if (title.length < 5) title = `Imported ${title || "Sheet"}`;
  while (title.length < 5) title += " Sheet";
  return title;
}