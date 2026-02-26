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
  | "checkbox"
  | "status"
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
}

export interface LockedCell {
  rowIdx: number;
  colKey: string;
}

// ================= STATUS =================

const STATUS_COLORS: Record<string, StatusOption> = {
  "In Progress": { label: "In Progress", color: "#b45309", bgColor: "#fef3c7" },
  Done: { label: "Done", color: "#166534", bgColor: "#dcfce7" },
  "Not Started": { label: "Not Started", color: "#6b7280", bgColor: "#f3f4f6" },
  Blocked: { label: "Blocked", color: "#dc2626", bgColor: "#fee2e2" },
  High: { label: "High", color: "#dc2626", bgColor: "#fee2e2" },
  Medium: { label: "Medium", color: "#b45309", bgColor: "#fef3c7" },
  Low: { label: "Low", color: "#166534", bgColor: "#dcfce7" },
};

export const getStatusStyle = (value: string): StatusOption | undefined => {
  return STATUS_COLORS[value];
};

// ================= TEMPLATES =================

export const getTemplateData = (
  templateId: string,
): { columns: ColumnDef[]; rows: SheetRow[]; title: string } => {
  switch (templateId) {
    // ================= QA TRACKER =================
    case "qa":
      return {
        title: "QA Tracker",
        columns: [
          { key: "id", name: "ID", width: 100, editable: true, type: "text" },
          {
            key: "title",
            name: "Title",
            width: 220,
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
            key: "status",
            name: "Status",
            width: 140,
            editable: true,
            type: "status",
          },
          {
            key: "priority",
            name: "Priority",
            width: 120,
            editable: true,
            type: "status",
          },
          {
            key: "assigned",
            name: "Assigned",
            width: 150,
            editable: true,
            type: "text",
          },
          {
            key: "date",
            name: "Date",
            width: 130,
            editable: true,
            type: "text",
          },
        ],
        rows: [
          {
            id: "1",
            title: "Login bug",
            module: "Auth",
            status: "In Progress",
            priority: "High",
            assigned: "Hassan",
            date: "2026-02-17",
          },
          ...Array.from({ length: 20 }, (_, i) => ({
            id: String(i + 2),
            title: "",
            module: "",
            status: "",
            priority: "",
            assigned: "",
            date: "",
          })),
        ],
      };

    // ================= PROJECT TRACKER =================
    case "project":
      return {
        title: "Project Tracker",
        columns: [
          {
            key: "task",
            name: "Task",
            width: 220,
            editable: true,
            type: "text",
          },
          {
            key: "owner",
            name: "Owner",
            width: 150,
            editable: true,
            type: "text",
          },
          {
            key: "start",
            name: "Start",
            width: 130,
            editable: true,
            type: "text",
          },
          { key: "end", name: "End", width: 130, editable: true, type: "text" },
          {
            key: "status",
            name: "Status",
            width: 140,
            editable: true,
            type: "status",
          },
          {
            key: "progress",
            name: "Progress",
            width: 120,
            editable: true,
            type: "number",
          },
          {
            key: "priority",
            name: "Priority",
            width: 120,
            editable: true,
            type: "status",
          },
        ],
        rows: [
          {
            id: "1",
            task: "Setup project",
            owner: "Hassan",
            start: "2026-02-01",
            end: "2026-02-05",
            status: "Done",
            progress: 100,
            priority: "High",
          },
          ...Array.from({ length: 20 }, (_, i) => ({
            id: String(i + 2),
            task: "",
            owner: "",
            start: "",
            end: "",
            status: "",
            progress: 0,
            priority: "",
          })),
        ],
      };

    // ================= FINANCE TRACKER =================
    case "finance":
      return {
        title: "Finance Tracker",
        columns: [
          {
            key: "date",
            name: "Date",
            width: 130,
            editable: true,
            type: "text",
          },
          {
            key: "category",
            name: "Category",
            width: 150,
            editable: true,
            type: "text",
          },
          {
            key: "desc",
            name: "Description",
            width: 220,
            editable: true,
            type: "text",
          },
          {
            key: "income",
            name: "Income",
            width: 130,
            editable: true,
            type: "currency",
          },
          {
            key: "expense",
            name: "Expense",
            width: 130,
            editable: true,
            type: "currency",
          },
          {
            key: "balance",
            name: "Balance",
            width: 130,
            editable: false,
            type: "currency",
          },
          {
            key: "status",
            name: "Status",
            width: 120,
            editable: true,
            type: "status",
          },
        ],
        rows: [
          {
            id: "1",
            date: "2026-02-01",
            category: "Salary",
            desc: "Monthly salary",
            income: 5000,
            expense: 0,
            balance: 5000,
            status: "Done",
          },
          ...Array.from({ length: 20 }, (_, i) => ({
            id: String(i + 2),
            date: "",
            category: "",
            desc: "",
            income: 0,
            expense: 0,
            balance: 0,
            status: "",
          })),
        ],
      };

    // ================= BLANK =================
    default:
      return {
        title: "Blank Sheet",
        columns: Array.from({ length: 12 }, (_, i) => ({
          key: `col${i}`,
          name: String.fromCharCode(65 + i),
          width: 130,
          editable: true,
          type: "text" as CellType,
        })),
        rows: Array.from({ length: 50 }, (_, i) => {
          const row: SheetRow = { id: String(i + 1) };
          for (let j = 0; j < 12; j++) {
            row[`col${j}`] = "";
          }
          return row;
        }),
      };
  }
};

// ================= CALCULATIONS =================

export const recalculateFinance = (rows: SheetRow[]): SheetRow[] => {
  let balance = 0;

  return rows.map((row) => {
    const income = Number(row.income) || 0;
    const expense = Number(row.expense) || 0;

    if (income || expense || row.date) {
      balance += income - expense;
    }

    return {
      ...row,
      balance: income || expense || row.date ? balance : 0,
    };
  });
};
