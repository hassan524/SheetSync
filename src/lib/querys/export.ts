// lib/export.ts
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { supabase } from "@/lib/supabase/client";
import { SheetRow, ColumnDef, PRIORITY_OPTIONS, STATUS_OPTIONS } from "@/types/index";

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

// ─────────────────────────────────────────────────────────────
//  COLORS — Priority / Status (match your UI exactly)
// ─────────────────────────────────────────────────────────────

const PRIORITY_COLOR_MAP: Record<string, { hex: string; label: string }> = {
    low: { hex: "059669", label: "Low" },
    medium: { hex: "d97706", label: "Medium" },
    high: { hex: "dc2626", label: "High" },
    urgent: { hex: "7c2d12", label: "Urgent" },
};

const STATUS_COLOR_MAP: Record<string, { hex: string; bgHex: string; label: string }> = {
    todo: { hex: "6b7280", bgHex: "f3f4f6", label: "To Do" },
    in_progress: { hex: "2563eb", bgHex: "dbeafe", label: "In Progress" },
    done: { hex: "059669", bgHex: "d1fae5", label: "Done" },
    blocked: { hex: "dc2626", bgHex: "fee2e2", label: "Blocked" },
};

// ─────────────────────────────────────────────────────────────
//  FETCH FRESH FROM DB — no params, no stale state
// ─────────────────────────────────────────────────────────────

async function fetchSheetForExport(sheetId: string): Promise<SheetExportData> {
    const [sheet, columns, rows, formats, formulas] = await Promise.all([
        supabase.from("sheets").select("title, is_personal").eq("id", sheetId).single(),
        supabase.from("columns").select("*").eq("sheet_id", sheetId).order("position"),
        supabase.from("rows").select("*").eq("sheet_id", sheetId).order("position"),
        supabase.from("cell_formats").select("*").eq("sheet_id", sheetId),
        supabase.from("formulas").select("*").eq("sheet_id", sheetId),
    ]);

    if (sheet.error) throw new Error(`Sheet load failed: ${sheet.error.message}`);
    if (columns.error) throw new Error(`Columns load failed: ${columns.error.message}`);
    if (rows.error) throw new Error(`Rows load failed: ${rows.error.message}`);

    return {
        title: sheet.data.title ?? "Untitled",
        isPersonal: sheet.data.is_personal ?? true,

        columns: (columns.data ?? []).map((col) => ({
            key: col.column_key,
            name: col.name,
            type: col.type,
            width: col.width,
            position: col.position,
        })),

        rows: (rows.data ?? []).map((row) => ({
            id: row.row_key,
            ...row.data,
        })),

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
            ])
        ),

        formulas: Object.fromEntries(
            (formulas.data ?? []).map((f) => [f.cell_key, f.formula])
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

/** Resolve a cell's display value (handles formulas + typed cells) */
function resolveValue(
    raw: any,
    colType: ColumnDef["type"],
    forDisplay = false
): string {
    if (raw === null || raw === undefined || raw === "") return "";

    switch (colType) {
        case "checkbox":
            return raw === true || raw === "true" ? (forDisplay ? "✓" : "TRUE") : (forDisplay ? "✗" : "FALSE");
        case "currency":
            return forDisplay
                ? `$${Number(raw).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : String(Number(raw));
        case "progress":
            return forDisplay ? `${Math.min(100, Math.max(0, Number(raw)))}%` : String(raw);
        case "priority": {
            const match = PRIORITY_OPTIONS.find(p => p.value === String(raw).toLowerCase());
            return match?.label ?? String(raw);
        }
        case "status": {
            const match = STATUS_OPTIONS.find(s => s.value === String(raw).toLowerCase());
            return match?.label ?? String(raw);
        }
        default:
            return String(raw);
    }
}

/** Sanitise a string for CSV — wrap in quotes if needed */
function csvEscape(val: string): string {
    if (val.includes(",") || val.includes('"') || val.includes("\n")) {
        return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
}

/** Get XLSX number format string for a column type */
function xlsxNumFmt(colType: ColumnDef["type"]): string | undefined {
    switch (colType) {
        case "currency": return '"$"#,##0.00';
        case "number": return "#,##0.##";
        case "progress": return "0%";
        case "date": return "yyyy-mm-dd";
        default: return undefined;
    }
}

// ─────────────────────────────────────────────────────────────
//  HEADER STYLE — Excel header row
// ─────────────────────────────────────────────────────────────

function makeHeaderStyle(colType: ColumnDef["type"]): any {
    // Base style every header gets
    const base = {
        font: { bold: true, sz: 11, color: { rgb: "FFFFFF" } },
        alignment: { horizontal: "center", vertical: "center", wrapText: true },
        border: {
            bottom: { style: "medium", color: { rgb: "0A6B52" } },
            right: { style: "thin", color: { rgb: "0D9E75" } },
        },
    };

    // Column-type tinted header backgrounds
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
    };

    return {
        ...base,
        fill: {
            patternType: "solid",
            fgColor: { rgb: fills[colType ?? "text"] ?? fills.text },
        },
    };
}

// ─────────────────────────────────────────────────────────────
//  CSV EXPORT
// ─────────────────────────────────────────────────────────────

function exportCSV(data: SheetExportData) {
    const { rows, columns, title } = data;

    const lines: string[] = [];

    // Header
    lines.push(columns.map(c => csvEscape(c.name)).join(","));

    // Data — stream in chunks so huge files don't block the thread
    const CHUNK = 500;
    for (let i = 0; i < rows.length; i += CHUNK) {
        const chunk = rows.slice(i, i + CHUNK);
        for (const row of chunk) {
            lines.push(
                columns
                    .map(col => csvEscape(resolveValue(row[col.key], col.type, true)))
                    .join(",")
            );
        }
    }

    // UTF-8 BOM so Excel opens it correctly without garbling special chars
    triggerDownload(
        new Blob(["\uFEFF" + lines.join("\r\n")], { type: "text/csv;charset=utf-8;" }),
        `${title}.csv`
    );
}

// ─────────────────────────────────────────────────────────────
//  EXCEL EXPORT
// ─────────────────────────────────────────────────────────────

function exportXLSX(data: SheetExportData) {
    const { rows, columns, title, cellFormats } = data;

    const wb = XLSX.utils.book_new();

    // ── Build the raw 2-D array ──────────────────────────────
    const wsData: any[][] = [
        columns.map(c => c.name),
        ...rows.map(row =>
            columns.map(col => {
                const raw = row[col.key];
                // Keep numbers as numbers so Excel can do math on them
                if ((col.type === "number" || col.type === "currency" || col.type === "progress") && raw !== "" && raw !== null && raw !== undefined) {
                    const n = Number(raw);
                    return isNaN(n) ? resolveValue(raw, col.type) : n;
                }
                if (col.type === "checkbox") return raw === true || raw === "true";
                return resolveValue(raw, col.type);
            })
        ),
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // ── Header row styles ────────────────────────────────────
    columns.forEach((col, ci) => {
        const ref = XLSX.utils.encode_cell({ r: 0, c: ci });
        if (!ws[ref]) return;
        ws[ref].s = makeHeaderStyle(col.type);
    });

    // ── Data cell styles ─────────────────────────────────────
    rows.forEach((row, ri) => {
        const isEvenRow = ri % 2 === 1; // alternate row shading

        columns.forEach((col, ci) => {
            const ref = XLSX.utils.encode_cell({ r: ri + 1, c: ci });
            if (!ws[ref]) return;

            const fmtKey = `${ri}-${col.key}`;
            const fmt = cellFormats[fmtKey] ?? {};
            const rawVal = row[col.key];
            const valStr = String(rawVal ?? "").toLowerCase();

            // ── Priority coloring ──
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

            // ── Status coloring ──
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

            // ── Progress bar — write as percentage ──
            if (col.type === "progress" && rawVal !== "" && rawVal !== null) {
                const pct = Math.min(100, Math.max(0, Number(rawVal)));
                ws[ref].v = pct / 100;
                ws[ref].t = "n";
                ws[ref].z = "0%";
                ws[ref].s = {
                    font: { sz: 10, bold: pct >= 80, color: { rgb: pct >= 80 ? "065F46" : pct >= 50 ? "92400E" : "1E3A5F" } },
                    fill: { patternType: "solid", fgColor: { rgb: pct >= 80 ? "D1FAE5" : pct >= 50 ? "FEF3C7" : "DBEAFE" } },
                    alignment: { horizontal: "center" },
                    numFmt: "0%",
                };
                return;
            }

            // ── Checkbox ──
            if (col.type === "checkbox") {
                ws[ref].s = {
                    font: { sz: 12, color: { rgb: rawVal === true || rawVal === "true" ? "059669" : "9CA3AF" } },
                    alignment: { horizontal: "center", vertical: "center" },
                    fill: isEvenRow ? { patternType: "solid", fgColor: { rgb: "F9FAFB" } } : undefined,
                };
                return;
            }

            // ── Default cell with user formatting ──
            const numFmt = xlsxNumFmt(col.type);
            ws[ref].s = {
                font: {
                    bold: fmt.bold ?? false,
                    italic: fmt.italic ?? false,
                    underline: fmt.underline ?? false,
                    strike: fmt.strikethrough ?? false,
                    sz: fmt.fontSize ?? 10,
                    color: fmt.textColor ? { rgb: fmt.textColor.replace("#", "") } : undefined,
                },
                fill: fmt.bgColor
                    ? { patternType: "solid", fgColor: { rgb: fmt.bgColor.replace("#", "") } }
                    : isEvenRow
                        ? { patternType: "solid", fgColor: { rgb: "F9FAFB" } }
                        : undefined,
                alignment: {
                    horizontal: fmt.align ?? (col.type === "number" || col.type === "currency" ? "right" : "left"),
                    vertical: "center",
                    wrapText: fmt.textWrap ?? false,
                },
                border: {
                    bottom: { style: "thin", color: { rgb: "E8EAED" } },
                    right: { style: "thin", color: { rgb: "F3F4F6" } },
                },
                ...(numFmt ? { numFmt } : {}),
            };
        });
    });

    // ── Column widths ────────────────────────────────────────
    ws["!cols"] = columns.map(col => ({
        wch: Math.max(12, Math.round((col.width ?? 160) / 7)),
    }));

    // ── Row heights ──────────────────────────────────────────
    ws["!rows"] = [
        { hpt: 26, hpx: 26 }, // header row taller
        ...rows.map(() => ({ hpt: 20, hpx: 20 })),
    ];

    // ── Freeze top row ───────────────────────────────────────
    ws["!freeze"] = { xSplit: 0, ySplit: 1 };

    // ── Auto-filter on header row ────────────────────────────
    ws["!autofilter"] = {
        ref: `A1:${XLSX.utils.encode_col(columns.length - 1)}1`,
    };

    // ── Sheet range ──────────────────────────────────────────
    ws["!ref"] = XLSX.utils.encode_range({
        s: { r: 0, c: 0 },
        e: { r: rows.length, c: columns.length - 1 },
    });

    XLSX.utils.book_append_sheet(wb, ws, title.slice(0, 31));

    // ── Workbook properties ──────────────────────────────────
    wb.Props = {
        Title: title,
        Subject: "SheetSync Export",
        Author: "SheetSync",
        CreatedDate: new Date(),
    };

    XLSX.writeFile(wb, `${title}.xlsx`, { cellStyles: true, compression: true });
}

// ─────────────────────────────────────────────────────────────
//  PDF EXPORT
// ─────────────────────────────────────────────────────────────

function exportPDF(data: SheetExportData) {
    const { rows, columns, title } = data;

    const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
        compress: true,
    });

    const pageW = doc.internal.pageSize.getWidth();
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

    // ── Cover header band ────────────────────────────────────
    doc.setFillColor(13, 124, 95);
    doc.rect(0, 0, pageW, 22, "F");

    // Logo text
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("SheetSync", 10, 14);

    // Sheet title (right-aligned in the band)
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(title, pageW - 10, 14, { align: "right" });

    // ── Meta row below band ──────────────────────────────────
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(
        `Exported on ${dateStr}   ·   ${rows.length.toLocaleString()} rows   ·   ${columns.length} columns`,
        10, 29
    );

    // ── Table ────────────────────────────────────────────────
    const totalColWidth = columns.reduce((s, c) => s + (c.width ?? 160), 0);
    const usableW = pageW - 20; // 10mm margin each side

    autoTable(doc, {
        head: [columns.map(c => c.name)],

        body: rows.map((row, ri) =>
            columns.map(col => resolveValue(row[col.key], col.type, true))
        ),

        startY: 33,
        margin: { left: 10, right: 10 },

        // ── Global cell styles ──
        styles: {
            fontSize: 7.5,
            cellPadding: { top: 2.5, right: 3, bottom: 2.5, left: 3 },
            font: "helvetica",
            overflow: "linebreak",
            valign: "middle",
            lineColor: [232, 234, 237],
            lineWidth: 0.15,
        },

        // ── Header ──
        headStyles: {
            fillColor: [13, 124, 95],
            textColor: [255, 255, 255],
            fontStyle: "bold",
            fontSize: 8,
            cellPadding: { top: 4, right: 3, bottom: 4, left: 3 },
            halign: "center",
        },

        // ── Alternate rows ──
        alternateRowStyles: {
            fillColor: [248, 250, 252],
        },

        // ── Per-column widths ──
        columnStyles: Object.fromEntries(
            columns.map((col, i) => {
                const proportion = (col.width ?? 160) / totalColWidth;
                const cellW = Math.max(14, proportion * usableW);
                const halign =
                    col.type === "number" || col.type === "currency" ? "right"
                        : col.type === "checkbox" || col.type === "progress" || col.type === "status" || col.type === "priority" ? "center"
                            : "left";
                return [i, { cellWidth: cellW, halign }];
            })
        ),

        // ── Per-cell styling (priority / status colors) ──
        willDrawCell(hookData) {
            if (hookData.row.section !== "body") return;
            const col = columns[hookData.column.index];
            const rawVal = rows[hookData.row.index]?.[col?.key ?? ""];
            const valStr = String(rawVal ?? "").toLowerCase();

            if (col?.type === "priority" && PRIORITY_COLOR_MAP[valStr]) {
                const rgb = PRIORITY_COLOR_MAP[valStr].hex;
                const r = parseInt(rgb.slice(0, 2), 16);
                const g = parseInt(rgb.slice(2, 4), 16);
                const b = parseInt(rgb.slice(4, 6), 16);
                doc.setFillColor(r, g, b);
                doc.roundedRect(
                    hookData.cell.x + 1,
                    hookData.cell.y + 1,
                    hookData.cell.width - 2,
                    hookData.cell.height - 2,
                    1, 1, "F"
                );
                doc.setTextColor(255, 255, 255);
            }

            if (col?.type === "status" && STATUS_COLOR_MAP[valStr]) {
                const { bgHex, hex } = STATUS_COLOR_MAP[valStr];
                const br = parseInt(bgHex.slice(0, 2), 16);
                const bg = parseInt(bgHex.slice(2, 4), 16);
                const bb = parseInt(bgHex.slice(4, 6), 16);
                doc.setFillColor(br, bg, bb);
                doc.roundedRect(
                    hookData.cell.x + 1,
                    hookData.cell.y + 1,
                    hookData.cell.width - 2,
                    hookData.cell.height - 2,
                    1, 1, "F"
                );
                const fr = parseInt(hex.slice(0, 2), 16);
                const fg = parseInt(hex.slice(2, 4), 16);
                const fb = parseInt(hex.slice(4, 6), 16);
                doc.setTextColor(fr, fg, fb);
            }

            if (col?.type === "progress" && rawVal !== "" && rawVal !== null) {
                const pct = Math.min(100, Math.max(0, Number(rawVal)));
                const barX = hookData.cell.x + 1;
                const barY = hookData.cell.y + hookData.cell.height / 2;
                const barW = hookData.cell.width - 2;
                const barH = 2.5;

                // Track
                doc.setFillColor(229, 231, 235);
                doc.roundedRect(barX, barY - barH / 2, barW, barH, 0.8, 0.8, "F");

                // Fill
                const fillColor = pct >= 80 ? [5, 150, 105] : pct >= 50 ? [217, 119, 6] : [37, 99, 235];
                doc.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
                doc.roundedRect(barX, barY - barH / 2, (barW * pct) / 100, barH, 0.8, 0.8, "F");

                // Percentage text above bar
                doc.setFontSize(6.5);
                doc.setTextColor(80, 80, 80);
                hookData.cell.text = [`${pct}%`];
            }
        },

        // ── Page footer ──
        didDrawPage(pageData) {
            const pageCount = (doc.internal as any).getNumberOfPages();
            const pageNum = pageData.pageNumber;

            doc.setFontSize(7);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(160, 160, 160);

            // Left: app name
            doc.text("SheetSync", 10, doc.internal.pageSize.getHeight() - 5);

            // Center: sheet title
            doc.text(title, pageW / 2, doc.internal.pageSize.getHeight() - 5, { align: "center" });

            // Right: page number
            doc.text(
                `Page ${pageNum} of ${pageCount}`,
                pageW - 10,
                doc.internal.pageSize.getHeight() - 5,
                { align: "right" }
            );

            // Top separator line (all pages after first)
            if (pageNum > 1) {
                doc.setDrawColor(13, 124, 95);
                doc.setLineWidth(0.4);
                doc.line(10, 8, pageW - 10, 8);
            }
        },
    });

    doc.save(`${title}.pdf`);
}

// ─────────────────────────────────────────────────────────────
//  JSON EXPORT
// ─────────────────────────────────────────────────────────────

function exportJSON(data: SheetExportData) {
    const { rows, columns, title, cellFormats } = data;

    const payload = {
        meta: {
            title,
            exportedAt: new Date().toISOString(),
            exportedBy: "SheetSync",
            version: "1.0",
            totalRows: rows.length,
            totalColumns: columns.length,
        },
        schema: columns.map(c => ({
            key: c.key,
            name: c.name,
            type: c.type ?? "text",
            width: c.width ?? 160,
        })),
        rows: rows.map((row, ri) => ({
            _index: ri,
            ...Object.fromEntries(
                columns.map(col => [
                    col.name,
                    {
                        raw: row[col.key] ?? null,
                        display: resolveValue(row[col.key], col.type, true),
                        type: col.type ?? "text",
                    },
                ])
            ),
        })),
        formats: Object.fromEntries(
            Object.entries(cellFormats).map(([key, fmt]) => [key, fmt])
        ),
    };

    triggerDownload(
        new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }),
        `${title}.json`
    );
}

// ─────────────────────────────────────────────────────────────
//  MAIN ENTRY POINT — called from SheetClient
// ─────────────────────────────────────────────────────────────

export async function exportSheet({ format, sheetId }: ExportOptions): Promise<void> {
    const data = await fetchSheetForExport(sheetId);

    switch (format) {
        case "csv": exportCSV(data); break;
        case "xlsx": exportXLSX(data); break;
        case "pdf": exportPDF(data); break;
        case "json": exportJSON(data); break;
    }
}