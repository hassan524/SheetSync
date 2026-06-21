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

/**
 * Format a date value to D/M/YYYY (e.g. "26/3/2026").
 * Accepts ISO strings ("2026-02-03"), Date objects, or any parseable date string.
 * Returns the original string if it can't be parsed as a valid date.
 */
export function formatSheetDate(value: any): string {
  if (value === null || value === undefined || value === "") return "";

  if (value instanceof Date) {
    if (isNaN(value.getTime())) return "";
    return `${value.getDate()}/${value.getMonth() + 1}/${value.getFullYear()}`;
  }

  try {
    const str = String(value).trim();
    // For ISO date strings like "2026-02-03", parse parts directly to avoid timezone issues
    const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
      const month = parseInt(isoMatch[2], 10);
      const day = parseInt(isoMatch[3], 10);
      const year = parseInt(isoMatch[1], 10);
      return `${day}/${month}/${year}`;
    }
    // If the value is already in D/M/YYYY or M/D/YYYY slash format, keep D/M/YYYY form.
    const slashMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (slashMatch) {
      const day = parseInt(slashMatch[1], 10);
      const month = parseInt(slashMatch[2], 10);
      const year = parseInt(slashMatch[3], 10);
      if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
        return `${day}/${month}/${year}`;
      }
    }
    const d = new Date(str);
    if (isNaN(d.getTime())) return str;
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  } catch {
    return String(value);
  }
}
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
  if (type === "priority") return "Medium";
  if (type === "status") return "Not Started";
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
  const maxPosition = inputRows.reduce((max, r) => Math.max(max, r.position ?? 0), 0);
  const size = Math.max(WORKING_MIN_ROWS, maxPosition + 1);

  const out: SheetRow[] = Array.from({ length: size });

  for (let i = 0; i < size; i++) {
    out[i] = buildEmptyRow(i, columns);
  }

  inputRows.forEach((row, index) => {
    const pos = row.position !== undefined ? row.position : index;
    if (pos >= 0 && pos < size) {
      out[pos] = {
        ...out[pos],
        ...row,
      };
    }
  });

  return out;
}

export const ROW_CELL_TYPES_KEY = "__cellTypes";
export const ROW_CELL_SELECT_OPTIONS_KEY = "__cellSelectOptions";
export const ROW_CELL_CURRENCY_CODES_KEY = "__cellCurrencyCodes";
