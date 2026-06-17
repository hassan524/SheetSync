"use client";
import React from "react";
import {
  useState, useCallback, useMemo, useRef, useEffect, startTransition,
} from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import DataGrid, { Column, RenderCellProps, RenderEditCellProps } from "react-data-grid";
// @ts-ignore
import "react-data-grid/lib/styles.css";
import { Button } from "@/components/ui/button";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Check, Loader2, GripVertical, WrapText, Lock, MessageSquare, X } from "lucide-react";
import { toast } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

// ── Toolbar components ─────────────────────────────────────────────────────
import { TitleBar } from "./toolbars/TitleBar";
import { FormattingBar } from "./toolbars/FormattingBar";
import { FormulaBar } from "./toolbars/FormulaBar";
import { ActionBar } from "./toolbars/ActionBar";
import { FilterBar } from "./toolbars/FilterBar";
import { StatusBar } from "./toolbars/StatusBar";

// ── Cell / grid ────────────────────────────────────────────────────────────
import { CellRenderer } from "./CellRenderer";

// ── Hooks ──────────────────────────────────────────────────────────────────
import { useSheetStateVars } from "@/hooks/sheets/use-sheet-state-vars";
import { useSheetPersistence } from "@/hooks/sheets/use-sheet-persistence";
import { useSheetRowOps } from "@/hooks/sheets/use-sheet-row-ops";
import { useSheetColOps } from "@/hooks/sheets/use-sheet-col-ops";
import { useHistory } from "@/hooks/use-history";
import { useSheetFormatting } from "@/hooks/sheets/use-sheet-formatting";
import { useTextWrap } from "@/hooks/sheets/use-text-wrap";
import { useClipboard } from "@/hooks/sheets/use-clipboard";
import { useProtectedCells } from "@/hooks/sheets/use-protected-cells";
import { useRowOperations } from "@/hooks/sheets/use-row-operations";
import { useColumnOperations } from "@/hooks/sheets/use-column-operations";
import { useCellTypes } from "@/hooks/sheets/use-cell-types";
import { useFormulas } from "@/hooks/sheets/use-formulas";
import { useKeyboardShortcuts } from "@/hooks/sheets/use-keyboard-shortcuts";
import { useCharts } from "@/hooks/sheets/use-charts";
import { useTimeTravel } from "@/hooks/use-time-travel";

// ── Existing sub-components ────────────────────────────────────────────────
import ColumnHeaderMenu from "@/components/individual/sheet/Column-header-menu";
import CellTypeSelector from "@/components/individual/sheet/Cell-type-selector";
import FormattingToolbar from "@/components/individual/sheet/Formatting-toolbar";
import ChartPicker from "./Charts-picker";
import ChartWidget from "./Charts-widget";
import ShareDialog from "./dialogs/Share-dialog";
import RightPanel from "./Right-panel";
import type { RightPanelType } from "./Right-panel";
import FormulaDialog from "./dialogs/Formula-dialog";
import {
  ddStyle, ddItemStyle, getMemberColor, CommentDot, SheetAvatar,
} from "@/components/individual/sheet/sheet-ui-helpers";

// ── Lib ────────────────────────────────────────────────────────────────────
import {
  SheetRow,
  ColumnDef,
  CellFormat,
  SaveStatus,
  ConditionalFormatRule,
  SelectOption,
  SavedFilterView,
  AutomationRule,
  FloatingImage,
} from "@/types/index";
import { buildProfessionalTemplateLayout, getTemplateData, LAYOUT_CONFIGS, getTemplateChartPreset, getTemplateChartY } from "@/lib/sheet-templates";
import {
  updateSheetTitle,
  updateSheetStarred,
  loadSheet,
  updateSheetCharts,
  updateSheetRowHeights,
  updateSheetFloatingImages,
} from "@/lib/querys/sheet/sheet";
import { saveRow, saveAllRows } from "@/lib/querys/sheet/rows";
import { saveAllColumns } from "@/lib/querys/sheet/columns";
import { saveAllCellFormats, saveCellFormat } from "@/lib/querys/sheet/format";
import {
  saveAllFormulas,
  saveFormula,
  deleteFormula,
  saveColumnFormula,
  deleteColumnFormula,
} from "@/lib/querys/sheet/formulas";
import { protectRow, unprotectRow } from "@/lib/querys/sheet/protection";
import { logActivity } from "@/lib/querys/activity/activity";
import { exportSheet } from "@/lib/querys/export";
import {
  buildImportedSheetData,
  getImportedSheetTitle,
  MAX_IMPORT_BYTES,
} from "@/lib/import-sheet";
import { getSheetOrgMembers, type OrgMember } from "@/lib/querys/organization/get-sheet-members";
import { getAllOrganizations } from "@/lib/querys/organization/organization";
import { supabase } from "@/lib/supabase/client";
import { api } from "@/lib/api/api-client";
import { useAuth } from "@/context/AuthContext";
import { trackSheetOpen } from "@/lib/querys/sheet/track-open";
import {
  subscribeToHistory,
  subscribeToComments,
  addComment,
  resolveComment,
  logCellEdit,
  logRowAdd,
  logFormulaSet,
  logColumnRename,
} from "@/lib/querys/sheet/firebase-realtime";
import { maybeAutoSnapshot } from "@/lib/querys/sheet/snapshots";
import {
  ensureWorkingRowBuffer,
  normalizeGeneratedColumnNames,
  columnIndexToName,
  ROW_CELL_TYPES_KEY,
  ROW_CELL_SELECT_OPTIONS_KEY,
  getDefaultValueForType,
  getOptionBgStyle,
  getSelectOptionLabel,
  getChoiceOptionsForColumn,
  formatSheetDate,
} from "@/utils/SheetUtils";
import {
  getStatusOptionStyle,
  isCellInConditionalRange,
  conditionalRuleMatches,
} from "@/lib/sheet-formatting-helpers";
// @ts-ignore
// import {
//   buildProfessionalTemplateLayout,
//   getTemplateData,
//   getTemplateChartPreset,   // add this
// } from "@/lib/sheet-templates";
import "@/app/sheet.css";
import { renameSheet } from "@/lib/querys/sheets/sheets";

// ── Types ──────────────────────────────────────────────────────────────────
import { SheetState, AdvancedFilterRule } from "@/types/index";

type ValidationAction = "warn" | "reject";

type ValidationRule = {
  type: string;
  operator?: string;
  options?: string[];
  value?: string;
  value2?: string;
  min?: number;
  max?: number;
  invalidAction?: ValidationAction;
  helpText?: string;
  showHelpText?: boolean;
  sourceRange?: string;
  startColKey?: string;
  endColKey?: string;
  startRow?: number;
  endRow?: number;
};

type ValidationApplyRange = {
  startColKey: string;
  endColKey: string;
  startRow: number;
  endRow: number;
};

type SheetPresence = {
  name: string;
  color: string;
  row: number;
  col: string;
  selectedAt?: number;
  email?: string;
  avatar_url?: string | null;
  role?: string;
};

type MergeInfo = NonNullable<CellFormat["merge"]>;
type MergeMode = NonNullable<MergeInfo["mode"]>;
type AutoOverflowInfo = {
  masterRow: number;
  masterCol: string;
  colSpan: number;
  width: number;
  covered?: boolean;
};

// ── Pure helpers ───────────────────────────────────────────────────────────

function isMergeInfo(value: any): value is MergeInfo {
  return Boolean(
    value &&
    typeof value.masterRow === "number" &&
    typeof value.masterCol === "string" &&
    typeof value.rowSpan === "number" &&
    typeof value.colSpan === "number",
  );
}

// function getTemplateChartY(
//   bufferedRows: SheetRow[],
//   rowHeights: Record<string, number>,
//   showTitleBanner: boolean,
// ): number {
//   // Sum row heights for rows 0..(fieldRowCount+banner).
//   // With banner: rows 0,1,2 are banner+2 field rows → skip 3.
//   // Without banner: rows 0,1,2 are 3 field rows → skip 3.
//   // Either way we skip 3 rows then add 8px breathing room.
//   let y = 0;
//   for (let i = 0; i < 3; i++) {
//     const rowId = bufferedRows[i]?.id;
//     y += rowId ? (rowHeights[rowId] ?? 36) : 36;
//   }
//   return y + 8;
// }


function shouldAutoOverflowValue(value: any) {
  return typeof value === "string" && value.trim().length > 0 && !value.includes("\n");
}

function getLatestPresence(presences: SheetPresence[] | undefined) {
  if (!presences?.length) return null;
  return [...presences].sort((a, b) => (b.selectedAt ?? 0) - (a.selectedAt ?? 0))[0] ?? null;
}

const SHEET_TOUR_STEPS = [
  {
    title: "Formula bar",
    body: "Select a cell, then edit its value or formula here. Formulas start with =.",
  },
  {
    title: "Toolbar options",
    body: "Use the top controls for formatting, search, undo, sorting, cell types, and column tools.",
  },
  {
    title: "Bottom controls",
    body: "The bottom bar shows sheet counts and opens chart tools or keyboard shortcuts.",
  },
  {
    title: "Charts",
    body: "Use the chart button to create a chart from sheet columns, then click the chart to edit it.",
  },
  {
    title: "Right panels",
    body: "Open comments, columns, formulas, validation, automation, and other panels from the toolbar.",
  },
];

function getValidationRuleList(validationRules: any): ValidationRule[] {
  if (!validationRules) return [];
  if (Array.isArray(validationRules)) return validationRules;
  if (Array.isArray(validationRules.rules)) return validationRules.rules;
  return [validationRules];
}

function validationRuleAppliesToRow(rule: ValidationRule, rowIdx: number) {
  if (rule.startRow !== undefined && rowIdx < rule.startRow) return false;
  if (rule.endRow !== undefined && rowIdx > rule.endRow) return false;
  return true;
}

function parseA1Range(range?: string) {
  const match = range?.trim().match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/i);
  if (!match) return null;
  const toIndex = (letter: string) =>
    letter
      .toUpperCase()
      .split("")
      .reduce((sum, char) => sum * 26 + char.charCodeAt(0) - 64, 0) - 1;
  return {
    startCol: toIndex(match[1]),
    startRow: Number(match[2]) - 1,
    endCol: toIndex(match[3]),
    endRow: Number(match[4]) - 1,
  };
}

function getDropdownRangeOptions(
  rule: ValidationRule,
  rows: SheetRow[],
  columns: ColumnDef[],
) {
  const parsed = parseA1Range(rule.sourceRange ?? rule.value);
  if (!parsed) return [];
  const startCol = Math.min(parsed.startCol, parsed.endCol);
  const endCol = Math.max(parsed.startCol, parsed.endCol);
  const startRow = Math.max(0, Math.min(parsed.startRow, parsed.endRow));
  const endRow = Math.min(rows.length - 1, Math.max(parsed.startRow, parsed.endRow));
  const values = new Set<string>();
  for (let rowIdx = startRow; rowIdx <= endRow; rowIdx += 1) {
    for (let colIdx = startCol; colIdx <= endCol; colIdx += 1) {
      const colKey = columns[colIdx]?.key;
      const value = colKey ? rows[rowIdx]?.[colKey] : "";
      if (value !== "" && value !== null && value !== undefined) values.add(String(value));
    }
  }
  return [...values];
}

function parseDateValue(value: any) {
  if (value === "" || value === null || value === undefined) return null;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function isValidUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function validationFailureMessage(columnName: string, rule: ValidationRule) {
  if (rule.showHelpText && rule.helpText?.trim()) return rule.helpText.trim();
  const value = rule.value ?? rule.min ?? "";
  const value2 = rule.value2 ?? rule.max ?? "";
  switch (rule.type) {
    case "dropdown":
    case "dropdown_range":
      return `"${columnName}" only allows values from the dropdown.`;
    case "text_contains":
      return `"${columnName}" must contain "${value}".`;
    case "text_not_contains":
      return `"${columnName}" must not contain "${value}".`;
    case "text_exactly":
      return `"${columnName}" must be exactly "${value}".`;
    case "text_email":
      return `"${columnName}" must be a valid email address.`;
    case "text_url":
      return `"${columnName}" must be a valid URL.`;
    case "date_valid":
      return `"${columnName}" must be a valid date.`;
    case "date_is":
      return `"${columnName}" must be ${value}.`;
    case "date_before":
      return `"${columnName}" must be before ${value}.`;
    case "date_on_or_before":
      return `"${columnName}" must be on or before ${value}.`;
    case "date_after":
      return `"${columnName}" must be after ${value}.`;
    case "date_on_or_after":
      return `"${columnName}" must be on or after ${value}.`;
    case "date_between":
      return `"${columnName}" must be between ${value} and ${value2}.`;
    case "date_not_between":
      return `"${columnName}" must not be between ${value} and ${value2}.`;
    case "number":
      return `"${columnName}" must match the number rule.`;
    default:
      return `"${columnName}" does not match the validation rule.`;
  }
}

function ruleIsValid(
  rule: ValidationRule,
  value: any,
  rows: SheetRow[],
  columns: ColumnDef[],
) {
  if (value === "" || value === null || value === undefined) return true;
  const text = String(value);

  if (rule.type === "dropdown") return (rule.options ?? []).map(String).includes(text);
  if (rule.type === "dropdown_range")
    return getDropdownRangeOptions(rule, rows, columns).includes(text);
  if (rule.type === "text_contains") return text.includes(String(rule.value ?? ""));
  if (rule.type === "text_not_contains") return !text.includes(String(rule.value ?? ""));
  if (rule.type === "text_exactly") return text === String(rule.value ?? "");
  if (rule.type === "text_email") return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);
  if (rule.type === "text_url") return isValidUrl(text);

  if (rule.type.startsWith("date_")) {
    const current = parseDateValue(value);
    const first = parseDateValue(rule.value);
    const second = parseDateValue(rule.value2);
    if (rule.type === "date_valid") return current !== null;
    if (current === null || first === null) return false;
    if (rule.type === "date_is") return current === first;
    if (rule.type === "date_before") return current < first;
    if (rule.type === "date_on_or_before") return current <= first;
    if (rule.type === "date_after") return current > first;
    if (rule.type === "date_on_or_after") return current >= first;
    if (rule.type === "date_between")
      return second !== null && current >= first && current <= second;
    if (rule.type === "date_not_between")
      return second !== null && (current < first || current > second);
  }

  if (rule.type === "number") {
    const numberValue = Number(value);
    if (Number.isNaN(numberValue)) return false;
    const min = rule.min;
    const max = rule.max;
    switch (rule.operator) {
      case "gt": return min === undefined || numberValue > min;
      case "gte": return min === undefined || numberValue >= min;
      case "lt": return min === undefined || numberValue < min;
      case "lte": return min === undefined || numberValue <= min;
      case "eq": return min === undefined || numberValue === min;
      case "neq": return min === undefined || numberValue !== min;
      case "between":
        return (min === undefined || numberValue >= min) &&
          (max === undefined || numberValue <= max);
      case "not_between":
        return !((min === undefined || numberValue >= min) &&
          (max === undefined || numberValue <= max));
      default:
        return (min === undefined || numberValue >= min) &&
          (max === undefined || numberValue <= max);
    }
  }

  return true;
}

function getCellValidationFailure(
  rules: any,
  value: any,
  rowIdx: number,
  columnName: string,
  rows: SheetRow[],
  columns: ColumnDef[],
) {
  for (const rule of getValidationRuleList(rules)) {
    if (!validationRuleAppliesToRow(rule, rowIdx)) continue;
    if (!ruleIsValid(rule, value, rows, columns)) {
      return {
        action: rule.invalidAction ?? "warn",
        message: validationFailureMessage(columnName, rule),
      };
    }
  }
  return null;
}

function normalizeValidationRules(input: any, applyRange?: ValidationApplyRange) {
  if (!input || input._remove) return null;
  const rawRules = Array.isArray(input?.rules)
    ? input.rules
    : Array.isArray(input)
      ? input
      : [input];
  const normalized = rawRules
    .map((rule: any): ValidationRule | null => {
      const base = {
        invalidAction: rule.invalidAction === "reject" ? ("reject" as const) : ("warn" as const),
        helpText: typeof rule.helpText === "string" ? rule.helpText : "",
        showHelpText: Boolean(rule.showHelpText),
        startColKey: applyRange?.startColKey,
        endColKey: applyRange?.endColKey,
        startRow: applyRange?.startRow,
        endRow: applyRange?.endRow,
      };
      if (rule.type === "dropdown") {
        return {
          ...base,
          type: "dropdown",
          options: Array.from(
            new Set(
              (rule.options ?? [])
                .map((item: any) => String(item).trim())
                .filter(Boolean),
            ),
          ),
        };
      }
      if (rule.type === "dropdown_range") {
        return {
          ...base,
          type: "dropdown_range",
          sourceRange: String(rule.sourceRange ?? rule.value ?? "").trim(),
        };
      }
      if (rule.type === "number") {
        return {
          ...base,
          type: "number",
          operator: rule.operator ?? "between",
          ...(rule.min === undefined || Number.isNaN(Number(rule.min))
            ? {}
            : { min: Number(rule.min) }),
          ...(rule.max === undefined || Number.isNaN(Number(rule.max))
            ? {}
            : { max: Number(rule.max) }),
        };
      }
      if (typeof rule.type === "string") {
        return {
          ...base,
          type: rule.type,
          value: rule.value === undefined ? "" : String(rule.value),
          value2: rule.value2 === undefined ? "" : String(rule.value2),
        };
      }
      return null;
    })
    .filter(Boolean) as ValidationRule[];
  if (normalized.length === 0) return null;
  return normalized.length === 1 ? normalized[0] : { type: "ruleSet", rules: normalized };
}

function getValidationDrivenCellType(rules: any): ColumnDef["type"] | null {
  const firstRule = getValidationRuleList(rules)[0];
  if (!firstRule) return null;
  if (firstRule.type === "dropdown" || firstRule.type === "dropdown_range") return "select";
  if (firstRule.type === "number") return "number";
  if (firstRule.type.startsWith("date_")) return "date";
  return null;
}

function getValidationDropdownOptions(rules: any): string[] {
  const dropdownRule = getValidationRuleList(rules).find((rule) => rule.type === "dropdown");
  return dropdownRule?.options ?? [];
}

const UncontrolledInput = React.forwardRef<HTMLInputElement, any>(
  ({ initialValue, onValueChange, ...props }, ref) => {
    return (
      <input
        {...props}
        ref={ref}
        defaultValue={initialValue}
        onChange={(e) => {
          if (onValueChange) onValueChange(e);
        }}
      />
    );
  }
);
UncontrolledInput.displayName = "UncontrolledInput";

const EditCellWrapper: React.FC<{
  children: React.ReactNode;
  isTall?: boolean;
  isMergeMaster?: boolean;
  editWidth?: number;
  editHeight?: number;
  cellStyle: React.CSSProperties;
  isDark: boolean;
}> = ({ children, isTall, isMergeMaster, editWidth, editHeight, cellStyle, isDark }) => (
  <div
    className={isMergeMaster ? "sheet-cell-merge-master sheet-cell-active-selected" : ""}
    style={{
      position: isMergeMaster ? "absolute" : "relative",
      top: 0,
      left: 0,
      width: isMergeMaster ? editWidth ?? "100%" : "100%",
      height: isMergeMaster ? editHeight ?? "100%" : "100%",
      zIndex: isMergeMaster ? 9 : 1,
      boxSizing: "border-box",
      background:
        cellStyle.backgroundColor && cellStyle.backgroundColor !== "transparent"
          ? cellStyle.backgroundColor
          : isDark
            ? "#131620"
            : "#ffffff",
      overflow: isTall ? "hidden" : "visible",
      border: isMergeMaster ? "1px solid var(--sh-border, #e8eaed)" : "none",
    }}
  >
    {children}
  </div>
);

const UncontrolledTextarea = React.forwardRef<HTMLTextAreaElement, any>(
  ({ initialValue, onValueChange, ...props }, ref) => {
    return (
      <textarea
        {...props}
        ref={ref}
        defaultValue={initialValue}
        onChange={(e) => {
          if (onValueChange) onValueChange(e);
        }}
      />
    );
  }
);
UncontrolledTextarea.displayName = "UncontrolledTextarea";

// ─────────────────────────────────────────────────────────────────────────────
// Main client-side sheet editor component
export default function SheetClient() {
  const params = useParams<{ id?: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const templateId = searchParams?.get("template") || "blank";
  const isOrganizationSheet = searchParams?.get("org") === "true";
  const importedFrom = searchParams?.get("imported");
  const inviteToken = searchParams?.get("inviteToken") || "";
  const invitedRole = searchParams?.get("role") || "";
  const sheetId = params?.id ?? "";
  const { user: authUser, loading: authLoading, loginWithGoogle } = useAuth();
  const [inviteReady, setInviteReady] = useState(!inviteToken);

  // ── Ref for DataGrid instance (programmatic editing of master cells) ───
  const gridRef = useRef<any>(null);

  const chartInsertedRef = useRef(false);

  // ── Refs ───────────────────────────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const floatingImageInputRef = useRef<HTMLInputElement | null>(null);
  const [activeCell, setActiveCell] = useState<{ rowId: string; colKey: string } | null>(null);
  const [floatingImages, setFloatingImages] = useState<FloatingImage[]>([]);
  const floatingImageDragRef = useRef<{
    id: string;
    pointerId: number;
    mode: "move" | "resize";
    startX: number;
    startY: number;
    original: FloatingImage;
  } | null>(null);
  const [focusedColumnKey, setFocusedColumnKey] = useState<string | null>(null);
  const [selectedColumnKey, setSelectedColumnKey] = useState<string | null>(null);
  const [mentionState, setMentionState] = useState<{
    active: boolean;
    query: string;
    anchor: { top: number; left: number } | null;
    cellKey: string;
    inputRef: HTMLInputElement | null;
  }>({ active: false, query: "", anchor: null, cellKey: "", inputRef: null });
  const [userOrganizations, setUserOrganizations] = useState<any[]>([]);

  const sv = useSheetStateVars(isOrganizationSheet, importedFrom);
  const {
    sheetState, setSheetState,
    saveStatus, setSaveStatus,
    selectedRows, setSelectedRows,
    selectedCell, setSelectedCell,
    rightPanel, setRightPanel,
    showSearch, setShowSearch,
    showFilters, setShowFilters,
    isDark, setIsDark,
    filterValue, setFilterValue,
    advancedFilters, setAdvancedFilters,
    showShareDialog, setShowShareDialog,
    showFormulaDialog, setShowFormulaDialog,
    searchQuery, setSearchQuery,
    fontSize, setFontSize,
    fontFamily, setFontFamily,
    zoomLevel, setZoomLevel,
    orgMembers, setOrgMembers,
    currentUser, setCurrentUser,
    activeCursors, setActiveCursors,
    comments, setComments,
    history, setHistory,
    activeCommentCell, setActiveCommentCell,
    newCommentText, setNewCommentText,
    replyText, setReplyText,
    forks, setForks,
    cellSelectOptions, setCellSelectOptions,
    rowHeights, setRowHeights,
    showDesktopTip, setShowDesktopTip,
    isImportingSheet, setIsImportingSheet,
    importSource, setImportSource,
    selectSetupDialog, setSelectSetupDialog,
  } = sv;

  const { title, isOrgSheet, liveTracking, starred, rows, columns, organizationId } = sheetState;
  const effectiveRole =
    sheetState.userRole ??
    (sheetState.ownerId && currentUser?.id === sheetState.ownerId ? "owner" : undefined);
  const isOwner = Boolean(
    currentUser && (sheetState.ownerId === currentUser.id || effectiveRole === "owner"),
  );
  const canEditSheet =
    !isOrgSheet || effectiveRole === "owner" || effectiveRole === "editor";
  const canProtectRows = Boolean(currentUser && isOwner);

  const [, setIsLoading] = useState(true);

  // ── Drag-selection state ───────────────────────────────────────────────
  const selectionAnchorRef = useRef<{ row: number; colIndex: number } | null>(null);
  const isDraggingRef = useRef(false);
  const [selectionRange, setSelectionRange] = useState<{
    start: { row: number; colIndex: number };
    end: { row: number; colIndex: number };
  } | null>(null);

  const rowsHistory = useHistory<SheetRow[]>([]);
  const columnsHistory = useHistory<ColumnDef[]>([]);
  const titleSaveTimeout = useRef<NodeJS.Timeout | undefined>(undefined);
  const presenceChannelRef = useRef<any>(null);
  const lastViewerEditToastRef = useRef(0);
  const localSaveRef = useRef(false);
  const remoteRefreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoMergeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const chartBtnRef = useRef<HTMLButtonElement | null>(null);
  const chartsHydratedRef = useRef(false);
  const inviteAcceptStartedRef = useRef(false);
  const rowResizeRef = useRef<{
    rowId: string;
    startY: number;
    startH: number;
    pointerId: number;
  } | null>(null);
  const colResizeStartRef = useRef<ColumnDef[] | null>(null);
  const colResizeRef = useRef<{ colKey: string; startX: number; startW: number } | null>(null);
  const fillDragRef = useRef<{ row: number; colKey: string; pointerId: number } | null>(null);
  const fillTargetRowRef = useRef<number | null>(null);
  const smartClipboardRef = useRef<{
    value: any;
    formula?: string;
    format?: CellFormat;
    source: { row: number; col: string };
  } | null>(null);
  const [savedViews, setSavedViews] = useState<SavedFilterView[]>([]);
  const [frozenRowsCount, setFrozenRowsCount] = useState(0);
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);
  const [showSheetTour, setShowSheetTour] = useState(false);
  const [tourStep, setTourStep] = useState(0);

  // ── Sub-hooks ──────────────────────────────────────────────────────────
  const formatting = useSheetFormatting(() => { });
  const textWrap = useTextWrap(rows, () => { });
  const clipboard = useClipboard(rows, rowsHistory, () => { });
  const protection = useProtectedCells(() => { });
  const rowOps = useRowOperations(rows, columns, rowsHistory, () => { });
  const colOps = useColumnOperations(rows, columns, columnsHistory, rowsHistory, () => { });
  const cellTypes = useCellTypes(rows, rowsHistory, () => { });
  const formulas = useFormulas(rows, columns);
  const charts = useCharts({ storageKey: sheetId ? `sheetsync:${sheetId}:charts` : null });

  const markSaving = useCallback(() => {
    localSaveRef.current = true;
    setSaveStatus("saving");
  }, [setSaveStatus]);

  const markSaved = useCallback(() => {
    setSaveStatus("saved");
    window.setTimeout(() => {
      localSaveRef.current = false;
    }, 1200);
  }, [setSaveStatus]);

  const showViewerEditMessage = useCallback(() => {
    const now = Date.now();
    if (now - lastViewerEditToastRef.current < 1600) return;
    lastViewerEditToastRef.current = now;
    toast.info("You are a viewer. Ask the owner for editor access to make changes.");
  }, []);

  const [timeTravelState, timeTravelActions] = useTimeTravel({
    sheetId,
    currentRows: rows,
    currentColumns: columns,
    historyEntries: history,
    currentUserId: currentUser?.id,
    organizationId: isOrgSheet ? organizationId : null,
    onBranch: (newSheetId: string, label: string) => {
      toast.success(`Branched! Opening "${label}"…`, { duration: 3000 });
      router.push(`/sheet/${newSheetId}`);
    },
  });

  // ── Sync history states ────────────────────────────────────────────────
  const skipHistorySyncRef = useRef(false);
  useEffect(() => {
    if (skipHistorySyncRef.current) return;
    startTransition(() =>
      setSheetState((p) => ({ ...p, rows: rowsHistory.currentState })),
    );
  }, [rowsHistory.currentState]);

  useEffect(() => {
    if (skipHistorySyncRef.current) return;
    startTransition(() =>
      setSheetState((p) => ({ ...p, columns: columnsHistory.currentState })),
    );
  }, [columnsHistory.currentState]);

  // ── Dark mode body attribute ───────────────────────────────────────────
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.dataset.sheetDark = isDark ? "true" : "false";
    return () => {
      if (typeof document !== "undefined") {
        document.body.removeAttribute("data-sheet-dark");
      }
    };
  }, [isDark]);

  // ── Invite acceptance ──────────────────────────────────────────────────
  useEffect(() => {
    if (!inviteToken) {
      setInviteReady(true);
      return;
    }
    if (authLoading || typeof window === "undefined") return;

    const currentPath = `${window.location.pathname}${window.location.search}`;

    if (!authUser) {
      loginWithGoogle(currentPath);
      return;
    }

    const userId = (authUser as any)?.id ?? (authUser as any)?.uid ?? "";
    const alreadyAcceptedKey = `sheetsync:invite-accepted:${userId}:${inviteToken}`;
    if (typeof window !== "undefined" && window.localStorage.getItem(alreadyAcceptedKey)) {
      setInviteReady(true);
      return;
    }

    if (inviteAcceptStartedRef.current) return;
    inviteAcceptStartedRef.current = true;

    let cancelled = false;

    api
      .post("/invites/accept", {
        token: inviteToken,
        inviteByLink: true,
        sheetId: sheetId,
        role: invitedRole || "viewer",
      })
      .then((res: any) => {
        if (cancelled) return;
        const data = res?.data ?? res;
        const roleLabel = data?.role || invitedRole || "collaborator";
        const roleCapped = roleLabel.charAt(0).toUpperCase() + roleLabel.slice(1);
        if (data?.alreadyMember) {
          toast.info("Welcome back! Opening your sheet…", { duration: 3000 });
        } else {
          toast.success(
            `You've joined as ${roleCapped}${data?.inviterName ? ` — invited by ${data.inviterName}` : ""
            } 🎉`,
            { duration: 5000 },
          );
        }
        window.localStorage.setItem(alreadyAcceptedKey, "1");
        const url = new URL(window.location.href);
        ["invited", "inviteToken", "role", "by"].forEach((p) =>
          url.searchParams.delete(p),
        );
        window.history.replaceState(null, "", `${url.pathname}${url.search}`);
        setInviteReady(true);
      })
      .catch((err: any) => {
        if (cancelled) return;
        if (err?.response?.status === 401) {
          loginWithGoogle(currentPath);
          return;
        }
        toast.error(
          err?.response?.data?.error || err?.message || "Failed to accept invite",
        );
        inviteAcceptStartedRef.current = false;
        setInviteReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [authLoading, authUser, invitedRole, inviteToken, sheetId, loginWithGoogle]);

  // ── Local storage loading ──────────────────────────────────────────────
  useEffect(() => {
    if (!sheetId || typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(`sheetsync:${sheetId}:filter-views`);
      setSavedViews(raw ? JSON.parse(raw) : []);
    } catch {
      setSavedViews([]);
    }
  }, [sheetId]);

  useEffect(() => {
    if (!isOrgSheet && currentUser && isOwner) {
      getAllOrganizations()
        .then((orgs) => {
          setUserOrganizations(orgs);
        })
        .catch((err) => {
          console.error("Failed to load organizations:", err);
        });
    }
  }, [isOrgSheet, currentUser, isOwner]);

  useEffect(() => {
    if (!sheetId || typeof window === "undefined") return;
    const raw = window.localStorage.getItem(`sheetsync:${sheetId}:frozen-rows`);
    setFrozenRowsCount(raw === "1" ? 1 : 0);
  }, [sheetId]);

  useEffect(() => {
    if (!sheetId || typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(`sheetsync:${sheetId}:automation-rules`);
      setAutomationRules(raw ? JSON.parse(raw) : []);
    } catch {
      setAutomationRules([]);
    }
  }, [sheetId]);

  const persistSavedViews = useCallback(
    (views: SavedFilterView[]) => {
      setSavedViews(views);
      if (sheetId && typeof window !== "undefined") {
        window.localStorage.setItem(
          `sheetsync:${sheetId}:filter-views`,
          JSON.stringify(views),
        );
      }
    },
    [sheetId],
  );

  const persistAutomationRules = useCallback(
    (rules: AutomationRule[]) => {
      setAutomationRules(rules);
      if (sheetId && typeof window !== "undefined") {
        window.localStorage.setItem(
          `sheetsync:${sheetId}:automation-rules`,
          JSON.stringify(rules),
        );
      }
    },
    [sheetId],
  );

  const broadcastSheetSnapshot = useCallback(
    (patch: Record<string, any>) => {
      if (!presenceChannelRef.current || !currentUser || !isOrgSheet) return;
      presenceChannelRef.current.send({
        type: "broadcast",
        event: "sheet_snapshot",
        payload: {
          actorId: currentUser.id,
          title,
          rows,
          columns,
          formulas: formulas.formulas,
          columnFormulas: formulas.columnFormulas,
          cellFormats: formatting.cellFormats,
          textWrapColumns: [...textWrap.textWrapColumns],
          cellTypeOverrides: cellTypes.cellTypeOverrides,
          cellSelectOptions,
          charts: charts.charts,
          rowHeights,
          ...patch,
        },
      });
    },
    [
      currentUser, isOrgSheet, title, rows, columns,
      formulas.formulas, formulas.columnFormulas,
      formatting.cellFormats, textWrap.textWrapColumns,
      cellTypes.cellTypeOverrides, cellSelectOptions,
      charts.charts, rowHeights,
    ],
  );

  // ── Persistence hook ───────────────────────────────────────────────────
  const persistence = useSheetPersistence({
    sheetId,
    organizationId,
    isOrgSheet,
    title,
    rows,
    columns,
    currentUserId: currentUser?.id,
    currentUser,
    setSaveStatus,
    rowsHistoryCurrentState: rowsHistory.currentState,
  });

  // ── Row ops hook ───────────────────────────────────────────────────────
  const sheetRowOps = useSheetRowOps({
    sheetId,
    organizationId,
    isOrgSheet,
    title,
    rows,
    columns,
    selectedRows,
    setSelectedRows,
    setSaveStatus,
    rowOps,
    rowsHistory,
    markSaving,
    markSaved,
  });

  // ── Col ops hook ───────────────────────────────────────────────────────
  const sheetColOps = useSheetColOps({
    sheetId,
    organizationId,
    isOrgSheet,
    title,
    rows,
    columns,
    setSheetState,
    setSelectSetupDialog,
    setSaveStatus,
    colOps,
    columnsHistory,
    rowsHistory,
    markSaving,
    markSaved,
    currentUser,
    selectedCell,
    broadcastSheetSnapshot,
  });

  // ── Load sheet ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!sheetId || !inviteReady) return;
    chartsHydratedRef.current = false;
    chartInsertedRef.current = false;
    queueMicrotask(() => setIsLoading(true));

    const templateAppliedKey = `sheetsync:${sheetId}:template-applied`;
    const templateAlreadyApplied = !!localStorage.getItem(templateAppliedKey);

    loadSheet(sheetId)
      .then(async (data) => {
        const savedFormats = data.cellFormats ?? {};
        const hasSavedFormats = Object.keys(savedFormats).length > 0;

        if (data.rows.length > 0 || data.columns.length > 0) {
          const sheetIsOrg = data.isPersonal === false || isOrganizationSheet;

          let wrapSet = new Set<string>();
          if (hasSavedFormats) {
            wrapSet = new Set<string>(
              Object.entries(savedFormats)
                .filter(([, fmt]) => (fmt as any).textWrap === true)
                .map(([k]) => k),
            );
            formatting.setCellFormats(savedFormats);
            const selectByCell: Record<string, string[]> = {};
            Object.entries(savedFormats).forEach(([key, fmt]) => {
              const opts = (fmt as any)?.selectOptions;
              if (Array.isArray(opts) && opts.length > 0) selectByCell[key] = opts;
            });
            if (Object.keys(selectByCell).length > 0) setCellSelectOptions(selectByCell);
          }

          if (data.formulas && Object.keys(data.formulas).length > 0)
            formulas.setFormulas(data.formulas);
          if (data.columnFormulas && Object.keys(data.columnFormulas).length > 0)
            formulas.setColumnFormulas(data.columnFormulas);
          if (data.protectedCells && data.protectedCells.size > 0)
            protection.setProtectedCells(data.protectedCells);
          if (wrapSet.size > 0) textWrap.setTextWrapColumns(wrapSet);

          const bufferedRows = ensureWorkingRowBuffer(data.rows, data.columns);
          const typeOverrides: Record<string, ColumnDef["type"]> = {};
          const rowSelectOptions: Record<string, string[]> = {};
          bufferedRows.forEach((row, rowIdx) => {
            const rowTypes = row[ROW_CELL_TYPES_KEY];
            if (rowTypes && typeof rowTypes === "object") {
              Object.entries(rowTypes).forEach(([colKey, type]) => {
                typeOverrides[`${rowIdx}-${colKey}`] = type as ColumnDef["type"];
              });
            }
            const rowSelects = row[ROW_CELL_SELECT_OPTIONS_KEY];
            if (rowSelects && typeof rowSelects === "object") {
              Object.entries(rowSelects).forEach(([colKey, options]) => {
                if (Array.isArray(options) && options.length > 0)
                  rowSelectOptions[`${rowIdx}-${colKey}`] = options.map(String);
              });
            }
          });
          if (Object.keys(typeOverrides).length > 0)
            cellTypes.setCellTypeOverrides(typeOverrides);
          if (Object.keys(rowSelectOptions).length > 0)
            setCellSelectOptions((prev) => ({ ...prev, ...rowSelectOptions }));

          rowsHistory.pushState(bufferedRows);
          columnsHistory.pushState(data.columns);
          setSheetState({
            title: data.title,
            isOrgSheet: sheetIsOrg,
            liveTracking: sheetIsOrg,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
            ownerId: data.ownerId,
            organizationId: data.organizationId ?? null,
            starred: data.isStarred,
            rows: bufferedRows,
            columns: data.columns,
            forkedFromSheetId: data.forked_from_sheet_id,
            forkedFromSnapshotLabel: data.forked_from_snapshot_label,
            forkedAt: data.forked_at,
            forkedByUserId: data.forked_by_user_id,
            userRole: sheetIsOrg ? "viewer" : "owner",
          });

          const dbCharts = (data as any).charts ?? [];
          if (dbCharts.length > 0) {
            const uniqueCharts = dbCharts.filter(
              (chart: any, index: number, arr: any[]) =>
                arr.findIndex((c: any) => c.title === chart.title) === index
            );
            charts.replaceAll(uniqueCharts);
            if (uniqueCharts.length !== dbCharts.length) {
              setTimeout(() => updateSheetCharts(sheetId, uniqueCharts).catch(console.error), 500);
            }
          }
          chartsHydratedRef.current = true;
          if (Array.isArray((data as any).forks)) setForks((data as any).forks);
          if ((data as any).rowHeights) setRowHeights((data as any).rowHeights);
          if (Array.isArray((data as any).floatingImages)) {
            setFloatingImages((data as any).floatingImages);
          }

          const activeTemplateId = (data as any).templateId || templateId;
          const isBlankTemplate =
            !activeTemplateId ||
            activeTemplateId === "blank" ||
            activeTemplateId === "f628aed8-bca7-4f51-b687-6db9f932be34";

          // Only apply template layout on very first load — never again after that
          if (activeTemplateId && !isBlankTemplate && !templateAlreadyApplied) {
            const td = getTemplateData(activeTemplateId);
            const effectiveCols = data.columns.length > 0 ? data.columns : td.columns;

            const layout = buildProfessionalTemplateLayout(
              td.title,
              effectiveCols,
              bufferedRows,
              activeTemplateId,
            );
            const finalRows = layout.rows;
            const actualRowHeights: Record<string, number> = { ...layout.rowHeights };

            formatting.setCellFormats(layout.cellFormats);
            setRowHeights(actualRowHeights);
            rowsHistory.pushState(finalRows);
            setSheetState((prev) => ({ ...prev, rows: finalRows }));

            localSaveRef.current = true;
            await Promise.all([
              saveAllRows(sheetId, finalRows),
              saveAllCellFormats(sheetId, layout.cellFormats),
              updateSheetRowHeights(sheetId, actualRowHeights),
            ]);
            setTimeout(() => { localSaveRef.current = false; }, 3000);

            localStorage.setItem(templateAppliedKey, "1");

            const chartPreset = getTemplateChartPreset(activeTemplateId, effectiveCols);
            const cfg = LAYOUT_CONFIGS[activeTemplateId];
            if (chartPreset && dbCharts.length === 0 && !chartInsertedRef.current) {
              chartInsertedRef.current = true;
              const chartY = getTemplateChartY(finalRows, actualRowHeights, cfg?.showTitleBanner ?? true);
              const inserted = charts.insertChart(chartPreset.kind as any, finalRows, effectiveCols, {
                labelColumnKey: chartPreset.labelColumnKey,
                seriesKeys: chartPreset.seriesKeys,
                aggregateMode: chartPreset.aggregateMode,
                title: chartPreset.title,
                x: 20,
                y: chartY,
                width: 440,
                height: 260,
              });
              await updateSheetCharts(sheetId, [inserted]).catch(console.error);
            }
          }

        } else {
          // No rows/columns yet — fresh sheet, always apply template
          chartsHydratedRef.current = true;
          const activeTemplateId = (data as any).templateId || templateId;
          const td = getTemplateData(activeTemplateId);

          const bufferedRows = ensureWorkingRowBuffer(td.rows, td.columns);

          const layout = buildProfessionalTemplateLayout(
            td.title,
            td.columns,
            bufferedRows,
            activeTemplateId,
          );
          const finalRows = layout.rows;
          const actualRowHeights: Record<string, number> = { ...layout.rowHeights };

          rowsHistory.pushState(finalRows);
          columnsHistory.pushState(td.columns);
          formatting.setCellFormats(layout.cellFormats);
          setRowHeights(actualRowHeights);
          setSheetState((p) => ({
            ...p,
            title: data.title || td.title,
            starred: false,
            rows: finalRows,
            columns: td.columns,
          }));

          localSaveRef.current = true;
          await Promise.all([
            saveAllRows(sheetId, finalRows),
            saveAllColumns(sheetId, td.columns),
            saveAllCellFormats(sheetId, layout.cellFormats),
            updateSheetRowHeights(sheetId, actualRowHeights),
          ]);
          setTimeout(() => { localSaveRef.current = false; }, 3000);

          localStorage.setItem(templateAppliedKey, "1");

          const chartPreset = getTemplateChartPreset(activeTemplateId, td.columns);
          const cfg = LAYOUT_CONFIGS[activeTemplateId];
          if (chartPreset && !chartInsertedRef.current) {
            chartInsertedRef.current = true;
            const chartY = getTemplateChartY(finalRows, actualRowHeights, cfg?.showTitleBanner ?? true);
            const inserted = charts.insertChart(chartPreset.kind as any, finalRows, td.columns, {
              labelColumnKey: chartPreset.labelColumnKey,
              seriesKeys: chartPreset.seriesKeys,
              aggregateMode: chartPreset.aggregateMode,
              title: chartPreset.title,
              x: 20,
              y: chartY,
              width: 440,
              height: 260,
            });
            await updateSheetCharts(sheetId, [inserted]).catch(console.error);
          }
        }

        await trackSheetOpen(sheetId);
      })
      .catch((err) => {
        console.error(err);
        toast.error("Failed to load sheet. Please refresh.");
      })
      .finally(() => {
        setIsLoading(false);
        window.dispatchEvent(new Event("__sheet-ready"));
      });
  }, [sheetId, inviteReady, charts.replaceAll]);

  // ── Persist charts / row heights ───────────────────────────────────────
  useEffect(() => {
    if (!sheetId || !chartsHydratedRef.current) return;
    const t = setTimeout(() => {
      updateSheetCharts(sheetId, charts.charts).catch(console.error);
    }, 600);
    return () => clearTimeout(t);
  }, [charts.charts, sheetId]);

  useEffect(() => {
    if (!sheetId) return;
    const t = setTimeout(() => {
      updateSheetRowHeights(sheetId, rowHeights).catch(console.error);
    }, 600);
    return () => clearTimeout(t);
  }, [rowHeights, sheetId]);

  useEffect(() => {
    if (!sheetId || !chartsHydratedRef.current) return;
    const t = setTimeout(() => {
      updateSheetFloatingImages(sheetId, floatingImages).catch(console.error);
    }, 600);
    return () => clearTimeout(t);
  }, [floatingImages, sheetId]);

  // ── Auth + realtime ────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user)
        setCurrentUser({
          id: data.user.id,
          name:
            data.user.user_metadata?.full_name ||
            data.user.user_metadata?.name ||
            data.user.email?.split("@")[0] ||
            "You",
          email: data.user.email || "",
          avatar_url: data.user.user_metadata?.avatar_url || null,
        });
    });
  }, []);

  useEffect(() => {
    if (!sheetId || !isOrgSheet) {
      setOrgMembers([]);
      return;
    }
    getSheetOrgMembers(sheetId)
      .then((data) => {
        if (!data) return;
        setOrgMembers(data.members);
        const currentMember = currentUser
          ? data.members.find((member) => member.id === currentUser.id)
          : null;
        setSheetState((prev) => ({
          ...prev,
          userRole: (currentMember?.role ?? prev.userRole) as SheetState["userRole"],
          organizationId: data.orgId,
          organizationName: data.orgName,
        }));
      })
      .catch(console.error);
  }, [sheetId, isOrgSheet, currentUser, setSheetState]);

  useEffect(() => {
    if (!sheetId) return;
    return subscribeToHistory(sheetId, setHistory);
  }, [sheetId]);

  useEffect(() => {
    if (!sheetId) return;
    return subscribeToComments(sheetId, (grouped) => setComments(grouped));
  }, [sheetId]);

  const applyRemoteSheetSnapshot = useCallback(async () => {
    if (!sheetId || localSaveRef.current) return;
    try {
      const data = await loadSheet(sheetId);
      const bufferedRows = ensureWorkingRowBuffer(data.rows, data.columns);
      const nextColumns = data.columns;

      const wrapSet = new Set<string>();
      if (data.cellFormats) {
        Object.entries(data.cellFormats).forEach(([key, fmt]) => {
          if ((fmt as any).textWrap === true) wrapSet.add(key);
        });
        formatting.setCellFormats(data.cellFormats);
      }
      textWrap.setTextWrapColumns(wrapSet);
      formulas.setFormulas(data.formulas ?? {});
      formulas.setColumnFormulas(data.columnFormulas ?? {});
      protection.setProtectedCells(data.protectedCells ?? new Set());
      if (Array.isArray((data as any).charts)) charts.replaceAll((data as any).charts);
      if ((data as any).rowHeights) setRowHeights((data as any).rowHeights);
      if (Array.isArray((data as any).floatingImages)) {
        setFloatingImages((data as any).floatingImages);
      }

      if (
        JSON.stringify(bufferedRows) !== JSON.stringify(rowsHistory.currentState)
      ) {
        rowsHistory.pushState(bufferedRows);
      }
      if (
        JSON.stringify(nextColumns) !== JSON.stringify(columnsHistory.currentState)
      ) {
        columnsHistory.pushState(nextColumns);
      }

      setSheetState((prev) => ({
        ...prev,
        title: data.title,
        starred: data.isStarred,
        updatedAt: data.updated_at,
        rows: bufferedRows,
        columns: nextColumns,
        ownerId: data.ownerId,
        organizationId: data.organizationId ?? null,
      }));
      setSaveStatus("saved");
    } catch (err) {
      console.error("Realtime sheet refresh failed", err);
    }
  }, [
    sheetId, formatting, textWrap, formulas, protection, charts,
    rowsHistory, columnsHistory, setSheetState, setSaveStatus, setRowHeights,
  ]);

  const scheduleRemoteSheetRefresh = useCallback(() => {
    if (localSaveRef.current) return;
    if (remoteRefreshTimeoutRef.current) clearTimeout(remoteRefreshTimeoutRef.current);
    remoteRefreshTimeoutRef.current = setTimeout(() => {
      remoteRefreshTimeoutRef.current = null;
      applyRemoteSheetSnapshot();
    }, 180);
  }, [applyRemoteSheetSnapshot]);

  useEffect(() => {
    if (!sheetId || !inviteReady) return;
    const channel = supabase
      .channel(`sheet-data:${sheetId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rows", filter: `sheet_id=eq.${sheetId}` },
        scheduleRemoteSheetRefresh,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "columns", filter: `sheet_id=eq.${sheetId}` },
        scheduleRemoteSheetRefresh,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "formulas", filter: `sheet_id=eq.${sheetId}` },
        scheduleRemoteSheetRefresh,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "cell_formats", filter: `sheet_id=eq.${sheetId}` },
        scheduleRemoteSheetRefresh,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "protected_rows", filter: `sheet_id=eq.${sheetId}` },
        scheduleRemoteSheetRefresh,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sheets", filter: `id=eq.${sheetId}` },
        scheduleRemoteSheetRefresh,
      )
      .subscribe();

    return () => {
      if (remoteRefreshTimeoutRef.current) {
        clearTimeout(remoteRefreshTimeoutRef.current);
        remoteRefreshTimeoutRef.current = null;
      }
      supabase.removeChannel(channel);
    };
  }, [sheetId, inviteReady, scheduleRemoteSheetRefresh]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    if (!isMobile) {
      setShowDesktopTip(false);
      return;
    }
    const key = "sheetsync:mobile-sheet-tip";
    if (!window.localStorage.getItem(key)) {
      setShowDesktopTip(true);
      window.localStorage.setItem(key, "1");
    }
  }, [setShowDesktopTip]);

  useEffect(() => {
    if (typeof window === "undefined" || !sheetId) return;
    const key = "sheetsync:first-sheet-tour";
    if (!window.localStorage.getItem(key)) {
      setShowSheetTour(true);
      window.localStorage.setItem(key, "1");
    }
  }, [sheetId]);

  const applyBroadcastSnapshot = useCallback(
    (payload: any) => {
      if (!payload || payload.actorId === currentUser?.id) return;
      if (payload.formulas) formulas.setFormulas(payload.formulas);
      if (payload.columnFormulas) formulas.setColumnFormulas(payload.columnFormulas);
      if (Array.isArray(payload.rows)) rowsHistory.pushState(payload.rows);
      if (Array.isArray(payload.columns)) columnsHistory.pushState(payload.columns);
      if (payload.cellFormats) formatting.setCellFormats(payload.cellFormats);
      if (payload.textWrapColumns)
        textWrap.setTextWrapColumns(new Set(payload.textWrapColumns));
      if (payload.cellTypeOverrides)
        cellTypes.setCellTypeOverrides(payload.cellTypeOverrides);
      if (payload.cellSelectOptions) setCellSelectOptions(payload.cellSelectOptions);
      if (Array.isArray(payload.charts)) charts.replaceAll(payload.charts);
      if (payload.rowHeights) setRowHeights(payload.rowHeights);
      setSheetState((prev) => ({
        ...prev,
        ...(typeof payload.title === "string" ? { title: payload.title } : {}),
        ...(Array.isArray(payload.rows) ? { rows: payload.rows } : {}),
        ...(Array.isArray(payload.columns) ? { columns: payload.columns } : {}),
      }));
      setSaveStatus("saved");
    },
    [
      currentUser?.id,
      formulas.setFormulas,
      formulas.setColumnFormulas,
      rowsHistory,
      columnsHistory,
      setSheetState,
      setSaveStatus,
      formatting.setCellFormats,
      textWrap.setTextWrapColumns,
      cellTypes.setCellTypeOverrides,
      setCellSelectOptions,
      charts.replaceAll,
      setRowHeights,
    ],
  );

  const applyBroadcastSnapshotRef = useRef(applyBroadcastSnapshot);
  useEffect(() => {
    applyBroadcastSnapshotRef.current = applyBroadcastSnapshot;
  }, [applyBroadcastSnapshot]);


  const applyRemoteCellSelection = useCallback(
    (payload: SheetPresence & { userId?: string }) => {
      if (!payload?.userId || payload.userId === currentUser?.id) return;
      setActiveCursors((prev) => ({
        ...prev,
        [payload.userId as string]: {
          name: payload.name,
          color: payload.color,
          row: payload.row,
          col: payload.col,
          selectedAt: payload.selectedAt,
          email: payload.email,
          avatar_url: payload.avatar_url,
          role: payload.role,
        },
      }));
    },
    [currentUser?.id, setActiveCursors],
  );

  const applyRemoteCellSelectionRef = useRef(applyRemoteCellSelection);
  useEffect(() => {
    applyRemoteCellSelectionRef.current = applyRemoteCellSelection;
  }, [applyRemoteCellSelection]);

  // ── Collaborator presence ──────────────────────────────────────────────
  useEffect(() => {
    if (!sheetId || !isOrgSheet || !currentUser) return;
    if (presenceChannelRef.current) {
      supabase.removeChannel(presenceChannelRef.current);
      presenceChannelRef.current = null;
    }
    const ch = supabase.channel(`sheet-collab:${sheetId}`, {
      config: {
        presence: { key: currentUser.id },
        broadcast: { self: false },
      },
    });
    ch
      .on("presence", { event: "sync" }, () => {
        const state = ch.presenceState<SheetPresence>();
        const cursors: typeof activeCursors = {};
        Object.entries(state).forEach(([uid, ps]) => {
          const presence = getLatestPresence(ps);
          if (uid !== currentUser.id && presence) cursors[uid] = presence;
        });
        setActiveCursors(cursors);
      })
      .on("presence", { event: "join" }, ({ key, newPresences }: any) => {
        if (key === currentUser.id) return;
        const presence = getLatestPresence(newPresences);
        if (presence) setActiveCursors((prev) => ({ ...prev, [key]: presence }));
      })
      .on("presence", { event: "leave" }, ({ key }: any) => {
        setActiveCursors((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      })
      .on("broadcast", { event: "sheet_snapshot" }, ({ payload }) => {
        applyBroadcastSnapshotRef.current(payload);
      })
      .on("broadcast", { event: "cell_selection" }, ({ payload }) => {
        applyRemoteCellSelectionRef.current(payload);
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          presenceChannelRef.current = ch;
          ch.track({
            name: currentUser.name,
            color: getMemberColor(currentUser.id),
            row: -1,
            col: "",
            selectedAt: Date.now(),
            email: currentUser.email,
            avatar_url: currentUser.avatar_url,
            role: sheetState.userRole ?? "viewer",
          });
        }
      });
    return () => {
      supabase.removeChannel(ch);
      presenceChannelRef.current = null;
    };
  }, [sheetId, isOrgSheet, currentUser?.id]);

  // Track my cursor in presence
  useEffect(() => {
    if (!presenceChannelRef.current || !currentUser || !selectedCell || !isOrgSheet) return;
    presenceChannelRef.current.track({
      name: currentUser.name,
      color: getMemberColor(currentUser.id),
      row: selectedCell.row,
      col: selectedCell.col,
      selectedAt: Date.now(),
      email: currentUser.email,
      avatar_url: currentUser.avatar_url,
      role: sheetState.userRole ?? "viewer",
    });
    presenceChannelRef.current.send({
      type: "broadcast",
      event: "cell_selection",
      payload: {
        userId: currentUser.id,
        name: currentUser.name,
        color: getMemberColor(currentUser.id),
        row: selectedCell.row,
        col: selectedCell.col,
        selectedAt: Date.now(),
        email: currentUser.email,
        avatar_url: currentUser.avatar_url,
        role: sheetState.userRole ?? "viewer",
      },
    });
  }, [
    selectedCell?.row,
    selectedCell?.col,
    currentUser?.id,
    currentUser?.name,
    currentUser?.email,
    currentUser?.avatar_url,
    isOrgSheet,
    sheetState.userRole,
  ]);

  // ── Derived / computed ─────────────────────────────────────────────────
  const effectiveRightPanel = useMemo((): RightPanelType => {
    if (!isOrgSheet && rightPanel === "collaborators") return null;
    return rightPanel;
  }, [isOrgSheet, rightPanel]);

  const activeSheetMembers = useMemo(() => {
    if (!isOrgSheet) return [];
    const byId = new Map(orgMembers.map((member) => [member.id, member]));
    const members: OrgMember[] = [];
    const addMember = (id: string, fallback: Partial<OrgMember>) => {
      if (members.some((member) => member.id === id)) return;
      const orgMember = byId.get(id);
      members.push({
        id,
        name: orgMember?.name ?? fallback.name ?? "Member",
        email: orgMember?.email ?? fallback.email ?? "",
        avatar_url: orgMember?.avatar_url ?? fallback.avatar_url ?? null,
        role: orgMember?.role ?? fallback.role ?? "viewer",
        status: "online",
        last_active_at: orgMember?.last_active_at ?? null,
      });
    };
    if (currentUser) {
      addMember(currentUser.id, {
        name: currentUser.name,
        email: currentUser.email,
        avatar_url: currentUser.avatar_url,
        role: sheetState.userRole ?? "viewer",
      });
    }
    Object.entries(activeCursors).forEach(([id, presence]) => {
      addMember(id, {
        name: presence.name,
        email: presence.email,
        avatar_url: presence.avatar_url,
        role: presence.role,
      });
    });
    return members;
  }, [activeCursors, currentUser, isOrgSheet, orgMembers, sheetState.userRole]);

  const activeSheetMemberIds = useMemo(
    () => new Set(activeSheetMembers.map((member) => member.id)),
    [activeSheetMembers],
  );

  const conditionalRules = useMemo<ConditionalFormatRule[]>(() => {
    const rules = columns.flatMap((col) => {
      const stored = col.conditional_formatting?.rules;
      return Array.isArray(stored) ? stored : [];
    });
    return Array.from(new Map(rules.map((rule) => [rule.id, rule])).values());
  }, [columns]);

  const normalizeDarkCellBackground = useCallback(
    (value: any) => {
      if (!isDark || !value) return value;
      const normalized = String(value).trim().toLowerCase().replace(/\s+/g, "");
      if (
        normalized === "#fff" ||
        normalized === "#ffffff" ||
        normalized === "white" ||
        normalized === "rgb(255,255,255)" ||
        normalized === "rgba(255,255,255,1)"
      ) {
        return undefined;
      }
      return value;
    },
    [isDark],
  );

  const getDarkLayoutBackground = useCallback(
    (rowIdx: number, format: CellFormat): string | undefined => {
      if (!isDark || !(rowIdx <= 1 || format.isLayoutRow)) return undefined;
      const bg = String(format.bgColor ?? "").trim().toLowerCase();
      const accent = String(format.textColor ?? "").trim().toLowerCase();
      if (!bg || !accent || !/^#[0-9a-f]{6}$/i.test(bg) || !/^#[0-9a-f]{6}$/i.test(accent)) {
        return undefined;
      }

      const blendToWhite = (hex: string, ratio: number) => {
        const clean = hex.replace("#", "");
        const rgb = [0, 2, 4].map((offset) => parseInt(clean.slice(offset, offset + 2), 16));
        return `#${rgb
          .map((c) => Math.round(c + (255 - c) * ratio).toString(16).padStart(2, "0"))
          .join("")}`.toLowerCase();
      };
      const defaultLayoutBg =
        rowIdx === 0 ? blendToWhite(accent, 0.9) : blendToWhite(accent, 0.94);

      if (bg !== defaultLayoutBg) return undefined;
      return rowIdx === 0 ? "#13201d" : "#182126";
    },
    [isDark],
  );

  const getEffectiveCellStyle = useCallback(
    (rowIdx: number, colKey: string, row: SheetRow): React.CSSProperties => {
      const cellFormatKey = `${rowIdx}-${colKey}`;
      const cellFormat = formatting.cellFormats[cellFormatKey] || {};
      const rowFormat = formatting.cellFormats[`row:${row.id}`] || {};
      const format = { ...rowFormat, ...cellFormat };
      const isWrapEnabled = textWrap.textWrapColumns.has(colKey);

      const base: React.CSSProperties = {
        whiteSpace: isWrapEnabled ? "pre-wrap" : "nowrap",
        wordBreak: isWrapEnabled ? "break-word" : "normal",
        overflow: isWrapEnabled ? "visible" : "hidden",
        textOverflow: isWrapEnabled ? "clip" : "ellipsis",
        backgroundColor: format.bgColor || undefined,
        ...(format.bgColor ? {
          borderRightColor: format.bgColor,
          borderBottomColor: format.bgColor,
        } : {}),
        textAlign: (format.align as any) || undefined,
        fontFamily: format.fontFamily || "inherit",
        fontWeight: format.bold ? 700 : "inherit",
        fontStyle: format.italic ? "italic" : "inherit",
        fontSize: format.fontSize ? `${format.fontSize}px` : "inherit",
        color: format.textColor || "inherit",
        textDecoration:
          [
            format.underline && "underline",
            format.strikethrough && "line-through",
          ]
            .filter(Boolean)
            .join(" ") || "inherit",
        ...(format.borderStyle && format.borderStyle !== "none"
          ? {
            borderStyle: format.borderStyle,
            borderWidth: `${format.borderWidth ?? 1}px`,
            borderColor: format.borderColor || "#d1d5db",
            borderTop: `${format.borderWidth ?? 1}px ${format.borderStyle} ${format.borderColor || "#d1d5db"}`,
            borderLeft: `${format.borderWidth ?? 1}px ${format.borderStyle} ${format.borderColor || "#d1d5db"}`,
            borderRight: `${format.borderWidth ?? 1}px ${format.borderStyle} ${format.borderColor || "#d1d5db"}`,
            borderBottom: `${format.borderWidth ?? 1}px ${format.borderStyle} ${format.borderColor || "#d1d5db"}`,
          }
          : {
            borderStyle: format.borderStyle || undefined,
            borderBottom: format.borderBottom || undefined,
            borderTop: format.borderTop || undefined,
            borderLeft: format.borderLeft || undefined,
            borderRight: format.borderRight || undefined,
          }),
      };

      const colIdx = columns.findIndex((col) => col.key === colKey);
      const columnFormat = columns[colIdx]?.conditional_formatting?.columnFormat ?? {};
      const conditionalFormat = conditionalRules
        .filter((rule) => isCellInConditionalRange(rule, rowIdx, colIdx))
        .filter((rule) => conditionalRuleMatches(rule, row[colKey]))
        .reduce<React.CSSProperties>(
          (style, rule) => ({
            ...style,
            backgroundColor: rule.format.bgColor ?? style.backgroundColor,
            color: rule.format.textColor ?? style.color,
            fontWeight: rule.format.bold ? 700 : style.fontWeight,
            fontStyle: rule.format.italic ? "italic" : style.fontStyle,
          }),
          {},
        );
      const resolved = {
        ...base,
        fontWeight: columnFormat.bold ? 700 : base.fontWeight,
        fontStyle: columnFormat.italic ? "italic" : base.fontStyle,
        fontFamily: columnFormat.fontFamily ?? base.fontFamily,
        fontSize: columnFormat.fontSize ? `${columnFormat.fontSize}px` : base.fontSize,
        color: columnFormat.textColor ?? base.color,
        backgroundColor: columnFormat.bgColor ?? base.backgroundColor,
        ...conditionalFormat,
      };
      const darkLayoutBackground = getDarkLayoutBackground(rowIdx, format);
      return {
        ...resolved,
        backgroundColor:
          darkLayoutBackground ??
          normalizeDarkCellBackground(resolved.backgroundColor),
      };
    },
    [
      columns,
      conditionalRules,
      formatting.cellFormats,
      getDarkLayoutBackground,
      normalizeDarkCellBackground,
      textWrap.textWrapColumns,
    ],
  );

  const filteredRows = useMemo<SheetRow[]>(() => {
    const activeRows = timeTravelState.previewRows || rows;
    const activeCols = timeTravelState.previewColumns || columns;
    const q = (searchQuery || filterValue).trim().toLowerCase();
    const activeRules = advancedFilters.filter((rule) => rule.columnKey);
    const matchingRows =
      !q && activeRules.length === 0
        ? activeRows
        : activeRows.filter((row) => {
          const matchesSearch =
            !q ||
            activeCols.some((col) => {
              const v = row[col.key];
              return v && String(v).toLowerCase().includes(q);
            });
          if (!matchesSearch) return false;
          return activeRules.every((rule) => {
            const col = activeCols.find((c) => c.key === rule.columnKey);
            const raw = row[rule.columnKey];
            const text = String(raw ?? "").trim();
            const target = rule.value.trim();
            if (rule.operator === "empty") return text === "";
            if (rule.operator === "not_empty") return text !== "";
            if (rule.operator === "contains")
              return text.toLowerCase().includes(target.toLowerCase());
            if (rule.operator === "equals")
              return text.toLowerCase() === target.toLowerCase();
            if (rule.operator === "not_equals")
              return text.toLowerCase() !== target.toLowerCase();
            const left =
              col?.type === "date" ? Date.parse(text) : Number(String(raw ?? ""));
            const right =
              col?.type === "date" ? Date.parse(target) : Number(target);
            if (Number.isNaN(left) || Number.isNaN(right)) return false;
            if (rule.operator === "gt") return left > right;
            if (rule.operator === "gte") return left >= right;
            if (rule.operator === "lt") return left < right;
            if (rule.operator === "lte") return left <= right;
            return true;
          });
        });
    const sourceIndex = new Map(activeRows.map((row, index) => [row.id, index]));
    return [...matchingRows].sort((a, b) => {
      if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
      return (sourceIndex.get(a.id) ?? 0) - (sourceIndex.get(b.id) ?? 0);
    });
  }, [
    rows, columns,
    timeTravelState.previewRows, timeTravelState.previewColumns,
    searchQuery, filterValue, advancedFilters,
  ]);

  const topFrozenRows = useMemo(
    () => (frozenRowsCount > 0 ? filteredRows.slice(0, frozenRowsCount) : []),
    [filteredRows, frozenRowsCount],
  );

  const gridRows = useMemo(
    () => (frozenRowsCount > 0 ? filteredRows.slice(frozenRowsCount) : filteredRows),
    [filteredRows, frozenRowsCount],
  );

  const filterColumns = useMemo(() => columns.filter((col) => !col.hidden), [columns]);

  const filterSuggestions = useMemo(() => {
    const map: Record<string, string[]> = {};
    const dataRows = timeTravelState.previewRows || rows;
    filterColumns.forEach((col) => {
      map[col.key] = Array.from(
        new Set(
          dataRows
            .map((row) => row[col.key])
            .filter((v) => v !== null && v !== undefined && v !== "")
            .map(String),
        ),
      ).slice(0, 24);
    });
    return map;
  }, [filterColumns, rows, timeTravelState.previewRows]);

  const builtInFilterViews = useMemo<SavedFilterView[]>(() => {
    const statusColumn = filterColumns.find((column) => {
      const name = column.name.toLowerCase();
      return (
        column.type === "status" ||
        name.includes("status") ||
        name.includes("complete")
      );
    });
    const assigneeColumn = filterColumns.find((column) => {
      const name = column.name.toLowerCase();
      return (
        name.includes("assign") || name.includes("owner") || name.includes("person")
      );
    });
    const views: SavedFilterView[] = [];
    if (statusColumn) {
      views.push({
        id: "system_completed",
        name: "Completed",
        filterValue: "",
        system: true,
        advancedFilters: [
          {
            id: "system_completed_rule",
            columnKey: statusColumn.key,
            operator: "equals",
            value: "Done",
          },
        ],
      });
    }
    if (assigneeColumn) {
      views.push({
        id: "system_assigned",
        name: "Assigned",
        filterValue: "",
        system: true,
        advancedFilters: [
          {
            id: "system_assigned_rule",
            columnKey: assigneeColumn.key,
            operator: "not_empty",
            value: "",
          },
        ],
      });
    }
    return views;
  }, [filterColumns]);

  const availableFilterViews = useMemo(
    () => [
      ...builtInFilterViews,
      ...savedViews.filter(
        (view) => !builtInFilterViews.some((builtIn) => builtIn.name === view.name),
      ),
    ],
    [builtInFilterViews, savedViews],
  );

  const totalComments = useMemo(() => {
    return Object.values(comments).reduce(
      (a, b) => a + b.filter((c) => !c.resolved).length,
      0,
    );
  }, [comments]);

  const mentionableMembers = useMemo(() => {
    if (!mentionState.active) return [];
    const q = mentionState.query.toLowerCase();
    return orgMembers
      .filter((m) => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q))
      .slice(0, 8);
  }, [mentionState.active, mentionState.query, orgMembers]);

  const selectedCellType = useMemo(() => {
    if (!selectedCell) return null;
    const col = columns.find((c) => c.key === selectedCell.col);
    return col
      ? cellTypes.getCellType(selectedCell.row, selectedCell.col, col.type || "text")
      : null;
  }, [selectedCell, columns, cellTypes.getCellType]);

  const isSelectedColumnWrapped = useMemo(
    () =>
      selectedCell
        ? textWrap.textWrapColumns.has(`${selectedCell.row}-${selectedCell.col}`)
        : false,
    [selectedCell, textWrap.textWrapColumns],
  );

  const isSelectedRowProtected = useMemo(() => {
    if (!selectedCell) {
      if (selectedRows && selectedRows.size > 0) {
        return Array.from(selectedRows).some((rowId) => protection.isRowProtected(rowId));
      }
      return false;
    }
    const rowId = rows[selectedCell.row]?.id;
    return rowId ? protection.isRowProtected(rowId) : false;
  }, [selectedCell, selectedRows, rows, protection.isRowProtected]);

  const getSuggestedChartPreset = useCallback(
    (kind: any) => {
      const usableCols = columns.filter((c) => !c.hidden);
      const labelCol = usableCols.find((c) =>
        ["text", "status", "priority", "select", "date"].includes(c.type ?? ""),
      );
      const numericCols = usableCols.filter((c) =>
        ["number", "currency", "progress", "percent"].includes(c.type ?? ""),
      );
      const preset: any = {};
      if (labelCol) preset.labelColumnKey = labelCol.key;
      if (kind === "pie" || kind === "donut" || kind === "radar") {
        preset.aggregateMode = "count";
        preset.seriesKeys = [];
      } else if (numericCols.length > 0) {
        preset.seriesKeys = [numericCols[0].key];
        preset.aggregateMode = "none";
      }
      return preset;
    },
    [columns],
  );

  const columnIndexByKey = useMemo(
    () => new Map(columns.map((column, index) => [column.key, index])),
    [columns],
  );

  const mergeByCell = useMemo(() => {
    const map = new Map<string, MergeInfo>();
    Object.entries(formatting.cellFormats).forEach(([cellKey, format]) => {
      if (isMergeInfo(format?.merge)) map.set(cellKey, format.merge);
    });
    return map;
  }, [formatting.cellFormats]);

  const autoOverflowByCell = useMemo(() => {
    const map = new Map<string, AutoOverflowInfo>();
    const visibleColumns = columns.filter((column) => !column.hidden);

    rows.forEach((row, rowIdx) => {
      if (rowIdx < 10) return;
      visibleColumns.forEach((column, visibleColIdx) => {
        const cellKey = `${rowIdx}-${column.key}`;
        if (textWrap.textWrapColumns.has(cellKey) || mergeByCell.has(cellKey)) return;
        const value = row[column.key];
        if (!shouldAutoOverflowValue(value)) return;

        const ownWidth = column.width ?? 160;
        const estimatedTextWidth = Math.ceil(String(value).length * 7.2) + 24;
        if (estimatedTextWidth <= ownWidth) return;

        let width = ownWidth;
        let colSpan = 1;
        const coveredKeys: string[] = [];

        for (
          let nextIdx = visibleColIdx + 1;
          nextIdx < visibleColumns.length && width < estimatedTextWidth;
          nextIdx += 1
        ) {
          const nextColumn = visibleColumns[nextIdx];
          const nextKey = `${rowIdx}-${nextColumn.key}`;
          if (textWrap.textWrapColumns.has(nextKey) || mergeByCell.has(nextKey)) break;
          const nextValue = row[nextColumn.key];
          if (
            nextValue !== undefined &&
            nextValue !== null &&
            String(nextValue) !== ""
          )
            break;
          width += nextColumn.width ?? 160;
          colSpan += 1;
          coveredKeys.push(nextKey);
        }

        if (colSpan <= 1) return;
        map.set(cellKey, { masterRow: rowIdx, masterCol: column.key, colSpan, width });
        coveredKeys.forEach((coveredKey) => {
          map.set(coveredKey, {
            masterRow: rowIdx,
            masterCol: column.key,
            colSpan,
            width,
            covered: true,
          });
        });
      });
    });

    return map;
  }, [columns, mergeByCell, rows, textWrap.textWrapColumns]);

  useEffect(() => {
    if (!sheetId || rows.length === 0 || columns.length === 0) return;
    if (autoMergeTimeoutRef.current) clearTimeout(autoMergeTimeoutRef.current);
    autoMergeTimeoutRef.current = setTimeout(async () => {
      const nextFormats: Record<string, CellFormat> = {};
      Object.entries(formatting.cellFormats).forEach(([cellKey, format]) => {
        if (format.merge?.auto) {
          const { merge: _merge, ...rest } = format;
          if (Object.keys(rest).length > 0) nextFormats[cellKey] = rest;
          return;
        }
        nextFormats[cellKey] = format;
      });

      const visibleColumns = columns.filter((column) => !column.hidden);
      const manualMergeKeys = new Set(
        Object.entries(nextFormats)
          .filter(([, format]) => format.merge && !format.merge.auto)
          .map(([cellKey]) => cellKey),
      );

      rows.forEach((row, rowIdx) => {
        if (rowIdx < 10) return; // skip template layout rows
        visibleColumns.forEach((column, visibleColIdx) => {
          const cellKey = `${rowIdx}-${column.key}`;
          if (textWrap.textWrapColumns.has(cellKey) || manualMergeKeys.has(cellKey)) return;
          if (textWrap.textWrapColumns.has(cellKey) || manualMergeKeys.has(cellKey)) return;
          const value = row[column.key];
          if (!shouldAutoOverflowValue(value)) return;
          const ownWidth = column.width ?? 160;
          const estimatedTextWidth = Math.ceil(String(value).length * 7.2) + 24;
          if (estimatedTextWidth <= ownWidth) return;

          let width = ownWidth;
          let colSpan = 1;
          for (
            let nextIdx = visibleColIdx + 1;
            nextIdx < visibleColumns.length && width < estimatedTextWidth;
            nextIdx += 1
          ) {
            const nextColumn = visibleColumns[nextIdx];
            const nextKey = `${rowIdx}-${nextColumn.key}`;
            if (textWrap.textWrapColumns.has(nextKey) || manualMergeKeys.has(nextKey)) break;
            const nextValue = row[nextColumn.key];
            if (nextValue !== undefined && nextValue !== null && String(nextValue) !== "") break;
            width += nextColumn.width ?? 160;
            colSpan += 1;
          }
          if (colSpan <= 1) return;
          const merge: MergeInfo = {
            masterRow: rowIdx,
            masterCol: column.key,
            rowSpan: 1,
            colSpan,
            mode: "across",
            auto: true,
          };
          for (let idx = 0; idx < colSpan; idx += 1) {
            const colKey = visibleColumns[visibleColIdx + idx]?.key;
            if (!colKey) continue;
            const key = `${rowIdx}-${colKey}`;
            nextFormats[key] =
              idx === 0
                ? { ...(nextFormats[key] ?? {}), merge }
                : { merge: { ...merge, hidden: true } };
          }
        });
      });

      if (JSON.stringify(nextFormats) === JSON.stringify(formatting.cellFormats)) return;
      formatting.setCellFormats(nextFormats);
      try {
        await saveAllCellFormats(sheetId, nextFormats);
        broadcastSheetSnapshot({ cellFormats: nextFormats });
      } catch {
        toast.error("Failed to save automatic text merge.");
      }
    }, 400);
    return () => {
      if (autoMergeTimeoutRef.current) clearTimeout(autoMergeTimeoutRef.current);
    };
  }, [
    sheetId,
    rows,
    columns,
    textWrap.textWrapColumns,
    formatting.cellFormats,
    formatting.setCellFormats,
    broadcastSheetSnapshot,
  ]);

  const selectedMergeInfo = useMemo(() => {
    if (!selectedCell) return null;
    const direct = mergeByCell.get(`${selectedCell.row}-${selectedCell.col}`);
    if (direct) return direct;
    if (!selectionRange) return null;
    const startRow = Math.min(selectionRange.start.row, selectionRange.end.row);
    const endRow = Math.max(selectionRange.start.row, selectionRange.end.row);
    const startCol = Math.min(selectionRange.start.colIndex, selectionRange.end.colIndex);
    const endCol = Math.max(selectionRange.start.colIndex, selectionRange.end.colIndex);
    for (let rowIdx = startRow; rowIdx <= endRow; rowIdx += 1) {
      for (let colIdx = startCol; colIdx <= endCol; colIdx += 1) {
        const colKey = columns[colIdx]?.key;
        if (!colKey) continue;
        const merge = mergeByCell.get(`${rowIdx}-${colKey}`);
        if (merge) return merge;
      }
    }
    return null;
  }, [columns, mergeByCell, selectedCell, selectionRange]);

  const canMergeSelection = useMemo(() => {
    if (!selectionRange) return false;
    const rowSpan =
      Math.abs(selectionRange.end.row - selectionRange.start.row) + 1;
    const colSpan =
      Math.abs(selectionRange.end.colIndex - selectionRange.start.colIndex) + 1;
    return rowSpan > 1 || colSpan > 1;
  }, [selectionRange]);

  const selectMergeBlock = useCallback(
    (merge: MergeInfo) => {
      const masterColIndex = columnIndexByKey.get(merge.masterCol);
      if (masterColIndex === undefined) return;
      setSelectedColumnKey(null);
      setSelectedCell({ row: merge.masterRow, col: merge.masterCol });
      setSelectionRange({
        start: { row: merge.masterRow, colIndex: masterColIndex },
        end: {
          row: merge.masterRow + merge.rowSpan - 1,
          colIndex: masterColIndex + merge.colSpan - 1,
        },
      });
      setActiveCommentCell(`${merge.masterRow}-${merge.masterCol}`);
    },
    [columnIndexByKey, setSelectedColumnKey, setSelectedCell, setSelectionRange, setActiveCommentCell],
  );

  const clearMergeFormatsInRange = useCallback(
    (
      nextFormats: Record<string, CellFormat>,
      startRow: number,
      endRow: number,
      startCol: number,
      endCol: number,
    ) => {
      const mergeKeys = new Set<string>();
      for (let rowIdx = startRow; rowIdx <= endRow; rowIdx += 1) {
        for (let colIdx = startCol; colIdx <= endCol; colIdx += 1) {
          const colKey = columns[colIdx]?.key;
          if (!colKey) continue;
          const merge = mergeByCell.get(`${rowIdx}-${colKey}`);
          if (!merge) continue;
          const masterColIndex = columnIndexByKey.get(merge.masterCol);
          if (masterColIndex === undefined) continue;
          for (let mr = merge.masterRow; mr < merge.masterRow + merge.rowSpan; mr += 1) {
            for (let mc = masterColIndex; mc < masterColIndex + merge.colSpan; mc += 1) {
              const mergedColKey = columns[mc]?.key;
              if (mergedColKey) mergeKeys.add(`${mr}-${mergedColKey}`);
            }
          }
        }
      }
      mergeKeys.forEach((cellKey) => {
        const { merge: _merge, ...rest } = nextFormats[cellKey] ?? {};
        if (Object.keys(rest).length > 0) nextFormats[cellKey] = rest;
        else delete nextFormats[cellKey];
      });
    },
    [columnIndexByKey, columns, mergeByCell],
  );

  const persistCellFormatMap = useCallback(
    async (nextFormats: Record<string, CellFormat>) => {
      formatting.setCellFormats(nextFormats);
      markSaving();
      try {
        await saveAllCellFormats(sheetId, nextFormats);
        broadcastSheetSnapshot({ cellFormats: nextFormats });
        markSaved();
      } catch {
        setSaveStatus("saved");
        toast.error("Failed to save cell formatting.");
      }
    },
    [
      broadcastSheetSnapshot,
      formatting.setCellFormats,
      markSaved,
      markSaving,
      setSaveStatus,
      sheetId,
    ],
  );

  // ── Merge / unmerge ────────────────────────────────────────────────────
  const handleMergeSelection = useCallback(
    async (mode: MergeMode = "all") => {
      if (!canEditSheet) {
        showViewerEditMessage();
        return;
      }
      if (!selectionRange || !canMergeSelection) {
        toast.info("Select two or more cells to merge.");
        return;
      }
      const startRow = Math.min(selectionRange.start.row, selectionRange.end.row);
      const endRow = Math.max(selectionRange.start.row, selectionRange.end.row);
      const startCol = Math.min(selectionRange.start.colIndex, selectionRange.end.colIndex);
      const endCol = Math.max(selectionRange.start.colIndex, selectionRange.end.colIndex);
      const selectedRowSpan = endRow - startRow + 1;
      const selectedColSpan = endCol - startCol + 1;
      if (mode === "across" && selectedColSpan < 2) {
        toast.info("Select two or more columns to merge across.");
        return;
      }
      if (mode === "down" && selectedRowSpan < 2) {
        toast.info("Select two or more rows to merge down.");
        return;
      }
      const nextFormats: Record<string, CellFormat> = { ...formatting.cellFormats };
      clearMergeFormatsInRange(nextFormats, startRow, endRow, startCol, endCol);

      const applyMergeBlock = (
        masterRow: number,
        masterColIndex: number,
        rowSpan: number,
        colSpan: number,
      ) => {
        const masterCol = columns[masterColIndex]?.key;
        if (!masterCol || rowSpan < 1 || colSpan < 1 || (rowSpan === 1 && colSpan === 1))
          return;
        const merge: MergeInfo = { masterRow, masterCol, rowSpan, colSpan, mode };
        for (let rowIdx = masterRow; rowIdx < masterRow + rowSpan; rowIdx += 1) {
          for (
            let colIdx = masterColIndex;
            colIdx < masterColIndex + colSpan;
            colIdx += 1
          ) {
            const colKey = columns[colIdx]?.key;
            if (!colKey) continue;
            const cellKey = `${rowIdx}-${colKey}`;
            const isMaster = rowIdx === masterRow && colIdx === masterColIndex;
            if (isMaster) {
              const existingFormat = nextFormats[cellKey] ?? {};
              nextFormats[cellKey] = {
                ...existingFormat,
                ...(mode === "center" ? { align: "center" } : {}),
                merge,
              };
            } else {
              nextFormats[cellKey] = { merge: { ...merge, hidden: true } };
            }
          }
        }
      };

      if (mode === "across") {
        for (let rowIdx = startRow; rowIdx <= endRow; rowIdx += 1) {
          applyMergeBlock(rowIdx, startCol, 1, selectedColSpan);
        }
      } else if (mode === "down") {
        for (let colIdx = startCol; colIdx <= endCol; colIdx += 1) {
          applyMergeBlock(startRow, colIdx, selectedRowSpan, 1);
        }
      } else {
        applyMergeBlock(startRow, startCol, selectedRowSpan, selectedColSpan);
      }

      await persistCellFormatMap(nextFormats);
      const masterCol = columns[startCol]?.key;
      if (masterCol) {
        setSelectedCell({ row: startRow, col: masterCol });
        setSelectionRange({
          start: { row: startRow, colIndex: startCol },
          end: {
            row: mode === "across" ? startRow : endRow,
            colIndex: mode === "down" ? startCol : endCol,
          },
        });
      }
      toast.success(mode === "center" ? "Cells merged and centered" : "Cells merged");
    },
    [
      canEditSheet, showViewerEditMessage, selectionRange, canMergeSelection,
      columns, formatting.cellFormats, clearMergeFormatsInRange,
      persistCellFormatMap, setSelectedCell, setSelectionRange,
    ],
  );

  const handleUnmergeSelection = useCallback(async () => {
    if (!canEditSheet) {
      showViewerEditMessage();
      return;
    }
    const merge = selectedMergeInfo;
    if (!merge) {
      toast.info("Select a merged cell first.");
      return;
    }
    const masterColIndex = columnIndexByKey.get(merge.masterCol);
    if (masterColIndex === undefined) return;
    const nextFormats: Record<string, CellFormat> = { ...formatting.cellFormats };
    for (let rowIdx = merge.masterRow; rowIdx < merge.masterRow + merge.rowSpan; rowIdx += 1) {
      for (
        let colIdx = masterColIndex;
        colIdx < masterColIndex + merge.colSpan;
        colIdx += 1
      ) {
        const colKey = columns[colIdx]?.key;
        if (!colKey) continue;
        const cellKey = `${rowIdx}-${colKey}`;
        const { merge: _merge, ...rest } = nextFormats[cellKey] ?? {};
        if (Object.keys(rest).length > 0) nextFormats[cellKey] = rest;
        else delete nextFormats[cellKey];
      }
    }
    await persistCellFormatMap(nextFormats);
    toast.success("Cells unmerged");
  }, [
    canEditSheet, showViewerEditMessage, selectedMergeInfo, columnIndexByKey,
    formatting.cellFormats, columns, persistCellFormatMap,
  ]);

  // ── Handlers ───────────────────────────────────────────────────────────
  const handleTitleChange = useCallback(
    (t: string) => {
      if (!canEditSheet) {
        showViewerEditMessage();
        return;
      }
      // Only update state — blur will handle saving
      setSheetState((p) => ({ ...p, title: t }));
    },
    [canEditSheet, showViewerEditMessage],
  );

  const handleTitleBlur = useCallback(
    async (t: string) => {
      if (!canEditSheet) return;
      const trimmed = t.trim();
      if (!trimmed) return;

      // 1. Save title to sheets table
      try {
        const { error } = await supabase
          .from("sheets")
          .update({ title: trimmed, updated_at: new Date().toISOString() })
          .eq("id", sheetId);

        if (error) {
          console.error("Title save error:", error);
          toast.error("Failed to save title");
          return;
        }
      } catch (err) {
        console.error("Title save failed:", err);
        toast.error("Failed to save title");
        return;
      }

      // 2. Update local state
      setSheetState((p) => ({ ...p, title: trimmed }));
      markSaved();
      broadcastSheetSnapshot({ title: trimmed });

      // 3. Also update row 0 cell if template sheet
      const firstCol = columns.find((c) => !c.isExtra);
      if (!firstCol) return;
      const currentRows = rowsHistory.currentState;
      const nextRows = currentRows.map((row, idx) =>
        idx !== 0 ? row : { ...row, [firstCol.key]: trimmed.toUpperCase() }
      );
      rowsHistory.pushState(nextRows);
      setSheetState((p) => ({ ...p, rows: nextRows }));
      await saveAllRows(sheetId, nextRows).catch(console.error);
    },
    [canEditSheet, columns, rowsHistory, sheetId, setSheetState, markSaved, broadcastSheetSnapshot],
  );

  const handleStarredToggle = useCallback(async () => {
    setSheetState((p) => {
      const n = !p.starred;
      updateSheetStarred(sheetId, n);
      return { ...p, starred: n };
    });
  }, [sheetId]);

  const handleApplyColumnFormat = useCallback(
    async (columnKey: string, formatUpdate: Partial<CellFormat>) => {
      const nextColumns = columns.map((col) => {
        if (col.key !== columnKey) return col;
        return {
          ...col,
          conditional_formatting: {
            ...(col.conditional_formatting ?? {}),
            columnFormat: {
              ...(col.conditional_formatting?.columnFormat ?? {}),
              ...formatUpdate,
            },
          },
        };
      });
      await sheetColOps.persistColumns(nextColumns);
      broadcastSheetSnapshot({ columns: nextColumns });
    },
    [columns, sheetColOps.persistColumns, broadcastSheetSnapshot],
  );

  const getCellAndRowFormat = useCallback(
    (selectedCell: { row: number; col: string } | null): CellFormat => {
      if (!selectedCell) {
        if (selectedRows && selectedRows.size > 0) {
          const firstRowId = Array.from(selectedRows)[0];
          return formatting.cellFormats[`row:${firstRowId}`] || {};
        }
        return {};
      }
      const cellKey = `${selectedCell.row}-${selectedCell.col}`;
      const cellFormat = formatting.cellFormats[cellKey] || {};
      const rowId = rows[selectedCell.row]?.id;
      const rowFormat = rowId ? (formatting.cellFormats[`row:${rowId}`] || {}) : {};
      return { ...rowFormat, ...cellFormat };
    },
    [formatting.cellFormats, rows, selectedRows],
  );

  const handleFormatChange = useCallback(
    async (format: any) => {
      if (!canEditSheet) {
        showViewerEditMessage();
        return;
      }

      // If we have selected rows, format all cells in those rows
      if (selectedRows && selectedRows.size > 0) {
        const ops: Promise<any>[] = [];
        const updatedFormats = { ...formatting.cellFormats };

        for (const rowId of Array.from(selectedRows)) {
          const rowIdx = rows.findIndex((row) => row.id === rowId);
          const rowKey = `row:${rowId}`;
          const currentFormat = formatting.cellFormats[rowKey] || {};
          const merged = { ...currentFormat, ...format };
          updatedFormats[rowKey] = merged;
          ops.push(saveCellFormat(sheetId, rowKey, merged));

          if (rowIdx >= 0) {
            for (const col of columns) {
              const cellKey = `${rowIdx}-${col.key}`;
              const cellFormat = formatting.cellFormats[cellKey] || {};
              const nextCellFormat = { ...cellFormat, ...format };
              updatedFormats[cellKey] = nextCellFormat;
              ops.push(saveCellFormat(sheetId, cellKey, nextCellFormat));
            }
          }
        }

        formatting.setCellFormats(updatedFormats);
        markSaving();
        try {
          await Promise.all(ops);
          // toast.success("Applied format to selected row(s)");
        } catch {
          toast.error("Failed to persist some formats.");
        }
        broadcastSheetSnapshot({ cellFormats: updatedFormats });
        markSaved();
        return;
      }

      if (selectedColumnKey) {
        await handleApplyColumnFormat(selectedColumnKey, format);
        // toast.success("Applied format to entire column");
        return;
      }

      if (selectionRange) {
        const startRow = Math.min(selectionRange.start.row, selectionRange.end.row);
        const endRow = Math.max(selectionRange.start.row, selectionRange.end.row);
        const startCol = Math.min(
          selectionRange.start.colIndex,
          selectionRange.end.colIndex,
        );
        const endCol = Math.max(selectionRange.start.colIndex, selectionRange.end.colIndex);
        const ops: Promise<any>[] = [];
        for (let r = startRow; r <= endRow; r++) {
          for (let c = startCol; c <= endCol; c++) {
            const colKey = columns[c]?.key;
            if (!colKey) continue;
            const cellPos = { row: r, col: colKey } as any;
            formatting.applyFormat(cellPos, format);
            const merged = { ...formatting.getCurrentCellFormat(cellPos), ...format };
            const cellKey = `${r}-${colKey}`;
            ops.push(saveCellFormat(sheetId, cellKey, merged));
          }
        }
        markSaving();
        try {
          await Promise.all(ops);
        } catch {
          toast.error("Failed to persist some formats.");
        }
        markSaved();
        return;
      }

      if (!selectedCell) return;
      formatting.applyFormat(selectedCell, format);
      const merged = { ...formatting.getCurrentCellFormat(selectedCell), ...format };
      const cellKey = `${selectedCell.row}-${selectedCell.col}`;
      markSaving();
      await saveCellFormat(sheetId, cellKey, merged);
      broadcastSheetSnapshot({ cellFormats: formatting.cellFormats });
      markSaved();
    },
    [
      canEditSheet, showViewerEditMessage, selectedCell, selectionRange, sheetId,
      markSaving, markSaved, formatting.applyFormat, formatting.getCurrentCellFormat,
      formatting.setCellFormats, columns, selectedColumnKey, handleApplyColumnFormat,
      selectedRows, rows, formatting.cellFormats, saveCellFormat, broadcastSheetSnapshot,
    ],
  );

  const handleMakeSheetBorderless = useCallback(async () => {
    if (!canEditSheet) {
      showViewerEditMessage();
      return;
    }

    const isBorderless = formatting.cellFormats["sheet:all"]?.borderStyle === "none";

    const sheetFormat: CellFormat = {
      ...(formatting.cellFormats["sheet:all"] || {}),
      borderStyle: isBorderless ? "solid" : "none",
    };
    const updatedFormats = {
      ...formatting.cellFormats,
      "sheet:all": sheetFormat,
    };

    formatting.setCellFormats(updatedFormats);
    markSaving();
    try {
      await saveCellFormat(sheetId, "sheet:all", sheetFormat);
      broadcastSheetSnapshot({ cellFormats: updatedFormats });
      // toast.success(isBorderless ? "Sheet borders restored" : "Sheet borders hidden");
      markSaved();
    } catch {
      toast.error("Failed to save borderless sheet setting.");
      setSaveStatus("saved");
    }
  }, [
    canEditSheet,
    showViewerEditMessage,
    formatting,
    markSaving,
    markSaved,
    saveCellFormat,
    sheetId,
    broadcastSheetSnapshot,
    setSaveStatus,
  ]);

  const handleSmartCopy = useCallback(() => {
    if (!selectedCell) return;
    const cellKey = `${selectedCell.row}-${selectedCell.col}`;
    smartClipboardRef.current = {
      value: rows[selectedCell.row]?.[selectedCell.col],
      formula:
        formulas.formulas[cellKey] ?? formulas.columnFormulas[selectedCell.col],
      format: formatting.cellFormats[cellKey],
      source: selectedCell,
    };
    clipboard.copyCellOrRange(selectedCell);
  }, [
    selectedCell, rows, formulas.formulas, formulas.columnFormulas,
    formatting.cellFormats, clipboard.copyCellOrRange,
  ]);

  const handlePaste = useCallback(async () => {
    if (!canEditSheet) {
      showViewerEditMessage();
      return;
    }
    if (selectedCell) {
      const rowId = rows[selectedCell.row]?.id;
      if (rowId && protection.isRowProtected(rowId)) {
        toast.error("This row is protected");
        return;
      }
    }

    if (selectedCell && navigator.clipboard?.readText) {
      try {
        const externalText = await navigator.clipboard.readText();
        const internalPayload = smartClipboardRef.current;
        const internalVal = String(internalPayload?.value ?? "");
        if (externalText && externalText !== internalVal) {
          const nextRows = rows.map((row, idx) =>
            idx === selectedCell.row
              ? { ...row, [selectedCell.col]: externalText }
              : row,
          );
          rowsHistory.pushState(nextRows);
          setSheetState((prev) => ({ ...prev, rows: nextRows }));
          markSaving();
          await saveAllRows(sheetId, nextRows);
          markSaved();
          return;
        }
      } catch {
        // Clipboard permission denied — fall through to internal paste
      }
    }

    const payload = smartClipboardRef.current;
    if (selectedCell && payload) {
      const cellKey = `${selectedCell.row}-${selectedCell.col}`;
      const nextRows = rows.map((row, idx) =>
        idx === selectedCell.row ? { ...row, [selectedCell.col]: payload.value } : row,
      );
      rowsHistory.pushState(nextRows);
      setSheetState((prev) => ({ ...prev, rows: nextRows }));
      const nextFormulas = { ...formulas.formulas };
      if (payload.formula?.startsWith("=")) nextFormulas[cellKey] = payload.formula;
      else delete nextFormulas[cellKey];
      formulas.setFormulas(nextFormulas);
      if (payload.format) formatting.applyFormat(selectedCell, payload.format);
      try {
        markSaving();
        await Promise.all([
          saveAllRows(sheetId, nextRows),
          payload.formula?.startsWith("=")
            ? saveFormula(sheetId, cellKey, payload.formula)
            : deleteFormula(sheetId, cellKey).catch(() => { }),
          payload.format
            ? saveCellFormat(sheetId, cellKey, payload.format)
            : Promise.resolve(),
        ]);
        markSaved();
        toast.success("Pasted value, formula, and formatting");
      } catch {
        toast.error("Paste saved locally but failed to persist.");
        setSaveStatus("saved");
      }
      return;
    }
    clipboard.pasteCellOrRange(selectedCell);
    setTimeout(async () => {
      try {
        markSaving();
        await saveAllRows(sheetId, rowsHistory.currentState);
        markSaved();
      } catch {
        toast.error("Paste saved locally but failed to persist.");
        setSaveStatus("saved");
      }
    }, 50);
  }, [
    canEditSheet, showViewerEditMessage, clipboard.pasteCellOrRange, selectedCell,
    rows, protection.isRowProtected, sheetId, rowsHistory, markSaving, markSaved,
    setSaveStatus, formulas, formatting, setSheetState,
  ]);

  const onCellPointerDown = useCallback(
    (rowIdx: number, colKey: string, e: React.PointerEvent) => {
      e.preventDefault();
      setSelectedColumnKey(null);
      const colIndex = columns.findIndex((c) => c.key === colKey);
      if (colIndex === -1) return;
      selectionAnchorRef.current = { row: rowIdx, colIndex };
      setSelectionRange({ start: { row: rowIdx, colIndex }, end: { row: rowIdx, colIndex } });
      isDraggingRef.current = true;
      const onUp = () => {
        isDraggingRef.current = false;
        selectionAnchorRef.current = null;
        window.removeEventListener("pointerup", onUp);
      };
      window.addEventListener("pointerup", onUp);
    },
    [columns],
  );

  const onCellPointerEnter = useCallback(
    (rowIdx: number, colKey: string) => {
      if (!isDraggingRef.current || !selectionAnchorRef.current) return;
      const colIndex = columns.findIndex((c) => c.key === colKey);
      if (colIndex === -1) return;
      setSelectionRange({
        start: selectionAnchorRef.current,
        end: { row: rowIdx, colIndex },
      });
    },
    [columns],
  );

  const buildFillValue = useCallback((base: any, offset: number, step = 1) => {
    const raw = String(base ?? "");
    const numeric = Number(raw);
    if (raw !== "" && !Number.isNaN(numeric)) return numeric + offset * step;

    const date = new Date(raw);
    if (raw && !Number.isNaN(date.getTime()) && /^\d{4}-\d{2}-\d{2}/.test(raw)) {
      const next = new Date(date);
      next.setDate(next.getDate() + offset * step);
      return next.toISOString().slice(0, 10);
    }

    const match = raw.match(/^(.*?)(\d+)$/);
    if (match) {
      const prefix = match[1];
      const start = Number(match[2]);
      const width = match[2].length;
      return `${prefix}${String(start + offset * step).padStart(width, "0")}`;
    }
    return base;
  }, []);

  const validateRows = useCallback(
    (nextRows: SheetRow[], prevRows: SheetRow[]) => {
      for (let rowIdx = 0; rowIdx < nextRows.length; rowIdx += 1) {
        const row = nextRows[rowIdx];
        const previous = prevRows.find((item) => item.id === row.id);
        for (const column of columns) {
          const rules = column.validation_rules;
          if (!rules) continue;
          const value = row[column.key];
          const previousValue = previous?.[column.key];
          if (value === previousValue) continue;
          const failure = getCellValidationFailure(
            rules, value, rowIdx, column.name, nextRows, columns,
          );
          if (failure?.action === "reject") {
            return { ok: false, message: failure.message };
          }
        }
      }
      return { ok: true, message: "" };
    },
    [columns],
  );

  const applyFill = useCallback(
    async (startRow: number, endRow: number, colKey: string) => {
      if (endRow <= startRow) return;
      const base = rows[startRow]?.[colKey];
      const previous = rows[startRow - 1]?.[colKey];
      const numericStep =
        previous !== undefined &&
          !Number.isNaN(Number(base)) &&
          !Number.isNaN(Number(previous))
          ? Number(base) - Number(previous)
          : 1;
      const dateStep = (() => {
        if (previous === undefined) return 1;
        const baseDate = new Date(String(base));
        const previousDate = new Date(String(previous));
        if (
          Number.isNaN(baseDate.getTime()) ||
          Number.isNaN(previousDate.getTime()) ||
          !/^\d{4}-\d{2}-\d{2}/.test(String(base)) ||
          !/^\d{4}-\d{2}-\d{2}/.test(String(previous))
        ) {
          return 1;
        }
        return Math.max(
          1,
          Math.round((baseDate.getTime() - previousDate.getTime()) / 86400000),
        );
      })();
      const textStep = (() => {
        const baseMatch = String(base ?? "").match(/^(.*?)(\d+)$/);
        const previousMatch = String(previous ?? "").match(/^(.*?)(\d+)$/);
        if (!baseMatch || !previousMatch || baseMatch[1] !== previousMatch[1]) return 1;
        return Number(baseMatch[2]) - Number(previousMatch[2]) || 1;
      })();
      const step = !Number.isNaN(Number(base))
        ? numericStep || 1
        : /^\d{4}-\d{2}-\d{2}/.test(String(base))
          ? dateStep
          : textStep;
      const nextRows = rows.map((row, idx) => {
        if (idx <= startRow || idx > endRow) return row;
        if (protection.isRowProtected(row.id)) return row;
        return { ...row, [colKey]: buildFillValue(base, idx - startRow, step) };
      });
      const validation = validateRows(nextRows, rows);
      if (!validation.ok) {
        toast.error(validation.message);
        return;
      }
      rowsHistory.pushState(nextRows);
      setSheetState((prev) => ({ ...prev, rows: nextRows }));
      markSaving();
      try {
        await saveAllRows(sheetId, nextRows);
        toast.success("Series filled");
      } catch {
        toast.error("Fill saved locally but failed to persist.");
      } finally {
        markSaved();
      }
    },
    [
      rows, protection.isRowProtected, buildFillValue, validateRows,
      rowsHistory, setSheetState, markSaving, markSaved, sheetId,
    ],
  );

  const onFillStart = useCallback(
    (rowIdx: number, colKey: string, e: React.PointerEvent) => {
      fillDragRef.current = { row: rowIdx, colKey, pointerId: e.pointerId };
      const onMove = (event: PointerEvent) => {
        const target = document.elementFromPoint(event.clientX, event.clientY);
        const rowAttr = target
          ?.closest("[data-fill-row]")
          ?.getAttribute("data-fill-row");
        if (!rowAttr) return;
        const endRow = Number(rowAttr);
        const colIndex = columns.findIndex((column) => column.key === colKey);
        if (Number.isFinite(endRow) && colIndex >= 0) {
          fillTargetRowRef.current = endRow;
          setSelectionRange({
            start: { row: rowIdx, colIndex },
            end: { row: endRow, colIndex },
          });
        }
      };
      const onUp = () => {
        const endRow = fillTargetRowRef.current ?? rowIdx;
        applyFill(rowIdx, Math.max(rowIdx, endRow), colKey);
        fillDragRef.current = null;
        fillTargetRowRef.current = null;
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [applyFill, columns],
  );

  const handleToggleRowProtection = useCallback(async () => {
    if (!canProtectRows) {
      toast.error("Only the sheet owner can protect rows.");
      return;
    }
    const targetRowIds: string[] = [];
    if (selectedCell) {
      const row = rows[selectedCell.row];
      if (row) targetRowIds.push(row.id);
    } else if (selectedRows && selectedRows.size > 0) {
      targetRowIds.push(...Array.from(selectedRows));
    }

    if (targetRowIds.length === 0) {
      toast.info("Select a row first to protect it");
      return;
    }

    markSaving();
    const nextSet = new Set(protection.protectedCells);
    try {
      const firstRowId = targetRowIds[0];
      const shouldProtect = !protection.isRowProtected(firstRowId);

      const ops = targetRowIds.map(async (rowId) => {
        const rowKey = protection.getRowKey(rowId);
        if (shouldProtect) {
          nextSet.add(rowKey);
          await protectRow(sheetId, rowKey);
        } else {
          nextSet.delete(rowKey);
          await unprotectRow(sheetId, rowKey);
        }
      });

      await Promise.all(ops);
      protection.setProtectedCells(nextSet);
      toast.success(shouldProtect ? `${targetRowIds.length} row(s) protected` : `${targetRowIds.length} row(s) unlocked`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update row protection.");
    } finally {
      markSaved();
    }
  }, [canProtectRows, selectedCell, selectedRows, rows, protection, sheetId, markSaving, markSaved]);

  const handleTextWrapToggle = useCallback(async () => {
    if (!selectedCell) return;
    const cellKey = `${selectedCell.row}-${selectedCell.col}`;
    const newWrapSet = new Set(textWrap.textWrapColumns);
    if (newWrapSet.has(cellKey)) newWrapSet.delete(cellKey);
    else newWrapSet.add(cellKey);
    textWrap.toggleTextWrap(cellKey);
    setTimeout(async () => {
      try {
        markSaving();
        await saveCellFormat(sheetId, cellKey, {
          ...formatting.getCurrentCellFormat(selectedCell),
          textWrap: newWrapSet.has(cellKey),
        });
        markSaved();
      } catch {
        toast.error("Text wrap failed to save.");
        setSaveStatus("saved");
      }
      broadcastSheetSnapshot({ textWrapColumns: [...newWrapSet] });
    }, 50);
  }, [selectedCell, textWrap, sheetId, formatting.getCurrentCellFormat, markSaving, markSaved]);

  const handleFormulaInsert = useCallback(
    async (example: string) => {
      if (!canEditSheet) {
        showViewerEditMessage();
        return;
      }
      if (!selectedCell) {
        toast.info("Select a cell first, then insert formula");
        return;
      }
      const rowId = rows[selectedCell.row]?.id;
      if (rowId && protection.isRowProtected(rowId)) {
        toast.error("This row is protected");
        return;
      }

      // Extract the formula the user actually typed — grab last valid =FUNC() segment
      // was this whole extractFormula function — DELETE IT ALL:
      const extractFormula = (input: string): string => {
        const trimmed = input.trim();
        if (!trimmed.toLowerCase().includes(' or ')) return trimmed;
        const parts = trimmed.split(/\s+or\s+/i).map((p) => p.trim());
        const valid = parts.filter((p) => p.startsWith('=') && p.includes('('));
        return valid[valid.length - 1] ?? parts[0];
      };
      const cleanFormula = example.trim();

      // REPLACE WITH just:

      const cellKey = `${selectedCell.row}-${selectedCell.col}`;
      const nextFormulas = { ...formulas.formulas, [cellKey]: cleanFormula };
      formulas.setFormulas(nextFormulas);
      markSaving();
      await saveFormula(sheetId, cellKey, cleanFormula);
      if (isOrgSheet) {
        const cl = String.fromCharCode(
          65 + columns.findIndex((c) => c.key === selectedCell.col),
        );
        logFormulaSet(sheetId, `${cl}${selectedCell.row + 1}`, cleanFormula);
      }
      markSaved();
      setShowFormulaDialog(false);
      broadcastSheetSnapshot({ formulas: nextFormulas });

      // Auto-resize the column to fit the formula text width
      const estimatedWidth = Math.max(160, cleanFormula.length * 8 + 32);
      const currentCol = columns.find((c) => c.key === selectedCell.col);
      if (currentCol && estimatedWidth > (currentCol.width ?? 160)) {
        const updatedColumns = columns.map((c) =>
          c.key === selectedCell.col ? { ...c, width: estimatedWidth } : c
        );
        columnsHistory.pushState(updatedColumns);
        setSheetState((p) => ({ ...p, columns: updatedColumns }));
        saveAllColumns(sheetId, updatedColumns).catch(console.error);
      }

      toast.success("Formula inserted");
    },
    [
      canEditSheet, showViewerEditMessage, selectedCell, rows,
      protection.isRowProtected, formulas.formulas, formulas.setFormulas,
      sheetId, markSaving, markSaved, isOrgSheet, columns, columnsHistory,
      setSheetState, broadcastSheetSnapshot,
    ],
  );

  const showAutomationNotification = useCallback((title: string, body: string) => {
    toast.info(body || title);
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission === "granted") {
      new Notification(title, { body: body || title, icon: "/icon.png" });
      return;
    }
    if (Notification.permission === "default") {
      Notification.requestPermission()
        .then((permission) => {
          if (permission === "granted") {
            new Notification(title, { body: body || title, icon: "/icon.png" });
          }
        })
        .catch(() => { });
    }
  }, []);

  const automationConditionMatches = useCallback(
    (rule: AutomationRule, row: SheetRow) => {
      const { columnKey, operator, value } = rule.condition;
      if (operator === "always") return true;
      const rawValue = row[columnKey];
      const current = String(rawValue ?? "").trim();
      const compare = String(value ?? "").trim();
      const currentLower = current.toLowerCase();
      const compareLower = compare.toLowerCase();
      const currentNumber = Number(current);
      const compareNumber = Number(compare);
      switch (operator) {
        case "equals": return currentLower === compareLower;
        case "not_equals": return currentLower !== compareLower;
        case "contains": return currentLower.includes(compareLower);
        case "empty": return current === "";
        case "not_empty": return current !== "";
        case "gt":
          return (
            !Number.isNaN(currentNumber) &&
            !Number.isNaN(compareNumber) &&
            currentNumber > compareNumber
          );
        case "gte":
          return (
            !Number.isNaN(currentNumber) &&
            !Number.isNaN(compareNumber) &&
            currentNumber >= compareNumber
          );
        case "lt":
          return (
            !Number.isNaN(currentNumber) &&
            !Number.isNaN(compareNumber) &&
            currentNumber < compareNumber
          );
        case "lte":
          return (
            !Number.isNaN(currentNumber) &&
            !Number.isNaN(compareNumber) &&
            currentNumber <= compareNumber
          );
        case "date_before_today": {
          const date = new Date(current);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return !Number.isNaN(date.getTime()) && date < today;
        }
        case "date_in_next_days": {
          const date = new Date(current);
          const days = Number(compare || 0);
          if (Number.isNaN(date.getTime()) || Number.isNaN(days)) return false;
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const limit = new Date(today);
          limit.setDate(limit.getDate() + days);
          return date >= today && date <= limit;
        }
        default: return false;
      }
    },
    [],
  );

  const buildAutomationSignature = useCallback(
    (rule: AutomationRule, row: SheetRow) => {
      const watchedValue =
        rule.condition.operator === "always"
          ? JSON.stringify(columns.map((column) => row[column.key] ?? ""))
          : String(row[rule.condition.columnKey] ?? "");
      return `${rule.id}:${rule.condition.operator}:${watchedValue}:${rule.actions
        .map(
          (action) =>
            `${action.type}:${action.columnKey ?? ""}:${action.value ?? ""}:${action.message ?? ""}`,
        )
        .join("|")}`;
    },
    [columns],
  );

  const runAutomationsForRows = useCallback(
    async (targetRows: SheetRow[], baseRows: SheetRow[] = rows) => {
      const activeRules = automationRules.filter(
        (rule) => rule.enabled && rule.actions.length > 0,
      );
      if (activeRules.length === 0 || targetRows.length === 0) return;

      let changed = false;
      let notificationCount = 0;
      const targetIds = new Set(targetRows.map((row) => row.id));
      const nextRows = baseRows.map((row) => {
        if (!targetIds.has(row.id) || protection.isRowProtected(row.id)) return row;
        let nextRow = row;
        const automationRuns: Record<string, string> = {
          ...(row._automationRuns ?? {}),
        };
        activeRules.forEach((rule) => {
          if (!automationConditionMatches(rule, nextRow)) return;
          const signature = buildAutomationSignature(rule, nextRow);
          if (automationRuns[rule.id] === signature) return;
          rule.actions.forEach((action) => {
            if (action.type === "notify") {
              const rowNumber = baseRows.findIndex((item) => item.id === row.id) + 1;
              showAutomationNotification(
                rule.name,
                action.message || `Automation matched row ${rowNumber}`,
              );
              notificationCount += 1;
            }
            if (action.type === "update_cell" && action.columnKey) {
              nextRow = { ...nextRow, [action.columnKey]: action.value ?? "" };
              changed = true;
            }
            if (action.type === "archive_row") {
              nextRow = {
                ...nextRow,
                _archived: true,
                status: nextRow.status === undefined ? "Archived" : nextRow.status,
              };
              changed = true;
            }
            if (action.type === "pin_row") {
              nextRow = { ...nextRow, pinned: true };
              changed = true;
            }
          });
          automationRuns[rule.id] = signature;
          nextRow = { ...nextRow, _automationRuns: automationRuns };
          changed = true;
        });
        return nextRow;
      });

      if (!changed) {
        if (notificationCount === 0) toast.info("No automation matched this row.");
        return;
      }

      const validation = validateRows(nextRows, baseRows);
      if (!validation.ok) {
        toast.error(`Automation blocked: ${validation.message}`);
        return;
      }

      rowsHistory.pushState(nextRows);
      setSheetState((prev) => ({ ...prev, rows: nextRows }));
      markSaving();
      try {
        await saveAllRows(sheetId, nextRows);
        toast.success("Automation applied");
      } catch {
        toast.error("Automation ran locally but failed to save.");
      } finally {
        markSaved();
      }
    },
    [
      automationRules, automationConditionMatches, buildAutomationSignature, rows,
      protection.isRowProtected, validateRows, rowsHistory, setSheetState,
      markSaving, sheetId, markSaved, showAutomationNotification,
    ],
  );

  const handleUpdateRow = useCallback(
    async (rowId: string, updates: Record<string, any>) => {
      const prevRow = rows.find((r) => r.id === rowId);
      const updatedRows = rows.map((row) =>
        row.id === rowId ? { ...row, ...updates } : row,
      );
      const validation = validateRows(updatedRows, rows);
      if (!validation.ok) {
        toast.error(validation.message);
        return;
      }
      rowsHistory.pushState(updatedRows);
      setSheetState((prev) => ({ ...prev, rows: updatedRows }));
      markSaving();
      try {
        await saveAllRows(sheetId, updatedRows);
        broadcastSheetSnapshot({ rows: updatedRows });
        toast.success("Row updated");
        if (isOrgSheet && prevRow) {
          Object.entries(updates).forEach(([key, newVal]) => {
            const oldVal = prevRow[key];
            if (oldVal !== newVal) {
              const col = columns.find((c) => c.key === key);
              if (col) {
                const colIdx = columns.findIndex((c) => c.key === key);
                const cl = String.fromCharCode(65 + colIdx);
                const rowIndex = rows.findIndex((r) => r.id === rowId);
                logCellEdit(
                  sheetId,
                  `${cl}${rowIndex + 1}`,
                  col.name,
                  oldVal ?? null,
                  newVal ?? null,
                  currentUser?.name ?? "You",
                  currentUser ? getMemberColor(currentUser.id) : "#0d7c5f",
                  currentUser?.id ?? "local",
                  rowId,
                );
              }
            }
          });
        }
        const updatedRow = updatedRows.find((r) => r.id === rowId);
        if (updatedRow) {
          setTimeout(() => {
            runAutomationsForRows([updatedRow], updatedRows).catch(() => { });
          }, 60);
        }
      } catch {
        toast.error("Failed to save row update.");
      } finally {
        markSaved();
      }
    },
    [
      rows, rowsHistory, setSheetState, sheetId, markSaving, markSaved,
      isOrgSheet, columns, currentUser,
    ],
  );

  const runAutomationsForRow = useCallback(
    async (row: SheetRow) => {
      if (!row) return;
      const statusColumn = columns.find((column) =>
        column.type === "status" ||
        /status|state|stage/i.test(`${column.key} ${column.name}`),
      );
      const statusKey = statusColumn?.key;
      const status = statusKey ? String(row[statusKey] ?? "").toLowerCase() : "";
      if (statusKey && ["done", "completed", "finished"].includes(status)) {
        if (status !== "archived") {
          await handleUpdateRow(row.id, { [statusKey]: "Archived" });
          toast.info(
            `Row ${rows.findIndex((r) => r.id === row.id) + 1} archived by automation`,
          );
          return;
        }
      }
      const dateCol = columns.find(
        (c) => c.type === "date" || /due|date|deadline/i.test(`${c.key} ${c.name}`),
      );
      if (dateCol) {
        const val = row[dateCol.key];
        if (val) {
          const d = new Date(String(val));
          if (!isNaN(d.getTime())) {
            const today = new Date();
            if (d < today && !row._reminderSent) {
              await handleUpdateRow(row.id, { _reminderSent: true });
              toast.info(
                `Automation: reminder for row ${rows.findIndex((r) => r.id === row.id) + 1}`,
              );
            }
          }
        }
      }
    },
    [columns, handleUpdateRow, rows],
  );

  const handleRangeSelect = useCallback(
    (
      startColKey: string,
      endColKey: string,
      startRow: number,
      endRow: number,
    ) => {
      const startColIdx = columns.findIndex((c) => c.key === startColKey);
      const endColIdx = columns.findIndex((c) => c.key === endColKey);
      if (startColIdx < 0 || endColIdx < 0) return;
      setSelectionRange({
        start: { row: startRow, colIndex: Math.min(startColIdx, endColIdx) },
        end: { row: endRow, colIndex: Math.max(startColIdx, endColIdx) },
      });
    },
    [columns],
  );

  const handleTogglePinRow = useCallback(async () => {
    const targetRows: SheetRow[] = [];
    if (selectedCell) {
      const row = rows[selectedCell.row];
      if (row) targetRows.push(row);
    } else if (selectedRows && selectedRows.size > 0) {
      targetRows.push(...rows.filter((r) => selectedRows.has(r.id)));
    }

    if (targetRows.length === 0) {
      toast.info("Select a row first");
      return;
    }

    const firstRow = targetRows[0];
    const newPinned = !(firstRow.pinned ?? false);
    const ops = targetRows.map((r) => handleUpdateRow(r.id, { pinned: newPinned }));
    await Promise.all(ops);
  }, [selectedCell, selectedRows, rows, handleUpdateRow]);

  const handleApplyFormulaToColumn = useCallback(
    async (columnKey: string, formula: string) => {
      if (!formula.startsWith("=")) {
        toast.error("Formula must start with =");
        return;
      }
      formulas.setColumnFormulas((p: any) => ({ ...p, [columnKey]: formula }));
      markSaving();
      await saveColumnFormula(sheetId, columnKey, formula);
      markSaved();
      broadcastSheetSnapshot({ columnFormulas: formulas.columnFormulas });
      toast.success(`Formula applied to entire "${columnKey}" column`);
    },
    [formulas.setColumnFormulas, sheetId, markSaving, markSaved],
  );

  const handleRemoveColumnFormula = useCallback(
    async (columnKey: string) => {
      formulas.setColumnFormulas((p: any) => {
        const n = { ...p };
        delete n[columnKey];
        return n;
      });
      markSaving();
      await deleteColumnFormula(sheetId, columnKey);
      markSaved();
      broadcastSheetSnapshot({ columnFormulas: formulas.columnFormulas });
      toast.success("Column formula removed");
    },
    [formulas.setColumnFormulas, sheetId, markSaving, markSaved],
  );

  const handleSaveConditionalRule = useCallback(
    async (rule: ConditionalFormatRule) => {
      const nextColumns = columns.map((col, colIdx) => {
        if (colIdx < rule.startCol || colIdx > rule.endCol) return col;
        const existing = Array.isArray(col.conditional_formatting?.rules)
          ? col.conditional_formatting.rules
          : [];
        return {
          ...col,
          conditional_formatting: {
            ...(col.conditional_formatting ?? {}),
            rules: [...existing.filter((item: any) => item.id !== rule.id), rule],
          },
        };
      });
      await sheetColOps.persistColumns(nextColumns);
      toast.success("Conditional formatting rule added.");
    },
    [columns, sheetColOps.persistColumns],
  );

  const handleDeleteConditionalRule = useCallback(
    async (ruleId: string) => {
      const nextColumns = columns.map((col) => {
        const existing = Array.isArray(col.conditional_formatting?.rules)
          ? col.conditional_formatting.rules
          : [];
        return {
          ...col,
          conditional_formatting: {
            ...(col.conditional_formatting ?? {}),
            rules: existing.filter(
              (rule: ConditionalFormatRule) => rule.id !== ruleId,
            ),
          },
        };
      });
      await sheetColOps.persistColumns(nextColumns);
    },
    [columns, sheetColOps.persistColumns],
  );

  const handleToggleFreezeColumn = useCallback(
    async (columnKey: string) => {
      const nextColumns = columns.map((column) =>
        column.key === columnKey
          ? { ...column, frozen: !column.frozen }
          : column,
      );
      await sheetColOps.persistColumns(nextColumns);
      toast.success(
        nextColumns.find((column) => column.key === columnKey)?.frozen
          ? "Column frozen"
          : "Column unfrozen",
      );
    },
    [columns, sheetColOps.persistColumns],
  );

  const handleToggleFreezeRows = useCallback(() => {
    const nextCount = frozenRowsCount > 0 ? 0 : 1;
    setFrozenRowsCount(nextCount);
    if (sheetId && typeof window !== "undefined") {
      window.localStorage.setItem(
        `sheetsync:${sheetId}:frozen-rows`,
        String(nextCount),
      );
    }
    toast.success(nextCount > 0 ? "Top row frozen" : "Rows unfrozen");
  }, [frozenRowsCount, sheetId]);

  const handleApplyValidation = useCallback(
    async (columnKey: string, rules: any) => {
      const applyTo: ValidationApplyRange = rules?._applyTo ?? {
        startColKey: columnKey,
        endColKey: columnKey,
        startRow: 0,
        endRow: Math.max(0, rows.length - 1),
      };
      const startColIdx = columns.findIndex((column) => column.key === applyTo.startColKey);
      const endColIdx = columns.findIndex((column) => column.key === applyTo.endColKey);
      const minColIdx = Math.min(startColIdx, endColIdx);
      const maxColIdx = Math.max(startColIdx, endColIdx);
      const targetColumnKeys = new Set(
        columns
          .slice(
            minColIdx < 0 ? 0 : minColIdx,
            maxColIdx < 0 ? minColIdx + 1 : maxColIdx + 1,
          )
          .map((column) => column.key),
      );
      if (targetColumnKeys.size === 0) targetColumnKeys.add(columnKey);

      const normalizedRules = normalizeValidationRules(rules, applyTo);
      const drivenType = getValidationDrivenCellType(normalizedRules);
      const firstNormalizedRule = getValidationRuleList(normalizedRules)[0];
      const dropdownOptions = getValidationDropdownOptions(normalizedRules);
      const selectOptions = dropdownOptions.map((option) => ({
        label: option,
        bgColor: getOptionBgStyle(option).backgroundColor,
      }));
      const nextColumns = columns.map((column) =>
        targetColumnKeys.has(column.key)
          ? {
            ...column,
            validation_rules: normalizedRules,
            ...(drivenType ? { type: drivenType } : {}),
            ...(drivenType === "select" && selectOptions.length > 0
              ? { selectOptions }
              : {}),
          }
          : column,
      );
      const startRow = Math.min(applyTo.startRow, applyTo.endRow);
      const endRow = Math.max(applyTo.startRow, applyTo.endRow);
      const fullColumnRange = startRow <= 0 && endRow >= rows.length - 1;
      const nextRows =
        drivenType && !fullColumnRange
          ? rows.map((row, rowIdx) => {
            if (rowIdx < startRow || rowIdx > endRow) return row;
            const nextCellTypes = { ...(row[ROW_CELL_TYPES_KEY] ?? {}) };
            targetColumnKeys.forEach((targetKey) => {
              nextCellTypes[targetKey] = drivenType;
            });
            return { ...row, [ROW_CELL_TYPES_KEY]: nextCellTypes };
          })
          : rows;
      const rowsChanged = nextRows !== rows;

      await sheetColOps.persistColumns(nextColumns);
      if (rowsChanged) {
        rowsHistory.pushState(nextRows);
        setSheetState((prev) => ({ ...prev, rows: nextRows }));
        markSaving();
        await saveAllRows(sheetId, nextRows);
        markSaved();
      }
      if (
        drivenType === "select" &&
        firstNormalizedRule?.type === "dropdown" &&
        selectOptions.length === 0
      ) {
        setFocusedColumnKey(columnKey);
        setRightPanel("select-options");
        toast.success("Validation saved. Add dropdown options next.");
        return;
      }
      setRightPanel(null);
      broadcastSheetSnapshot({ columns: nextColumns });
      toast.success(normalizedRules ? "Validation saved" : "Validation removed");
    },
    [
      columns, markSaved, markSaving, rows, rowsHistory,
      sheetColOps.persistColumns, setRightPanel, setSheetState, sheetId,
    ],
  );

  const handleApplySelectOptions = useCallback(
    async (columnKey: string, options: SelectOption[]) => {
      const cleanedOptions = options
        .map((option) =>
          typeof option === "string"
            ? {
              label: option.trim(),
              bgColor: getOptionBgStyle(option).backgroundColor,
            }
            : { label: option.label.trim(), bgColor: option.bgColor },
        )
        .filter((option) => option.label);
      const nextColumns = columns.map((column) =>
        column.key === columnKey
          ? {
            ...column,
            type: "select" as ColumnDef["type"],
            selectOptions: cleanedOptions,
          }
          : column,
      );
      await sheetColOps.persistColumns(nextColumns);
      setRightPanel(null);
      broadcastSheetSnapshot({ columns: nextColumns });
      toast.success("Select options inserted");
    },
    [columns, sheetColOps.persistColumns, setRightPanel],
  );

  const handleFillColumnNumbers = useCallback(
    async (columnKey: string) => {
      const nextRows = rows.map((row, index) => ({ ...row, [columnKey]: index + 1 }));
      rowsHistory.pushState(nextRows);
      setSheetState((p) => ({ ...p, rows: nextRows }));
      markSaving();
      try {
        await saveAllRows(sheetId, nextRows);
        broadcastSheetSnapshot({ rows: nextRows });
        toast.success("Column filled with sequential row numbers");
      } catch {
        toast.error("Failed to persist row numbers.");
      } finally {
        markSaved();
      }
    },
    [rows, rowsHistory, sheetId, markSaving, markSaved, setSheetState],
  );

  const handleFillColumnHashNumbers = useCallback(
    async (columnKey: string) => {
      const nextRows = rows.map((row, index) => ({
        ...row,
        [columnKey]: `#${index + 1}`,
      }));
      rowsHistory.pushState(nextRows);
      setSheetState((p) => ({ ...p, rows: nextRows }));
      markSaving();
      try {
        await saveAllRows(sheetId, nextRows);
        broadcastSheetSnapshot({ rows: nextRows });
        toast.success("Column filled with hashtag sequence");
      } catch {
        toast.error("Failed to persist row numbers.");
      } finally {
        markSaved();
      }
    },
    [rows, rowsHistory, sheetId, markSaving, markSaved, setSheetState],
  );

  const toggleRowProtectionById = useCallback(
    async (rowId: string) => {
      if (!sheetId) return;
      if (!canProtectRows) {
        toast.error("Only the sheet owner can protect rows.");
        return;
      }
      const rowKey = protection.getRowKey
        ? protection.getRowKey(rowId)
        : `row:${rowId}`;
      const nextSet = new Set(protection.protectedCells);
      const rowIsProtected = protection.isRowProtected
        ? protection.isRowProtected(rowId)
        : [...protection.protectedCells].some((k) => k === rowKey);
      markSaving();
      try {
        if (rowIsProtected) {
          nextSet.delete(rowKey);
          await unprotectRow(sheetId, rowKey);
        } else {
          nextSet.add(rowKey);
          await protectRow(sheetId, rowKey);
        }
        protection.setProtectedCells(nextSet);
        toast.success(rowIsProtected ? "Row unlocked" : "Row protected");
      } catch (error) {
        console.error(error);
        toast.error("Failed to update row protection.");
      } finally {
        markSaved();
      }
    },
    [canProtectRows, protection, sheetId, markSaving, markSaved],
  );

  const handleApplyColumns = useCallback(
    async (nextColumns: ColumnDef[]) => {
      if (nextColumns.length === 0) {
        toast.error("Keep at least one column.");
        return;
      }
      const normalizedColumns = nextColumns.map((column, index) => ({
        ...column,
        key: column.key || `col_custom_${Date.now()}_${index}`,
        name: column.name.trim() || columnIndexToName(index),
        type: column.type ?? "text",
        width: column.width ?? 160,
        editable: true,
        position: index,
      }));
      const currentRows = rowsHistory.currentState;
      const nextRows = currentRows.map((row) => {
        const mapped: SheetRow = { ...row };
        normalizedColumns.forEach((column) => {
          if (!(column.key in mapped)) mapped[column.key] = "";
        });
        return mapped;
      });
      skipHistorySyncRef.current = true;
      columnsHistory.pushState(normalizedColumns);
      rowsHistory.pushState(nextRows);
      setSheetState((prev) => ({
        ...prev,
        columns: normalizedColumns,
        rows: nextRows,
      }));
      setTimeout(() => {
        skipHistorySyncRef.current = false;
      }, 0);
      try {
        markSaving();
        await Promise.all([
          saveAllColumns(sheetId, normalizedColumns),
          saveAllRows(sheetId, nextRows),
        ]);
        markSaved();
        toast.success("Columns updated");
        broadcastSheetSnapshot({ columns: normalizedColumns, rows: nextRows });
      } catch (error: any) {
        setSaveStatus("saved");
        toast.error(error?.message ?? "Failed to update columns.");
      }
    },
    [
      columnsHistory, markSaved, markSaving, rowsHistory,
      sheetId, setSaveStatus, setSheetState, broadcastSheetSnapshot,
    ],
  );

  const handleBulkUpdateColumn = useCallback(
    async (
      columnKey: string,
      range: { start: number; end: number } | "all",
      value: string,
    ) => {
      const column = columns.find((item) => item.key === columnKey);
      if (!column) return;
      const startIdx = range === "all" ? 0 : range.start;
      const endIdx = range === "all" ? rows.length - 1 : range.end;
      if (endIdx < startIdx) return;

      const updatedRows = rows.map((row, index) => {
        if (
          index < startIdx ||
          index > endIdx ||
          protection.isRowProtected(row.id)
        )
          return row;
        return { ...row, [columnKey]: value };
      });

      const validation = validateRows(updatedRows, rows);
      if (!validation.ok) {
        toast.error(validation.message);
        return;
      }

      rowsHistory.pushState(updatedRows);
      setSheetState((prev) => ({ ...prev, rows: updatedRows }));
      markSaving();
      try {
        await saveAllRows(sheetId, updatedRows);
        const count = endIdx - startIdx + 1;
        toast.success(
          `Updated ${count} ${count === 1 ? "cell" : "cells"} in ${column.name}`,
        );
      } catch {
        toast.error("Column update saved locally but failed to persist.");
        setSaveStatus("saved");
      } finally {
        markSaved();
      }
    },
    [
      columns, markSaved, markSaving, protection.isRowProtected,
      rows, rowsHistory, setSaveStatus, setSheetState, sheetId, validateRows,
    ],
  );

  const handleRowsChange = useCallback(
    (updatedRows: SheetRow[]) => {
      if (!canEditSheet) {
        showViewerEditMessage();
        return;
      }
      const updatedById = new Map(updatedRows.map((row) => [row.id, row]));
      const mergedRows =
        updatedRows.length === rows.length
          ? updatedRows
          : rows.map((row) => updatedById.get(row.id) ?? row);
      let blocked = false;
      const guardedRows = mergedRows.map((row) => {
        if (!protection.isRowProtected(row.id)) return row;
        const originalRow = rows.find((item) => item.id === row.id);
        if (originalRow && JSON.stringify(originalRow) !== JSON.stringify(row)) {
          blocked = true;
        }
        return originalRow ?? row;
      });
      if (blocked) {
        toast.error("This row is protected");
      }
      const validation = validateRows(guardedRows, rows);
      if (!validation.ok) {
        toast.error(validation.message);
        return;
      }
      persistence.handleRowsChange(guardedRows, rows, rowsHistory.pushState);
      broadcastSheetSnapshot({ rows: guardedRows, changedAt: Date.now() });
      const changedRows = guardedRows.filter(
        (row, index) => JSON.stringify(row) !== JSON.stringify(rows[index]),
      );
      if (changedRows.length > 0) {
        setTimeout(() => {
          runAutomationsForRows(changedRows, guardedRows).catch(() => { });
        }, 80);
      }
    },
    [
      canEditSheet, showViewerEditMessage, persistence.handleRowsChange,
      broadcastSheetSnapshot, rows, rowsHistory.pushState,
      protection.isRowProtected, validateRows, runAutomationsForRows,
    ],
  );

  const handleImageChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file || !activeCell) return;
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        const updatedRows = rows.map((row) =>
          row.id !== activeCell.rowId
            ? row
            : { ...row, [activeCell.colKey]: dataUrl },
        );
        rowsHistory.pushState(updatedRows);
        setSheetState((p) => ({ ...p, rows: updatedRows }));
        try {
          markSaving();
          await saveAllRows(sheetId, updatedRows);
          markSaved();
        } catch {
          toast.error("Image saved locally but failed to persist.");
          setSaveStatus("saved");
        }
      };
      reader.readAsDataURL(file);
    },
    [activeCell, rows, rowsHistory, sheetId, markSaving, markSaved, setSaveStatus],
  );

  const handleFloatingImageChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file) return;
      if (!canEditSheet) {
        showViewerEditMessage();
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const next: FloatingImage = {
          id: `img_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          src: String(reader.result),
          name: file.name,
          x: 120,
          y: 120,
          width: 280,
          height: 180,
        };
        setFloatingImages((prev) => [...prev, next]);
        markSaving();
        setTimeout(markSaved, 150);
      };
      reader.readAsDataURL(file);
    },
    [canEditSheet, showViewerEditMessage, markSaving, markSaved],
  );

  const updateFloatingImage = useCallback(
    (id: string, patch: Partial<FloatingImage>) => {
      setFloatingImages((prev) =>
        prev.map((image) => (image.id === id ? { ...image, ...patch } : image)),
      );
    },
    [],
  );

  const removeFloatingImage = useCallback((id: string) => {
    setFloatingImages((prev) => prev.filter((image) => image.id !== id));
  }, []);

  const handleFloatingImagePointerDown = useCallback(
    (image: FloatingImage, mode: "move" | "resize", e: React.PointerEvent) => {
      if (!canEditSheet) {
        showViewerEditMessage();
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      floatingImageDragRef.current = {
        id: image.id,
        pointerId: e.pointerId,
        mode,
        startX: e.clientX,
        startY: e.clientY,
        original: image,
      };
    },
    [canEditSheet, showViewerEditMessage],
  );

  const handleFloatingImagePointerMove = useCallback((e: React.PointerEvent) => {
    const drag = floatingImageDragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (drag.mode === "move") {
      updateFloatingImage(drag.id, {
        x: Math.max(0, drag.original.x + dx),
        y: Math.max(0, drag.original.y + dy),
      });
    } else {
      updateFloatingImage(drag.id, {
        width: Math.max(80, drag.original.width + dx),
        height: Math.max(60, drag.original.height + dy),
      });
    }
  }, [updateFloatingImage]);

  const handleFloatingImagePointerUp = useCallback((e: React.PointerEvent) => {
    const drag = floatingImageDragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    floatingImageDragRef.current = null;
    markSaving();
    setTimeout(markSaved, 150);
  }, [markSaving, markSaved]);

  const handleSheetImport = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!canEditSheet) {
        showViewerEditMessage();
        return;
      }
      if (!file) return;
      try {
        if (file.size > MAX_IMPORT_BYTES)
          throw new Error("File is larger than the 50 MB import limit.");
        if (!/\.(csv|xlsx|xls)$/i.test(file.name))
          throw new Error("Unsupported file type. Upload a CSV, XLSX, or XLS file.");
        setIsImportingSheet(true);
        markSaving();
        const buffer = await file.arrayBuffer();
        const parsed = await buildImportedSheetData(file, buffer);
        const importedRows = ensureWorkingRowBuffer(parsed.rows, parsed.columns);
        const nextTitle = getImportedSheetTitle(file.name);
        const [formulasDelete, formatsDelete] = await Promise.all([
          supabase.from("formulas").delete().eq("sheet_id", sheetId),
          supabase.from("cell_formats").delete().eq("sheet_id", sheetId),
        ]);
        if (formulasDelete.error || formatsDelete.error)
          throw new Error(
            formulasDelete.error?.message ??
            formatsDelete.error?.message ??
            "Failed to clear existing imported data.",
          );
        await Promise.all([
          updateSheetTitle(sheetId, nextTitle),
          saveAllColumns(sheetId, parsed.columns),
          saveAllRows(sheetId, importedRows),
          saveAllFormulas(sheetId, parsed.formulas),
          saveAllCellFormats(sheetId, parsed.cellFormats),
        ]);
        columnsHistory.pushState(parsed.columns);
        rowsHistory.pushState(importedRows);
        setSheetState((prev) => ({
          ...prev,
          title: nextTitle,
          columns: parsed.columns,
          rows: importedRows,
        }));
        setSelectedRows(new Set());
        setSelectedCell(null);
        setImportSource(parsed.source);
        markSaved();
        toast.success(
          `Imported ${parsed.source === "excel" ? "Excel" : "CSV"} file successfully.`,
        );
      } catch (error: any) {
        setSaveStatus("saved");
        toast.error(error?.message ?? "Import failed. Please try again.");
      } finally {
        setIsImportingSheet(false);
      }
    },
    [
      canEditSheet, showViewerEditMessage, columnsHistory, markSaved,
      markSaving, rowsHistory, sheetId,
    ],
  );

  const handleSelectedCellTypeChange = useCallback(
    (type: ColumnDef["type"]) => {
      if (!canEditSheet) {
        showViewerEditMessage();
        return;
      }
      if (!selectedCell) return;
      const rowId = rows[selectedCell.row]?.id;
      if (rowId && protection.isRowProtected(rowId)) {
        toast.error("This row is protected");
        return;
      }
      const cellKey = `${selectedCell.row}-${selectedCell.col}`;
      cellTypes.setCellTypeOverrides((prev: any) => ({ ...prev, [cellKey]: type }));
      const selectOptions =
        columns.find((column) => column.key === selectedCell.col)?.selectOptions ?? [];
      const selectOptionLabels = selectOptions.map(getSelectOptionLabel);
      if (type === "select") {
        setCellSelectOptions((prev) => ({ ...prev, [cellKey]: selectOptionLabels }));
      }
      const updatedRows = rows.map((row, idx) => {
        if (idx !== selectedCell.row) return row;
        return {
          ...row,
          [selectedCell.col]: getDefaultValueForType(type),
          [ROW_CELL_TYPES_KEY]: {
            ...(row[ROW_CELL_TYPES_KEY] ?? {}),
            [selectedCell.col]: type,
          },
          ...(type === "select"
            ? {
              [ROW_CELL_SELECT_OPTIONS_KEY]: {
                ...(row[ROW_CELL_SELECT_OPTIONS_KEY] ?? {}),
                [selectedCell.col]: selectOptionLabels,
              },
            }
            : {}),
        };
      });
      rowsHistory.pushState(updatedRows);
      setSheetState((p) => ({ ...p, rows: updatedRows }));
      saveAllRows(sheetId, updatedRows).catch(() => {
        toast.error("Failed to save cell type");
      });
      broadcastSheetSnapshot({
        rows: updatedRows,
        cellTypeOverrides: cellTypes.cellTypeOverrides,
      });
      toast.success(`Cell changed to ${type}`);
    },
    [
      canEditSheet, showViewerEditMessage, selectedCell, cellTypes, rows, rowsHistory,
      sheetId, columns, setCellSelectOptions, protection.isRowProtected,
    ],
  );

  const handleSelectSetupConfirm = useCallback(
    async (options: string[]) => {
      const { colKey, mode, row } = selectSetupDialog;
      if (mode === "insert") {
        sheetColOps.handleInsertColumn("select");
        setTimeout(async () => {
          markSaving();
          const updatedCols = columnsHistory.currentState;
          const newCol = updatedCols[updatedCols.length - 1];
          if (newCol) {
            const withOptions = normalizeGeneratedColumnNames(
              updatedCols.map((c) =>
                c.key === newCol.key ? { ...c, selectOptions: options } : c,
              ),
            );
            columnsHistory.pushState(withOptions);
            setSheetState((p) => ({ ...p, columns: withOptions }));
            await Promise.all([
              saveAllColumns(sheetId, withOptions),
              saveAllRows(sheetId, rowsHistory.currentState),
            ]);
          }
          markSaved();
        }, 50);
      } else if (mode === "change" && colKey) {
        colOps.changeColumnType(colKey, "select");
        setTimeout(async () => {
          markSaving();
          const updatedCols = columnsHistory.currentState.map((c) =>
            c.key === colKey
              ? { ...c, type: "select" as ColumnDef["type"], selectOptions: options }
              : c,
          );
          columnsHistory.pushState(updatedCols);
          setSheetState((p) => ({ ...p, columns: updatedCols }));
          await Promise.all([
            saveAllColumns(sheetId, updatedCols),
            saveAllRows(sheetId, rowsHistory.currentState),
          ]);
          markSaved();
        }, 50);
      } else if (mode === "cell" && colKey && row !== null) {
        const cellKey = `${row}-${colKey}`;
        cellTypes.setCellTypeOverrides((prev: any) => ({
          ...prev,
          [cellKey]: "select",
        }));
        setCellSelectOptions((prev) => ({ ...prev, [cellKey]: options }));
        const updatedRows = rows.map((r, idx) => {
          if (idx !== row) return r;
          return {
            ...r,
            [colKey]: "",
            [ROW_CELL_TYPES_KEY]: {
              ...(r[ROW_CELL_TYPES_KEY] ?? {}),
              [colKey]: "select",
            },
            [ROW_CELL_SELECT_OPTIONS_KEY]: {
              ...(r[ROW_CELL_SELECT_OPTIONS_KEY] ?? {}),
              [colKey]: options,
            },
          };
        });
        rowsHistory.pushState(updatedRows);
        setSheetState((p) => ({ ...p, rows: updatedRows }));
        markSaving();
        await saveAllRows(sheetId, updatedRows);
        markSaved();
        toast.success("Cell dropdown saved");
      }
    },
    [
      selectSetupDialog, sheetColOps, colOps, sheetId,
      columnsHistory, rowsHistory, markSaving, markSaved,
      rows, cellTypes, setSheetState, setCellSelectOptions,
    ],
  );

  const handleAddComment = useCallback(
    async (cellKey: string) => {
      if (!newCommentText.trim()) return;
      await addComment({
        sheetId,
        cellKey,
        userId: currentUser?.id ?? "local",
        author: currentUser?.name ?? "You",
        authorColor: currentUser ? getMemberColor(currentUser.id) : "#0d7c5f",
        text: newCommentText.trim(),
        parentId: null,
      });
      setNewCommentText("");
      toast.success("Comment added");
    },
    [currentUser, newCommentText, sheetId],
  );

  const handleReply = useCallback(
    async (cellKey: string, commentId: string) => {
      const text = replyText[commentId];
      if (!text?.trim()) return;
      await addComment({
        sheetId,
        cellKey,
        userId: currentUser?.id ?? "local",
        author: currentUser?.name ?? "You",
        authorColor: currentUser ? getMemberColor(currentUser.id) : "#0d7c5f",
        text: text.trim(),
        parentId: commentId,
      });
      setReplyText((p) => ({ ...p, [commentId]: "" }));
    },
    [currentUser, replyText, sheetId],
  );

  const handleResolveComment = useCallback(
    async (_cellKey: string, commentId: string) => {
      await resolveComment(commentId);
      toast.success("Comment resolved");
    },
    [],
  );

  const toggleRightPanel = useCallback(
    (panel: RightPanelType) => {
      if (!isOrgSheet && panel === "collaborators") return;
      setRightPanel((p) => (p === panel ? null : panel));
    },
    [isOrgSheet],
  );

  const groupedCommentsForPanel = useMemo(() => {
    const result: Record<string, any[]> = {};
    Object.entries(comments).forEach(([cellKey, cellComments]) => {
      const roots = cellComments.filter((c) => !c.parentId);
      const replies = cellComments.filter((c) => c.parentId);
      result[cellKey] = roots.map((root) => ({
        ...root,
        cellKey,
        thread: replies
          .filter((r) => r.parentId === root.id)
          .map((r) => ({
            author: r.author,
            color: r.authorColor,
            text: r.text,
            createdAt: r.createdAt,
            timestamp: r.createdAt
              ? new Date(r.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
              : "just now",
          })),
      }));
    });
    return result;
  }, [comments]);

  useKeyboardShortcuts({
    selectedCell,
    rowsHistory,
    getCurrentCellFormat: formatting.getCurrentCellFormat,
    applyFormat: formatting.applyFormat,
    copyCellOrRange: () => handleSmartCopy(),
    pasteCellOrRange: handlePaste,
    cutCellOrRange: clipboard.cutCellOrRange,
  });

  // column resize 
  const beginColResize = useCallback(
    (colKey: string, e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const col = columns.find((c) => c.key === colKey);
      colResizeRef.current = { colKey, startX: e.clientX, startW: col?.width ?? 160 };

      const onMove = (ev: PointerEvent) => {
        const st = colResizeRef.current;
        if (!st) return;
        const next = Math.max(48, Math.min(800, st.startW + (ev.clientX - st.startX)));
        setSheetState((p) => ({
          ...p,
          columns: p.columns.map((c) => c.key === st.colKey ? { ...c, width: next } : c),
        }));
      };

      const onUp = () => {
        colResizeRef.current = null;
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        setSheetState((p) => {
          const finalCols = p.columns;
          columnsHistory.pushState(finalCols);
          markSaving();
          saveAllColumns(sheetId, finalCols)
            .then(markSaved)
            .catch(() => {
              toast.error("Failed to save column width.");
              setSaveStatus("saved");
            });
          return p;
        });
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [columns, columnsHistory, sheetId, markSaving, markSaved, setSaveStatus, setSheetState],
  );

  // ── Row resize ─────────────────────────────────────────────────────────
  const beginRowResize = useCallback(
    (rowId: string, e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const base = rowHeights[rowId] ?? 32;
      rowResizeRef.current = {
        rowId,
        startY: e.clientY,
        startH: base,
        pointerId: e.pointerId,
      };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    [rowHeights],
  );

  const onRowResizeMove = useCallback((e: React.PointerEvent) => {
    const st = rowResizeRef.current;
    if (!st || st.pointerId !== e.pointerId) return;
    const next = Math.max(24, Math.min(260, st.startH + (e.clientY - st.startY)));
    setRowHeights((p) => ({ ...p, [st.rowId]: next }));
  }, []);

  const endRowResize = useCallback((e: React.PointerEvent) => {
    if (rowResizeRef.current?.pointerId === e.pointerId)
      rowResizeRef.current = null;
  }, []);

  // ── onCellDoubleClick: redirect covered cells to master ────────────────
  /**
   * FIX 1 — When the user double-clicks a covered (slave) cell we
   *   a) highlight the entire merge block, and
   *   b) programmatically start editing the master cell.
   * Returning `false` cancels the default grid edit on the covered cell.
   */
  const handleCellDoubleClick = useCallback(
    ({ row, column }: { row: SheetRow; column: any }) => {
      const rowIdx = rows.findIndex((r) => r.id === row.id);
      const mi = mergeByCell.get(`${rowIdx}-${column.key}`);
      if (mi?.hidden) {
        // Select the full merge block first
        selectMergeBlock(mi);
        // Then, after React re-renders, open the editor on the master cell
        queueMicrotask(() => {
          if (gridRef.current) {
            const masterColIdx = columns.findIndex((c) => c.key === mi.masterCol);
            // +1 accounts for the row-number column at index 0 in gridColumns
            gridRef.current.startEditingCell({
              rowIdx: mi.masterRow,
              idx: masterColIdx + 1,
            });
          }
        });
        // Cancel the default editor on the covered cell
        return false;
      }
      // Allow normal editing for all other cells
      return true;
    },
    [rows, mergeByCell, selectMergeBlock, columns],
  );

  // ── Grid column definitions ────────────────────────────────────────────
  const selStyle = ddStyle(isDark);

  const gridColumns = useMemo<Column<SheetRow, SheetRow>[]>(() => {
    const activeRows = timeTravelState.previewRows || rows;

    // ── Row-number / checkbox column ──────────────────────────────────
    const rowNumberCol: Column<SheetRow, SheetRow> = {
      key: "row-number",
      name: "",
      width: 46,
      frozen: true,
      resizable: false,
      renderHeaderCell() {
        const allSelected = activeRows.length > 0 && selectedRows.size === activeRows.length;
        const handleSelectAll = (checked: boolean) => {
          if (checked && activeRows.length > 0) {
            setSelectedRows(new Set(activeRows.map((r) => r.id)));
            const dataCols = columns.filter((col) => !col.hidden);
            const firstCol = dataCols[0];
            if (firstCol) {
              setSelectedCell({ row: 0, col: firstCol.key });
              setSelectionRange({
                start: { row: 0, colIndex: 0 },
                end: { row: activeRows.length - 1, colIndex: dataCols.length - 1 },
              });
            }
          } else {
            setSelectedRows(new Set());
            setSelectedCell(null);
            setSelectionRange(null);
          }
        };

        return (
          <div
            className="h-full w-full flex items-center justify-center sheet-header-cell border-r cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 select-none"
            onClick={() => handleSelectAll(!allSelected)}
          >
            <input
              type="checkbox"
              className="h-3.5 w-3.5 rounded border-gray-300 cursor-pointer"
              style={{ accentColor: "var(--primary)" }}
              checked={allSelected}
              onChange={(e) => {
                e.stopPropagation();
                handleSelectAll(e.target.checked);
              }}
            />
          </div>
        );
      },
      renderCell(props: RenderCellProps<SheetRow, SheetRow>) {
        const rowIdx = activeRows.findIndex((r) => r.id === props.row.id);
        const isSel = selectedRows.has(props.row.id);
        const isRowProtected = protection.isRowProtected(props.row.id);
        return (
          <div
            className={`h-full w-full flex items-center justify-center sheet-row-num border-r group/rownum ${isSel ? "sheet-row-num--selected" : ""
              } relative cursor-pointer select-none`}
            onClick={(e) => {
              if ((e.target as HTMLElement).closest("input[type='checkbox']")) return;
              if ((e.target as HTMLElement).closest(".sheet-row-resize-handle")) return;

              // Select the entire row
              const dataCols = columns.filter((col) => !col.hidden);
              const firstCol = dataCols[0];
              if (firstCol) {
                setSelectedCell({ row: rowIdx, col: firstCol.key });
                setSelectionRange({
                  start: { row: rowIdx, colIndex: 0 },
                  end: { row: rowIdx, colIndex: dataCols.length - 1 },
                });
              }
              setSelectedRows(new Set([props.row.id]));
            }}
          >
            <span
              className={`${isSel ? "hidden" : "group-hover/rownum:hidden"
                } sheet-row-num-text`}
            >
              {rowIdx + 1}
            </span>
            <input
              type="checkbox"
              className={`h-3.5 w-3.5 rounded border-gray-300 cursor-pointer ${isSel ? "" : "hidden group-hover/rownum:block"
                }`}
              style={{ accentColor: "var(--primary)" }}
              checked={isSel}
              onChange={(e) => {
                const s = new Set(selectedRows);
                e.target.checked ? s.add(props.row.id) : s.delete(props.row.id);
                setSelectedRows(s);
              }}
            />
            {/* Row resize handle */}
            <div
              className="sheet-row-resize-handle"
              onPointerDown={(e) => beginRowResize(props.row.id, e)}
              onPointerMove={onRowResizeMove}
              onPointerUp={endRowResize}
              onPointerCancel={endRowResize}
            />
          </div>
        );
      },
      renderSummaryCell(props: any) {
        const displayIdx = filteredRows.findIndex((r) => r.id === props.row.id);
        return (
          <div className="h-full w-full flex items-center justify-center sheet-row-num sheet-row-num--selected border-r">
            <span className="sheet-row-num-text">{displayIdx + 1}</span>
          </div>
        );
      },
    };

    // ── Data columns ──────────────────────────────────────────────────
    const dataCols = columns.filter((col) => !col.hidden).map(
      (col): Column<SheetRow, SheetRow> => ({
        key: col.key,
        name: col.name,
        width: col.width || 160,
        resizable: true,
        frozen: col.frozen,

        // FIX 2 — Covered slave cells are never editable.
        // Double-clicking them is intercepted by onCellDoubleClick which
        // redirects to the master cell. This prevents ghost editors.
        editable: (row: SheetRow) => {
          if (!canEditSheet) return false;
          const rowIdx = rows.findIndex((r) => r.id === row.id);
          const mi = mergeByCell.get(`${rowIdx}-${col.key}`);
          if (mi?.hidden) return false;
          return true;
        },

        renderHeaderCell: () => {
          if (col.isExtra) {
            return <div className="h-full w-full border-r" style={{ background: 'var(--rdg-header-background-color)' }} />;
          }
          return (
            <div
              className={`h-full w-full relative flex items-center justify-center group/header sheet-header-cell sheet-header-cell--excel border-r cursor-pointer select-none ${selectedColumnKey === col.key
                ? "bg-primary/15"
                : selectedCell && selectedCell.col === col.key
                  ? "bg-primary/10"
                  : ""
                }`}
              onClick={(e) => {
                if ((e.target as HTMLElement).closest("button")) return;
                if ((e.target as HTMLElement).closest("[data-col-resize]")) return;
                setSelectedColumnKey(col.key);
                setSelectedCell({ row: 0, col: col.key });
                const colIdx = columns.findIndex((c) => c.key === col.key);
                if (colIdx >= 0) {
                  setSelectionRange({
                    start: { row: 0, colIndex: colIdx },
                    end: { row: rows.length - 1, colIndex: colIdx },
                  });
                }
              }}
              draggable
              onDragStart={() => colOps.handleColumnDragStart(col.key)}
              onDragOver={(e) =>
                colOps.handleColumnDragOver(
                  e,
                  col.key,
                  (u: any) =>
                    setSheetState((p) => ({
                      ...p,
                      columns: typeof u === "function" ? u(p.columns) : u,
                    })),
                )
              }
              onDragEnd={sheetColOps.handleColumnDragEnd}
            >
              {/* Letter label — zooms + highlights on hover */}
              <div className="flex-1 flex items-center justify-center min-w-0 px-1">
                <span className="text-xs font-medium truncate transition-all duration-150 group-hover/header:text-primary group-hover/header:scale-110 inline-block">
                  {columnIndexToName(columns.findIndex((c) => c.key === col.key))}
                </span>
              </div>

              {/* Text wrap indicator */}
              {[...textWrap.textWrapColumns].some((k) => k.endsWith(`-${col.key}`)) && (
                <WrapText className="h-3 w-3 text-primary shrink-0 opacity-60 mr-0.5" />
              )}

              {/* 3-dots dropdown */}
              <ColumnHeaderMenu
                column={col}
                onChangeType={(t) => {
                  if (!canEditSheet) { showViewerEditMessage(); return; }
                  sheetColOps.handleChangeColumnType(col.key, t);
                  setTimeout(() => {
                    const clearedRows = rowsHistory.currentState.map((row) => {
                      const rowTypes = { ...(row[ROW_CELL_TYPES_KEY] ?? {}) };
                      delete rowTypes[col.key];
                      const rowSelects = { ...(row[ROW_CELL_SELECT_OPTIONS_KEY] ?? {}) };
                      delete rowSelects[col.key];
                      const defaultVal = getDefaultValueForType(t);
                      const currentVal = row[col.key];
                      const shouldApplyDefault =
                        currentVal === "" || currentVal === null || currentVal === undefined;
                      return {
                        ...row,
                        ...(shouldApplyDefault ? { [col.key]: defaultVal } : {}),
                        [ROW_CELL_TYPES_KEY]: rowTypes,
                        [ROW_CELL_SELECT_OPTIONS_KEY]: rowSelects,
                      };
                    });
                    rowsHistory.pushState(clearedRows);
                    setSheetState((p) => ({ ...p, rows: clearedRows }));
                    saveAllRows(sheetId, clearedRows).catch(console.error);
                    broadcastSheetSnapshot({ rows: clearedRows });
                  }, 60);
                  if (t === "select") {
                    setFocusedColumnKey(col.key);
                    setRightPanel("select-options");
                  }
                }}
                onOpenColumnPanel={() => {
                  if (!canEditSheet) { showViewerEditMessage(); return; }
                  setFocusedColumnKey(col.key);
                  setRightPanel(col.type === "select" ? "select-options" : "columns");
                }}
                onDelete={() =>
                  canEditSheet ? sheetColOps.handleDeleteColumn(col.key) : showViewerEditMessage()
                }
                onToggleTextWrap={() =>
                  canEditSheet ? handleTextWrapToggle() : showViewerEditMessage()
                }
                textWrapEnabled={textWrap.textWrapColumns.has(col.key)}
                columnFormula={formulas.columnFormulas[col.key]}
                onApplyColumnFormula={(f) =>
                  canEditSheet ? handleApplyFormulaToColumn(col.key, f) : showViewerEditMessage()
                }
                onRemoveColumnFormula={() =>
                  canEditSheet ? handleRemoveColumnFormula(col.key) : showViewerEditMessage()
                }
                selectOptions={col.selectOptions}
                onUpdateSelectOptions={(opts) =>
                  canEditSheet
                    ? sheetColOps.handleUpdateSelectOptions(col.key, opts)
                    : showViewerEditMessage()
                }
                onFillColumnNumbers={() =>
                  canEditSheet ? handleFillColumnNumbers(col.key) : showViewerEditMessage()
                }
                onFillColumnHashNumbers={() =>
                  canEditSheet ? handleFillColumnHashNumbers(col.key) : showViewerEditMessage()
                }
                onInsertLeft={() => {
                  if (!canEditSheet) { showViewerEditMessage(); return; }
                  const idx = columns.findIndex((c) => c.key === col.key);
                  sheetColOps.insertColumnAt(idx, null, "blank");
                }}
                onInsertRight={() => {
                  if (!canEditSheet) { showViewerEditMessage(); return; }
                  const idx = columns.findIndex((c) => c.key === col.key);
                  sheetColOps.insertColumnAt(idx + 1, null, "blank");
                }}
                onDuplicate={() => {
                  if (!canEditSheet) { showViewerEditMessage(); return; }
                  const idx = columns.findIndex((c) => c.key === col.key);
                  sheetColOps.insertColumnAt(idx + 1, col, "duplicate");
                }}
                onClearColumn={() =>
                  canEditSheet ? sheetColOps.clearColumnValues(col) : showViewerEditMessage()
                }
                onSortAsc={() =>
                  canEditSheet
                    ? sheetRowOps.handleSortByColumn(col.key, "asc")
                    : showViewerEditMessage()
                }
                onSortDesc={() =>
                  canEditSheet
                    ? sheetRowOps.handleSortByColumn(col.key, "desc")
                    : showViewerEditMessage()
                }
                onSetCurrency={(currencyCode) => {
                  if (!canEditSheet) { showViewerEditMessage(); return; }
                  const updated = columns.map((c) =>
                    c.key === col.key ? { ...c, currencyCode } : c,
                  );
                  setSheetState((p) => ({ ...p, columns: updated }));
                  columnsHistory.pushState(updated);
                  markSaving();
                  saveAllColumns(sheetId, updated)
                    .then(() => markSaved())
                    .catch((err) => {
                      console.error("Failed to save currency code change:", err);
                      toast.error("Failed to save currency code change.");
                      setSaveStatus("saved");
                    });
                }}
                onApplyColumnFormat={(fmt) =>
                  canEditSheet ? handleApplyColumnFormat(col.key, fmt) : showViewerEditMessage()
                }
                onToggleFreeze={() =>
                  canEditSheet ? handleToggleFreezeColumn(col.key) : showViewerEditMessage()
                }
                onOpenValidationPanel={() => {
                  if (!canEditSheet) { showViewerEditMessage(); return; }
                  setFocusedColumnKey(col.key);
                  setRightPanel("validation");
                }}
              />

              {/* Column resize handle */}
              <div
                className="sheet-col-resize-handle"
                onPointerDown={(e) => { e.stopPropagation(); beginColResize(col.key, e); }}
              />

            </div>
          );
        },

        renderCell(props: RenderCellProps<SheetRow, SheetRow>) {
          const rowIdx = rows.findIndex((r) => r.id === props.row.id);
          const mergeInfo = mergeByCell.get(`${rowIdx}-${col.key}`);
          const autoOverflowInfo = autoOverflowByCell.get(`${rowIdx}-${col.key}`);

          const effectiveCellStyle = getEffectiveCellStyle(
            rowIdx,
            col.key,
            props.row,
          );

          // ── Covered (slave) cell — render an invisible click-through overlay ──
          if (mergeInfo?.hidden) {
            return (
              <div
                className="sheet-merge-covered-cell"
                data-merge-covered="true"
                style={{
                  position: "absolute",
                  inset: 0,
                  pointerEvents: "auto",
                  userSelect: "none",
                  cursor: "cell",
                  background: (effectiveCellStyle.backgroundColor as string) || "transparent",
                  zIndex: 5,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  selectMergeBlock(mergeInfo);
                }}
              />
            );
          }

          const isMergeMaster = Boolean(
            mergeInfo && !mergeInfo.hidden && mergeInfo.rowSpan * mergeInfo.colSpan > 1,
          );

          if (isMergeMaster && col.key !== mergeInfo!.masterCol) {
            queueMicrotask(() => {
              selectMergeBlock(mergeInfo!);
              if (typeof document !== "undefined") {
                (document.activeElement as HTMLElement)?.blur();
              }
            });
            return (
              <div
                style={{
                  pointerEvents: "none",
                  userSelect: "none",
                  visibility: "hidden",
                  width: "100%",
                  height: "100%",
                }}
              />
            );
          }

          const colIndex = columns.findIndex((c) => c.key === col.key);
          const mergedWidth = isMergeMaster
            ? columns
              .slice(colIndex, colIndex + mergeInfo!.colSpan)
              .filter((item) => !item.hidden)
              .reduce((sum, item) => sum + (item.width ?? 160), 0)
            : undefined;
          const mergedHeight =
            isMergeMaster && mergeInfo!.rowSpan > 1
              ? Array.from({ length: mergeInfo!.rowSpan }, (_, i) => {
                const targetRow = rows[mergeInfo!.masterRow + i];
                return targetRow ? (rowHeights[targetRow.id] ?? 33) : 33;
              }).reduce((sum, h) => sum + h, 0)
              : undefined;

          const type = props.row._isHeaderRow
            ? "text"
            : cellTypes.getCellType(rowIdx, col.key, col.type || "text");
          const effectiveAutoOverflowInfo =
            type === "text" ? autoOverflowInfo : undefined;
          const formula = formulas.getFormula(rowIdx, col.key);
          let rawValue = props.row[col.key];
          if (formula?.startsWith("="))
            rawValue = formulas.evaluateFormula(formula, rowIdx);
          const displayValue =
            type === "date" ? formatSheetDate(rawValue) : rawValue;
          const validationWarning =
            getCellValidationFailure(
              col.validation_rules,
              props.row[col.key],
              rowIdx,
              col.name,
              rows,
              columns,
            )?.message ?? null;
          const activeCollabEntry = Object.values(activeCursors).find(
            (c) => c.row === rowIdx && c.col === col.key,
          );
          // const effectiveCellStyle = getEffectiveCellStyle(
          //   rowIdx,
          //   col.key,
          //   props.row,
          // );
          // REPLACE WITH:
          const layoutFlag = rowIdx <= 1 || (formatting.cellFormats[`${rowIdx}-${col.key}`]?.isLayoutRow ?? false);
          const mergedCellStyle = isMergeMaster
            ? {
              ...effectiveCellStyle,
              borderStyle: "none",
              borderColor: "transparent",
              borderWidth: 0,
              isLayoutRow: layoutFlag,
            }
            : {
              ...effectiveCellStyle,
              isLayoutRow: layoutFlag,
            };
          const inSelection =
            selectionRange && !mergeInfo?.hidden
              ? (() => {
                const sr = Math.min(
                  selectionRange.start.row,
                  selectionRange.end.row,
                );
                const er = Math.max(
                  selectionRange.start.row,
                  selectionRange.end.row,
                );
                const sc = Math.min(
                  selectionRange.start.colIndex,
                  selectionRange.end.colIndex,
                );
                const ec = Math.max(
                  selectionRange.start.colIndex,
                  selectionRange.end.colIndex,
                );
                return (
                  rowIdx >= sr &&
                  rowIdx <= er &&
                  colIndex >= sc &&
                  colIndex <= ec
                );
              })()
              : false;

          return (
            <CellRenderer
              type={type}
              props={props}
              colKey={col.key}
              rowIdx={rowIdx}
              row={props.row}
              displayValue={displayValue}
              rawFormula={formula?.startsWith("=") ? formula : undefined}
              colDef={col}
              isWrapped={textWrap.textWrapColumns.has(`${rowIdx}-${col.key}`)}
              isProtected={protection.isRowProtected(props.row.id)}
              isOrgSheet={isOrgSheet}
              cellStyle={mergedCellStyle}
              cellComments={[
                ...(comments[`${rowIdx}-${col.key}`] || []),
                ...(comments[`row:${props.row.id}`] || []),
              ]}
              activeCollab={
                activeCollabEntry
                  ? {
                    name: activeCollabEntry.name,
                    color: activeCollabEntry.color,
                  }
                  : null
              }
              horizontalAlign={
                (effectiveCellStyle.textAlign as any) ?? undefined
              }
              mergeStyle={
                isMergeMaster
                  ? {
                    zIndex: 7,
                    ...({ __mergeMode: mergeInfo?.mode } as any),
                  }
                  : undefined
              }
              isMergeMaster={isMergeMaster}
              mergedHeight={mergedHeight}
              autoOverflowWidth={
                isMergeMaster
                  ? mergedWidth
                  : effectiveAutoOverflowInfo?.width
              }
              isAutoOverflowMaster={
                isMergeMaster ||
                Boolean(
                  effectiveAutoOverflowInfo && !effectiveAutoOverflowInfo.covered,
                )
              }
              isAutoOverflowCovered={Boolean(
                effectiveAutoOverflowInfo?.covered,
              )}
              onCellClick={() => {
                if (mergeInfo && isMergeMaster) {
                  selectMergeBlock(mergeInfo);
                  if (type === "priority" || type === "status" || type === "select") {
                    queueMicrotask(() => {
                      if (gridRef.current) {
                        const colIdx = columns.findIndex((c) => c.key === col.key);
                        gridRef.current.startEditingCell({
                          rowIdx: mergeInfo.masterRow,
                          idx: colIdx + 1,
                        });
                      }
                    });
                  }
                  return;
                }
                setSelectedColumnKey(null);
                setSelectedCell({ row: rowIdx, col: col.key });
                if (rightPanel === "validation") setFocusedColumnKey(col.key);
                setActiveCommentCell(`${rowIdx}-${col.key}`);

                if (type === "priority" || type === "status" || type === "select") {
                  queueMicrotask(() => {
                    if (gridRef.current) {
                      const colIdx = columns.findIndex((c) => c.key === col.key);
                      gridRef.current.startEditingCell({
                        rowIdx,
                        idx: colIdx + 1,
                      });
                    }
                  });
                }
              }}
              onCommentClick={(e) => {
                e.stopPropagation();
                setActiveCommentCell(`${rowIdx}-${col.key}`);
                setRightPanel("comments");
              }}
              onPointerDown={onCellPointerDown}
              onPointerEnter={onCellPointerEnter}
              onFillStart={onFillStart}
              isSelected={
                !mergeInfo?.hidden &&
                (inSelection ||
                  (selectedCell?.row === rowIdx && selectedCell.col === col.key))
              }
              isActiveSelected={
                !mergeInfo?.hidden &&
                selectedCell?.row === rowIdx &&
                selectedCell.col === col.key
              }
              validationWarning={validationWarning}
              isLayoutRow={!!layoutFlag}
            />
          );
        },

        renderSummaryCell(props: any) {
          const rowIdx = rows.findIndex((r) => r.id === props.row.id);
          const mergeInfo = mergeByCell.get(`${rowIdx}-${col.key}`);
          if (mergeInfo?.hidden)
            return <div className="h-full w-full sheet-cell-merge-covered" />;
          const isLayoutRow = rowIdx <= 1 || !!formatting.cellFormats[`${rowIdx}-${col.key}`]?.isLayoutRow;
          const type = (props.row._isHeaderRow || isLayoutRow)
            ? "text"
            : cellTypes.getCellType(rowIdx, col.key, col.type || "text");
          const formula = formulas.getFormula(rowIdx, col.key);
          let displayValue = props.row[col.key];
          if (formula?.startsWith("="))
            displayValue = formulas.evaluateFormula(formula, rowIdx);
          return (
            <div
              className="h-full w-full flex items-center px-2.5 py-1 gap-1.5 border-r bg-primary/5"
              style={getEffectiveCellStyle(rowIdx, col.key, props.row)}
            >
              <span
                className={`truncate sheet-cell-text ${type === "number" || type === "currency"
                  ? "ml-auto tabular-nums"
                  : ""
                  }`}
              >
                {type === "date"
                  ? formatSheetDate(displayValue)
                  : String(displayValue ?? "")}
              </span>
            </div>
          );
        },

        renderEditCell(props: RenderEditCellProps<SheetRow, SheetRow>) {
          const { row, column, onRowChange } = props;
          const rowIdx = rows.findIndex((r) => r.id === row.id);
          const mergeInfo = mergeByCell.get(`${rowIdx}-${column.key}`);
          const colIndex = columns.findIndex((c) => c.key === column.key);

          const colDef = columns.find((c) => c.key === column.key)!;

          // ── Covered cell: safety net (editable() already blocks this path) ──
          if (mergeInfo?.hidden) {
            queueMicrotask(() => {
              selectMergeBlock(mergeInfo);
              if (typeof document !== "undefined") {
                (document.activeElement as HTMLElement)?.blur();
              }
            });
            return (
              <div
                className="h-full w-full sheet-cell-merge-covered"
                style={{ pointerEvents: "none", userSelect: "none", visibility: "hidden" }}
              />
            );
          }

          const isMergeMaster = Boolean(
            mergeInfo && !mergeInfo.hidden && mergeInfo.rowSpan * mergeInfo.colSpan > 1,
          );

          const editWidth = isMergeMaster
            ? columns
              .slice(colIndex, colIndex + mergeInfo!.colSpan)
              .filter((item) => !item.hidden)
              .reduce((sum, item) => sum + (item.width ?? 160), 0)
            : undefined;

          const editHeight =
            isMergeMaster && mergeInfo!.rowSpan > 1
              ? Array.from({ length: mergeInfo!.rowSpan }, (_, i) => {
                const tr = rows[mergeInfo!.masterRow + i];
                return tr ? (rowHeights[tr.id] ?? 33) : 33;
              }).reduce((sum, h) => sum + h, 0)
              : undefined;

          const cellType = row._isHeaderRow
            ? "text"
            : cellTypes.getCellType(rowIdx, column.key, colDef.type || "text");
          const cellStyle = getEffectiveCellStyle(rowIdx, column.key, row);
          const cellKey = `${rowIdx}-${column.key}`;
          const isProtected = protection.isRowProtected(row.id);

          if (!canEditSheet) {
            showViewerEditMessage();
            return (
              <div className="h-full w-full flex items-center px-2.5 text-xs bg-gray-50 text-gray-500">
                Viewer access
              </div>
            );
          }

          if (isProtected) {
            toast.error("This cell is protected");
            return (
              <div className="h-full w-full flex items-center px-2.5 text-xs bg-gray-50 text-gray-400 gap-1.5">
                <Lock className="h-3 w-3" /> Protected
              </div>
            );
          }

          const editVal =
            formulas.formulas[cellKey] ??
            formulas.columnFormulas[column.key] ??
            String(row[column.key] ?? "");

          const publishLiveEdit = (
            nextRow: SheetRow,
            nextFormulas = formulas.formulas,
          ) => {
            broadcastSheetSnapshot({
              rows: rows.map((item) => (item.id === row.id ? nextRow : item)),
              formulas: nextFormulas,
              changedAt: Date.now(),
            });
          };

          const onTextChange = (v: string) => {
            if (v.startsWith("=")) {
              const nextFormulas = { ...formulas.formulas, [cellKey]: v };
              formulas.setFormulas(nextFormulas);
              publishLiveEdit(row, nextFormulas);
            } else {
              const nextFormulas = { ...formulas.formulas };
              delete nextFormulas[cellKey];
              const nextRow = { ...row, [column.key]: v };
              formulas.setFormulas(nextFormulas);
              onRowChange(nextRow);
              publishLiveEdit(nextRow, nextFormulas);
            }
          };

          const onNumChange = (v: string) => {
            if (v.startsWith("=")) {
              const nextFormulas = { ...formulas.formulas, [cellKey]: v };
              formulas.setFormulas(nextFormulas);
              publishLiveEdit(row, nextFormulas);
            } else {
              const nextFormulas = { ...formulas.formulas };
              delete nextFormulas[cellKey];
              if (/^-?\d*\.?\d*$/.test(v)) {
                const nextRow = { ...row, [column.key]: v };
                formulas.setFormulas(nextFormulas);
                onRowChange(nextRow);
                publishLiveEdit(nextRow, nextFormulas);
              }
            }
          };

          const onProgressChange = (v: string) => {
            if (v.startsWith("=")) {
              onNumChange(v);
              return;
            }
            if (!/^\d*\.?\d*$/.test(v)) return;
            if (v === "" || v === "." || v.endsWith(".")) {
              const nextRow = { ...row, [column.key]: v };
              onRowChange(nextRow);
              publishLiveEdit(nextRow);
              return;
            }
            const n = Math.min(100, Math.max(0, Number(v)));
            if (!Number.isNaN(n)) {
              const nextRow = { ...row, [column.key]: String(n) };
              onRowChange(nextRow);
              publishLiveEdit(nextRow);
            }
          };

          const onBlurSave = async () => {
            const f = formulas.formulas[cellKey];
            if (f) await saveFormula(sheetId, cellKey, f);
            else await deleteFormula(sheetId, cellKey).catch(() => { });
          };


          const inputStyle: React.CSSProperties = {
            ...cellStyle,
            background: "transparent",
            color: isDark ? "#e2e8f0" : "#1a1d23",
          };

          // ── IMAGE ─────────────────────────────────────────────────────
          if (cellType === "image") {
            return (
              <EditCellWrapper isMergeMaster={isMergeMaster} editWidth={editWidth} editHeight={editHeight} cellStyle={cellStyle} isDark={isDark}>
                <div
                  className="w-full h-full flex items-center justify-center cursor-pointer"
                  onClick={() => {
                    setActiveCell({ rowId: row.id, colKey: column.key });
                    fileInputRef.current?.click();
                  }}
                  style={inputStyle}
                >
                  {row[column.key] ? (
                    <img
                      src={row[column.key]}
                      alt="cell"
                      className="max-h-12 max-w-full object-cover rounded"
                    />
                  ) : (
                    <span className="text-xs text-gray-400">Upload Image</span>
                  )}
                </div>
              </EditCellWrapper>
            );
          }

          // ── CHECKBOX ──────────────────────────────────────────────────
          if (cellType === "checkbox") {
            return (
              <EditCellWrapper isMergeMaster={isMergeMaster} editWidth={editWidth} editHeight={editHeight} cellStyle={cellStyle} isDark={isDark}>
                <div
                  className="h-full w-full flex items-center justify-center cursor-pointer"
                  onClick={() => {
                    const nextRow = { ...row, [column.key]: !row[column.key] };
                    onRowChange(nextRow);
                    publishLiveEdit(nextRow);
                  }}
                >
                  {row[column.key] ? (
                    <span className="h-6 w-6 rounded-md bg-emerald-500/15 border border-emerald-600/60 flex items-center justify-center">
                      <Check className="h-4 w-4 text-emerald-700" />
                    </span>
                  ) : (
                    <span className="h-5 w-5 rounded border border-gray-400/80 bg-white" />
                  )}
                </div>
              </EditCellWrapper>
            );
          }

          // ── PRIORITY / STATUS ─────────────────────────────────────────
          if (cellType === "priority" || cellType === "status") {
            const opts = getChoiceOptionsForColumn({ ...colDef, type: cellType });
            return (
              <EditCellWrapper isMergeMaster={isMergeMaster} editWidth={editWidth} editHeight={editHeight} cellStyle={cellStyle} isDark={isDark}>
                <Select
                  defaultOpen={true}
                  value={String(row[column.key] ?? "")}
                  onValueChange={(v) => {
                    const nextRow = { ...row, [column.key]: v };
                    onRowChange(nextRow);
                    publishLiveEdit(nextRow);
                  }}
                >
                  <SelectTrigger className="w-full h-full border-0 text-xs rounded-none focus:ring-0 bg-transparent">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent
                    side="bottom"
                    align="start"
                    avoidCollisions={false}
                    style={selStyle}
                  >
                    {opts.map((option) => {
                      const value = getSelectOptionLabel(option);
                      const style = getStatusOptionStyle(value);
                      return (
                        <SelectItem
                          key={value}
                          value={value}
                          style={ddItemStyle(isDark)}
                        >
                          <span
                            className="sheet-badge-pill"
                            style={{
                              color: style?.color,
                              backgroundColor: style?.bgColor,
                            }}
                          >
                            {style?.label ?? value}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </EditCellWrapper>
            );
          }

          // ── SELECT ────────────────────────────────────────────────────
          if (cellType === "select") {
            const selectOpts = getChoiceOptionsForColumn(
              colDef,
              cellSelectOptions[cellKey] ?? [],
            );
            return (
              <EditCellWrapper isMergeMaster={isMergeMaster} editWidth={editWidth} editHeight={editHeight} cellStyle={cellStyle} isDark={isDark}>
                <Select
                  defaultOpen={true}
                  value={String(row[column.key] ?? "")}
                  onValueChange={(v) => {
                    const nextRow = { ...row, [column.key]: v };
                    onRowChange(nextRow);
                    publishLiveEdit(nextRow);
                  }}
                >
                  <SelectTrigger className="w-full h-full border-0 text-xs rounded-none focus:ring-0 bg-transparent">
                    <SelectValue placeholder="Select…" />
                  </SelectTrigger>
                  <SelectContent
                    side="bottom"
                    align="start"
                    avoidCollisions={false}
                    style={selStyle}
                  >
                    {selectOpts.map((opt) => {
                      const optionLabel = getSelectOptionLabel(opt);
                      return (
                        <SelectItem
                          key={optionLabel}
                          value={optionLabel}
                          style={ddItemStyle(isDark)}
                        >
                          <span
                            className="sheet-badge-pill"
                            style={getOptionBgStyle(opt)}
                          >
                            {optionLabel}
                          </span>
                        </SelectItem>
                      );
                    })}
                    {selectOpts.length === 0 && (
                      <div className="px-2.5 py-2 text-[11px] text-gray-400 italic">
                        No options — edit column to add some.
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </EditCellWrapper>
            );
          }

          // ── NUMBER / CURRENCY / PROGRESS ──────────────────────────────
          if (
            cellType === "number" ||
            cellType === "currency" ||
            cellType === "progress"
          ) {
            return (
              <EditCellWrapper isMergeMaster={isMergeMaster} editWidth={editWidth} editHeight={editHeight} cellStyle={cellStyle} isDark={isDark}>
                <UncontrolledInput
                  className="w-full h-full px-2.5 text-xs outline-none border-0 text-right tabular-nums font-mono bg-transparent"
                  style={inputStyle}
                  type="text"
                  autoFocus
                  initialValue={editVal}
                  onValueChange={(e: any) =>
                    cellType === "progress"
                      ? onProgressChange(e.target.value)
                      : onNumChange(e.target.value)
                  }
                  onBlur={onBlurSave}
                />
              </EditCellWrapper>
            );
          }

          // ── DATE ──────────────────────────────────────────────────────
          if (cellType === "date") {
            return (
              <EditCellWrapper isMergeMaster={isMergeMaster} editWidth={editWidth} editHeight={editHeight} cellStyle={cellStyle} isDark={isDark}>
                <UncontrolledInput
                  className="w-full h-full px-2.5 text-xs outline-none border-0 bg-transparent"
                  style={inputStyle}
                  type={formulas.formulas[cellKey] ? "text" : "date"}
                  autoFocus
                  initialValue={editVal}
                  onValueChange={(e: any) => onTextChange(e.target.value)}
                  onBlur={onBlurSave}
                />
              </EditCellWrapper>
            );
          }

          // ── TEXT WRAP textarea ────────────────────────────────────────
          if (textWrap.textWrapColumns.has(`${rowIdx}-${column.key}`)) {
            return (
              <EditCellWrapper isTall isMergeMaster={isMergeMaster} editWidth={editWidth} editHeight={editHeight} cellStyle={cellStyle} isDark={isDark}>
                <UncontrolledTextarea
                  className="w-full h-full px-2.5 py-2 text-xs outline-none border-0 resize-none bg-transparent"
                  style={inputStyle}
                  autoFocus
                  initialValue={editVal}
                  onValueChange={(e: any) => onTextChange(e.target.value)}
                  onBlur={onBlurSave}
                  onKeyDown={(e: any) => {
                    if (e.key === "Enter" && !e.shiftKey) e.stopPropagation();
                  }}
                />
              </EditCellWrapper>
            );
          }

          // ── DEFAULT (text + merged tall textarea) ─────────────────────
          const mentionCellKey = `${rowIdx}-${column.key}`;
          const isMentionActive =
            mentionState.active && mentionState.cellKey === mentionCellKey;

          // Tall merged cell — use a textarea so the text wraps nicely
          // Tall merged cell — use a textarea so the text wraps nicely
          if (isMergeMaster && (editHeight ?? 0) > 40) {
            const mergeMode = mergeInfo?.mode;
            return (
              <EditCellWrapper isTall isMergeMaster={isMergeMaster} editWidth={editWidth} editHeight={editHeight} cellStyle={cellStyle} isDark={isDark}>
                <UncontrolledTextarea
                  className="bg-transparent"
                  autoFocus
                  initialValue={editVal}
                  onValueChange={(e: any) => onTextChange(e.target.value)}
                  onBlur={onBlurSave}
                  onKeyDown={(e: any) => {
                    if (e.key === "Enter" && !e.shiftKey) e.stopPropagation();
                    if (e.key === "Escape") e.currentTarget.blur();
                  }}
                  style={{
                    display: "block",
                    width: "100%",
                    height: "100%",
                    boxSizing: "border-box",
                    padding: "6px 10px",
                    margin: 0,
                    fontSize: 12,
                    lineHeight: 1.5,
                    fontFamily: "inherit",
                    textAlign:
                      (cellStyle.textAlign as React.CSSProperties["textAlign"]) ??
                      (mergeMode === "center" ? "center" : "left"),
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    overflowWrap: "break-word",
                    verticalAlign: "top",
                    color: isDark ? "#e2e8f0" : "#1a1d23",
                    border: "none",
                    outline: "none",
                    resize: "none",
                    overflow: "hidden",
                    background: "transparent",
                  }}
                />
              </EditCellWrapper>
            );
          }

          // Standard single-row input (non-merged or single-row merged)
          // Standard single-row input (non-merged or single-row merged)
          return (
            <EditCellWrapper isMergeMaster={isMergeMaster} editWidth={editWidth} editHeight={editHeight} cellStyle={cellStyle} isDark={isDark}>
              <UncontrolledInput
                className="w-full h-full px-2.5 text-xs outline-none border-0 bg-transparent"
                style={{
                  ...inputStyle,
                  textAlign:
                    (cellStyle.textAlign as React.CSSProperties["textAlign"]) ??
                    (mergeInfo?.mode === "center" ? "center" : undefined),
                }}
                autoFocus
                initialValue={editVal}
                onValueChange={(e: any) => {
                  const val = e.target.value;
                  const cursor = e.target.selectionStart ?? val.length;
                  const textBeforeCursor = val.slice(0, cursor);
                  const atMatch = textBeforeCursor.match(/@([\w][\w\s]*)$/);
                  const justAt = textBeforeCursor.match(/@$/);
                  if (
                    (atMatch || justAt) &&
                    isOrgSheet &&
                    orgMembers.length > 0
                  ) {
                    setMentionState({
                      active: true,
                      query: atMatch ? atMatch[1] : "",
                      anchor: null,
                      cellKey: mentionCellKey,
                      inputRef: e.target,
                    });
                  } else {
                    if (mentionState.active)
                      setMentionState((s) => ({ ...s, active: false }));
                  }
                  onTextChange(val);
                }}
                onKeyDown={(e: any) => {
                  if (isMentionActive) {
                    if (e.key === "Escape") {
                      e.stopPropagation();
                      setMentionState((s) => ({ ...s, active: false }));
                    }
                    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                      e.stopPropagation();
                      e.preventDefault();
                    }
                  }
                }}
                onBlur={() => {
                  setTimeout(() => {
                    setMentionState((s) => ({ ...s, active: false }));
                    onBlurSave();
                  }, 160);
                }}
              />
              {/* @mention dropdown */}
              {isMentionActive && mentionableMembers.length > 0 && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    zIndex: 9999,
                    background: isDark ? "#1a1f2e" : "#ffffff",
                    border: `1px solid ${isDark ? "#2a3045" : "#e2e8f0"}`,
                    borderRadius: 8,
                    boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
                    minWidth: 220,
                    maxWidth: 300,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      padding: "6px 10px 4px",
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      color: isDark ? "#4a5568" : "#9ca3af",
                      borderBottom: `1px solid ${isDark ? "#2a3045" : "#f1f5f9"}`,
                    }}
                  >
                    Members
                  </div>
                  {mentionableMembers.map((member) => (
                    <div
                      key={member.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "7px 10px",
                        cursor: "pointer",
                        fontSize: 12,
                        color: isDark ? "#e2e8f0" : "#1a1d23",
                        background: "transparent",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLDivElement).style.background =
                          isDark ? "#2d3244" : "#f8fafc";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLDivElement).style.background =
                          "transparent";
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        const currentVal = mentionState.inputRef?.value ?? String(row[column.key] ?? "");
                        const cursor =
                          mentionState.inputRef?.selectionStart ?? currentVal.length;
                        const before = currentVal.slice(0, cursor);
                        const after = currentVal.slice(cursor);
                        const replaced =
                          before.replace(
                            /@([\w][\w\s]*)?$/,
                            `@${member.name} `,
                          ) + after;
                        if (mentionState.inputRef) {
                          mentionState.inputRef.value = replaced;
                        }
                        onTextChange(replaced);
                        setMentionState((s) => ({ ...s, active: false }));
                        setTimeout(() => {
                          if (mentionState.inputRef) {
                            mentionState.inputRef.focus();
                            const newPos = before.replace(/@([\w][\w\s]*)?$/, `@${member.name} `).length;
                            mentionState.inputRef.setSelectionRange(newPos, newPos);
                          }
                        }, 10);
                      }}
                    >
                      <div
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: "50%",
                          background: getMemberColor(member.id),
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 10,
                          fontWeight: 700,
                          color: "#fff",
                          flexShrink: 0,
                          overflow: "hidden",
                        }}
                      >
                        {member.avatar_url ? (
                          <img
                            src={member.avatar_url}
                            alt=""
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          member.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: 500,
                            color: "#c2185b",
                            textDecoration: "underline",
                            textUnderlineOffset: 2,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          @{member.name}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: isDark ? "#4a5568" : "#9ca3af",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {member.role ?? member.email}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </EditCellWrapper>
          );
        }
      }),
    );

    return [rowNumberCol, ...dataCols];
  }, [
    columns, rows, selectedRows, selectedColumnKey,
    textWrap.textWrapColumns, cellTypes.getCellType,
    getEffectiveCellStyle,
    formulas.setFormulas, formulas.getFormula, formulas.evaluateFormula, formulas.formulas, formulas.columnFormulas, cellSelectOptions,
    protection.getCellKey, protection.isCellProtected, protection.isRowProtected,
    sheetColOps, handleTextWrapToggle, sheetId, columnsHistory, rowsHistory,
    colOps, markSaving, markSaved, handleApplyFormulaToColumn,
    handleRemoveColumnFormula, handleApplyColumnFormat, handleToggleFreezeColumn,
    isOrgSheet, comments, activeCursors, isDark, beginRowResize, onRowResizeMove,
    endRowResize, toggleRowProtectionById, onFillStart, rightPanel, canEditSheet,
    showViewerEditMessage, broadcastSheetSnapshot, selectionRange, selectedCell,
    setSheetState, setSelectedColumnKey, setSelectedCell, setSelectionRange,
    setFocusedColumnKey, setRightPanel, setActiveCell, saveAllRows, saveAllColumns,
    saveFormula, deleteFormula, mentionState, mentionableMembers, setMentionState,
    mergeByCell, autoOverflowByCell, selectMergeBlock, rowHeights,
    timeTravelState.previewRows, beginColResize,
  ]);

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <TooltipProvider delayDuration={250}>
      <div
        className={`sheet-root h-screen flex flex-col select-none overflow-hidden ${isDark ? "sheet-dark" : "sheet-light"
          }`}
      >
        <TitleBar
          title={title}
          starred={starred}
          saveStatus={saveStatus}
          isOrgSheet={isOrgSheet}
          isDark={isDark}
          importSource={importSource}
          forks={forks}
          activeMembers={activeSheetMembers}
          currentUser={currentUser}
          isImportingSheet={isImportingSheet}
          totalComments={totalComments}
          canEditSheet={canEditSheet}
          canShareSheet={!!currentUser}
          onTitleChange={handleTitleChange}
          onTitleBlur={handleTitleBlur}
          onStarredToggle={handleStarredToggle}
          onImportClick={() => importInputRef.current?.click()}
          onExport={persistence.handleExport}
          onShareClick={() => setShowShareDialog(true)}
          onNotificationsClick={() => toggleRightPanel("comments")}
        />
        <input
          ref={importInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={handleSheetImport}
          disabled={isImportingSheet}
        />
        <input
          ref={floatingImageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFloatingImageChange}
        />

        <FormattingBar
          isDark={isDark}
          selectedCell={selectedCell}
          selectedCellType={selectedCellType}
          isSelectedColumnWrapped={isSelectedColumnWrapped}
          isProtected={isSelectedRowProtected}
          canProtectRows={canProtectRows}
          fontFamily={fontFamily}
          fontSize={fontSize}
          zoomLevel={zoomLevel}
          filteredRowsCount={filteredRows.length}
          searchQuery={searchQuery}
          showSearch={showSearch}
          canUndo={rowsHistory.canUndo}
          canRedo={rowsHistory.canRedo}
          currentFormat={getCellAndRowFormat(selectedCell)}
          onUndo={rowsHistory.undo}
          onRedo={rowsHistory.redo}
          onZoomChange={(z) => setZoomLevel(Math.max(50, Math.min(200, z)))}
          onCopy={handleSmartCopy}
          onCut={() => {
            if (selectedCell) {
              const rowId = rows[selectedCell.row]?.id;
              if (rowId && protection.isRowProtected(rowId)) {
                toast.error("This row is protected");
                return;
              }
            }
            clipboard.cutCellOrRange(selectedCell);
          }}
          onPaste={handlePaste}
          onFontFamilyChange={(f) => {
            setFontFamily(f);
            if (selectedCell || (selectedRows && selectedRows.size > 0)) handleFormatChange({ fontFamily: f });
          }}
          onFontSizeChange={(s) => {
            setFontSize(s);
            if (selectedCell || (selectedRows && selectedRows.size > 0)) handleFormatChange({ fontSize: Number(s) });
          }}
          onFormatChange={handleFormatChange}
          onCellTypeChange={handleSelectedCellTypeChange}
          selectedRows={selectedRows}
          onTextWrapToggle={handleTextWrapToggle}
          onProtectionToggle={handleToggleRowProtection}
          onFormulaOpen={() => {
            if (!selectedCell) {
              toast.info("Select a cell first.");
              return;
            }
            setShowFormulaDialog(true);
          }}
          onSearchToggle={() => setShowSearch(true)}
          onSearchChange={setSearchQuery}
          onSearchClose={() => {
            setShowSearch(false);
            setSearchQuery("");
          }}
          onSort={(dir) => {
            if (!selectedCell) {
              toast.info("Select a column first to sort");
              return;
            }
            const sorted = [...rows].sort((a, b) => {
              const va = String(a[selectedCell.col] ?? "");
              const vb = String(b[selectedCell.col] ?? "");
              return dir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
            });
            rowsHistory.pushState(sorted);
            toast.success(`Sorted ${dir === "asc" ? "A → Z" : "Z → A"}`);
          }}
          onHideColumn={sheetColOps.handleHideColumn}
          onFillColumnNumbers={() =>
            selectedCell && handleFillColumnNumbers(selectedCell.col)
          }
          onFillColumnHashNumbers={() =>
            selectedCell && handleFillColumnHashNumbers(selectedCell.col)
          }
          selectedColumnKey={selectedColumnKey}
          selectedColumnWidth={
            selectedColumnKey
              ? (columns.find((c) => c.key === selectedColumnKey)?.width ?? 160)
              : null
          }
          onSetColumnWidth={(w) => {
            if (selectedColumnKey) {
              const updated = columns.map((c) =>
                c.key === selectedColumnKey ? { ...c, width: w } : c,
              );
              setSheetState((p) => ({ ...p, columns: updated }));
              columnsHistory.pushState(updated);
              markSaving();
              saveAllColumns(sheetId, updated)
                .then(() => markSaved())
                .catch((err) => {
                  console.error("Failed to save column width:", err);
                  setSaveStatus("saved");
                });
            }
          }}
          onExpandAllColumns={(amount) => {
            const updated = columns.map((c) => ({
              ...c,
              width: Math.max(30, (c.width ?? 160) + amount),
            }));
            setSheetState((p) => ({ ...p, columns: updated }));
            columnsHistory.pushState(updated);
            markSaving();
            saveAllColumns(sheetId, updated)
              .then(() => markSaved())
              .catch((err) => {
                console.error("Failed to save column widths:", err);
                setSaveStatus("saved");
              });
          }}
          onDragResizeAllColumns={(amount) => {
            const updated = columns.map((c) => ({
              ...c,
              width: Math.max(30, Math.min(600, (c.width ?? 160) + amount)),
            }));
            setSheetState((p) => ({ ...p, columns: updated }));
            columnsHistory.pushState(updated);
          }}
          onEndResizeAllColumns={() => {
            setTimeout(async () => {
              markSaving();
              await saveAllColumns(sheetId, columnsHistory.stateRef.current).catch(console.error);
              markSaved();
            }, 50);
          }}
          onOpenValidation={() => {
            if (selectedColumnKey) {
              setFocusedColumnKey(selectedColumnKey);
              setRightPanel("validation");
            }
          }}
          canMergeSelection={canMergeSelection}
          isMergedSelection={Boolean(selectedMergeInfo)}
          onMergeSelection={handleMergeSelection}
          onUnmergeSelection={handleUnmergeSelection}
          onMakeSheetBorderless={handleMakeSheetBorderless}
          selectionRange={selectionRange}
          onSelectAllRows={() => setSelectedRows(new Set(filteredRows.map((r) => r.id)))}
        />

        <FormulaBar
          selectedCell={selectedCell}
          columns={columns}
          rows={rows}
          formulas={formulas}
          protection={protection}
          sheetId={sheetId}
          isDark={isDark}
          canEditSheet={canEditSheet}
          onRowsChange={handleRowsChange}
          onSaveFormula={saveFormula}
          onDeleteFormula={deleteFormula}
        />

        <ActionBar
          isDark={isDark}
          isOrgSheet={isOrgSheet}
          userRole={sheetState.userRole}
          ownerId={sheetState.ownerId}
          currentUserId={currentUser?.id}
          canEditSheet={canEditSheet}
          selectedRows={selectedRows}
          selectedCell={selectedCell}
          columns={columns}
          showFilters={showFilters}
          filterValue={filterValue}
          advancedFiltersCount={advancedFilters.length}
          chartCount={charts.charts.length}
          showChartPicker={charts.showPicker}
          conditionalRulesCount={conditionalRules.length}
          effectiveRightPanel={effectiveRightPanel}
          totalComments={totalComments}
          historyLength={history.length}
          frozenRowsCount={frozenRowsCount}
          onInsertRow={() => {
            if (!canEditSheet) {
              showViewerEditMessage();
              return;
            }
            const currentRows = rowsHistory.currentState;
            const currentCols = columnsHistory.currentState;
            const newRow: SheetRow = {
              id: `row_${Date.now()}_${Math.random().toString(36).slice(2)}`,
            };
            currentCols.forEach((col) => {
              newRow[col.key] = "";
            });
            const nextRows = [...currentRows, newRow];
            rowsHistory.pushState(nextRows);
            setSheetState((p) => ({ ...p, rows: nextRows }));
            markSaving();
            saveAllRows(sheetId, nextRows)
              .then(() => {
                markSaved();
                broadcastSheetSnapshot({ rows: nextRows });
              })
              .catch((error) => {
                toast.error(`Failed to save new row error: ${error}`);
                setSaveStatus("saved");
              });
          }}
          onInsertColumn={(type) => {
            if (!canEditSheet) {
              showViewerEditMessage();
              return;
            }
            const currentCols = columnsHistory.currentState;
            const currentRows = rowsHistory.currentState;
            const newKey = `col_${Date.now()}_${Math.random()
              .toString(36)
              .slice(2)}`;
            const newCol: ColumnDef = {
              key: newKey,
              name: `Column ${currentCols.length + 1}`,
              type: type ?? "text",
              width: 160,
              editable: true,
              position: currentCols.length,
            };
            const nextCols = [...currentCols, newCol];
            const nextRows = currentRows.map((row) => ({
              ...row,
              [newKey]: "",
            }));
            columnsHistory.pushState(nextCols);
            rowsHistory.pushState(nextRows);
            setSheetState((p) => ({
              ...p,
              columns: nextCols,
              rows: nextRows,
            }));
            markSaving();
            Promise.all([
              saveAllColumns(sheetId, nextCols),
              saveAllRows(sheetId, nextRows),
            ])
              .then(() => {
                markSaved();
                broadcastSheetSnapshot({ columns: nextCols, rows: nextRows });
                toast.success(`${type ?? "text"} column added`);
                if (type === "select") {
                  setFocusedColumnKey(newKey);
                  setRightPanel("select-options");
                }
              })
              .catch((error) => {
                toast.error(`Failed to save new column error: ${error}`);
                setSaveStatus("saved");
              });
          }}
          onDeleteRow={sheetRowOps.handleDeleteRow}
          onSortAsc={() => {
            if (!selectedCell) {
              toast.info("Select a column first to sort");
              return;
            }
            sheetRowOps.handleSortByColumn(selectedCell.col, "asc");
          }}
          onSortDesc={() => {
            if (!selectedCell) {
              toast.info("Select a column first to sort");
              return;
            }
            sheetRowOps.handleSortByColumn(selectedCell.col, "desc");
          }}
          onToggleFilters={() => setShowFilters(!showFilters)}
          onHideColumn={sheetColOps.handleHideColumn}
          onToggleChartPicker={
            charts.showPicker ? charts.closePicker : charts.openPicker
          }
          onTogglePanel={(panel) => {
            if (
              (panel === "validation" || panel === "automation") &&
              selectedCell?.col
            ) {
              setFocusedColumnKey(selectedCell.col);
            }
            toggleRightPanel(panel);
            if (panel === "timetravel") {
              if (rightPanel !== "timetravel") timeTravelActions.openPanel();
              else timeTravelActions.closePanel();
            }
          }}
          onToggleRowProtection={handleToggleRowProtection}
          canProtectRows={canProtectRows}
          onTogglePinRow={handleTogglePinRow}
          selectedRowPinned={
            selectedCell
              ? (rows[selectedCell.row]?.pinned ?? false)
              : (selectedRows && selectedRows.size > 0
                ? (rows.find((r) => selectedRows.has(r.id))?.pinned ?? false)
                : false)
          }
          onToggleDark={() => setIsDark(!isDark)}
          onToggleFreezeRows={handleToggleFreezeRows}
          onInsertFloatingImage={() => floatingImageInputRef.current?.click()}
          chartBtnRef={chartBtnRef as any}
        />

        {showFilters && (
          <FilterBar
            filterValue={filterValue}
            advancedFilters={advancedFilters}
            filterColumns={filterColumns}
            filteredRowsCount={filteredRows.length}
            totalRowsCount={rows.length}
            filterSuggestions={filterSuggestions}
            onFilterValueChange={setFilterValue}
            onAddRule={() => {
              const firstCol = filterColumns[0];
              setAdvancedFilters((prev) => [
                ...prev,
                {
                  id: `filter_${Date.now()}_${Math.random()
                    .toString(36)
                    .slice(2)}`,
                  columnKey: firstCol?.key ?? "",
                  operator: "contains",
                  value: "",
                },
              ]);
            }}
            onUpdateRule={(id, update) =>
              setAdvancedFilters((prev) =>
                prev.map((item) =>
                  item.id === id ? { ...item, ...update } : item,
                ),
              )
            }
            onRemoveRule={(id) =>
              setAdvancedFilters((prev) =>
                prev.filter((item) => item.id !== id),
              )
            }
            onClear={() => {
              setFilterValue("");
              setAdvancedFilters([]);
              setShowFilters(false);
            }}
            savedViews={availableFilterViews}
            onSaveView={(name) => {
              persistSavedViews([
                ...savedViews.filter((view) => view.name !== name),
                { id: `view_${Date.now()}`, name, filterValue, advancedFilters },
              ]);
              toast.success("Filter view saved");
            }}
            onApplyView={(view) => {
              setFilterValue(view.filterValue);
              setAdvancedFilters(view.advancedFilters);
              setShowFilters(true);
            }}
            onDeleteView={(id) =>
              persistSavedViews(savedViews.filter((view) => view.id !== id))
            }
          />
        )}

        {/* ── MAIN BODY ─────────────────────────────────────────────── */}
        <div className="flex-1 flex overflow-hidden relative">
          <div className="flex-1 overflow-hidden relative">
            <div
              className="h-full w-full"
              style={{
                transform: `scale(${zoomLevel / 100})`,
                transformOrigin: "top left",
                width: `${(100 * 100) / zoomLevel}%`,
                height: `${(100 * 100) / zoomLevel}%`,
              }}
            >
              {/*
               * FIX 3 — DataGrid wired up with:
               *   ref={gridRef}         → enables startEditingCell()
               *   onCellDoubleClick     → redirects covered cells to master
               */}
              <DataGrid
                ref={gridRef}
                columns={gridColumns}
                rows={gridRows}
                topSummaryRows={topFrozenRows}
                summaryRowHeight={32}
                rowKeyGetter={(row: SheetRow) => row.id}
                onRowsChange={handleRowsChange}
                selectedRows={selectedRows}
                onSelectedRowsChange={setSelectedRows}
                onColumnResize={(idx, width) => {
                  const col = columns[idx - 1];
                  if (!col) return;
                  setSheetState((p) => {
                    const updatedColumns = p.columns.map((c) =>
                      c.key === col.key ? { ...c, width } : c
                    );
                    clearTimeout((window as any).__colResizeTimer);
                    (window as any).__colResizeTimer = setTimeout(() => {
                      columnsHistory.pushState(updatedColumns);
                      markSaving();
                      saveAllColumns(sheetId, updatedColumns)
                        .then(markSaved)
                        .catch((err) => {
                          toast.error("Failed to save column widths", err);
                          console.log("error to save column width", err)
                          setSaveStatus("saved");
                        });
                    }, 800);
                    return { ...p, columns: updatedColumns };
                  });
                }}
                onCellDoubleClick={handleCellDoubleClick}
                rowHeight={(row) => {
                  const rowIdx = rows.findIndex((r) => r.id === row.id);
                  const hasMergeMaster = columns.some((col) => {
                    const mi = mergeByCell.get(`${rowIdx}-${col.key}`);
                    return (
                      mi && !mi.hidden && mi.rowSpan * mi.colSpan > 1
                    );
                  });

                  const manual = rowHeights[row.id];

                  if (hasMergeMaster) {
                    const hasMergeWrap = columns.some((col) => {
                      const mi = mergeByCell.get(`${rowIdx}-${col.key}`);
                      if (
                        !mi ||
                        mi.hidden ||
                        mi.rowSpan * mi.colSpan <= 1
                      )
                        return false;
                      return textWrap.textWrapColumns.has(
                        `${rowIdx}-${col.key}`,
                      );
                    });
                    if (!hasMergeWrap) return manual ?? 33;
                    let max = 1;
                    columns.forEach((col) => {
                      const mi = mergeByCell.get(`${rowIdx}-${col.key}`);
                      if (
                        !mi ||
                        mi.hidden ||
                        mi.rowSpan * mi.colSpan <= 1
                      )
                        return;
                      if (
                        !textWrap.textWrapColumns.has(`${rowIdx}-${col.key}`)
                      )
                        return;
                      const v = String(row[col.key] || "");
                      if (!v) return;
                      const masterColIdx =
                        columnIndexByKey.get(mi.masterCol) ?? 0;
                      const totalWidth = columns
                        .slice(masterColIdx, masterColIdx + mi.colSpan)
                        .reduce((s, c) => s + (c.width ?? 160), 0);
                      const charsPerLine = Math.floor(
                        (totalWidth - 20) / 7,
                      );
                      const lineCount = v
                        .split("\n")
                        .reduce(
                          (a, l) =>
                            a +
                            (Math.ceil(l.length / charsPerLine) || 1),
                          0,
                        );
                      if (lineCount > max) max = lineCount;
                    });
                    const wrapHeight = Math.max(33, 8 + max * 20);
                    return manual ? Math.max(wrapHeight, manual) : wrapHeight;
                  }

                  if (textWrap.textWrapColumns.size === 0) return manual ?? 32;
                  let max = 1;
                  const ri =
                    rowIdx >= 0
                      ? rowIdx
                      : rows.findIndex((r) => r.id === row.id);
                  const wk = new Set(
                    [...textWrap.textWrapColumns]
                      .filter((k) => k.startsWith(`${ri}-`))
                      .map((k) => k.replace(`${ri}-`, "")),
                  );
                  wk.forEach((ck) => {
                    const v = String(row[ck] || "");
                    if (!v) return;
                    const cd = columns.find((c) => c.key === ck);
                    const cpl = Math.floor(
                      ((cd?.width || 160) - 20) / 7,
                    );
                    const tl = v
                      .split("\n")
                      .reduce(
                        (a, l) => a + (Math.ceil(l.length / cpl) || 1),
                        0,
                      );
                    if (tl > max) max = tl;
                  });
                  const wrapHeight = Math.max(32, 8 + max * 20);
                  return manual ? Math.max(wrapHeight, manual) : wrapHeight;
                }}
                headerRowHeight={33}
                className={`rdg-sheet fill-grid ${isDark ? "rdg-dark" : "rdg-light"
                  } ${formatting.cellFormats["sheet:all"]?.borderStyle === "none" ? "sheet-borderless" : ""
                  }`}
              />
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                className="hidden"
                onChange={handleImageChange}
              />
            </div>

            {floatingImages.map((image) => (
              <div
                key={image.id}
                className="absolute z-20 rounded-md border bg-white shadow-xl overflow-hidden"
                style={{
                  left: image.x,
                  top: image.y,
                  width: image.width,
                  height: image.height,
                  borderColor: isDark ? "#334155" : "#cbd5e1",
                }}
                onPointerMove={handleFloatingImagePointerMove}
                onPointerUp={handleFloatingImagePointerUp}
                onPointerCancel={handleFloatingImagePointerUp}
              >
                <div
                  className="absolute left-0 right-0 top-0 z-10 flex h-7 items-center justify-between bg-black/55 px-2 text-white"
                  style={{ cursor: "grab", touchAction: "none" }}
                  onPointerDown={(e) => handleFloatingImagePointerDown(image, "move", e)}
                >
                  <span className="truncate text-[11px] font-medium">
                    {image.name || "Image"}
                  </span>
                  <button
                    type="button"
                    className="flex h-5 w-5 items-center justify-center rounded hover:bg-white/20"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFloatingImage(image.id);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
                <img
                  src={image.src}
                  alt={image.name || "Floating image"}
                  className="h-full w-full object-contain"
                  draggable={false}
                />
                <div
                  className="absolute bottom-0 right-0 h-6 w-6 cursor-se-resize"
                  style={{ touchAction: "none" }}
                  onPointerDown={(e) => handleFloatingImagePointerDown(image, "resize", e)}
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" className="absolute bottom-1 right-1">
                    <path d="M16 6L6 16M16 11L11 16" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
              </div>
            ))}

            {/* Charts */}
            {charts.charts.map((chart) => (
              <ChartWidget
                key={chart.id}
                chart={chart}
                isActive={charts.activeChartId === chart.id}
                isDark={isDark}
                rows={rows}
                columns={columns}
                onSelect={(id) => charts.setActiveChart(id)}
                onOpenEditor={(id) => {
                  charts.setActiveChart(id);
                  setRightPanel("charts");
                }}
                onRemove={charts.removeChart}
                onPositionChange={charts.updatePosition}
                onSizeChange={charts.updateSize}
                onMinimize={(id, val) =>
                  charts.updateChart(id, { minimized: val })
                }
              />
            ))}
          </div>

          {/* Right panel */}
          {effectiveRightPanel &&
            (rightPanel === "comments" ||
              rightPanel === "developer" ||
              rightPanel === "timetravel" ||
              rightPanel === "charts" ||
              rightPanel === "conditional" ||
              rightPanel === "columns" ||
              rightPanel === "select-options" ||
              rightPanel === "row-details" ||
              rightPanel === "validation" ||
              rightPanel === "shortcuts" ||
              rightPanel === "formulas" ||
              rightPanel === "automation" ||
              rightPanel === "aiassistant" ||
              isOrgSheet) && (
              <>
                {effectiveRightPanel !== "charts" && (
                  <div
                    className="fixed inset-0 bg-black/40 z-20 sm:hidden backdrop-blur-[1px]"
                    onClick={() => setRightPanel(null)}
                  />
                )}
                <div className="fixed right-0 top-0 bottom-0 z-30 sm:static sm:z-auto w-80 max-w-[88vw] shadow-2xl sm:shadow-none transition-transform duration-200 ease-out">
                  <RightPanel
                    rightPanel={effectiveRightPanel}
                    isDark={isDark}
                    setRightPanel={setRightPanel}
                    comments={groupedCommentsForPanel}
                    activeCommentCell={activeCommentCell}
                    newCommentText={newCommentText}
                    replyText={replyText}
                    setNewCommentText={setNewCommentText}
                    handleAddComment={handleAddComment}
                    handleReply={handleReply}
                    handleResolveComment={handleResolveComment}
                    setReplyText={setReplyText}
                    liveTracking={liveTracking}
                    isOrganizationSheet={isOrgSheet}
                    setLiveTracking={(v) =>
                      setSheetState((p) => ({ ...p, liveTracking: v }))
                    }
                    setShowShareDialog={setShowShareDialog}
                    sheetId={sheetId}
                    rows={rows}
                    columns={columns}
                    totalComments={totalComments}
                    historyCount={history.length}
                    members={orgMembers}
                    activeMemberIds={activeSheetMemberIds}
                    canManageMembers={isOwner}
                    currentUserId={currentUser?.id}
                    onMembersChange={setOrgMembers}
                    timeTravelState={timeTravelState}
                    timeTravelActions={timeTravelActions}
                    activeChart={charts.activeChart}
                    chartPanelTab={charts.panelTab}
                    setChartPanelTab={charts.setPanelTab}
                    onUpdateChart={(patch) => {
                      if (charts.activeChartId)
                        charts.updateChart(charts.activeChartId, patch);
                    }}
                    onRemoveChart={() => {
                      if (charts.activeChartId) {
                        charts.removeChart(charts.activeChartId);
                        setRightPanel(null);
                      }
                    }}
                    selectedCell={selectedCell}
                    conditionalRules={conditionalRules}
                    selectionRange={selectionRange}
                    onSaveConditionalRule={handleSaveConditionalRule}
                    onDeleteConditionalRule={handleDeleteConditionalRule}
                    onApplyColumns={handleApplyColumns}
                    onBulkUpdateColumn={handleBulkUpdateColumn}
                    focusedColumnKey={
                      focusedColumnKey ?? selectedCell?.col ?? null
                    }
                    onApplySelectOptions={handleApplySelectOptions}
                    selectedRowIndex={selectedCell?.row ?? null}
                    history={history}
                    onApplyValidation={handleApplyValidation}
                    onUpdateRow={handleUpdateRow}
                    onInsertFormula={handleFormulaInsert}
                    onRunAutomation={() => {
                      if (selectedCell && rows[selectedCell.row])
                        runAutomationsForRows([rows[selectedCell.row]]);
                    }}
                    allColumns={columns}
                    onRangeSelect={handleRangeSelect}
                  />
                </div>
              </>
            )}
        </div>

        <StatusBar
          rowCount={rows.length}
          columnCount={columns.length}
          selectedRowsCount={selectedRows.size}
          selectedCell={selectedCell}
          columns={columns}
          filterValue={filterValue}
          filteredRowsCount={filteredRows.length}
          totalRowsCount={rows.length}
          isOrgSheet={isOrgSheet}
          liveTracking={liveTracking}
          chartCount={charts.charts.length}
          canEditSheet={canEditSheet}
          onChartsClick={() => setRightPanel("charts")}
          onShortcutsClick={() => toggleRightPanel("shortcuts")}
        />

        {/* ── Modals ───────────────────────────────────────────────── */}
        {currentUser && (
          <ShareDialog
            showShareDialog={showShareDialog}
            setShowShareDialog={setShowShareDialog}
            sheetId={sheetId}
            isDark={isDark}
            organizations={userOrganizations}
            currentOrg={sheetState.organizationId ? { id: sheetState.organizationId, name: sheetState.organizationName || "" } : undefined}
            onShared={(orgId) => {
              setSheetState((prev) => ({
                ...prev,
                isOrgSheet: true,
                organizationId: orgId,
              }));
            }}
          />
        )}

        <Dialog open={showDesktopTip} onOpenChange={setShowDesktopTip}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Tip</DialogTitle>
              <DialogDescription>
                This sheet experience is optimized for desktop. For the best
                view, use desktop or landscape mode.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={() => setShowDesktopTip(false)}>Got it</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {showFormulaDialog && (
          <FormulaDialog
            open={showFormulaDialog}
            onClose={() => setShowFormulaDialog(false)}
            onInsert={handleFormulaInsert}
            isDark={isDark}
          />
        )}

        {charts.showPicker && (
          <ChartPicker
            isDark={isDark}
            anchorRef={chartBtnRef}
            onSelect={(kind, preset) => {
              charts.insertChart(kind, rows, columns, {
                ...getSuggestedChartPreset(kind),
                ...preset,
              });
              setTimeout(
                () => broadcastSheetSnapshot({ charts: charts.charts }),
                100,
              );
              toast.success(
                `${kind.charAt(0).toUpperCase() + kind.slice(1)
                } chart inserted — click to edit`,
              );
            }}
            onClose={charts.closePicker}
          />
        )}

        {/* Sheet onboarding tour */}
        {showSheetTour && (
          <div className="fixed inset-0 z-[80] bg-black/55 backdrop-blur-[1px] pointer-events-auto">
            <div
              className={`absolute left-1/2 top-1/2 w-[min(92vw,380px)] -translate-x-1/2 -translate-y-1/2 rounded-lg border p-4 shadow-2xl ${isDark
                ? "border-gray-700 bg-gray-950 text-gray-100"
                : "border-gray-200 bg-white text-gray-900"
                }`}
            >
              <div className="text-[11px] font-semibold uppercase tracking-wide text-primary">
                Sheet guide {tourStep + 1} of {SHEET_TOUR_STEPS.length}
              </div>
              <h2 className="mt-2 text-base font-semibold">
                {SHEET_TOUR_STEPS[tourStep].title}
              </h2>
              <p
                className={`mt-2 text-sm leading-relaxed ${isDark ? "text-gray-300" : "text-gray-600"
                  }`}
              >
                {SHEET_TOUR_STEPS[tourStep].body}
              </p>
              <div className="mt-4 flex items-center justify-between gap-2">
                <button
                  type="button"
                  className={`rounded-md px-3 py-1.5 text-xs ${isDark
                    ? "text-gray-400 hover:bg-gray-800"
                    : "text-gray-500 hover:bg-gray-100"
                    }`}
                  onClick={() => setShowSheetTour(false)}
                >
                  Skip
                </button>
                <Button
                  size="sm"
                  onClick={() => {
                    if (tourStep >= SHEET_TOUR_STEPS.length - 1) {
                      setShowSheetTour(false);
                      return;
                    }
                    setTourStep((step) => step + 1);
                  }}
                >
                  {tourStep >= SHEET_TOUR_STEPS.length - 1 ? "Done" : "Next"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ── Global styles ─────────────────────────────────────────── */}
        <style jsx global>{`
  /* Scrollbars */
  .sheet-root * {
    scrollbar-width: thin;
    scrollbar-color: #c7cdd8 transparent;
  }
  .sheet-root *::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  .sheet-root *::-webkit-scrollbar-thumb {
    background: #c7cdd8;
    border-radius: 999px;
  }
  .sheet-root *::-webkit-scrollbar-track {
    background: transparent;
  }
  .no-scrollbar {
    -ms-overflow-style: auto;
    scrollbar-width: thin;
  }

  /* ── Merge master cell ───────────────────────────────────── */
  .rdg-sheet .rdg-cell:has(.sheet-cell-merge-master) {
    overflow: visible !important;
    contain: none !important;
    z-index: 6;
    border: none !important;
    background: transparent !important;
    box-shadow: none !important;
    outline: none !important;
    isolation: isolate;
  }
  .rdg-sheet .rdg-cell:has(.sheet-cell-merge-master)[aria-selected="true"],
  .rdg-sheet .rdg-row:hover .rdg-cell:has(.sheet-cell-merge-master) {
    outline: none !important;
    background: transparent !important;
  }
  
  .sheet-cell-merge-master {
    border: 1px solid var(--rdg-border-color, #e8eaed) !important;
  }
  
  .sheet-cell-merge-master.sheet-cell-active-selected,
  .sheet-cell-merge-master:has(input:focus),
  .sheet-cell-merge-master:has(textarea:focus) {
    outline: 2px solid var(--primary, #0d7c5f) !important;
    outline-offset: -2px !important;
  }

  .rdg-sheet .rdg-row:hover .rdg-cell:has(.sheet-cell-merge-master) {
    background: transparent !important;
    outline: none !important;
    box-shadow: none !important;
  }

  .rdg-sheet .rdg-cell:has(.sheet-cell-merge-master)[aria-selected="true"] {
    outline: none !important;
    background: transparent !important;
  }

  /* ── Covered (slave) cells ───────────────────────────────── */
  .rdg-sheet .rdg-cell:has(.sheet-merge-covered-cell) {
    border-top: none !important;
    border-left: none !important;
    outline: none !important;
    background: transparent !important;
    box-shadow: none !important;
    overflow: visible !important;
    contain: none !important;
  }
  .rdg-sheet .rdg-cell:has(.sheet-merge-covered-cell)[aria-selected="true"],
  .rdg-sheet .rdg-cell:has(.sheet-merge-covered-cell):hover,
  .rdg-sheet .rdg-row:hover .rdg-cell:has(.sheet-merge-covered-cell) {
    outline: none !important;
    background: transparent !important;
    box-shadow: none !important;
  }
  .sheet-merge-covered-cell {
    background: transparent !important;
    pointer-events: auto;
    cursor: cell;
  }
  
  .rdg-sheet .rdg-cell:has(.sheet-merge-covered-cell) input,
  .rdg-sheet .rdg-cell:has(.sheet-merge-covered-cell) textarea {
    display: none !important;
  }

  /* ── Selection outline ────────────────────────────────────── */
  .rdg-sheet .rdg-cell[aria-selected="true"] {
    outline: 2px solid var(--primary, #0d7c5f) !important;
    outline-offset: -2px !important;
    z-index: 9 !important;
  }
  .rdg-sheet .rdg-header-row .rdg-cell {
    outline: 1px solid var(--rdg-border-color, #e2e8f0) !important;
    outline-offset: -1px !important;
    border: none !important;
  }
  .sheet-dark .rdg-sheet .rdg-cell {
    outline-color: #2a3045 !important;
  }

  @media (max-width: 640px) {
    .rdg-sheet { font-size: 11px !important; }
    .sheet-column-type-submenu {
      transform: translate3d(0, 6px, 0) !important;
      max-width: calc(100vw - 24px);
    }
  }

  .sheet-cell-merge-master {
    border: 1px solid var(--sh-border, #e8eaed) !important;
    overflow: visible !important;
  }

  .sheet-cell-merge-master.sheet-cell-active-selected {
    outline: 2px solid var(--primary, #0d7c5f) !important;
    outline-offset: -2px !important;
  }

  .rdg-cell:has(.sheet-merge-covered-cell) input,
  .rdg-cell:has(.sheet-merge-covered-cell) textarea {
    display: none !important;
  }

  /* ── Borderless Mode Conditional Injections ── */
  
  /* Strip gridlines ONLY if cell DOES NOT contain a custom explicit border node */
  .rdg-sheet.sheet-borderless .rdg-cell:not(:has([data-explicit-border="true"])),
  .rdg-sheet.sheet-borderless .rdg-row .rdg-cell:not(:has([data-explicit-border="true"])),
  .rdg-sheet.sheet-borderless .rdg-row:hover .rdg-cell:not(:has([data-explicit-border="true"])),
  .rdg-sheet.sheet-borderless .rdg-cell:hover:not(:has([data-explicit-border="true"])),
  .rdg-sheet.sheet-borderless .rdg-cell:first-child:not(:has([data-explicit-border="true"])) {
    border: none !important;
    outline: none !important;
    box-shadow: none !important;
  }

  /* Condition: If cell contains a custom explicit border, force cell view wrapper to show it */
  .rdg-sheet.sheet-borderless .rdg-cell:has([data-explicit-border="true"]) {
    border: none !important;
    overflow: visible !important;
    contain: none !important;
  }

  /* Header row retains borders in borderless mode */

  .rdg-sheet.sheet-borderless .sheet-cell-merge-master:not([data-explicit-border="true"]) {
    border: none !important;
  }

.rdg-sheet.sheet-borderless .rdg-cell[aria-selected="true"] {
    outline: 2px solid var(--primary, #0d7c5f) !important;
    box-shadow: none !important;
  }
  .sheet-col-resize-handle {
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    width: 6px;
    cursor: col-resize;
    z-index: 20;
    user-select: none;
    touch-action: none;
  }
  .sheet-col-resize-handle::after {
    content: '';
    position: absolute;
    right: 1px;
    top: 20%;
    bottom: 20%;
    width: 2px;
    border-radius: 1px;
    background: transparent;
    transition: background 0.15s;
  }
  .sheet-col-resize-handle:hover::after,
  .sheet-col-resize-handle:active::after {
    background: var(--primary, #0d7c5f);
  }
`}</style><style jsx global>{`
  /* Scrollbars */
  .sheet-root * {
    scrollbar-width: thin;
    scrollbar-color: #c7cdd8 transparent;
  }
  .sheet-root *::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  .sheet-root *::-webkit-scrollbar-thumb {
    background: #c7cdd8;
    border-radius: 999px;
  }
  .sheet-root *::-webkit-scrollbar-track {
    background: transparent;
  }
  .no-scrollbar {
    -ms-overflow-style: auto;
    scrollbar-width: thin;
  }

  /* ── Merge master cell ───────────────────────────────────── */
  .rdg-sheet .rdg-cell:has(.sheet-cell-merge-master) {
    overflow: visible !important;
    contain: none !important;
    z-index: 6;
    border: none !important;
    background: transparent !important;
    box-shadow: none !important;
    outline: none !important;
    isolation: isolate;
  }
  .rdg-sheet .rdg-cell:has(.sheet-cell-merge-master)[aria-selected="true"],
  .rdg-sheet .rdg-row:hover .rdg-cell:has(.sheet-cell-merge-master) {
    outline: none !important;
    background: transparent !important;
  }
  
  .sheet-cell-merge-master {
    border: 1px solid var(--rdg-border-color, #e8eaed) !important;
  }
  
  .sheet-cell-merge-master.sheet-cell-active-selected,
  .sheet-cell-merge-master:has(input:focus),
  .sheet-cell-merge-master:has(textarea:focus) {
    outline: 2px solid var(--primary, #0d7c5f) !important;
    outline-offset: -2px !important;
  }

  .rdg-sheet .rdg-row:hover .rdg-cell:has(.sheet-cell-merge-master) {
    background: transparent !important;
    outline: none !important;
    box-shadow: none !important;
  }

  .rdg-sheet .rdg-cell:has(.sheet-cell-merge-master)[aria-selected="true"] {
    outline: none !important;
    background: transparent !important;
  }

  /* ── Covered (slave) cells ───────────────────────────────── */
  .rdg-sheet .rdg-cell:has(.sheet-merge-covered-cell) {
    border-top: none !important;
    border-left: none !important;
    outline: none !important;
    background: transparent !important;
    box-shadow: none !important;
    overflow: visible !important;
    contain: none !important;
  }
  .rdg-sheet .rdg-cell:has(.sheet-merge-covered-cell)[aria-selected="true"],
  .rdg-sheet .rdg-cell:has(.sheet-merge-covered-cell):hover,
  .rdg-sheet .rdg-row:hover .rdg-cell:has(.sheet-merge-covered-cell) {
    outline: none !important;
    background: transparent !important;
    box-shadow: none !important;
  }
  .sheet-merge-covered-cell {
    background: transparent !important;
    pointer-events: auto;
    cursor: cell;
  }
  
  .rdg-sheet .rdg-cell:has(.sheet-merge-covered-cell) input,
  .rdg-sheet .rdg-cell:has(.sheet-merge-covered-cell) textarea {
    display: none !important;
  }

  /* ── Selection outline ────────────────────────────────────── */
  .rdg-sheet .rdg-cell[aria-selected="true"] {
    outline: 2px solid var(--primary, #0d7c5f) !important;
    outline-offset: -2px !important;
    z-index: 9 !important;
  }
  .rdg-sheet .rdg-header-row .rdg-cell {
    outline: 1px solid var(--rdg-border-color, #e2e8f0) !important;
    outline-offset: -1px !important;
    border: none !important;
  }
  .sheet-dark .rdg-sheet .rdg-cell {
    outline-color: #2a3045 !important;
  }

  @media (max-width: 640px) {
    .rdg-sheet { font-size: 11px !important; }
    .sheet-column-type-submenu {
      transform: translate3d(0, 6px, 0) !important;
      max-width: calc(100vw - 24px);
    }
  }

  .sheet-cell-merge-master {
    border: 1px solid var(--sh-border, #e8eaed) !important;
    overflow: visible !important;
  }

  .sheet-cell-merge-master.sheet-cell-active-selected {
    outline: 2px solid var(--primary, #0d7c5f) !important;
    outline-offset: -2px !important;
  }

  .rdg-cell:has(.sheet-merge-covered-cell) input,
  .rdg-cell:has(.sheet-merge-covered-cell) textarea {
    display: none !important;
  }

  /* ── Borderless Mode Conditional Injections ── */
  
  /* Strip gridlines ONLY if cell DOES NOT contain a custom explicit border node */
  .rdg-sheet.sheet-borderless .rdg-cell:not(:has([data-explicit-border="true"])),
  .rdg-sheet.sheet-borderless .rdg-row .rdg-cell:not(:has([data-explicit-border="true"])),
  .rdg-sheet.sheet-borderless .rdg-row:hover .rdg-cell:not(:has([data-explicit-border="true"])),
  .rdg-sheet.sheet-borderless .rdg-cell:hover:not(:has([data-explicit-border="true"])),
  .rdg-sheet.sheet-borderless .rdg-cell:first-child:not(:has([data-explicit-border="true"])) {
    border: none !important;
    outline: none !important;
    box-shadow: none !important;
  }

  /* Condition: If cell contains a custom explicit border, force cell view wrapper to show it */
  .rdg-sheet.sheet-borderless .rdg-cell:has([data-explicit-border="true"]) {
    border: none !important;
    overflow: visible !important;
    contain: none !important;
  }

  /* Header row retains borders in borderless mode */

  .rdg-sheet.sheet-borderless .sheet-cell-merge-master:not([data-explicit-border="true"]) {
    border: none !important;
  }

  .rdg-sheet.sheet-borderless .rdg-cell[aria-selected="true"] {
    outline: 2px solid var(--primary, #0d7c5f) !important;
    box-shadow: none !important;
  }
`}</style>
      </div>
    </TooltipProvider>
  );
}
