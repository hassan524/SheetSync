"use client";

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
import { Check, Loader2, GripVertical, WrapText, Lock } from "lucide-react";
import { toast } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

// ── Toolbar components ─────────────────────────────────────────────────────
import { TitleBar } from "./toolbars/TitleBar";
import { FormattingBar } from "./toolbars/FormattingBar";
import { FormulaBar } from "./toolbars/FormulaBar";
import { ActionBar } from "./toolbars/ActionBar";
import { FilterBar } from "./toolbars/FilterBar"
import { StatusBar } from "./toolbars/StatusBar";

// ── Cell / grid ────────────────────────────────────────────────────────────
import { CellRenderer } from "./CellRenderer";

// ── Hooks ──────────────────────────────────────────────────────────────────
import { useSheetStateVars } from "@/hooks/sheets/use-sheet-state-vars"; // sheet state values and setters
import { useSheetPersistence } from "@/hooks/sheets/use-sheet-persistence"; // save sheet changes and exports
import { useSheetRowOps } from "@/hooks/sheets/use-sheet-row-ops"; // add/delete rows and row actions
import { useSheetColOps } from "@/hooks/sheets/use-sheet-col-ops"; // add/delete columns and column actions
import { useHistory } from "@/hooks/use-history"; // undo / redo history stack
import { useSheetFormatting } from "@/hooks/sheets/use-sheet-formatting"; // cell format and style handling
import { useTextWrap } from "@/hooks/sheets/use-text-wrap"; // cell text wrap state
import { useClipboard } from "@/hooks/sheets/use-clipboard"; // copy / paste / cut operations
import { useProtectedCells } from "@/hooks/sheets/use-protected-cells"; // cell protection helper
import { useRowOperations } from "@/hooks/sheets/use-row-operations"; // row-specific operations
import { useColumnOperations } from "@/hooks/sheets/use-column-operations"; // column-specific operations
import { useCellTypes } from "@/hooks/sheets/use-cell-types"; // cell type detection and overrides
import { useFormulas } from "@/hooks/sheets/use-formulas"; // formula storage and evaluation
import { useKeyboardShortcuts } from "@/hooks/sheets/use-keyboard-shortcuts"; // keyboard commands
import { useCharts } from "@/hooks/sheets/use-charts"; // chart widgets and picker state
import { useTimeTravel } from "@/hooks/use-time-travel"; // sheet versions and history travel

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
import SelectOptionsDialog from "./dialogs/Select-options-dialog";
import { ddStyle, ddItemStyle, getMemberColor, CommentDot, CollabCursor, SheetAvatar } from "@/components/individual/sheet/sheet-ui-helpers";

// ── Lib ────────────────────────────────────────────────────────────────────
import { SheetRow, ColumnDef, CellFormat, SaveStatus, ConditionalFormatRule } from "@/types/index";
import { getTemplateData } from "@/lib/sheet-templates";
import { updateSheetTitle, updateSheetStarred, loadSheet, updateSheetCharts, updateSheetRowHeights } from "@/lib/querys/sheet/sheet";
import { saveRow, saveAllRows } from "@/lib/querys/sheet/rows";
import { saveAllColumns } from "@/lib/querys/sheet/columns";
import { saveAllCellFormats, saveCellFormat } from "@/lib/querys/sheet/format";
import { saveAllFormulas, saveFormula, deleteFormula, saveColumnFormula, deleteColumnFormula } from "@/lib/querys/sheet/formulas";
import { protectCell, unprotectCell } from "@/lib/querys/sheet/protection";
import { logActivity } from "@/lib/querys/activity/activity";
import { exportSheet } from "@/lib/querys/export";
import { buildImportedSheetData, getImportedSheetTitle, MAX_IMPORT_BYTES } from "@/lib/import-sheet";
import { getSheetOrgMembers } from "@/lib/querys/organization/get-sheet-members";
import { supabase } from "@/lib/supabase/client";
import { trackSheetOpen } from "@/lib/querys/sheet/track-open";
import { subscribeToHistory, subscribeToComments, addComment, resolveComment, logCellEdit, logRowAdd, logFormulaSet, logColumnRename } from "@/lib/querys/sheet/firebase-realtime";
import { maybeAutoSnapshot } from "@/lib/querys/sheet/snapshots";
import { ensureWorkingRowBuffer, normalizeGeneratedColumnNames, columnIndexToName, ROW_CELL_TYPES_KEY, ROW_CELL_SELECT_OPTIONS_KEY, getDefaultValueForType, getOptionBgStyle } from "@/utils/SheetUtils";
import { getStatusOptionStyle, isCellInConditionalRange, conditionalRuleMatches } from "@/lib/sheet-formatting-helpers";
// @ts-ignore
import "@/app/sheet.css";

// ── Types ──────────────────────────────────────────────────────────────────
import { SheetState, AdvancedFilterRule } from "@/types/index";

// ─────────────────────────────────────────────────────────────────────────────
// Main client-side sheet editor component
// - Loads and persists the sheet content.
// - Keeps all editor state in sync with hooks and helpers.
// - Delegates sheet actions to modular hooks for rows, columns, formulas,
//   formatting, clipboard, protection, charts, and time travel.

export default function SheetClient() {
  const params = useParams<{ id?: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const templateId = searchParams?.get("template") || "blank";
  const isOrganizationSheet = searchParams?.get("org") === "true";
  const importedFrom = searchParams?.get("imported");
  const sheetId = params?.id ?? "";

  // states 
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [activeCell, setActiveCell] = useState(null);

  // This hook gives us the main sheet editor state.
  // It stores the rows, columns, selected cell, panel state, and many UI flags.
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

  const [, setIsLoading] = useState(true);

  // Local undo/redo history stacks for rows and columns.
  const rowsHistory = useHistory<SheetRow[]>([]);
  const columnsHistory = useHistory<ColumnDef[]>([]);
  const titleSaveTimeout = useRef<NodeJS.Timeout | undefined>(undefined);
  const presenceChannelRef = useRef<any>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const chartBtnRef = useRef<HTMLButtonElement | null>(null);
  const chartsHydratedRef = useRef(false);
  const rowResizeRef = useRef<{ rowId: string; startY: number; startH: number; pointerId: number } | null>(null);

  // Sub-hooks
  // Formatting hook for bold / italic / colors and cell style logic.
  const formatting = useSheetFormatting(() => { });

  // Text wrap hook tracks which cells should wrap text.
  const textWrap = useTextWrap(rows, () => { });

  // Clipboard hook handles copy, cut, and paste actions.
  const clipboard = useClipboard(rows, rowsHistory, () => { });

  // Protection hook keeps track of locked cells.
  const protection = useProtectedCells(() => { });

  // Row operations hook handles row insert/delete and row actions.
  const rowOps = useRowOperations(rows, columns, rowsHistory, () => { });

  // Column operations hook handles column insert/delete and edits.
  const colOps = useColumnOperations(rows, columns, columnsHistory, rowsHistory, () => { });

  // Cell type hook tracks types like date, checkbox, select.
  const cellTypes = useCellTypes(rows, rowsHistory, () => { });

  // Formula hook stores formulas and calculates values.
  const formulas = useFormulas(rows, columns);

  // Chart hook manages charts shown on the sheet.
  const charts = useCharts({ storageKey: sheetId ? `sheetsync:${sheetId}:charts` : null });

  // These helpers mark the sheet as saving or saved.
  const markSaving = useCallback(() => setSaveStatus("saving"), [setSaveStatus]);
  const markSaved = useCallback(() => setSaveStatus("saved"), [setSaveStatus]);

  // Time travel hook tracks sheet snapshots and preview rows for older versions.
  const [timeTravelState, timeTravelActions] = useTimeTravel({
    sheetId, currentRows: rows, currentColumns: columns, historyEntries: history,
    currentUserId: currentUser?.id, organizationId: isOrgSheet ? organizationId : null,
    onBranch: (newSheetId: string, label: string) => { toast.success(`Branched! Opening "${label}"…`, { duration: 3000 }); router.push(`/sheet/${newSheetId}`); },
  });

  // Sync history states
  // Keep the central sheet state in sync with undo/redo history.
  // The history hooks may update outside the normal sheet state object,
  // so we mirror the current history snapshot back to the sheet state here.
  useEffect(() => { startTransition(() => setSheetState((p) => ({ ...p, rows: rowsHistory.currentState }))); }, [rowsHistory.currentState]);
  useEffect(() => { startTransition(() => setSheetState((p) => ({ ...p, columns: columnsHistory.currentState }))); }, [columnsHistory.currentState]);

  // Dark mode body attribute
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.dataset.sheetDark = isDark ? "true" : "false";
  }, [isDark]);

  // ── Persistence hook ───────────────────────────────────────────────────
  // This hook saves sheet changes and keeps the backend in sync.
  const persistence = useSheetPersistence({
    sheetId, organizationId, isOrgSheet, title, rows, columns,
    currentUserId: currentUser?.id, setSaveStatus, rowsHistoryCurrentState: rowsHistory.currentState,
  });

  // ── Row ops hook ───────────────────────────────────────────────────────
  // Row-specific operations: insert, delete, and update row state.
  const sheetRowOps = useSheetRowOps({
    sheetId, organizationId, isOrgSheet, title, rows, columns,
    selectedRows, setSelectedRows, setSaveStatus,
    rowOps, rowsHistory, markSaving, markSaved,
  });

  // ── Col ops hook ───────────────────────────────────────────────────────
  // Column-specific operations: update columns and column metadata.
  const sheetColOps = useSheetColOps({
    sheetId, organizationId, isOrgSheet, title, rows, columns,
    setSheetState, setSelectSetupDialog, setSaveStatus,
    colOps, columnsHistory, rowsHistory, markSaving, markSaved,
    currentUser, selectedCell,
  });

  // ── Load sheet ─────────────────────────────────────────────────────────
  // Load the sheet from the backend and initialize state, formats, formulas, and charts.
  useEffect(() => {
    if (!sheetId) return;
    chartsHydratedRef.current = false;
    queueMicrotask(() => setIsLoading(true));
    loadSheet(sheetId).then(async (data) => {
      if (data.rows.length > 0 || data.columns.length > 0) {
        const sheetIsOrg = data.isPersonal === false || isOrganizationSheet;
        let wrapSet = new Set<string>();
        if (data.cellFormats) {
          wrapSet = new Set<string>(
            Object.entries(data.cellFormats).filter(([, fmt]) => (fmt as any).textWrap === true).map(([k]) => k),
          );
          if (Object.keys(data.cellFormats).length > 0) formatting.setCellFormats(data.cellFormats);
          const selectByCell: Record<string, string[]> = {};
          Object.entries(data.cellFormats).forEach(([key, fmt]) => {
            const opts = (fmt as any)?.selectOptions;
            if (Array.isArray(opts) && opts.length > 0) selectByCell[key] = opts;
          });
          if (Object.keys(selectByCell).length > 0) setCellSelectOptions(selectByCell);
        }
        if (data.formulas && Object.keys(data.formulas).length > 0) formulas.setFormulas(data.formulas);
        if (data.columnFormulas && Object.keys(data.columnFormulas).length > 0) formulas.setColumnFormulas(data.columnFormulas);
        if (data.protectedCells && data.protectedCells.size > 0) protection.setProtectedCells(data.protectedCells);
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
              if (Array.isArray(options) && options.length > 0) rowSelectOptions[`${rowIdx}-${colKey}`] = options.map(String);
            });
          }
        });
        if (Object.keys(typeOverrides).length > 0) cellTypes.setCellTypeOverrides(typeOverrides);
        if (Object.keys(rowSelectOptions).length > 0) setCellSelectOptions((prev) => ({ ...prev, ...rowSelectOptions }));

        rowsHistory.pushState(bufferedRows);
        columnsHistory.pushState(data.columns);
        setSheetState({
          title: data.title, isOrgSheet: sheetIsOrg, liveTracking: sheetIsOrg,
          createdAt: data.created_at, updatedAt: data.updated_at, ownerId: data.ownerId,
          organizationId: data.organizationId ?? null, starred: data.isStarred,
          rows: bufferedRows, columns: data.columns,
          forkedFromSheetId: data.forked_from_sheet_id, forkedFromSnapshotLabel: data.forked_from_snapshot_label,
          forkedAt: data.forked_at, forkedByUserId: data.forked_by_user_id,
          userRole: "owner",
        });
        if (Array.isArray((data as any).charts)) { charts.replaceAll((data as any).charts); }
        chartsHydratedRef.current = true;
        if (Array.isArray((data as any).forks)) setForks((data as any).forks);
        if ((data as any).rowHeights) setRowHeights((data as any).rowHeights);
      } else {
        const td = getTemplateData(templateId);
        const bufferedRows = ensureWorkingRowBuffer(td.rows, td.columns);
        rowsHistory.pushState(bufferedRows);
        columnsHistory.pushState(td.columns);
        setSheetState((p) => ({ ...p, title: data.title || td.title, starred: false, rows: bufferedRows, columns: td.columns }));
        await Promise.all([saveAllRows(sheetId, bufferedRows), saveAllColumns(sheetId, td.columns)]);
        chartsHydratedRef.current = true;
      }
      await trackSheetOpen(sheetId);
    }).catch((err) => { console.error(err); toast.error("Failed to load sheet. Please refresh."); })
      .finally(() => { setIsLoading(false); window.dispatchEvent(new Event("__sheet-ready")); });
  }, [sheetId, charts.replaceAll]);

  // Persist charts / row heights
  // Save chart settings and row heights after changes settle.
  useEffect(() => {
    if (!sheetId || !chartsHydratedRef.current) return;
    const t = setTimeout(() => { updateSheetCharts(sheetId, charts.charts).catch(console.error); }, 600);
    return () => clearTimeout(t);
  }, [charts.charts, sheetId]);
  useEffect(() => {
    if (!sheetId) return;
    const t = setTimeout(() => { updateSheetRowHeights(sheetId, rowHeights).catch(console.error); }, 600);
    return () => clearTimeout(t);
  }, [rowHeights, sheetId]);

  // Auth + realtime
  // Load the current signed-in user once when the page opens.
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) setCurrentUser({
        id: data.user.id,
        name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || data.user.email?.split("@")[0] || "You",
        email: data.user.email || "", avatar_url: data.user.user_metadata?.avatar_url || null,
      });
    });
  }, []);

  // If this is an organization sheet, load the member list.
  useEffect(() => {
    if (!sheetId || !isOrgSheet) { setOrgMembers([]); return; }
    getSheetOrgMembers(sheetId).then((data) => { if (data) setOrgMembers(data.members); }).catch(console.error);
  }, [sheetId, isOrgSheet]);
  // Subscribe to shared sheet history updates.
  useEffect(() => {
    if (!sheetId) return;
    return subscribeToHistory(sheetId, setHistory);
  }, [sheetId]);

  // Subscribe to realtime comments for this sheet.
  useEffect(() => {
    if (!sheetId) return;
    return subscribeToComments(sheetId, (grouped) => setComments(grouped));
  }, [sheetId]);
  // Subscribe to collaborator cursor presence for organization sheets.
  useEffect(() => {
    if (!sheetId || !isOrgSheet || !currentUser) return;
    const ch = supabase.channel(`sheet-cursors:${sheetId}`, { config: { presence: { key: currentUser.id } } });
    ch.on("presence", { event: "sync" }, () => {
      const state = ch.presenceState<{ name: string; color: string; row: number; col: string }>();
      const cursors: typeof activeCursors = {};
      Object.entries(state).forEach(([uid, ps]) => { if (uid !== currentUser.id && ps[0]) cursors[uid] = ps[0]; });
      setActiveCursors(cursors);
    }).subscribe((status) => { if (status === "SUBSCRIBED") presenceChannelRef.current = ch; });
    return () => { supabase.removeChannel(ch); presenceChannelRef.current = null; };
  }, [sheetId, isOrgSheet, currentUser]);

  // Track my current selected cell in the live cursor presence channel.
  useEffect(() => {
    if (!presenceChannelRef.current || !currentUser || !selectedCell) return;
    presenceChannelRef.current.track({ name: currentUser.name, color: getMemberColor(currentUser.id), row: selectedCell.row, col: selectedCell.col });
  }, [selectedCell, currentUser]);

  // ── Derived / computed ─────────────────────────────────────────────────
  const effectiveRightPanel = useMemo((): RightPanelType => {
    if (!isOrgSheet && (rightPanel === "comments" || rightPanel === "collaborators")) return null;
    return rightPanel;
  }, [isOrgSheet, rightPanel]);

  const conditionalRules = useMemo<ConditionalFormatRule[]>(() => {
    const rules = columns.flatMap((col) => {
      const stored = col.conditional_formatting?.rules;
      return Array.isArray(stored) ? stored : [];
    });
    return Array.from(new Map(rules.map((rule) => [rule.id, rule])).values());
  }, [columns]);

  const getEffectiveCellStyle = useCallback(
    (rowIdx: number, colKey: string, row: SheetRow): React.CSSProperties => {
      const base = formatting.getCellStyle(rowIdx, colKey, textWrap.textWrapColumns);
      const colIdx = columns.findIndex((col) => col.key === colKey);
      const columnFormat = columns[colIdx]?.conditional_formatting?.columnFormat ?? {};
      const conditionalFormat = conditionalRules
        .filter((rule) => isCellInConditionalRange(rule, rowIdx, colIdx))
        .filter((rule) => conditionalRuleMatches(rule, row[colKey]))
        .reduce<React.CSSProperties>((style, rule) => ({
          ...style,
          backgroundColor: rule.format.bgColor ?? style.backgroundColor,
          color: rule.format.textColor ?? style.color,
          fontWeight: rule.format.bold ? 700 : style.fontWeight,
          fontStyle: rule.format.italic ? "italic" : style.fontStyle,
        }), {});
      return {
        ...base,
        fontWeight: columnFormat.bold ? 700 : base.fontWeight,
        fontStyle: columnFormat.italic ? "italic" : base.fontStyle,
        fontSize: columnFormat.fontSize ? `${columnFormat.fontSize}px` : base.fontSize,
        color: columnFormat.textColor ?? base.color,
        backgroundColor: columnFormat.bgColor ?? base.backgroundColor,
        ...conditionalFormat,
      };
    },
    [columns, conditionalRules, formatting.getCellStyle, textWrap.textWrapColumns],
  );

  const filteredRows = useMemo<SheetRow[]>(() => {
    const activeRows = timeTravelState.previewRows || rows;
    const activeCols = timeTravelState.previewColumns || columns;
    const q = (searchQuery || filterValue).trim().toLowerCase();
    const activeRules = advancedFilters.filter((rule) => rule.columnKey);
    if (!q && activeRules.length === 0) return activeRows;
    return activeRows.filter((row) => {
      const matchesSearch = !q || activeCols.some((col) => {
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
        if (rule.operator === "contains") return text.toLowerCase().includes(target.toLowerCase());
        if (rule.operator === "equals") return text.toLowerCase() === target.toLowerCase();
        if (rule.operator === "not_equals") return text.toLowerCase() !== target.toLowerCase();
        const left = col?.type === "date" ? Date.parse(text) : Number(String(raw ?? ""));
        const right = col?.type === "date" ? Date.parse(target) : Number(target);
        if (Number.isNaN(left) || Number.isNaN(right)) return false;
        if (rule.operator === "gt") return left > right;
        if (rule.operator === "gte") return left >= right;
        if (rule.operator === "lt") return left < right;
        if (rule.operator === "lte") return left <= right;
        return true;
      });
    });
  }, [rows, columns, timeTravelState.previewRows, timeTravelState.previewColumns, searchQuery, filterValue, advancedFilters]);

  const filterColumns = useMemo(() => columns.filter((col) => !col.hidden), [columns]);

  const filterSuggestions = useMemo(() => {
    const map: Record<string, string[]> = {};
    const dataRows = timeTravelState.previewRows || rows;
    filterColumns.forEach((col) => {
      map[col.key] = Array.from(new Set(dataRows.map((row) => row[col.key]).filter((v) => v !== null && v !== undefined && v !== "").map(String))).slice(0, 24);
    });
    return map;
  }, [filterColumns, rows, timeTravelState.previewRows]);

  const totalComments = useMemo(() => {
    if (!isOrgSheet) return 0;
    return Object.values(comments).reduce((a, b) => a + b.filter((c) => !c.resolved).length, 0);
  }, [comments, isOrgSheet]);

  // Derived values used by the sheet UI.
  // These values are memoized to keep grid and toolbar performance fast.
  const selectedCellType = useMemo(() => {
    if (!selectedCell) return null;
    const col = columns.find((c) => c.key === selectedCell.col);
    return col ? cellTypes.getCellType(selectedCell.row, selectedCell.col, col.type || "text") : null;
  }, [selectedCell, columns, cellTypes.getCellType]);

  const isSelectedColumnWrapped = useMemo(
    () => selectedCell ? textWrap.textWrapColumns.has(`${selectedCell.row}-${selectedCell.col}`) : false,
    [selectedCell, textWrap.textWrapColumns],
  );

  const getSuggestedChartPreset = useCallback((kind: any) => {
    const usableCols = columns.filter((c) => !c.hidden);
    const labelCol = usableCols.find((c) => ["text", "status", "priority", "select", "date"].includes(c.type ?? ""));
    const numericCols = usableCols.filter((c) => ["number", "currency", "progress", "percent"].includes(c.type ?? ""));
    const preset: any = {};
    if (labelCol) preset.labelColumnKey = labelCol.key;
    if (kind === "pie" || kind === "donut" || kind === "radar") { preset.aggregateMode = "count"; preset.seriesKeys = []; }
    else if (numericCols.length > 0) { preset.seriesKeys = [numericCols[0].key]; preset.aggregateMode = "none"; }
    return preset;
  }, [columns]);

  // ── Handlers ───────────────────────────────────────────────────────────
  // These functions are called by UI controls when the user edits the sheet.
  // Each handler updates local state, then triggers save behavior if needed.
  // Update the sheet title and save after the user stops typing.
  const handleTitleChange = useCallback((t: string) => {
    setSheetState((p) => ({ ...p, title: t }));
    markSaving();
    clearTimeout(titleSaveTimeout.current);
    titleSaveTimeout.current = setTimeout(async () => { await updateSheetTitle(sheetId, t); markSaved(); }, 1000);
  }, [sheetId, markSaving, markSaved]);

  // Toggle starred/unstarred state for this sheet.
  const handleStarredToggle = useCallback(async () => {
    setSheetState((p) => { const n = !p.starred; updateSheetStarred(sheetId, n); return { ...p, starred: n }; });
  }, [sheetId]);

  // Apply a formatting change to the selected cell and persist it.
  const handleFormatChange = useCallback(async (format: any) => {
    if (!selectedCell) return;
    formatting.applyFormat(selectedCell, format);
    const merged = { ...formatting.getCurrentCellFormat(selectedCell), ...format };
    const cellKey = `${selectedCell.row}-${selectedCell.col}`;
    markSaving();
    await saveCellFormat(sheetId, cellKey, merged);
    markSaved();
  }, [selectedCell, sheetId, markSaving, markSaved, formatting.applyFormat, formatting.getCurrentCellFormat]);

  // Paste the copied or cut cell range, then save the new row state.
  const handlePaste = useCallback(async () => {
    clipboard.pasteCellOrRange(selectedCell);
    setTimeout(async () => {
      try { markSaving(); await saveAllRows(sheetId, rowsHistory.currentState); markSaved(); }
      catch { toast.error("Paste saved locally but failed to persist."); setSaveStatus("saved"); }
    }, 50);
  }, [clipboard.pasteCellOrRange, selectedCell, sheetId, rowsHistory.currentState, markSaving, markSaved]);

  // Toggle whether the selected cell wraps text or stays single-line.
  const handleProtectionToggle = useCallback(async () => {
    if (!selectedCell) return;
    const k = protection.getCellKey(selectedCell.row, selectedCell.col);
    const isProt = protection.isCellProtected(selectedCell.row, selectedCell.col);
    protection.toggleProtectCell(selectedCell);
    markSaving();
    if (isProt) await unprotectCell(sheetId, k); else await protectCell(sheetId, k);
    markSaved();
  }, [selectedCell, protection, sheetId, markSaving, markSaved]);

  // Toggle text wrap for the selected cell and save the format.
  const handleTextWrapToggle = useCallback(async () => {
    if (!selectedCell) return;
    const cellKey = `${selectedCell.row}-${selectedCell.col}`;
    const newWrapSet = new Set(textWrap.textWrapColumns);
    if (newWrapSet.has(cellKey)) newWrapSet.delete(cellKey); else newWrapSet.add(cellKey);
    textWrap.toggleTextWrap(cellKey);
    setTimeout(async () => {
      try { markSaving(); await saveCellFormat(sheetId, cellKey, { ...formatting.getCurrentCellFormat(selectedCell), textWrap: newWrapSet.has(cellKey) }); markSaved(); }
      catch { toast.error("Text wrap failed to save."); setSaveStatus("saved"); }
    }, 50);
  }, [selectedCell, textWrap, sheetId, formatting.getCurrentCellFormat, markSaving, markSaved]);

  // Insert a formula into the selected cell, save it, and close the dialog.
  const handleFormulaInsert = useCallback(async (example: string) => {
    if (!selectedCell) { toast.info("Select a cell first, then insert formula"); return; }
    const cellKey = `${selectedCell.row}-${selectedCell.col}`;
    formulas.setFormulas((p: any) => ({ ...p, [cellKey]: example }));
    markSaving();
    await saveFormula(sheetId, cellKey, example);
    if (isOrgSheet) {
      const cl = String.fromCharCode(65 + columns.findIndex((c) => c.key === selectedCell.col));
      logFormulaSet(sheetId, `${cl}${selectedCell.row + 1}`, example);
    }
    markSaved();
    setShowFormulaDialog(false);
    toast.success("Formula inserted — edit as needed");
  }, [selectedCell, formulas.setFormulas, sheetId, markSaving, markSaved, isOrgSheet, columns]);

  // Apply a formula to every row in a column and persist it.
  const handleApplyFormulaToColumn = useCallback(async (columnKey: string, formula: string) => {
    if (!formula.startsWith("=")) { toast.error("Formula must start with ="); return; }
    formulas.setColumnFormulas((p: any) => ({ ...p, [columnKey]: formula }));
    markSaving(); await saveColumnFormula(sheetId, columnKey, formula); markSaved();
    toast.success(`Formula applied to entire "${columnKey}" column`);
  }, [formulas.setColumnFormulas, sheetId, markSaving, markSaved]);

  // Remove a column formula and persist the change.
  const handleRemoveColumnFormula = useCallback(async (columnKey: string) => {
    formulas.setColumnFormulas((p: any) => { const n = { ...p }; delete n[columnKey]; return n; });
    markSaving(); await deleteColumnFormula(sheetId, columnKey); markSaved();
    toast.success("Column formula removed");
  }, [formulas.setColumnFormulas, sheetId, markSaving, markSaved]);

  const handleSaveConditionalRule = useCallback(async (rule: ConditionalFormatRule) => {
    const nextColumns = columns.map((col, colIdx) => {
      if (colIdx < rule.startCol || colIdx > rule.endCol) return col;
      const existing = Array.isArray(col.conditional_formatting?.rules) ? col.conditional_formatting.rules : [];
      return { ...col, conditional_formatting: { ...(col.conditional_formatting ?? {}), rules: [...existing.filter((item: any) => item.id !== rule.id), rule] } };
    });
    await sheetColOps.persistColumns(nextColumns);
    toast.success("Conditional formatting rule added.");
  }, [columns, sheetColOps.persistColumns]);

  const handleDeleteConditionalRule = useCallback(async (ruleId: string) => {
    const nextColumns = columns.map((col) => {
      const existing = Array.isArray(col.conditional_formatting?.rules) ? col.conditional_formatting.rules : [];
      return { ...col, conditional_formatting: { ...(col.conditional_formatting ?? {}), rules: existing.filter((rule: ConditionalFormatRule) => rule.id !== ruleId) } };
    });
    await sheetColOps.persistColumns(nextColumns);
  }, [columns, sheetColOps.persistColumns]);

  const handleApplyColumnFormat = useCallback(async (columnKey: string, formatUpdate: Partial<CellFormat>) => {
    const nextColumns = columns.map((col) => {
      if (col.key !== columnKey) return col;
      return { ...col, conditional_formatting: { ...(col.conditional_formatting ?? {}), columnFormat: { ...(col.conditional_formatting?.columnFormat ?? {}), ...formatUpdate } } };
    });
    await sheetColOps.persistColumns(nextColumns);
  }, [columns, sheetColOps.persistColumns]);

  const handleApplyColumns = useCallback(async (nextColumns: ColumnDef[]) => {
    if (nextColumns.length === 0) { toast.error("Keep at least one column."); return; }
    const normalizedColumns = nextColumns.map((column, index) => ({
      ...column, key: column.key || `col_custom_${Date.now()}_${index}`,
      name: column.name.trim() || columnIndexToName(index), type: column.type ?? "text", width: column.width ?? 160, editable: true, position: index,
    }));
    const nextRows = rows.map((row) => {
      const mapped: SheetRow = { id: row.id };
      normalizedColumns.forEach((column) => { mapped[column.key] = row[column.key] ?? ""; });
      return mapped;
    });
    try {
      markSaving();
      await Promise.all([saveAllColumns(sheetId, normalizedColumns), saveAllRows(sheetId, nextRows)]);
      columnsHistory.pushState(normalizedColumns); rowsHistory.pushState(nextRows);
      setSheetState((prev) => ({ ...prev, columns: normalizedColumns, rows: nextRows }));
      markSaved(); toast.success("Columns updated");
    } catch (error: any) { setSaveStatus("saved"); toast.error(error?.message ?? "Failed to update columns."); }
  }, [columnsHistory, markSaved, markSaving, rows, rowsHistory, sheetId, setSaveStatus]);

  const handleRowsChange = useCallback((updatedRows: SheetRow[]) => {
    persistence.handleRowsChange(updatedRows, rows, rowsHistory.pushState);
  }, [persistence.handleRowsChange, rows, rowsHistory.pushState]);

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
            : { ...row, [activeCell.colKey]: dataUrl }
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

  const handleSheetImport = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      if (file.size > MAX_IMPORT_BYTES) throw new Error("File is larger than the 50 MB import limit.");
      if (!/\.(csv|xlsx|xls)$/i.test(file.name)) throw new Error("Unsupported file type. Upload a CSV, XLSX, or XLS file.");
      setIsImportingSheet(true); markSaving();
      const buffer = await file.arrayBuffer();
      const parsed = buildImportedSheetData(file, buffer);
      const importedRows = ensureWorkingRowBuffer(parsed.rows, parsed.columns);
      const nextTitle = getImportedSheetTitle(file.name);
      const [formulasDelete, formatsDelete] = await Promise.all([
        supabase.from("formulas").delete().eq("sheet_id", sheetId),
        supabase.from("cell_formats").delete().eq("sheet_id", sheetId),
      ]);
      if (formulasDelete.error || formatsDelete.error) throw new Error(formulasDelete.error?.message ?? formatsDelete.error?.message ?? "Failed to clear existing imported data.");
      await Promise.all([updateSheetTitle(sheetId, nextTitle), saveAllColumns(sheetId, parsed.columns), saveAllRows(sheetId, importedRows), saveAllFormulas(sheetId, parsed.formulas), saveAllCellFormats(sheetId, parsed.cellFormats)]);
      columnsHistory.pushState(parsed.columns); rowsHistory.pushState(importedRows);
      setSheetState((prev) => ({ ...prev, title: nextTitle, columns: parsed.columns, rows: importedRows }));
      setSelectedRows(new Set()); setSelectedCell(null); setImportSource(parsed.source);
      markSaved(); toast.success(`Imported ${parsed.source === "excel" ? "Excel" : "CSV"} file successfully.`);
    } catch (error: any) { setSaveStatus("saved"); toast.error(error?.message ?? "Import failed. Please try again."); }
    finally { setIsImportingSheet(false); }
  }, [columnsHistory, markSaved, markSaving, rowsHistory, sheetId]);

  const handleSelectedCellTypeChange = useCallback((type: ColumnDef["type"]) => {
    if (!selectedCell) return;
    if (type === "select") { setSelectSetupDialog({ open: true, colKey: selectedCell.col, row: selectedCell.row, mode: "cell" }); return; }
    const cellKey = `${selectedCell.row}-${selectedCell.col}`;
    cellTypes.setCellTypeOverrides((prev: any) => ({ ...prev, [cellKey]: type }));
    const updatedRows = rows.map((row, idx) => {
      if (idx !== selectedCell.row) return row;
      return { ...row, [selectedCell.col]: getDefaultValueForType(type), [ROW_CELL_TYPES_KEY]: { ...(row[ROW_CELL_TYPES_KEY] ?? {}), [selectedCell.col]: type } };
    });
    rowsHistory.pushState(updatedRows);
    setSheetState((p) => ({ ...p, rows: updatedRows }));
    saveAllRows(sheetId, updatedRows).catch(() => { toast.error("Failed to save cell type"); });
    toast.success(`Cell changed to ${type}`);
  }, [selectedCell, cellTypes, rows, rowsHistory, sheetId, setSelectSetupDialog]);

  const handleSelectSetupConfirm = useCallback(async (options: string[]) => {
    const { colKey, mode, row } = selectSetupDialog;
    if (mode === "insert") {
      sheetColOps.handleInsertColumn("select");
      setTimeout(async () => {
        markSaving();
        const updatedCols = columnsHistory.currentState;
        const newCol = updatedCols[updatedCols.length - 1];
        if (newCol) {
          const withOptions = normalizeGeneratedColumnNames(updatedCols.map((c) => c.key === newCol.key ? { ...c, selectOptions: options } : c));
          columnsHistory.pushState(withOptions); setSheetState((p) => ({ ...p, columns: withOptions }));
          await Promise.all([saveAllColumns(sheetId, withOptions), saveAllRows(sheetId, rowsHistory.currentState)]);
        }
        markSaved();
      }, 50);
    } else if (mode === "change" && colKey) {
      colOps.changeColumnType(colKey, "select");
      setTimeout(async () => {
        markSaving();
        const updatedCols = columnsHistory.currentState.map((c) => c.key === colKey ? { ...c, type: "select" as ColumnDef["type"], selectOptions: options } : c);
        columnsHistory.pushState(updatedCols); setSheetState((p) => ({ ...p, columns: updatedCols }));
        await Promise.all([saveAllColumns(sheetId, updatedCols), saveAllRows(sheetId, rowsHistory.currentState)]);
        markSaved();
      }, 50);
    } else if (mode === "cell" && colKey && row !== null) {
      const cellKey = `${row}-${colKey}`;
      cellTypes.setCellTypeOverrides((prev: any) => ({ ...prev, [cellKey]: "select" }));
      setCellSelectOptions((prev) => ({ ...prev, [cellKey]: options }));
      const updatedRows = rows.map((r, idx) => {
        if (idx !== row) return r;
        return { ...r, [colKey]: "", [ROW_CELL_TYPES_KEY]: { ...(r[ROW_CELL_TYPES_KEY] ?? {}), [colKey]: "select" }, [ROW_CELL_SELECT_OPTIONS_KEY]: { ...(r[ROW_CELL_SELECT_OPTIONS_KEY] ?? {}), [colKey]: options } };
      });
      rowsHistory.pushState(updatedRows); setSheetState((p) => ({ ...p, rows: updatedRows }));
      markSaving(); await saveAllRows(sheetId, updatedRows); markSaved(); toast.success("Cell dropdown saved");
    }
  }, [selectSetupDialog, sheetColOps, colOps, sheetId, columnsHistory, rowsHistory, markSaving, markSaved, rows, cellTypes, setSheetState, setCellSelectOptions]);

  const handleAddComment = useCallback(async (cellKey: string) => {
    if (!newCommentText.trim()) return;
    await addComment({ sheetId, cellKey, userId: "local", author: "You", authorColor: "#0d7c5f", text: newCommentText.trim(), parentId: null });
    setNewCommentText(""); toast.success("Comment added");
  }, [newCommentText, sheetId]);

  const handleReply = useCallback(async (cellKey: string, commentId: string) => {
    const text = replyText[commentId];
    if (!text?.trim()) return;
    await addComment({ sheetId, cellKey, userId: "local", author: "You", authorColor: "#0d7c5f", text: text.trim(), parentId: commentId });
    setReplyText((p) => ({ ...p, [commentId]: "" }));
  }, [replyText, sheetId]);

  const handleResolveComment = useCallback(async (_cellKey: string, commentId: string) => {
    await resolveComment(commentId); toast.success("Comment resolved");
  }, []);

  const toggleRightPanel = useCallback((panel: RightPanelType) => {
    if (!isOrgSheet && (panel === "comments" || panel === "collaborators")) return;
    setRightPanel((p) => (p === panel ? null : panel));
  }, [isOrgSheet]);



  const groupedCommentsForPanel = useMemo(() => {
    const result: Record<string, any[]> = {};
    Object.entries(comments).forEach(([cellKey, cellComments]) => {
      const roots = cellComments.filter((c) => !c.parentId);
      const replies = cellComments.filter((c) => c.parentId);
      result[cellKey] = roots.map((root) => ({
        ...root, cellKey,
        thread: replies.filter((r) => r.parentId === root.id).map((r) => ({
          author: r.author, color: r.authorColor, text: r.text, createdAt: r.createdAt,
          timestamp: r.createdAt ? new Date(r.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "just now",
        })),
      }));
    });
    return result;
  }, [comments]);

  useKeyboardShortcuts({
    selectedCell, rowsHistory,
    getCurrentCellFormat: formatting.getCurrentCellFormat,
    applyFormat: formatting.applyFormat,
    copyCellOrRange: clipboard.copyCellOrRange,
    pasteCellOrRange: handlePaste,
    cutCellOrRange: clipboard.cutCellOrRange,
  });

  // Row resize
  const beginRowResize = useCallback((rowId: string, e: React.PointerEvent) => {
    e.preventDefault(); e.stopPropagation();
    const base = rowHeights[rowId] ?? 32;
    rowResizeRef.current = { rowId, startY: e.clientY, startH: base, pointerId: e.pointerId };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, [rowHeights]);
  const onRowResizeMove = useCallback((e: React.PointerEvent) => {
    const st = rowResizeRef.current;
    if (!st || st.pointerId !== e.pointerId) return;
    const next = Math.max(24, Math.min(260, st.startH + (e.clientY - st.startY)));
    setRowHeights((p) => ({ ...p, [st.rowId]: next }));
  }, []);
  const endRowResize = useCallback((e: React.PointerEvent) => {
    if (rowResizeRef.current?.pointerId === e.pointerId) rowResizeRef.current = null;
  }, []);

  // ── Grid columns ───────────────────────────────────────────────────────
  const selStyle = ddStyle(isDark);
  const gridColumns = useMemo<Column<SheetRow>[]>(() => {
    const activeRows = timeTravelState.previewRows || rows;

    const rowNumberCol: Column<SheetRow> = {
      key: "row-number", name: "", width: 46, frozen: true, resizable: false,
      renderHeaderCell: () => (
        <div className="h-full w-full flex items-center justify-center sheet-header-cell border-r">
          <input type="checkbox" className="h-3.5 w-3.5 rounded border-gray-300 cursor-pointer" style={{ accentColor: "var(--primary)" }}
            checked={selectedRows.size === activeRows.length && activeRows.length > 0}
            onChange={(e) => setSelectedRows(e.target.checked ? new Set(activeRows.map((r) => r.id)) : new Set())} />
        </div>
      ),
      renderCell(props: RenderCellProps<SheetRow>) {
        const rowIdx = activeRows.findIndex((r) => r.id === props.row.id);
        const isSel = selectedRows.has(props.row.id);
        return (
          <div className={`h-full w-full flex items-center justify-center sheet-row-num border-r group/rownum ${isSel ? "sheet-row-num--selected" : ""} relative`}>
            <span className={`${isSel ? "hidden" : "group-hover/rownum:hidden"} sheet-row-num-text`}>{rowIdx + 1}</span>
            <input type="checkbox" className={`h-3.5 w-3.5 rounded border-gray-300 cursor-pointer ${isSel ? "" : "hidden group-hover/rownum:block"}`}
              style={{ accentColor: "var(--primary)" }} checked={isSel}
              onChange={(e) => { const s = new Set(selectedRows); e.target.checked ? s.add(props.row.id) : s.delete(props.row.id); setSelectedRows(s); }} />
            <div className="absolute left-0 right-0 bottom-0 h-1.5 opacity-0 group-hover/rownum:opacity-100" style={{ cursor: "row-resize", touchAction: "none" }}
              onPointerDown={(e) => beginRowResize(props.row.id, e)} onPointerMove={onRowResizeMove} onPointerUp={endRowResize} onPointerCancel={endRowResize} />
          </div>
        );
      },
    };

    const dataCols = columns.filter((col) => !col.hidden).map((col): Column<SheetRow> => ({
      key: col.key, name: col.name, width: col.width || 160, resizable: true,
      renderHeaderCell: () => (
        <div className="h-full w-full flex items-center gap-1.5 px-2.5 group/header sheet-header-cell border-r cursor-pointer" draggable
          onDragStart={() => colOps.handleColumnDragStart(col.key)}
          onDragOver={(e) => colOps.handleColumnDragOver(e, col.key, (u: any) => setSheetState((p) => ({ ...p, columns: typeof u === "function" ? u(p.columns) : u })))}
          onDragEnd={sheetColOps.handleColumnDragEnd}>
          <GripVertical className="h-3 w-3 text-gray-300 shrink-0 cursor-move opacity-0 group-hover/header:opacity-100 transition-opacity" />
          <span className="flex-1 sheet-col-label truncate">{col.name}</span>
          {[...textWrap.textWrapColumns].some((k) => k.endsWith(`-${col.key}`)) && <WrapText className="h-3 w-3 text-primary shrink-0 opacity-60" />}
          <ColumnHeaderMenu column={col}
            onChangeType={(t) => sheetColOps.handleChangeColumnType(col.key, t)}
            onDelete={() => sheetColOps.handleDeleteColumn(col.key)}
            onRename={(newName) => sheetColOps.handleRenameColumn(col.key, newName)}
            onToggleTextWrap={handleTextWrapToggle}
            textWrapEnabled={textWrap.textWrapColumns.has(col.key)}
            columnFormula={formulas.columnFormulas[col.key]}
            onApplyColumnFormula={(f) => handleApplyFormulaToColumn(col.key, f)}
            onRemoveColumnFormula={() => handleRemoveColumnFormula(col.key)}
            selectOptions={col.selectOptions}
            onUpdateSelectOptions={(opts) => sheetColOps.handleUpdateSelectOptions(col.key, opts)}
            onSetWidth={(w) => {
              const updated = columns.map((c) => c.key === col.key ? { ...c, width: w } : c);
              setSheetState((p) => ({ ...p, columns: updated })); columnsHistory.pushState(updated);
              setTimeout(async () => { markSaving(); await saveAllColumns(sheetId, columnsHistory.currentState); markSaved(); }, 50);
            }}
            onInsertLeft={() => { const idx = columns.findIndex((c) => c.key === col.key); sheetColOps.insertColumnAt(idx, null, "blank"); setTimeout(async () => { markSaving(); await Promise.all([saveAllColumns(sheetId, columnsHistory.currentState), saveAllRows(sheetId, rowsHistory.currentState)]); markSaved(); }, 50); }}
            onInsertRight={() => { const idx = columns.findIndex((c) => c.key === col.key); sheetColOps.insertColumnAt(idx + 1, null, "blank"); setTimeout(async () => { markSaving(); await Promise.all([saveAllColumns(sheetId, columnsHistory.currentState), saveAllRows(sheetId, rowsHistory.currentState)]); markSaved(); }, 50); }}
            onDuplicate={() => { const idx = columns.findIndex((c) => c.key === col.key); sheetColOps.insertColumnAt(idx + 1, col, "duplicate"); setTimeout(async () => { markSaving(); await Promise.all([saveAllColumns(sheetId, columnsHistory.currentState), saveAllRows(sheetId, rowsHistory.currentState)]); markSaved(); }, 50); }}
            onClearColumn={() => sheetColOps.clearColumnValues(col)}
            onSortAsc={() => sheetColOps.clearColumnValues(col)}
            onSortDesc={() => sheetColOps.clearColumnValues(col)}
            onSetCurrency={(currencyCode) => {
              const updated = columns.map((c) => c.key === col.key ? { ...c, currencyCode } : c);
              setSheetState((p) => ({ ...p, columns: updated })); columnsHistory.pushState(updated);
              setTimeout(async () => { markSaving(); await saveAllColumns(sheetId, columnsHistory.currentState); markSaved(); }, 50);
            }}
            onApplyColumnFormat={(fmt) => handleApplyColumnFormat(col.key, fmt)}
          />
        </div>
      ),
      renderCell(props: RenderCellProps<SheetRow>) {
        const rowIdx = rows.findIndex((r) => r.id === props.row.id);
        const type = cellTypes.getCellType(rowIdx, col.key, col.type || "text");
        const cellKey = protection.getCellKey(rowIdx, col.key);
        const formula = formulas.getFormula(rowIdx, col.key);
        let displayValue = props.row[col.key];
        if (formula?.startsWith("=")) displayValue = formulas.evaluateFormula(formula, rowIdx);
        const activeCollabEntry = Object.values(activeCursors).find((c) => c.row === rowIdx && c.col === col.key);
        return (
          <CellRenderer
            type={type} props={props} colKey={col.key} rowIdx={rowIdx} row={props.row}
            displayValue={displayValue} colDef={col}
            isWrapped={textWrap.textWrapColumns.has(`${rowIdx}-${col.key}`)}
            isProtected={protection.isCellProtected(rowIdx, col.key)}
            isOrgSheet={isOrgSheet}
            cellStyle={getEffectiveCellStyle(rowIdx, col.key, props.row)}
            cellComments={comments[`${rowIdx}-${col.key}`] || []}
            activeCollab={activeCollabEntry ? { name: activeCollabEntry.name, color: activeCollabEntry.color } : null}
            horizontalAlign={(getEffectiveCellStyle(rowIdx, col.key, props.row).textAlign as any) ?? undefined}
            onCellClick={() => { setSelectedCell({ row: rowIdx, col: col.key }); setActiveCommentCell(`${rowIdx}-${col.key}`); }}
            onCommentClick={(e) => { e.stopPropagation(); setActiveCommentCell(`${rowIdx}-${col.key}`); setRightPanel("comments"); }}
          />
        );
      },
      renderEditCell(props: RenderEditCellProps<SheetRow>) {
        const { row, column, onRowChange } = props;

        const rowIdx = rows.findIndex((r) => r.id === row.id);
        const cellType = cellTypes.getCellType(rowIdx, col.key, col.type || "text");

        const cellStyle = getEffectiveCellStyle(rowIdx, column.key, row);
        const cellKey = protection.getCellKey(rowIdx, col.key);
        const isProtected = protection.isCellProtected(rowIdx, col.key);

        const editVal =
          formulas.formulas[cellKey] ??
          formulas.columnFormulas[col.key] ??
          String(row[column.key] ?? "");

        const inputStyle = {
          ...cellStyle,
          background: isDark ? "#131620" : "#ffffff",
          color: isDark ? "#e2e8f0" : "#1a1d23",
        };

        if (isProtected) {
          toast.error("This cell is protected");
          return (
            <div className="h-full w-full flex items-center px-2.5 text-xs bg-gray-50 text-gray-400 gap-1.5">
              <Lock className="h-3 w-3" /> Protected
            </div>
          );
        }

        const onTextChange = (v: string) => {
          if (v.startsWith("=")) {
            formulas.setFormulas((p: any) => ({ ...p, [cellKey]: v }));
          } else {
            formulas.setFormulas((p: any) => {
              const n = { ...p };
              delete n[cellKey];
              return n;
            });
            onRowChange({ ...row, [column.key]: v });
          }
        };

        const onNumChange = (v: string) => {
          if (v.startsWith("=")) {
            formulas.setFormulas((p: any) => ({ ...p, [cellKey]: v }));
          } else {
            formulas.setFormulas((p: any) => {
              const n = { ...p };
              delete n[cellKey];
              return n;
            });
            const num = v === "" ? 0 : Number(v);
            if (!isNaN(num)) {
              onRowChange({ ...row, [column.key]: num });
            }
          }
        };

        const onBlurSave = async () => {
          const f = formulas.formulas[cellKey];
          if (f) await saveFormula(sheetId, cellKey, f);
          else await deleteFormula(sheetId, cellKey).catch(() => { });
        };

        // ---------------- IMAGE TYPE ----------------
        if (cellType === "image") {
          const handleClick = () => {
            setActiveCell({
              rowId: row.id,
              colKey: column.key,
            });
            fileInputRef.current?.click();
          };

          return (
            <div
              className="w-full h-full flex items-center justify-center cursor-pointer"
              onClick={handleClick}
              style={inputStyle}
            >
              {row[column.key] ? (
                <img
                  src={row[column.key]}
                  alt="cell"
                  className="max-h-12 max-w-full object-cover rounded"
                />
              ) : (
                <span className="text-xs text-gray-400">
                  Upload Image
                </span>
              )}
            </div>
          );
        }

        // ---------------- CHECKBOX ----------------
        if (cellType === "checkbox")
          return (
            <div
              className="h-full flex items-center justify-center cursor-pointer"
              onClick={() =>
                onRowChange({
                  ...row,
                  [column.key]: !row[column.key],
                })
              }
            >
              {row[column.key] ? (
                <span className="h-6 w-6 rounded-md bg-emerald-500/15 border border-emerald-600/60 flex items-center justify-center">
                  <Check className="h-4 w-4 text-emerald-700" />
                </span>
              ) : (
                <span className="h-5 w-5 rounded border border-gray-400/80 bg-white" />
              )}
            </div>
          );

        // ---------------- PRIORITY / STATUS ----------------
        if (cellType === "priority" || cellType === "status") {
          const opts =
            cellType === "priority"
              ? ["Low", "Medium", "High", "Critical"]
              : ["Not Started", "In Progress", "In Review", "Done", "Blocked"];

          return (
            <Select
              value={String(row[column.key] ?? "")}
              onValueChange={(v) =>
                onRowChange({ ...row, [column.key]: v })
              }
            >
              <SelectTrigger className="h-full border-0 text-xs rounded-none focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent style={selStyle}>
                {opts.map((value) => {
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
          );
        }

        // ---------------- SELECT ----------------
        if (cellType === "select") {
          const selectOpts =
            cellSelectOptions[cellKey]?.length > 0
              ? cellSelectOptions[cellKey]
              : col.selectOptions ??
              (col.validation_rules?.type === "dropdown"
                ? ((col.validation_rules?.options as string[]) ?? [])
                : []);

          return (
            <Select
              value={String(row[column.key] ?? "")}
              onValueChange={(v) =>
                onRowChange({ ...row, [column.key]: v })
              }
            >
              <SelectTrigger className="h-full border-0 text-xs rounded-none focus:ring-0">
                <SelectValue placeholder="Select…" />
              </SelectTrigger>
              <SelectContent style={selStyle}>
                {selectOpts.map((opt) => (
                  <SelectItem
                    key={opt}
                    value={opt}
                    style={ddItemStyle(isDark)}
                  >
                    <span
                      className="sheet-badge-pill"
                      style={getOptionBgStyle(opt)}
                    >
                      {opt}
                    </span>
                  </SelectItem>
                ))}
                {selectOpts.length === 0 && (
                  <div className="px-2.5 py-2 text-[11px] text-gray-400 italic">
                    No options — edit column to add some.
                  </div>
                )}
              </SelectContent>
            </Select>
          );
        }

        // ---------------- NUMBER / CURRENCY / PROGRESS ----------------
        if (
          cellType === "number" ||
          cellType === "currency" ||
          cellType === "progress"
        )
          return (
            <input
              className="w-full h-full px-2.5 text-xs outline-none border-0 text-right tabular-nums font-mono"
              style={inputStyle}
              type="text"
              autoFocus
              value={editVal}
              onChange={(e) =>
                cellType === "progress"
                  ? (() => {
                    const v = e.target.value;
                    if (v.startsWith("=")) onNumChange(v);
                    else {
                      const n =
                        v === ""
                          ? 0
                          : Math.min(100, Math.max(0, Number(v)));
                      if (!isNaN(n))
                        onRowChange({
                          ...row,
                          [column.key]: n,
                        });
                    }
                  })()
                  : onNumChange(e.target.value)
              }
              onBlur={onBlurSave}
            />
          );

        // ---------------- DATE ----------------
        if (cellType === "date")
          return (
            <input
              className="w-full h-full px-2.5 text-xs outline-none border-0"
              style={inputStyle}
              type={formulas.formulas[cellKey] ? "text" : "date"}
              autoFocus
              value={editVal}
              onChange={(e) => onTextChange(e.target.value)}
              onBlur={onBlurSave}
            />
          );

        // ---------------- TEXT WRAP ----------------
        if (textWrap.textWrapColumns.has(col.key))
          return (
            <textarea
              className="w-full h-full px-2.5 py-2 text-xs outline-none border-0 resize-none"
              style={inputStyle}
              autoFocus
              value={editVal}
              onChange={(e) => onTextChange(e.target.value)}
              onBlur={onBlurSave}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) e.stopPropagation();
              }}
            />
          );

        // ---------------- DEFAULT ----------------
        return (
          <input
            className="w-full h-full px-2.5 text-xs outline-none border-0"
            style={inputStyle}
            autoFocus
            value={editVal}
            onChange={(e) => onTextChange(e.target.value)}
            onBlur={onBlurSave}
          />
        );
      }
    }));

    return [rowNumberCol, ...dataCols];
  }, [columns, rows, selectedRows, textWrap.textWrapColumns, cellTypes.getCellType, getEffectiveCellStyle, formulas.formulas, formulas.columnFormulas, formulas.setFormulas, formulas.getFormula, cellSelectOptions, protection.getCellKey, protection.isCellProtected, sheetColOps, handleTextWrapToggle, sheetId, columnsHistory, colOps, markSaving, markSaved, handleApplyFormulaToColumn, handleRemoveColumnFormula, handleApplyColumnFormat, isOrgSheet, comments, activeCursors, isDark, beginRowResize, onRowResizeMove, endRowResize]);

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <TooltipProvider delayDuration={250}>
      <div className={`sheet-root h-screen flex flex-col select-none overflow-hidden ${isDark ? "sheet-dark" : "sheet-light"}`}>

        <TitleBar
          title={title} starred={starred} saveStatus={saveStatus} isOrgSheet={isOrgSheet}
          isDark={isDark} importSource={importSource} forks={forks} orgMembers={orgMembers}
          currentUser={currentUser} isImportingSheet={isImportingSheet} totalComments={totalComments}
          onTitleChange={handleTitleChange} onStarredToggle={handleStarredToggle}
          onImportClick={() => importInputRef.current?.click()}
          onExport={persistence.handleExport} onShareClick={() => setShowShareDialog(true)}
          onNotificationsClick={() => toggleRightPanel("comments")}
        />
        <input ref={importInputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleSheetImport} disabled={isImportingSheet} />

        <FormattingBar
          isDark={isDark} selectedCell={selectedCell} selectedCellType={selectedCellType}
          isSelectedColumnWrapped={isSelectedColumnWrapped}
          isProtected={!!(selectedCell && protection.isCellProtected(selectedCell.row, selectedCell.col))}
          fontFamily={fontFamily} fontSize={fontSize} zoomLevel={zoomLevel}
          filteredRowsCount={filteredRows.length} searchQuery={searchQuery} showSearch={showSearch}
          canUndo={rowsHistory.canUndo} canRedo={rowsHistory.canRedo}
          currentFormat={formatting.getCurrentCellFormat(selectedCell)}
          onUndo={rowsHistory.undo} onRedo={rowsHistory.redo}
          onZoomChange={(z) => setZoomLevel(Math.max(50, Math.min(200, z)))}
          onCopy={() => clipboard.copyCellOrRange(selectedCell)}
          onCut={() => clipboard.cutCellOrRange(selectedCell)}
          onPaste={handlePaste}
          onFontFamilyChange={(f) => { setFontFamily(f); if (selectedCell) handleFormatChange({ fontFamily: f }); }}
          onFontSizeChange={(s) => { setFontSize(s); if (selectedCell) handleFormatChange({ fontSize: Number(s) }); }}
          onFormatChange={handleFormatChange} onCellTypeChange={handleSelectedCellTypeChange}
          onTextWrapToggle={handleTextWrapToggle} onProtectionToggle={handleProtectionToggle}
          onFormulaOpen={() => { if (!selectedCell) { toast.info("Select a cell first."); return; } setShowFormulaDialog(true); }}
          onSearchToggle={() => setShowSearch(true)} onSearchChange={setSearchQuery}
          onSearchClose={() => { setShowSearch(false); setSearchQuery(""); }}
          onSort={(dir) => {
            if (!selectedCell) { toast.info("Select a column first to sort"); return; }
            const sorted = [...rows].sort((a, b) => { const va = String(a[selectedCell.col] ?? ""); const vb = String(b[selectedCell.col] ?? ""); return dir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va); });
            rowsHistory.pushState(sorted); toast.success(`Sorted ${dir === "asc" ? "A → Z" : "Z → A"}`);
          }}
          onHideColumn={sheetColOps.handleHideColumn}
        />

        <FormulaBar
          selectedCell={selectedCell} columns={columns} rows={rows} formulas={formulas}
          protection={protection} sheetId={sheetId} isDark={isDark}
          onRowsChange={handleRowsChange} onSaveFormula={saveFormula} onDeleteFormula={deleteFormula}
        />

        <ActionBar
          isDark={isDark} isOrgSheet={isOrgSheet} userRole={sheetState.userRole}
          ownerId={sheetState.ownerId} currentUserId={currentUser?.id}
          selectedRows={selectedRows} selectedCell={selectedCell} columns={columns}
          showFilters={showFilters} filterValue={filterValue}
          advancedFiltersCount={advancedFilters.length} chartCount={charts.charts.length}
          showChartPicker={charts.showPicker} conditionalRulesCount={conditionalRules.length}
          effectiveRightPanel={effectiveRightPanel} totalComments={totalComments}
          historyLength={history.length}
          onInsertRow={sheetRowOps.handleInsertRow}
          onInsertColumn={sheetColOps.handleInsertColumn}
          onDeleteRow={sheetRowOps.handleDeleteRow}
          onSortAsc={() => { if (!selectedCell) { toast.info("Select a column first to sort"); return; } sheetRowOps.handleSortByColumn(selectedCell.col, "asc"); }}
          onSortDesc={() => { if (!selectedCell) { toast.info("Select a column first to sort"); return; } sheetRowOps.handleSortByColumn(selectedCell.col, "desc"); }}
          onToggleFilters={() => setShowFilters(!showFilters)}
          onHideColumn={sheetColOps.handleHideColumn}
          onToggleChartPicker={charts.showPicker ? charts.closePicker : charts.openPicker}
          onTogglePanel={(panel) => { toggleRightPanel(panel); if (panel === "timetravel") { if (rightPanel !== "timetravel") timeTravelActions.openPanel(); else timeTravelActions.closePanel(); } }}
          onToggleDark={() => setIsDark(!isDark)}
          chartBtnRef={chartBtnRef as any}
        />

        {showFilters && (
          <FilterBar
            filterValue={filterValue} advancedFilters={advancedFilters}
            filterColumns={filterColumns} filteredRowsCount={filteredRows.length}
            totalRowsCount={rows.length} filterSuggestions={filterSuggestions}
            onFilterValueChange={setFilterValue}
            onAddRule={() => {
              const firstCol = filterColumns[0];
              setAdvancedFilters((prev) => [...prev, { id: `filter_${Date.now()}_${Math.random().toString(36).slice(2)}`, columnKey: firstCol?.key ?? "", operator: "contains", value: "" }]);
            }}
            onUpdateRule={(id, update) => setAdvancedFilters((prev) => prev.map((item) => item.id === id ? { ...item, ...update } : item))}
            onRemoveRule={(id) => setAdvancedFilters((prev) => prev.filter((item) => item.id !== id))}
            onClear={() => { setFilterValue(""); setAdvancedFilters([]); setShowFilters(false); }}
          />
        )}

        {/* MAIN BODY */}
        <div className="flex-1 flex overflow-hidden relative">
          <div className="flex-1 overflow-hidden relative">
            <div className="h-full w-full" style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: "top left", width: `${(100 * 100) / zoomLevel}%`, height: `${(100 * 100) / zoomLevel}%` }}>
              <DataGrid
                columns={gridColumns} rows={filteredRows}
                rowKeyGetter={(row: SheetRow) => row.id}
                onRowsChange={handleRowsChange}
                selectedRows={selectedRows} onSelectedRowsChange={setSelectedRows}
                onColumnResize={(idx, width) => { const col = columns[idx - 1]; if (col) sheetColOps.handleColumnResize(col.key, width); }}
                rowHeight={(row) => {
                  const manual = rowHeights[row.id];
                  if (textWrap.textWrapColumns.size === 0) return manual ?? 32;
                  let max = 1;
                  const ri = rows.findIndex((r) => r.id === row.id);
                  const wk = new Set([...textWrap.textWrapColumns].filter((k) => k.startsWith(`${ri}-`)).map((k) => k.replace(`${ri}-`, "")));
                  wk.forEach((ck) => {
                    const v = String(row[ck] || "");
                    if (!v) return;
                    const cd = columns.find((c) => c.key === ck);
                    const cpl = Math.floor(((cd?.width || 160) - 20) / 7);
                    const tl = v.split("\n").reduce((a, l) => a + (Math.ceil(l.length / cpl) || 1), 0);
                    if (tl > max) max = tl;
                  });
                  const wrapHeight = Math.max(32, 8 + max * 20);
                  return manual ? Math.max(wrapHeight, manual) : wrapHeight;
                }}
                headerRowHeight={33}
                className={`rdg-sheet fill-grid ${isDark ? "rdg-dark" : "rdg-light"}`}
              />
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                className="hidden"
                onChange={handleImageChange}
              />
            </div>
            {charts.charts.map((chart) => (
              <ChartWidget key={chart.id} chart={chart} isActive={charts.activeChartId === chart.id} isDark={isDark} rows={rows} columns={columns}
                onSelect={(id) => charts.setActiveChart(id)}
                onOpenEditor={(id) => { charts.setActiveChart(id); setRightPanel("charts"); }}
                onRemove={charts.removeChart} onPositionChange={charts.updatePosition}
                onSizeChange={charts.updateSize} onMinimize={(id, val) => charts.updateChart(id, { minimized: val })} />
            ))}
          </div>

          {effectiveRightPanel && (rightPanel === "developer" || rightPanel === "timetravel" || rightPanel === "charts" || rightPanel === "conditional" || rightPanel === "columns" || rightPanel === "shortcuts" || isOrgSheet) && (
            <>
              <div className="fixed inset-0 bg-black/40 z-20 sm:hidden backdrop-blur-[1px]" onClick={() => setRightPanel(null)} />
              <div className="fixed right-0 top-0 bottom-0 z-30 sm:static sm:z-auto w-80 max-w-[88vw] shadow-2xl sm:shadow-none transition-transform duration-200 ease-out">
                <RightPanel
                  rightPanel={effectiveRightPanel} isDark={isDark} setRightPanel={setRightPanel}
                  comments={groupedCommentsForPanel} activeCommentCell={activeCommentCell}
                  newCommentText={newCommentText} replyText={replyText}
                  setNewCommentText={setNewCommentText} handleAddComment={handleAddComment}
                  handleReply={handleReply} handleResolveComment={handleResolveComment}
                  setReplyText={setReplyText} liveTracking={liveTracking} isOrganizationSheet={isOrgSheet}
                  setLiveTracking={(v) => setSheetState((p) => ({ ...p, liveTracking: v }))}
                  setShowShareDialog={setShowShareDialog} sheetId={sheetId} rows={rows} columns={columns}
                  totalComments={totalComments} historyCount={history.length} members={orgMembers}
                  timeTravelState={timeTravelState} timeTravelActions={timeTravelActions}
                  activeChart={charts.activeChart} chartPanelTab={charts.panelTab}
                  setChartPanelTab={charts.setPanelTab}
                  onUpdateChart={(patch) => { if (charts.activeChartId) charts.updateChart(charts.activeChartId, patch); }}
                  onRemoveChart={() => { if (charts.activeChartId) { charts.removeChart(charts.activeChartId); setRightPanel(null); } }}
                  selectedCell={selectedCell} conditionalRules={conditionalRules}
                  onSaveConditionalRule={handleSaveConditionalRule}
                  onDeleteConditionalRule={handleDeleteConditionalRule}
                  onApplyColumns={handleApplyColumns}
                />
              </div>
            </>
          )}
        </div>

        <StatusBar
          rowCount={rows.length} columnCount={columns.length} selectedRowsCount={selectedRows.size}
          selectedCell={selectedCell} columns={columns} filterValue={filterValue}
          filteredRowsCount={filteredRows.length} totalRowsCount={rows.length}
          isOrgSheet={isOrgSheet} liveTracking={liveTracking} chartCount={charts.charts.length}
          onChartsClick={() => setRightPanel("charts")} onShortcutsClick={() => toggleRightPanel("shortcuts")}
        />

        {/* Modals */}
        {isOrgSheet && <ShareDialog showShareDialog={showShareDialog} setShowShareDialog={setShowShareDialog} sheetId={sheetId} isDark={isDark} />}
        <SelectOptionsDialog
          open={selectSetupDialog.open} onClose={() => setSelectSetupDialog((p) => ({ ...p, open: false }))}
          onConfirm={handleSelectSetupConfirm} isDark={isDark}
          initialOptions={selectSetupDialog.mode === "cell" && selectSetupDialog.row !== null && selectSetupDialog.colKey
            ? (cellSelectOptions[`${selectSetupDialog.row}-${selectSetupDialog.colKey}`] ?? [])
            : selectSetupDialog.colKey && selectSetupDialog.colKey !== "__new__"
              ? (columns.find((c) => c.key === selectSetupDialog.colKey)?.selectOptions ?? []) : []}
        />
        <Dialog open={showDesktopTip} onOpenChange={setShowDesktopTip}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Tip</DialogTitle>
              <DialogDescription>This sheet experience is optimized for desktop. For the best view, use desktop or landscape mode.</DialogDescription>
            </DialogHeader>
            <DialogFooter><Button onClick={() => setShowDesktopTip(false)}>Got it</Button></DialogFooter>
          </DialogContent>
        </Dialog>
        {showFormulaDialog && <FormulaDialog open={showFormulaDialog} onClose={() => setShowFormulaDialog(false)} onInsert={handleFormulaInsert} isDark={isDark} />}
        {charts.showPicker && (
          <ChartPicker isDark={isDark} anchorRef={chartBtnRef} rows={rows} columns={columns}
            onSelect={(kind, preset) => { charts.insertChart(kind, rows, columns, { ...getSuggestedChartPreset(kind), ...preset }); toast.success(`${kind.charAt(0).toUpperCase() + kind.slice(1)} chart inserted — click to edit`); }}
            onClose={charts.closePicker}
          />
        )}

        <style jsx global>{`
          .sheet-root * { scrollbar-width: thin; scrollbar-color: #c7cdd8 transparent; }
          .sheet-root *::-webkit-scrollbar { width: 8px; height: 8px; }
          .sheet-root *::-webkit-scrollbar-thumb { background: #c7cdd8; border-radius: 999px; }
          .sheet-root *::-webkit-scrollbar-track { background: transparent; }
          .no-scrollbar { -ms-overflow-style: auto; scrollbar-width: thin; }
          @media (max-width: 640px) { .rdg-sheet { font-size: 11px !important; } }
        `}</style>
      </div>
    </TooltipProvider>
  );
}
