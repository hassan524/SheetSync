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

export type ExportFormat = "csv" | "xlsx" | "pdf" | "json";

interface ExportOptions {
  format: ExportFormat;
  sheetId: string;
}

interface SheetExportData {
  title: string;
  rows: SheetRow[];
  columns: ColumnDef[];
  cellFormats: Record<string, any>;
  formulas: Record<string, string>;
}

const PRIORITY_COLOR_MAP: Record<string, { hex: string; label: string }> = {
  low: { hex: "059669", label: "Low" },
  medium: { hex: "d97706", label: "Medium" },
  high: { hex: "dc2626", label: "High" },
  urgent: { hex: "7c2d12", label: "Urgent" },
};

const STATUS_COLOR_MAP: Record<
  string,
  { hex: string; bgHex: string; label: string }
> = {
  todo: { hex: "6b7280", bgHex: "f3f4f6", label: "To Do" },
  in_progress: { hex: "2563eb", bgHex: "dbeafe", label: "In Progress" },
  done: { hex: "059669", bgHex: "d1fae5", label: "Done" },
  blocked: { hex: "dc2626", bgHex: "fee2e2", label: "Blocked" },
};

const PX_TO_MM = 0.2645833333;
const DEFAULT_COL_WIDTH_PX = 160;
const MIN_COL_WIDTH_MM = 10;
const MAX_COL_WIDTH_MM = 80;

function hexToRgb(hex: string): [number, number, number] {
  const cleaned = String(hex ?? "").replace("#", "").trim();
  const full =
    cleaned.length === 3
      ? cleaned
        .split("")
        .map((c) => c + c)
        .join("")
      : cleaned.padEnd(6, "0").slice(0, 6);

  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

function getCellValue(row: any, key: string): any {
  return row?.[key] ?? row?.data?.[key] ?? "";
}

function parseSelectOptions(
  raw: any,
): Array<{ label: string; bgColor?: string; color?: string }> {
  if (!raw) return [];
  let arr: any[] = [];
  if (Array.isArray(raw)) arr = raw;
  else if (typeof raw === "string") {
    try {
      arr = JSON.parse(raw);
    } catch {
      return [];
    }
  } else return [];

  return arr
    .map((item: any) => {
      if (typeof item === "string") return { label: item };
      return {
        label: String(item?.label ?? ""),
        bgColor: item?.bgColor,
        color: item?.color,
      };
    })
    .filter((o) => o.label);
}

function safeExportFilename(title: string, extension: ExportFormat): string {
  const name = title
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
  return `${name || "SheetSync Export"}.${extension}`;
}

function resolveDisplayValue(raw: any, colType: ColumnDef["type"]): string {
  if (raw === null || raw === undefined || raw === "") return "";

  switch (colType) {
    case "checkbox":
      return raw === true || raw === "true" ? "Yes" : "No";

    case "currency": {
      const n = Number(raw);
      if (Number.isNaN(n)) return String(raw);
      return `$${n.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }

    case "progress": {
      const n = Number(raw);
      if (Number.isNaN(n)) return "0%";
      return `${Math.min(100, Math.max(0, n))}%`;
    }

    case "date": {
      try {
        const d = new Date(raw);
        if (Number.isNaN(d.getTime())) return String(raw);
        return d.toLocaleDateString("en-US", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        });
      } catch {
        return String(raw);
      }
    }

    case "priority": {
      const match = PRIORITY_OPTIONS?.find(
        (p) => p.value === String(raw).toLowerCase(),
      );
      return match?.label ?? String(raw);
    }

    case "status": {
      const match = STATUS_OPTIONS?.find(
        (s) => s.value === String(raw).toLowerCase(),
      );
      return match?.label ?? String(raw);
    }

    default:
      return String(raw);
  }
}

function resolveRawValue(raw: any, colType: ColumnDef["type"]): any {
  if (raw === null || raw === undefined || raw === "") return "";
  switch (colType) {
    case "checkbox":
      return raw === true || raw === "true";
    case "number":
    case "currency":
    case "progress": {
      const n = Number(raw);
      return Number.isNaN(n) ? raw : n;
    }
    default:
      return resolveDisplayValue(raw, colType);
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
    case "currency":
      return '"$"#,##0.00';
    case "number":
      return "#,##0.##";
    case "progress":
      return '0"%"';
    case "date":
      return "mm/dd/yyyy";
    default:
      return undefined;
  }
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), {
    href: url,
    download: filename,
  });
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

function displayWidth(value: string): number {
  return String(value ?? "")
    .split(/\r?\n/)
    .reduce((max, line) => Math.max(max, line.length), 0);
}

function isCustomRenderType(colType: ColumnDef["type"]): boolean {
  return (
    colType === "priority" ||
    colType === "status" ||
    colType === "select" ||
    colType === "progress" ||
    colType === "checkbox"
  );
}

function buildBodyText(raw: any, col: ColumnDef): string {
  if (raw === null || raw === undefined || raw === "") return "";

  const type = col.type ?? "text";
  const str = String(raw);
  const lower = str.toLowerCase();

  switch (type) {
    case "priority":
      return PRIORITY_COLOR_MAP[lower]?.label ?? str;

    case "status":
      return STATUS_COLOR_MAP[lower]?.label ?? str;

    case "select": {
      const opts = parseSelectOptions(col.selectOptions);
      const matched = opts.find((o) => o.label.toLowerCase() === lower);
      return matched?.label ?? str;
    }

    case "progress": {
      const pct = Math.min(100, Math.max(0, Number.isNaN(Number(raw)) ? 0 : Number(raw)));
      return `${pct}%`;
    }

    case "checkbox":
      return raw === true || raw === "true" ? "Yes" : "No";

    case "date": {
      try {
        const d = new Date(str);
        if (Number.isNaN(d.getTime())) return str;
        return d.toLocaleDateString("en-US", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        });
      } catch {
        return str;
      }
    }

    case "currency": {
      const n = Number(raw);
      if (Number.isNaN(n)) return str;
      return `$${n.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }

    default:
      return str;
  }
}

function estimateWrappedLines(
  doc: jsPDF,
  text: string,
  widthMm: number,
  fontSize: number,
): number {
  if (!text) return 1;
  const usableWidth = Math.max(1, widthMm - 6);
  doc.setFontSize(fontSize);
  const lines = doc.splitTextToSize(text, usableWidth);
  return Array.isArray(lines) ? Math.max(1, lines.length) : 1;
}

// function fitColumnWidthsToPage(rawWidthsMm: number[], printableWidth: number): number[] {
//   if (rawWidthsMm.length === 0) return [];

//   let widths = rawWidthsMm.map((w) =>
//     Math.max(MIN_COL_WIDTH_MM, Math.min(MAX_COL_WIDTH_MM, w)),
//   );

//   let total = widths.reduce((a, b) => a + b, 0);
//   if (total <= 0) {
//     return rawWidthsMm.map(() => printableWidth / rawWidthsMm.length);
//   }

//   widths = widths.map((w) => (w / total) * printableWidth);

//   for (let pass = 0; pass < 6; pass += 1) {
//     let fixedTotal = 0;
//     let flexTotal = 0;
//     const isFixed = widths.map((w, i) => {
//       const clamped = Math.max(
//         MIN_COL_WIDTH_MM,
//         Math.min(MAX_COL_WIDTH_MM, widths[i]),
//       );
//       const fixed = clamped !== widths[i];
//       widths[i] = clamped;
//       if (fixed) fixedTotal += widths[i];
//       else flexTotal += widths[i];
//       return fixed;
//     });

//     const remaining = printableWidth - fixedTotal;
//     if (remaining <= 0) break;
//     if (flexTotal <= 0) break;

//     widths = widths.map((w, i) => {
//       if (isFixed[i]) return w;
//       return (w / flexTotal) * remaining;
//     });

//     total = widths.reduce((a, b) => a + b, 0);
//     if (Math.abs(total - printableWidth) < 0.2) break;
//   }

//   const finalTotal = widths.reduce((a, b) => a + b, 0);
//   if (finalTotal > 0 && Math.abs(finalTotal - printableWidth) > 0.1) {
//     const ratio = printableWidth / finalTotal;
//     widths = widths.map((w) => w * ratio);
//   }

//   return widths;
// }

async function fetchSheetForExport(sheetId: string): Promise<SheetExportData> {
  const [sheet, columns, rows, formats, formulas] = await Promise.all([
    supabase.from("sheets").select("title").eq("id", sheetId).single(),
    supabase
      .from("columns")
      .select("*")
      .eq("sheet_id", sheetId)
      .order("position"),
    supabase
      .from("rows")
      .select("*")
      .eq("sheet_id", sheetId)
      .order("position"),
    supabase.from("cell_formats").select("*").eq("sheet_id", sheetId),
    supabase.from("formulas").select("*").eq("sheet_id", sheetId),
  ]);

  if (sheet.error) throw new Error(`Sheet load failed: ${sheet.error.message}`);
  if (columns.error) throw new Error(`Columns load failed: ${columns.error.message}`);
  if (rows.error) throw new Error(`Rows load failed: ${rows.error.message}`);


  const parsedColumns = (columns.data ?? []).map((col) => {
    console.log('EXPORT — col:', col.name, 'width from db:', col.width);
    return {
      key: col.column_key,
      name: col.name,
      type: col.type,
      width: col.width,
      position: col.position,
      selectOptions: (() => {
        const raw = col.select_options;
        if (!raw) return [];
        if (Array.isArray(raw)) return raw;
        if (typeof raw === "string") {
          try {
            return JSON.parse(raw);
          } catch {
            return [];
          }
        }
        return [];
      })(),
      currencyCode: col.currency_code ?? "USD",
      conditional_formatting: col.conditional_formatting ?? null,
      validation_rules: col.validation_rules ?? null,
    };
  });

  const colKeys = parsedColumns.map((c) => c.key);

  return {
    title: sheet.data.title ?? "Untitled",
    columns: parsedColumns,
    rows: (rows.data ?? [])
      .map((row) => ({ id: row.row_key, ...row.data }))
      .filter((row) =>
        colKeys.some((key) => {
          const val = row[key];
          return val !== null && val !== undefined && val !== "";
        }),
      ),
    cellFormats: Object.fromEntries(
      (formats.data ?? []).map((f) => [
        f.cell_key,
        {
          bold: f.bold ?? false,
          italic: f.italic ?? false,
          underline: f.underline ?? false,
          strikethrough: f.strikethrough ?? false,
          fontSize: f.font_size ?? 10,
          fontFamily: f.font_family ?? "Arial",
          textColor: f.text_color ?? null,
          bgColor: f.bg_color ?? null,
          align: f.text_align ?? "left",
          textWrap: f.text_wrap ?? false,
        },
      ]),
    ),
    formulas: Object.fromEntries(
      (formulas.data ?? []).map((f) => [f.cell_key, f.formula]),
    ),
  };
}

function exportCSV({ rows, columns, title }: SheetExportData): void {
  const lines: string[] = [columns.map((c) => csvEscape(c.name)).join(",")];

  const CHUNK = 500;
  for (let i = 0; i < rows.length; i += CHUNK) {
    for (const row of rows.slice(i, i + CHUNK)) {
      lines.push(
        columns
          .map((col) =>
            csvEscape(resolveDisplayValue(getCellValue(row, col.key), col.type)),
          )
          .join(","),
      );
    }
  }

  triggerDownload(
    new Blob(["\uFEFF" + lines.join("\r\n")], {
      type: "text/csv;charset=utf-8;",
    }),
    safeExportFilename(title, "csv"),
  );
}

function makeHeaderStyle(colType: ColumnDef["type"]): any {
  const fills: Record<string, string> = {
    text: "0D7C5F",
    number: "1D4ED8",
    currency: "065F46",
    date: "6D28D9",
    checkbox: "374151",
    status: "1E3A5F",
    priority: "7C2D12",
    progress: "0F766E",
    url: "0369A1",
    select: "0D7C5F",
  };

  return {
    font: { bold: true, sz: 11, color: { rgb: "FFFFFF" } },
    fill: {
      patternType: "solid",
      fgColor: { rgb: fills[colType ?? "text"] ?? fills.text },
    },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    border: {
      top: { style: "thin", color: { rgb: "0A6B52" } },
      bottom: { style: "medium", color: { rgb: "0A6B52" } },
      left: { style: "thin", color: { rgb: "0D9E75" } },
      right: { style: "thin", color: { rgb: "0D9E75" } },
    },
  };
}

function exportXLSX({
  rows,
  columns,
  title,
  cellFormats,
}: SheetExportData): void {
  const wb = XLSX.utils.book_new();

  const wsData: any[][] = [
    columns.map((c) => c.name),
    ...rows.map((row) =>
      columns.map((col) => resolveRawValue(getCellValue(row, col.key), col.type)),
    ),
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  columns.forEach((col, ci) => {
    const ref = XLSX.utils.encode_cell({ r: 0, c: ci });
    if (ws[ref]) ws[ref].s = makeHeaderStyle(col.type);
  });

  rows.forEach((row, ri) => {
    const isEvenRow = ri % 2 === 1;

    columns.forEach((col, ci) => {
      const ref = XLSX.utils.encode_cell({ r: ri + 1, c: ci });
      if (!ws[ref]) return;

      const raw = getCellValue(row, col.key);
      const valStr = String(raw ?? "").toLowerCase();
      const fmt = cellFormats[`${ri}-${col.key}`] ?? {};
      const numFmt = xlsxNumFmt(col.type);

      if (col.type === "progress" && raw !== "" && raw !== null && raw !== undefined) {
        const pct = Math.min(100, Math.max(0, Number(raw)));
        ws[ref].v = pct;
        ws[ref].t = "n";
      }

      if (col.type === "date" && raw) {
        const d = new Date(String(raw));
        if (!Number.isNaN(d.getTime())) {
          ws[ref].v = d;
          ws[ref].t = "d";
        }
      }

      if (numFmt) ws[ref].z = numFmt;

      if (col.type === "priority" && PRIORITY_COLOR_MAP[valStr]) {
        const { hex } = PRIORITY_COLOR_MAP[valStr];
        ws[ref].s = {
          font: { bold: true, sz: 10, color: { rgb: "FFFFFF" } },
          fill: { patternType: "solid", fgColor: { rgb: hex } },
          alignment: { horizontal: "center", vertical: "center" },
          border: {
            bottom: { style: "thin", color: { rgb: "E8EAED" } },
            right: { style: "thin", color: { rgb: "E8EAED" } },
          },
        };
        ws[ref].v = PRIORITY_COLOR_MAP[valStr].label;
        ws[ref].t = "s";
        return;
      }

      if (col.type === "status" && STATUS_COLOR_MAP[valStr]) {
        const { hex, bgHex } = STATUS_COLOR_MAP[valStr];
        ws[ref].s = {
          font: { bold: true, sz: 10, color: { rgb: hex } },
          fill: { patternType: "solid", fgColor: { rgb: bgHex } },
          alignment: { horizontal: "center", vertical: "center" },
          border: {
            bottom: { style: "thin", color: { rgb: "E8EAED" } },
            right: { style: "thin", color: { rgb: "E8EAED" } },
          },
        };
        ws[ref].v = STATUS_COLOR_MAP[valStr].label;
        ws[ref].t = "s";
        return;
      }

      if (col.type === "progress") {
        const pct = Math.min(100, Math.max(0, Number.isNaN(Number(raw)) ? 0 : Number(raw)));
        ws[ref].s = {
          font: {
            sz: 10,
            bold: pct >= 80,
            color: {
              rgb: pct >= 80 ? "065F46" : pct >= 50 ? "92400E" : "1E3A5F",
            },
          },
          fill: {
            patternType: "solid",
            fgColor: {
              rgb: pct >= 80 ? "D1FAE5" : pct >= 50 ? "FEF3C7" : "DBEAFE",
            },
          },
          alignment: { horizontal: "center", vertical: "center" },
          numFmt: '0"%"',
          border: {
            bottom: { style: "thin", color: { rgb: "E8EAED" } },
            right: { style: "thin", color: { rgb: "E8EAED" } },
          },
        };
        return;
      }

      if (col.type === "checkbox") {
        ws[ref].s = {
          font: {
            sz: 12,
            color: {
              rgb: raw === true || raw === "true" ? "059669" : "9CA3AF",
            },
          },
          alignment: { horizontal: "center", vertical: "center" },
          fill: isEvenRow
            ? { patternType: "solid", fgColor: { rgb: "F9FAFB" } }
            : undefined,
          border: {
            bottom: { style: "thin", color: { rgb: "E8EAED" } },
            right: { style: "thin", color: { rgb: "E8EAED" } },
          },
        };
        return;
      }

      if (col.type === "select" && raw) {
        const opts = parseSelectOptions(col.selectOptions);
        const matched = opts.find((o) => o.label.toLowerCase() === valStr);
        ws[ref].s = {
          font: {
            bold: true,
            sz: 10,
            color: matched?.color
              ? { rgb: matched.color.replace("#", "") }
              : { rgb: "374151" },
          },
          fill: matched?.bgColor
            ? {
              patternType: "solid",
              fgColor: { rgb: matched.bgColor.replace("#", "") },
            }
            : isEvenRow
              ? { patternType: "solid", fgColor: { rgb: "F9FAFB" } }
              : undefined,
          alignment: { horizontal: "center", vertical: "center" },
          border: {
            bottom: { style: "thin", color: { rgb: "E8EAED" } },
            right: { style: "thin", color: { rgb: "E8EAED" } },
          },
        };
        return;
      }

      const halign =
        fmt.align ??
        (col.type === "number" || col.type === "currency" ? "right" : "left");

      ws[ref].s = {
        font: {
          bold: fmt.bold ?? false,
          italic: fmt.italic ?? false,
          underline: fmt.underline ?? false,
          strike: fmt.strikethrough ?? false,
          sz: fmt.fontSize ?? 10,
          ...(fmt.textColor
            ? { color: { rgb: fmt.textColor.replace("#", "") } }
            : {}),
        },
        fill: fmt.bgColor
          ? {
            patternType: "solid",
            fgColor: { rgb: fmt.bgColor.replace("#", "") },
          }
          : isEvenRow
            ? { patternType: "solid", fgColor: { rgb: "F9FAFB" } }
            : undefined,
        alignment: {
          horizontal: halign,
          vertical: "center",
          wrapText: fmt.textWrap ?? false,
        },
        border: {
          top: { style: "thin", color: { rgb: "E8EAED" } },
          bottom: { style: "thin", color: { rgb: "E8EAED" } },
          left: { style: "thin", color: { rgb: "F3F4F6" } },
          right: { style: "thin", color: { rgb: "E8EAED" } },
        },
        ...(numFmt ? { numFmt } : {}),
      };
    });
  });

  ws["!cols"] = columns.map((col) => {
    const values = [
      col.name,
      ...rows.map((row) => resolveDisplayValue(getCellValue(row, col.key), col.type)),
    ];
    const maxChars = values.reduce((max, v) => Math.max(max, displayWidth(v)), 0);
    return { wch: Math.max(12, Math.min(60, maxChars + 3)) };
  });

  ws["!rows"] = [
    { hpt: 30, hpx: 30 },
    ...rows.map(() => ({ hpt: 22, hpx: 22 })),
  ];

  ws["!freeze"] = { xSplit: 0, ySplit: 1 };
  ws["!autofilter"] = {
    ref: `A1:${XLSX.utils.encode_col(columns.length - 1)}1`,
  };
  ws["!ref"] = XLSX.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: rows.length, c: columns.length - 1 },
  });

  XLSX.utils.book_append_sheet(wb, ws, title.slice(0, 31));

  wb.Props = {
    Title: title,
    Subject: "SheetSync Export",
    Author: "SheetSync",
    CreatedDate: new Date(),
  };

  XLSX.writeFile(wb, safeExportFilename(title, "xlsx"), {
    cellStyles: true,
    compression: true,
    bookType: "xlsx",
  });
}

function exportPDF({
  rows,
  columns,
  title,
  cellFormats,
}: SheetExportData): void {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  const PAGE_W = doc.internal.pageSize.getWidth();
  const PAGE_H = doc.internal.pageSize.getHeight();
  const MARGIN_L = 10;
  const MARGIN_R = 10;
  const PRINTABLE_W = PAGE_W - MARGIN_L - MARGIN_R;
  const TABLE_TOP = 34;
  const FOOTER_Y = PAGE_H - 5;

  // Filter out empty columns
  const activeCols = columns.filter((col) =>
    rows.some((row) => {
      const val = getCellValue(row, col.key);
      return val !== null && val !== undefined && val !== "";
    })
  );

  const dateStr = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  doc.setFillColor(13, 124, 95);
  doc.rect(0, 0, PAGE_W, 22, "F");
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("SheetSync", 10, 14);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(title, PAGE_W - 10, 14, { align: "right" });
  doc.setFontSize(7.5);
  doc.setTextColor(100, 100, 100);
  doc.text(
    `Exported on ${dateStr}   ·   ${rows.length.toLocaleString()} rows   ·   ${activeCols.length} columns`,
    10,
    29,
  );

  const rawWidthsMm = activeCols.map((col) => {
    const px =
      typeof col.width === "number" && col.width > 0
        ? col.width
        : DEFAULT_COL_WIDTH_PX;
    return px * PX_TO_MM;
  });

  const totalRaw = rawWidthsMm.reduce((a, b) => a + b, 0);
  const scale = totalRaw > PRINTABLE_W ? PRINTABLE_W / totalRaw : 1;
  const colWidths = rawWidthsMm.map(w => Math.max(8, w * scale));

  const bodyData: string[][] = rows.map((row) =>
    activeCols.map((col) => buildBodyText(getCellValue(row, col.key), col)),
  );

  const columnStylesMap: Record<number, any> = {};
  activeCols.forEach((col, i) => {
    const halign =
      col.type === "number" || col.type === "currency"
        ? "right"
        : isCustomRenderType(col.type ?? "text")
          ? "center"
          : "left";
    columnStylesMap[i] = {
      cellWidth: colWidths[i],
      halign,
    };
  });

  autoTable(doc, {
    head: [activeCols.map((c) => c.name)],
    body: bodyData,
    startY: TABLE_TOP,
    margin: { left: MARGIN_L, right: MARGIN_R, bottom: 14 },
    tableWidth: PRINTABLE_W,
    showHead: "everyPage",
    styles: {
      fontSize: 7.5,
      cellPadding: { top: 2.5, right: 3, bottom: 2.5, left: 3 },
      font: "helvetica",
      overflow: "ellipsize",
      valign: "middle",
      lineColor: [232, 234, 237],
      lineWidth: 0.2,
      minCellHeight: 9,
      textColor: [26, 29, 35],
    },
    headStyles: {
      fillColor: [13, 124, 95],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
      cellPadding: { top: 4, right: 3, bottom: 4, left: 3 },
      halign: "center",
      minCellHeight: 11,
      lineColor: [10, 107, 82],
      lineWidth: 0.3,
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: columnStylesMap,

    didParseCell(hook) {
      if (hook.section !== "body") return;
      const col = activeCols[hook.column.index];
      if (!col) return;

      const rowIdx = hook.row.index;
      const cellKey = `${rowIdx}-${col.key}`;
      const type = col.type ?? "text";
      const fmt = cellFormats[cellKey] ?? {};
      const isWrapped = fmt.textWrap === true;

      if (fmt.bgColor) {
        try {
          hook.cell.styles.fillColor = hexToRgb(fmt.bgColor);
        } catch { }
      }

      if (fmt.align === "center" || fmt.align === "right" || fmt.align === "left") {
        hook.cell.styles.halign = fmt.align;
      }

      if (isWrapped && !isCustomRenderType(type)) {
        hook.cell.styles.overflow = "linebreak";
        hook.cell.styles.valign = "top";
        hook.cell.styles.cellPadding = { top: 3, right: 4, bottom: 3, left: 4 };
        hook.cell.styles.minCellHeight = 12;
        hook.cell.text = [buildBodyText(getCellValue(rows[rowIdx], col.key), col)];
        return;
      }

      if (isCustomRenderType(type)) {
        hook.cell.styles.textColor = [255, 255, 255];
      }
    },

    willDrawCell(hook) {
      if (hook.row.section !== "body") return;
      const col = activeCols[hook.column.index];
      if (!col) return;

      const cellKey = `${hook.row.index}-${col.key}`;
      const fmt = cellFormats[cellKey] ?? {};
      const type = col.type ?? "text";

      if (!isCustomRenderType(type)) {
        if (fmt.textColor) {
          try {
            const [r, g, b] = hexToRgb(fmt.textColor);
            doc.setTextColor(r, g, b);
          } catch {
            doc.setTextColor(26, 29, 35);
          }
        } else {
          doc.setTextColor(26, 29, 35);
        }

        if (fmt.bold && fmt.italic) doc.setFont("helvetica", "bolditalic");
        else if (fmt.bold) doc.setFont("helvetica", "bold");
        else if (fmt.italic) doc.setFont("helvetica", "italic");
        else doc.setFont("helvetica", "normal");
      }
    },

    didDrawCell(hook) {
      if (hook.row.section !== "body") return;
      const col = activeCols[hook.column.index];
      if (!col) return;

      const rowIdx = hook.row.index;
      const cellKey = `${rowIdx}-${col.key}`;
      const raw = getCellValue(rows[rowIdx], col.key);
      const valStr = String(raw ?? "").toLowerCase();
      const { x: cx, y: cy, width: cw, height: ch } = hook.cell;
      const type = col.type ?? "text";
      const fmt = cellFormats[cellKey] ?? {};

      if (!isCustomRenderType(type)) return;

      if (type === "priority" && PRIORITY_COLOR_MAP[valStr]) {
        const [r, g, b] = hexToRgb(PRIORITY_COLOR_MAP[valStr].hex);
        const label = PRIORITY_COLOR_MAP[valStr].label;
        const pH = Math.max(5, ch - 4);
        const pY = cy + (ch - pH) / 2;
        doc.setFillColor(r, g, b);
        doc.roundedRect(cx + 3, pY, cw - 6, pH, 1.5, 1.5, "F");
        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(255, 255, 255);
        doc.text(label, cx + cw / 2, cy + ch / 2, { align: "center", baseline: "middle" });
        doc.setFont("helvetica", "normal");
        doc.setTextColor(26, 29, 35);
        return;
      }

      if (type === "status" && STATUS_COLOR_MAP[valStr]) {
        const { hex, bgHex, label } = STATUS_COLOR_MAP[valStr];
        const [br, bg, bb] = hexToRgb(bgHex);
        const [fr, fg, fb] = hexToRgb(hex);
        const pH = Math.max(5, ch - 4);
        const pY = cy + (ch - pH) / 2;
        doc.setFillColor(br, bg, bb);
        doc.roundedRect(cx + 3, pY, cw - 6, pH, 1.5, 1.5, "F");
        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(fr, fg, fb);
        doc.text(label, cx + cw / 2, cy + ch / 2, { align: "center", baseline: "middle" });
        doc.setFont("helvetica", "normal");
        doc.setTextColor(26, 29, 35);
        return;
      }

      if (type === "select" && raw && raw !== "") {
        const opts = parseSelectOptions(col.selectOptions);
        const matched = opts.find((o) => o.label.toLowerCase() === valStr);
        const bgColor = matched?.bgColor ?? "#e5e7eb";
        const textColor = matched?.color ?? "#374151";
        const [br, bg, bb] = hexToRgb(bgColor);
        const [fr, fg, fb] = hexToRgb(textColor);
        const label = matched?.label ?? String(raw);
        const pH = Math.max(5, ch - 4);
        const pY = cy + (ch - pH) / 2;
        doc.setFillColor(br, bg, bb);
        doc.roundedRect(cx + 3, pY, cw - 6, pH, 1.5, 1.5, "F");
        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(fr, fg, fb);
        doc.text(label, cx + cw / 2, cy + ch / 2, { align: "center", baseline: "middle" });
        doc.setFont("helvetica", "normal");
        doc.setTextColor(26, 29, 35);
        return;
      }

      if (type === "progress") {
        const pct = Math.min(100, Math.max(0, Number.isNaN(Number(raw)) ? 0 : Number(raw)));
        const fc: [number, number, number] =
          pct >= 80 ? [5, 150, 105] : pct >= 50 ? [217, 119, 6] : [37, 99, 235];
        const barH = 3;
        const barX = cx + 3;
        const barW = cw - 6;
        const labelY = cy + ch / 2 - 2;
        const barY = cy + ch / 2 + 1.5;
        doc.setFontSize(6.5);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(fc[0], fc[1], fc[2]);
        doc.text(`${pct}%`, cx + cw / 2, labelY, { align: "center", baseline: "middle" });
        doc.setFillColor(229, 231, 235);
        doc.roundedRect(barX, barY - barH / 2, barW, barH, 0.8, 0.8, "F");
        if (pct > 0) {
          doc.setFillColor(fc[0], fc[1], fc[2]);
          doc.roundedRect(barX, barY - barH / 2, (barW * pct) / 100, barH, 0.8, 0.8, "F");
        }
        doc.setFont("helvetica", "normal");
        doc.setTextColor(26, 29, 35);
        return;
      }

      if (type === "checkbox") {
        const isChecked = raw === true || String(raw).toLowerCase() === "true";
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
        doc.setDrawColor(0);
        doc.setLineWidth(0.2);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(26, 29, 35);
      }
    },

    didDrawPage(pageData) {
      const pageCount = (doc.internal as any).getNumberOfPages();
      const pageNum = pageData.pageNumber;
      if (pageNum > 1) {
        doc.setFillColor(13, 124, 95);
        doc.rect(0, 0, PAGE_W, 4, "F");
      }
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(160, 160, 160);
      doc.text("SheetSync", MARGIN_L, FOOTER_Y);
      doc.text(title, PAGE_W / 2, FOOTER_Y, { align: "center" });
      doc.text(`Page ${pageNum} of ${pageCount}`, PAGE_W - MARGIN_R, FOOTER_Y, { align: "right" });
    },
  });

  doc.save(safeExportFilename(title, "pdf"));
}

function exportJSON({
  rows,
  columns,
  title,
  cellFormats,
}: SheetExportData): void {
  const payload = {
    meta: {
      title,
      exportedAt: new Date().toISOString(),
      exportedBy: "SheetSync",
      version: "1.0",
      totalRows: rows.length,
      totalColumns: columns.length,
    },
    schema: columns.map((c) => ({
      key: c.key,
      name: c.name,
      type: c.type ?? "text",
      width: c.width ?? 160,
    })),
    rows: rows.map((row, ri) => ({
      _index: ri,
      ...Object.fromEntries(
        columns.map((col) => {
          const raw = getCellValue(row, col.key);
          return [
            col.name,
            {
              raw: raw ?? null,
              display: resolveDisplayValue(raw, col.type),
              type: col.type ?? "text",
            },
          ];
        }),
      ),
    })),
    formats: cellFormats,
  };

  triggerDownload(
    new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    }),
    safeExportFilename(title, "json"),
  );
}

export async function exportSheet({
  format,
  sheetId,
}: ExportOptions): Promise<void> {
  const data = await fetchSheetForExport(sheetId);

  switch (format) {
    case "csv":
      exportCSV(data);
      break;
    case "xlsx":
      exportXLSX(data);
      break;
    case "pdf":
      exportPDF(data);
      break;
    case "json":
      exportJSON(data);
      break;
  }
}
