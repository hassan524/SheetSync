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

const STATUS_COLORS: Record<string, StatusOption> = {
  "In Process": { label: "In Process", color: "#b45309", bgColor: "#fef3c7" },
  "In Progress": { label: "In Progress", color: "#b45309", bgColor: "#fef3c7" },
  Complete: { label: "Complete", color: "#166534", bgColor: "#dcfce7" },
  Done: { label: "Done", color: "#166534", bgColor: "#dcfce7" },
  "Need to Start": {
    label: "Need to Start",
    color: "#1e40af",
    bgColor: "#dbeafe",
  },
  "Not Started": { label: "Not Started", color: "#6b7280", bgColor: "#f3f4f6" },
  Blocked: { label: "Blocked", color: "#dc2626", bgColor: "#fee2e2" },
  Active: { label: "Active", color: "#166534", bgColor: "#dcfce7" },
  "In Stock": { label: "In Stock", color: "#166534", bgColor: "#dcfce7" },
  "Low Stock": { label: "Low Stock", color: "#b45309", bgColor: "#fef3c7" },
  "Out of Stock": {
    label: "Out of Stock",
    color: "#dc2626",
    bgColor: "#fee2e2",
  },
  High: { label: "High", color: "#dc2626", bgColor: "#fee2e2" },
  Medium: { label: "Medium", color: "#b45309", bgColor: "#fef3c7" },
  Low: { label: "Low", color: "#166534", bgColor: "#dcfce7" },
};

export const getStatusStyle = (value: string): StatusOption | undefined => {
  return STATUS_COLORS[value];
};

export const getTemplateData = (
  templateId: string,
): { columns: ColumnDef[]; rows: SheetRow[]; title: string } => {
  switch (templateId) {
    case "budget":
      return {
        title: "Budget Tracker",
        columns: [
          {
            key: "date",
            name: "Date",
            width: 130,
            editable: true,
            resizable: true,
            type: "text",
          },
          {
            key: "category",
            name: "Category",
            width: 150,
            editable: true,
            resizable: true,
            type: "text",
          },
          {
            key: "description",
            name: "Description",
            width: 220,
            editable: true,
            resizable: true,
            type: "text",
          },
          {
            key: "income",
            name: "Income",
            width: 130,
            editable: true,
            resizable: true,
            type: "currency",
          },
          {
            key: "expense",
            name: "Expense",
            width: 130,
            editable: true,
            resizable: true,
            type: "currency",
          },
          {
            key: "balance",
            name: "Balance",
            width: 130,
            editable: false,
            resizable: true,
            type: "currency",
          },
          {
            key: "approved",
            name: "Approved",
            width: 100,
            editable: true,
            resizable: true,
            type: "checkbox",
          },
          {
            key: "priority",
            name: "Priority",
            width: 120,
            editable: true,
            resizable: true,
            type: "status",
          },
        ],
        rows: [
          {
            id: "1",
            date: "2025-01-01",
            category: "Salary",
            description: "Monthly salary",
            income: 5000,
            expense: 0,
            balance: 5000,
            approved: true,
            priority: "High",
          },
          {
            id: "2",
            date: "2025-01-03",
            category: "Rent",
            description: "Office rent",
            income: 0,
            expense: 1500,
            balance: 3500,
            approved: true,
            priority: "High",
          },
          {
            id: "3",
            date: "2025-01-05",
            category: "Utilities",
            description: "Electricity bill",
            income: 0,
            expense: 200,
            balance: 3300,
            approved: true,
            priority: "Medium",
          },
          {
            id: "4",
            date: "2025-01-10",
            category: "Freelance",
            description: "Web design project",
            income: 1200,
            expense: 0,
            balance: 4500,
            approved: false,
            priority: "Medium",
          },
          {
            id: "5",
            date: "2025-01-15",
            category: "Software",
            description: "SaaS subscriptions",
            income: 0,
            expense: 350,
            balance: 4150,
            approved: true,
            priority: "Low",
          },
          {
            id: "6",
            date: "2025-01-20",
            category: "Marketing",
            description: "Ad campaign",
            income: 0,
            expense: 800,
            balance: 3350,
            approved: false,
            priority: "High",
          },
          {
            id: "7",
            date: "2025-01-25",
            category: "Consulting",
            description: "Strategy session",
            income: 2000,
            expense: 0,
            balance: 5350,
            approved: true,
            priority: "Medium",
          },
          ...Array.from({ length: 18 }, (_, i) => ({
            id: String(i + 8),
            date: "",
            category: "",
            description: "",
            income: 0,
            expense: 0,
            balance: 0,
            approved: false,
            priority: "",
          })),
        ],
      };
    case "timeline":
      return {
        title: "Project Timeline",
        columns: [
          {
            key: "task",
            name: "Task",
            width: 220,
            editable: true,
            resizable: true,
            type: "text",
          },
          {
            key: "owner",
            name: "Owner",
            width: 150,
            editable: true,
            resizable: true,
            type: "text",
          },
          {
            key: "startDate",
            name: "Start Date",
            width: 130,
            editable: true,
            resizable: true,
            type: "text",
          },
          {
            key: "endDate",
            name: "End Date",
            width: 130,
            editable: true,
            resizable: true,
            type: "text",
          },
          {
            key: "status",
            name: "Status",
            width: 140,
            editable: true,
            resizable: true,
            type: "status",
          },
          {
            key: "progress",
            name: "Progress %",
            width: 120,
            editable: true,
            resizable: true,
            type: "number",
          },
          {
            key: "critical",
            name: "Critical",
            width: 100,
            editable: true,
            resizable: true,
            type: "checkbox",
          },
          {
            key: "priority",
            name: "Priority",
            width: 120,
            editable: true,
            resizable: true,
            type: "status",
          },
        ],
        rows: [
          {
            id: "1",
            task: "Requirements Gathering",
            owner: "Alice Thompson",
            startDate: "2025-01-01",
            endDate: "2025-01-15",
            status: "Done",
            progress: 100,
            critical: true,
            priority: "High",
          },
          {
            id: "2",
            task: "UI/UX Design",
            owner: "Bob Williams",
            startDate: "2025-01-10",
            endDate: "2025-02-01",
            status: "In Progress",
            progress: 75,
            critical: false,
            priority: "Medium",
          },
          {
            id: "3",
            task: "Backend Development",
            owner: "Charlie Davis",
            startDate: "2025-01-20",
            endDate: "2025-03-01",
            status: "In Progress",
            progress: 40,
            critical: true,
            priority: "High",
          },
          {
            id: "4",
            task: "Frontend Development",
            owner: "Diana Rodriguez",
            startDate: "2025-02-01",
            endDate: "2025-03-15",
            status: "Need to Start",
            progress: 0,
            critical: false,
            priority: "Medium",
          },
          {
            id: "5",
            task: "Testing & QA",
            owner: "Eve Martinez",
            startDate: "2025-03-01",
            endDate: "2025-03-20",
            status: "Not Started",
            progress: 0,
            critical: true,
            priority: "High",
          },
          {
            id: "6",
            task: "Deployment Setup",
            owner: "Frank Anderson",
            startDate: "2025-03-15",
            endDate: "2025-03-25",
            status: "Blocked",
            progress: 0,
            critical: false,
            priority: "Low",
          },
          ...Array.from({ length: 19 }, (_, i) => ({
            id: String(i + 7),
            task: "",
            owner: "",
            startDate: "",
            endDate: "",
            status: "",
            progress: 0,
            critical: false,
            priority: "",
          })),
        ],
      };
    case "inventory":
      return {
        title: "Inventory Tracker",
        columns: [
          {
            key: "productName",
            name: "Product Name",
            width: 220,
            editable: true,
            resizable: true,
            type: "text",
          },
          {
            key: "sku",
            name: "SKU",
            width: 120,
            editable: true,
            resizable: true,
            type: "text",
          },
          {
            key: "category",
            name: "Category",
            width: 150,
            editable: true,
            resizable: true,
            type: "text",
          },
          {
            key: "quantity",
            name: "Quantity",
            width: 110,
            editable: true,
            resizable: true,
            type: "number",
          },
          {
            key: "unitPrice",
            name: "Unit Price",
            width: 130,
            editable: true,
            resizable: true,
            type: "currency",
          },
          {
            key: "totalValue",
            name: "Total Value",
            width: 140,
            editable: false,
            resizable: true,
            type: "currency",
          },
          {
            key: "stockStatus",
            name: "Stock Status",
            width: 140,
            editable: true,
            resizable: true,
            type: "status",
          },
          {
            key: "reorder",
            name: "Reorder",
            width: 100,
            editable: true,
            resizable: true,
            type: "checkbox",
          },
        ],
        rows: [
          {
            id: "1",
            productName: "Wireless Mouse",
            sku: "WM-001",
            category: "Electronics",
            quantity: 150,
            unitPrice: 29.99,
            totalValue: 4498.5,
            stockStatus: "In Stock",
            reorder: false,
          },
          {
            id: "2",
            productName: "USB-C Cable",
            sku: "UC-002",
            category: "Accessories",
            quantity: 500,
            unitPrice: 9.99,
            totalValue: 4995,
            stockStatus: "In Stock",
            reorder: false,
          },
          {
            id: "3",
            productName: "Monitor Stand",
            sku: "MS-003",
            category: "Furniture",
            quantity: 25,
            unitPrice: 89.99,
            totalValue: 2249.75,
            stockStatus: "Low Stock",
            reorder: true,
          },
          {
            id: "4",
            productName: "Mechanical Keyboard",
            sku: "MK-004",
            category: "Electronics",
            quantity: 0,
            unitPrice: 59.99,
            totalValue: 0,
            stockStatus: "Out of Stock",
            reorder: true,
          },
          {
            id: "5",
            productName: "Webcam HD Pro",
            sku: "WC-005",
            category: "Electronics",
            quantity: 75,
            unitPrice: 49.99,
            totalValue: 3749.25,
            stockStatus: "In Stock",
            reorder: false,
          },
          {
            id: "6",
            productName: "Noise Cancelling Headset",
            sku: "NH-006",
            category: "Audio",
            quantity: 12,
            unitPrice: 129.99,
            totalValue: 1559.88,
            stockStatus: "Low Stock",
            reorder: true,
          },
          ...Array.from({ length: 19 }, (_, i) => ({
            id: String(i + 7),
            productName: "",
            sku: "",
            category: "",
            quantity: 0,
            unitPrice: 0,
            totalValue: 0,
            stockStatus: "",
            reorder: false,
          })),
        ],
      };
    default: // blank
      return {
        title: "Untitled Sheet",
        columns: Array.from({ length: 12 }, (_, i) => ({
          key: `col${i}`,
          name: String.fromCharCode(65 + i),
          width: 130,
          editable: true,
          resizable: true,
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

export const recalculateBudget = (rows: SheetRow[]): SheetRow[] => {
  let runningBalance = 0;
  return rows.map((row) => {
    const income = Number(row.income) || 0;
    const expense = Number(row.expense) || 0;
    if (income || expense || row.date) {
      runningBalance += income - expense;
    }
    return {
      ...row,
      balance: income || expense || row.date ? runningBalance : 0,
    };
  });
};

export const recalculateInventory = (rows: SheetRow[]): SheetRow[] => {
  return rows.map((row) => {
    const qty = Number(row.quantity) || 0;
    const price = Number(row.unitPrice) || 0;
    return { ...row, totalValue: qty * price };
  });
};
