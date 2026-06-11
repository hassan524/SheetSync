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
  /**
   * When true, the cell renderer must skip ALL type-based rendering
   * (progress bars, status badges, date pickers, etc.) and treat the
   * cell as plain styled text. Set on every layout/header row cell so
   * column names never get parsed as data values (e.g. "Progress (%)"
   * → NaN%).
   */
  isLayoutRow?: boolean;
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
      name: "",
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

// ================= COLOR HELPERS =================

/**
 * Blend a hex color toward white at `ratio` (0 = original color, 1 = pure white).
 * Used to generate light tints from the accent color.
 */
const blendToWhite = (hex: string, ratio: number): string => {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const blend = (c: number) => Math.round(c + (255 - c) * ratio);
  return `#${[blend(r), blend(g), blend(b)]
    .map((v) => v.toString(16).padStart(2, "0"))
    .join("")}`;
};

/** Title row background: accent at ~10% opacity (very light tint) */
const accentLight = (hex: string) => blendToWhite(hex, 0.9);

/** Header row background: accent at ~6% opacity (even subtler tint) */
const accentSubtle = (hex: string) => blendToWhite(hex, 0.94);

// ================= LAYOUT CONFIG =================

type LayoutConfig = {
  disabled?: boolean;
  simple?: boolean;
  showTitleBanner: boolean;
  accent: string;
  fieldRows: never[];
  dataLabel: string;
};

export const LAYOUT_CONFIGS: Record<string, LayoutConfig> = {
  "c9fb4014-cccf-4394-9c3f-5eb16c00cc47": {
    simple: true,
    showTitleBanner: false,
    accent: "#1e3a5f",
    fieldRows: [],
    dataLabel: "TASKS",
  },
  "2a197048-b791-490e-aaff-9b00785b2b27": {
    simple: true,
    showTitleBanner: false,
    accent: "#0f766e",
    fieldRows: [],
    dataLabel: "TRANSACTIONS",
  },
  "e73711d5-aab0-4281-bc8f-486ad6c6aaac": {
    simple: true,
    showTitleBanner: false,
    accent: "#7f1d1d",
    fieldRows: [],
    dataLabel: "BUG LOG",
  },
  "a1b2c3d4-e5f6-7890-abcd-ef1234567890": {
    simple: true,
    showTitleBanner: false,
    accent: "#5b21b6",
    fieldRows: [],
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
    simple: true,
    showTitleBanner: false,
    accent: "#92400e",
    fieldRows: [],
    dataLabel: "INVENTORY",
  },
  "d4e5f6a7-b8c9-0123-defa-234567890123": {
    simple: true,
    showTitleBanner: false,
    accent: "#831843",
    fieldRows: [],
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
    simple: true,
    showTitleBanner: false,
    accent: "#78350f",
    fieldRows: [],
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
    simple: true,
    showTitleBanner: false,
    accent: "#b45309",
    fieldRows: [],
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

// ================= LAYOUT BUILDER =================

/**
 * Unified light layout for all templates:
 *   Row 0 — merged title banner (very light accent tint bg, accent-colored bold text)
 *   Row 1 — column headers (slightly deeper tint bg, accent-colored bold text)
 *   Row 2+ — data rows start immediately
 *
 * IMPORTANT: Every cell in rows 0 and 1 gets `isLayoutRow: true` so that the
 * cell renderer skips ALL type-based rendering (progress bars, status badges,
 * date pickers, currency formatting, etc.). Without this flag a progress column
 * header like "Progress (%)" gets parsed as a number → NaN%.
 */
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

  const colSpan = workingColumns.length;
  const cellFormats: Record<string, CellFormat> = {};

  // Clone only the first 2 layout rows; leave everything else untouched
  const nextRows: SheetRow[] = rows.map((row, i) => {
    if (i >= 2) return row;
    const cleared: SheetRow = { id: row.id };
    Object.keys(row).forEach((k) => {
      if (!workingColumns.find((c) => c.key === k)) cleared[k] = row[k];
    });
    workingColumns.forEach((col) => {
      cleared[col.key] = "";
    });
    return cleared;
  });

  // ── Row 0: merged title ───────────────────────────────────────────────
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
        ? {
          bold: true,
          fontSize: 15,
          textColor: accent,
          bgColor: accentLight(accent),
          align: "center",
          borderTop: "none",
          borderBottom: "none",
          borderLeft: "none",
          borderRight: "none",
          merge: mergeDescriptor,
          // ↓ CRITICAL: prevents any type-based renderer from running on this cell
          isLayoutRow: true,
        }
        : {
          bgColor: accentLight(accent),
          borderTop: "none",
          borderBottom: "none",
          borderLeft: "none",
          borderRight: "none",
          merge: { ...mergeDescriptor, hidden: true },
          isLayoutRow: true,
        };
  }

  // ── Row 1: column headers ─────────────────────────────────────────────
  // ── Row 1: column headers ─────────────────────────────────────────────
  workingColumns.forEach((col) => {
    cellFormats[`1-${col.key}`] = {
      bold: true,
      fontSize: 11,
      textColor: accent,
      bgColor: accentSubtle(accent),
      align: "center",
      borderTop: "none",
      borderBottom: "none",
      borderLeft: "none",
      borderRight: "none",
      isLayoutRow: true,
    };
    nextRows[1][col.key] = col.name;
  });

  // ── Row 0 + Row 1: apply accent bg to ALL columns including extra ─────
  const allColumns = columns; // includes isExtra cols
  const extraColumns = columns.filter((col) => col.isExtra);
  extraColumns.forEach((col) => {
    cellFormats[`0-${col.key}`] = { isLayoutRow: true };
    cellFormats[`1-${col.key}`] = { isLayoutRow: true };
    nextRows[0][col.key] = "";
    nextRows[1][col.key] = "";
  });

  // ── Row heights (keyed by actual row.id so they survive buffer passes) ─
  const rowHeights: Record<string, number> = {};
  if (nextRows[0]?.id) rowHeights[nextRows[0].id] = 44;
  if (nextRows[1]?.id) rowHeights[nextRows[1].id] = 32;

  return { rows: nextRows, cellFormats, rowHeights };
};

// ================= MAIN LAYOUT ENTRY POINT =================

/**
 * Single entry point called by the sheet. Routes every template through
 * buildSimpleTemplateLayout using the accent from LAYOUT_CONFIGS.
 * The old complex field-row builder has been removed.
 */
export const buildProfessionalTemplateLayout = (
  title: string,
  columns: ColumnDef[],
  rows: SheetRow[],
  templateId?: string,
): ProfessionalTemplateLayout => {
  const cfg =
    (templateId ? LAYOUT_CONFIGS[templateId] : undefined) ??
    DEFAULT_LAYOUT_CONFIG;

  if (cfg.disabled) {
    return { rows, cellFormats: {}, rowHeights: {} };
  }

  return buildSimpleTemplateLayout(title, columns, rows, cfg.accent);
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
        {
          key: "status", name: "Status", width: 140, editable: true, type: "status",
          statusOptions: [STATUS_COLORS["Not Started"], STATUS_COLORS["In Progress"], STATUS_COLORS["Done"], STATUS_COLORS["Blocked"]],
        },
        {
          key: "priority", name: "Priority", width: 120, editable: true, type: "priority",
          statusOptions: [STATUS_COLORS["High"], STATUS_COLORS["Medium"], STATUS_COLORS["Low"]],
        },
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
        { key: "date", name: "Date", width: 130, editable: true, type: "date" },
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
        {
          key: "severity", name: "Severity", width: 120, editable: true, type: "priority",
          statusOptions: [STATUS_COLORS["Critical"], STATUS_COLORS["High"], STATUS_COLORS["Medium"], STATUS_COLORS["Low"]],
        },
        { key: "reporter", name: "Reported By", width: 140, editable: true, type: "text" },
        { key: "assigned", name: "Assign To", width: 140, editable: true, type: "text" },
        {
          key: "status", name: "Status", width: 130, editable: true, type: "status",
          statusOptions: [STATUS_COLORS["Not Started"], STATUS_COLORS["In Progress"], STATUS_COLORS["In Review"], STATUS_COLORS["Done"], STATUS_COLORS["Blocked"]],
        },
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
        {
          key: "stage", name: "Stage", width: 140, editable: true, type: "status",
          statusOptions: [STATUS_COLORS["Lead"], STATUS_COLORS["Contacted"], STATUS_COLORS["Proposal"], STATUS_COLORS["Won"], STATUS_COLORS["Lost"]],
        },
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
        {
          key: "status", name: "Status", width: 130, editable: true, type: "status",
          statusOptions: [STATUS_COLORS["Active"], STATUS_COLORS["On Leave"], STATUS_COLORS["Terminated"]],
        },
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
        {
          key: "status", name: "Status", width: 130, editable: true, type: "status",
          statusOptions: [STATUS_COLORS["Planning"], STATUS_COLORS["In Progress"], STATUS_COLORS["Completed"], STATUS_COLORS["Paused"]],
        },
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
        {
          key: "status", name: "Status", width: 130, editable: true, type: "status",
          statusOptions: [STATUS_COLORS["Not Started"], STATUS_COLORS["In Progress"], STATUS_COLORS["In Review"], STATUS_COLORS["Done"], STATUS_COLORS["Blocked"]],
        },
        {
          key: "priority", name: "Priority", width: 120, editable: true, type: "priority",
          statusOptions: [STATUS_COLORS["High"], STATUS_COLORS["Medium"], STATUS_COLORS["Low"]],
        },
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
        {
          key: "status", name: "Status", width: 130, editable: true, type: "status",
          statusOptions: [STATUS_COLORS["Pending"], STATUS_COLORS["Approved"], STATUS_COLORS["Failed"]],
        },
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
        {
          key: "status", name: "Status", width: 130, editable: true, type: "status",
          statusOptions: [STATUS_COLORS["Draft"], STATUS_COLORS["Writing"], STATUS_COLORS["Editing"], STATUS_COLORS["Scheduled"], STATUS_COLORS["Published"]],
        },
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
        {
          key: "status", name: "Paid Status", width: 130, editable: true, type: "status",
          statusOptions: [STATUS_COLORS["Unpaid"], STATUS_COLORS["Pending"], STATUS_COLORS["Paid"]],
        },
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
          blankCols.forEach((c) => {
            row[c.key] = "";
          });
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