// ================= TYPES =================

export interface CellFormat {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  fontSize?: number;
  textColor?: string;
  bgColor?: string;
  align?: "left" | "center" | "right";
  wrapText?: boolean;
  borderBottom?: string;
  borderTop?: string;
  borderLeft?: string;
  borderRight?: string;
  merge?: any;
}

export type CellType =
  | "text"
  | "number"
  | "date"
  | "checkbox"
  | "status"
  | "priority"
  | "progress"
  | "url"
  | "currency";

export interface StatusOption {
  label: string;
  color: string;
  bgColor: string;
}

export interface SheetRow {
  id: string;
  [key: string]: string | number | boolean | undefined;
}

export interface ColumnDef {
  key: string;
  name: string;
  width?: number;
  editable?: boolean;
  resizable?: boolean;
  type?: CellType;
  statusOptions?: StatusOption[];
  isExtra?: boolean;
}

export interface LockedCell {
  rowIdx: number;
  colKey: string;
}

export interface ProfessionalTemplateLayout {
  rows: SheetRow[];
  cellFormats: Record<string, any>;
  rowHeights: Record<string, number>;
}

// ================= STATUS COLORS =================

export const STATUS_COLORS: Record<string, StatusOption> = {
  "In Progress": { label: "In Progress", color: "#b45309", bgColor: "#fef3c7" },
  Done: { label: "Done", color: "#166534", bgColor: "#dcfce7" },
  "Not Started": { label: "Not Started", color: "#6b7280", bgColor: "#f3f4f6" },
  Blocked: { label: "Blocked", color: "#dc2626", bgColor: "#fee2e2" },
  "In Review": { label: "In Review", color: "#7c3aed", bgColor: "#ede9fe" },
  High: { label: "High", color: "#dc2626", bgColor: "#fee2e2" },
  Medium: { label: "Medium", color: "#b45309", bgColor: "#fef3c7" },
  Low: { label: "Low", color: "#166534", bgColor: "#dcfce7" },
  Critical: { label: "Critical", color: "#7f1d1d", bgColor: "#fecaca" },
  Paid: { label: "Paid", color: "#166534", bgColor: "#dcfce7" },
  Pending: { label: "Pending", color: "#b45309", bgColor: "#fef3c7" },
  Overdue: { label: "Overdue", color: "#dc2626", bgColor: "#fee2e2" },
  Passed: { label: "Passed", color: "#166534", bgColor: "#dcfce7" },
  Failed: { label: "Failed", color: "#dc2626", bgColor: "#fee2e2" },
  Skipped: { label: "Skipped", color: "#6b7280", bgColor: "#f3f4f6" },
  Lead: { label: "Lead", color: "#3b82f6", bgColor: "#dbeafe" },
  Contacted: { label: "Contacted", color: "#6366f1", bgColor: "#e0e7ff" },
  Proposal: { label: "Proposal", color: "#ec4899", bgColor: "#fce7f3" },
  Won: { label: "Won", color: "#166534", bgColor: "#dcfce7" },
  Lost: { label: "Lost", color: "#dc2626", bgColor: "#fee2e2" },
  Active: { label: "Active", color: "#166534", bgColor: "#dcfce7" },
  "On Leave": { label: "On Leave", color: "#b45309", bgColor: "#fef3c7" },
  Terminated: { label: "Terminated", color: "#dc2626", bgColor: "#fee2e2" },
  Planning: { label: "Planning", color: "#3b82f6", bgColor: "#dbeafe" },
  Completed: { label: "Completed", color: "#166534", bgColor: "#dcfce7" },
  Paused: { label: "Paused", color: "#b45309", bgColor: "#fef3c7" },
  Draft: { label: "Draft", color: "#6b7280", bgColor: "#f3f4f6" },
  Writing: { label: "Writing", color: "#3b82f6", bgColor: "#dbeafe" },
  Editing: { label: "Editing", color: "#6366f1", bgColor: "#e0e7ff" },
  Scheduled: { label: "Scheduled", color: "#7c3aed", bgColor: "#ede9fe" },
  Published: { label: "Published", color: "#166534", bgColor: "#dcfce7" },
  Approved: { label: "Approved", color: "#166534", bgColor: "#dcfce7" },
  Rejected: { label: "Rejected", color: "#dc2626", bgColor: "#fee2e2" },
  Unpaid: { label: "Unpaid", color: "#dc2626", bgColor: "#fee2e2" },
  Todo: { label: "Todo", color: "#6b7280", bgColor: "#f3f4f6" },
};

export const getStatusStyle = (value: string): StatusOption | undefined =>
  STATUS_COLORS[value];

// ================= COLUMN LETTER HELPER =================

export const getColumnLetter = (index: number): string => {
  let letter = "";
  let n = index + 1;
  while (n > 0) {
    const rem = (n - 1) % 26;
    letter = String.fromCharCode(65 + rem) + letter;
    n = Math.floor((n - 1) / 26);
  }
  return letter;
};

// ================= DATE HELPERS =================

const addDays = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
};

// ================= EXTRA COLUMNS =================

const EXTRA_COL_COUNT = 8;
const DEFAULT_WORKING_ROW_COUNT = 1200;

const buildExtraColumns = (startIndex: number): ColumnDef[] =>
  Array.from({ length: EXTRA_COL_COUNT }, (_, i) => {
    const idx = startIndex + i;
    const letter = getColumnLetter(idx);
    return {
      key: `__extra_${letter}`,
      name: letter,
      width: 120,
      editable: true,
      type: "text" as CellType,
      isExtra: true,
    };
  });

// ================= ROW FACTORY =================

const makeRows = (
  count: number,
  columnKeys: string[],
  seedData: Record<string, any>[] = [],
  defaults: Record<string, any> = {},
): SheetRow[] =>
  Array.from({ length: count }, (_, i) => {
    const base: SheetRow = { id: String(i + 1) };
    columnKeys.forEach((key) => {
      const def = defaults[key];
      base[key] = typeof def === "function" ? def(i) : (def ?? "");
    });
    if (seedData[i]) {
      Object.entries(seedData[i]).forEach(([k, v]) => {
        base[k] = v as any;
      });
    }
    return base;
  });

// ================= LAYOUT CONFIG =================

type FieldRow =
  | null // spacer
  | {
      left: string;          // label text
      right?: string | null; // right-side label (null = extend underline full width)
      leftPlaceholder?: string; // gray hint text shown in the value cell
      rightPlaceholder?: string;
    };

type LayoutConfig = {
  /** Disable layout styling entirely so data starts from top */
  disabled?: boolean;
  simple?: boolean;
  /** Show the big accent title banner in row 0 */
  showTitleBanner: boolean;
  /** Accent hex colour */
  accent: string;
  /**
   * Rows 1-N (after optional title banner).
   * Each entry describes one metadata row.
   * null = blank spacer row.
   */
  fieldRows: FieldRow[];
  /** Label shown in the dark data-entry banner */
  dataLabel: string;
};

export const LAYOUT_CONFIGS: Record<string, LayoutConfig> = {
  "c9fb4014-cccf-4394-9c3f-5eb16c00cc47": {
    showTitleBanner: false,
    accent: "#1e3a5f",
    fieldRows: [
      { left: "Project Owner", right: "Due Date" },
      { left: "Phase", right: "Status" },
    ],
    dataLabel: "TASKS",
  },

  "2a197048-b791-490e-aaff-9b00785b2b27": {
    showTitleBanner: false,
    accent: "#0f766e",
    fieldRows: [
      { left: "Company / Client", right: "Period" },
      { left: "Prepared By", right: "Approved By" },
      { left: "Reporting Currency", right: "Prepared Date" },
    ],
    dataLabel: "TRANSACTIONS",
  },

  "e73711d5-aab0-4281-bc8f-486ad6c6aaac": {
    showTitleBanner: false,
    accent: "#7f1d1d",
    fieldRows: [
      { left: "Product", right: "Version" },
      { left: "Sprint", right: "Lead Tester" },
    ],
    dataLabel: "BUG LOG",
  },

  "a1b2c3d4-e5f6-7890-abcd-ef1234567890": {
    showTitleBanner: false,
    accent: "#5b21b6",
    fieldRows: [
      { left: "Account Name", right: "Region" },
      { left: "Sales Representative", right: "Quarter" },
      { left: "Target Revenue ($)", right: "Pipeline Stage" },
    ],
    dataLabel: "CONTACTS",
  },

  "b2c3d4e5-f6a7-8901-bcde-f12345678901": {
    simple: true,
    showTitleBanner: false,
    accent: "#374151",
    fieldRows: [],
    dataLabel: "DIRECTORY",
  },

  "c3d4e5f6-a7b8-9012-cdef-123456789012": {
    showTitleBanner: false,
    accent: "#92400e",
    fieldRows: [
      { left: "Warehouse / Location", right: "Manager" },
      { left: "Last Audit Date", right: "Currency" },
    ],
    dataLabel: "INVENTORY",
  },

  "d4e5f6a7-b8c9-0123-defa-234567890123": {
    showTitleBanner: false,
    accent: "#831843",
    fieldRows: [
      { left: "Marketing Team", right: "Quarter" },
      { left: "Total Budget ($)", right: "Brand Guidelines" },
    ],
    dataLabel: "CAMPAIGNS",
  },

  "e5f6a7b8-c9d0-1234-efab-345678901234": {
    simple: true,
    showTitleBanner: false,
    accent: "#0369a1",
    fieldRows: [],
    dataLabel: "SESSIONS",
  },

  "f6a7b8c9-d0e1-2345-fabc-456789012345": {
    simple: true,
    showTitleBanner: false,
    accent: "#1e40af",
    fieldRows: [],
    dataLabel: "BACKLOG",
  },

  "a7b8c9d0-e1f2-3456-abcd-567890123456": {
    showTitleBanner: false,
    accent: "#78350f",
    fieldRows: [
      { left: "Employee Name", right: "Department" },
      { left: "Reporting Manager", right: "Reporting Period" },
    ],
    dataLabel: "EXPENSES",
  },

  "b8c9d0e1-f2a3-4567-bcde-678901234567": {
    simple: true,
    showTitleBanner: false,
    accent: "#be185d",
    fieldRows: [],
    dataLabel: "CONTENT",
  },

  "c9d0e1f2-a3b4-5678-cdef-789012345678": {
    showTitleBanner: false,
    accent: "#b45309",
    fieldRows: [
      { left: "Event Name", right: "Event Date" },
      { left: "Event Venue", right: "Organizer" },
      { left: "Total Budget ($)", right: "Approved By" },
    ],
    dataLabel: "EVENT ITEMS",
  },

  "d0e1f2a3-b4c5-6789-defa-890123456789": {
    simple: true,
    showTitleBanner: false,
    accent: "#6d28d9",
    fieldRows: [],
    dataLabel: "STUDENTS",
  },
};

const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
  disabled: true,
  showTitleBanner: false,
  accent: "#1f2937",
  fieldRows: [],
  dataLabel: "DATA",
};

// ================= UNDERLINE CELL FORMAT HELPER =================

/**
 * Returns a cell format that renders as an underline-only field —
 * the bold label on the left, an empty editable area with just a bottom border.
 */
const labelFormat = (accent: string): CellFormat => ({
  bold: true,
  fontSize: 10,
  textColor: "#94a3b8",
  bgColor: "#ffffff",
  borderBottom: "none",
  borderTop: "none",
  borderLeft: "none",
  borderRight: "none",
});

const valueFormat = (): CellFormat => ({
  bgColor: "#ffffff",
  textColor: "#1e293b",
  fontSize: 11,
  borderBottom: "none",
  borderTop: "none",
  borderLeft: "none",
  borderRight: "none",
});

const spacerFormat = (): CellFormat => ({
  bgColor: "#ffffff",
  borderTop: "none",
  borderBottom: "none",
  borderLeft: "none",
  borderRight: "none",
});


export const buildSimpleTemplateLayout = (
  title: string,
  columns: ColumnDef[],
  rows: SheetRow[],
  accent: string,
): ProfessionalTemplateLayout => {
  const workingColumns = columns.filter((col) => !col.isExtra);
  if (workingColumns.length === 0 || rows.length < 3) {
    return { rows, cellFormats: {}, rowHeights: {} };
  }

  const colSpan = Math.min(workingColumns.length, 10);
  const cellFormats: Record<string, CellFormat> = {};

  const nextRows: SheetRow[] = rows.map((row, i) => {
    if (i >= 2) return row;
    const cleared: SheetRow = { id: row.id };
    Object.keys(row).forEach((k) => {
      if (!workingColumns.find((c) => c.key === k)) cleared[k] = row[k];
    });
    workingColumns.forEach((col) => { cleared[col.key] = ""; });
    return cleared;
  });

  // Row 0: merged title
  nextRows[0][workingColumns[0].key] = title.toUpperCase();
  const mergeDescriptor = {
    masterRow: 0,
    masterCol: workingColumns[0].key,
    rowSpan: 1,
    colSpan,
    mode: "center" as const,
  };
  for (let i = 0; i < colSpan; i++) {
    const colKey = workingColumns[i]?.key;
    if (!colKey) continue;
    cellFormats[`0-${colKey}`] =
      i === 0
        ? { bold: true, fontSize: 16, textColor: "#ffffff", bgColor: accent, align: "center", merge: mergeDescriptor }
        : { merge: { ...mergeDescriptor, hidden: true } };
  }

  // Row 1: column headers
  workingColumns.forEach((col, i) => {
    const inLayout = i < colSpan;
    cellFormats[`1-${col.key}`] = {
      bold: true,
      fontSize: 11,
      textColor: inLayout ? "#ffffff" : "#334155",
      bgColor: inLayout ? accent : "#f1f5f9",
      align: "center",
      borderTop: "none",
      borderBottom: "none",
      borderLeft: "none",
      borderRight: "none",
    };
    if (inLayout) nextRows[1][col.key] = col.name;
  });

  const rowHeights: Record<string, number> = {};
  if (nextRows[0]?.id) rowHeights[nextRows[0].id] = 44;
  if (nextRows[1]?.id) rowHeights[nextRows[1].id] = 32;

  return { rows: nextRows, cellFormats, rowHeights };
};

// ================= MAIN LAYOUT BUILDER =================

/**
 * FIXED: accepts real rows (with their DB-assigned IDs) and uses row.id
 * for rowHeights keys — so heights survive ensureWorkingRowBuffer.
 *
 * Cell format keys still use the grid row INDEX (e.g. "0-task") because
 * the DataGrid looks up formats by `rows.findIndex(r => r.id === row.id)`.
 */
export const buildProfessionalTemplateLayout = (
  title: string,
  columns: ColumnDef[],
  rows: SheetRow[],
  templateId?: string,
): ProfessionalTemplateLayout => {
  const cfg: LayoutConfig =
    (templateId ? LAYOUT_CONFIGS[templateId] : undefined) ?? DEFAULT_LAYOUT_CONFIG;

if (cfg.disabled) {
    return { rows, cellFormats: {}, rowHeights: {} };
  }

  if (cfg.simple) {
    return buildSimpleTemplateLayout(title, columns, rows, cfg.accent);
  }

  const workingColumns = columns.filter((col) => !col.isExtra);
  if (workingColumns.length === 0 || rows.length < 10) {
    return { rows, cellFormats: {}, rowHeights: {} };
  }

  const numCols = workingColumns.length;
  const colSpan = Math.min(numCols, 10);
  const { accent, showTitleBanner, fieldRows, dataLabel } = cfg;

  // ── Clone rows (only layout rows 0-9) ─────────────────────────────────
  const nextRows: SheetRow[] = rows.map((row, i) => {
    if (i >= 10) return row;
    const cleared: SheetRow = { id: row.id };
    // Copy over non-column keys (like _automationRuns etc.)
    Object.keys(row).forEach((k) => {
      if (!workingColumns.find((c) => c.key === k)) cleared[k] = row[k];
    });
    // Clear all working-column values for the layout rows
    workingColumns.forEach((col) => { cleared[col.key] = ""; });
    return cleared;
  });

  const cellFormats: Record<string, CellFormat> = {};

  // ── Low-level helpers ─────────────────────────────────────────────────

  /** Write a display value into a layout row */
  const setValue = (rowIdx: number, colIdx: number, value: string) => {
    if (colIdx < 0 || colIdx >= workingColumns.length) return;
    if (rowIdx < 0 || rowIdx >= nextRows.length) return;
    nextRows[rowIdx][workingColumns[colIdx].key] = value;
  };

  /** Apply a merge block across a row, using the GRID ROW INDEX as key */
  const mergeBlock = (
    rowIdx: number,
    startColIdx: number,
    span: number,
    format: CellFormat,
  ) => {
    const effectiveSpan = Math.min(span, numCols - startColIdx);
    if (effectiveSpan <= 0 || startColIdx < 0 || startColIdx >= numCols) return;
    const masterColKey = workingColumns[startColIdx].key;
    const mergeDescriptor = {
      masterRow: rowIdx,
      masterCol: masterColKey,
      rowSpan: 1,
      colSpan: effectiveSpan,
      mode: (format.align === "center" ? "center" : "across") as "center" | "across",
    };
    for (let i = 0; i < effectiveSpan; i++) {
      const colKey = workingColumns[startColIdx + i]?.key;
      if (!colKey) continue;
      cellFormats[`${rowIdx}-${colKey}`] =
        i === 0
          ? { ...format, merge: mergeDescriptor }
          : { merge: { ...mergeDescriptor, hidden: true } };
    }
  };

  /** Apply format to every cell in a row range, no merge */
  const applyRowFmt = (rowIdx: number, startCol: number, endCol: number, fmt: CellFormat) => {
    for (let c = startCol; c < endCol && c < numCols; c++) {
      const colKey = workingColumns[c]?.key;
      if (colKey) cellFormats[`${rowIdx}-${colKey}`] = fmt;
    }
  };

  // ── Row 0: title banner (optional) ───────────────────────────────────
  let currentRow = 0;

  if (showTitleBanner) {
    setValue(0, 0, title.toUpperCase());
    mergeBlock(0, 0, colSpan, {
      bold: true,
      fontSize: 20,
      textColor: "#ffffff",
      bgColor: accent,
      align: "center",
    });
    currentRow = 1;
  }

  // ── Field rows ────────────────────────────────────────────────────────
  //
  // Each FieldRow renders like:
  //   [LABEL TEXT]  ___________  [LABEL TEXT]  ___________
  //
  // where ___ is an underlined blank input zone.
  // If right === null the underline spans the full remaining width.

  fieldRows.forEach((pair, i) => {
    const ri = currentRow + i;
    if (ri >= 8 || ri >= nextRows.length) return;

    if (pair === null) {
      // Spacer row
      applyRowFmt(ri, 0, colSpan, spacerFormat());
      return;
    }

    const { left: leftLabel, right: rightLabel } = pair;
    const halfSpan = Math.floor(colSpan / 2);

    // ── Left label cell ────────────────────────────────────────────────
    setValue(ri, 0, leftLabel);
    cellFormats[`${ri}-${workingColumns[0].key}`] = labelFormat(accent);

    // ── Left value cells (cols 1 … halfSpan-1) ────────────────────────
    if (rightLabel !== undefined) {
      // Two-column layout
      for (let c = 1; c < halfSpan && c < numCols; c++) {
        const colKey = workingColumns[c]?.key;
        if (colKey) cellFormats[`${ri}-${colKey}`] = valueFormat();
      }

      // ── Right label cell ─────────────────────────────────────────────
      if (rightLabel && halfSpan < numCols) {
        setValue(ri, halfSpan, rightLabel);
        cellFormats[`${ri}-${workingColumns[halfSpan].key}`] = labelFormat(accent);

        // ── Right value cells ─────────────────────────────────────────
        for (let c = halfSpan + 1; c < colSpan && c < numCols; c++) {
          const colKey = workingColumns[c]?.key;
          if (colKey) cellFormats[`${ri}-${colKey}`] = valueFormat();
        }
      } else if (!rightLabel) {
        // right === null → extend underline across whole right half
        for (let c = halfSpan; c < colSpan && c < numCols; c++) {
          const colKey = workingColumns[c]?.key;
          if (colKey) cellFormats[`${ri}-${colKey}`] = valueFormat();
        }
      }
    } else {
      // No right label — full-width underline (right is not specified)
      for (let c = 1; c < colSpan && c < numCols; c++) {
        const colKey = workingColumns[c]?.key;
        if (colKey) cellFormats[`${ri}-${colKey}`] = valueFormat();
      }
    }
  });

  // ── Open borderless zone (chart area: rows after fields up to row 7) ──
  const chartZoneStart = currentRow + fieldRows.length;
  for (let ri = chartZoneStart; ri <= 7 && ri < nextRows.length; ri++) {
    applyRowFmt(ri, 0, colSpan, {
      bgColor: "#ffffff",
      borderTop: "none",
      borderBottom: "none",
      borderLeft: "none",
      borderRight: "none",
    });
  }

  // ── Row 8: data-entry dark banner ────────────────────────────────────
  setValue(8, 0, dataLabel);
  mergeBlock(8, 0, colSpan, {
    bold: true,
    fontSize: 12,
    textColor: "#ffffff",
    bgColor: "#1e293b",
    align: "center",
  });

  // ── Row 9: column header labels (accent background) ──────────────────
  workingColumns.forEach((col, i) => {
    const inLayout = i < colSpan;
    cellFormats[`9-${col.key}`] = {
      bold: true,
      fontSize: 11,
      textColor: inLayout ? "#ffffff" : "#334155",
      bgColor: inLayout ? accent : "#f1f5f9",
      align: "center",
      borderTop: "none",
      borderBottom: "none",
      borderLeft: "none",
      borderRight: "none",
    };
    if (inLayout) setValue(9, i, col.name);
  });

  // ── Row heights — FIXED: key by actual row.id (not row index) ─────────
  //
  // This is the critical fix. Previously the code used nextRows[idx]?.id
  // which happened to be String(idx+1) for fresh rows, but after
  // ensureWorkingRowBuffer the IDs become "row_timestamp_random" strings.
  // We key by row.id here so the heights survive the buffer pass.

  const DEFAULT_BANNER_H = showTitleBanner ? 54 : 38;

  const HEIGHT_MAP: Record<number, number> = {
    0: DEFAULT_BANNER_H,
    1: 38,
    2: 38,
    3: 38,
    4: 36,
    5: 36,
    6: 36,
    7: 36,
    8: 34,
    9: 32,
  };

  const rowHeights: Record<string, number> = {};
  Object.entries(HEIGHT_MAP).forEach(([idxStr, h]) => {
    const idx = Number(idxStr);
    const rowId = nextRows[idx]?.id;
    if (rowId) rowHeights[rowId] = h;
  });

  return { rows: nextRows, cellFormats, rowHeights };
};

// ================= CHART PRESET =================

export function getTemplateChartY(
  bufferedRows: SheetRow[],
  rowHeights: Record<string, number>,
  showTitleBanner: boolean,
): number {
  let y = 0;
  for (let i = 0; i < 3; i++) {
    const rowId = bufferedRows[i]?.id;
    y += rowId ? (rowHeights[rowId] ?? 36) : 36;
  }
  return y + 8;
}

export function getTemplateChartPreset(
  templateId: string,
  columns: ColumnDef[],
): {
  kind: string;
  labelColumnKey: string;
  seriesKeys: string[];
  aggregateMode: "none" | "count" | "sum";
  title: string;
} | null {
  const has = (key: string) => columns.some((c) => c.key === key);

  switch (templateId) {
    case "c9fb4014-cccf-4394-9c3f-5eb16c00cc47":
      return has("status")
        ? { kind: "donut", labelColumnKey: "status", seriesKeys: [], aggregateMode: "count", title: "Tasks by Status" }
        : null;
    case "2a197048-b791-490e-aaff-9b00785b2b27":
      return has("income") && has("expense")
        ? { kind: "bar", labelColumnKey: "category", seriesKeys: ["income", "expense"], aggregateMode: "sum", title: "Income vs Expense" }
        : null;
    case "e73711d5-aab0-4281-bc8f-486ad6c6aaac":
      return has("severity")
        ? { kind: "pie", labelColumnKey: "severity", seriesKeys: [], aggregateMode: "count", title: "Bugs by Severity" }
        : null;
    case "a1b2c3d4-e5f6-7890-abcd-ef1234567890":
      return has("stage")
        ? { kind: "donut", labelColumnKey: "stage", seriesKeys: [], aggregateMode: "count", title: "Pipeline by Stage" }
        : null;
    case "b2c3d4e5-f6a7-8901-bcde-f12345678901":
      return has("dept")
        ? { kind: "pie", labelColumnKey: "dept", seriesKeys: [], aggregateMode: "count", title: "Headcount by Dept" }
        : null;
    case "c3d4e5f6-a7b8-9012-cdef-123456789012":
      return has("stock")
        ? { kind: "bar", labelColumnKey: "item", seriesKeys: ["stock"], aggregateMode: "none", title: "Stock Levels" }
        : null;
    case "d4e5f6a7-b8c9-0123-defa-234567890123":
      return has("budget") && has("spend")
        ? { kind: "bar", labelColumnKey: "campaign", seriesKeys: ["budget", "spend"], aggregateMode: "sum", title: "Budget vs Spend" }
        : null;
    case "e5f6a7b8-c9d0-1234-efab-345678901234":
      return null;
    case "f6a7b8c9-d0e1-2345-fabc-456789012345":
      return has("status")
        ? { kind: "donut", labelColumnKey: "status", seriesKeys: [], aggregateMode: "count", title: "Sprint Progress" }
        : null;
    case "a7b8c9d0-e1f2-3456-abcd-567890123456":
      return has("amount")
        ? { kind: "bar", labelColumnKey: "category", seriesKeys: ["amount"], aggregateMode: "sum", title: "Expenses by Category" }
        : null;
    case "b8c9d0e1-f2a3-4567-bcde-678901234567":
      return has("status")
        ? { kind: "donut", labelColumnKey: "status", seriesKeys: [], aggregateMode: "count", title: "Content by Stage" }
        : null;
    case "c9d0e1f2-a3b4-5678-cdef-789012345678":
      return has("estCost") && has("actCost")
        ? { kind: "bar", labelColumnKey: "category", seriesKeys: ["estCost", "actCost"], aggregateMode: "sum", title: "Estimated vs Actual" }
        : null;
    case "d0e1f2a3-b4c5-6789-defa-890123456789":
      return has("finalGrade")
        ? { kind: "bar", labelColumnKey: "name", seriesKeys: ["finalGrade"], aggregateMode: "none", title: "Student Grades" }
        : null;
    default:
      return null;
  }
}

// ================= DEFAULT VALUES PER TEMPLATE =================

const PROJECT_DEFAULTS: Record<string, any> = {
  start: (i: number) => addDays(i),
  due: (i: number) => addDays(i + 7),
  status: "Not Started",
  priority: "Medium",
  progress: 0,
};
const FINANCE_DEFAULTS: Record<string, any> = {
  date: (i: number) => addDays(i),
  status: "Pending",
  income: 0,
  expense: 0,
  balance: 0,
};
const QA_DEFAULTS: Record<string, any> = { status: "Not Started", severity: "Medium" };
const CRM_DEFAULTS: Record<string, any> = { stage: "Lead", value: 0 };
const EMPLOYEE_DEFAULTS: Record<string, any> = {
  status: "Active",
  startDate: (i: number) => addDays(i),
};
const INVENTORY_DEFAULTS: Record<string, any> = { stock: 0, reorder: 10, price: 0 };
const MARKETING_DEFAULTS: Record<string, any> = {
  status: "Planning",
  startDate: (i: number) => addDays(i),
  endDate: (i: number) => addDays(i + 14),
  budget: 0,
  spend: 0,
};
const MEETING_DEFAULTS: Record<string, any> = { date: (i: number) => addDays(i) };
const SPRINT_DEFAULTS: Record<string, any> = { status: "Todo", priority: "Medium", points: 0 };
const EXPENSE_DEFAULTS: Record<string, any> = {
  status: "Pending",
  amount: 0,
  date: (i: number) => addDays(i),
};
const CONTENT_DEFAULTS: Record<string, any> = {
  status: "Draft",
  dueDate: (i: number) => addDays(i),
  publishDate: (i: number) => addDays(i + 3),
};
const EVENT_DEFAULTS: Record<string, any> = {
  estCost: 0,
  actCost: 0,
  status: "Unpaid",
  dueDate: (i: number) => addDays(i),
};
const GRADEBOOK_DEFAULTS: Record<string, any> = {
  assignment1: 0,
  assignment2: 0,
  exam1: 0,
  project: 0,
  finalGrade: 0,
};

// ================= TEMPLATES =================

export const getTemplateData = (
  templateId: string,
): { columns: ColumnDef[]; rows: SheetRow[]; title: string } => {
  switch (templateId) {
    case "c9fb4014-cccf-4394-9c3f-5eb16c00cc47": {
      const templateCols: ColumnDef[] = [
        { key: "task", name: "Task", width: 260, editable: true, type: "text" },
        { key: "owner", name: "Owner", width: 150, editable: true, type: "text" },
        { key: "start", name: "Start Date", width: 130, editable: true, type: "date" },
        { key: "due", name: "Due Date", width: 130, editable: true, type: "date" },
        { key: "status", name: "Status", width: 140, editable: true, type: "status",
          statusOptions: [STATUS_COLORS["Not Started"], STATUS_COLORS["In Progress"], STATUS_COLORS["Done"], STATUS_COLORS["Blocked"]] },
        { key: "priority", name: "Priority", width: 120, editable: true, type: "priority",
          statusOptions: [STATUS_COLORS["High"], STATUS_COLORS["Medium"], STATUS_COLORS["Low"]] },
        { key: "progress", name: "Progress (%)", width: 130, editable: true, type: "progress" },
        { key: "notes", name: "Notes", width: 240, editable: true, type: "text" },
      ];
      return {
        title: "Project Tracker",
        columns: [...templateCols, ...buildExtraColumns(templateCols.length)],
        rows: makeRows(DEFAULT_WORKING_ROW_COUNT, templateCols.map((c) => c.key), [], PROJECT_DEFAULTS),
      };
    }
    case "2a197048-b791-490e-aaff-9b00785b2b27": {
      const templateCols: ColumnDef[] = [
        { key: "date", name: "Date", width: 130, editable: true, type: "text" },
        { key: "category", name: "Category", width: 160, editable: true, type: "text" },
        { key: "desc", name: "Description", width: 240, editable: true, type: "text" },
        { key: "income", name: "Income", width: 140, editable: true, type: "currency" },
        { key: "expense", name: "Expense", width: 140, editable: true, type: "currency" },
        { key: "balance", name: "Balance", width: 140, editable: false, type: "currency" },
        { key: "status", name: "Status", width: 130, editable: true, type: "status" },
      ];
      return {
        title: "Finance Tracker",
        columns: [...templateCols, ...buildExtraColumns(templateCols.length)],
        rows: makeRows(DEFAULT_WORKING_ROW_COUNT, templateCols.map((c) => c.key), [], FINANCE_DEFAULTS),
      };
    }
    case "e73711d5-aab0-4281-bc8f-486ad6c6aaac": {
      const templateCols: ColumnDef[] = [
        { key: "bugId", name: "Bug ID", width: 100, editable: true, type: "text" },
        { key: "title", name: "Title", width: 200, editable: true, type: "text" },
        { key: "description", name: "Description", width: 250, editable: true, type: "text" },
        { key: "environment", name: "Environment", width: 140, editable: true, type: "text" },
        { key: "steps", name: "Steps to Reproduce", width: 280, editable: true, type: "text" },
        { key: "screenshot", name: "Screenshot", width: 160, editable: true, type: "text" },
        { key: "severity", name: "Severity", width: 120, editable: true, type: "priority",
          statusOptions: [STATUS_COLORS["Critical"], STATUS_COLORS["High"], STATUS_COLORS["Medium"], STATUS_COLORS["Low"]] },
        { key: "reporter", name: "Reported By", width: 140, editable: true, type: "text" },
        { key: "assigned", name: "Assign To", width: 140, editable: true, type: "text" },
        { key: "status", name: "Status", width: 130, editable: true, type: "status",
          statusOptions: [STATUS_COLORS["Not Started"], STATUS_COLORS["In Progress"], STATUS_COLORS["In Review"], STATUS_COLORS["Done"], STATUS_COLORS["Blocked"]] },
      ];
      return {
        title: "QA Tracker",
        columns: [...templateCols, ...buildExtraColumns(templateCols.length)],
        rows: makeRows(DEFAULT_WORKING_ROW_COUNT, templateCols.map((c) => c.key), [], QA_DEFAULTS),
      };
    }
    case "a1b2c3d4-e5f6-7890-abcd-ef1234567890": {
      const templateCols: ColumnDef[] = [
        { key: "contact", name: "Contact Name", width: 180, editable: true, type: "text" },
        { key: "company", name: "Company", width: 160, editable: true, type: "text" },
        { key: "stage", name: "Stage", width: 140, editable: true, type: "status",
          statusOptions: [STATUS_COLORS["Lead"], STATUS_COLORS["Contacted"], STATUS_COLORS["Proposal"], STATUS_COLORS["Won"], STATUS_COLORS["Lost"]] },
        { key: "value", name: "Lead Value", width: 130, editable: true, type: "currency" },
        { key: "email", name: "Email", width: 200, editable: true, type: "url" },
        { key: "phone", name: "Phone", width: 140, editable: true, type: "text" },
        { key: "notes", name: "Notes", width: 240, editable: true, type: "text" },
      ];
      return {
        title: "Client CRM",
        columns: [...templateCols, ...buildExtraColumns(templateCols.length)],
        rows: makeRows(DEFAULT_WORKING_ROW_COUNT, templateCols.map((c) => c.key), [], CRM_DEFAULTS),
      };
    }
    case "b2c3d4e5-f6a7-8901-bcde-f12345678901": {
      const templateCols: ColumnDef[] = [
        { key: "name", name: "Name", width: 180, editable: true, type: "text" },
        { key: "dept", name: "Department", width: 150, editable: true, type: "text" },
        { key: "role", name: "Role", width: 150, editable: true, type: "text" },
        { key: "email", name: "Email", width: 200, editable: true, type: "url" },
        { key: "phone", name: "Phone", width: 140, editable: true, type: "text" },
        { key: "startDate", name: "Start Date", width: 130, editable: true, type: "date" },
        { key: "status", name: "Status", width: 130, editable: true, type: "status",
          statusOptions: [STATUS_COLORS["Active"], STATUS_COLORS["On Leave"], STATUS_COLORS["Terminated"]] },
      ];
      return {
        title: "Employee Directory",
        columns: [...templateCols, ...buildExtraColumns(templateCols.length)],
        rows: makeRows(DEFAULT_WORKING_ROW_COUNT, templateCols.map((c) => c.key), [], EMPLOYEE_DEFAULTS),
      };
    }
    case "c3d4e5f6-a7b8-9012-cdef-123456789012": {
      const templateCols: ColumnDef[] = [
        { key: "item", name: "Item Name", width: 200, editable: true, type: "text" },
        { key: "sku", name: "SKU", width: 120, editable: true, type: "text" },
        { key: "category", name: "Category", width: 140, editable: true, type: "text" },
        { key: "stock", name: "Stock Level", width: 120, editable: true, type: "number" },
        { key: "reorder", name: "Reorder Point", width: 120, editable: true, type: "number" },
        { key: "price", name: "Unit Price", width: 120, editable: true, type: "currency" },
        { key: "supplier", name: "Supplier Info", width: 200, editable: true, type: "text" },
      ];
      return {
        title: "Inventory Manager",
        columns: [...templateCols, ...buildExtraColumns(templateCols.length)],
        rows: makeRows(DEFAULT_WORKING_ROW_COUNT, templateCols.map((c) => c.key), [], INVENTORY_DEFAULTS),
      };
    }
    case "d4e5f6a7-b8c9-0123-defa-234567890123": {
      const templateCols: ColumnDef[] = [
        { key: "campaign", name: "Campaign Name", width: 220, editable: true, type: "text" },
        { key: "channel", name: "Channel", width: 140, editable: true, type: "text" },
        { key: "startDate", name: "Start Date", width: 130, editable: true, type: "date" },
        { key: "endDate", name: "End Date", width: 130, editable: true, type: "date" },
        { key: "budget", name: "Budget", width: 120, editable: true, type: "currency" },
        { key: "spend", name: "Spend", width: 120, editable: true, type: "currency" },
        { key: "status", name: "Status", width: 130, editable: true, type: "status",
          statusOptions: [STATUS_COLORS["Planning"], STATUS_COLORS["In Progress"], STATUS_COLORS["Completed"], STATUS_COLORS["Paused"]] },
      ];
      return {
        title: "Marketing Calendar",
        columns: [...templateCols, ...buildExtraColumns(templateCols.length)],
        rows: makeRows(DEFAULT_WORKING_ROW_COUNT, templateCols.map((c) => c.key), [], MARKETING_DEFAULTS),
      };
    }
    case "e5f6a7b8-c9d0-1234-efab-345678901234": {
      const templateCols: ColumnDef[] = [
        { key: "title", name: "Meeting Title", width: 220, editable: true, type: "text" },
        { key: "date", name: "Date", width: 130, editable: true, type: "date" },
        { key: "attendees", name: "Attendees", width: 200, editable: true, type: "text" },
        { key: "agenda", name: "Agenda", width: 240, editable: true, type: "text" },
        { key: "decisions", name: "Key Decisions", width: 240, editable: true, type: "text" },
        { key: "actionItems", name: "Action Items", width: 240, editable: true, type: "text" },
        { key: "notes", name: "Notes", width: 240, editable: true, type: "text" },
      ];
      return {
        title: "Meeting Notes",
        columns: [...templateCols, ...buildExtraColumns(templateCols.length)],
        rows: makeRows(DEFAULT_WORKING_ROW_COUNT, templateCols.map((c) => c.key), [], MEETING_DEFAULTS),
      };
    }
    case "f6a7b8c9-d0e1-2345-fabc-456789012345": {
      const templateCols: ColumnDef[] = [
        { key: "story", name: "User Story / Task", width: 260, editable: true, type: "text" },
        { key: "assignee", name: "Assignee", width: 150, editable: true, type: "text" },
        { key: "status", name: "Status", width: 130, editable: true, type: "status",
          statusOptions: [STATUS_COLORS["Not Started"], STATUS_COLORS["In Progress"], STATUS_COLORS["In Review"], STATUS_COLORS["Done"], STATUS_COLORS["Blocked"]] },
        { key: "priority", name: "Priority", width: 120, editable: true, type: "priority",
          statusOptions: [STATUS_COLORS["High"], STATUS_COLORS["Medium"], STATUS_COLORS["Low"]] },
        { key: "points", name: "Story Points", width: 120, editable: true, type: "number" },
        { key: "sprint", name: "Sprint", width: 110, editable: true, type: "text" },
        { key: "notes", name: "Notes", width: 220, editable: true, type: "text" },
      ];
      return {
        title: "Sprint Planner",
        columns: [...templateCols, ...buildExtraColumns(templateCols.length)],
        rows: makeRows(DEFAULT_WORKING_ROW_COUNT, templateCols.map((c) => c.key), [], SPRINT_DEFAULTS),
      };
    }
    case "a7b8c9d0-e1f2-3456-abcd-567890123456": {
      const templateCols: ColumnDef[] = [
        { key: "date", name: "Expense Date", width: 130, editable: true, type: "date" },
        { key: "category", name: "Category", width: 150, editable: true, type: "text" },
        { key: "description", name: "Description", width: 240, editable: true, type: "text" },
        { key: "amount", name: "Amount", width: 130, editable: true, type: "currency" },
        { key: "receipt", name: "Receipt Link", width: 180, editable: true, type: "url" },
        { key: "status", name: "Status", width: 130, editable: true, type: "status",
          statusOptions: [STATUS_COLORS["Pending"], STATUS_COLORS["Approved"], STATUS_COLORS["Failed"]] },
        { key: "approvedBy", name: "Approved By", width: 150, editable: true, type: "text" },
      ];
      return {
        title: "Expense Report",
        columns: [...templateCols, ...buildExtraColumns(templateCols.length)],
        rows: makeRows(DEFAULT_WORKING_ROW_COUNT, templateCols.map((c) => c.key), [], EXPENSE_DEFAULTS),
      };
    }
    case "b8c9d0e1-f2a3-4567-bcde-678901234567": {
      const templateCols: ColumnDef[] = [
        { key: "title", name: "Content Title", width: 220, editable: true, type: "text" },
        { key: "format", name: "Format", width: 130, editable: true, type: "text" },
        { key: "status", name: "Status", width: 130, editable: true, type: "status",
          statusOptions: [STATUS_COLORS["Draft"], STATUS_COLORS["Writing"], STATUS_COLORS["Editing"], STATUS_COLORS["Scheduled"], STATUS_COLORS["Published"]] },
        { key: "owner", name: "Owner", width: 150, editable: true, type: "text" },
        { key: "dueDate", name: "Due Date", width: 130, editable: true, type: "date" },
        { key: "publishDate", name: "Publish Date", width: 130, editable: true, type: "date" },
        { key: "url", name: "URL", width: 180, editable: true, type: "url" },
      ];
      return {
        title: "Content Pipeline",
        columns: [...templateCols, ...buildExtraColumns(templateCols.length)],
        rows: makeRows(DEFAULT_WORKING_ROW_COUNT, templateCols.map((c) => c.key), [], CONTENT_DEFAULTS),
      };
    }
    case "c9d0e1f2-a3b4-5678-cdef-789012345678": {
      const templateCols: ColumnDef[] = [
        { key: "item", name: "Item / Task", width: 200, editable: true, type: "text" },
        { key: "category", name: "Category", width: 140, editable: true, type: "text" },
        { key: "vendor", name: "Vendor", width: 160, editable: true, type: "text" },
        { key: "estCost", name: "Estimated Cost", width: 130, editable: true, type: "currency" },
        { key: "actCost", name: "Actual Cost", width: 130, editable: true, type: "currency" },
        { key: "dueDate", name: "Due Date", width: 130, editable: true, type: "date" },
        { key: "status", name: "Paid Status", width: 130, editable: true, type: "status",
          statusOptions: [STATUS_COLORS["Unpaid"], STATUS_COLORS["Pending"], STATUS_COLORS["Paid"]] },
      ];
      return {
        title: "Event Planner",
        columns: [...templateCols, ...buildExtraColumns(templateCols.length)],
        rows: makeRows(DEFAULT_WORKING_ROW_COUNT, templateCols.map((c) => c.key), [], EVENT_DEFAULTS),
      };
    }
    case "d0e1f2a3-b4c5-6789-defa-890123456789": {
      const templateCols: ColumnDef[] = [
        { key: "name", name: "Student Name", width: 180, editable: true, type: "text" },
        { key: "assignment1", name: "Assignment 1", width: 110, editable: true, type: "number" },
        { key: "assignment2", name: "Assignment 2", width: 110, editable: true, type: "number" },
        { key: "exam1", name: "Exam 1", width: 110, editable: true, type: "number" },
        { key: "project", name: "Project", width: 110, editable: true, type: "number" },
        { key: "finalGrade", name: "Final Grade", width: 110, editable: true, type: "number" },
        { key: "attendance", name: "Attendance (%)", width: 130, editable: true, type: "progress" },
      ];
      return {
        title: "Student Gradebook",
        columns: [...templateCols, ...buildExtraColumns(templateCols.length)],
        rows: makeRows(DEFAULT_WORKING_ROW_COUNT, templateCols.map((c) => c.key), [], GRADEBOOK_DEFAULTS),
      };
    }
    case "f628aed8-bca7-4f51-b687-6db9f932be34":
    default: {
      const blankCols: ColumnDef[] = Array.from({ length: 12 }, (_, i) => ({
        key: `col${i}`,
        name: getColumnLetter(i),
        width: 130,
        editable: true,
        type: "text" as CellType,
      }));
      return {
        title: "Blank Sheet",
        columns: blankCols,
        rows: Array.from({ length: DEFAULT_WORKING_ROW_COUNT }, (_, i) => {
          const row: SheetRow = { id: String(i + 1) };
          blankCols.forEach((c) => { row[c.key] = ""; });
          return row;
        }),
      };
    }
  }
};

// ================= CALCULATIONS =================

export const recalculateFinance = (rows: SheetRow[]): SheetRow[] => {
  let balance = 0;
  return rows.map((row) => {
    const income = Number(row.income) || 0;
    const expense = Number(row.expense) || 0;
    if (income || expense || row.date) balance += income - expense;
    return { ...row, balance: income || expense || row.date ? balance : 0 };
  });
};