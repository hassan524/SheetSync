"use client";

import {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
  startTransition,
} from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import DataGrid, {
  Column,
  RenderCellProps,
  RenderEditCellProps,
} from "react-data-grid";
// @ts-ignore
import "react-data-grid/lib/styles.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Check,
  Loader2,
  Download,
  Share2,
  Star,
  GripVertical,
  GitBranch,
  Calendar,
  Plus,
  Trash2,
  Undo2,
  Redo2,
  WrapText,
  Copy,
  Scissors,
  Clipboard,
  Lock,
  Unlock,
  FileSpreadsheet,
  Users,
  MessageSquare,
  History,
  ChevronDown,
  Filter,
  Search,
  Settings2,
  Zap,
  Eye,
  Bell,
  Clock,
  ChevronRight,
  X,
  Link,
  Send,
  MoreHorizontal,
  Sparkles,
  BarChart3,
  Code2,
  Webhook,
  KeyRound,
  Maximize2,
  Sun,
  Moon,
  Globe,
  RefreshCw,
  Keyboard,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ArrowDownAZ,
  ArrowUpAZ,
  Paintbrush,
  Printer,
  Type,
  Snowflake,
  SlidersHorizontal,
  Sigma,
  Hash,
  Percent,
  Play,
  TableProperties,
  Layers,
  Activity,
  ListChecks,
  ChevronUp,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import FormattingToolbar from "@/components/individual/sheet/Formatting-toolbar";
import ColumnHeaderMenu from "@/components/individual/sheet/Column-header-menu";
import CellTypeSelector from "@/components/individual/sheet/Cell-type-selector";
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

// ── NEW CHART SYSTEM ────────────────────────────────────────
// import { useCharts } from "@/hooks/sheets/use-charts";
import { useCharts } from "@/hooks/sheets/use-charts";
import ChartPicker from "./Charts-picker";
import ChartWidget from "./Charts-widget";
// ───────────────────────────────────────────────────────────

import {
  SheetRow,
  ColumnDef,
  SaveStatus,
  PRIORITY_OPTIONS,
  STATUS_OPTIONS,
} from "@/types/index";
import { getTemplateData, STATUS_COLORS } from "@/lib/sheet-templates";
import { updateSheetTitle, updateSheetStarred } from "@/lib/querys/sheet/sheet";
import { saveRow, saveAllRows, deleteRows } from "@/lib/querys/sheet/rows";
import { saveAllColumns, deleteColumn } from "@/lib/querys/sheet/columns";
import { saveCellFormat } from "@/lib/querys/sheet/format";
import {
  saveFormula,
  deleteFormula,
  saveColumnFormula,
  deleteColumnFormula,
} from "@/lib/querys/sheet/formulas";
import { protectCell, unprotectCell } from "@/lib/querys/sheet/protection";
import { logActivity } from "@/lib/querys/activity/activity";

import ShareDialog from "./dialogs/Share-dialog";
import RightPanel from "./Right-panel";
import type { RightPanelType } from "./Right-panel";
import { loadSheet } from "@/lib/querys/sheet/sheet";
import {
  updateSheetCharts,
  updateSheetRowHeights,
} from "@/lib/querys/sheet/sheet";
import { exportSheet, ExportFormat } from "@/lib/querys/export";
import {
  getSheetOrgMembers,
  type OrgMember,
} from "@/lib/querys/organization/get-sheet-members";
import { supabase } from "@/lib/supabase/client";
import { trackSheetOpen } from "@/lib/querys/sheet/track-open";
import {
  subscribeToHistory,
  subscribeToComments,
  addComment,
  resolveComment,
  logCellEdit,
  logRowAdd,
  logRowDelete,
  logColAdd,
  logColDelete,
  logFormulaSet,
  logColumnRename,
  type HistoryEntry,
  type SheetComment,
} from "@/lib/querys/sheet/firebase-realtime";
// @ts-ignore
import "@/app/sheet.css";
import FormulaDialog from "./dialogs/Formula-dialog";
import { useTimeTravel } from "@/hooks/use-time-travel";
import { maybeAutoSnapshot } from "@/lib/querys/sheet/snapshots";
import {
  CommentDot,
  CollabCursor,
  IconBtn,
  ToolSep,
  SheetAvatar,
  ddStyle,
  ddItemStyle,
  getMemberColor,
  getMemberInitials,
} from "./sheet-ui-helpers";
import SelectOptionsDialog from "./dialogs/Select-options-dialog";

// ── Types ───────────────────────────────────────────────────────────────────

interface SheetState {
  title: string;
  isOrgSheet: boolean;
  liveTracking: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  ownerId: string | null;
  organizationId: string | null;
  size: string | null;
  starred: boolean;
  rows: SheetRow[];
  columns: ColumnDef[];
  forkedFromSheetId?: string | null;
  forkedFromSnapshotLabel?: string | null;
  forkedAt?: string | null;
  forkedByUserId?: string | null;
  userRole?: "owner" | "editor" | "viewer";
}

const Avatar = SheetAvatar;
const WORKING_MIN_ROWS = 1200;
const ROW_CELL_TYPES_KEY = "__cellTypes";
const ROW_CELL_SELECT_OPTIONS_KEY = "__cellSelectOptions";

function columnIndexToName(index: number): string {
  let n = index + 1;
  let name = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    name = String.fromCharCode(65 + rem) + name;
    n = Math.floor((n - 1) / 26);
  }
  return name;
}

function isGeneratedColumnName(name?: string): boolean {
  if (!name) return true;
  return /^Column\s+\d+$/i.test(name) || /^[A-Z]{1,3}$/.test(name);
}

function normalizeGeneratedColumnNames(cols: ColumnDef[]): ColumnDef[] {
  return cols.map((col, index) =>
    isGeneratedColumnName(col.name)
      ? { ...col, name: columnIndexToName(index) }
      : col,
  );
}

const OPTION_PALETTE = [
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

function getOptionBgStyle(label: string) {
  let hash = 0;
  for (let i = 0; i < label.length; i++) {
    hash = (hash * 31 + label.charCodeAt(i)) >>> 0;
  }
  return {
    color: "#1f2937",
    backgroundColor: OPTION_PALETTE[hash % OPTION_PALETTE.length],
  };
}

function getDefaultValueForType(type: ColumnDef["type"]) {
  if (type === "checkbox") return false;
  if (type === "priority") return "Low";
  if (type === "status") return "To Do";
  if (type === "date") return new Date().toISOString().split("T")[0];
  if (type === "number" || type === "currency" || type === "progress") return 0;
  return "";
}

type FilterOperator =
  | "contains"
  | "equals"
  | "not_equals"
  | "empty"
  | "not_empty"
  | "gt"
  | "gte"
  | "lt"
  | "lte";

type AdvancedFilterRule = {
  id: string;
  columnKey: string;
  operator: FilterOperator;
  value: string;
};

function getStatusOptionStyle(value: string) {
  const normalized = value.trim().toLowerCase();
  return (
    Object.entries(STATUS_COLORS).find(
      ([key]) => key.toLowerCase() === normalized,
    )?.[1] ??
    [...PRIORITY_OPTIONS, ...STATUS_OPTIONS].find(
      (option) =>
        option.value.toLowerCase() === normalized ||
        option.label.toLowerCase() === normalized,
    )
  );
}

function buildEmptyRow(index: number, columns: ColumnDef[]): SheetRow {
  const row: SheetRow = { id: String(index + 1) };
  columns.forEach((c) => {
    row[c.key] = "";
  });
  return row;
}

function ensureWorkingRowBuffer(
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

// ── Main Component ──────────────────────────────────────────────────────────
export default function SheetClient() {
  const params = useParams<{ id?: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const templateId = searchParams?.get("template") || "blank";
  const isOrganizationSheet = searchParams?.get("org") === "true";
  const importedFrom = searchParams?.get("imported");
  const sheetId = params?.id ?? "";

  const [sheetState, setSheetState] = useState<SheetState>({
    title: "",
    isOrgSheet: isOrganizationSheet,
    liveTracking: isOrganizationSheet,
    createdAt: null,
    updatedAt: null,
    ownerId: null,
    organizationId: null,
    size: null,
    starred: false,
    rows: [],
    columns: [],
    forkedFromSheetId: null,
    forkedFromSnapshotLabel: null,
    forkedAt: null,
    forkedByUserId: null,
  });
  const {
    title,
    isOrgSheet,
    liveTracking,
    starred,
    rows,
    columns,
    organizationId,
    forkedFromSheetId,
    forkedFromSnapshotLabel,
    forkedAt,
    forkedByUserId,
  } = sheetState;

  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [selectedCell, setSelectedCell] = useState<{
    row: number;
    col: string;
  } | null>(null);
  const [rightPanel, setRightPanel] = useState<RightPanelType>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [filterValue, setFilterValue] = useState("");
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilterRule[]>(
    [],
  );
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showFormulaDialog, setShowFormulaDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [fontSize, setFontSize] = useState("10");
  const [fontFamily, setFontFamily] = useState("Arial");
  const [zoomLevel, setZoomLevel] = useState(100);
  const [orgMembers, setOrgMembers] = useState<OrgMember[]>([]);
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    name: string;
    email: string;
    avatar_url: string | null;
  } | null>(null);
  const [activeCursors, setActiveCursors] = useState<
    Record<string, { name: string; color: string; row: number; col: string }>
  >({});
  const presenceChannelRef = useRef<any>(null);
  const [comments, setComments] = useState<Record<string, SheetComment[]>>({});
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [activeCommentCell, setActiveCommentCell] = useState<string | null>(
    null,
  );
  const [newCommentText, setNewCommentText] = useState("");
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [forks, setForks] = useState<
    { id: string; title: string; forked_at: string | null }[]
  >([]);
  const [cellSelectOptions, setCellSelectOptions] = useState<
    Record<string, string[]>
  >({});
  const [rowHeights, setRowHeights] = useState<Record<string, number>>({});
  const [showDesktopTip, setShowDesktopTip] = useState(true);
  const chartsHydratedRef = useRef(false);
  const rowResizeRef = useRef<{
    rowId: string;
    startY: number;
    startH: number;
    pointerId: number;
  } | null>(null);

  // ── CHART SYSTEM ──────────────────────────────────────────
  // DB is the source of truth; localStorage is only fallback.
  const charts = useCharts({
    storageKey: sheetId ? `sheetsync:${sheetId}:charts` : null,
  });
  // Ref for the Chart button — picker anchors near it
  const chartBtnRef = useRef<HTMLButtonElement | null>(null);
  // ─────────────────────────────────────────────────────────

  // Make Radix portal dropdowns follow sheet dark mode tokens
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.dataset.sheetDark = isDark ? "true" : "false";
  }, [isDark]);

  const [selectSetupDialog, setSelectSetupDialog] = useState<{
    open: boolean;
    colKey: string | null;
    row: number | null;
    mode: "insert" | "change" | "cell";
  }>({ open: false, colKey: null, row: null, mode: "insert" });

  const rowsHistory = useHistory<SheetRow[]>([]);
  const columnsHistory = useHistory<ColumnDef[]>([]);
  const titleSaveTimeout = useRef<NodeJS.Timeout | undefined>(undefined);
  const rowSaveTimeout = useRef<NodeJS.Timeout | undefined>(undefined);
  const columnResizeTimeout = useRef<NodeJS.Timeout | undefined>(undefined);
  const activityLogTimeout = useRef<NodeJS.Timeout | undefined>(undefined);

  const logCellEditActivity = useCallback(
    (sheetTitle: string) => {
      clearTimeout(activityLogTimeout.current);
      activityLogTimeout.current = setTimeout(() => {
        logActivity({
          sheetId,
          organizationId: organizationId ?? undefined,
          action: "edited cells",
          target: sheetTitle || title,
        }).catch(() => {});
      }, 30000);
    },
    [sheetId, organizationId, title],
  );

  const formatting = useSheetFormatting(() => {});
  const textWrap = useTextWrap(rows, () => {});
  const clipboard = useClipboard(rows, rowsHistory, () => {});
  const protection = useProtectedCells(() => {});
  const rowOps = useRowOperations(rows, columns, rowsHistory, () => {});
  const colOps = useColumnOperations(
    rows,
    columns,
    columnsHistory,
    rowsHistory,
    () => {},
  );
  const cellTypes = useCellTypes(rows, rowsHistory, () => {});
  const formulas = useFormulas(rows, columns);

  const [timeTravelState, timeTravelActions] = useTimeTravel({
    sheetId,
    currentRows: rows,
    currentColumns: columns,
    historyEntries: history,
    currentUserId: currentUser?.id,
    currentUserName: currentUser?.name,
    organizationId: isOrgSheet ? organizationId : null,
    onBranch: (newSheetId, label) => {
      toast.success(`Branched! Opening "${label}"…`, { duration: 3000 });
      router.push(`/sheet/${newSheetId}`);
    },
  });

  useEffect(() => {
    startTransition(() =>
      setSheetState((p) => ({ ...p, rows: rowsHistory.currentState })),
    );
  }, [rowsHistory.currentState]);
  useEffect(() => {
    startTransition(() =>
      setSheetState((p) => ({ ...p, columns: columnsHistory.currentState })),
    );
  }, [columnsHistory.currentState]);

  const effectiveRightPanel = useMemo((): RightPanelType => {
    if (
      !isOrgSheet &&
      (rightPanel === "comments" || rightPanel === "collaborators")
    )
      return null;
    return rightPanel;
  }, [isOrgSheet, rightPanel]);

  // ── When a chart becomes active, open the charts panel ───
  useEffect(() => {
    if (charts.activeChartId) {
      setRightPanel("charts");
    }
  }, [charts.activeChartId]);

  useEffect(() => {
    if (!sheetId) return;
    chartsHydratedRef.current = false;
    queueMicrotask(() => setIsLoading(true));
    loadSheet(sheetId)
      .then(async (data) => {
        if (data.rows.length > 0 || data.columns.length > 0) {
          const sheetIsOrg = data.isPersonal === false || isOrganizationSheet;
          let wrapSet = new Set<string>();
          if (data.cellFormats)
            wrapSet = new Set<string>(
              Object.entries(data.cellFormats)
                .filter(([, fmt]) => (fmt as any).textWrap === true)
                .map(([k]) => k),
            );
          if (data.cellFormats && Object.keys(data.cellFormats).length > 0)
            formatting.setCellFormats(data.cellFormats);
          if (data.cellFormats && Object.keys(data.cellFormats).length > 0) {
            const selectByCell: Record<string, string[]> = {};
            Object.entries(data.cellFormats).forEach(([key, fmt]) => {
              const opts = (fmt as any)?.selectOptions;
              if (Array.isArray(opts) && opts.length > 0)
                selectByCell[key] = opts;
            });
            if (Object.keys(selectByCell).length > 0) {
              setCellSelectOptions(selectByCell);
            }
          }
          if (data.formulas && Object.keys(data.formulas).length > 0)
            formulas.setFormulas(data.formulas);
          if (
            data.columnFormulas &&
            Object.keys(data.columnFormulas).length > 0
          )
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
                typeOverrides[`${rowIdx}-${colKey}`] =
                  type as ColumnDef["type"];
              });
            }
            const rowSelects = row[ROW_CELL_SELECT_OPTIONS_KEY];
            if (rowSelects && typeof rowSelects === "object") {
              Object.entries(rowSelects).forEach(([colKey, options]) => {
                if (Array.isArray(options) && options.length > 0) {
                  rowSelectOptions[`${rowIdx}-${colKey}`] = options.map(String);
                }
              });
            }
          });
          if (Object.keys(typeOverrides).length > 0) {
            cellTypes.setCellTypeOverrides(typeOverrides);
          }
          if (Object.keys(rowSelectOptions).length > 0) {
            setCellSelectOptions((prev) => ({ ...prev, ...rowSelectOptions }));
          }
          rowsHistory.pushState(bufferedRows);
          columnsHistory.pushState(data.columns);
          const userRole =
            sheetIsOrg && currentUser
              ? data.ownerId === currentUser.id
                ? "owner"
                : orgMembers.find((m) => m.id === currentUser.id)?.role ||
                  "viewer"
              : "owner";

          setSheetState({
            title: data.title,
            isOrgSheet: sheetIsOrg,
            liveTracking: sheetIsOrg,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
            ownerId: data.ownerId,
            organizationId: data.organizationId ?? null,
            size: data.size,
            starred: data.isStarred,
            rows: bufferedRows,
            columns: data.columns,
            forkedFromSheetId: data.forked_from_sheet_id,
            forkedFromSnapshotLabel: data.forked_from_snapshot_label,
            forkedAt: data.forked_at,
            forkedByUserId: data.forked_by_user_id,
            userRole: userRole as "owner" | "editor" | "viewer",
          });

          // Hydrate charts + row heights from DB (fallback to localStorage hook state if null)
          if (Array.isArray((data as any).charts)) {
            charts.replaceAll((data as any).charts);
          }
          chartsHydratedRef.current = true;
          if (Array.isArray((data as any).forks)) {
            setForks((data as any).forks);
          }
          if (
            (data as any).rowHeights &&
            typeof (data as any).rowHeights === "object"
          ) {
            setRowHeights((data as any).rowHeights as Record<string, number>);
          }
        } else {
          const td = getTemplateData(templateId);
          const bufferedRows = ensureWorkingRowBuffer(td.rows, td.columns);
          rowsHistory.pushState(bufferedRows);
          columnsHistory.pushState(td.columns);
          setSheetState((p) => ({
            ...p,
            title: data.title || td.title,
            starred: false,
            rows: bufferedRows,
            columns: td.columns,
          }));
          await Promise.all([
            saveAllRows(sheetId, bufferedRows),
            saveAllColumns(sheetId, td.columns),
          ]);
          chartsHydratedRef.current = true;
        }
        await trackSheetOpen(sheetId);
      })
      .catch((err) => {
        console.error(err);
        toast.error("Failed to load sheet. Please refresh.");
      })
      .finally(() => setIsLoading(false));
  }, [sheetId, charts.replaceAll]);

  useEffect(() => {
    if (!importedFrom) return;
    const label = importedFrom === "excel" ? "Excel" : "CSV";
    toast.success(`This sheet was imported from ${label}.`);
  }, [importedFrom]);

  // Persist row heights to DB (debounced)
  useEffect(() => {
    if (!sheetId) return;
    const t = setTimeout(() => {
      updateSheetRowHeights(sheetId, rowHeights).catch((e) => {
        console.error(e);
      });
    }, 600);
    return () => clearTimeout(t);
  }, [rowHeights, sheetId]);

  // Persist charts to DB (debounced)
  useEffect(() => {
    if (!sheetId) return;
    if (!chartsHydratedRef.current) return;
    const t = setTimeout(() => {
      updateSheetCharts(sheetId, charts.charts).catch((e) => {
        console.error(e);
      });
    }, 600);
    return () => clearTimeout(t);
  }, [charts.charts, sheetId]);

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
    if (!st) return;
    if (st.pointerId !== e.pointerId) return;
    const dy = e.clientY - st.startY;
    const next = Math.max(24, Math.min(260, st.startH + dy));
    setRowHeights((p) => ({ ...p, [st.rowId]: next }));
  }, []);

  const endRowResize = useCallback((e: React.PointerEvent) => {
    const st = rowResizeRef.current;
    if (!st) return;
    if (st.pointerId !== e.pointerId) return;
    rowResizeRef.current = null;
  }, []);

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
        if (data) setOrgMembers(data.members);
      })
      .catch(console.error);
  }, [sheetId, isOrgSheet]);

  useEffect(() => {
    if (!sheetId) return;
    return subscribeToHistory(sheetId, setHistory);
  }, [sheetId]);
  useEffect(() => {
    if (!sheetId) return;
    return subscribeToComments(sheetId, (grouped) => setComments(grouped));
  }, [sheetId]);

  useEffect(() => {
    if (!sheetId || !isOrgSheet || !currentUser) return;
    const ch = supabase.channel(`sheet-cursors:${sheetId}`, {
      config: { presence: { key: currentUser.id } },
    });
    ch.on("presence", { event: "sync" }, () => {
      const state = ch.presenceState<{
        name: string;
        color: string;
        row: number;
        col: string;
      }>();
      const cursors: typeof activeCursors = {};
      Object.entries(state).forEach(([uid, ps]) => {
        if (uid !== currentUser.id && ps[0]) cursors[uid] = ps[0];
      });
      setActiveCursors(cursors);
    }).subscribe((status) => {
      if (status === "SUBSCRIBED") presenceChannelRef.current = ch;
    });
    return () => {
      supabase.removeChannel(ch);
      presenceChannelRef.current = null;
    };
  }, [sheetId, isOrgSheet, currentUser]);

  useEffect(() => {
    if (!presenceChannelRef.current || !currentUser || !selectedCell) return;
    presenceChannelRef.current.track({
      name: currentUser.name,
      color: getMemberColor(currentUser.id),
      row: selectedCell.row,
      col: selectedCell.col,
    });
  }, [selectedCell, currentUser]);

  const markSaving = useCallback(() => setSaveStatus("saving"), []);
  const markSaved = useCallback(() => setSaveStatus("saved"), []);

  const handleTitleChange = useCallback(
    (t: string) => {
      setSheetState((p) => ({ ...p, title: t }));
      markSaving();
      clearTimeout(titleSaveTimeout.current);
      titleSaveTimeout.current = setTimeout(async () => {
        await updateSheetTitle(sheetId, t);
        markSaved();
      }, 1000);
    },
    [sheetId, markSaving, markSaved],
  );

  const handleStarredToggle = useCallback(async () => {
    setSheetState((p) => {
      const n = !p.starred;
      updateSheetStarred(sheetId, n);
      return { ...p, starred: n };
    });
  }, [sheetId]);

  const handleSaveChangedRow = useCallback(
    (updated: SheetRow[], prev: SheetRow[]) => {
      const changed = updated.find(
        (r, i) => !prev[i] || JSON.stringify(r) !== JSON.stringify(prev[i]),
      );
      if (!changed) return;
      markSaving();
      clearTimeout(rowSaveTimeout.current);
      rowSaveTimeout.current = setTimeout(async () => {
        await saveRow(sheetId, changed, updated.indexOf(changed));
        markSaved();
      }, 800);
    },
    [sheetId, markSaving, markSaved],
  );

  const handleFormatChange = useCallback(
    async (format: any) => {
      if (!selectedCell) return;
      formatting.applyFormat(selectedCell, format);
      const merged = {
        ...formatting.getCurrentCellFormat(selectedCell),
        ...format,
      };
      const cellKey = `${selectedCell.row}-${selectedCell.col}`;
      markSaving();
      await saveCellFormat(sheetId, cellKey, merged);
      markSaved();
    },
    [
      selectedCell,
      sheetId,
      markSaving,
      markSaved,
      formatting.applyFormat,
      formatting.getCurrentCellFormat,
    ],
  );

  const handlePaste = useCallback(async () => {
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
    clipboard.pasteCellOrRange,
    selectedCell,
    sheetId,
    rowsHistory.currentState,
    markSaving,
    markSaved,
  ]);

  const handleProtectionToggle = useCallback(async () => {
    if (!selectedCell) return;
    const k = protection.getCellKey(selectedCell.row, selectedCell.col);
    const isProt = protection.isCellProtected(
      selectedCell.row,
      selectedCell.col,
    );
    protection.toggleProtectCell(selectedCell);
    markSaving();
    if (isProt) await unprotectCell(sheetId, k);
    else await protectCell(sheetId, k);
    markSaved();
  }, [
    selectedCell,
    protection.getCellKey,
    protection.isCellProtected,
    protection.toggleProtectCell,
    sheetId,
    markSaving,
    markSaved,
  ]);

  useKeyboardShortcuts({
    selectedCell,
    rowsHistory,
    getCurrentCellFormat: formatting.getCurrentCellFormat,
    applyFormat: formatting.applyFormat,
    copyCellOrRange: clipboard.copyCellOrRange,
    pasteCellOrRange: handlePaste,
    cutCellOrRange: clipboard.cutCellOrRange,
  });

  const handleInsertRow = useCallback(async () => {
    rowOps.insertRow();
    setTimeout(async () => {
      try {
        markSaving();
        await saveAllRows(sheetId, rowsHistory.currentState);
        markSaved();
        if (isOrgSheet) logRowAdd(sheetId, rowsHistory.currentState.length);
        logActivity({
          sheetId,
          organizationId: organizationId ?? undefined,
          action: "inserted a row",
          target: title,
        }).catch(() => {});
      } catch {
        toast.error("Row added locally but failed to persist.");
        setSaveStatus("saved");
      }
    }, 50);
  }, [
    rowOps.insertRow,
    sheetId,
    rowsHistory.currentState,
    markSaving,
    markSaved,
    isOrgSheet,
    organizationId,
    title,
  ]);

  const handleDeleteRow = useCallback(async () => {
    if (selectedRows.size === 0) return;
    const keys = Array.from(selectedRows);
    const count = selectedRows.size;
    rowOps.deleteRow(selectedRows);
    setSelectedRows(new Set());
    try {
      markSaving();
      await deleteRows(sheetId, keys);
      setTimeout(async () => {
        await saveAllRows(sheetId, rowsHistory.currentState);
        markSaved();
        if (isOrgSheet) logRowDelete(sheetId, count);
        logActivity({
          sheetId,
          organizationId: organizationId ?? undefined,
          action: `deleted ${count} row${count > 1 ? "s" : ""}`,
          target: title,
        }).catch(() => {});
      }, 50);
    } catch {
      toast.error("Row deleted locally but failed to persist.");
      setSaveStatus("saved");
    }
  }, [
    selectedRows,
    rowOps.deleteRow,
    sheetId,
    rowsHistory.currentState,
    markSaving,
    markSaved,
    isOrgSheet,
    organizationId,
    title,
  ]);

  const handleInsertColumn = useCallback(
    async (type: ColumnDef["type"]) => {
      if (type === "select") {
        setSelectSetupDialog({
          open: true,
          colKey: "__new__",
          row: null,
          mode: "insert",
        });
        return;
      }
      colOps.insertColumn(type);
      setTimeout(async () => {
        markSaving();
        const normalizedCols = normalizeGeneratedColumnNames(
          columnsHistory.currentState,
        );
        columnsHistory.pushState(normalizedCols);
        setSheetState((p) => ({ ...p, columns: normalizedCols }));
        await Promise.all([
          saveAllColumns(sheetId, normalizedCols),
          saveAllRows(sheetId, rowsHistory.currentState),
        ]);
        markSaved();
        if (isOrgSheet) {
          const nc = normalizedCols[normalizedCols.length - 1];
          logColAdd(sheetId, nc?.name ?? "Column", type ?? "text");
        }
        logActivity({
          sheetId,
          organizationId: organizationId ?? undefined,
          action: `added a column (${type ?? "text"})`,
          target: title,
        }).catch(() => {});
      }, 50);
    },
    [
      colOps.insertColumn,
      sheetId,
      columnsHistory.currentState,
      rowsHistory.currentState,
      markSaving,
      markSaved,
      isOrgSheet,
      organizationId,
      title,
    ],
  );

  const handleDeleteColumn = useCallback(
    async (colKey: string) => {
      const colName = columns.find((c) => c.key === colKey)?.name ?? colKey;
      colOps.deleteColumn(colKey);
      markSaving();
      await deleteColumn(sheetId, colKey);
      setTimeout(async () => {
        await Promise.all([
          saveAllColumns(sheetId, columnsHistory.currentState),
          saveAllRows(sheetId, rowsHistory.currentState),
        ]);
        markSaved();
        if (isOrgSheet) logColDelete(sheetId, colName);
        logActivity({
          sheetId,
          organizationId: organizationId ?? undefined,
          action: `deleted column "${colName}"`,
          target: title,
        }).catch(() => {});
      }, 50);
    },
    [
      colOps.deleteColumn,
      sheetId,
      columnsHistory.currentState,
      rowsHistory.currentState,
      markSaving,
      markSaved,
      columns,
      isOrgSheet,
      organizationId,
      title,
    ],
  );

  const handleChangeColumnType = useCallback(
    async (colKey: string, newType: ColumnDef["type"]) => {
      if (newType === "select") {
        setSelectSetupDialog({ open: true, colKey, row: null, mode: "change" });
        return;
      }
      colOps.changeColumnType(colKey, newType);
      setTimeout(async () => {
        markSaving();
        await Promise.all([
          saveAllColumns(sheetId, columnsHistory.currentState),
          saveAllRows(sheetId, rowsHistory.currentState),
        ]);
        markSaved();
      }, 50);
    },
    [
      colOps.changeColumnType,
      sheetId,
      columnsHistory.currentState,
      rowsHistory.currentState,
      markSaving,
      markSaved,
    ],
  );

  const handleSelectSetupConfirm = useCallback(
    async (options: string[]) => {
      const { colKey, mode, row } = selectSetupDialog;
      if (mode === "insert") {
        colOps.insertColumn("select");
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
            if (isOrgSheet)
              logColAdd(sheetId, newCol.name ?? "Column", "select");
            logActivity({
              sheetId,
              organizationId: organizationId ?? undefined,
              action: "added a select column",
              target: title,
            }).catch(() => {});
          }
          markSaved();
        }, 50);
      } else if (mode === "change" && colKey) {
        colOps.changeColumnType(colKey, "select");
        setTimeout(async () => {
          markSaving();
          const updatedCols = columnsHistory.currentState.map((c) =>
            c.key === colKey
              ? {
                  ...c,
                  type: "select" as ColumnDef["type"],
                  selectOptions: options,
                }
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
        cellTypes.setCellTypeOverrides((prev) => ({
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
      selectSetupDialog,
      colOps,
      sheetId,
      columnsHistory,
      rowsHistory.currentState,
      markSaving,
      markSaved,
      isOrgSheet,
      organizationId,
      title,
      rows,
      cellTypes,
      setSheetState,
    ],
  );

  const handleColumnDragEnd = useCallback(async () => {
    colOps.handleColumnDragEnd();
    setTimeout(async () => {
      markSaving();
      await saveAllColumns(sheetId, columnsHistory.currentState);
      markSaved();
    }, 50);
  }, [
    colOps.handleColumnDragEnd,
    sheetId,
    columnsHistory.currentState,
    markSaving,
    markSaved,
  ]);

  const handleColumnResize = useCallback(
    (colKey: string, width: number) => {
      colOps.handleColumnResize(
        colKey,
        width,
        (updater: React.SetStateAction<ColumnDef[]>) => {
          setSheetState((p) => ({
            ...p,
            columns:
              typeof updater === "function" ? updater(p.columns) : updater,
          }));
        },
      );
      clearTimeout(columnResizeTimeout.current);
      columnResizeTimeout.current = setTimeout(async () => {
        markSaving();
        await saveAllColumns(sheetId, columnsHistory.currentState);
        markSaved();
      }, 500);
    },
    [
      colOps.handleColumnResize,
      sheetId,
      columnsHistory.currentState,
      markSaving,
      markSaved,
    ],
  );

  const handleHideColumn = useCallback(async () => {
    if (!isOrgSheet || sheetState.ownerId !== currentUser?.id) {
      toast.info("Only the sheet owner can hide columns");
      return;
    }
    if (!selectedCell) {
      toast.info("Select a cell in the column to hide");
      return;
    }
    const col = columns.find((c) => c.key === selectedCell.col);
    if (!col) return;
    const updatedColumns = columns.map((c) =>
      c.key === selectedCell.col ? { ...c, hidden: !c.hidden } : c,
    );
    setSheetState((p) => ({ ...p, columns: updatedColumns }));
    columnsHistory.pushState(updatedColumns);
    markSaving();
    await saveAllColumns(sheetId, updatedColumns);
    markSaved();
    toast.success(col.hidden ? "Column shown" : "Column hidden");
  }, [
    selectedCell,
    columns,
    sheetId,
    columnsHistory,
    markSaving,
    markSaved,
    isOrgSheet,
    sheetState.ownerId,
    currentUser,
  ]);

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
    }, 50);
  }, [
    selectedCell,
    textWrap.textWrapColumns,
    textWrap.toggleTextWrap,
    sheetId,
    formatting.getCurrentCellFormat,
    markSaving,
    markSaved,
  ]);

  const handleExport = useCallback(
    async (format: ExportFormat) => {
      const id = toast.loading(`Preparing ${format.toUpperCase()} export…`);
      try {
        await exportSheet({ format, sheetId });
        toast.success(`Downloaded as ${format.toUpperCase()}`, { id });
      } catch {
        toast.error("Export failed. Please try again.", { id });
      }
    },
    [sheetId],
  );

  const handleSort = useCallback(
    (dir: "asc" | "desc") => {
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
    },
    [selectedCell, rows, rowsHistory.pushState],
  );

  const handleSortByColumn = useCallback(
    (colKey: string, dir: "asc" | "desc") => {
      const sorted = [...rows].sort((a, b) => {
        const va = String(a[colKey] ?? "");
        const vb = String(b[colKey] ?? "");
        return dir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
      });
      rowsHistory.pushState(sorted);
      toast.success(`Sorted ${dir === "asc" ? "A → Z" : "Z → A"}`);
    },
    [rows, rowsHistory.pushState],
  );

  const insertColumnAt = useCallback(
    (
      index: number,
      base?: ColumnDef | null,
      mode: "blank" | "duplicate" = "blank",
    ) => {
      const newKey = `col_${Date.now()}`;
      const type = base?.type ?? "text";
      const newCol: ColumnDef = {
        key: newKey,
        name:
          mode === "duplicate" && base?.name
            ? `${base.name} copy`
            : columnIndexToName(Math.max(0, Math.min(columns.length, index))),
        width: base?.width ?? 150,
        editable: true,
        resizable: true,
        type,
        ...(type === "currency"
          ? { currencyCode: base?.currencyCode ?? "USD" }
          : {}),
        ...(type === "select" && base?.selectOptions
          ? { selectOptions: base.selectOptions }
          : {}),
      };

      const nextCols = [...columns];
      nextCols.splice(Math.max(0, Math.min(nextCols.length, index)), 0, newCol);
      const namedCols =
        mode === "duplicate"
          ? nextCols
          : normalizeGeneratedColumnNames(nextCols);
      columnsHistory.pushState(namedCols);
      setSheetState((p) => ({ ...p, columns: namedCols }));

      const nextRows = rows.map((r) => {
        const nr: any = { ...r };
        if (mode === "duplicate" && base) {
          nr[newKey] = r[base.key];
        } else {
          if (type === "checkbox") nr[newKey] = false;
          else if (
            type === "number" ||
            type === "currency" ||
            type === "progress"
          )
            nr[newKey] = 0;
          else if (type === "image") nr[newKey] = "";
          else if (type === "priority") nr[newKey] = "Medium";
          else if (type === "status") nr[newKey] = "Not Started";
          else if (type === "date")
            nr[newKey] = new Date().toISOString().split("T")[0];
          else nr[newKey] = "";
        }
        return nr;
      });
      rowsHistory.pushState(nextRows);
    },
    [columns, rows, columnsHistory, rowsHistory, setSheetState],
  );

  const clearColumnValues = useCallback(
    (col: ColumnDef) => {
      const type = col.type ?? "text";
      const nextRows = rows.map((r) => {
        const nr: any = { ...r };
        if (type === "checkbox") nr[col.key] = false;
        else if (
          type === "number" ||
          type === "currency" ||
          type === "progress"
        )
          nr[col.key] = 0;
        else nr[col.key] = "";
        return nr;
      });
      rowsHistory.pushState(nextRows);
      toast.success(`Cleared "${col.name}"`);
      setTimeout(async () => {
        try {
          markSaving();
          await saveAllRows(sheetId, rowsHistory.currentState);
          markSaved();
        } catch {
          toast.error("Clear saved locally but failed to persist.");
          setSaveStatus("saved");
        }
      }, 50);
    },
    [rows, rowsHistory, markSaving, markSaved, sheetId],
  );

  const handleFontFamilyChange = useCallback(
    (f: string) => {
      setFontFamily(f);
      if (selectedCell) handleFormatChange({ fontFamily: f });
    },
    [selectedCell, handleFormatChange],
  );
  const handleFontSizeChange = useCallback(
    (s: string) => {
      setFontSize(s);
      if (selectedCell) handleFormatChange({ fontSize: Number(s) });
    },
    [selectedCell, handleFormatChange],
  );
  const handleZoomChange = useCallback(
    (z: number) => setZoomLevel(Math.max(50, Math.min(200, z))),
    [],
  );

  const handleFormulaInsert = useCallback(
    async (example: string) => {
      if (!selectedCell) {
        toast.info("Select a cell first, then insert formula");
        return;
      }
      const cellKey = `${selectedCell.row}-${selectedCell.col}`;
      formulas.setFormulas((p) => ({ ...p, [cellKey]: example }));
      markSaving();
      await saveFormula(sheetId, cellKey, example);
      if (isOrgSheet) {
        const cl = String.fromCharCode(
          65 + columns.findIndex((c) => c.key === selectedCell.col),
        );
        logFormulaSet(sheetId, `${cl}${selectedCell.row + 1}`, example);
      }
      markSaved();
      setShowFormulaDialog(false);
      toast.success("Formula inserted — edit as needed");
    },
    [
      selectedCell,
      formulas.setFormulas,
      sheetId,
      markSaving,
      markSaved,
      isOrgSheet,
      columns,
    ],
  );

  const openFormulaPanel = useCallback(() => {
    if (!selectedCell) {
      toast.info("Select a cell first.");
      return;
    }
    setShowFormulaDialog(true);
  }, [selectedCell]);

  const getSuggestedChartPreset = useCallback(
    (kind: any) => {
      const usableCols = columns.filter((c) => !c.hidden);
      const labelCol = usableCols.find(
        (c) =>
          c.type === "text" ||
          c.type === "status" ||
          c.type === "priority" ||
          c.type === "select" ||
          c.type === "date",
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

  const handleApplyFormulaToColumn = useCallback(
    async (columnKey: string, formula: string) => {
      if (!formula.startsWith("=")) {
        toast.error("Formula must start with =");
        return;
      }
      formulas.setColumnFormulas((p) => ({ ...p, [columnKey]: formula }));
      markSaving();
      await saveColumnFormula(sheetId, columnKey, formula);
      markSaved();
      toast.success(`Formula applied to entire "${columnKey}" column`);
    },
    [formulas.setColumnFormulas, sheetId, markSaving, markSaved],
  );

  const handleRemoveColumnFormula = useCallback(
    async (columnKey: string) => {
      formulas.setColumnFormulas((p) => {
        const n = { ...p };
        delete n[columnKey];
        return n;
      });
      markSaving();
      await deleteColumnFormula(sheetId, columnKey);
      markSaved();
      toast.success("Column formula removed");
    },
    [formulas.setColumnFormulas, sheetId, markSaving, markSaved],
  );

  const handleUpdateSelectOptions = useCallback(
    async (colKey: string, options: string[]) => {
      setSheetState((p) => ({
        ...p,
        columns: p.columns.map((c) =>
          c.key === colKey ? { ...c, selectOptions: options } : c,
        ),
      }));
      columnsHistory.pushState(
        columns.map((c) =>
          c.key === colKey ? { ...c, selectOptions: options } : c,
        ),
      );
      markSaving();
      setTimeout(async () => {
        await saveAllColumns(sheetId, columnsHistory.currentState);
        markSaved();
      }, 50);
    },
    [columns, columnsHistory, sheetId, markSaving, markSaved],
  );

  const handleSelectedCellTypeChange = useCallback(
    (type: ColumnDef["type"]) => {
      if (!selectedCell) return;
      if (type === "select") {
        const cellKey = `${selectedCell.row}-${selectedCell.col}`;
        setSelectSetupDialog({
          open: true,
          colKey: selectedCell.col,
          row: selectedCell.row,
          mode: "cell",
        });
        if (cellSelectOptions[cellKey]?.length > 0) return;
        return;
      }

      const cellKey = `${selectedCell.row}-${selectedCell.col}`;
      cellTypes.setCellTypeOverrides((prev) => ({ ...prev, [cellKey]: type }));
      const updatedRows = rows.map((row, idx) => {
        if (idx !== selectedCell.row) return row;
        return {
          ...row,
          [selectedCell.col]: getDefaultValueForType(type),
          [ROW_CELL_TYPES_KEY]: {
            ...(row[ROW_CELL_TYPES_KEY] ?? {}),
            [selectedCell.col]: type,
          },
        };
      });
      rowsHistory.pushState(updatedRows);
      setSheetState((p) => ({ ...p, rows: updatedRows }));
      saveAllRows(sheetId, updatedRows).catch(() => {
        toast.error("Failed to save cell type");
      });
      toast.success(`Cell changed to ${type}`);
    },
    [
      selectedCell,
      cellTypes,
      rows,
      rowsHistory,
      sheetId,
      cellSelectOptions,
      setSheetState,
    ],
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

  const handleAddComment = useCallback(
    async (cellKey: string) => {
      if (!newCommentText.trim()) return;
      await addComment({
        sheetId,
        cellKey,
        userId: "local",
        author: "You",
        authorColor: "#0d7c5f",
        text: newCommentText.trim(),
        parentId: null,
      });
      setNewCommentText("");
      toast.success("Comment added");
    },
    [newCommentText, sheetId],
  );

  const handleReply = useCallback(
    async (cellKey: string, commentId: string) => {
      const text = replyText[commentId];
      if (!text?.trim()) return;
      await addComment({
        sheetId,
        cellKey,
        userId: "local",
        author: "You",
        authorColor: "#0d7c5f",
        text: text.trim(),
        parentId: commentId,
      });
      setReplyText((p) => ({ ...p, [commentId]: "" }));
    },
    [replyText, sheetId],
  );

  const handleResolveComment = useCallback(
    async (_cellKey: string, commentId: string) => {
      await resolveComment(commentId);
      toast.success("Comment resolved");
    },
    [],
  );

  const getCellComments = useCallback(
    (rowIdx: number, colKey: string) => {
      if (!isOrgSheet) return [];
      return comments[`${rowIdx}-${colKey}`] || [];
    },
    [comments, isOrgSheet],
  );

  const toggleRightPanel = useCallback(
    (panel: RightPanelType) => {
      if (!isOrgSheet && (panel === "comments" || panel === "collaborators"))
        return;
      setRightPanel((p) => (p === panel ? null : panel));
    },
    [isOrgSheet],
  );

  // ── Cell renderer ──────────────────────────────────────────────────────────
  const renderCellByType = useCallback(
    (
      type: ColumnDef["type"],
      props: RenderCellProps<SheetRow>,
      colKey: string,
    ) => {
      const activeRows = timeTravelState.previewRows || rows;
      const { row } = props;
      const rowIdx = activeRows.findIndex((r) => r.id === row.id);
      const cellStyle = formatting.getCellStyle(
        rowIdx,
        colKey,
        textWrap.textWrapColumns,
      );
      const cellKey = protection.getCellKey(rowIdx, colKey);
      const formula = formulas.getFormula(rowIdx, colKey);
      const isProtected = protection.isCellProtected(rowIdx, colKey);
      const cellComments = getCellComments(rowIdx, colKey);
      const commentKey = `${rowIdx}-${colKey}`;
      const isWrapped = textWrap.textWrapColumns.has(`${rowIdx}-${colKey}`);
      const horizontalAlign =
        (cellStyle.textAlign as "left" | "center" | "right" | undefined) ??
        undefined;
      const activeCollabEntry = Object.values(activeCursors).find(
        (c) => c.row === rowIdx && c.col === colKey,
      );
      const activeCollab = activeCollabEntry
        ? { name: activeCollabEntry.name, color: activeCollabEntry.color }
        : null;
      let displayValue = row[colKey];
      const colDef = columns.find((c) => c.key === colKey);
      if (formula?.startsWith("="))
        displayValue = formulas.evaluateFormula(formula, rowIdx);

      const cellContent = (() => {
        switch (type) {
          case "status":
          case "priority": {
            const opt = getStatusOptionStyle(String(displayValue ?? ""));
            if (!opt)
              return <span className="sheet-cell-text">{displayValue}</span>;
            return (
              <span
                className="sheet-badge-pill"
                style={{ color: opt.color, backgroundColor: opt.bgColor }}
              >
                {opt.label}
              </span>
            );
          }
          case "checkbox":
            return displayValue ? (
              <span className="h-6 w-6 rounded-md bg-emerald-500/15 border border-emerald-600/60 flex items-center justify-center">
                <Check className="h-4 w-4 text-emerald-700" />
              </span>
            ) : (
              <span className="h-5 w-5 rounded border border-gray-400/80 bg-white" />
            );
          case "date":
            return displayValue ? (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3 w-3 text-gray-400" />
                <span className="sheet-cell-text">{String(displayValue)}</span>
              </div>
            ) : null;
          case "currency":
            return displayValue ? (
              <span className="tabular-nums sheet-cell-mono">
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: colDef?.currencyCode || "USD",
                  minimumFractionDigits: 2,
                }).format(Number(displayValue))}
              </span>
            ) : (
              ""
            );
          case "image":
            return displayValue ? (
              <img
                src={String(displayValue)}
                alt="Cell"
                className="h-8 w-8 rounded object-cover border border-gray-200"
                loading="lazy"
              />
            ) : (
              <span className="text-gray-300 text-[10px] italic">
                Image URL…
              </span>
            );
          case "url":
            return displayValue ? (
              <a
                href={String(displayValue)}
                target="_blank"
                rel="noopener noreferrer"
                className="sheet-link truncate"
              >
                {String(displayValue)}
              </a>
            ) : null;
          case "progress": {
            const pct = Math.min(100, Math.max(0, Number(displayValue ?? 0)));
            const color =
              pct >= 80
                ? "#166534"
                : pct >= 50
                  ? "#b45309"
                  : pct >= 20
                    ? "#1d4ed8"
                    : "#6b7280";
            const bg =
              pct >= 80
                ? "#dcfce7"
                : pct >= 50
                  ? "#fef3c7"
                  : pct >= 20
                    ? "#dbeafe"
                    : "#f3f4f6";
            return (
              <div className="flex items-center gap-2 w-full px-1">
                <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                  />
                </div>
                <span
                  className="text-[10.5px] font-semibold tabular-nums shrink-0 px-1.5 py-0.5 rounded"
                  style={{ color, backgroundColor: bg }}
                >
                  {pct}%
                </span>
              </div>
            );
          }
          case "select": {
            const val = String(displayValue ?? "");
            const optionStyle = getOptionBgStyle(val);
            if (!val)
              return (
                <span className="text-gray-300 text-[10px] italic">
                  Select…
                </span>
              );
            return (
              <span className="sheet-badge-pill" style={optionStyle}>
                {val}
              </span>
            );
          }
          case "number":
            return displayValue !== undefined ? (
              <span className="truncate sheet-cell-text tabular-nums">
                {String(displayValue)}
              </span>
            ) : (
              ""
            );
          default:
            return displayValue !== undefined ? (
              <span
                className={
                  isWrapped
                    ? "sheet-cell-text break-words whitespace-pre-wrap w-full"
                    : "truncate sheet-cell-text"
                }
              >
                {String(displayValue)}
              </span>
            ) : (
              ""
            );
        }
      })();

      return (
        <div
          className={`h-full w-full flex relative group/cell ${isWrapped ? "items-start pt-1.5" : "items-center"} ${horizontalAlign === "center" ? "justify-center" : horizontalAlign === "right" ? "justify-end" : horizontalAlign === "left" ? "justify-start" : type === "currency" || type === "number" ? "justify-end" : ""} ${type === "checkbox" ? "justify-center" : ""} px-2.5 py-1 gap-1.5`}
          style={{
            color: "inherit",
            ...cellStyle,
            ...(activeCollab
              ? {
                  outline: `2px solid ${activeCollab.color}`,
                  outlineOffset: "-2px",
                }
              : {}),
          }}
          onClick={() => {
            setSelectedCell({ row: rowIdx, col: colKey });
            setActiveCommentCell(`${rowIdx}-${colKey}`);
          }}
        >
          {isProtected && (
            <Lock className="absolute top-1 right-1 h-2 w-2 text-gray-300 opacity-0 group-hover/cell:opacity-60 transition-opacity" />
          )}
          {isOrgSheet && cellComments.length > 0 && (
            <CommentDot count={cellComments.length} />
          )}
          {activeCollab && (
            <CollabCursor name={activeCollab.name} color={activeCollab.color} />
          )}
          {cellContent}
          {isOrgSheet && (
            <button
              className="absolute bottom-0.5 right-0.5 opacity-0 group-hover/cell:opacity-100 transition-opacity duration-100"
              onClick={(e) => {
                e.stopPropagation();
                setActiveCommentCell(commentKey);
                setRightPanel("comments");
              }}
            >
              <MessageSquare className="h-2.5 w-2.5 text-gray-300 hover:text-amber-500 transition-colors" />
            </button>
          )}
        </div>
      );
    },
    [
      rows,
      timeTravelState.previewRows,
      columns,
      isOrgSheet,
      liveTracking,
      comments,
      formatting.getCellStyle,
      formatting.getCurrentCellFormat,
      textWrap.textWrapColumns,
      protection.getCellKey,
      protection.isCellProtected,
      formulas.formulas,
      formulas.columnFormulas,
      formulas.evaluateFormula,
      formulas.getFormula,
      getCellComments,
      activeCursors,
    ],
  );

  const handleRowsChange = useCallback(
    (updatedRows: SheetRow[]) => {
      const prev = rows;
      rowsHistory.pushState(updatedRows);
      handleSaveChangedRow(updatedRows, prev);
      let hadChange = false;
      updatedRows.forEach((row, rowIdx) => {
        const prevRow = prev[rowIdx];
        if (!prevRow) return;
        columns.forEach((col) => {
          const o = prevRow[col.key];
          const n = row[col.key];
          if (o !== n) {
            hadChange = true;
            const cl = String.fromCharCode(
              65 + columns.findIndex((c) => c.key === col.key),
            );
            logCellEdit(
              sheetId,
              `${cl}${rowIdx + 1}`,
              col.name,
              o ?? null,
              n ?? null,
            );
          }
        });
      });
      if (hadChange) {
        logCellEditActivity(title);
        maybeAutoSnapshot(sheetId, updatedRows, columns, currentUser?.id).catch(
          () => {},
        );
      }
    },
    [
      rows,
      columns,
      rowsHistory.pushState,
      handleSaveChangedRow,
      sheetId,
      isOrgSheet,
      logCellEditActivity,
      title,
    ],
  );

  // ── Grid columns ───────────────────────────────────────────────────────────
  const gridColumns = useMemo<Column<SheetRow>[]>(() => {
    const activeRows = timeTravelState.previewRows || rows;

    const rowNumberCol: Column<SheetRow> = {
      key: "row-number",
      name: "",
      width: 46,
      frozen: true,
      resizable: false,
      renderHeaderCell: () => (
        <div className="h-full w-full flex items-center justify-center sheet-header-cell border-r">
          <input
            type="checkbox"
            className="h-3.5 w-3.5 rounded border-gray-300 cursor-pointer"
            style={{ accentColor: "var(--primary)" }}
            checked={
              selectedRows.size === activeRows.length && activeRows.length > 0
            }
            onChange={(e) =>
              setSelectedRows(
                e.target.checked
                  ? new Set(activeRows.map((r) => r.id))
                  : new Set(),
              )
            }
          />
        </div>
      ),
      renderCell(props: RenderCellProps<SheetRow>) {
        const rowIdx = activeRows.findIndex((r) => r.id === props.row.id);
        const isSel = selectedRows.has(props.row.id);
        return (
          <div
            className={`h-full w-full flex items-center justify-center sheet-row-num border-r group/rownum ${isSel ? "sheet-row-num--selected" : ""} relative`}
          >
            <span
              className={`${isSel ? "hidden" : "group-hover/rownum:hidden"} sheet-row-num-text`}
            >
              {rowIdx + 1}
            </span>
            <input
              type="checkbox"
              className={`h-3.5 w-3.5 rounded border-gray-300 cursor-pointer ${isSel ? "" : "hidden group-hover/rownum:block"}`}
              style={{ accentColor: "var(--primary)" }}
              checked={isSel}
              onChange={(e) => {
                const s = new Set(selectedRows);
                e.target.checked ? s.add(props.row.id) : s.delete(props.row.id);
                setSelectedRows(s);
              }}
            />
            {/* Row resize grabber */}
            <div
              className="absolute left-0 right-0 bottom-0 h-1.5 opacity-0 group-hover/rownum:opacity-100"
              style={{ cursor: "row-resize", touchAction: "none" }}
              onPointerDown={(e) => beginRowResize(props.row.id, e)}
              onPointerMove={onRowResizeMove}
              onPointerUp={endRowResize}
              onPointerCancel={endRowResize}
            />
          </div>
        );
      },
    };

    const dataCols = columns
      .filter((col) => !col.hidden)
      .map(
        (col): Column<SheetRow> => ({
          key: col.key,
          name: col.name,
          width: col.width || 160,
          resizable: true,
          renderHeaderCell: () => (
            <div
              className="h-full w-full flex items-center gap-1.5 px-2.5 group/header sheet-header-cell border-r cursor-pointer"
              draggable
              onDragStart={() => colOps.handleColumnDragStart(col.key)}
              onDragOver={(e) =>
                colOps.handleColumnDragOver(
                  e,
                  col.key,
                  (u: React.SetStateAction<ColumnDef[]>) =>
                    setSheetState((p) => ({
                      ...p,
                      columns: typeof u === "function" ? u(p.columns) : u,
                    })),
                )
              }
              onDragEnd={handleColumnDragEnd}
            >
              <GripVertical className="h-3 w-3 text-gray-300 flex-shrink-0 cursor-move opacity-0 group-hover/header:opacity-100 transition-opacity" />
              <span className="flex-1 sheet-col-label truncate">
                {col.name}
              </span>
              {[...textWrap.textWrapColumns].some((k) =>
                k.endsWith(`-${col.key}`),
              ) && (
                <WrapText className="h-3 w-3 text-primary flex-shrink-0 opacity-60" />
              )}
              <ColumnHeaderMenu
                column={col}
                onChangeType={(t) => handleChangeColumnType(col.key, t)}
                onDelete={() => handleDeleteColumn(col.key)}
                onRename={(newName) => {
                  colOps.renameColumn(col.key, newName);
                  setTimeout(async () => {
                    markSaving();
                    await saveAllColumns(sheetId, columnsHistory.currentState);
                    if (isOrgSheet) logColumnRename(sheetId, col.name, newName);
                    markSaved();
                  }, 50);
                }}
                onToggleTextWrap={handleTextWrapToggle}
                textWrapEnabled={textWrap.textWrapColumns.has(col.key)}
                columnFormula={formulas.columnFormulas[col.key]}
                onApplyColumnFormula={(f) =>
                  handleApplyFormulaToColumn(col.key, f)
                }
                onRemoveColumnFormula={() => handleRemoveColumnFormula(col.key)}
                selectOptions={col.selectOptions}
                onUpdateSelectOptions={(opts) =>
                  handleUpdateSelectOptions(col.key, opts)
                }
                onSetWidth={(w) => {
                  const updated = columns.map((c) =>
                    c.key === col.key ? { ...c, width: w } : c,
                  );
                  setSheetState((p) => ({ ...p, columns: updated }));
                  columnsHistory.pushState(updated);
                  setTimeout(async () => {
                    markSaving();
                    await saveAllColumns(sheetId, columnsHistory.currentState);
                    markSaved();
                  }, 50);
                }}
                onInsertLeft={() => {
                  const idx = columns.findIndex((c) => c.key === col.key);
                  insertColumnAt(idx, null, "blank");
                  setTimeout(async () => {
                    markSaving();
                    await Promise.all([
                      saveAllColumns(sheetId, columnsHistory.currentState),
                      saveAllRows(sheetId, rowsHistory.currentState),
                    ]);
                    markSaved();
                  }, 50);
                }}
                onInsertRight={() => {
                  const idx = columns.findIndex((c) => c.key === col.key);
                  insertColumnAt(idx + 1, null, "blank");
                  setTimeout(async () => {
                    markSaving();
                    await Promise.all([
                      saveAllColumns(sheetId, columnsHistory.currentState),
                      saveAllRows(sheetId, rowsHistory.currentState),
                    ]);
                    markSaved();
                  }, 50);
                }}
                onDuplicate={() => {
                  const idx = columns.findIndex((c) => c.key === col.key);
                  insertColumnAt(idx + 1, col, "duplicate");
                  setTimeout(async () => {
                    markSaving();
                    await Promise.all([
                      saveAllColumns(sheetId, columnsHistory.currentState),
                      saveAllRows(sheetId, rowsHistory.currentState),
                    ]);
                    markSaved();
                  }, 50);
                }}
                onClearColumn={() => clearColumnValues(col)}
                onSortAsc={() => handleSortByColumn(col.key, "asc")}
                onSortDesc={() => handleSortByColumn(col.key, "desc")}
                onSetCurrency={(currencyCode) => {
                  const updated = columns.map((c) =>
                    c.key === col.key ? { ...c, currencyCode } : c,
                  );
                  setSheetState((p) => ({ ...p, columns: updated }));
                  columnsHistory.pushState(updated);
                  setTimeout(async () => {
                    markSaving();
                    await saveAllColumns(sheetId, columnsHistory.currentState);
                    markSaved();
                  }, 50);
                }}
              />
            </div>
          ),
          renderCell(props: RenderCellProps<SheetRow>) {
            const rowIdx = rows.findIndex((r) => r.id === props.row.id);
            return renderCellByType(
              cellTypes.getCellType(rowIdx, col.key, col.type || "text"),
              props,
              col.key,
            );
          },
          renderEditCell(props: RenderEditCellProps<SheetRow>) {
            const { row, column, onRowChange } = props;
            const rowIdx = rows.findIndex((r) => r.id === row.id);
            const cellType = cellTypes.getCellType(
              rowIdx,
              col.key,
              col.type || "text",
            );
            const cellStyle = formatting.getCellStyle(
              rowIdx,
              column.key,
              textWrap.textWrapColumns,
            );
            const cellKey = protection.getCellKey(rowIdx, col.key);
            const isTextWrap = textWrap.textWrapColumns.has(col.key);
            const isProtected = protection.isCellProtected(rowIdx, col.key);
            const editVal =
              formulas.formulas[cellKey] ??
              formulas.columnFormulas[col.key] ??
              String(row[column.key] ?? "");

            const onTextChange = (v: string) => {
              const allowed =
                (cellSelectOptions[cellKey] &&
                cellSelectOptions[cellKey].length > 0
                  ? cellSelectOptions[cellKey]
                  : col.validation_rules?.type === "dropdown"
                    ? (col.validation_rules?.options as string[] | undefined)
                    : undefined) ?? [];
              if (
                allowed.length > 0 &&
                v.trim() !== "" &&
                !allowed.includes(v.trim())
              ) {
                return;
              }
              if (v.startsWith("="))
                formulas.setFormulas((p) => ({ ...p, [cellKey]: v }));
              else {
                formulas.setFormulas((p) => {
                  const n = { ...p };
                  delete n[cellKey];
                  return n;
                });
                onRowChange({ ...row, [column.key]: v });
              }
            };
            const onNumChange = (v: string) => {
              if (v.startsWith("="))
                formulas.setFormulas((p) => ({ ...p, [cellKey]: v }));
              else {
                formulas.setFormulas((p) => {
                  const n = { ...p };
                  delete n[cellKey];
                  return n;
                });
                const num = v === "" ? 0 : Number(v);
                if (!isNaN(num)) onRowChange({ ...row, [column.key]: num });
              }
            };
            const onBlurSave = async () => {
              const f = formulas.formulas[cellKey];
              if (f) await saveFormula(sheetId, cellKey, f);
              else await deleteFormula(sheetId, cellKey).catch(() => {});
            };

            if (isProtected) {
              toast.error("This cell is protected");
              return (
                <div className="h-full w-full flex items-center px-2.5 text-xs bg-gray-50 text-gray-400 gap-1.5">
                  <Lock className="h-3 w-3" /> Protected
                </div>
              );
            }
            if (cellType === "priority" || cellType === "status") {
              const opts =
                cellType === "priority"
                  ? ["Low", "Medium", "High", "Critical"]
                  : [
                      "Not Started",
                      "In Progress",
                      "In Review",
                      "Done",
                      "Blocked",
                    ];
              return (
                <Select
                  value={String(row[column.key] ?? "")}
                  onValueChange={(v) =>
                    onRowChange({ ...row, [column.key]: v })
                  }
                >
                  <SelectTrigger className="h-full border-0 text-xs rounded-none focus:ring-0 focus:ring-offset-0">
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
            if (
              cellType === "date" ||
              col.key === "start" ||
              col.key === "due" ||
              col.key === "date"
            )
              return (
                <input
                  className="w-full h-full px-2.5 text-xs outline-none border-0"
                  style={{
                    ...cellStyle,
                    background: isDark ? "#131620" : "#ffffff",
                    color: isDark ? "#e2e8f0" : "#1a1d23",
                  }}
                  type={formulas.formulas[cellKey] ? "text" : "date"}
                  autoFocus
                  value={editVal}
                  onChange={(e) => onTextChange(e.target.value)}
                  onBlur={onBlurSave}
                />
              );
            if (cellType === "checkbox")
              return (
                <div
                  className="h-full flex items-center justify-center cursor-pointer"
                  onClick={() =>
                    onRowChange({ ...row, [column.key]: !row[column.key] })
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
            if (cellType === "progress")
              return (
                <input
                  className="w-full h-full px-2.5 text-xs outline-none border-0 text-right tabular-nums font-mono"
                  style={{
                    ...cellStyle,
                    background: isDark ? "#131620" : "#ffffff",
                    color: isDark ? "#e2e8f0" : "#1a1d23",
                  }}
                  type="text"
                  autoFocus
                  placeholder="0–100 or =formula"
                  value={editVal}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v.startsWith("=")) onNumChange(v);
                    else {
                      const n =
                        v === "" ? 0 : Math.min(100, Math.max(0, Number(v)));
                      if (!isNaN(n)) onRowChange({ ...row, [column.key]: n });
                    }
                  }}
                  onBlur={onBlurSave}
                />
              );
            if (cellType === "number" || cellType === "currency")
              return (
                <input
                  className="w-full h-full px-2.5 text-xs outline-none border-0 text-right tabular-nums font-mono"
                  style={{
                    ...cellStyle,
                    background: isDark ? "#131620" : "#ffffff",
                    color: isDark ? "#e2e8f0" : "#1a1d23",
                  }}
                  type="text"
                  autoFocus
                  value={editVal}
                  onChange={(e) => onNumChange(e.target.value)}
                  onBlur={onBlurSave}
                />
              );
            if (cellType === "image")
              return (
                <input
                  className="w-full h-full px-2.5 text-xs outline-none border-0"
                  style={{
                    ...cellStyle,
                    background: isDark ? "#131620" : "#ffffff",
                    color: isDark ? "#e2e8f0" : "#1a1d23",
                  }}
                  type="url"
                  autoFocus
                  value={editVal}
                  placeholder="https://example.com/image.png"
                  onChange={(e) => onTextChange(e.target.value)}
                  onBlur={onBlurSave}
                />
              );
            if (cellType === "select") {
              const selectOpts =
                cellSelectOptions[cellKey]?.length > 0
                  ? cellSelectOptions[cellKey]
                  : (col.selectOptions ??
                    (col.validation_rules?.type === "dropdown"
                      ? ((col.validation_rules?.options as string[]) ?? [])
                      : []));
              return (
                <Select
                  value={String(row[column.key] ?? "")}
                  onValueChange={(v) =>
                    onRowChange({ ...row, [column.key]: v })
                  }
                >
                  <SelectTrigger className="h-full border-0 text-xs rounded-none focus:ring-0 focus:ring-offset-0">
                    <SelectValue placeholder="Select…" />
                  </SelectTrigger>
                  <SelectContent style={selStyle}>
                    {selectOpts.map((opt) => {
                      const optionStyle = getOptionBgStyle(opt);
                      return (
                        <SelectItem
                          key={opt}
                          value={opt}
                          style={ddItemStyle(isDark)}
                        >
                          <span
                            className="sheet-badge-pill"
                            style={optionStyle}
                          >
                            {opt}
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
              );
            }
            if (isTextWrap)
              return (
                <textarea
                  className="w-full h-full px-2.5 py-2 text-xs outline-none border-0 resize-none"
                  style={{
                    ...cellStyle,
                    background: isDark ? "#131620" : "#ffffff",
                    color: isDark ? "#e2e8f0" : "#1a1d23",
                  }}
                  autoFocus
                  value={editVal}
                  onChange={(e) => onTextChange(e.target.value)}
                  onBlur={onBlurSave}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) e.stopPropagation();
                  }}
                />
              );
            return (
              <input
                className="w-full h-full px-2.5 text-xs outline-none border-0"
                style={{
                  ...cellStyle,
                  background: isDark ? "#131620" : "#ffffff",
                  color: isDark ? "#e2e8f0" : "#1a1d23",
                }}
                autoFocus
                value={editVal}
                onChange={(e) => onTextChange(e.target.value)}
                onBlur={onBlurSave}
              />
            );
          },
        }),
      );

    return [rowNumberCol, ...dataCols];
  }, [
    columns,
    rows,
    selectedRows,
    textWrap.textWrapColumns,
    cellTypes.getCellType,
    formatting.getCellStyle,
    formulas.formulas,
    formulas.columnFormulas,
    formulas.setFormulas,
    formulas.getFormula,
    cellSelectOptions,
    protection.getCellKey,
    protection.isCellProtected,
    renderCellByType,
    handleColumnDragEnd,
    handleChangeColumnType,
    handleDeleteColumn,
    handleTextWrapToggle,
    sheetId,
    columnsHistory.currentState,
    colOps.handleColumnDragStart,
    colOps.handleColumnDragOver,
    colOps.renameColumn,
    markSaving,
    markSaved,
    handleApplyFormulaToColumn,
    handleRemoveColumnFormula,
    isOrgSheet,
    handleInsertColumn,
    charts,
    getSuggestedChartPreset,
  ]);

  const filteredRows = useMemo<SheetRow[]>(() => {
    const activeRows = timeTravelState.previewRows || rows;
    const activeCols = timeTravelState.previewColumns || columns;
    const q = (searchQuery || filterValue).trim().toLowerCase();
    const activeRules = advancedFilters.filter((rule) => rule.columnKey);
    if (!q && activeRules.length === 0) return activeRows;
    return activeRows.filter((row) => {
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
        const lowerText = text.toLowerCase();
        const lowerTarget = target.toLowerCase();

        if (rule.operator === "empty") return text === "";
        if (rule.operator === "not_empty") return text !== "";
        if (rule.operator === "contains")
          return lowerText.includes(lowerTarget);
        if (rule.operator === "equals") return lowerText === lowerTarget;
        if (rule.operator === "not_equals") return lowerText !== lowerTarget;

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
  }, [
    rows,
    columns,
    timeTravelState.previewRows,
    timeTravelState.previewColumns,
    searchQuery,
    filterValue,
    advancedFilters,
  ]);

  const filterColumns = useMemo(
    () => columns.filter((col) => !col.hidden),
    [columns],
  );

  const createFilterRule = useCallback((): AdvancedFilterRule => {
    const firstCol = filterColumns[0];
    return {
      id: `filter_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      columnKey: firstCol?.key ?? "",
      operator:
        firstCol?.type === "number" ||
        firstCol?.type === "currency" ||
        firstCol?.type === "progress"
          ? "gt"
          : "contains",
      value: "",
    };
  }, [filterColumns]);

  const getFilterOperators = useCallback(
    (columnKey: string): { value: FilterOperator; label: string }[] => {
      const col = columns.find((c) => c.key === columnKey);
      const numeric =
        col?.type === "number" ||
        col?.type === "currency" ||
        col?.type === "progress" ||
        col?.type === "date";
      return numeric
        ? [
            { value: "gt", label: ">" },
            { value: "gte", label: ">=" },
            { value: "lt", label: "<" },
            { value: "lte", label: "<=" },
            { value: "equals", label: "is" },
            { value: "not_equals", label: "is not" },
            { value: "empty", label: "empty" },
            { value: "not_empty", label: "not empty" },
          ]
        : [
            { value: "contains", label: "contains" },
            { value: "equals", label: "is" },
            { value: "not_equals", label: "is not" },
            { value: "empty", label: "empty" },
            { value: "not_empty", label: "not empty" },
          ];
    },
    [columns],
  );

  const filterSuggestions = useMemo(() => {
    const map: Record<string, string[]> = {};
    const dataRows = timeTravelState.previewRows || rows;
    filterColumns.forEach((col) => {
      const values = Array.from(
        new Set(
          dataRows
            .map((row) => row[col.key])
            .filter(
              (value) => value !== null && value !== undefined && value !== "",
            )
            .map((value) => String(value)),
        ),
      ).slice(0, 24);
      map[col.key] = values;
    });
    return map;
  }, [filterColumns, rows, timeTravelState.previewRows]);

  const selectedCellType = useMemo(() => {
    if (!selectedCell) return null;
    const col = columns.find((c) => c.key === selectedCell.col);
    return col
      ? cellTypes.getCellType(
          selectedCell.row,
          selectedCell.col,
          col.type || "text",
        )
      : null;
  }, [selectedCell, columns, cellTypes.getCellType]);

  // keep a selected row for row-height tools (e.g., resize handle)
  const selectedRowId = useMemo(() => {
    if (selectedRows.size === 0) return null;
    return Array.from(selectedRows)[0] ?? null;
  }, [selectedRows]);

  const isSelectedColumnWrapped = useMemo(
    () =>
      selectedCell
        ? textWrap.textWrapColumns.has(
            `${selectedCell.row}-${selectedCell.col}`,
          )
        : false,
    [selectedCell, textWrap.textWrapColumns],
  );
  const totalComments = useMemo(() => {
    if (!isOrgSheet) return 0;
    return Object.values(comments).reduce(
      (a, b) => a + b.filter((c) => !c.resolved).length,
      0,
    );
  }, [comments, isOrgSheet]);
  const activeCollaborators = useMemo(() => orgMembers, [orgMembers]);

  const selStyle = ddStyle(isDark);

  return (
    <TooltipProvider delayDuration={250}>
      <div
        className={`sheet-root h-screen flex flex-col select-none overflow-hidden ${isDark ? "sheet-dark" : "sheet-light"}`}
      >
        {/* ═══ TITLE BAR ═══════════════════════════════════════════════════ */}
        <header
          className="sheet-titlebar flex items-center justify-between px-2 shrink-0 border-b"
          style={{ minHeight: "44px" }}
        >
          <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => router.back()}
                  className="sheet-back-btn h-7 w-7 rounded-md flex items-center justify-center transition-all shrink-0"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-[11px]">
                Back to dashboard
              </TooltipContent>
            </Tooltip>
            <ChevronRight className="h-3 w-3 text-gray-300 shrink-0 hidden sm:block" />
            <div className="sheet-app-icon h-6 w-6 rounded-md flex items-center justify-center shrink-0">
              <FileSpreadsheet className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <div className="flex items-center gap-1 min-w-0 overflow-hidden">
              <Input
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="sheet-title-input h-7 border-0 bg-transparent font-semibold not-italic text-[13px] tracking-tight focus-visible:ring-1 px-1.5 rounded-md w-24 sm:w-44 md:w-56 min-w-0"
              />
              <button
                onClick={handleStarredToggle}
                className="shrink-0 p-0.5 rounded transition-transform hover:scale-110"
              >
                <Star
                  className={`h-3.5 w-3.5 transition-colors ${starred ? "fill-amber-400 text-amber-400" : "text-gray-300 hover:text-amber-400"}`}
                />
              </button>
              <div className="sheet-save-status hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-medium shrink-0">
                {saveStatus === "saving" ? (
                  <>
                    <Loader2 className="h-2.5 w-2.5 animate-spin text-amber-500" />
                    <span className="text-amber-600">Saving…</span>
                  </>
                ) : (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span className="text-emerald-600">Saved</span>
                  </>
                )}
              </div>
              <span
                className="sm:hidden h-1.5 w-1.5 rounded-full shrink-0"
                style={{
                  background: saveStatus === "saving" ? "#f59e0b" : "#10b981",
                }}
              />
              {isOrgSheet && (
                <div className="sheet-org-badge hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold shrink-0">
                  <Globe className="h-2.5 w-2.5" />
                  ORG
                </div>
              )}
              {forks.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 text-[10px] font-semibold shrink-0 cursor-pointer transition-colors select-none">
                      <GitBranch className="h-2.5 w-2.5" />
                      {forks.length} Fork{forks.length !== 1 ? "s" : ""}
                      <ChevronDown className="h-2.5 w-2.5 opacity-50" />
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="w-56"
                    style={ddStyle(isDark)}
                  >
                    <DropdownMenuLabel
                      className="text-[10px] uppercase tracking-wider"
                      style={{ color: isDark ? "#4a5568" : "#9ca3af" }}
                    >
                      Forked sheets
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator
                      style={{ background: isDark ? "#1e2330" : "#e8eaed" }}
                    />
                    {forks.map((f) => (
                      <DropdownMenuItem
                        key={f.id}
                        onClick={() => router.push(`/sheet/${f.id}`)}
                        className="text-xs flex flex-col items-start gap-0.5"
                        style={ddItemStyle(isDark)}
                      >
                        <div className="flex items-center gap-1.5 w-full">
                          <FileSpreadsheet className="h-3 w-3 opacity-50 shrink-0" />
                          <span className="truncate font-medium">
                            {f.title}
                          </span>
                        </div>
                        {f.forked_at && (
                          <span
                            className="text-[10px] pl-4"
                            style={{ color: isDark ? "#4a5568" : "#9ca3af" }}
                          >
                            {new Date(f.forked_at).toLocaleString([], {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          <div className="flex items-center gap-0.5 sm:gap-1 shrink-0 ml-1 min-w-0 overflow-visible [&_[data-slot=dropdown-menu-trigger]]:shrink-0 hide-scrollbar">
            {isOrgSheet && liveTracking && (
              <div className="sheet-live-pill hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold shrink-0">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {activeCollaborators.length} member
                {activeCollaborators.length !== 1 ? "s" : ""}
              </div>
            )}
            {isOrgSheet ? (
              <>
                <div className="hidden sm:flex -space-x-2 shrink-0">
                  {orgMembers.slice(0, 3).map((c) => (
                    <Tooltip key={c.id}>
                      <TooltipTrigger>
                        <Avatar member={c} showOnline />
                      </TooltipTrigger>
                      <TooltipContent
                        side="bottom"
                        className="text-xs sheet-tooltip"
                      >
                        <p className="font-semibold">{c.name}</p>
                        <p className="text-gray-400 text-[10px]">
                          {c.role} · {c.email}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                  {orgMembers.length > 3 && (
                    <div
                      className="sheet-avatar h-6 w-6 rounded-full flex items-center justify-center text-[9px] font-bold cursor-pointer border-2 bg-gray-200 text-gray-600 shrink-0"
                      style={{ borderColor: "var(--sheet-titlebar-bg)" }}
                    >
                      +{orgMembers.length - 3}
                    </div>
                  )}
                </div>
                <div className="sheet-vdiv h-5 w-px mx-0.5 hidden sm:block shrink-0" />
                <IconBtn
                  icon={Bell}
                  tooltip="Notifications"
                  badge={totalComments}
                />
              </>
            ) : currentUser ? (
              <Tooltip>
                <TooltipTrigger>
                  <Avatar member={currentUser} />
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs sheet-tooltip">
                  <p className="font-semibold">{currentUser.name}</p>
                  <p className="text-gray-400 text-[10px]">Personal sheet</p>
                </TooltipContent>
              </Tooltip>
            ) : null}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="sheet-btn-secondary flex items-center gap-1 sm:gap-1.5 h-7 px-2 sm:px-2.5 rounded-md text-[11.5px] font-medium transition-all shrink-0">
                  <Download className="h-3.5 w-3.5 shrink-0" />
                  <span className="hidden sm:inline">Export</span>
                  <ChevronDown className="h-3 w-3 opacity-50 hidden sm:block" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-44"
                style={ddStyle(isDark)}
              >
                <DropdownMenuLabel
                  className="text-[10px] uppercase tracking-wider"
                  style={{ color: isDark ? "#4a5568" : "#9ca3af" }}
                >
                  Export as
                </DropdownMenuLabel>
                <DropdownMenuSeparator
                  style={{ background: isDark ? "#1e2330" : "#e8eaed" }}
                />
                {(
                  [
                    ["csv", "CSV (.csv)", FileSpreadsheet],
                    ["xlsx", "Excel (.xlsx)", Layers],
                    ["pdf", "PDF (.pdf)", Printer],
                    ["json", "JSON (.json)", Code2],
                  ] as const
                ).map(([fmt, label, Icon]) => (
                  <DropdownMenuItem
                    key={fmt}
                    onClick={() => handleExport(fmt)}
                    className="text-xs"
                    style={ddItemStyle(isDark)}
                  >
                    <Icon className="h-3 w-3" />
                    {label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {isOrgSheet && (
              <button
                className="sheet-btn-primary flex items-center gap-1 sm:gap-1.5 h-7 px-2 sm:px-3 rounded-md text-[11.5px] font-semibold transition-all shrink-0"
                onClick={() => setShowShareDialog(true)}
              >
                <Share2 className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline">Share</span>
              </button>
            )}
          </div>
        </header>

        {/* ═══ FORMATTING TOOLBAR ══════════════════════════════════════════ */}
        <div
          className="sheet-toolbar sheet-formatting-bar border-b shrink-0"
          style={{ height: "40px" }}
        >
          <div className="h-full flex items-center px-2 gap-0.5 overflow-x-auto hide-scrollbar min-w-0">
            <IconBtn
              icon={Undo2}
              tooltip="Undo"
              shortcut="Ctrl+Z"
              onClick={() => rowsHistory.undo()}
              disabled={!rowsHistory.canUndo}
            />
            <IconBtn
              icon={Redo2}
              tooltip="Redo"
              shortcut="Ctrl+Y"
              onClick={() => rowsHistory.redo()}
              disabled={!rowsHistory.canRedo}
            />
            <ToolSep />
            <Select
              value={String(zoomLevel)}
              onValueChange={(v) => handleZoomChange(Number(v))}
            >
              <SelectTrigger
                className="sheet-select h-7 w-[68px] text-[11px] not-italic rounded-md px-2 border shrink-0"
                style={selStyle}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent style={selStyle}>
                {[50, 75, 90, 100, 110, 125, 150, 200].map((z) => (
                  <SelectItem
                    key={z}
                    value={String(z)}
                    className="text-xs"
                    style={ddItemStyle(isDark)}
                  >
                    {z}%
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <ToolSep />
            <IconBtn
              icon={Copy}
              tooltip="Copy"
              shortcut="Ctrl+C"
              onClick={() => clipboard.copyCellOrRange(selectedCell)}
            />
            <IconBtn
              icon={Scissors}
              tooltip="Cut"
              shortcut="Ctrl+X"
              onClick={() => clipboard.cutCellOrRange(selectedCell)}
            />
            <IconBtn
              icon={Clipboard}
              tooltip="Paste"
              shortcut="Ctrl+V"
              onClick={handlePaste}
            />
            <ToolSep />
            <Select value={fontFamily} onValueChange={handleFontFamilyChange}>
              <SelectTrigger
                className="sheet-select h-7 w-[100px] text-[11px] not-italic rounded-md px-2 border shrink-0"
                style={selStyle}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent style={selStyle}>
                {[
                  "Arial",
                  "Calibri",
                  "Inter",
                  "DM Sans",
                  "Geist Sans",
                  "Roboto",
                  "Verdana",
                  "Helvetica",
                  "Times New Roman",
                  "Georgia",
                  "Courier New",
                  "Trebuchet MS",
                  "Monaco",
                ].map((f) => (
                  <SelectItem
                    key={f}
                    value={f}
                    className="text-xs"
                    style={{ ...ddItemStyle(isDark), fontFamily: f }}
                  >
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={fontSize} onValueChange={handleFontSizeChange}>
              <SelectTrigger
                className="sheet-select h-7 w-[54px] text-[11px] not-italic tabular-nums rounded-md px-2 border ml-1 shrink-0"
                style={selStyle}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent style={selStyle}>
                {["8", "9", "10", "11", "12", "14", "16", "18", "24", "36"].map(
                  (s) => (
                    <SelectItem
                      key={s}
                      value={s}
                      className="text-xs"
                      style={ddItemStyle(isDark)}
                    >
                      {s}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
            <ToolSep />
            {selectedCell && selectedCellType && (
              <>
                <CellTypeSelector
                  currentType={selectedCellType}
                  onChangeType={handleSelectedCellTypeChange}
                />
                <ToolSep />
              </>
            )}
            <FormattingToolbar
              currentFormat={formatting.getCurrentCellFormat(selectedCell)}
              onFormatChange={handleFormatChange}
              disabled={!selectedCell}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="sheet-icon-btn h-7 px-2 rounded flex items-center gap-1.5 shrink-0"
                  disabled={!selectedCell}
                  title="Advanced formatting"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  <span className="text-[11px]">Advanced</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                collisionPadding={10}
                className="w-56 max-h-[min(60vh,300px)] overflow-y-auto hide-scrollbar"
                style={ddStyle(isDark)}
              >
                <DropdownMenuLabel
                  className="text-[10px] uppercase tracking-wider"
                  style={{ color: isDark ? "#4a5568" : "#9ca3af" }}
                >
                  Text style
                </DropdownMenuLabel>
                <DropdownMenuItem
                  className="text-xs"
                  onClick={() =>
                    handleFormatChange({
                      bold: !formatting.getCurrentCellFormat(selectedCell).bold,
                    })
                  }
                  style={ddItemStyle(isDark)}
                >
                  Bold
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-xs"
                  onClick={() =>
                    handleFormatChange({
                      italic:
                        !formatting.getCurrentCellFormat(selectedCell).italic,
                    })
                  }
                  style={ddItemStyle(isDark)}
                >
                  Italic
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-xs"
                  onClick={() =>
                    handleFormatChange({
                      underline:
                        !formatting.getCurrentCellFormat(selectedCell)
                          .underline,
                    })
                  }
                  style={ddItemStyle(isDark)}
                >
                  Underline
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-xs"
                  onClick={() =>
                    handleFormatChange({
                      strikethrough:
                        !formatting.getCurrentCellFormat(selectedCell)
                          .strikethrough,
                    })
                  }
                  style={ddItemStyle(isDark)}
                >
                  Strikethrough
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel
                  className="text-[10px] uppercase tracking-wider"
                  style={{ color: isDark ? "#4a5568" : "#9ca3af" }}
                >
                  Alignment
                </DropdownMenuLabel>
                <DropdownMenuItem
                  className="text-xs"
                  onClick={() => handleFormatChange({ align: "left" })}
                  style={ddItemStyle(isDark)}
                >
                  Align Left
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-xs"
                  onClick={() => handleFormatChange({ align: "center" })}
                  style={ddItemStyle(isDark)}
                >
                  Align Center
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-xs"
                  onClick={() => handleFormatChange({ align: "right" })}
                  style={ddItemStyle(isDark)}
                >
                  Align Right
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel
                  className="text-[10px] uppercase tracking-wider"
                  style={{ color: isDark ? "#4a5568" : "#9ca3af" }}
                >
                  Font size
                </DropdownMenuLabel>
                <DropdownMenuItem
                  className="text-xs"
                  onClick={() =>
                    handleFormatChange({
                      fontSize: Math.max(
                        8,
                        (formatting.getCurrentCellFormat(selectedCell)
                          .fontSize ?? 12) - 1,
                      ),
                    })
                  }
                  style={ddItemStyle(isDark)}
                >
                  Decrease size
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-xs"
                  onClick={() =>
                    handleFormatChange({
                      fontSize: Math.min(
                        72,
                        (formatting.getCurrentCellFormat(selectedCell)
                          .fontSize ?? 12) + 1,
                      ),
                    })
                  }
                  style={ddItemStyle(isDark)}
                >
                  Increase size
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel
                  className="text-[10px] uppercase tracking-wider"
                  style={{ color: isDark ? "#4a5568" : "#9ca3af" }}
                >
                  Text color
                </DropdownMenuLabel>
                <DropdownMenuItem
                  className="text-xs"
                  onClick={() => handleFormatChange({ textColor: "#000000" })}
                  style={ddItemStyle(isDark)}
                >
                  Black
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-xs"
                  onClick={() => handleFormatChange({ textColor: "#dc2626" })}
                  style={ddItemStyle(isDark)}
                >
                  Red
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-xs"
                  onClick={() => handleFormatChange({ textColor: "#2563eb" })}
                  style={ddItemStyle(isDark)}
                >
                  Blue
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-xs"
                  onClick={() => handleFormatChange({ textColor: "#16a34a" })}
                  style={ddItemStyle(isDark)}
                >
                  Green
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel
                  className="text-[10px] uppercase tracking-wider"
                  style={{ color: isDark ? "#4a5568" : "#9ca3af" }}
                >
                  Fill color
                </DropdownMenuLabel>
                <DropdownMenuItem
                  className="text-xs"
                  onClick={() => handleFormatChange({ bgColor: "#ffffff" })}
                  style={ddItemStyle(isDark)}
                >
                  White
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-xs"
                  onClick={() => handleFormatChange({ bgColor: "#fef3c7" })}
                  style={ddItemStyle(isDark)}
                >
                  Yellow
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-xs"
                  onClick={() => handleFormatChange({ bgColor: "#e5e7eb" })}
                  style={ddItemStyle(isDark)}
                >
                  Gray
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-xs"
                  onClick={() => handleFormatChange({ bgColor: "#dcfce7" })}
                  style={ddItemStyle(isDark)}
                >
                  Green
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel
                  className="text-[10px] uppercase tracking-wider"
                  style={{ color: isDark ? "#4a5568" : "#9ca3af" }}
                >
                  Borders
                </DropdownMenuLabel>
                <DropdownMenuItem
                  className="text-xs"
                  onClick={() =>
                    handleFormatChange({
                      borderStyle: "solid",
                      borderWidth: 1,
                      borderColor: "#111827",
                    })
                  }
                  style={ddItemStyle(isDark)}
                >
                  Solid border
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-xs"
                  onClick={() =>
                    handleFormatChange({
                      borderStyle: "dashed",
                      borderWidth: 1,
                      borderColor: "#111827",
                    })
                  }
                  style={ddItemStyle(isDark)}
                >
                  Dashed border
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-xs"
                  onClick={() =>
                    handleFormatChange({
                      borderStyle: "dotted",
                      borderWidth: 1,
                      borderColor: "#111827",
                    })
                  }
                  style={ddItemStyle(isDark)}
                >
                  Dotted border
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-xs"
                  onClick={() => handleFormatChange({ borderStyle: "none" })}
                  style={ddItemStyle(isDark)}
                >
                  Remove border
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel
                  className="text-[10px] uppercase tracking-wider"
                  style={{ color: isDark ? "#4a5568" : "#9ca3af" }}
                >
                  Sheet actions
                </DropdownMenuLabel>
                <DropdownMenuItem
                  className="text-xs"
                  onClick={handleTextWrapToggle}
                  style={ddItemStyle(isDark)}
                >
                  Toggle text wrap
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-xs"
                  onClick={() => handleSort("asc")}
                  style={ddItemStyle(isDark)}
                >
                  Sort A → Z
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-xs"
                  onClick={() => handleSort("desc")}
                  style={ddItemStyle(isDark)}
                >
                  Sort Z → A
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-xs"
                  onClick={handleHideColumn}
                  style={ddItemStyle(isDark)}
                >
                  Hide selected column
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <ToolSep />
            <IconBtn
              icon={WrapText}
              tooltip="Text Wrap"
              onClick={handleTextWrapToggle}
              disabled={!selectedCell}
              active={isSelectedColumnWrapped}
            />
            <IconBtn
              icon={
                selectedCell &&
                protection.isCellProtected(selectedCell.row, selectedCell.col)
                  ? Lock
                  : Unlock
              }
              tooltip="Protect Cell"
              onClick={handleProtectionToggle}
              disabled={!selectedCell}
              active={
                !!(
                  selectedCell &&
                  protection.isCellProtected(selectedCell.row, selectedCell.col)
                )
              }
            />
            <ToolSep />
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => openFormulaPanel()}
                  className="sheet-formula-btn flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-medium transition-all shrink-0"
                >
                  <Sigma className="h-3.5 w-3.5" />
                  <span>Formulas</span>
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                className="sheet-tooltip text-[11px]"
              >
                Browse and insert formulas
              </TooltipContent>
            </Tooltip>
            <IconBtn
              icon={Paintbrush}
              tooltip="Format painter (coming soon)"
              onClick={() => toast.info("Format painter coming soon")}
            />
            <ToolSep />
            {showSearch ? (
              <div className="flex items-center gap-1 shrink-0">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
                  <input
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search…"
                    className="sheet-search-input h-7 w-32 sm:w-44 pl-6 pr-2 text-[11px] rounded-md"
                  />
                  {searchQuery && (
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">
                      {filteredRows.length}
                    </span>
                  )}
                </div>
                <button
                  className="sheet-icon-btn h-7 w-7 rounded flex items-center justify-center shrink-0"
                  onClick={() => {
                    setShowSearch(false);
                    setSearchQuery("");
                  }}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <IconBtn
                icon={Search}
                tooltip="Search"
                shortcut="Ctrl+F"
                onClick={() => setShowSearch(true)}
              />
            )}
          </div>
        </div>

        {/* ═══ FORMULA BAR ═════════════════════════════════════════════════ */}
        <div
          className="sheet-toolbar h-8 border-b flex items-center px-3 gap-2 shrink-0"
          style={{ background: "var(--sh-toolbar)" }}
        >
          <div
            className="flex items-center justify-center h-5 px-2 font-mono text-[11px] rounded border shrink-0"
            style={{
              background: "var(--sh-head-bg)",
              color: "var(--sh-col-label)",
              borderColor: "var(--sh-border)",
              minWidth: "36px",
            }}
          >
            {selectedCell
              ? `${String.fromCharCode(65 + columns.findIndex((c) => c.key === selectedCell.col))}${selectedCell.row + 1}`
              : ""}
          </div>
          <div
            className="font-serif italic font-bold shrink-0"
            style={{ color: "var(--sh-muted)" }}
          >
            fx
          </div>
          <input
            className="flex-1 h-full bg-transparent border-0 outline-none text-[12px] font-mono min-w-0"
            style={{ color: "var(--sh-text)", caretColor: "var(--sh-text)" }}
            placeholder={selectedCell ? "Enter a formula starting with =" : ""}
            value={
              selectedCell
                ? (formulas.formulas[
                    protection.getCellKey(selectedCell.row, selectedCell.col)
                  ] ??
                  formulas.columnFormulas[selectedCell.col] ??
                  String(rows[selectedCell.row]?.[selectedCell.col] ?? ""))
                : ""
            }
            readOnly={
              !selectedCell ||
              !!(
                selectedCell &&
                protection.isCellProtected(selectedCell.row, selectedCell.col)
              )
            }
            onChange={(e) => {
              if (!selectedCell) return;
              const val = e.target.value;
              const ck = protection.getCellKey(
                selectedCell.row,
                selectedCell.col,
              );
              if (val.startsWith("="))
                formulas.setFormulas((p) => ({ ...p, [ck]: val }));
              else {
                formulas.setFormulas((p) => {
                  const n = { ...p };
                  delete n[ck];
                  return n;
                });
                const nr = [...rows];
                const num = Number(val);
                nr[selectedCell.row] = {
                  ...nr[selectedCell.row],
                  [selectedCell.col]: val === "" ? "" : !isNaN(num) ? num : val,
                };
                handleRowsChange(nr);
              }
            }}
            onBlur={async () => {
              if (!selectedCell) return;
              const ck = protection.getCellKey(
                selectedCell.row,
                selectedCell.col,
              );
              const f = formulas.formulas[ck];
              if (f) await saveFormula(sheetId, ck, f);
              else await deleteFormula(sheetId, ck).catch(() => {});
            }}
          />
        </div>

        {/* ═══ ACTION BAR ══════════════════════════════════════════════════ */}
        <div
          className="sheet-actionbar border-b shrink-0"
          style={{ height: "36px" }}
        >
          <div className="h-full flex items-center px-2 gap-0.5 overflow-x-auto hide-scrollbar">
            {sheetState.userRole !== "viewer" && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      className="sheet-action-btn flex items-center gap-1 h-6 px-2.5 rounded text-[11px] font-medium shrink-0"
                      onClick={handleInsertRow}
                    >
                      <Plus className="h-3 w-3" />
                      Row
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    className="sheet-tooltip text-[11px]"
                  >
                    Insert a new row at the bottom
                  </TooltipContent>
                </Tooltip>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="sheet-action-btn flex items-center gap-1 h-6 px-2.5 rounded text-[11px] font-medium shrink-0">
                          <Plus className="h-3 w-3" />
                          Column
                          <ChevronDown className="h-2.5 w-2.5 opacity-50 ml-0.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent
                        side="bottom"
                        className="sheet-tooltip text-[11px]"
                      >
                        Insert a new column
                      </TooltipContent>
                    </Tooltip>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    collisionPadding={10}
                    className="w-44 max-h-[min(60vh,300px)] overflow-y-auto hide-scrollbar"
                    style={ddStyle(isDark)}
                  >
                    <DropdownMenuLabel
                      className="text-[10px] uppercase tracking-wider"
                      style={{ color: isDark ? "#4a5568" : "#9ca3af" }}
                    >
                      Column type
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator
                      style={{ background: isDark ? "#1e2330" : "#e8eaed" }}
                    />
                    {(
                      [
                        "text",
                        "number",
                        "currency",
                        "date",
                        "checkbox",
                        "status",
                        "priority",
                        "url",
                        "image",
                      ] as ColumnDef["type"][]
                    ).map((t) => (
                      <DropdownMenuItem
                        key={t}
                        className="text-xs capitalize"
                        onClick={() => handleInsertColumn(t)}
                        style={ddItemStyle(isDark)}
                      >
                        {t === "select" ? "Dropdown" : t}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      disabled={selectedRows.size === 0}
                      onClick={handleDeleteRow}
                      className={`sheet-action-btn sheet-action-btn--danger flex items-center gap-1 h-6 px-2.5 rounded text-[11px] font-medium shrink-0 ${selectedRows.size === 0 ? "opacity-35 cursor-not-allowed" : ""}`}
                    >
                      <Trash2 className="h-3 w-3" />
                      {selectedRows.size > 0
                        ? `Delete (${selectedRows.size})`
                        : "Delete"}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    className="sheet-tooltip text-[11px]"
                  >
                    Delete selected rows
                  </TooltipContent>
                </Tooltip>
                <ToolSep />

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      className="sheet-action-btn flex items-center gap-1 h-6 px-2.5 rounded text-[11px] font-medium shrink-0"
                      onClick={() => handleSort("asc")}
                    >
                      <ArrowDownAZ className="h-3.5 w-3.5" />
                      A→Z
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    className="sheet-tooltip text-[11px]"
                  >
                    Sort selected column A to Z
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      className="sheet-action-btn flex items-center gap-1 h-6 px-2.5 rounded text-[11px] font-medium shrink-0"
                      onClick={() => handleSort("desc")}
                    >
                      <ArrowUpAZ className="h-3.5 w-3.5" />
                      Z→A
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    className="sheet-tooltip text-[11px]"
                  >
                    Sort selected column Z to A
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      className={`sheet-action-btn flex items-center gap-1 h-6 px-2.5 rounded text-[11px] font-medium shrink-0 ${showFilters ? "sheet-action-btn--active" : ""}`}
                      onClick={() => setShowFilters(!showFilters)}
                    >
                      <SlidersHorizontal className="h-3.5 w-3.5" />
                      Filter
                      {(filterValue || advancedFilters.length > 0) && (
                        <span className="h-1.5 w-1.5 rounded-full bg-primary ml-0.5" />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    className="sheet-tooltip text-[11px]"
                  >
                    Filter rows by column values
                  </TooltipContent>
                </Tooltip>
                <ToolSep />

                {[
                  selectedCell &&
                  columns.find((c) => c.key === selectedCell.col)?.hidden
                    ? {
                        icon: EyeOff,
                        label: "Show",
                        action: handleHideColumn,
                        tooltip: "Show hidden column (owner only)",
                        ownerOnly: true,
                      }
                    : {
                        icon: Eye,
                        label: "Hide",
                        action: handleHideColumn,
                        tooltip: "Hide column from view (owner only)",
                        ownerOnly: true,
                      },
                  {
                    icon: Paintbrush,
                    label: "Conditional",
                    action: () =>
                      toast.info("Conditional formatting coming soon"),
                    tooltip: "Apply conditional formatting rules",
                  },
                  {
                    icon: Layers,
                    label: "Group",
                    action: () => toast.info("Group coming soon"),
                    tooltip: "Group columns together",
                  },
                ]
                  .filter(
                    ({ ownerOnly }: any) =>
                      !ownerOnly ||
                      (isOrgSheet && sheetState.ownerId === currentUser?.id),
                  )
                  .map(({ icon: Icon, label, action, tooltip }: any) => (
                    <Tooltip key={label}>
                      <TooltipTrigger asChild>
                        <button
                          className="sheet-action-btn flex items-center gap-1 h-6 px-2.5 rounded text-[11px] font-medium shrink-0"
                          onClick={action}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {label}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent
                        side="bottom"
                        className="sheet-tooltip text-[11px]"
                      >
                        {tooltip}
                      </TooltipContent>
                    </Tooltip>
                  ))}

                {/* ── CHART BUTTON — opens picker ── */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      ref={chartBtnRef as any}
                      className={`sheet-action-btn flex items-center gap-1 h-6 px-2.5 rounded text-[11px] font-medium shrink-0 ${charts.showPicker ? "sheet-action-btn--active" : ""}`}
                      onClick={
                        charts.showPicker
                          ? charts.closePicker
                          : charts.openPicker
                      }
                      style={
                        charts.charts.length > 0
                          ? { color: "#0ea5e9" }
                          : undefined
                      }
                    >
                      <BarChart3 className="h-3.5 w-3.5" />
                      Chart
                      {charts.charts.length > 0 && (
                        <span
                          className="text-[9px] font-bold px-1 py-0.5 rounded-full ml-0.5"
                          style={{ background: "#0ea5e920", color: "#0ea5e9" }}
                        >
                          {charts.charts.length}
                        </span>
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    className="sheet-tooltip text-[11px]"
                  >
                    {charts.showPicker
                      ? "Close chart picker"
                      : "Insert a chart"}
                  </TooltipContent>
                </Tooltip>

                <ToolSep />
              </>
            )}

            {/* Panel toggles */}
            {isOrgSheet && (
              <>
                <IconBtn
                  icon={MessageSquare}
                  tooltip="Comments"
                  onClick={() => toggleRightPanel("comments")}
                  active={effectiveRightPanel === "comments"}
                  badge={totalComments}
                />
                <IconBtn
                  icon={Users}
                  tooltip="Collaborators"
                  onClick={() => toggleRightPanel("collaborators")}
                  active={effectiveRightPanel === "collaborators"}
                />
              </>
            )}
            <IconBtn
              icon={Clock}
              tooltip="Time Travel — replay & branch"
              onClick={() => {
                toggleRightPanel("timetravel");
                if (rightPanel !== "timetravel") timeTravelActions.openPanel();
                else timeTravelActions.closePanel();
              }}
              active={effectiveRightPanel === "timetravel"}
            />
            <IconBtn
              icon={Code2}
              tooltip="Developer tools"
              onClick={() => toggleRightPanel("developer")}
              active={effectiveRightPanel === "developer"}
            />
            {/* Charts panel toggle — shows how many charts */}
            <IconBtn
              icon={BarChart3}
              tooltip="Charts panel"
              onClick={() => toggleRightPanel("charts")}
              active={effectiveRightPanel === "charts"}
              badge={
                charts.charts.length > 0 ? charts.charts.length : undefined
              }
            />
            <IconBtn
              icon={isDark ? Sun : Moon}
              tooltip={isDark ? "Light mode" : "Dark mode"}
              onClick={() => setIsDark(!isDark)}
            />
            <IconBtn
              icon={Keyboard}
              tooltip="Keyboard shortcuts"
              onClick={() => toggleRightPanel("shortcuts")}
              active={effectiveRightPanel === "shortcuts"}
            />
          </div>
        </div>

        {/* ═══ FILTER BAR ══════════════════════════════════════════════════ */}
        {showFilters && (
          <div className="sheet-filterbar min-h-11 border-b flex items-center px-3 py-1.5 gap-2 shrink-0 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-700 shrink-0">
              <SlidersHorizontal className="h-3 w-3" />
              Filter
            </div>
            <div className="relative shrink-0">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
              <input
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
                placeholder="Search all cells"
                className="sheet-filter-input h-6 w-40 sm:w-56 pl-6 pr-2 text-[11px] rounded-md border"
              />
            </div>
            {advancedFilters.map((rule) => {
              const operators = getFilterOperators(rule.columnKey);
              const needsValue =
                rule.operator !== "empty" && rule.operator !== "not_empty";
              return (
                <div
                  key={rule.id}
                  className="flex items-center gap-1 rounded-md border bg-background/80 px-1.5 py-1 shrink-0"
                >
                  <select
                    className="h-6 max-w-32 rounded border bg-transparent px-1.5 text-[11px] outline-none"
                    value={rule.columnKey}
                    onChange={(e) => {
                      const col = columns.find((c) => c.key === e.target.value);
                      setAdvancedFilters((prev) =>
                        prev.map((item) =>
                          item.id === rule.id
                            ? {
                                ...item,
                                columnKey: e.target.value,
                                operator:
                                  col?.type === "number" ||
                                  col?.type === "currency" ||
                                  col?.type === "progress"
                                    ? "gt"
                                    : "contains",
                                value: "",
                              }
                            : item,
                        ),
                      );
                    }}
                  >
                    {filterColumns.map((col) => (
                      <option key={col.key} value={col.key}>
                        {col.name}
                      </option>
                    ))}
                  </select>
                  <select
                    className="h-6 rounded border bg-transparent px-1.5 text-[11px] outline-none"
                    value={rule.operator}
                    onChange={(e) =>
                      setAdvancedFilters((prev) =>
                        prev.map((item) =>
                          item.id === rule.id
                            ? {
                                ...item,
                                operator: e.target.value as FilterOperator,
                                value:
                                  e.target.value === "empty" ||
                                  e.target.value === "not_empty"
                                    ? ""
                                    : item.value,
                              }
                            : item,
                        ),
                      )
                    }
                  >
                    {operators.map((operator) => (
                      <option key={operator.value} value={operator.value}>
                        {operator.label}
                      </option>
                    ))}
                  </select>
                  {needsValue && (
                    <>
                      <input
                        list={`filter-values-${rule.id}`}
                        className="h-6 w-28 rounded border bg-transparent px-1.5 text-[11px] outline-none"
                        value={rule.value}
                        placeholder="value"
                        onChange={(e) =>
                          setAdvancedFilters((prev) =>
                            prev.map((item) =>
                              item.id === rule.id
                                ? { ...item, value: e.target.value }
                                : item,
                            ),
                          )
                        }
                      />
                      <datalist id={`filter-values-${rule.id}`}>
                        {(filterSuggestions[rule.columnKey] ?? []).map(
                          (value) => (
                            <option key={value} value={value} />
                          ),
                        )}
                      </datalist>
                    </>
                  )}
                  <button
                    className="h-6 w-6 rounded hover:bg-muted flex items-center justify-center"
                    onClick={() =>
                      setAdvancedFilters((prev) =>
                        prev.filter((item) => item.id !== rule.id),
                      )
                    }
                    aria-label="Remove filter"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
            <button
              className="sheet-action-btn flex items-center gap-1 h-6 px-2 rounded text-[11px] font-medium shrink-0"
              onClick={() =>
                setAdvancedFilters((prev) => [...prev, createFilterRule()])
              }
              disabled={filterColumns.length === 0}
            >
              <Plus className="h-3 w-3" />
              Rule
            </button>
            {(filterValue || advancedFilters.length > 0) && (
              <span className="text-[11px] text-amber-600 font-medium shrink-0">
                {filteredRows.length}/{rows.length} rows
              </span>
            )}
            <button
              className="sheet-clear-filter flex items-center gap-1 text-[11px] font-medium px-2 h-6 rounded shrink-0"
              onClick={() => {
                setFilterValue("");
                setAdvancedFilters([]);
                setShowFilters(false);
              }}
            >
              Clear
              <X className="h-2.5 w-2.5 ml-0.5" />
            </button>
          </div>
        )}

        {/* MAIN BODY ════════════════════════════════════════════════════ */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Grid wrapper */}
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
              <DataGrid
                columns={gridColumns}
                rows={filteredRows}
                rowKeyGetter={(row: SheetRow) => row.id}
                onRowsChange={handleRowsChange}
                selectedRows={selectedRows}
                onSelectedRowsChange={setSelectedRows}
                onColumnResize={(idx, width) => {
                  const col = columns[idx - 1];
                  if (col) handleColumnResize(col.key, width);
                }}
                rowHeight={(row) => {
                  const manual = rowHeights[row.id];
                  if (textWrap.textWrapColumns.size === 0) return manual ?? 32;
                  let max = 1;
                  const ri = rows.findIndex((r) => r.id === row.id);
                  const wk = new Set(
                    [...textWrap.textWrapColumns]
                      .filter((k) => k.startsWith(`${ri}-`))
                      .map((k) => k.replace(`${ri}-`, "")),
                  );
                  wk.forEach((ck) => {
                    const v = String(row[ck] || "");
                    if (!v) return;
                    const cd = columns.find((c) => c.key === ck);
                    const cpl = Math.floor(((cd?.width || 160) - 20) / 7);
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
                className={`rdg-sheet fill-grid ${isDark ? "rdg-dark" : "rdg-light"}`}
              />
            </div>

            {/* ── CHART WIDGETS float over the grid ── */}
            {charts.charts.map((chart) => (
              <ChartWidget
                key={chart.id}
                chart={chart}
                isActive={charts.activeChartId === chart.id}
                isDark={isDark}
                rows={rows}
                columns={columns}
                onSelect={(id) => {
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
            (rightPanel === "developer" ||
              rightPanel === "timetravel" ||
              rightPanel === "charts" ||
              rightPanel === "shortcuts" ||
              isOrgSheet) && (
              <>
                <div
                  className="fixed inset-0 bg-black/40 z-20 sm:hidden backdrop-blur-[1px]"
                  onClick={() => setRightPanel(null)}
                />
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
                    members={orgMembers}
                    timeTravelState={timeTravelState}
                    timeTravelActions={timeTravelActions}
                    // ── Charts props ──
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
                  />
                </div>
              </>
            )}
        </div>

        {/* ═══ STATUS BAR ══════════════════════════════════════════════════ */}
        <div className="sheet-statusbar h-5 border-t flex items-center px-3 gap-3 shrink-0 overflow-x-auto no-scrollbar">
          <span className="sheet-status-text tabular-nums shrink-0">
            {rows.length}r · {columns.length}c
          </span>
          {selectedRows.size > 0 && (
            <span className="sheet-status-highlight shrink-0">
              {selectedRows.size} sel
            </span>
          )}
          {selectedCell && (
            <span className="sheet-status-cell font-mono shrink-0">
              {String.fromCharCode(
                65 + columns.findIndex((c) => c.key === selectedCell.col) + 1,
              )}
              {selectedCell.row + 1}
            </span>
          )}
          <div className="flex-1" />
          {filterValue && (
            <span className="text-[10px] text-amber-500 font-medium shrink-0">
              {filteredRows.length}/{rows.length}
            </span>
          )}
          {isOrgSheet && liveTracking && (
            <span className="sheet-status-text flex items-center gap-1 shrink-0">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
          )}
          {charts.charts.length > 0 && (
            <span
              className="text-[10px] font-medium shrink-0 flex items-center gap-1 cursor-pointer hover:opacity-80"
              style={{ color: "#0ea5e9" }}
              onClick={() => setRightPanel("charts")}
            >
              <BarChart3 className="h-2.5 w-2.5" />
              {charts.charts.length} chart
              {charts.charts.length !== 1 ? "s" : ""}
            </span>
          )}
          <button
            className="sheet-status-text hidden sm:flex items-center gap-1 hover:opacity-80 shrink-0"
            onClick={() => toggleRightPanel("shortcuts")}
          >
            <Keyboard className="h-2.5 w-2.5" />
            Shortcuts
          </button>
        </div>

        {/* ═══ MODALS ═══════════════════════════════════════════════════════ */}
        {isOrgSheet && (
          <ShareDialog
            showShareDialog={showShareDialog}
            setShowShareDialog={setShowShareDialog}
            sheetId={sheetId}
            isDark={isDark}
          />
        )}
        <SelectOptionsDialog
          open={selectSetupDialog.open}
          onClose={() => setSelectSetupDialog((p) => ({ ...p, open: false }))}
          onConfirm={handleSelectSetupConfirm}
          isDark={isDark}
          initialOptions={
            selectSetupDialog.mode === "cell" &&
            selectSetupDialog.row !== null &&
            selectSetupDialog.colKey
              ? (cellSelectOptions[
                  `${selectSetupDialog.row}-${selectSetupDialog.colKey}`
                ] ?? [])
              : selectSetupDialog.colKey &&
                  selectSetupDialog.colKey !== "__new__"
                ? (columns.find((c) => c.key === selectSetupDialog.colKey)
                    ?.selectOptions ?? [])
                : []
          }
        />
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

        {/* ── CHART PICKER (floating above action bar) ── */}
        {charts.showPicker && (
          <ChartPicker
            isDark={isDark}
            anchorRef={chartBtnRef}
            rows={rows}
            columns={columns}
            onSelect={(kind, preset) => {
              charts.insertChart(kind, rows, columns, {
                ...getSuggestedChartPreset(kind),
                ...preset,
              });
              toast.success(
                `${kind.charAt(0).toUpperCase() + kind.slice(1)} chart inserted — click to edit`,
              );
            }}
            onClose={charts.closePicker}
          />
        )}

        <style jsx global>{`
          .sheet-root *,
          .sheet-scrollbar {
            scrollbar-width: thin;
            scrollbar-color: #c7cdd8 transparent;
          }
          .sheet-root *::-webkit-scrollbar,
          .sheet-scrollbar::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          .sheet-root *::-webkit-scrollbar-thumb,
          .sheet-scrollbar::-webkit-scrollbar-thumb {
            background: #c7cdd8;
            border-radius: 999px;
          }
          .sheet-root *::-webkit-scrollbar-track,
          .sheet-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .no-scrollbar {
            -ms-overflow-style: auto;
            scrollbar-width: thin;
          }
          .no-scrollbar::-webkit-scrollbar {
            display: block;
          }
          @media (max-width: 640px) {
            .rdg-sheet {
              font-size: 11px !important;
            }
          }
        `}</style>
        {showFormulaDialog && (
          <FormulaDialog
            open={showFormulaDialog}
            onClose={() => setShowFormulaDialog(false)}
            onInsert={handleFormulaInsert}
            isDark={isDark}
          />
        )}
      </div>
    </TooltipProvider>
  );
}
