import { SheetRow, ColumnDef } from "@/types/index";

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
  userRole?: "owner" | "editor" | "viewer";
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

export type AdvancedFilterRule = {
  id: string;
  columnKey: string;
  operator: FilterOperator;
  value: string;
};

export type SelectSetupDialogState = {
  open: boolean;
  colKey: string | null;
  row: number | null;
  mode: "insert" | "change" | "cell";
};