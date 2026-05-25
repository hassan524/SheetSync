// lib/export.ts
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { supabase } from "@/lib/supabase/client";
import {
  SheetRow,
  ColumnDef,
  PRIORITY_OPTIONS,
  STATUS_OPTIONS,
} from "@/types/index";

// ─────────────────────────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────────────────────────

export type ExportFormat = "csv" | "xlsx" | "pdf" | "json";

interface ExportOptions {
  format: ExportFormat;
  sheetId: string;
}

interface SheetExportData {
  title: string;
  isPersonal: boolean;
  rows: SheetRow[];
  columns: ColumnDef[];
  cellFormats: Record<string, any>;
  formulas: Record<string, string>;
}

function parseJsonArray(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String);
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

// Parse selectOptions which can be string[] or {label,bgColor}[]
function parseSelectOptions(raw: any): Array<{ label: string; bgColor?: string; color?: string }> {
  if (!raw) return [];
  let arr: any[] = [];
  if (Array.isArray(raw)) {
    arr = raw;
  } else if (typeof raw === "string") {
    try { arr = JSON.parse(raw); } catch { return []; }
  } else {
    return [];
  }
  return arr.map((item: any) => {
    if (typeof item === "string") return { label: item };
    return { label: String(item.label ?? ""), bgColor: item.bgColor, color: item.color };
  }).filter((o) => o.label);
}

function safeExportFilename(title: string, extension: ExportFormat) {
  const name = title.replace(/[\\/:*?"<>|]/g, "-").replace(/\s+/g, " ").trim();
  return `${name || "SheetSync Export"}.${extension}`;
}

// ─────────────────────────────────────────────────────────────
//  COLORS
// ─────────────────────────────────────────────────────────────

const PRIORITY_COLOR_MAP: Record<string, { hex: string; label: string }> = {
  low:    { hex: "059669", label: "Low" },
  medium: { hex: "d97706", label: "Medium" },
  high:   { hex: "dc2626", label: "High" },
  urgent: { hex: "7c2d12", label: "Urgent" },
};

const STATUS_COLOR_MAP: Record<string, { hex: string; bgHex: string; label: string }> = {
  todo:        { hex: "6b7280", bgHex: "f3f4f6", label: "To Do" },
  in_progress: { hex: "2563eb", bgHex: "dbeafe", label: "In Progress" },
  done:        { hex: "059669", bgHex: "d1fae5", label: "Done" },
  blocked:     { hex: "dc2626", bgHex: "fee2e2", label: "Blocked" },
};

// Parse a 6-char hex string into [r, g, b]
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "").padEnd(6, "0");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

// ─────────────────────────────────────────────────────────────
//  FETCH FROM DB
// ─────────────────────────────────────────────────────────────

async function fetchSheetForExport(sheetId: string): Promise<SheetExportData> {
  const [sheet, columns, rows, formats, formulas] = await Promise.all([
    supabase.from("sheets").select("title, is_personal").eq("id", sheetId).single(),
    supabase.from("columns").select("*").eq("sheet_id", sheetId).order("position"),
    supabase.from("rows").select("*").eq("sheet_id", sheetId).order("position"),
    supabase.from("cell_formats").select("*").eq("sheet_id", sheetId),
    supabase.from("formulas").select("*").eq("sheet_id", sheetId),
  ]);

  if (sheet.error)   throw new Error(`Sheet load failed: ${sheet.error.message}`);
  if (columns.error) throw new Error(`Columns load failed: ${columns.error.message}`);
  if (rows.error)    throw new Error(`Rows load failed: ${rows.error.message}`);

  return {
    title: sheet.data.title ?? "Untitled",
    isPersonal: sheet.data.is_personal ?? true,

    columns: (columns.data ?? []).map((col) => ({
      key:          col.column_key,
      name:         col.name,
      type:         col.type,
      width:        col.width,
      position:     col.position,
      selectOptions: (() => {
        const raw = col.select_options;
        if (!raw) return [];
        if (Array.isArray(raw)) return raw;
        if (typeof raw === "string") {
          try { return JSON.parse(raw); } catch { return []; }
        }
        return [];
      })(),
      currencyCode: col.currency_code ?? "USD",
      conditional_formatting: col.conditional_formatting ?? null,
      validation_rules: col.validation_rules ?? null,
    })),

    rows: (rows.data ?? [])
      .map((row) => ({ id: row.row_key, ...row.data }))
      .filter((row) => {
        const colKeys = (columns.data ?? []).map((c) => c.column_key);
        return colKeys.some((key) => {
          const val = row[key];
          return val !== null && val !== undefined && val !== "";
        });
      }),

    cellFormats: Object.fromEntries(
      (formats.data ?? []).map((f) => [
        f.cell_key,
        {
          bold:          f.bold ?? false,
          italic:        f.italic ?? false,
          underline:     f.underline ?? false,
          strikethrough: f.strikethrough ?? false,
          fontSize:      f.font_size ?? 10,
          fontFamily:    f.font_family ?? "Arial",
          textColor:     f.text_color ?? null,
          bgColor:       f.bg_color ?? null,
          align:         f.text_align ?? "left",
          textWrap:      f.text_wrap ?? false,
        },
      ]),
    ),

    formulas: Object.fromEntries(
      (formulas.data ?? []).map((f) => [f.cell_key, f.formula]),
    ),
  };
}

// ─────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

function resolveValue(raw: any, colType: ColumnDef["type"], forDisplay = false): string {
  if (raw === null || raw === undefined || raw === "") return "";

  switch (colType) {
    case "checkbox":
      return raw === true || raw === "true"
        ? (forDisplay ? "Yes" : "TRUE")
        : (forDisplay ? "No" : "FALSE");
    case "currency":
      return forDisplay
        ? `$${Number(raw).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : String(Number(raw));
    case "progress":
      return forDisplay
        ? `${Math.min(100, Math.max(0, Number(raw)))}%`
        : String(raw);
    case "date": {
      try {
        const d = new Date(raw);
        if (isNaN(d.getTime())) return String(raw);
        return forDisplay ? d.toLocaleDateString("en-US") : d.toISOString();
      } catch {
        return String(raw);
      }
    }
    case "priority": {
      const match = PRIORITY_OPTIONS?.find((p) => p.value === String(raw).toLowerCase());
      return match?.label ?? String(raw);
    }
    case "status": {
      const match = STATUS_OPTIONS?.find((s) => s.value === String(raw).toLowerCase());
      return match?.label ?? String(raw);
    }
    default:
      return String(raw);
  }
}

function csvEscape(val: string): string {
  if (val.includes(",") || val.includes('"') || val.includes("\n")) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

function xlsxNumFmt(colType: ColumnDef["type"]): string | undefined {
  switch (colType) {
    case "currency": return '"$"#,##0.00';
    case "number":   return "#,##0.##";
    case "progress": return "0%";
    case "date":     return "yyyy-mm-dd";
    default:         return undefined;
  }
}

function displayWidth(value: string) {
  return String(value ?? "").split(/\r?\n/).reduce((max, line) => Math.max(max, line.length), 0);
}

function getAutoColumnWidth(col: ColumnDef, rows: SheetRow[], unit: "chars" | "mm", doc?: jsPDF) {
  // Use BOTH resolved display value AND raw string value — whichever is longer
  // This catches long raw strings (e.g. text columns) that resolveValue passes through unchanged,
  // but also long select labels, formatted currency, etc.
  const values = [
    col.name,
    ...rows.map((row) => {
      const raw     = row[col.key];
      const display = resolveValue(raw, col.type, true);
      const rawStr  = raw != null ? String(raw) : "";
      return rawStr.length > display.length ? rawStr : display;
    }),
  ];

  if (unit === "chars") {
    const maxChars = values.reduce((max, value) => Math.max(max, displayWidth(value)), 0);
    return Math.max(12, Math.min(60, maxChars + 3));
  }

  if (!doc) return Math.max(18, Math.min(80, (col.width ?? 160) / 4));

  // Measure body text at body font size
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  const bodyWidth = values.slice(1).reduce((max, value) => Math.max(max, doc.getTextWidth(value)), 0);

  // Measure header at header font size (bold 8pt)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  const headerWidth = doc.getTextWidth(col.name);

  // Natural width = wider of header vs body content + padding (6mm)
  // Cap at 120mm (not 95) so columns with medium-long text aren't squashed
  // Minimum 18mm so tiny columns (e.g. checkbox, number) aren't cramped
  return Math.max(18, Math.min(120, Math.max(bodyWidth, headerWidth) + 6));
}

// ─────────────────────────────────────────────────────────────
//  XLSX HEADER STYLE
// ─────────────────────────────────────────────────────────────

function makeHeaderStyle(colType: ColumnDef["type"]): any {
  const base = {
    font: { bold: true, sz: 11, color: { rgb: "FFFFFF" } },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    border: {
      bottom: { style: "medium", color: { rgb: "0A6B52" } },
      right:  { style: "thin",   color: { rgb: "0D9E75" } },
    },
  };
  const fills: Record<string, string> = {
    text: "0D7C5F", number: "1D4ED8", currency: "065F46", date: "6D28D9",
    checkbox: "374151", status: "1E3A5F", priority: "7C2D12", progress: "0F766E", url: "0369A1",
  };
  return {
    ...base,
    fill: { patternType: "solid", fgColor: { rgb: fills[colType ?? "text"] ?? fills.text } },
  };
}

// ─────────────────────────────────────────────────────────────
//  CSV EXPORT
// ─────────────────────────────────────────────────────────────

function exportCSV(data: SheetExportData) {
  const { rows, columns, title } = data;
  const lines: string[] = [];
  lines.push(columns.map((c) => csvEscape(c.name)).join(","));
  const CHUNK = 500;
  for (let i = 0; i < rows.length; i += CHUNK) {
    for (const row of rows.slice(i, i + CHUNK)) {
      lines.push(columns.map((col) => csvEscape(resolveValue(row[col.key], col.type, true))).join(","));
    }
  }
  triggerDownload(
    new Blob(["\uFEFF" + lines.join("\r\n")], { type: "text/csv;charset=utf-8;" }),
    safeExportFilename(title, "csv"),
  );
}

// ─────────────────────────────────────────────────────────────
//  EXCEL EXPORT
// ─────────────────────────────────────────────────────────────

function exportXLSX(data: SheetExportData) {
  const { rows, columns, title, cellFormats } = data;
  const wb = XLSX.utils.book_new();

  const wsData: any[][] = [
    columns.map((c) => c.name),
    ...rows.map((row) =>
      columns.map((col) => {
        const raw = row[col.key];
        if (
          (col.type === "number" || col.type === "currency" || col.type === "progress") &&
          raw !== "" && raw !== null && raw !== undefined
        ) {
          const n = Number(raw);
          return isNaN(n) ? resolveValue(raw, col.type) : n;
        }
        if (col.type === "checkbox") return raw === true || raw === "true";
        return resolveValue(raw, col.type);
      }),
    ),
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  columns.forEach((col, ci) => {
    const ref = XLSX.utils.encode_cell({ r: 0, c: ci });
    if (!ws[ref]) return;
    ws[ref].s = makeHeaderStyle(col.type);
  });

  rows.forEach((row, ri) => {
    const isEvenRow = ri % 2 === 1;
    columns.forEach((col, ci) => {
      const ref = XLSX.utils.encode_cell({ r: ri + 1, c: ci });
      if (!ws[ref]) return;

      const fmtKey = `${ri}-${col.key}`;
      const fmt    = cellFormats[fmtKey] ?? {};
      const rawVal = row[col.key];
      const valStr = String(rawVal ?? "").toLowerCase();

      if (col.type === "priority" && PRIORITY_COLOR_MAP[valStr]) {
        const { hex } = PRIORITY_COLOR_MAP[valStr];
        ws[ref].s = {
          font: { bold: true, sz: 10, color: { rgb: "FFFFFF" } },
          fill: { patternType: "solid", fgColor: { rgb: hex } },
          alignment: { horizontal: "center", vertical: "center" },
          border: { bottom: { style: "thin", color: { rgb: "E8EAED" } } },
        };
        return;
      }

      if (col.type === "status" && STATUS_COLOR_MAP[valStr]) {
        const { hex, bgHex } = STATUS_COLOR_MAP[valStr];
        ws[ref].s = {
          font: { bold: true, sz: 10, color: { rgb: hex } },
          fill: { patternType: "solid", fgColor: { rgb: bgHex } },
          alignment: { horizontal: "center", vertical: "center" },
          border: { bottom: { style: "thin", color: { rgb: "E8EAED" } } },
        };
        return;
      }

      if (col.type === "progress" && rawVal !== "" && rawVal !== null) {
        const pct = Math.min(100, Math.max(0, Number(rawVal)));
        ws[ref].v = pct / 100; ws[ref].t = "n"; ws[ref].z = "0%";
        ws[ref].s = {
          font: { sz: 10, bold: pct >= 80, color: { rgb: pct >= 80 ? "065F46" : pct >= 50 ? "92400E" : "1E3A5F" } },
          fill: { patternType: "solid", fgColor: { rgb: pct >= 80 ? "D1FAE5" : pct >= 50 ? "FEF3C7" : "DBEAFE" } },
          alignment: { horizontal: "center" },
          numFmt: "0%",
        };
        return;
      }

      if (col.type === "checkbox") {
        ws[ref].s = {
          font: { sz: 12, color: { rgb: rawVal === true || rawVal === "true" ? "059669" : "9CA3AF" } },
          alignment: { horizontal: "center", vertical: "center" },
          fill: isEvenRow ? { patternType: "solid", fgColor: { rgb: "F9FAFB" } } : undefined,
        };
        return;
      }

      const numFmt = xlsxNumFmt(col.type);
      ws[ref].s = {
        font: {
          bold: fmt.bold ?? false, italic: fmt.italic ?? false,
          underline: fmt.underline ?? false, strike: fmt.strikethrough ?? false,
          sz: fmt.fontSize ?? 10,
          color: fmt.textColor ? { rgb: fmt.textColor.replace("#", "") } : undefined,
        },
        fill: fmt.bgColor
          ? { patternType: "solid", fgColor: { rgb: fmt.bgColor.replace("#", "") } }
          : isEvenRow ? { patternType: "solid", fgColor: { rgb: "F9FAFB" } } : undefined,
        alignment: {
          horizontal: fmt.align ?? (col.type === "number" || col.type === "currency" ? "right" : "left"),
          vertical: "center",
          wrapText: fmt.textWrap ?? false,
        },
        border: {
          bottom: { style: "thin", color: { rgb: "E8EAED" } },
          right:  { style: "thin", color: { rgb: "F3F4F6" } },
        },
        ...(numFmt ? { numFmt } : {}),
      };
    });
  });

  ws["!cols"]       = columns.map((col) => ({ wch: getAutoColumnWidth(col, rows, "chars") }));
  ws["!rows"]       = [{ hpt: 30, hpx: 30 }, ...rows.map(() => ({ hpt: 28, hpx: 28 }))];
  ws["!freeze"]     = { xSplit: 0, ySplit: 1 };
  ws["!autofilter"] = { ref: `A1:${XLSX.utils.encode_col(columns.length - 1)}1` };
  ws["!ref"]        = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: rows.length, c: columns.length - 1 } });

  XLSX.utils.book_append_sheet(wb, ws, title.slice(0, 31));
  wb.Props = { Title: title, Subject: "SheetSync Export", Author: "SheetSync", CreatedDate: new Date() };
  XLSX.writeFile(wb, safeExportFilename(title, "xlsx"), { cellStyles: true, compression: true });
}

// ─────────────────────────────────────────────────────────────
//  PDF EXPORT
// ─────────────────────────────────────────────────────────────

function exportPDF(data: SheetExportData) {
  const { rows, columns, title, cellFormats } = data;

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4", compress: true });

  const PAGE_W      = doc.internal.pageSize.getWidth();   // 297
  const PAGE_H      = doc.internal.pageSize.getHeight();  // 210
  const MARGIN_L    = 10;
  const MARGIN_R    = 10;
  const PRINTABLE_W = PAGE_W - MARGIN_L - MARGIN_R;       // 277
  const TABLE_TOP   = 34;
  const FOOTER_Y    = PAGE_H - 5;

  // ── Page-1 header band ───────────────────────────────────
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  doc.setFillColor(13, 124, 95);
  doc.rect(0, 0, PAGE_W, 22, "F");
  doc.setFontSize(13); doc.setFont("helvetica", "bold"); doc.setTextColor(255, 255, 255);
  doc.text("SheetSync", 10, 14);
  doc.setFontSize(11); doc.setFont("helvetica", "normal");
  doc.text(title, PAGE_W - 10, 14, { align: "right" });
  doc.setFontSize(7.5); doc.setTextColor(100, 100, 100);
  doc.text(
    `Exported on ${dateStr}   ·   ${rows.length.toLocaleString()} rows   ·   ${columns.length} columns`,
    10, 29,
  );

  // ── Column widths: measure natural content width, then fit to PRINTABLE_W ─
  //
  // Strategy:
  //   1. Measure each column's "natural" width (content + header, capped at 120mm)
  //   2. If total fits, done — each col gets its natural width
  //   3. If total overflows, scale DOWN columns proportionally but keep each col
  //      at least as wide as its header text (so headers never wrap/collapse)
  const rawWidths = columns.map((col) => getAutoColumnWidth(col, rows, "mm", doc));
  const totalRaw  = rawWidths.reduce((sum, w) => sum + w, 0);

  let colWidths: number[];

  if (totalRaw <= PRINTABLE_W) {
    // Everything fits — distribute leftover space proportionally
    const bonus = PRINTABLE_W - totalRaw;
    colWidths = rawWidths.map((w) => w + (w / totalRaw) * bonus);
  } else {
    // Need to shrink — but each column must keep at least its header text width
    // Measure minimum width per column (header text + padding, at bold 8pt)
    const minWidths = columns.map((col) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      return Math.max(14, doc.getTextWidth(col.name) + 6); // 6mm padding
    });
    const totalMin = minWidths.reduce((sum, w) => sum + w, 0);

    if (totalMin >= PRINTABLE_W) {
      // Even minimums don't fit — just divide equally (last resort)
      const equal = PRINTABLE_W / columns.length;
      colWidths = columns.map(() => equal);
    } else {
      // Distribute PRINTABLE_W: each col gets its minWidth, then remaining space
      // goes to cols proportionally based on (rawWidth - minWidth)
      const remaining      = PRINTABLE_W - totalMin;
      const totalFlexible  = rawWidths.reduce((sum, w, i) => sum + Math.max(0, w - minWidths[i]), 0);
      colWidths = rawWidths.map((w, i) => {
        const flex = Math.max(0, w - minWidths[i]);
        return minWidths[i] + (totalFlexible > 0 ? (flex / totalFlexible) * remaining : 0);
      });
    }
  }

  // Sanity check: total must equal exactly PRINTABLE_W (floating point guard)
  const totalFinal = colWidths.reduce((sum, w) => sum + w, 0);
  if (Math.abs(totalFinal - PRINTABLE_W) > 0.5) {
    const adj = PRINTABLE_W / totalFinal;
    colWidths = colWidths.map((w) => w * adj);
  }

  // ── Track wrap-enabled cells (key = "rowIdx-colKey") ────────────────────
  const wrapCellKeys = new Set<string>(
    Object.entries(cellFormats)
      .filter(([, fmt]) => (fmt as any).textWrap === true)
      .map(([k]) => k),
  );

  // ── Build body ───────────────────────────────────────────
  const bodyData = rows.map((row) =>
    columns.map((col) => {
      const raw = row[col.key];
      if (col.type === "checkbox") return "";
      if (col.type === "progress") return "";
      if (col.type === "date") {
        if (!raw || raw === "") return "";
        try {
          const d = new Date(raw);
          if (isNaN(d.getTime())) return String(raw);
          return d.toLocaleDateString("en-US");
        } catch { return String(raw); }
      }
      if (col.type === "select") {
        if (!raw || raw === "") return "";
        return String(raw);
      }
      return resolveValue(raw, col.type, true);
    }),
  );

  // ── Column styles ────────────────────────────────────────
  const columnStylesMap: Record<number, any> = {};
  columns.forEach((col, i) => {
    const halign =
      col.type === "number" || col.type === "currency" ? "right" :
      col.type === "checkbox" || col.type === "progress" || col.type === "status" ||
      col.type === "priority" || col.type === "select" ? "center" : "left";
    columnStylesMap[i] = { cellWidth: colWidths[i], halign };
  });

  // ── autoTable ────────────────────────────────────────────
  autoTable(doc, {
    head: [columns.map((c) => c.name)],
    body: bodyData,

    startY: TABLE_TOP,
    margin: { left: MARGIN_L, right: MARGIN_R, bottom: 14 },
    tableWidth: PRINTABLE_W,
    showHead: "everyPage",

    styles: {
      fontSize: 7.5,
      cellPadding: { top: 2.5, right: 3, bottom: 2.5, left: 3 },
      font: "helvetica",
      // FIX 2: default to "linebreak" so long text wraps instead of being cut off.
      // Cells that do NOT have textWrap enabled will be forced to a single line
      // via minCellHeight + a one-line cap in didParseCell.
      overflow: "linebreak",
      valign: "middle",
      lineColor: [232, 234, 237],
      lineWidth: 0.15,
      minCellHeight: 10,
    },
    headStyles: {
      fillColor: [13, 124, 95],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
      cellPadding: { top: 4, right: 3, bottom: 4, left: 3 },
      halign: "center",
      minCellHeight: 11,
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: columnStylesMap,

    // ── didParseCell ─────────────────────────────────────────────────────────
    // For cells WITHOUT text-wrap: clip to a single line with ellipsis.
    // For cells WITH text-wrap: let linebreak overflow expand the row height.
    // IMPORTANT: skip header rows — they must never be trimmed here.
    didParseCell(hook) {
      // Never touch header cells — they have their own headStyles and must not be trimmed
      if (hook.section !== "body") return;
      const col = columns[hook.column.index];
      if (!col) return;

      const cellKey = `${hook.row.index}-${col.key}`;
      const isWrap  = wrapCellKeys.has(cellKey);

      if (isWrap) {
        hook.cell.styles.overflow    = "linebreak";
        hook.cell.styles.cellPadding = { top: 3, right: 3, bottom: 3, left: 3 };
        return;
      }

      // No-wrap: enforce single line with trailing ellipsis
      hook.cell.styles.overflow      = "ellipsize";
      hook.cell.styles.minCellHeight = 10;

      // hook.cell.text is string[] (one entry per line). Join to get the full string,
      // then measure and trim to fit inside the column.
      const colW = colWidths[hook.column.index] - 6; // subtract left+right padding
      // Flatten array → single string (handles cases where autoTable already split it)
      const fullText = Array.isArray(hook.cell.text)
        ? hook.cell.text.join(" ")
        : String(hook.cell.text ?? "");

      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");

      if (colW > 0 && doc.getTextWidth(fullText) > colW) {
        let trimmed = fullText;
        // Binary-search style: slice from end until it fits
        while (trimmed.length > 1 && doc.getTextWidth(trimmed + "…") > colW) {
          trimmed = trimmed.slice(0, -1);
        }
        hook.cell.text = trimmed.length > 0 ? [trimmed + "…"] : ["…"];
      } else {
        hook.cell.text = [fullText];
      }
    },

    // ── willDrawCell: set TEXT COLOR only ───────────────────
    willDrawCell(hook) {
      if (hook.row.section !== "body") return;
      const col = columns[hook.column.index];
      if (!col) return;

      const rawVal = rows[hook.row.index]?.[col.key];
      const valStr = String(rawVal ?? "").toLowerCase();

      if (col.type === "priority" && PRIORITY_COLOR_MAP[valStr]) {
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        return;
      }

      if (col.type === "status" && STATUS_COLOR_MAP[valStr]) {
        const [r, g, b] = hexToRgb(STATUS_COLOR_MAP[valStr].hex);
        doc.setTextColor(r, g, b);
        doc.setFont("helvetica", "bold");
        return;
      }

      if (col.type === "select" && rawVal) {
        const opts    = parseSelectOptions(col.selectOptions);
        const matched = opts.find((o) => o.label.toLowerCase() === valStr);
        if (matched?.color) {
          const [r, g, b] = hexToRgb(matched.color);
          doc.setTextColor(r, g, b);
        } else {
          doc.setTextColor(50, 50, 50);
        }
        doc.setFont("helvetica", "bold");
        return;
      }

      try {
        const fmt = cellFormats[`${hook.row.index}-${col.key}`] ?? {};
        if (fmt.textColor) {
          const [r, g, b] = hexToRgb(fmt.textColor);
          doc.setTextColor(r, g, b);
        }
        if (fmt.bold) doc.setFont("helvetica", "bold");
      } catch { /* ignore */ }
    },

    // ── didDrawCell: ALL fill / custom drawing ───────────────
    didDrawCell(hook) {
      if (hook.row.section !== "body") return;
      const col = columns[hook.column.index];
      if (!col) return;

      const rawVal = rows[hook.row.index]?.[col.key];
      const valStr = String(rawVal ?? "").toLowerCase();
      const { x: cx, y: cy, width: cw, height: ch } = hook.cell;

      // ── Per-cell user bgColor
      try {
        const fmt = cellFormats[`${hook.row.index}-${col.key}`] ?? {};
        if (fmt.bgColor) {
          const [r, g, b] = hexToRgb(fmt.bgColor);
          doc.setFillColor(r, g, b);
          doc.rect(cx + 0.5, cy + 0.5, cw - 1, ch - 1, "F");
        }
      } catch { /* ignore */ }

      // ── Priority pill
      if (col.type === "priority" && PRIORITY_COLOR_MAP[valStr]) {
        const [r, g, b] = hexToRgb(PRIORITY_COLOR_MAP[valStr].hex);
        const label = PRIORITY_COLOR_MAP[valStr].label;
        doc.setFillColor(r, g, b);
        doc.roundedRect(cx + 2, cy + 1.5, cw - 4, ch - 3, 1.5, 1.5, "F");
        doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(255, 255, 255);
        doc.text(label, cx + cw / 2, cy + ch / 2, { align: "center", baseline: "middle" });
        doc.setFont("helvetica", "normal"); doc.setTextColor(0, 0, 0);
        return;
      }

      // ── Status pill
      if (col.type === "status" && STATUS_COLOR_MAP[valStr]) {
        const { hex, bgHex, label } = STATUS_COLOR_MAP[valStr];
        const [br, bg, bb] = hexToRgb(bgHex);
        const [fr, fg, fb] = hexToRgb(hex);
        doc.setFillColor(br, bg, bb);
        doc.roundedRect(cx + 2, cy + 1.5, cw - 4, ch - 3, 1.5, 1.5, "F");
        doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(fr, fg, fb);
        doc.text(label, cx + cw / 2, cy + ch / 2, { align: "center", baseline: "middle" });
        doc.setFont("helvetica", "normal"); doc.setTextColor(0, 0, 0);
        return;
      }

      // ── Select option pill
      if (col.type === "select" && rawVal && rawVal !== "") {
        const opts      = parseSelectOptions(col.selectOptions);
        const matched   = opts.find((o) => o.label.toLowerCase() === valStr);
        const bgColor   = matched?.bgColor ?? "#e5e7eb";
        const textColor = matched?.color   ?? "#374151";
        const [br, bg, bb] = hexToRgb(bgColor);
        const [fr, fg, fb] = hexToRgb(textColor);
        doc.setFillColor(br, bg, bb);
        doc.roundedRect(cx + 2, cy + 1.5, cw - 4, ch - 3, 1.5, 1.5, "F");
        doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(fr, fg, fb);
        const label = matched?.label ?? String(rawVal);
        doc.text(label, cx + cw / 2, cy + ch / 2, { align: "center", baseline: "middle" });
        doc.setFont("helvetica", "normal"); doc.setTextColor(0, 0, 0);
        return;
      }

      // ── Progress bar
      if (col.type === "progress") {
        const pct  = Math.min(100, Math.max(0, isNaN(Number(rawVal)) ? 0 : Number(rawVal)));
        const barH = 3;
        const barX = cx + 3;
        const barW = cw - 6;
        const barY = cy + ch / 2 + 1.5;
        const labelY = cy + ch / 2 - 1.5;

        const fc: [number, number, number] =
          pct >= 80 ? [5, 150, 105] : pct >= 50 ? [217, 119, 6] : [37, 99, 235];

        doc.setFontSize(6.5); doc.setFont("helvetica", "bold");
        doc.setTextColor(fc[0], fc[1], fc[2]);
        doc.text(`${pct}%`, cx + cw / 2, labelY, { align: "center", baseline: "middle" });

        doc.setFillColor(229, 231, 235);
        doc.roundedRect(barX, barY - barH / 2, barW, barH, 0.8, 0.8, "F");

        if (pct > 0) {
          doc.setFillColor(fc[0], fc[1], fc[2]);
          doc.roundedRect(barX, barY - barH / 2, (barW * pct) / 100, barH, 0.8, 0.8, "F");
        }

        doc.setFont("helvetica", "normal"); doc.setTextColor(0, 0, 0);
        return;
      }

      // ── Checkbox
      if (col.type === "checkbox") {
        const isChecked = rawVal === true || String(rawVal).toLowerCase() === "true";
        const sz = Math.max(4.5, Math.min(7, ch - 4));
        const bx = cx + cw / 2 - sz / 2;
        const by = cy + ch / 2 - sz / 2;

        if (isChecked) {
          doc.setFillColor(5, 150, 105);
          doc.setDrawColor(5, 150, 105);
          doc.setLineWidth(0.4);
          doc.roundedRect(bx, by, sz, sz, 1, 1, "FD");
          doc.setDrawColor(255, 255, 255);
          doc.setLineWidth(0.9);
          doc.line(bx + sz * 0.18, by + sz * 0.52, bx + sz * 0.42, by + sz * 0.76);
          doc.line(bx + sz * 0.42, by + sz * 0.76, bx + sz * 0.82, by + sz * 0.24);
        } else {
          doc.setFillColor(255, 255, 255);
          doc.setDrawColor(180, 180, 180);
          doc.setLineWidth(0.4);
          doc.roundedRect(bx, by, sz, sz, 1, 1, "FD");
        }

        doc.setDrawColor(0); doc.setLineWidth(0.15);
        doc.setFont("helvetica", "normal"); doc.setTextColor(0, 0, 0);
        return;
      }

      // Reset state for next cell
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
    },

    // ── Page header / footer ─────────────────────────────────
    didDrawPage(pageData) {
      const pageCount = (doc.internal as any).getNumberOfPages();
      const pageNum   = pageData.pageNumber;

      if (pageNum > 1) {
        doc.setFillColor(13, 124, 95);
        doc.rect(0, 0, PAGE_W, 4, "F");
      }

      doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.setTextColor(160, 160, 160);
      doc.text("SheetSync", MARGIN_L, FOOTER_Y);
      doc.text(title, PAGE_W / 2, FOOTER_Y, { align: "center" });
      doc.text(`Page ${pageNum} of ${pageCount}`, PAGE_W - MARGIN_R, FOOTER_Y, { align: "right" });
    },
  });

  doc.save(safeExportFilename(title, "pdf"));
}

// ─────────────────────────────────────────────────────────────
//  JSON EXPORT
// ─────────────────────────────────────────────────────────────

function exportJSON(data: SheetExportData) {
  const { rows, columns, title, cellFormats } = data;
  const payload = {
    meta: {
      title, exportedAt: new Date().toISOString(), exportedBy: "SheetSync",
      version: "1.0", totalRows: rows.length, totalColumns: columns.length,
    },
    schema: columns.map((c) => ({ key: c.key, name: c.name, type: c.type ?? "text", width: c.width ?? 160 })),
    rows: rows.map((row, ri) => ({
      _index: ri,
      ...Object.fromEntries(
        columns.map((col) => [
          col.name,
          { raw: row[col.key] ?? null, display: resolveValue(row[col.key], col.type, true), type: col.type ?? "text" },
        ]),
      ),
    })),
    formats: Object.fromEntries(Object.entries(cellFormats).map(([key, fmt]) => [key, fmt])),
  };
  triggerDownload(
    new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }),
    safeExportFilename(title, "json"),
  );
}

// ─────────────────────────────────────────────────────────────
//  MAIN ENTRY POINT
// ─────────────────────────────────────────────────────────────

export async function exportSheet({ format, sheetId }: ExportOptions): Promise<void> {
  const data = await fetchSheetForExport(sheetId);
  switch (format) {
    case "csv":  exportCSV(data);  break;
    case "xlsx": exportXLSX(data); break;
    case "pdf":  exportPDF(data);  break;
    case "json": exportJSON(data); break;
  }
}