import {
  SheetRow,
  ColumnDef,
  SelectOption,
  STATUS_VALUES,
  PRIORITY_VALUES,
} from "@/types/index";
import { getStatusOptionStyle } from "@/lib/sheet-formatting-helpers";

// Central shared sheet helper utilities.
// This file contains helper functions used across the sheet editor,
// including column naming, formatting helpers, row buffering, and select option styling.
export function getSelectOptionLabel(option: string | SelectOption) {
  return typeof option === "object" ? option.label : option;
}

export function getOptionBgStyle(option: string | SelectOption) {
  if (typeof option === "object") {
    return {
      color: "#1f2937",
      backgroundColor: option.bgColor || "#ffffff",
    };
  }

  let hash = 0;
  for (let i = 0; i < option.length; i++) {
    hash = (hash * 31 + option.charCodeAt(i)) >>> 0;
  }
  return {
    color: "#1f2937",
    backgroundColor: OPTION_PALETTE[hash % OPTION_PALETTE.length],
  };
}

export function getChoiceOptionsForColumn(
  column: ColumnDef,
  cellOptions: SelectOption[] = [],
): SelectOption[] {
  if (column.type === "status") return [...STATUS_VALUES];
  if (column.type === "priority") return [...PRIORITY_VALUES];
  if (cellOptions.length > 0) return cellOptions;
  if (column.selectOptions?.length) return column.selectOptions;
  if (column.validation_rules?.type === "dropdown") {
    return ((column.validation_rules.options as string[] | undefined) ?? []);
  }
  return [];
}

export function getChoiceOptionStyle(
  type: ColumnDef["type"],
  option: string | SelectOption,
) {
  return type === "status" || type === "priority"
    ? getStatusOptionStyle(getSelectOptionLabel(option))
    : getOptionBgStyle(option);
}

export function columnIndexToName(index: number): string {
  let n = index + 1;
  let name = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    name = String.fromCharCode(65 + rem) + name;
    n = Math.floor((n - 1) / 26);
  }
  return name;
}

export function isGeneratedColumnName(name?: string): boolean {
  if (!name) return true;
  return /^Column\s+\d+$/i.test(name) || /^[A-Z]{1,3}$/.test(name);
}

export function normalizeGeneratedColumnNames(cols: ColumnDef[]): ColumnDef[] {
  return cols.map((col, index) =>
    isGeneratedColumnName(col.name)
      ? { ...col, name: columnIndexToName(index) }
      : col,
  );
}

export const OPTION_PALETTE = [
  "#e0f2fe",
  "#d1fae5",
  "#ffedd5",
  "#ede9fe",
  "#ffe4e6",
  "#cffafe",
  "#fef3c7",
  "#dcfce7",
  "#f3e8ff",
  "#e0e7ff",
];

export function getDefaultValueForType(type: ColumnDef["type"]) {
  if (type === "checkbox") return false;
  if (type === "priority") return "Low";
  if (type === "status") return "To Do";
  if (type === "date") return new Date().toISOString().split("T")[0];
  if (type === "number" || type === "currency" || type === "progress") return 0;
  return "";
}

export function buildEmptyRow(index: number, columns: ColumnDef[]): SheetRow {
  const row: SheetRow = { id: String(index + 1) };
  columns.forEach((c) => {
    row[c.key] = "";
  });
  return row;
}

export const WORKING_MIN_ROWS = 120;

export function ensureWorkingRowBuffer(
  inputRows: SheetRow[],
  columns: ColumnDef[],
): SheetRow[] {
  if (inputRows.length >= WORKING_MIN_ROWS) return inputRows;
  const out = [...inputRows];
  for (let i = inputRows.length; i < WORKING_MIN_ROWS; i++) {
    out.push(buildEmptyRow(i, columns));
  }
  return out;
}

export const ROW_CELL_TYPES_KEY = "__cellTypes";
export const ROW_CELL_SELECT_OPTIONS_KEY = "__cellSelectOptions";
