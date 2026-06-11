/**
 * ============================================================
 * SheetSync — Global Type Definitions
 * ============================================================
 */

export type Role = "owner" | "admin" | "editor" | "viewer";

export type SaveStatus = "saved" | "saving" | "error";

/* ============================================================
   User / Profile
============================================================ */

export interface Profile {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
}

/* ============================================================
   Organization Members
============================================================ */

export interface Member {
  id: string;
  profiles: Profile;
  role?: Role;
  status?: "online" | "offline";
  lastActive?: string;
  avatar?: string;
  joined_at?: string;
  totalChanges?: number;
}

/* ============================================================
   Organization Activity
============================================================ */

export interface ActivityItem {
  user: string;
  action: string;
  target: string;
  time: string;
  avatar: string;
}

/* ============================================================
   Organization
============================================================ */

export interface Organization {
  id: string;
  name: string;
  role: Role;
  created_at: string;
  sheets: Sheet[];
  members: Member[];

  description?: string;
  plan?: string;
  activeNow?: number;
  storageUsed?: number;
  storageLimit?: number;

  weeklyStats?: {
    sheetsCreated: number;
    editsThisWeek: number;
    collaborations: number;
    membersJoined?: number;
  };

  recentActivity?: ActivityItem[];
}

/* ============================================================
   Sheet
============================================================ */

export interface Sheet {
  id: string;
  title: string;

  owner: {
    name: string;
    email: string;
    initials: string;
    avatar?: string;
  };

  folder_id: string | null;
  owner_id: string;
  organization_id: string | null;
  template_id: string;

  is_starred: boolean;
  is_personal: boolean;

  last_modified_by: string;
  created_at: string;
  updated_at: string;

  visibility?: "team" | "private" | "public";
  lastModified?: string;
  lastModifiedBy?: string;
  collaborators?: number;
  activeEditors?: number;
  rows?: number;
  columns?: number;
  size_mb?: number;

  forked_from_sheet_id?: string | null;
  forked_from_snapshot_label?: string | null;
  forked_at?: string | null;
  forked_by_user_id?: string | null;
}

/* ============================================================
   Folder
============================================================ */

export interface FolderWithSheets {
  id: string;
  name: string;
  owner_id: string;
  is_personal: boolean;
  organization_id: string | null;
  created_at: string;
  updated_at: string;
  sheets: Sheet[];
}

/* ============================================================
   Spreadsheet Editor Types
============================================================ */

export interface SheetRow {
  id: string;
  [key: string]: any;
}

export type SelectOption =
  | string
  | {
      label: string;
      bgColor: string;
    };

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
    | "priority"
    | "percent"
    | "progress"
    | "select"
    | "image"; // supports image URL rendering in-cell

  selectOptions?: SelectOption[]; // ADDED (dropdown values)
  currencyCode?: string; // used when type === "currency"
  frozen?: boolean; // Freeze column in place
  hidden?: boolean; // Hide column from view
  conditional_formatting?: any; // Conditional formatting rules
  group_id?: string; // Group ID for column grouping
  validation_rules?: any; // Validation rules for column
  position?: number; // Column order position
  isExtra?: boolean; // Indicates if this is an extra column (e.g. for row numbers)
}

export interface SavedFilterView {
  id: string;
  name: string;
  filterValue: string;
  advancedFilters: AdvancedFilterRule[];
  system?: boolean;
}

/* ============================================================
   Cell Formatting
============================================================ */

export interface CellFormat {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;

  fontSize?: number;
  fontFamily?: string;

  textColor?: string;
  bgColor?: string;

  align?: "left" | "center" | "right";
  textWrap?: boolean;
  borderStyle?: "none" | "solid" | "dashed" | "dotted";
  borderColor?: string;
  borderWidth?: number;
  borderBottom?: string;
  borderTop?: string;
  borderLeft?: string;
  borderRight?: string;
  merge?: {
    masterRow: number;
    masterCol: string;
    rowSpan: number;
    colSpan: number;
    hidden?: boolean;
    auto?: boolean;
    mode?: "all" | "across" | "down" | "center";
  };
  isLayoutRow?: boolean; // Special formatting for layout/header rows
}

export interface FloatingImage {
  id: string;
  src: string;
  name?: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export type ConditionalFormatOperator =
  | "not_empty"
  | "empty"
  | "contains"
  | "equals"
  | "not_equals"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "between";

export interface ConditionalFormatRule {
  id: string;
  range: string;
  startRow: number;
  endRow: number;
  startCol: number;
  endCol: number;
  operator: ConditionalFormatOperator;
  value: string;
  value2?: string;
  format: Pick<CellFormat, "bold" | "italic" | "textColor" | "bgColor">;
}

export type AutomationConditionOperator =
  | "always"
  | "equals"
  | "not_equals"
  | "contains"
  | "empty"
  | "not_empty"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "date_before_today"
  | "date_in_next_days";

export type AutomationActionType =
  | "notify"
  | "update_cell"
  | "archive_row"
  | "pin_row";

export interface AutomationRule {
  id: string;
  name: string;
  enabled: boolean;
  condition: {
    columnKey: string;
    operator: AutomationConditionOperator;
    value?: string;
  };
  actions: Array<{
    id: string;
    type: AutomationActionType;
    columnKey?: string;
    value?: string;
    message?: string;
  }>;
}

/* ============================================================
   History
============================================================ */

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

/* ============================================================
   Options
============================================================ */

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

/* ============================================================
   Templates
============================================================ */

export interface TemplateInterface {
  title: string;
  description: string;
  icon: React.ElementType;
  bgColor: string;
}

export interface SheetState {
  title: string;
  isOrgSheet: boolean;
  liveTracking: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  ownerId: string | null;
  organizationId: string | null;
  starred: boolean;
  rows: SheetRow[];
  columns: ColumnDef[];
  forkedFromSheetId?: string | null;
  forkedFromSnapshotLabel?: string | null;
  forkedAt?: string | null;
  forkedByUserId?: string | null;
  userRole?: Role;
  templateId?: string | null;
}

export type FilterOperator =
  | "contains"
  | "equals"
  | "not_equals"
  | "empty"
  | "not_empty"
  | "gt"
  | "gte"
  | "lt"
  | "lte";

export interface AdvancedFilterRule {
  id: string;
  columnKey: string;
  operator: FilterOperator;
  value: string;
}

export interface SelectSetupDialogState {
  open: boolean;
  colKey: string | null;
  row: number | null;
  mode: "insert" | "change" | "cell";
}

/* ============================================================
   Organization Table UI Model
============================================================ */

export interface OrganizationTableData {
  id: string;
  name: string;
  role: Role;
  members: number;
  activeNow: number;
  sheets: number;
  storageUsed: number;
  storageLimit: number;
  lastModified: string;
  createdAt: string;
}

export const STATUS_VALUES = [
  "Not Started",
  "In Progress",
  "In Review",
  "Done",
  "Blocked",
] as const;

export const PRIORITY_VALUES = [
  "Low",
  "Medium",
  "High",
  "Critical",
] as const;

