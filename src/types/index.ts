/**
 * ============================================================
 * SheetSync — Global Type Definitions
 * ============================================================
 *
 * This file contains ALL shared application types used across:
 * - database queries
 * - UI components
 * - server actions
 * - spreadsheet editor
 *
 * Rules:
 * - Each domain entity has ONE canonical type
 * - UI-specific properties are optional
 * - Avoid duplicating entity types across files
 *
 * ============================================================
 */


/* ============================================================
   Core Enums & Shared Types
============================================================ */

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

  /* ---------- Optional UI Fields ---------- */

  description?: string;

  plan?: string;

  activeNow?: number;

  storageUsed?: number;

  storageLimit?: number;

  weeklyStats?: {
    sheetsCreated: number;
    editsThisWeek: number;
    collaborations: number;
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

  /* ---------- UI Enhancements ---------- */

  visibility?: "team" | "private" | "public";

  lastModified?: string;

  lastModifiedBy?: string;

  collaborators?: number;

  activeEditors?: number;

  size?: string;
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


/* ============================================================
   Spreadsheet Options
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