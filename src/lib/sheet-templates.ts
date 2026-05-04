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

const today = () => new Date().toISOString().split("T")[0];

const addDays = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
};

// ================= EXTRA COLUMNS =================

const EXTRA_COL_COUNT = 8;

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
      base[key] = typeof def === "function" ? def() : (def ?? "");
    });

    if (seedData[i]) {
      Object.entries(seedData[i]).forEach(([k, v]) => {
        base[k] = v as any;
      });
    }

    return base;
  });

// ================= DEFAULT VALUES PER TEMPLATE =================

const PROJECT_DEFAULTS: Record<string, any> = {
  start: () => today(),
  due: () => addDays(7),
  status: "Not Started",
  priority: "Medium",
  progress: 0,
};

const FINANCE_DEFAULTS: Record<string, any> = {
  date: () => today(),
  status: "Pending",
  income: 0,
  expense: 0,
  balance: 0,
};

const QA_DEFAULTS: Record<string, any> = {
  date: () => today(),
  status: "Not Started",
  severity: "Medium",
};

// ================= TEMPLATES =================

export const getTemplateData = (
  templateId: string,
): { columns: ColumnDef[]; rows: SheetRow[]; title: string } => {
  switch (templateId) {
    // ─────────────────────────────────────────
    //  PROJECT TRACKER
    // ─────────────────────────────────────────
    case "c9fb4014-cccf-4394-9c3f-5eb16c00cc47": {
      const templateCols: ColumnDef[] = [
        { key: "task", name: "Task", width: 260, editable: true, type: "text" },
        {
          key: "owner",
          name: "Owner",
          width: 150,
          editable: true,
          type: "text",
        },
        {
          key: "start",
          name: "Start Date",
          width: 130,
          editable: true,
          type: "date",
        },
        {
          key: "due",
          name: "Due Date",
          width: 130,
          editable: true,
          type: "date",
        },
        {
          key: "status",
          name: "Status",
          width: 140,
          editable: true,
          type: "status",
          statusOptions: [
            STATUS_COLORS["Not Started"],
            STATUS_COLORS["In Progress"],
            STATUS_COLORS["Done"],
            STATUS_COLORS["Blocked"],
          ],
        },
        {
          key: "priority",
          name: "Priority",
          width: 120,
          editable: true,
          type: "priority",
          statusOptions: [
            STATUS_COLORS["High"],
            STATUS_COLORS["Medium"],
            STATUS_COLORS["Low"],
          ],
        },
        {
          key: "progress",
          name: "Progress (%)",
          width: 130,
          editable: true,
          type: "progress",
        },
        {
          key: "notes",
          name: "Notes",
          width: 240,
          editable: true,
          type: "text",
        },
      ];
      const allKeys = templateCols.map((c) => c.key);
      return {
        title: "Project Tracker",
        columns: [...templateCols, ...buildExtraColumns(templateCols.length)],
        rows: makeRows(50, allKeys, [], PROJECT_DEFAULTS),
      };
    }

    // ─────────────────────────────────────────
    //  FINANCE TRACKER
    // ─────────────────────────────────────────
    case "2a197048-b791-490e-aaff-9b00785b2b27": {
      const templateCols: ColumnDef[] = [
        { key: "date", name: "Date", width: 130, editable: true, type: "text" },
        {
          key: "category",
          name: "Category",
          width: 160,
          editable: true,
          type: "text",
        },
        {
          key: "desc",
          name: "Description",
          width: 240,
          editable: true,
          type: "text",
        },
        {
          key: "income",
          name: "Income",
          width: 140,
          editable: true,
          type: "currency",
        },
        {
          key: "expense",
          name: "Expense",
          width: 140,
          editable: true,
          type: "currency",
        },
        {
          key: "balance",
          name: "Balance",
          width: 140,
          editable: false,
          type: "currency",
        },
        {
          key: "status",
          name: "Status",
          width: 130,
          editable: true,
          type: "status",
        },
      ];
      const allKeys = templateCols.map((c) => c.key);
      return {
        title: "Finance Tracker",
        columns: [...templateCols, ...buildExtraColumns(templateCols.length)],
        rows: makeRows(50, allKeys, [], FINANCE_DEFAULTS),
      };
    }

    // ─────────────────────────────────────────
    //  QA TRACKER
    // ─────────────────────────────────────────
    case "e73711d5-aab0-4281-bc8f-486ad6c6aaac": {
      const templateCols: ColumnDef[] = [
        {
          key: "bugId",
          name: "Bug ID",
          width: 110,
          editable: true,
          type: "text",
        },
        {
          key: "title",
          name: "Title",
          width: 260,
          editable: true,
          type: "text",
        },
        {
          key: "module",
          name: "Module",
          width: 150,
          editable: true,
          type: "text",
        },
        {
          key: "severity",
          name: "Severity",
          width: 120,
          editable: true,
          type: "priority",
        },
        {
          key: "status",
          name: "Status",
          width: 130,
          editable: true,
          type: "status",
        },
        {
          key: "assigned",
          name: "Assigned To",
          width: 150,
          editable: true,
          type: "text",
        },
        {
          key: "reporter",
          name: "Reported By",
          width: 150,
          editable: true,
          type: "text",
        },
        {
          key: "date",
          name: "Date Found",
          width: 130,
          editable: true,
          type: "text",
        },
        {
          key: "notes",
          name: "Notes",
          width: 240,
          editable: true,
          type: "text",
        },
      ];
      const allKeys = templateCols.map((c) => c.key);
      return {
        title: "QA Tracker",
        columns: [...templateCols, ...buildExtraColumns(templateCols.length)],
        rows: makeRows(50, allKeys, [], QA_DEFAULTS),
      };
    }

    // ─────────────────────────────────────────
    //  BLANK SHEET
    // ─────────────────────────────────────────
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
        rows: Array.from({ length: 50 }, (_, i) => {
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
