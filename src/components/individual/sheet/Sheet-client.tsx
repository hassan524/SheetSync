"use client";

import {
  useState, useCallback, useMemo, useRef, useEffect, startTransition,
} from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import DataGrid, { Column, RenderCellProps, RenderEditCellProps } from "react-data-grid";
import "react-data-grid/lib/styles.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
  DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft, Check, Loader2, Download, Share2, Star, CheckSquare, Square,
  GripVertical, Calendar, Plus, Trash2, Undo2, Redo2, WrapText, Copy,
  Scissors, Clipboard, Lock, Unlock, FileSpreadsheet, Users, MessageSquare,
  History, Activity, ChevronDown, Filter, Search, Settings2, Zap,
  Eye, GitBranch, Bell, Play, Pause, SkipBack, SkipForward, Clock,
  ChevronRight, X, Send, MoreHorizontal, Radio, Sparkles, BarChart3,
  TableProperties, Layers, Code2, Webhook, KeyRound, Sliders,
  PanelRight, PanelLeft, Maximize2, Sun, Moon, Globe, RefreshCw,
  AlertCircle, Info, HelpCircle, Keyboard,
  AlignLeft, AlignCenter, AlignRight, ArrowDownAZ, ArrowUpAZ,
  Paintbrush, Printer, Type, Snowflake,
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
import { SheetRow, ColumnDef, SaveStatus, PRIORITY_OPTIONS, STATUS_OPTIONS } from "@/types/index";
import { getTemplateData } from "@/lib/sheet-templates";
import { updateSheetTitle, updateSheetStarred } from "@/lib/querys/sheet/sheet";
import { saveRow, saveAllRows, deleteRows } from "@/lib/querys/sheet/rows";
import { saveAllColumns, deleteColumn } from "@/lib/querys/sheet/columns";
import { saveCellFormat } from "@/lib/querys/sheet/format";
import { saveFormula, deleteFormula } from "@/lib/querys/sheet/formulas";
import { protectCell, unprotectCell } from "@/lib/querys/sheet/protection";
import PlaybackModal from "./panels/Playback-panel";
import KeyboardShortcutsDialog from "./dialogs/Keyboard-shortcuts-dialog";
import ShareDialog from "./dialogs/Share-dialog";
import RightPanel from "./Right-panel";

// ── DUMMY DATA ────────────────────────────────
const DUMMY_COLLABORATORS = [
  { id: "1", name: "Sarah Chen", role: "Owner", avatar: "", color: "#0d7c5f", status: "active", cell: "B3", lastSeen: "now" },
  { id: "2", name: "Marcus Webb", role: "Editor", avatar: "", color: "#f59e0b", status: "active", cell: "D7", lastSeen: "now" },
  { id: "3", name: "Priya Nair", role: "Viewer", avatar: "", color: "#10b981", status: "idle", cell: null, lastSeen: "2m ago" },
  { id: "4", name: "Tom Okafor", role: "Editor", avatar: "", color: "#ef4444", status: "offline", cell: null, lastSeen: "1h ago" },
];

const DUMMY_COMMENTS: Record<string, { id: string; cellKey: string; author: string; avatar: string; color: string; text: string; timestamp: string; resolved: boolean; thread: { author: string; color: string; text: string; timestamp: string }[] }[]> = {
  "2-1": [
    {
      id: "c1", cellKey: "2-1", author: "Sarah Chen", avatar: "", color: "#0d7c5f",
      text: "This value looks off — can you double check with the finance team?",
      timestamp: "2h ago", resolved: false,
      thread: [
        { author: "Marcus Webb", color: "#f59e0b", text: "Agreed, I'll ping them now.", timestamp: "1h ago" },
        { author: "Sarah Chen", color: "#0d7c5f", text: "Thanks Marcus!", timestamp: "45m ago" },
      ],
    },
  ],
  "5-2": [
    {
      id: "c2", cellKey: "5-2", author: "Priya Nair", avatar: "", color: "#10b981",
      text: "Updated per Q3 report.", timestamp: "Yesterday", resolved: true,
      thread: [],
    },
  ],
};

const DUMMY_HISTORY = [
  { id: "h1", user: "Sarah Chen", color: "#0d7c5f", action: "Edited cell B3", detail: "Changed 'Pending' → 'Active'", timestamp: "2 min ago" },
  { id: "h2", user: "Marcus Webb", color: "#f59e0b", action: "Added row", detail: "Row 12 inserted", timestamp: "14 min ago" },
  { id: "h3", user: "You", color: "#0d7c5f", action: "Formatted column D", detail: "Applied currency format", timestamp: "1h ago" },
  { id: "h4", user: "Priya Nair", color: "#10b981", action: "Edited cell F7", detail: "Changed '42' → '89'", timestamp: "2h ago" },
  { id: "h5", user: "You", color: "#0d7c5f", action: "Added column", detail: "'Status' column added", timestamp: "3h ago" },
  { id: "h6", user: "Tom Okafor", color: "#ef4444", action: "Deleted rows", detail: "Rows 3-5 removed", timestamp: "Yesterday" },
];

type RightPanel = "comments" | "history" | "collaborators" | "developer" | null;

// ── CELL COMMENT INDICATOR ─────────────────────
function CommentDot({ count }: { count: number }) {
  return (
    <div className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-amber-400 border border-white z-10 flex items-center justify-center">
      {count > 1 && <span className="text-[6px] text-white font-bold leading-none">{count}</span>}
    </div>
  );
}

// ── COLLABORATOR CURSOR ───────────────────────
function CollabCursor({ name, color }: { name: string; color: string }) {
  return (
    <div className="absolute -top-5 left-0 z-50 pointer-events-none flex items-center gap-1">
      <div className="w-0.5 h-5 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-[10px] font-medium text-white px-1.5 py-0.5 rounded-sm whitespace-nowrap" style={{ backgroundColor: color }}>
        {name.split(" ")[0]}
      </span>
    </div>
  );
}

export default function SheetClient() {
  const params = useParams<{ id?: string }>();
  const searchParams = useSearchParams();
  const templateId = searchParams?.get("template") || "blank";
  const isOrganizationSheet = searchParams?.get("org") === "true";
  const router = useRouter();
  const sheetId = params?.id ?? "";
  const initialData = useMemo(() => getTemplateData(templateId), [templateId]);

  const rowsHistory = useHistory<SheetRow[]>(initialData.rows);
  const columnsHistory = useHistory<ColumnDef[]>(initialData.columns);

  const [title, setTitle] = useState<string>(initialData.title);
  const [rows, setRows] = useState<SheetRow[]>(initialData.rows);
  const [columns, setColumns] = useState<ColumnDef[]>(initialData.columns);
  const [starred, setStarred] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: string } | null>(null);

  // UI State
  const [rightPanel, setRightPanel] = useState<RightPanel>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [showPlayback, setShowPlayback] = useState(false);
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [liveTracking, setLiveTracking] = useState(isOrganizationSheet);
  const [filterValue, setFilterValue] = useState("");
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Dummy feature state (local only — integrate with backend later)
  const [fontSize, setFontSize] = useState("10");
  const [fontFamily, setFontFamily] = useState("Arial");
  const [zoomLevel, setZoomLevel] = useState(100);

  // Comment state
  const [comments, setComments] = useState(DUMMY_COMMENTS);
  const [activeCommentCell, setActiveCommentCell] = useState<string | null>(null);
  const [newCommentText, setNewCommentText] = useState("");
  const [replyText, setReplyText] = useState<Record<string, string>>({});

  // Refs
  const titleSaveTimeout = useRef<NodeJS.Timeout | undefined>(undefined);
  const rowSaveTimeout = useRef<NodeJS.Timeout | undefined>(undefined);
  const columnResizeTimeout = useRef<NodeJS.Timeout | undefined>(undefined);
  const playbackTimer = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => { startTransition(() => setRows(rowsHistory.currentState)); }, [rowsHistory.currentState]);
  useEffect(() => { startTransition(() => setColumns(columnsHistory.currentState)); }, [columnsHistory.currentState]);

  // Playback
  useEffect(() => {
    if (isPlaying) {
      playbackTimer.current = setInterval(() => {
        setPlaybackIndex((i) => {
          if (i >= DUMMY_HISTORY.length - 1) { setIsPlaying(false); return i; }
          return i + 1;
        });
      }, 1500);
    } else {
      clearInterval(playbackTimer.current);
    }
    return () => clearInterval(playbackTimer.current);
  }, [isPlaying]);

  const markSaving = useCallback(() => setSaveStatus("saving"), []);
  const markSaved = useCallback(() => setSaveStatus("saved"), []);

  const formatting = useSheetFormatting(() => { });
  const textWrap = useTextWrap(rows, () => { });
  const clipboard = useClipboard(rows, rowsHistory, () => { });
  const protection = useProtectedCells(() => { });
  const rowOps = useRowOperations(rows, columns, rowsHistory, () => { });
  const colOps = useColumnOperations(rows, columns, columnsHistory, rowsHistory, () => { });
  const cellTypes = useCellTypes(rows, rowsHistory, () => { });
  const formulas = useFormulas(rows, columns);

  useKeyboardShortcuts({
    selectedCell, rowsHistory,
    getCurrentCellFormat: formatting.getCurrentCellFormat,
    applyFormat: formatting.applyFormat,
    copyCellOrRange: clipboard.copyCellOrRange,
    pasteCellOrRange: clipboard.pasteCellOrRange,
    cutCellOrRange: clipboard.cutCellOrRange,
  });

  const handleTitleChange = useCallback((newTitle: string) => {
    setTitle(newTitle);
    markSaving();
    if (titleSaveTimeout.current) clearTimeout(titleSaveTimeout.current);
    titleSaveTimeout.current = setTimeout(async () => {
      await updateSheetTitle(sheetId, newTitle);
      markSaved();
    }, 1000);
  }, [sheetId, markSaving, markSaved]);

  const handleStarredToggle = useCallback(async () => {
    const newStarred = !starred;
    setStarred(newStarred);
    await updateSheetStarred(sheetId, newStarred);
  }, [starred, sheetId]);

  const handleSaveChangedRow = useCallback((updatedRows: SheetRow[], previousRows: SheetRow[]) => {
    const changedRow = updatedRows.find((row, idx) => {
      const oldRow = previousRows[idx];
      return !oldRow || JSON.stringify(row) !== JSON.stringify(oldRow);
    });
    if (!changedRow) return;
    const position = updatedRows.indexOf(changedRow);
    markSaving();
    if (rowSaveTimeout.current) clearTimeout(rowSaveTimeout.current);
    rowSaveTimeout.current = setTimeout(async () => {
      await saveRow(sheetId, changedRow, position);
      markSaved();
    }, 800);
  }, [sheetId, markSaving, markSaved]);

  const handleFormatChange = useCallback(async (format: any) => {
    if (!selectedCell) return;
    formatting.applyFormat(selectedCell, format);
    const mergedFormat = { ...formatting.getCurrentCellFormat(selectedCell), ...format };
    const cellKey = `${selectedCell.row}-${selectedCell.col}`;
    markSaving();
    await saveCellFormat(sheetId, cellKey, mergedFormat);
    markSaved();
  }, [selectedCell, formatting, sheetId, markSaving, markSaved]);

  const handleProtectionToggle = useCallback(async () => {
    if (!selectedCell) return;
    const cellKey = protection.getCellKey(selectedCell.row, selectedCell.col);
    const isCurrentlyProtected = protection.isCellProtected(selectedCell.row, selectedCell.col);
    protection.toggleProtectCell(selectedCell);
    markSaving();
    if (isCurrentlyProtected) await unprotectCell(sheetId, cellKey);
    else await protectCell(sheetId, cellKey);
    markSaved();
  }, [selectedCell, protection, sheetId, markSaving, markSaved]);

  const handleInsertRow = useCallback(async () => {
    rowOps.insertRow();
    setTimeout(async () => {
      markSaving();
      await saveAllRows(sheetId, rowsHistory.currentState);
      markSaved();
    }, 50);
  }, [rowOps, sheetId, rowsHistory, markSaving, markSaved]);

  const handleDeleteRow = useCallback(async () => {
    if (selectedRows.size === 0) return;
    const rowKeysToDelete = Array.from(selectedRows);
    rowOps.deleteRow(selectedRows);
    markSaving();
    await deleteRows(sheetId, rowKeysToDelete);
    setTimeout(async () => {
      await saveAllRows(sheetId, rowsHistory.currentState);
      markSaved();
    }, 50);
  }, [selectedRows, rowOps, sheetId, rowsHistory, markSaving, markSaved]);

  const handleInsertColumn = useCallback(async (type: ColumnDef["type"]) => {
    colOps.insertColumn(type);
    setTimeout(async () => {
      markSaving();
      await Promise.all([
        saveAllColumns(sheetId, columnsHistory.currentState, textWrap.textWrapColumns),
        saveAllRows(sheetId, rowsHistory.currentState),
      ]);
      markSaved();
    }, 50);
  }, [colOps, sheetId, columnsHistory, rowsHistory, textWrap.textWrapColumns, markSaving, markSaved]);

  const handleDeleteColumn = useCallback(async (colKey: string) => {
    colOps.deleteColumn(colKey);
    markSaving();
    await deleteColumn(sheetId, colKey);
    setTimeout(async () => {
      await Promise.all([
        saveAllColumns(sheetId, columnsHistory.currentState, textWrap.textWrapColumns),
        saveAllRows(sheetId, rowsHistory.currentState),
      ]);
      markSaved();
    }, 50);
  }, [colOps, sheetId, columnsHistory, rowsHistory, textWrap.textWrapColumns, markSaving, markSaved]);

  const handleChangeColumnType = useCallback(async (colKey: string, newType: ColumnDef["type"]) => {
    colOps.changeColumnType(colKey, newType);
    setTimeout(async () => {
      markSaving();
      await Promise.all([
        saveAllColumns(sheetId, columnsHistory.currentState, textWrap.textWrapColumns),
        saveAllRows(sheetId, rowsHistory.currentState),
      ]);
      markSaved();
    }, 50);
  }, [colOps, sheetId, columnsHistory, rowsHistory, textWrap.textWrapColumns, markSaving, markSaved]);

  const handleColumnResize = useCallback((colKey: string, width: number) => {
    colOps.handleColumnResize(colKey, width, setColumns);
    if (columnResizeTimeout.current) clearTimeout(columnResizeTimeout.current);
    columnResizeTimeout.current = setTimeout(async () => {
      markSaving();
      await saveAllColumns(sheetId, columnsHistory.currentState, textWrap.textWrapColumns);
      markSaved();
    }, 500);
  }, [colOps, sheetId, columnsHistory, textWrap.textWrapColumns, markSaving, markSaved]);

  const handleColumnDragEnd = useCallback(async () => {
    colOps.handleColumnDragEnd();
    setTimeout(async () => {
      markSaving();
      await saveAllColumns(sheetId, columnsHistory.currentState, textWrap.textWrapColumns);
      markSaved();
    }, 50);
  }, [colOps, sheetId, columnsHistory, textWrap.textWrapColumns, markSaving, markSaved]);

  const handleTextWrapToggle = useCallback(async (colKey: string) => {
    textWrap.toggleTextWrap(colKey);
    setTimeout(async () => {
      markSaving();
      await saveAllColumns(sheetId, columns, textWrap.textWrapColumns);
      markSaved();
    }, 50);
  }, [textWrap, sheetId, columns, markSaving, markSaved]);

  const handleExport = useCallback(() => {
    const csvHeaders = columns.map((c) => c.name).join(",");
    const csvRows = rows.map((row) =>
      columns.map((col) => {
        const val = row[col.key] ?? "";
        return typeof val === "string" && val.includes(",") ? `"${val}"` : val;
      }).join(",")
    );
    const blob = new Blob([[csvHeaders, ...csvRows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Exported as CSV");
  }, [columns, rows, title]);

  // ── DUMMY FEATURE HANDLERS (local only — integrate with backend later) ──
  const handleSort = useCallback((direction: "asc" | "desc") => {
    if (!selectedCell) { toast.info("Select a column first to sort"); return; }
    const colKey = selectedCell.col;
    const sorted = [...rows].sort((a, b) => {
      const va = String(a[colKey] ?? "");
      const vb = String(b[colKey] ?? "");
      return direction === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    });
    rowsHistory.pushState(sorted);
    toast.success(`Sorted ${direction === "asc" ? "A → Z" : "Z → A"}`);
  }, [selectedCell, rows, rowsHistory]);

  const handleFontFamilyChange = useCallback((family: string) => {
    setFontFamily(family);
    if (selectedCell) handleFormatChange({ fontFamily: family });
  }, [selectedCell, handleFormatChange]);

  const handleFontSizeChange = useCallback((size: string) => {
    setFontSize(size);
    if (selectedCell) handleFormatChange({ fontSize: Number(size) });
  }, [selectedCell, handleFormatChange]);

  const handleAlignChange = useCallback((align: string) => {
    if (selectedCell) handleFormatChange({ textAlign: align });
    else toast.info("Select a cell first");
  }, [selectedCell, handleFormatChange]);

  const handleZoomChange = useCallback((zoom: number) => {
    setZoomLevel(Math.max(50, Math.min(200, zoom)));
  }, []);

  // Comment handlers
  const handleAddComment = useCallback((cellKey: string) => {
    if (!newCommentText.trim()) return;
    const newComment = {
      id: `c${Date.now()}`, cellKey, author: "You", avatar: "", color: "#0d7c5f",
      text: newCommentText.trim(), timestamp: "Just now", resolved: false, thread: [],
    };
    setComments((prev) => ({ ...prev, [cellKey]: [...(prev[cellKey] || []), newComment] }));
    setNewCommentText("");
    toast.success("Comment added");
  }, [newCommentText]);

  const handleReply = useCallback((cellKey: string, commentId: string) => {
    const text = replyText[commentId];
    if (!text?.trim()) return;
    setComments((prev) => ({
      ...prev,
      [cellKey]: (prev[cellKey] || []).map((c) =>
        c.id === commentId
          ? { ...c, thread: [...c.thread, { author: "You", color: "#0d7c5f", text: text.trim(), timestamp: "Just now" }] }
          : c
      ),
    }));
    setReplyText((prev) => ({ ...prev, [commentId]: "" }));
  }, [replyText]);

  const handleResolveComment = useCallback((cellKey: string, commentId: string) => {
    setComments((prev) => ({
      ...prev,
      [cellKey]: (prev[cellKey] || []).map((c) =>
        c.id === commentId ? { ...c, resolved: true } : c
      ),
    }));
    toast.success("Comment resolved");
  }, []);

  const getCellComments = useCallback((rowIdx: number, colKey: string) => {
    const key = `${rowIdx}-${colKey}`;
    return comments[key] || [];
  }, [comments]);

  const toggleRightPanel = useCallback((panel: RightPanel) => {
    setRightPanel((prev) => prev === panel ? null : panel);
  }, []);

  const renderCellByType = useCallback((
    type: ColumnDef["type"],
    props: RenderCellProps<SheetRow>,
    colKey: string,
  ) => {
    const { row } = props;
    const rowIdx = rows.findIndex((r) => r.id === row.id);
    const cellStyle = formatting.getCellStyle(rowIdx, colKey, textWrap.textWrapColumns);
    const cellKey = protection.getCellKey(rowIdx, colKey);
    const formula = formulas.formulas[cellKey];
    const isProtected = protection.isCellProtected(rowIdx, colKey);
    const cellComments = getCellComments(rowIdx, colKey);
    const commentKey = `${rowIdx}-${colKey}`;
    const activeCollab = liveTracking
      ? DUMMY_COLLABORATORS.find((c) => c.cell === `${String.fromCharCode(66 + columns.findIndex(col => col.key === colKey))}${rowIdx + 1}`)
      : null;

    let displayValue = row[colKey];
    if (formula?.startsWith("=")) displayValue = formulas.evaluateFormula(formula, rowIdx);

    const cellContent = (() => {
      switch (type) {
        case "priority": {
          const option = PRIORITY_OPTIONS.find((o) => o.value === displayValue);
          return option ? (
            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold tracking-tight" style={{ color: option.color, backgroundColor: option.bgColor }}>
              {option.label}
            </span>
          ) : null;
        }
        case "status": {
          const option = STATUS_OPTIONS.find((o) => o.value === displayValue);
          return option ? (
            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold tracking-tight" style={{ color: option.color, backgroundColor: option.bgColor }}>
              {option.label}
            </span>
          ) : null;
        }
        case "checkbox":
          return displayValue
            ? <CheckSquare className="h-4 w-4 text-primary" />
            : <Square className="h-4 w-4 text-gray-300" />;
        case "date":
          return displayValue ? (
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3 w-3 text-gray-400" />
              <span className="text-gray-700">{String(displayValue)}</span>
            </div>
          ) : null;
        case "currency":
          return displayValue
            ? <span className="tabular-nums">${Number(displayValue).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
            : "";
        case "url":
          return displayValue ? (
            <a href={String(displayValue)} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate text-xs">
              {String(displayValue)}
            </a>
          ) : null;
        default:
          return displayValue !== undefined ? <span className="truncate">{String(displayValue)}</span> : "";
      }
    })();

    return (
      <div
        className={`h-full w-full flex items-center relative group/cell
          ${type === "currency" || type === "number" ? "justify-end font-mono" : ""}
          ${type === "checkbox" ? "justify-center" : ""}
          px-2.5 py-1.5 text-xs gap-1.5`}
        style={{
          ...cellStyle,
          ...(activeCollab ? { outline: `2px solid ${activeCollab.color}`, outlineOffset: "-2px" } : {}),
        }}
        onClick={() => setSelectedCell({ row: rowIdx, col: colKey })}
      >
        {isProtected && <Lock className="absolute top-1 right-1 h-2 w-2 text-gray-300 opacity-0 group-hover/cell:opacity-100" />}
        {cellComments.length > 0 && <CommentDot count={cellComments.length} />}
        {activeCollab && <CollabCursor name={activeCollab.name} color={activeCollab.color} />}
        {cellContent}
        <button
          className="absolute bottom-0.5 right-0.5 opacity-0 group-hover/cell:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            setActiveCommentCell(commentKey);
            setRightPanel("comments");
          }}
        >
          <MessageSquare className="h-2.5 w-2.5 text-gray-300 hover:text-amber-500 transition-colors" />
        </button>
      </div>
    );
  }, [rows, formatting, textWrap.textWrapColumns, protection, formulas, getCellComments, liveTracking, columns]);

  const gridColumns = useMemo<Column<SheetRow>[]>(() => {
    const rowNumberColumn: Column<SheetRow> = {
      key: "row-number", name: "", width: 46, frozen: true, resizable: false,
      renderHeaderCell: () => (
        <div className="h-full w-full flex items-center justify-center bg-gray-50 border-r border-gray-200">
          <input
            type="checkbox"
            className="h-3.5 w-3.5 rounded border-gray-300 cursor-pointer"
            style={{ accentColor: 'var(--primary)' }}
            checked={selectedRows.size === rows.length && rows.length > 0}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedRows(new Set(rows.map(r => r.id)));
              } else {
                setSelectedRows(new Set());
              }
            }}
          />
        </div>
      ),
      renderCell(props: RenderCellProps<SheetRow>) {
        const rowIdx = rows.findIndex((r) => r.id === props.row.id);
        const isRowSelected = selectedRows.has(props.row.id);
        return (
          <div className={`h-full w-full flex items-center justify-center text-[11px] font-mono select-none border-r border-gray-200 group/rownum ${isRowSelected ? 'bg-primary/5' : 'bg-gray-50/60'}`}>
            <span className={`${isRowSelected ? 'hidden' : 'group-hover/rownum:hidden'} text-gray-400`}>{rowIdx + 1}</span>
            <input
              type="checkbox"
              className={`h-3.5 w-3.5 rounded border-gray-300 cursor-pointer ${isRowSelected ? '' : 'hidden group-hover/rownum:block'}`}
              style={{ accentColor: 'var(--primary)' }}
              checked={isRowSelected}
              onChange={(e) => {
                const newSet = new Set(selectedRows);
                if (e.target.checked) newSet.add(props.row.id);
                else newSet.delete(props.row.id);
                setSelectedRows(newSet);
              }}
            />
          </div>
        );
      },
    };

    const dataColumns = columns.map((col): Column<SheetRow> => ({
      key: col.key, name: col.name, width: col.width || 160, resizable: true,
      renderHeaderCell: () => (
        <div
          className="h-full w-full flex items-center gap-1.5 px-2.5 group/header bg-gray-50 border-r border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer"
          draggable
          onDragStart={() => colOps.handleColumnDragStart(col.key)}
          onDragOver={(e) => colOps.handleColumnDragOver(e, col.key, setColumns)}
          onDragEnd={handleColumnDragEnd}
        >
          <GripVertical className="h-3 w-3 text-gray-300 flex-shrink-0 cursor-move opacity-0 group-hover/header:opacity-100 transition-opacity" />
          <span className="flex-1 text-[11px] font-semibold text-gray-600 truncate tracking-wide uppercase">
            {col.name}
          </span>
          {textWrap.textWrapColumns.has(col.key) && <WrapText className="h-3 w-3 text-primary flex-shrink-0" />}
          <ColumnHeaderMenu
            column={col}
            onChangeType={(newType) => handleChangeColumnType(col.key, newType)}
            onDelete={() => handleDeleteColumn(col.key)}
            onToggleTextWrap={() => handleTextWrapToggle(col.key)}
            textWrapEnabled={textWrap.textWrapColumns.has(col.key)}
          />
        </div>
      ),
      renderCell(props: RenderCellProps<SheetRow>) {
        const rowIdx = rows.findIndex((r) => r.id === props.row.id);
        return renderCellByType(cellTypes.getCellType(rowIdx, col.key, col.type || "text"), props, col.key);
      },
      renderEditCell(props: RenderEditCellProps<SheetRow>) {
        const { row, column, onRowChange } = props;
        const rowIdx = rows.findIndex((r) => r.id === row.id);
        const cellType = cellTypes.getCellType(rowIdx, col.key, col.type || "text");
        const cellStyle = formatting.getCellStyle(rowIdx, column.key, textWrap.textWrapColumns);
        const cellKey = protection.getCellKey(rowIdx, col.key);
        const formula = formulas.formulas[cellKey];
        const isTextWrap = textWrap.textWrapColumns.has(col.key);
        const isProtected = protection.isCellProtected(rowIdx, col.key);

        if (isProtected) {
          toast.error("This cell is protected");
          return (
            <div className="h-full w-full flex items-center px-2.5 text-xs bg-gray-50 text-gray-400 gap-1.5">
              <Lock className="h-3 w-3" /> Protected
            </div>
          );
        }

        if (cellType === "priority" || cellType === "status") {
          const options = cellType === "priority" ? PRIORITY_OPTIONS : STATUS_OPTIONS;
          return (
            <Select value={row[column.key] as string} onValueChange={(value) => onRowChange({ ...row, [column.key]: value })}>
              <SelectTrigger className="h-full border-0 text-xs rounded-none focus:ring-0 focus:ring-offset-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold" style={{ color: option.color, backgroundColor: option.bgColor }}>
                      {option.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        }
        if (cellType === "date") {
          return (
            <input className="w-full h-full px-2.5 text-xs bg-white outline-none border-0 focus:ring-0" style={cellStyle}
              type="date" autoFocus value={String(row[column.key] || "")}
              onChange={(e) => onRowChange({ ...row, [column.key]: e.target.value })} />
          );
        }
        if (cellType === "checkbox") {
          return (
            <div className="h-full flex items-center justify-center cursor-pointer"
              onClick={() => onRowChange({ ...row, [column.key]: !row[column.key] })}>
              {row[column.key] ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4 text-gray-300" />}
            </div>
          );
        }
        if (cellType === "number" || cellType === "currency") {
          return (
            <input className="w-full h-full px-2.5 text-xs bg-white outline-none border-0 text-right tabular-nums font-mono"
              style={cellStyle} type="text" autoFocus placeholder={formula ?? undefined}
              value={formula || (row[column.key] !== undefined && row[column.key] !== 0 ? String(row[column.key]) : "")}
              onChange={(e) => {
                const val = e.target.value;
                if (val.startsWith("=")) {
                  formulas.setFormulas((prev) => ({ ...prev, [cellKey]: val }));
                } else {
                  formulas.setFormulas((prev) => { const n = { ...prev }; delete n[cellKey]; return n; });
                  const newValue = val === "" ? 0 : Number(val);
                  if (!isNaN(newValue)) onRowChange({ ...row, [column.key]: newValue });
                }
              }}
              onBlur={async () => {
                if (formula) await saveFormula(sheetId, cellKey, formula);
                else await deleteFormula(sheetId, cellKey);
              }} />
          );
        }
        if (isTextWrap) {
          return (
            <textarea className="w-full h-full px-2.5 py-2 text-xs bg-white outline-none border-0 resize-none"
              style={cellStyle} autoFocus value={String(row[column.key] || "")}
              onChange={(e) => onRowChange({ ...row, [column.key]: e.target.value })}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) e.stopPropagation(); }} />
          );
        }
        return (
          <input className="w-full h-full px-2.5 text-xs bg-white outline-none border-0"
            style={cellStyle} autoFocus value={String(row[column.key] || "")}
            onChange={(e) => onRowChange({ ...row, [column.key]: e.target.value })} />
        );
      },
    }));
    return [rowNumberColumn, ...dataColumns];
  }, [columns, rows, formatting, textWrap, cellTypes, formulas, colOps, protection, renderCellByType, handleColumnDragEnd, handleChangeColumnType, handleDeleteColumn, handleTextWrapToggle, sheetId, selectedRows]);

  const handleRowsChange = useCallback((updatedRows: SheetRow[]) => {
    const previousRows = rows;
    rowsHistory.pushState(updatedRows);
    handleSaveChangedRow(updatedRows, previousRows);
  }, [rowsHistory, rows, handleSaveChangedRow]);

  const filteredRows = useMemo<SheetRow[]>(() => {
    const q = searchQuery || filterValue;
    if (!q) return rows;
    return rows.filter((row) =>
      columns.some((col) => {
        const value = row[col.key];
        return value && String(value).toLowerCase().includes(q.toLowerCase());
      })
    );
  }, [rows, searchQuery, filterValue, columns]);

  const selectedCellType = useMemo(() => {
    if (!selectedCell) return null;
    const col = columns.find((c) => c.key === selectedCell.col);
    return col ? cellTypes.getCellType(selectedCell.row, selectedCell.col, col.type || "text") : null;
  }, [selectedCell, columns, cellTypes]);

  const isSelectedColumnWrapped = useMemo(() =>
    selectedCell ? textWrap.textWrapColumns.has(selectedCell.col) : false,
    [selectedCell, textWrap.textWrapColumns]
  );

  const totalComments = useMemo(() =>
    Object.values(comments).reduce((a, b) => a + b.filter(c => !c.resolved).length, 0),
    [comments]
  );

  const activeCollaborators = DUMMY_COLLABORATORS.filter((c) => c.status === "active");

  // ── KEYBOARD SHORTCUT MAP ─────────────────────


  return (
    <TooltipProvider delayDuration={300}>
      <div className={`h-screen flex flex-col select-none overflow-hidden transition-colors duration-200 ${isDark ? "bg-gray-950 text-gray-100" : "bg-white text-gray-900"}`}
        style={{ fontFamily: "'DM Sans', 'Geist', system-ui, sans-serif" }}>

        {/* ── TITLE BAR ──────────────────────────── */}
        <header className={`h-12 border-b flex items-center justify-between px-3 shrink-0 ${isDark ? "bg-gray-950 border-gray-800" : "bg-white border-gray-200"}`}>
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md shrink-0" onClick={() => router.back()}>
              <ArrowLeft className="h-3.5 w-3.5" />
            </Button>
            <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <FileSpreadsheet className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="flex flex-col min-w-0">
              <Input
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className={`h-7 border-0 bg-transparent font-semibold text-[14px] focus-visible:ring-1 focus-visible:ring-primary/50 px-1.5 rounded-md w-56 ${isDark ? "text-white placeholder:text-gray-600" : "text-gray-900"}`}
              />
              <div className="flex items-center gap-2 px-1.5 -mt-0.5">
                {isOrganizationSheet && (
                  <Badge variant="outline" className="text-[9px] h-3.5 px-1 border-primary/20 text-primary bg-primary/5 leading-none">
                    ORG
                  </Badge>
                )}
                <span className={`text-[10px] ${isDark ? "text-gray-600" : "text-gray-400"}`}>
                  {saveStatus === "saving" ? (
                    <span className="flex items-center gap-1"><Loader2 className="h-2.5 w-2.5 animate-spin" /> Saving</span>
                  ) : (
                    <span className="flex items-center gap-1"><Check className="h-2.5 w-2.5 text-emerald-500" /> Saved</span>
                  )}
                </span>
              </div>
            </div>
            <button onClick={handleStarredToggle} className="ml-1 shrink-0">
              <Star className={`h-4 w-4 transition-colors ${starred ? "fill-amber-400 text-amber-400" : isDark ? "text-gray-600 hover:text-amber-400" : "text-gray-300 hover:text-amber-400"}`} />
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {liveTracking && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] text-emerald-700 font-medium">{activeCollaborators.length} live</span>
              </div>
            )}
            <div className="flex -space-x-1.5">
              {DUMMY_COLLABORATORS.slice(0, 4).map((c) => (
                <Tooltip key={c.id}>
                  <TooltipTrigger>
                    <div
                      className={`h-6 w-6 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-bold text-white cursor-pointer transition-transform hover:scale-110 hover:z-10 relative ${c.status === "offline" ? "opacity-40" : ""}`}
                      style={{ backgroundColor: c.color }}
                    >
                      {c.name.split(" ").map((n) => n[0]).join("")}
                      {c.status === "active" && <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 bg-emerald-500 rounded-full border border-white" />}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    <p className="font-medium">{c.name}</p>
                    <p className="text-gray-400">{c.role} · {c.status === "active" ? "Active" : c.lastSeen}</p>
                    {c.cell && <p className="text-primary">Editing {c.cell}</p>}
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>

            <Separator orientation="vertical" className="h-5" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg relative" onClick={() => setShowNotifications(true)}>
                  <Bell className="h-4 w-4" />
                  {totalComments > 0 && <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 bg-red-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold">{totalComments}</span>}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Notifications</TooltipContent>
            </Tooltip>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs rounded-lg px-3">
                  <Download className="h-3.5 w-3.5" /> Export <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuLabel className="text-[11px] text-gray-400">Export as</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleExport} className="text-xs">CSV (.csv)</DropdownMenuItem>
                <DropdownMenuItem className="text-xs" onClick={() => toast.info("Excel export coming soon")}>Excel (.xlsx)</DropdownMenuItem>
                <DropdownMenuItem className="text-xs" onClick={() => toast.info("PDF export coming soon")}>PDF (.pdf)</DropdownMenuItem>
                <DropdownMenuItem className="text-xs" onClick={() => toast.info("JSON export coming soon")}>JSON (.json)</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              size="sm"
              className="h-8 gap-1.5 text-xs rounded-lg px-3 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
              onClick={() => setShowShareDialog(true)}
            >
              <Share2 className="h-3.5 w-3.5" /> Share
            </Button>
          </div>
        </header>

        {/* ── FORMATTING TOOLBAR ──────────────────────── */}
        <div className={`h-10 border-b flex items-center px-3 gap-0.5 shrink-0 ${isDark ? "bg-gray-950 border-gray-800" : "bg-gray-50/80 border-gray-200"}`}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded" onClick={() => rowsHistory.undo()} disabled={!rowsHistory.canUndo}>
                <Undo2 className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="text-xs">Undo <span className="text-gray-400 ml-1">Ctrl+Z</span></TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded" onClick={() => rowsHistory.redo()} disabled={!rowsHistory.canRedo}>
                <Redo2 className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="text-xs">Redo <span className="text-gray-400 ml-1">Ctrl+Y</span></TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-5 mx-1" />

          {/* Zoom */}
          <Select value={String(zoomLevel)} onValueChange={(v) => handleZoomChange(Number(v))}>
            <SelectTrigger className="h-7 w-[85px] text-[11px] border-gray-200 rounded">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[50, 75, 90, 100, 110, 125, 150, 200].map((z) => (
                <SelectItem key={z} value={String(z)} className="text-xs">{z}%</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Separator orientation="vertical" className="h-5 mx-1" />

          <Tooltip><TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded" onClick={() => clipboard.copyCellOrRange(selectedCell)}>
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger><TooltipContent className="text-xs">Copy <span className="text-gray-400 ml-1">Ctrl+C</span></TooltipContent></Tooltip>

          <Tooltip><TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded" onClick={() => clipboard.cutCellOrRange(selectedCell)}>
              <Scissors className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger><TooltipContent className="text-xs">Cut <span className="text-gray-400 ml-1">Ctrl+X</span></TooltipContent></Tooltip>

          <Tooltip><TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded" onClick={() => clipboard.pasteCellOrRange(selectedCell)}>
              <Clipboard className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger><TooltipContent className="text-xs">Paste <span className="text-gray-400 ml-1">Ctrl+V</span></TooltipContent></Tooltip>

          <Separator orientation="vertical" className="h-5 mx-1" />

          {/* Font family */}
          <Select value={fontFamily} onValueChange={handleFontFamilyChange}>
            <SelectTrigger className="h-7 w-[110px] text-[11px] border-gray-200 rounded">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["Arial", "Verdana", "Helvetica", "Times New Roman", "Georgia", "Courier New", "Trebuchet MS"].map((f) => (
                <SelectItem key={f} value={f} className="text-xs" style={{ fontFamily: f }}>{f}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Separator orientation="vertical" className="h-5 mx-1" />

          {selectedCell && selectedCellType && (
            <>
              <CellTypeSelector currentType={selectedCellType} onChangeType={(newType) => cellTypes.changeCellType(selectedCell.row, selectedCell.col, newType)} />
              <Separator orientation="vertical" className="h-5 mx-1" />
            </>
          )}

          <FormattingToolbar currentFormat={formatting.getCurrentCellFormat(selectedCell)} onFormatChange={handleFormatChange} disabled={!selectedCell} />

          <Separator orientation="vertical" className="h-5 mx-1" />

          <Tooltip><TooltipTrigger asChild>
            <Button variant={isSelectedColumnWrapped ? "secondary" : "ghost"} size="icon" className="h-7 w-7 rounded"
              onClick={() => selectedCell && handleTextWrapToggle(selectedCell.col)} disabled={!selectedCell}>
              <WrapText className={`h-3.5 w-3.5 ${isSelectedColumnWrapped ? "text-primary" : ""}`} />
            </Button>
          </TooltipTrigger><TooltipContent className="text-xs">Text Wrap</TooltipContent></Tooltip>

          <Tooltip><TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded" onClick={handleProtectionToggle} disabled={!selectedCell}>
              {selectedCell && protection.isCellProtected(selectedCell.row, selectedCell.col)
                ? <Lock className="h-3.5 w-3.5 text-red-500" />
                : <Unlock className="h-3.5 w-3.5" />}
            </Button>
          </TooltipTrigger><TooltipContent className="text-xs">Protect Cell</TooltipContent></Tooltip>

          <div className="flex-1" />

          {/* Search inline */}
          {showSearch ? (
            <div className="flex items-center gap-1">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search cells..."
                  className="h-7 w-44 pl-6 pr-2 text-xs border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                />
                {searchQuery && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">{filteredRows.length} found</span>}
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded" onClick={() => { setShowSearch(false); setSearchQuery(""); }}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <Tooltip><TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded" onClick={() => setShowSearch(true)}>
                <Search className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger><TooltipContent className="text-xs">Search <span className="text-gray-400 ml-1">Ctrl+F</span></TooltipContent></Tooltip>
          )}
        </div>

        {/* ── ACTION BAR ──────────────────────────────── */}
        <div className={`h-9 border-b flex items-center px-3 gap-0.5 shrink-0 ${isDark ? "bg-gray-950 border-gray-800" : "bg-white border-gray-200"}`}>
          <Tooltip><TooltipTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-[11px] rounded px-2 font-medium" onClick={handleInsertRow}>
              <Plus className="h-3 w-3" /> Row
            </Button>
          </TooltipTrigger><TooltipContent className="text-xs">Insert row</TooltipContent></Tooltip>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 gap-1 text-[11px] rounded px-2 font-medium">
                <Plus className="h-3 w-3" /> Column <ChevronDown className="h-2.5 w-2.5 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-40">
              <DropdownMenuLabel className="text-[11px] text-gray-400">Column type</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {(["text", "number", "currency", "date", "checkbox", "status", "priority", "url"] as ColumnDef["type"][]).map((t) => (
                <DropdownMenuItem key={t} className="text-xs capitalize" onClick={() => handleInsertColumn(t)}>{t}</DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="sm" className="h-7 gap-1 text-[11px] rounded px-2 text-red-500 hover:bg-red-50 hover:text-red-600 font-medium"
            onClick={handleDeleteRow} disabled={selectedRows.size === 0}>
            <Trash2 className="h-3 w-3" /> {selectedRows.size > 0 ? `Delete (${selectedRows.size})` : "Delete"}
          </Button>

          <Separator orientation="vertical" className="h-5 mx-1" />

          {/* Sort */}
          <Tooltip><TooltipTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-[11px] rounded px-2 font-medium" onClick={() => handleSort("asc")}>
              <ArrowDownAZ className="h-3.5 w-3.5" /> Sort A→Z
            </Button>
          </TooltipTrigger><TooltipContent className="text-xs">Sort ascending</TooltipContent></Tooltip>

          <Tooltip><TooltipTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-[11px] rounded px-2 font-medium" onClick={() => handleSort("desc")}>
              <ArrowUpAZ className="h-3.5 w-3.5" /> Sort Z→A
            </Button>
          </TooltipTrigger><TooltipContent className="text-xs">Sort descending</TooltipContent></Tooltip>

          <Tooltip><TooltipTrigger asChild>
            <Button variant={showFilters ? "secondary" : "ghost"} size="sm" className="h-7 gap-1 text-[11px] rounded px-2 font-medium" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="h-3.5 w-3.5" /> Filter
            </Button>
          </TooltipTrigger><TooltipContent className="text-xs">Filter data</TooltipContent></Tooltip>

          <div className="flex-1" />

          {/* Panel toggles */}
          <div className="flex items-center gap-0.5">
            <Tooltip><TooltipTrigger asChild>
              <Button variant={rightPanel === "comments" ? "secondary" : "ghost"} size="icon" className="h-7 w-7 rounded relative"
                onClick={() => toggleRightPanel("comments")}>
                <MessageSquare className="h-3.5 w-3.5" />
                {totalComments > 0 && <span className="absolute -top-0.5 -right-0.5 h-3 w-3 bg-amber-500 rounded-full text-[8px] text-white flex items-center justify-center">{totalComments}</span>}
              </Button>
            </TooltipTrigger><TooltipContent className="text-xs">Comments</TooltipContent></Tooltip>

            <Tooltip><TooltipTrigger asChild>
              <Button variant={rightPanel === "history" ? "secondary" : "ghost"} size="icon" className="h-7 w-7 rounded"
                onClick={() => toggleRightPanel("history")}>
                <History className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger><TooltipContent className="text-xs">Version history</TooltipContent></Tooltip>

            <Tooltip><TooltipTrigger asChild>
              <Button variant={rightPanel === "collaborators" ? "secondary" : "ghost"} size="icon" className="h-7 w-7 rounded"
                onClick={() => toggleRightPanel("collaborators")}>
                <Users className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger><TooltipContent className="text-xs">Collaborators</TooltipContent></Tooltip>

            <Tooltip><TooltipTrigger asChild>
              <Button variant={rightPanel === "developer" ? "secondary" : "ghost"} size="icon" className="h-7 w-7 rounded"
                onClick={() => toggleRightPanel("developer")}>
                <Code2 className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger><TooltipContent className="text-xs">Developer tools</TooltipContent></Tooltip>

            <Separator orientation="vertical" className="h-5 mx-1" />

            <Tooltip><TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded" onClick={() => setShowPlayback(true)}>
                <Play className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger><TooltipContent className="text-xs">Playback history</TooltipContent></Tooltip>

            <Tooltip><TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded" onClick={() => setIsDark(!isDark)}>
                {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
              </Button>
            </TooltipTrigger><TooltipContent className="text-xs">Toggle theme</TooltipContent></Tooltip>

            <Tooltip><TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded" onClick={() => setShowKeyboardShortcuts(true)}>
                <Keyboard className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger><TooltipContent className="text-xs">Keyboard shortcuts</TooltipContent></Tooltip>
          </div>
        </div>

        {/* ── FILTER BAR ───────────────────────────── */}
        {showFilters && (
          <div className={`h-9 border-b flex items-center px-4 gap-3 shrink-0 ${isDark ? "bg-gray-900/50 border-gray-800" : "bg-amber-50/50 border-amber-100"}`}>
            <span className={`text-[11px] font-semibold flex items-center gap-1.5 ${isDark ? "text-gray-400" : "text-amber-700"}`}>
              <Filter className="h-3 w-3" /> Filters active
            </span>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
              <input
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
                placeholder="Filter all columns..."
                className="h-6 w-52 pl-6 pr-2 text-[11px] border border-amber-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
            </div>
            {filterValue && (
              <span className="text-[11px] text-amber-600">{filteredRows.length} of {rows.length} rows</span>
            )}
            <Button variant="ghost" size="sm" className="h-6 text-[11px] px-2 text-amber-700" onClick={() => { setFilterValue(""); setShowFilters(false); }}>
              Clear <X className="h-3 w-3 ml-1" />
            </Button>
          </div>
        )}

        {/* ── FORMULA BAR ──────────────────────────── */}
        <div className={`h-8 border-b flex items-center px-3 gap-2 shrink-0 ${isDark ? "bg-gray-950 border-gray-800" : "bg-white border-gray-100"}`}>
          <div className={`h-5 min-w-[60px] px-2 text-[11px] font-mono rounded flex items-center justify-center border font-semibold ${isDark ? "bg-gray-900 border-gray-700 text-primary" : "bg-gray-50 border-gray-200 text-primary"}`}>
            {selectedCell
              ? `${String.fromCharCode(65 + (columns.findIndex(c => c.key === selectedCell.col) + 1))}${selectedCell.row + 1}`
              : "—"}
          </div>
          <Separator orientation="vertical" className="h-4" />
          <span className={`text-[11px] font-mono flex-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
            {selectedCell ? (
              formulas.formulas[`${selectedCell.row}-${selectedCell.col}`] || String(rows[selectedCell.row]?.[selectedCell.col] ?? "")
            ) : "Select a cell to view or edit"}
          </span>
          {selectedCell && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button className={`text-[10px] px-1.5 py-0.5 rounded font-medium transition-colors ${isDark ? "text-primary hover:bg-gray-800" : "text-primary hover:bg-primary/5"}`}
                  onClick={() => { setActiveCommentCell(`${selectedCell.row}-${selectedCell.col}`); toggleRightPanel("comments"); }}>
                  <MessageSquare className="h-3 w-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="text-xs">Add comment to cell</TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* ── MAIN BODY ────────────────────────────── */}
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-hidden relative">
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
                const rowIdx = rows.findIndex((r) => r.id === row.id);
                return textWrap.calculateRowHeight(rowIdx);
              }}
              headerRowHeight={34}
              className={`rdg-sheet fill-grid ${isDark ? "rdg-dark" : "rdg-light"}`}
            />
          </div>

          {/* ── RIGHT PANEL ──────────────────────── */}
          {rightPanel && (
            <RightPanel
              rightPanel={rightPanel}
              isDark={isDark}
              setRightPanel={setRightPanel}
              comments={comments}
              activeCommentCell={activeCommentCell}
              newCommentText={newCommentText}
              replyText={replyText}
              setNewCommentText={setNewCommentText}
              handleAddComment={handleAddComment}
              handleReply={handleReply}
              handleResolveComment={handleResolveComment}
              setReplyText={setReplyText}
              history={DUMMY_HISTORY}
              setShowPlayback={setShowPlayback}
              liveTracking={liveTracking}
              isOrganizationSheet={isOrganizationSheet}
              setLiveTracking={setLiveTracking}
              setShowShareDialog={setShowShareDialog}
              sheetId={sheetId}
              rows={rows}
              columns={columns}
              totalComments={totalComments}
            />
          )}
        </div>

        {/* ── STATUS BAR ───────────────────────────── */}
        <div className={`h-6 border-t flex items-center px-4 gap-4 shrink-0 ${isDark ? "bg-gray-950 border-gray-800" : "bg-gray-50/80 border-gray-100"}`}>
          <span className={`text-[10px] tabular-nums ${isDark ? "text-gray-600" : "text-gray-400"}`}>
            {rows.length} rows · {columns.length} columns
          </span>
          {selectedRows.size > 0 && (
            <span className="text-[10px] text-primary font-medium">{selectedRows.size} selected</span>
          )}
          {selectedCell && (
            <span className={`text-[10px] font-mono ${isDark ? "text-gray-600" : "text-gray-400"}`}>
              Cell {String.fromCharCode(65 + columns.findIndex(c => c.key === selectedCell.col) + 1)}{selectedCell.row + 1}
            </span>
          )}
          <div className="flex-1" />
          {filterValue && (
            <span className="text-[10px] text-amber-600">{filteredRows.length} of {rows.length} rows shown</span>
          )}
          <button className={`text-[10px] flex items-center gap-1 transition-colors ${isDark ? "text-gray-600 hover:text-gray-400" : "text-gray-400 hover:text-gray-600"}`}
            onClick={() => setShowKeyboardShortcuts(true)}>
            <Keyboard className="h-3 w-3" /> Shortcuts
          </button>
        </div>




        {/* ── PLAYBACK MODAL ────────────────────────── */}

        <PlaybackModal
          showPlayback={showPlayback}
          setShowPlayback={setShowPlayback}
          playbackIndex={playbackIndex}
          setPlaybackIndex={setPlaybackIndex}
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
        />

        {/* ── SHARE DIALOG ─────────────────────────── */}
        <ShareDialog
          showShareDialog={showShareDialog}
          setShowShareDialog={setShowShareDialog}
          sheetId={sheetId}
          isDark={isDark}
        />

        {/* ── KEYBOARD SHORTCUTS MODAL ──────────────── */}
        <KeyboardShortcutsDialog
          showKeyboardShortcuts={showKeyboardShortcuts}
          setShowKeyboardShortcuts={setShowKeyboardShortcuts}
        />




        <style jsx global>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
          .rdg-sheet { border: none; --rdg-selection-color: var(--primary); --rdg-background-color: #ffffff; --rdg-header-background-color: #f9fafb; --rdg-row-hover-background-color: #fafafa; --rdg-border-color: #e5e7eb; font-family: 'DM Sans', system-ui, sans-serif; font-size: 12px; }
          .rdg-dark { --rdg-background-color: #030712; --rdg-header-background-color: #111827; --rdg-row-hover-background-color: #111827; --rdg-border-color: #1f2937; --rdg-color: #e5e7eb; }
          .rdg-cell { border-right: 1px solid var(--rdg-border-color); border-bottom: 1px solid var(--rdg-border-color); padding: 0 !important; background-color: var(--rdg-background-color); cursor: pointer; }
          .rdg-header-row { background: var(--rdg-header-background-color); border-bottom: 1px solid #e5e7eb; }
          .rdg-header-cell { border-right: 1px solid var(--rdg-border-color); padding: 0 !important; }
          .rdg-cell[aria-selected="true"] { outline: 2px solid var(--primary); outline-offset: -2px; z-index: 1; }
          .fill-grid { block-size: 100%; }
          .rdg-cell:first-child { background-color: var(--rdg-header-background-color) !important; border-right: 1px solid var(--rdg-border-color) !important; }
          .rdg-header-cell:first-child { background: var(--rdg-header-background-color) !important; border-right: 1px solid var(--rdg-border-color) !important; }
          .rdg-row { transition: background-color 0.1s; }
        `}</style>

      </div>
    </TooltipProvider>
  );
}