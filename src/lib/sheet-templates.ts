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

const QA_DEFAULTS: Record<string, any> = {
  status: "Not Started",
  severity: "Medium",
};

const CRM_DEFAULTS: Record<string, any> = {
  stage: "Lead",
  value: 0,
};

const EMPLOYEE_DEFAULTS: Record<string, any> = {
  status: "Active",
  startDate: (i: number) => addDays(i),
};

const INVENTORY_DEFAULTS: Record<string, any> = {
  stock: 0,
  reorder: 10,
  price: 0,
};

const MARKETING_DEFAULTS: Record<string, any> = {
  status: "Planning",
  startDate: (i: number) => addDays(i),
  endDate: (i: number) => addDays(i + 14),
  budget: 0,
  spend: 0,
};

const MEETING_DEFAULTS: Record<string, any> = {
  date: (i: number) => addDays(i),
};

const SPRINT_DEFAULTS: Record<string, any> = {
  status: "Todo",
  priority: "Medium",
  points: 0,
};

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
        rows: makeRows(
          DEFAULT_WORKING_ROW_COUNT,
          allKeys,
          [],
          PROJECT_DEFAULTS,
        ),
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
        rows: makeRows(
          DEFAULT_WORKING_ROW_COUNT,
          allKeys,
          [],
          FINANCE_DEFAULTS,
        ),
      };
    }

    // ─────────────────────────────────────────
    //  QA TRACKER
    // ─────────────────────────────────────────
    case "e73711d5-aab0-4281-bc8f-486ad6c6aaac": {
      const templateCols: ColumnDef[] = [
        {
          key: "bugId",
          name: "BUG ID",
          width: 100,
          editable: true,
          type: "text",
        },
        {
          key: "title",
          name: "TITLE",
          width: 200,
          editable: true,
          type: "text",
        },
        {
          key: "description",
          name: "DESCRIPTION",
          width: 250,
          editable: true,
          type: "text",
        },
        {
          key: "environment",
          name: "ENVIRONMENT",
          width: 140,
          editable: true,
          type: "text",
        },
        {
          key: "steps",
          name: "STEP TO PRODUCE",
          width: 280,
          editable: true,
          type: "text",
        },
        {
          key: "screenshot",
          name: "SCREENSHOT",
          width: 160,
          editable: true,
          type: "text",
        },
        {
          key: "severity",
          name: "SEVERITY",
          width: 120,
          editable: true,
          type: "priority",
          statusOptions: [
            STATUS_COLORS["Critical"],
            STATUS_COLORS["High"],
            STATUS_COLORS["Medium"],
            STATUS_COLORS["Low"],
          ],
        },
        {
          key: "reporter",
          name: "REPORTED BY",
          width: 140,
          editable: true,
          type: "text",
        },
        {
          key: "assigned",
          name: "ASSIGN TO",
          width: 140,
          editable: true,
          type: "text",
        },
        {
          key: "status",
          name: "STATUS",
          width: 130,
          editable: true,
          type: "status",
          statusOptions: [
            STATUS_COLORS["Not Started"],
            STATUS_COLORS["In Progress"],
            STATUS_COLORS["In Review"],
            STATUS_COLORS["Done"],
            STATUS_COLORS["Blocked"],
          ],
        },
      ];
      const allKeys = templateCols.map((c) => c.key);
      return {
        title: "QA Tracker",
        columns: [...templateCols, ...buildExtraColumns(templateCols.length)],
        rows: makeRows(DEFAULT_WORKING_ROW_COUNT, allKeys, [], QA_DEFAULTS),
      };
    }

    // ─────────────────────────────────────────
    //  CLIENT CRM
    // ─────────────────────────────────────────
    case "a1b2c3d4-e5f6-7890-abcd-ef1234567890": {
      const templateCols: ColumnDef[] = [
        { key: "contact", name: "Contact Name", width: 180, editable: true, type: "text" },
        { key: "company", name: "Company", width: 160, editable: true, type: "text" },
        {
          key: "stage",
          name: "Stage",
          width: 140,
          editable: true,
          type: "status",
          statusOptions: [
            STATUS_COLORS["Lead"],
            STATUS_COLORS["Contacted"],
            STATUS_COLORS["Proposal"],
            STATUS_COLORS["Won"],
            STATUS_COLORS["Lost"],
          ],
        },
        { key: "value", name: "Lead Value", width: 130, editable: true, type: "currency" },
        { key: "email", name: "Email", width: 200, editable: true, type: "url" },
        { key: "phone", name: "Phone", width: 140, editable: true, type: "text" },
        { key: "notes", name: "Notes", width: 240, editable: true, type: "text" },
      ];
      const allKeys = templateCols.map((c) => c.key);
      return {
        title: "Client CRM",
        columns: [...templateCols, ...buildExtraColumns(templateCols.length)],
        rows: makeRows(DEFAULT_WORKING_ROW_COUNT, allKeys, [], CRM_DEFAULTS),
      };
    }

    // ─────────────────────────────────────────
    //  EMPLOYEE DIRECTORY
    // ─────────────────────────────────────────
    case "b2c3d4e5-f6a7-8901-bcde-f12345678901": {
      const templateCols: ColumnDef[] = [
        { key: "name", name: "Name", width: 180, editable: true, type: "text" },
        { key: "dept", name: "Department", width: 150, editable: true, type: "text" },
        { key: "role", name: "Role", width: 150, editable: true, type: "text" },
        { key: "email", name: "Email", width: 200, editable: true, type: "url" },
        { key: "phone", name: "Phone", width: 140, editable: true, type: "text" },
        { key: "startDate", name: "Start Date", width: 130, editable: true, type: "date" },
        {
          key: "status",
          name: "Status",
          width: 130,
          editable: true,
          type: "status",
          statusOptions: [
            STATUS_COLORS["Active"],
            STATUS_COLORS["On Leave"],
            STATUS_COLORS["Terminated"],
          ],
        },
      ];
      const allKeys = templateCols.map((c) => c.key);
      return {
        title: "Employee Directory",
        columns: [...templateCols, ...buildExtraColumns(templateCols.length)],
        rows: makeRows(DEFAULT_WORKING_ROW_COUNT, allKeys, [], EMPLOYEE_DEFAULTS),
      };
    }

    // ─────────────────────────────────────────
    //  INVENTORY MANAGER
    // ─────────────────────────────────────────
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
      const allKeys = templateCols.map((c) => c.key);
      return {
        title: "Inventory Manager",
        columns: [...templateCols, ...buildExtraColumns(templateCols.length)],
        rows: makeRows(DEFAULT_WORKING_ROW_COUNT, allKeys, [], INVENTORY_DEFAULTS),
      };
    }

    // ─────────────────────────────────────────
    //  MARKETING CALENDAR
    // ─────────────────────────────────────────
    case "d4e5f6a7-b8c9-0123-defa-234567890123": {
      const templateCols: ColumnDef[] = [
        { key: "campaign", name: "Campaign Name", width: 220, editable: true, type: "text" },
        { key: "channel", name: "Channel", width: 140, editable: true, type: "text" },
        { key: "startDate", name: "Start Date", width: 130, editable: true, type: "date" },
        { key: "endDate", name: "End Date", width: 130, editable: true, type: "date" },
        { key: "budget", name: "Budget", width: 120, editable: true, type: "currency" },
        { key: "spend", name: "Spend", width: 120, editable: true, type: "currency" },
        {
          key: "status",
          name: "Status",
          width: 130,
          editable: true,
          type: "status",
          statusOptions: [
            STATUS_COLORS["Planning"],
            STATUS_COLORS["In Progress"],
            STATUS_COLORS["Completed"],
            STATUS_COLORS["Paused"],
          ],
        },
      ];
      const allKeys = templateCols.map((c) => c.key);
      return {
        title: "Marketing Calendar",
        columns: [...templateCols, ...buildExtraColumns(templateCols.length)],
        rows: makeRows(DEFAULT_WORKING_ROW_COUNT, allKeys, [], MARKETING_DEFAULTS),
      };
    }

    // ─────────────────────────────────────────
    //  MEETING NOTES
    // ─────────────────────────────────────────
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
      const allKeys = templateCols.map((c) => c.key);
      return {
        title: "Meeting Notes",
        columns: [...templateCols, ...buildExtraColumns(templateCols.length)],
        rows: makeRows(DEFAULT_WORKING_ROW_COUNT, allKeys, [], MEETING_DEFAULTS),
      };
    }

    // ─────────────────────────────────────────
    //  SPRINT PLANNER
    // ─────────────────────────────────────────
    case "f6a7b8c9-d0e1-2345-fabc-456789012345": {
      const templateCols: ColumnDef[] = [
        { key: "story", name: "User Story / Task", width: 260, editable: true, type: "text" },
        { key: "assignee", name: "Assignee", width: 150, editable: true, type: "text" },
        {
          key: "status",
          name: "Status",
          width: 130,
          editable: true,
          type: "status",
          statusOptions: [
            STATUS_COLORS["Not Started"],
            STATUS_COLORS["In Progress"],
            STATUS_COLORS["In Review"],
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
        { key: "points", name: "Story Points", width: 120, editable: true, type: "number" },
        { key: "sprint", name: "Sprint", width: 110, editable: true, type: "text" },
        { key: "notes", name: "Notes", width: 220, editable: true, type: "text" },
      ];
      const allKeys = templateCols.map((c) => c.key);
      return {
        title: "Sprint Planner",
        columns: [...templateCols, ...buildExtraColumns(templateCols.length)],
        rows: makeRows(DEFAULT_WORKING_ROW_COUNT, allKeys, [], SPRINT_DEFAULTS),
      };
    }

    // ─────────────────────────────────────────
    //  EXPENSE REPORT
    // ─────────────────────────────────────────
    case "a7b8c9d0-e1f2-3456-abcd-567890123456": {
      const templateCols: ColumnDef[] = [
        { key: "date", name: "Expense Date", width: 130, editable: true, type: "date" },
        { key: "category", name: "Category", width: 150, editable: true, type: "text" },
        { key: "description", name: "Description", width: 240, editable: true, type: "text" },
        { key: "amount", name: "Amount", width: 130, editable: true, type: "currency" },
        { key: "receipt", name: "Receipt Link", width: 180, editable: true, type: "url" },
        {
          key: "status",
          name: "Status",
          width: 130,
          editable: true,
          type: "status",
          statusOptions: [
            STATUS_COLORS["Pending"],
            STATUS_COLORS["Approved"],
            STATUS_COLORS["Failed"],
          ],
        },
        { key: "approvedBy", name: "Approved By", width: 150, editable: true, type: "text" },
      ];
      const allKeys = templateCols.map((c) => c.key);
      return {
        title: "Expense Report",
        columns: [...templateCols, ...buildExtraColumns(templateCols.length)],
        rows: makeRows(DEFAULT_WORKING_ROW_COUNT, allKeys, [], EXPENSE_DEFAULTS),
      };
    }

    // ─────────────────────────────────────────
    //  CONTENT PIPELINE
    // ─────────────────────────────────────────
    case "b8c9d0e1-f2a3-4567-bcde-678901234567": {
      const templateCols: ColumnDef[] = [
        { key: "title", name: "Content Title", width: 220, editable: true, type: "text" },
        { key: "format", name: "Format", width: 130, editable: true, type: "text" },
        {
          key: "status",
          name: "Status",
          width: 130,
          editable: true,
          type: "status",
          statusOptions: [
            STATUS_COLORS["Draft"],
            STATUS_COLORS["Writing"],
            STATUS_COLORS["Editing"],
            STATUS_COLORS["Scheduled"],
            STATUS_COLORS["Published"],
          ],
        },
        { key: "owner", name: "Owner", width: 150, editable: true, type: "text" },
        { key: "dueDate", name: "Due Date", width: 130, editable: true, type: "date" },
        { key: "publishDate", name: "Publish Date", width: 130, editable: true, type: "date" },
        { key: "url", name: "URL", width: 180, editable: true, type: "url" },
      ];
      const allKeys = templateCols.map((c) => c.key);
      return {
        title: "Content Pipeline",
        columns: [...templateCols, ...buildExtraColumns(templateCols.length)],
        rows: makeRows(DEFAULT_WORKING_ROW_COUNT, allKeys, [], CONTENT_DEFAULTS),
      };
    }

    // ─────────────────────────────────────────
    //  EVENT PLANNER
    // ─────────────────────────────────────────
    case "c9d0e1f2-a3b4-5678-cdef-789012345678": {
      const templateCols: ColumnDef[] = [
        { key: "item", name: "Item / Task", width: 200, editable: true, type: "text" },
        { key: "category", name: "Category", width: 140, editable: true, type: "text" },
        { key: "vendor", name: "Vendor", width: 160, editable: true, type: "text" },
        { key: "estCost", name: "Estimated Cost", width: 130, editable: true, type: "currency" },
        { key: "actCost", name: "Actual Cost", width: 130, editable: true, type: "currency" },
        { key: "dueDate", name: "Due Date", width: 130, editable: true, type: "date" },
        {
          key: "status",
          name: "Paid Status",
          width: 130,
          editable: true,
          type: "status",
          statusOptions: [
            STATUS_COLORS["Unpaid"],
            STATUS_COLORS["Pending"],
            STATUS_COLORS["Paid"],
          ],
        },
      ];
      const allKeys = templateCols.map((c) => c.key);
      return {
        title: "Event Planner",
        columns: [...templateCols, ...buildExtraColumns(templateCols.length)],
        rows: makeRows(DEFAULT_WORKING_ROW_COUNT, allKeys, [], EVENT_DEFAULTS),
      };
    }

    // ─────────────────────────────────────────
    //  STUDENT GRADEBOOK
    // ─────────────────────────────────────────
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
      const allKeys = templateCols.map((c) => c.key);
      return {
        title: "Student Gradebook",
        columns: [...templateCols, ...buildExtraColumns(templateCols.length)],
        rows: makeRows(DEFAULT_WORKING_ROW_COUNT, allKeys, [], GRADEBOOK_DEFAULTS),
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

