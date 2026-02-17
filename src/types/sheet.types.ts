export interface SheetRow {
  id: string;
  [key: string]: any;
}

export interface ColumnDef {
  key: string;
  name: string;
  width?: number;
  editable?: boolean;
  resizable?: boolean;
  type?:
    | "text"
    | "number"
    | "currency"
    | "status"
    | "checkbox"
    | "url"
    | "date"
    | "priority";
}

export interface CellFormat {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  fontSize?: number;
  textColor?: string;
  bgColor?: string;
  align?: "left" | "center" | "right";
}

export interface HistoryEntry {
  timestamp: number;
  action:
    | "cell_edit"
    | "format"
    | "row_add"
    | "row_delete"
    | "col_add"
    | "col_delete"
    | "col_reorder";
  data: any;
}

export type SaveStatus = "saved" | "saving" | "error";

export interface PriorityOption {
  value: string;
  label: string;
  color: string;
  bgColor: string;
}

export const PRIORITY_OPTIONS: PriorityOption[] = [
  { value: "low", label: "Low", color: "#059669", bgColor: "#d1fae5" },
  { value: "medium", label: "Medium", color: "#d97706", bgColor: "#fef3c7" },
  { value: "high", label: "High", color: "#dc2626", bgColor: "#fee2e2" },
  { value: "urgent", label: "Urgent", color: "#7c2d12", bgColor: "#fecaca" },
];

export const STATUS_OPTIONS: PriorityOption[] = [
  { value: "todo", label: "To Do", color: "#6b7280", bgColor: "#f3f4f6" },
  {
    value: "in_progress",
    label: "In Progress",
    color: "#2563eb",
    bgColor: "#dbeafe",
  },
  { value: "done", label: "Done", color: "#059669", bgColor: "#d1fae5" },
  { value: "blocked", label: "Blocked", color: "#dc2626", bgColor: "#fee2e2" },
];
