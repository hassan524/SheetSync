"use client";

import {
  useState, useCallback, useMemo, useRef, useEffect, startTransition,
} from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import DataGrid, { Column, RenderCellProps, RenderEditCellProps } from "react-data-grid";
import "react-data-grid/lib/styles.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  ArrowLeft, Check, Loader2, Download, Share2, Star, CheckSquare, Square, GripVertical,
  Calendar, Plus, Trash2, Undo2, Redo2, WrapText, Copy, Scissors, Clipboard, Lock, Unlock,
  FileSpreadsheet, Users, MessageSquare, History, ChevronDown, Filter, Search, Settings2,
  Zap, Eye, Bell, Clock, ChevronRight, X, Send, MoreHorizontal, Sparkles, BarChart3, Code2,
  Webhook, KeyRound, Maximize2, Sun, Moon, Globe, RefreshCw, Keyboard, AlignLeft, AlignCenter,
  AlignRight, ArrowDownAZ, ArrowUpAZ, Paintbrush, Printer, Type, Snowflake, SlidersHorizontal,
  Sigma, Hash, Percent, Play, TableProperties, Layers, Activity,
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
import { getTemplateData, STATUS_COLORS } from "@/lib/sheet-templates";
import { updateSheetTitle, updateSheetStarred } from "@/lib/querys/sheet/sheet";
import { saveRow, saveAllRows, deleteRows } from "@/lib/querys/sheet/rows";
import { saveAllColumns, deleteColumn } from "@/lib/querys/sheet/columns";
import { saveCellFormat } from "@/lib/querys/sheet/format";
import { saveFormula, deleteFormula, saveColumnFormula, deleteColumnFormula } from "@/lib/querys/sheet/formulas";
import { protectCell, unprotectCell } from "@/lib/querys/sheet/protection";
import PlaybackModal from "./panels/Playback-panel";
import KeyboardShortcutsDialog from "./dialogs/Keyboard-shortcuts-dialog";
import ShareDialog from "./dialogs/Share-dialog";
import RightPanel from "./Right-panel";
import { loadSheet } from "@/lib/querys/sheet/sheet";
import { exportSheet, ExportFormat } from "@/lib/querys/export";
import { FORMULA_REFERENCE } from "@/data/formulaRefrence";
import { getSheetOrgMembers, type OrgMember } from "@/lib/querys/organization/get-sheet-members";
import { supabase } from "@/lib/supabase/client";
import {
  subscribeToHistory, subscribeToComments, addComment, resolveComment,
  logCellEdit, logRowAdd, logRowDelete, logColAdd, logColDelete,
  logFormulaSet, logColumnRename, type HistoryEntry, type SheetComment,
} from "@/lib/querys/sheet/firebase-realtime";
import "@/app/sheet.css"

// ── Member helpers ──────────────────────────────────────────────────────────
const MEMBER_COLORS = ["#0d7c5f", "#f59e0b", "#10b981", "#ef4444", "#6366f1", "#ec4899", "#14b8a6", "#f97316", "#8b5cf6", "#06b6d4"];
const getMemberColor = (id: string) => MEMBER_COLORS[Math.abs([...id].reduce((h, c) => c.charCodeAt(0) + ((h << 5) - h), 0)) % MEMBER_COLORS.length];
const getMemberInitials = (name: string) => { const p = name.trim().split(" "); return p.length === 1 ? p[0][0].toUpperCase() : (p[0][0] + p[p.length - 1][0]).toUpperCase(); };

// ── Types ───────────────────────────────────────────────────────────────────
type RightPanelType = "comments" | "history" | "collaborators" | "developer" | null;
interface SheetState {
  title: string; isOrgSheet: boolean; liveTracking: boolean;
  createdAt: string | null; updatedAt: string | null; ownerId: string | null;
  size: string | null; starred: boolean; rows: SheetRow[]; columns: ColumnDef[];
}

// ── Small UI components ─────────────────────────────────────────────────────
function CommentDot({ count }: { count: number }) {
  return (
    <div className="sheet-comment-dot absolute top-0 right-0 z-10" style={{ width: 0, height: 0, borderLeft: "8px solid transparent", borderTop: "8px solid #f59e0b" }}>
      {count > 1 && <span className="absolute -top-4 -right-0.5 text-[7px] text-white font-bold leading-none" style={{ textShadow: "0 1px 2px rgba(0,0,0,.4)" }}>{count}</span>}
    </div>
  );
}

function CollabCursor({ name, color }: { name: string; color: string }) {
  return (
    <div className="absolute -top-5 left-0 z-50 pointer-events-none flex items-center gap-1">
      <div className="w-0.5 h-5 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-[10px] font-semibold text-white px-1.5 py-0.5 rounded whitespace-nowrap" style={{ backgroundColor: color, boxShadow: `0 1px 4px ${color}55` }}>{name.split(" ")[0]}</span>
    </div>
  );
}

function IconBtn({ icon: Icon, tooltip, onClick, active, disabled, shortcut, danger = false, badge }: {
  icon: any; tooltip: string; onClick?: () => void; active?: boolean; disabled?: boolean; shortcut?: string; danger?: boolean; badge?: number;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button onClick={onClick} disabled={disabled} className={`sheet-icon-btn relative flex items-center justify-center h-7 w-7 rounded-md transition-all duration-100 ${active ? "sheet-icon-btn--active" : ""} ${danger ? "sheet-icon-btn--danger" : ""} ${disabled ? "opacity-35 cursor-not-allowed" : "cursor-pointer"}`}>
          <Icon className="h-3.5 w-3.5" />
          {badge != null && badge > 0 && <span className="sheet-badge absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full text-[8px] font-bold flex items-center justify-center text-white" style={{ backgroundColor: danger ? "#ef4444" : "var(--primary)" }}>{badge > 9 ? "9+" : badge}</span>}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="sheet-tooltip text-[11px] flex items-center gap-2">
        {tooltip}{shortcut && <kbd className="sheet-kbd">{shortcut}</kbd>}
      </TooltipContent>
    </Tooltip>
  );
}

function ToolSep() { return <div className="sheet-tool-sep mx-1 h-5 w-px self-center" />; }

// ── Dropdown style helper ───────────────────────────────────────────────────
const ddStyle = (dark: boolean) => ({
  background: dark ? "#131620" : "#ffffff",
  border: `1px solid ${dark ? "#1e2330" : "#e8eaed"}`,
  color: dark ? "#e2e8f0" : "#1a1d23",
});
const ddItemStyle = (dark: boolean) => ({ color: dark ? "#e2e8f0" : "#1a1d23" });

// ── Formula Dialog ──────────────────────────────────────────────────────────
function FormulaDialog({ open, onClose, onInsert }: { open: boolean; onClose: () => void; onInsert: (f: string) => void; }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<(typeof FORMULA_REFERENCE)[0] | null>(null);
  const filtered = FORMULA_REFERENCE.filter(f => f.name.toLowerCase().includes(search.toLowerCase()) || f.category.toLowerCase().includes(search.toLowerCase()) || f.description.toLowerCase().includes(search.toLowerCase()));
  const categories = [...new Set(filtered.map(f => f.category))];
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl sheet-dialog">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold flex items-center gap-2"><Sigma className="h-4 w-4 text-primary" /> Formula Reference</DialogTitle>
          <DialogDescription className="text-xs text-gray-500">Type a formula into any cell starting with <code>=</code>. Click a formula to see details and insert it.</DialogDescription>
        </DialogHeader>
        <div className="relative mb-3">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search formulas…" className="w-full h-8 pl-8 pr-3 text-xs rounded-md border border-gray-200 bg-gray-50 outline-none focus:border-primary focus:bg-white" />
        </div>
        <div className="flex gap-3 h-72">
          <div className="w-48 overflow-y-auto border rounded-md">
            {categories.map(cat => (
              <div key={cat}>
                <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400 bg-gray-50 border-b sticky top-0">{cat}</div>
                {filtered.filter(f => f.category === cat).map(f => (
                  <button key={f.name} onClick={() => setSelected(f)} className={`w-full text-left px-2.5 py-1.5 text-[11px] font-mono border-b transition-colors ${selected?.name === f.name ? "bg-primary/10 text-primary font-semibold" : "hover:bg-gray-50 text-gray-700"}`}>{f.name}</button>
                ))}
              </div>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto">
            {selected ? (
              <div className="space-y-3 p-1">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-gray-900">{selected.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-medium">{selected.category}</span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">{selected.description}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Syntax</p>
                  <code className="block text-xs bg-gray-900 text-green-400 px-3 py-2 rounded font-mono">{selected.syntax}</code>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Example</p>
                  <code className="block text-xs bg-blue-50 text-blue-700 px-3 py-2 rounded font-mono border border-blue-100">{selected.example}</code>
                </div>
                <div className="bg-amber-50 border border-amber-100 rounded-md p-2.5">
                  <p className="text-[10px] font-semibold text-amber-700 mb-0.5">💡 How to use</p>
                  <p className="text-[11px] text-amber-800 leading-relaxed">Select a cell, type <code className="bg-amber-100 px-1 rounded">= </code> followed by the formula above.</p>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-300 gap-2">
                <Sigma className="h-8 w-8" /><p className="text-xs">Select a formula to see details</p>
              </div>
            )}
          </div>
        </div>
        <DialogFooter className="flex items-center gap-2 pt-2 border-t">
          <p className="text-[10px] text-gray-400 flex-1">Formulas update automatically when referenced cells change.</p>
          <button onClick={onClose} className="text-xs px-3 py-1.5 rounded border border-gray-200 hover:bg-gray-50 transition-colors">Close</button>
          {selected && <button onClick={() => { onInsert(selected.example); onClose(); }} className="text-xs px-3 py-1.5 rounded bg-primary text-white hover:opacity-90 transition-opacity font-medium">Insert example</button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function SheetClient() {
  const params = useParams<{ id?: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const templateId = searchParams?.get("template") || "blank";
  const isOrganizationSheet = searchParams?.get("org") === "true";
  const sheetId = params?.id ?? "";

  const [sheetState, setSheetState] = useState<SheetState>({
    title: "", isOrgSheet: isOrganizationSheet, liveTracking: isOrganizationSheet,
    createdAt: null, updatedAt: null, ownerId: null, size: null,
    starred: false, rows: [], columns: [],
  });
  const { title, isOrgSheet, liveTracking, starred, rows, columns } = sheetState;

  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: string } | null>(null);
  const [rightPanel, setRightPanel] = useState<RightPanelType>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [showPlayback, setShowPlayback] = useState(false);
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [filterValue, setFilterValue] = useState("");
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showFormulaDialog, setShowFormulaDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [fontSize, setFontSize] = useState("10");
  const [fontFamily, setFontFamily] = useState("Arial");
  const [zoomLevel, setZoomLevel] = useState(100);
  const [orgMembers, setOrgMembers] = useState<OrgMember[]>([]);
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; email: string; avatar_url: string | null } | null>(null);
  const [activeCursors, setActiveCursors] = useState<Record<string, { name: string; color: string; row: number; col: string }>>({});
  const presenceChannelRef = useRef<any>(null);
  const [comments, setComments] = useState<Record<string, SheetComment[]>>({});
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [activeCommentCell, setActiveCommentCell] = useState<string | null>(null);
  const [newCommentText, setNewCommentText] = useState("");
  const [replyText, setReplyText] = useState<Record<string, string>>({});

  const rowsHistory = useHistory<SheetRow[]>([]);
  const columnsHistory = useHistory<ColumnDef[]>([]);
  const titleSaveTimeout = useRef<NodeJS.Timeout | undefined>(undefined);
  const rowSaveTimeout = useRef<NodeJS.Timeout | undefined>(undefined);
  const columnResizeTimeout = useRef<NodeJS.Timeout | undefined>(undefined);
  const playbackTimer = useRef<NodeJS.Timeout | undefined>(undefined);

  const formatting = useSheetFormatting(() => { });
  const textWrap = useTextWrap(rows, () => { });
  const clipboard = useClipboard(rows, rowsHistory, () => { });
  const protection = useProtectedCells(() => { });
  const rowOps = useRowOperations(rows, columns, rowsHistory, () => { });
  const colOps = useColumnOperations(rows, columns, columnsHistory, rowsHistory, () => { });
  const cellTypes = useCellTypes(rows, rowsHistory, () => { });
  const formulas = useFormulas(rows, columns);

  useEffect(() => { startTransition(() => setSheetState(p => ({ ...p, rows: rowsHistory.currentState }))); }, [rowsHistory.currentState]);
  useEffect(() => { startTransition(() => setSheetState(p => ({ ...p, columns: columnsHistory.currentState }))); }, [columnsHistory.currentState]);

  const effectiveRightPanel = useMemo((): RightPanelType => {
    if (!isOrgSheet && (rightPanel === "comments" || rightPanel === "collaborators")) return null;
    return rightPanel;
  }, [isOrgSheet, rightPanel]);

  // ── Load sheet ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!sheetId) return;
    queueMicrotask(() => setIsLoading(true));
    loadSheet(sheetId).then(async data => {
      if (data.rows.length > 0 || data.columns.length > 0) {
        const sheetIsOrg = data.isPersonal === false || isOrganizationSheet;
        let wrapSet = new Set<string>();
        if (data.cellFormats) wrapSet = new Set<string>(Object.entries(data.cellFormats).filter(([, fmt]) => (fmt as any).textWrap === true).map(([k]) => k));
        if (data.cellFormats && Object.keys(data.cellFormats).length > 0) formatting.setCellFormats(data.cellFormats);
        if (data.formulas && Object.keys(data.formulas).length > 0) formulas.setFormulas(data.formulas);
        if (data.columnFormulas && Object.keys(data.columnFormulas).length > 0) formulas.setColumnFormulas(data.columnFormulas);
        if (data.protectedCells && data.protectedCells.size > 0) protection.setProtectedCells(data.protectedCells);
        if (wrapSet.size > 0) textWrap.setTextWrapColumns(wrapSet);
        rowsHistory.pushState(data.rows);
        columnsHistory.pushState(data.columns);
        setSheetState({ title: data.title, isOrgSheet: sheetIsOrg, liveTracking: sheetIsOrg, createdAt: data.created_at, updatedAt: data.updated_at, ownerId: data.ownerId, size: data.size, starred: data.isStarred, rows: data.rows, columns: data.columns });
      } else {
        const td = getTemplateData(templateId);
        rowsHistory.pushState(td.rows); columnsHistory.pushState(td.columns);
        setSheetState(p => ({ ...p, title: data.title || td.title, starred: false, rows: td.rows, columns: td.columns }));
        await Promise.all([saveAllRows(sheetId, td.rows), saveAllColumns(sheetId, td.columns)]);
      }
    }).catch(err => { console.error(err); toast.error("Failed to load sheet. Please refresh."); }).finally(() => setIsLoading(false));
  }, [sheetId]);

  useEffect(() => { supabase.auth.getUser().then(({ data }) => { if (data?.user) setCurrentUser({ id: data.user.id, name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || data.user.email?.split("@")[0] || "You", email: data.user.email || "", avatar_url: data.user.user_metadata?.avatar_url || null }); }); }, []);

  useEffect(() => {
    if (!sheetId || !isOrgSheet) { setOrgMembers([]); return; }
    getSheetOrgMembers(sheetId).then(data => { if (data) setOrgMembers(data.members); }).catch(console.error);
  }, [sheetId, isOrgSheet]);

  useEffect(() => { setPlaybackIndex(0); }, [history.length]);
  useEffect(() => { if (!sheetId) return; return subscribeToHistory(sheetId, setHistory); }, [sheetId]);
  useEffect(() => { if (!sheetId) return; return subscribeToComments(sheetId, grouped => setComments(grouped)); }, [sheetId]);

  useEffect(() => {
    if (!sheetId || !isOrgSheet || !currentUser) return;
    const ch = supabase.channel(`sheet-cursors:${sheetId}`, { config: { presence: { key: currentUser.id } } });
    ch.on("presence", { event: "sync" }, () => {
      const state = ch.presenceState<{ name: string; color: string; row: number; col: string }>();
      const cursors: typeof activeCursors = {};
      Object.entries(state).forEach(([uid, ps]) => { if (uid !== currentUser.id && ps[0]) cursors[uid] = ps[0]; });
      setActiveCursors(cursors);
    }).subscribe(status => { if (status === "SUBSCRIBED") presenceChannelRef.current = ch; });
    return () => { supabase.removeChannel(ch); presenceChannelRef.current = null; };
  }, [sheetId, isOrgSheet, currentUser]);

  useEffect(() => {
    if (!presenceChannelRef.current || !currentUser || !selectedCell) return;
    presenceChannelRef.current.track({ name: currentUser.name, color: getMemberColor(currentUser.id), row: selectedCell.row, col: selectedCell.col });
  }, [selectedCell, currentUser]);

  const markSaving = useCallback(() => setSaveStatus("saving"), []);
  const markSaved = useCallback(() => setSaveStatus("saved"), []);

  const handleTitleChange = useCallback((t: string) => {
    setSheetState(p => ({ ...p, title: t })); markSaving();
    clearTimeout(titleSaveTimeout.current);
    titleSaveTimeout.current = setTimeout(async () => { await updateSheetTitle(sheetId, t); markSaved(); }, 1000);
  }, [sheetId, markSaving, markSaved]);

  const handleStarredToggle = useCallback(async () => {
    setSheetState(p => { const n = !p.starred; updateSheetStarred(sheetId, n); return { ...p, starred: n }; });
  }, [sheetId]);

  const handleSaveChangedRow = useCallback((updated: SheetRow[], prev: SheetRow[]) => {
    const changed = updated.find((r, i) => !prev[i] || JSON.stringify(r) !== JSON.stringify(prev[i]));
    if (!changed) return;
    markSaving(); clearTimeout(rowSaveTimeout.current);
    rowSaveTimeout.current = setTimeout(async () => { await saveRow(sheetId, changed, updated.indexOf(changed)); markSaved(); }, 800);
  }, [sheetId, markSaving, markSaved]);

  const handleFormatChange = useCallback(async (format: any) => {
    if (!selectedCell) return;
    formatting.applyFormat(selectedCell, format);
    const merged = { ...formatting.getCurrentCellFormat(selectedCell), ...format };
    const cellKey = `${selectedCell.row}-${selectedCell.col}`;
    markSaving(); await saveCellFormat(sheetId, cellKey, merged); markSaved();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCell, sheetId, markSaving, markSaved, formatting.applyFormat, formatting.getCurrentCellFormat]);

  const handlePaste = useCallback(async () => {
    clipboard.pasteCellOrRange(selectedCell);
    setTimeout(async () => { try { markSaving(); await saveAllRows(sheetId, rowsHistory.currentState); markSaved(); } catch { toast.error("Paste saved locally but failed to persist."); setSaveStatus("saved"); } }, 50);
  }, [clipboard.pasteCellOrRange, selectedCell, sheetId, rowsHistory.currentState, markSaving, markSaved]);

  const handleProtectionToggle = useCallback(async () => {
    if (!selectedCell) return;
    const k = protection.getCellKey(selectedCell.row, selectedCell.col);
    const isProt = protection.isCellProtected(selectedCell.row, selectedCell.col);
    protection.toggleProtectCell(selectedCell); markSaving();
    if (isProt) await unprotectCell(sheetId, k); else await protectCell(sheetId, k);
    markSaved();
  }, [selectedCell, protection.getCellKey, protection.isCellProtected, protection.toggleProtectCell, sheetId, markSaving, markSaved]);

  useKeyboardShortcuts({ selectedCell, rowsHistory, getCurrentCellFormat: formatting.getCurrentCellFormat, applyFormat: formatting.applyFormat, copyCellOrRange: clipboard.copyCellOrRange, pasteCellOrRange: handlePaste, cutCellOrRange: clipboard.cutCellOrRange });

  const handleInsertRow = useCallback(async () => {
    rowOps.insertRow();
    setTimeout(async () => { try { markSaving(); await saveAllRows(sheetId, rowsHistory.currentState); markSaved(); if (isOrgSheet) logRowAdd(sheetId, rowsHistory.currentState.length); } catch { toast.error("Row added locally but failed to persist."); setSaveStatus("saved"); } }, 50);
  }, [rowOps.insertRow, sheetId, rowsHistory.currentState, markSaving, markSaved, isOrgSheet]);

  const handleDeleteRow = useCallback(async () => {
    if (selectedRows.size === 0) return;
    const keys = Array.from(selectedRows); const count = selectedRows.size;
    rowOps.deleteRow(selectedRows); setSelectedRows(new Set());
    try { markSaving(); await deleteRows(sheetId, keys); setTimeout(async () => { await saveAllRows(sheetId, rowsHistory.currentState); markSaved(); if (isOrgSheet) logRowDelete(sheetId, count); }, 50); }
    catch { toast.error("Row deleted locally but failed to persist."); setSaveStatus("saved"); }
  }, [selectedRows, rowOps.deleteRow, sheetId, rowsHistory.currentState, markSaving, markSaved, isOrgSheet]);

  const handleInsertColumn = useCallback(async (type: ColumnDef["type"]) => {
    colOps.insertColumn(type);
    setTimeout(async () => {
      markSaving(); await Promise.all([saveAllColumns(sheetId, columnsHistory.currentState), saveAllRows(sheetId, rowsHistory.currentState)]); markSaved();
      if (isOrgSheet) { const nc = columnsHistory.currentState[columnsHistory.currentState.length - 1]; logColAdd(sheetId, nc?.name ?? "Column", type ?? "text"); }
    }, 50);
  }, [colOps.insertColumn, sheetId, columnsHistory.currentState, rowsHistory.currentState, markSaving, markSaved, isOrgSheet]);

  const handleDeleteColumn = useCallback(async (colKey: string) => {
    const colName = columns.find(c => c.key === colKey)?.name ?? colKey;
    colOps.deleteColumn(colKey); markSaving(); await deleteColumn(sheetId, colKey);
    setTimeout(async () => { await Promise.all([saveAllColumns(sheetId, columnsHistory.currentState), saveAllRows(sheetId, rowsHistory.currentState)]); markSaved(); if (isOrgSheet) logColDelete(sheetId, colName); }, 50);
  }, [colOps.deleteColumn, sheetId, columnsHistory.currentState, rowsHistory.currentState, markSaving, markSaved, columns, isOrgSheet]);

  const handleChangeColumnType = useCallback(async (colKey: string, newType: ColumnDef["type"]) => {
    colOps.changeColumnType(colKey, newType);
    setTimeout(async () => { markSaving(); await Promise.all([saveAllColumns(sheetId, columnsHistory.currentState), saveAllRows(sheetId, rowsHistory.currentState)]); markSaved(); }, 50);
  }, [colOps.changeColumnType, sheetId, columnsHistory.currentState, rowsHistory.currentState, markSaving, markSaved]);

  const handleColumnDragEnd = useCallback(async () => {
    colOps.handleColumnDragEnd();
    setTimeout(async () => { markSaving(); await saveAllColumns(sheetId, columnsHistory.currentState); markSaved(); }, 50);
  }, [colOps.handleColumnDragEnd, sheetId, columnsHistory.currentState, markSaving, markSaved]);

  const handleColumnResize = useCallback((colKey: string, width: number) => {
    colOps.handleColumnResize(colKey, width, (updater: React.SetStateAction<ColumnDef[]>) => {
      setSheetState(p => ({ ...p, columns: typeof updater === "function" ? updater(p.columns) : updater }));
    });
    clearTimeout(columnResizeTimeout.current);
    columnResizeTimeout.current = setTimeout(async () => { markSaving(); await saveAllColumns(sheetId, columnsHistory.currentState); markSaved(); }, 500);
  }, [colOps.handleColumnResize, sheetId, columnsHistory.currentState, markSaving, markSaved]);

  const handleTextWrapToggle = useCallback(async () => {
    if (!selectedCell) return;
    const cellKey = `${selectedCell.row}-${selectedCell.col}`;
    const newWrapSet = new Set(textWrap.textWrapColumns);
    if (newWrapSet.has(cellKey)) newWrapSet.delete(cellKey); else newWrapSet.add(cellKey);
    textWrap.toggleTextWrap(cellKey);
    setTimeout(async () => { try { markSaving(); await saveCellFormat(sheetId, cellKey, { ...formatting.getCurrentCellFormat(selectedCell), textWrap: newWrapSet.has(cellKey) }); markSaved(); } catch { toast.error("Text wrap failed to save."); setSaveStatus("saved"); } }, 50);
  }, [selectedCell, textWrap.textWrapColumns, textWrap.toggleTextWrap, sheetId, formatting.getCurrentCellFormat, markSaving, markSaved]);

  const handleExport = useCallback(async (format: ExportFormat) => {
    const id = toast.loading(`Preparing ${format.toUpperCase()} export…`);
    try { await exportSheet({ format, sheetId }); toast.success(`Downloaded as ${format.toUpperCase()}`, { id }); }
    catch { toast.error("Export failed. Please try again.", { id }); }
  }, [sheetId]);

  const handleSort = useCallback((dir: "asc" | "desc") => {
    if (!selectedCell) { toast.info("Select a column first to sort"); return; }
    const sorted = [...rows].sort((a, b) => { const va = String(a[selectedCell.col] ?? ""); const vb = String(b[selectedCell.col] ?? ""); return dir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va); });
    rowsHistory.pushState(sorted); toast.success(`Sorted ${dir === "asc" ? "A → Z" : "Z → A"}`);
  }, [selectedCell, rows, rowsHistory.pushState]);

  const handleFontFamilyChange = useCallback((f: string) => { setFontFamily(f); if (selectedCell) handleFormatChange({ fontFamily: f }); }, [selectedCell, handleFormatChange]);
  const handleFontSizeChange = useCallback((s: string) => { setFontSize(s); if (selectedCell) handleFormatChange({ fontSize: Number(s) }); }, [selectedCell, handleFormatChange]);
  const handleZoomChange = useCallback((z: number) => setZoomLevel(Math.max(50, Math.min(200, z))), []);

  const handleFormulaInsert = useCallback(async (example: string) => {
    if (!selectedCell) { toast.info("Select a cell first, then insert formula"); return; }
    const cellKey = `${selectedCell.row}-${selectedCell.col}`;
    formulas.setFormulas(p => ({ ...p, [cellKey]: example })); markSaving(); await saveFormula(sheetId, cellKey, example);
    if (isOrgSheet) { const cl = String.fromCharCode(65 + columns.findIndex(c => c.key === selectedCell.col)); logFormulaSet(sheetId, `${cl}${selectedCell.row + 1}`, example); }
    markSaved(); toast.success("Formula inserted — edit as needed");
  }, [selectedCell, formulas.setFormulas, sheetId, markSaving, markSaved, isOrgSheet, columns]);

  const handleApplyFormulaToColumn = useCallback(async (columnKey: string, formula: string) => {
    if (!formula.startsWith("=")) { toast.error("Formula must start with ="); return; }
    formulas.setColumnFormulas(p => ({ ...p, [columnKey]: formula })); markSaving(); await saveColumnFormula(sheetId, columnKey, formula); markSaved();
    toast.success(`Formula applied to entire "${columnKey}" column`);
  }, [formulas.setColumnFormulas, sheetId, markSaving, markSaved]);

  const handleRemoveColumnFormula = useCallback(async (columnKey: string) => {
    formulas.setColumnFormulas(p => { const n = { ...p }; delete n[columnKey]; return n; });
    markSaving(); await deleteColumnFormula(sheetId, columnKey); markSaved(); toast.success("Column formula removed");
  }, [formulas.setColumnFormulas, sheetId, markSaving, markSaved]);

  const groupedCommentsForPanel = useMemo(() => {
    const result: Record<string, any[]> = {};
    Object.entries(comments).forEach(([cellKey, cellComments]) => {
      const roots = cellComments.filter(c => !c.parentId);
      const replies = cellComments.filter(c => c.parentId);
      result[cellKey] = roots.map(root => ({ ...root, cellKey, thread: replies.filter(r => r.parentId === root.id).map(r => ({ author: r.author, color: r.authorColor, text: r.text, createdAt: r.createdAt, timestamp: r.createdAt ? new Date(r.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "just now" })) }));
    });
    return result;
  }, [comments]);

  const handleAddComment = useCallback(async (cellKey: string) => {
    if (!newCommentText.trim()) return;
    await addComment({ sheetId, cellKey, userId: "local", author: "You", authorColor: "#0d7c5f", text: newCommentText.trim(), parentId: null });
    setNewCommentText(""); toast.success("Comment added");
  }, [newCommentText, sheetId]);

  const handleReply = useCallback(async (cellKey: string, commentId: string) => {
    const text = replyText[commentId]; if (!text?.trim()) return;
    await addComment({ sheetId, cellKey, userId: "local", author: "You", authorColor: "#0d7c5f", text: text.trim(), parentId: commentId });
    setReplyText(p => ({ ...p, [commentId]: "" }));
  }, [replyText, sheetId]);

  const handleResolveComment = useCallback(async (_cellKey: string, commentId: string) => { await resolveComment(commentId); toast.success("Comment resolved"); }, []);

  const getCellComments = useCallback((rowIdx: number, colKey: string) => { if (!isOrgSheet) return []; return comments[`${rowIdx}-${colKey}`] || []; }, [comments, isOrgSheet]);

  const toggleRightPanel = useCallback((panel: RightPanelType) => {
    if (!isOrgSheet && (panel === "comments" || panel === "collaborators")) return;
    setRightPanel(p => p === panel ? null : panel);
  }, [isOrgSheet]);

  const isPlayingRef = useRef(false);
  const handleSetIsPlaying = useCallback((playing: boolean) => {
    isPlayingRef.current = playing; setIsPlaying(playing);
    if (playing) {
      playbackTimer.current = setInterval(() => {
        setPlaybackIndex(i => { const n = i + 1; if (n >= history.length) { isPlayingRef.current = false; setIsPlaying(false); clearInterval(playbackTimer.current); return i; } return n; });
      }, 800);
    } else clearInterval(playbackTimer.current);
  }, [history.length]);

  // ── Cell renderer ─────────────────────────────────────────────────────────
  const renderCellByType = useCallback((type: ColumnDef["type"], props: RenderCellProps<SheetRow>, colKey: string) => {
    const { row } = props;
    const rowIdx = rows.findIndex(r => r.id === row.id);
    const cellStyle = formatting.getCellStyle(rowIdx, colKey, textWrap.textWrapColumns);
    const cellKey = protection.getCellKey(rowIdx, colKey);
    const formula = formulas.getFormula(rowIdx, colKey);
    const isProtected = protection.isCellProtected(rowIdx, colKey);
    const cellComments = getCellComments(rowIdx, colKey);
    const commentKey = `${rowIdx}-${colKey}`;
    const isWrapped = textWrap.textWrapColumns.has(`${rowIdx}-${colKey}`);
    const activeCollabEntry = Object.values(activeCursors).find(c => c.row === rowIdx && c.col === colKey);
    const activeCollab = activeCollabEntry ? { name: activeCollabEntry.name, color: activeCollabEntry.color } : null;
    let displayValue = row[colKey];
    if (formula?.startsWith("=")) displayValue = formulas.evaluateFormula(formula, rowIdx);

    const cellContent = (() => {
      switch (type) {
        case "status": case "priority": {
          const val = String(displayValue ?? "").trim().toLowerCase();
          const opt = Object.entries(STATUS_COLORS).find(([k]) => k.toLowerCase() === val)?.[1];
          if (!opt) return <span className="sheet-cell-text">{displayValue}</span>;
          return <span className="sheet-badge-pill" style={{ color: opt.color, backgroundColor: opt.bgColor }}>{opt.label}</span>;
        }
        case "checkbox": return displayValue ? <CheckSquare className="h-3.5 w-3.5 text-primary" /> : <Square className="h-3.5 w-3.5 text-gray-300" />;
        case "date": return displayValue ? <div className="flex items-center gap-1.5"><Calendar className="h-3 w-3 text-gray-400" /><span className="sheet-cell-text">{String(displayValue)}</span></div> : null;
        case "currency": return displayValue ? <span className="tabular-nums sheet-cell-mono">${Number(displayValue).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span> : "";
        case "url": return displayValue ? <a href={String(displayValue)} target="_blank" rel="noopener noreferrer" className="sheet-link truncate">{String(displayValue)}</a> : null;
        case "progress": {
          const pct = Math.min(100, Math.max(0, Number(displayValue ?? 0)));
          const color = pct >= 80 ? "#166534" : pct >= 50 ? "#b45309" : pct >= 20 ? "#1d4ed8" : "#6b7280";
          const bg = pct >= 80 ? "#dcfce7" : pct >= 50 ? "#fef3c7" : pct >= 20 ? "#dbeafe" : "#f3f4f6";
          return <div className="flex items-center gap-2 w-full px-1"><div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden"><div className="h-full rounded-full transition-all duration-300" style={{ width: `${pct}%`, backgroundColor: color }} /></div><span className="text-[10.5px] font-semibold tabular-nums shrink-0 px-1.5 py-0.5 rounded" style={{ color, backgroundColor: bg }}>{pct}%</span></div>;
        }
        case "number": return displayValue !== undefined ? <span className="truncate sheet-cell-text tabular-nums">{String(displayValue)}</span> : "";
        default: return displayValue !== undefined ? <span className={isWrapped ? "sheet-cell-text break-words whitespace-pre-wrap w-full" : "truncate sheet-cell-text"}>{String(displayValue)}</span> : "";
      }
    })();

    return (
      <div className={`h-full w-full flex relative group/cell ${isWrapped ? "items-start pt-1.5" : "items-center"} ${type === "currency" || type === "number" ? "justify-end" : ""} ${type === "checkbox" ? "justify-center" : ""} px-2.5 py-1 gap-1.5`}
        style={{ color: "inherit", ...cellStyle, ...(activeCollab ? { outline: `2px solid ${activeCollab.color}`, outlineOffset: "-2px" } : {}) }}
        onClick={() => { setSelectedCell({ row: rowIdx, col: colKey }); setActiveCommentCell(`${rowIdx}-${colKey}`); }}>
        {isProtected && <Lock className="absolute top-1 right-1 h-2 w-2 text-gray-300 opacity-0 group-hover/cell:opacity-60 transition-opacity" />}
        {isOrgSheet && cellComments.length > 0 && <CommentDot count={cellComments.length} />}
        {activeCollab && <CollabCursor name={activeCollab.name} color={activeCollab.color} />}
        {cellContent}
        {isOrgSheet && <button className="absolute bottom-0.5 right-0.5 opacity-0 group-hover/cell:opacity-100 transition-opacity duration-100" onClick={e => { e.stopPropagation(); setActiveCommentCell(commentKey); setRightPanel("comments"); }}>
          <MessageSquare className="h-2.5 w-2.5 text-gray-300 hover:text-amber-500 transition-colors" />
        </button>}
      </div>
    );
  }, [rows, columns, isOrgSheet, liveTracking, comments, formatting.getCellStyle, formatting.getCurrentCellFormat, textWrap.textWrapColumns, protection.getCellKey, protection.isCellProtected, formulas.formulas, formulas.columnFormulas, formulas.evaluateFormula, formulas.getFormula, getCellComments, activeCursors]);

  const handleRowsChange = useCallback((updatedRows: SheetRow[]) => {
    const prev = rows; rowsHistory.pushState(updatedRows); handleSaveChangedRow(updatedRows, prev);
    updatedRows.forEach((row, rowIdx) => {
      const prevRow = prev[rowIdx]; if (!prevRow) return;
      columns.forEach(col => { const o = prevRow[col.key]; const n = row[col.key]; if (o !== n) { const cl = String.fromCharCode(65 + columns.findIndex(c => c.key === col.key)); logCellEdit(sheetId, `${cl}${rowIdx + 1}`, col.name, o ?? null, n ?? null); } });
    });
  }, [rows, columns, rowsHistory.pushState, handleSaveChangedRow, sheetId, isOrgSheet]);

  // ── Grid columns ──────────────────────────────────────────────────────────
  const gridColumns = useMemo<Column<SheetRow>[]>(() => {
    const rowNumberCol: Column<SheetRow> = {
      key: "row-number", name: "", width: 46, frozen: true, resizable: false,
      renderHeaderCell: () => (
        <div className="h-full w-full flex items-center justify-center sheet-header-cell border-r">
          <input type="checkbox" className="h-3.5 w-3.5 rounded border-gray-300 cursor-pointer" style={{ accentColor: "var(--primary)" }}
            checked={selectedRows.size === rows.length && rows.length > 0} onChange={e => setSelectedRows(e.target.checked ? new Set(rows.map(r => r.id)) : new Set())} />
        </div>
      ),
      renderCell(props: RenderCellProps<SheetRow>) {
        const rowIdx = rows.findIndex(r => r.id === props.row.id); const isSel = selectedRows.has(props.row.id);
        return (
          <div className={`h-full w-full flex items-center justify-center sheet-row-num border-r group/rownum ${isSel ? "sheet-row-num--selected" : ""}`}>
            <span className={`${isSel ? "hidden" : "group-hover/rownum:hidden"} sheet-row-num-text`}>{rowIdx + 1}</span>
            <input type="checkbox" className={`h-3.5 w-3.5 rounded border-gray-300 cursor-pointer ${isSel ? "" : "hidden group-hover/rownum:block"}`} style={{ accentColor: "var(--primary)" }} checked={isSel}
              onChange={e => { const s = new Set(selectedRows); e.target.checked ? s.add(props.row.id) : s.delete(props.row.id); setSelectedRows(s); }} />
          </div>
        );
      },
    };

    const dataCols = columns.map((col): Column<SheetRow> => ({
      key: col.key, name: col.name, width: col.width || 160, resizable: true,
      renderHeaderCell: () => (
        <div className="h-full w-full flex items-center gap-1.5 px-2.5 group/header sheet-header-cell border-r cursor-pointer" draggable
          onDragStart={() => colOps.handleColumnDragStart(col.key)}
          onDragOver={e => colOps.handleColumnDragOver(e, col.key, (u: React.SetStateAction<ColumnDef[]>) => setSheetState(p => ({ ...p, columns: typeof u === "function" ? u(p.columns) : u })))}
          onDragEnd={handleColumnDragEnd}>
          <GripVertical className="h-3 w-3 text-gray-300 flex-shrink-0 cursor-move opacity-0 group-hover/header:opacity-100 transition-opacity" />
          <span className="flex-1 sheet-col-label truncate">{col.name}</span>
          {[...textWrap.textWrapColumns].some(k => k.endsWith(`-${col.key}`)) && <WrapText className="h-3 w-3 text-primary flex-shrink-0 opacity-60" />}
          <ColumnHeaderMenu column={col} onChangeType={t => handleChangeColumnType(col.key, t)} onDelete={() => handleDeleteColumn(col.key)}
            onRename={newName => { colOps.renameColumn(col.key, newName); setTimeout(async () => { markSaving(); await saveAllColumns(sheetId, columnsHistory.currentState); if (isOrgSheet) logColumnRename(sheetId, col.name, newName); markSaved(); }, 50); }}
            onToggleTextWrap={handleTextWrapToggle} textWrapEnabled={textWrap.textWrapColumns.has(col.key)}
            columnFormula={formulas.columnFormulas[col.key]} onApplyColumnFormula={f => handleApplyFormulaToColumn(col.key, f)} onRemoveColumnFormula={() => handleRemoveColumnFormula(col.key)} />
        </div>
      ),
      renderCell(props: RenderCellProps<SheetRow>) {
        const rowIdx = rows.findIndex(r => r.id === props.row.id);
        return renderCellByType(cellTypes.getCellType(rowIdx, col.key, col.type || "text"), props, col.key);
      },
      renderEditCell(props: RenderEditCellProps<SheetRow>) {
        const { row, column, onRowChange } = props;
        const rowIdx = rows.findIndex(r => r.id === row.id);
        const cellType = cellTypes.getCellType(rowIdx, col.key, col.type || "text");
        const cellStyle = formatting.getCellStyle(rowIdx, column.key, textWrap.textWrapColumns);
        const cellKey = protection.getCellKey(rowIdx, col.key);
        const isTextWrap = textWrap.textWrapColumns.has(col.key);
        const isProtected = protection.isCellProtected(rowIdx, col.key);
        const editVal = formulas.formulas[cellKey] ?? formulas.columnFormulas[col.key] ?? String(row[column.key] ?? "");

        const onTextChange = (v: string) => { if (v.startsWith("=")) formulas.setFormulas(p => ({ ...p, [cellKey]: v })); else { formulas.setFormulas(p => { const n = { ...p }; delete n[cellKey]; return n; }); onRowChange({ ...row, [column.key]: v }); } };
        const onNumChange = (v: string) => { if (v.startsWith("=")) formulas.setFormulas(p => ({ ...p, [cellKey]: v })); else { formulas.setFormulas(p => { const n = { ...p }; delete n[cellKey]; return n; }); const num = v === "" ? 0 : Number(v); if (!isNaN(num)) onRowChange({ ...row, [column.key]: num }); } };
        const onBlurSave = async () => { const f = formulas.formulas[cellKey]; if (f) await saveFormula(sheetId, cellKey, f); else await deleteFormula(sheetId, cellKey).catch(() => { }); };

        if (isProtected) { toast.error("This cell is protected"); return <div className="h-full w-full flex items-center px-2.5 text-xs bg-gray-50 text-gray-400 gap-1.5"><Lock className="h-3 w-3" />Protected</div>; }
        if (cellType === "priority" || cellType === "status") {
          const opts = cellType === "priority" ? PRIORITY_OPTIONS : STATUS_OPTIONS;
          return <Select value={row[column.key] as string} onValueChange={v => onRowChange({ ...row, [column.key]: v })}><SelectTrigger className="h-full border-0 text-xs rounded-none focus:ring-0 focus:ring-offset-0"><SelectValue /></SelectTrigger><SelectContent>{opts.map(o => <SelectItem key={o.value} value={o.value}><span className="sheet-badge-pill" style={{ color: o.color, backgroundColor: o.bgColor }}>{o.label}</span></SelectItem>)}</SelectContent></Select>;
        }
        if (cellType === "date" || col.key === "start" || col.key === "due" || col.key === "date")
          return <input className="w-full h-full px-2.5 text-xs bg-white outline-none border-0" style={cellStyle} type={formulas.formulas[cellKey] ? "text" : "date"} autoFocus value={editVal} onChange={e => onTextChange(e.target.value)} onBlur={onBlurSave} />;
        if (cellType === "checkbox")
          return <div className="h-full flex items-center justify-center cursor-pointer" onClick={() => onRowChange({ ...row, [column.key]: !row[column.key] })}>{row[column.key] ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4 text-gray-300" />}</div>;
        if (cellType === "progress")
          return <input className="w-full h-full px-2.5 text-xs bg-white outline-none border-0 text-right tabular-nums font-mono" style={cellStyle} type="text" autoFocus placeholder="0–100 or =formula" value={editVal} onChange={e => { const v = e.target.value; if (v.startsWith("=")) onNumChange(v); else { const n = v === "" ? 0 : Math.min(100, Math.max(0, Number(v))); if (!isNaN(n)) onRowChange({ ...row, [column.key]: n }); } }} onBlur={onBlurSave} />;
        if (cellType === "number" || cellType === "currency")
          return <input className="w-full h-full px-2.5 text-xs bg-white outline-none border-0 text-right tabular-nums font-mono" style={cellStyle} type="text" autoFocus value={editVal} onChange={e => onNumChange(e.target.value)} onBlur={onBlurSave} />;
        if (isTextWrap)
          return <textarea className="w-full h-full px-2.5 py-2 text-xs bg-white outline-none border-0 resize-none" style={cellStyle} autoFocus value={editVal} onChange={e => onTextChange(e.target.value)} onBlur={onBlurSave} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) e.stopPropagation(); }} />;
        return <input className="w-full h-full px-2.5 text-xs bg-white outline-none border-0" style={cellStyle} autoFocus value={editVal} onChange={e => onTextChange(e.target.value)} onBlur={onBlurSave} />;
      },
    }));

    return [rowNumberCol, ...dataCols];
  }, [columns, rows, selectedRows, textWrap.textWrapColumns, cellTypes.getCellType, formatting.getCellStyle, formulas.formulas, formulas.columnFormulas, formulas.setFormulas, formulas.getFormula, protection.getCellKey, protection.isCellProtected, renderCellByType, handleColumnDragEnd, handleChangeColumnType, handleDeleteColumn, handleTextWrapToggle, sheetId, columnsHistory.currentState, colOps.handleColumnDragStart, colOps.handleColumnDragOver, colOps.renameColumn, markSaving, markSaved, handleApplyFormulaToColumn, handleRemoveColumnFormula, isOrgSheet]);

  const filteredRows = useMemo<SheetRow[]>(() => {
    const q = searchQuery || filterValue; if (!q) return rows;
    return rows.filter(row => columns.some(col => { const v = row[col.key]; return v && String(v).toLowerCase().includes(q.toLowerCase()); }));
  }, [rows, searchQuery, filterValue, columns]);

  const selectedCellType = useMemo(() => {
    if (!selectedCell) return null;
    const col = columns.find(c => c.key === selectedCell.col);
    return col ? cellTypes.getCellType(selectedCell.row, selectedCell.col, col.type || "text") : null;
  }, [selectedCell, columns, cellTypes.getCellType]);

  const isSelectedColumnWrapped = useMemo(() => selectedCell ? textWrap.textWrapColumns.has(`${selectedCell.row}-${selectedCell.col}`) : false, [selectedCell, textWrap.textWrapColumns]);
  const totalComments = useMemo(() => { if (!isOrgSheet) return 0; return Object.values(comments).reduce((a, b) => a + b.filter(c => !c.resolved).length, 0); }, [comments, isOrgSheet]);
  const activeCollaborators = useMemo(() => orgMembers, [orgMembers]);

  // ── Avatar component ──────────────────────────────────────────────────────
  const Avatar = ({ member, showOnline = false }: { member: { id: string; name: string; avatar_url: string | null; email?: string; role?: string }; showOnline?: boolean }) => {
    const color = getMemberColor(member.id);
    return (
      <div className="sheet-avatar h-6 w-6 rounded-full relative border-2 flex-shrink-0 overflow-hidden" style={{ borderColor: "var(--sheet-titlebar-bg)" }}>
        {member.avatar_url
          ? <img src={member.avatar_url} alt={member.name} referrerPolicy="no-referrer" className="absolute inset-0 h-full w-full rounded-full object-cover" />
          : <div className="absolute inset-0 h-full w-full rounded-full flex items-center justify-center text-[9px] font-bold text-white" style={{ backgroundColor: color }}>{getMemberInitials(member.name)}</div>}
        {showOnline && <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 bg-emerald-500 rounded-full border border-white" />}
      </div>
    );
  };

  // ── Select style helper ───────────────────────────────────────────────────
  const selStyle = ddStyle(isDark);

  return (
    <TooltipProvider delayDuration={250}>
      <div className={`sheet-root h-screen flex flex-col select-none overflow-hidden ${isDark ? "sheet-dark" : "sheet-light"}`}>

        {/* TITLE BAR */}
        <header className="sheet-titlebar h-11 flex items-center justify-between px-3 shrink-0 border-b">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={() => router.back()} className="sheet-back-btn h-7 w-7 rounded-md flex items-center justify-center transition-all"><ArrowLeft className="h-3.5 w-3.5" /></button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-[11px]">Back to dashboard</TooltipContent>
            </Tooltip>
            <ChevronRight className="h-3 w-3 text-gray-300 shrink-0" />
            <div className="sheet-app-icon h-6 w-6 rounded-md flex items-center justify-center shrink-0"><FileSpreadsheet className="h-3.5 w-3.5 text-primary-foreground" /></div>
            <div className="flex items-center gap-1.5 min-w-0">
              <Input value={title} onChange={e => handleTitleChange(e.target.value)} className="sheet-title-input h-7 border-0 bg-transparent font-semibold text-[13.5px] focus-visible:ring-1 px-1.5 rounded-md w-52" />
              <button onClick={handleStarredToggle} className="shrink-0 p-0.5 rounded transition-transform hover:scale-110">
                <Star className={`h-3.5 w-3.5 transition-colors ${starred ? "fill-amber-400 text-amber-400" : "text-gray-300 hover:text-amber-400"}`} />
              </button>
              <div className="sheet-save-status flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-medium shrink-0">
                {saveStatus === "saving" ? <><Loader2 className="h-2.5 w-2.5 animate-spin text-amber-500" /><span className="text-amber-600">Saving…</span></> : <><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /><span className="text-emerald-600">Saved</span></>}
              </div>
              {isOrgSheet && <div className="sheet-org-badge flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold shrink-0"><Globe className="h-2.5 w-2.5" />ORG</div>}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isOrgSheet && liveTracking && (
              <div className="sheet-live-pill flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {activeCollaborators.length} member{activeCollaborators.length !== 1 ? "s" : ""}
              </div>
            )}
            {isOrgSheet ? (
              <>
                <div className="flex -space-x-2">
                  {orgMembers.slice(0, 5).map(c => (
                    <Tooltip key={c.id}>
                      <TooltipTrigger><Avatar member={c} showOnline /></TooltipTrigger>
                      <TooltipContent side="bottom" className="text-xs sheet-tooltip"><p className="font-semibold">{c.name}</p><p className="text-gray-400 text-[10px]">{c.role} · {c.email}</p></TooltipContent>
                    </Tooltip>
                  ))}
                  {orgMembers.length > 5 && <div className="sheet-avatar h-6 w-6 rounded-full flex items-center justify-center text-[9px] font-bold cursor-pointer border-2 bg-gray-200 text-gray-600" style={{ borderColor: "var(--sheet-titlebar-bg)" }}>+{orgMembers.length - 5}</div>}
                </div>
                <div className="sheet-vdiv h-5 w-px mx-0.5" />
                <IconBtn icon={Bell} tooltip="Notifications" badge={totalComments} />
              </>
            ) : currentUser ? (
              <Tooltip>
                <TooltipTrigger><Avatar member={currentUser} /></TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs sheet-tooltip"><p className="font-semibold">{currentUser.name}</p><p className="text-gray-400 text-[10px]">Personal sheet</p></TooltipContent>
              </Tooltip>
            ) : null}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="sheet-btn-secondary flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11.5px] font-medium transition-all"><Download className="h-3.5 w-3.5" />Export<ChevronDown className="h-3 w-3 opacity-50" /></button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44" style={ddStyle(isDark)}>
                <DropdownMenuLabel className="text-[10px] uppercase tracking-wider" style={{ color: isDark ? "#4a5568" : "#9ca3af" }}>Export as</DropdownMenuLabel>
                <DropdownMenuSeparator style={{ background: isDark ? "#1e2330" : "#e8eaed" }} />
                {([["csv", "CSV (.csv)", FileSpreadsheet], ["xlsx", "Excel (.xlsx)", Layers], ["pdf", "PDF (.pdf)", Printer], ["json", "JSON (.json)", Code2]] as const).map(([fmt, label, Icon]) => (
                  <DropdownMenuItem key={fmt} onClick={() => handleExport(fmt)} className="text-xs gap-2" style={ddItemStyle(isDark)}><Icon className="h-3 w-3" />{label}</DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {isOrgSheet && <button className="sheet-btn-primary flex items-center gap-1.5 h-7 px-3 rounded-md text-[11.5px] font-semibold transition-all" onClick={() => setShowShareDialog(true)}><Share2 className="h-3.5 w-3.5" />Share</button>}
          </div>
        </header>

        {/* FORMATTING TOOLBAR */}
        <div className="sheet-toolbar sheet-formatting-bar h-10 border-b flex items-center px-3 gap-0.5 shrink-0">
          <IconBtn icon={Undo2} tooltip="Undo" shortcut="Ctrl+Z" onClick={() => rowsHistory.undo()} disabled={!rowsHistory.canUndo} />
          <IconBtn icon={Redo2} tooltip="Redo" shortcut="Ctrl+Y" onClick={() => rowsHistory.redo()} disabled={!rowsHistory.canRedo} />
          <ToolSep />
          <Select value={String(zoomLevel)} onValueChange={v => handleZoomChange(Number(v))}>
            <SelectTrigger className="sheet-select h-7 w-[72px] text-[11px] rounded-md px-2 border" style={selStyle}><SelectValue /></SelectTrigger>
            <SelectContent style={selStyle}>{[50, 75, 90, 100, 110, 125, 150, 200].map(z => <SelectItem key={z} value={String(z)} className="text-xs" style={ddItemStyle(isDark)}>{z}%</SelectItem>)}</SelectContent>
          </Select>
          <ToolSep />
          <IconBtn icon={Copy} tooltip="Copy" shortcut="Ctrl+C" onClick={() => clipboard.copyCellOrRange(selectedCell)} />
          <IconBtn icon={Scissors} tooltip="Cut" shortcut="Ctrl+X" onClick={() => clipboard.cutCellOrRange(selectedCell)} />
          <IconBtn icon={Clipboard} tooltip="Paste" shortcut="Ctrl+V" onClick={handlePaste} />
          <ToolSep />
          <Select value={fontFamily} onValueChange={handleFontFamilyChange}>
            <SelectTrigger className="sheet-select h-7 w-[108px] text-[11px] rounded-md px-2 border" style={selStyle}><SelectValue /></SelectTrigger>
            <SelectContent style={selStyle}>{["Arial", "Verdana", "Helvetica", "Times New Roman", "Georgia", "Courier New", "Trebuchet MS"].map(f => <SelectItem key={f} value={f} className="text-xs" style={{ ...ddItemStyle(isDark), fontFamily: f }}>{f}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={fontSize} onValueChange={handleFontSizeChange}>
            <SelectTrigger className="sheet-select h-7 w-[58px] text-[11px] rounded-md px-2 border ml-1" style={selStyle}><SelectValue /></SelectTrigger>
            <SelectContent style={selStyle}>{["8", "9", "10", "11", "12", "14", "16", "18", "24", "36"].map(s => <SelectItem key={s} value={s} className="text-xs" style={ddItemStyle(isDark)}>{s}</SelectItem>)}</SelectContent>
          </Select>
          <ToolSep />
          {selectedCell && selectedCellType && <><CellTypeSelector currentType={selectedCellType} onChangeType={t => cellTypes.changeCellType(selectedCell.row, selectedCell.col, t)} /><ToolSep /></>}
          <FormattingToolbar currentFormat={formatting.getCurrentCellFormat(selectedCell)} onFormatChange={handleFormatChange} disabled={!selectedCell} />
          <ToolSep />
          <IconBtn icon={WrapText} tooltip="Text Wrap" onClick={handleTextWrapToggle} disabled={!selectedCell} active={isSelectedColumnWrapped} />
          <IconBtn icon={selectedCell && protection.isCellProtected(selectedCell.row, selectedCell.col) ? Lock : Unlock} tooltip="Protect Cell" onClick={handleProtectionToggle} disabled={!selectedCell} active={!!(selectedCell && protection.isCellProtected(selectedCell.row, selectedCell.col))} />
          <ToolSep />
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={() => setShowFormulaDialog(true)} className="sheet-formula-btn flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-medium transition-all"><Sigma className="h-3.5 w-3.5" /><span>Formulas</span></button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="sheet-tooltip text-[11px]">Browse and insert formulas</TooltipContent>
          </Tooltip>
          <IconBtn icon={Paintbrush} tooltip="Format painter (coming soon)" onClick={() => toast.info("Format painter coming soon")} />
          <div className="flex-1" />
          {showSearch ? (
            <div className="flex items-center gap-1">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
                <input autoFocus value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search cells…" className="sheet-search-input h-7 w-44 pl-6 pr-2 text-[11px] rounded-md" />
                {searchQuery && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">{filteredRows.length}</span>}
              </div>
              <button className="sheet-icon-btn h-7 w-7 rounded flex items-center justify-center" onClick={() => { setShowSearch(false); setSearchQuery(""); }}><X className="h-3 w-3" /></button>
            </div>
          ) : <IconBtn icon={Search} tooltip="Search" shortcut="Ctrl+F" onClick={() => setShowSearch(true)} />}
        </div>

        {/* FORMULA BAR */}
        <div className="sheet-toolbar h-8 border-b flex items-center px-3 gap-2 shrink-0 bg-white">
          <div className="flex items-center justify-center h-5 px-2 bg-gray-100 text-gray-500 font-mono text-[11px] rounded border border-gray-200">
            {selectedCell ? `${String.fromCharCode(65 + columns.findIndex(c => c.key === selectedCell.col))}${selectedCell.row + 1}` : ""}
          </div>
          <div className="text-gray-400 font-serif italic font-bold">fx</div>
          <input className="flex-1 h-full bg-transparent border-0 outline-none text-[12px] font-mono placeholder:text-gray-300"
            placeholder={selectedCell ? "Enter a formula starting with =" : ""}
            value={selectedCell ? (formulas.formulas[protection.getCellKey(selectedCell.row, selectedCell.col)] ?? formulas.columnFormulas[selectedCell.col] ?? String(rows[selectedCell.row]?.[selectedCell.col] ?? "")) : ""}
            readOnly={!selectedCell || !!(selectedCell && protection.isCellProtected(selectedCell.row, selectedCell.col))}
            onChange={e => { if (!selectedCell) return; const val = e.target.value; const ck = protection.getCellKey(selectedCell.row, selectedCell.col); if (val.startsWith("=")) formulas.setFormulas(p => ({ ...p, [ck]: val })); else { formulas.setFormulas(p => { const n = { ...p }; delete n[ck]; return n; }); const nr = [...rows]; const num = Number(val); nr[selectedCell.row] = { ...nr[selectedCell.row], [selectedCell.col]: val === "" ? "" : !isNaN(num) ? num : val }; handleRowsChange(nr); } }}
            onBlur={async () => { if (!selectedCell) return; const ck = protection.getCellKey(selectedCell.row, selectedCell.col); const f = formulas.formulas[ck]; if (f) await saveFormula(sheetId, ck, f); else await deleteFormula(sheetId, ck).catch(() => { }); }} />
        </div>

        {/* ACTION BAR */}
        <div className="sheet-actionbar h-9 border-b flex items-center px-3 gap-0.5 shrink-0">
          <button className="sheet-action-btn flex items-center gap-1 h-6 px-2.5 rounded text-[11px] font-medium" onClick={handleInsertRow}><Plus className="h-3 w-3" />Row</button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="sheet-action-btn flex items-center gap-1 h-6 px-2.5 rounded text-[11px] font-medium"><Plus className="h-3 w-3" />Column<ChevronDown className="h-2.5 w-2.5 opacity-50 ml-0.5" /></button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44" style={ddStyle(isDark)}>
              <DropdownMenuLabel className="text-[10px] uppercase tracking-wider" style={{ color: isDark ? "#4a5568" : "#9ca3af" }}>Column type</DropdownMenuLabel>
              <DropdownMenuSeparator style={{ background: isDark ? "#1e2330" : "#e8eaed" }} />
              {(["text", "number", "currency", "date", "checkbox", "status", "priority", "url"] as ColumnDef["type"][]).map(t => (
                <DropdownMenuItem key={t} className="text-xs capitalize" style={ddItemStyle(isDark)} onClick={() => handleInsertColumn(t)}>{t}</DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <button disabled={selectedRows.size === 0} onClick={handleDeleteRow} className={`sheet-action-btn sheet-action-btn--danger flex items-center gap-1 h-6 px-2.5 rounded text-[11px] font-medium ${selectedRows.size === 0 ? "opacity-35 cursor-not-allowed" : ""}`}>
            <Trash2 className="h-3 w-3" />{selectedRows.size > 0 ? `Delete (${selectedRows.size})` : "Delete"}
          </button>
          <ToolSep />
          <button className="sheet-action-btn flex items-center gap-1 h-6 px-2.5 rounded text-[11px] font-medium" onClick={() => handleSort("asc")}><ArrowDownAZ className="h-3.5 w-3.5" />A → Z</button>
          <button className="sheet-action-btn flex items-center gap-1 h-6 px-2.5 rounded text-[11px] font-medium" onClick={() => handleSort("desc")}><ArrowUpAZ className="h-3.5 w-3.5" />Z → A</button>
          <button className={`sheet-action-btn flex items-center gap-1 h-6 px-2.5 rounded text-[11px] font-medium ${showFilters ? "sheet-action-btn--active" : ""}`} onClick={() => setShowFilters(!showFilters)}>
            <SlidersHorizontal className="h-3.5 w-3.5" />Filter{filterValue && <span className="h-1.5 w-1.5 rounded-full bg-primary ml-0.5" />}
          </button>
          <ToolSep />
          {[{ icon: Snowflake, label: "Freeze" }, { icon: Eye, label: "Hide" }, { icon: Paintbrush, label: "Conditional" }, { icon: Layers, label: "Group" }, { icon: Check, label: "Validate" }, { icon: BarChart3, label: "Chart" }].map(({ icon: Icon, label }) => (
            <button key={label} className="sheet-action-btn flex items-center gap-1 h-6 px-2.5 rounded text-[11px] font-medium" onClick={() => toast.info(`${label} coming soon`)}><Icon className="h-3.5 w-3.5" />{label}</button>
          ))}
          <div className="flex-1" />
          <div className="flex items-center gap-0.5">
            {isOrgSheet && <>
              <IconBtn icon={MessageSquare} tooltip="Comments" onClick={() => toggleRightPanel("comments")} active={effectiveRightPanel === "comments"} badge={totalComments} />
              <IconBtn icon={Users} tooltip="Collaborators" onClick={() => toggleRightPanel("collaborators")} active={effectiveRightPanel === "collaborators"} />
            </>}
            <IconBtn icon={History} tooltip="Version history" onClick={() => toggleRightPanel("history")} active={effectiveRightPanel === "history"} />
            <IconBtn icon={Code2} tooltip="Developer tools" onClick={() => toggleRightPanel("developer")} active={effectiveRightPanel === "developer"} />
            <ToolSep />
            <IconBtn icon={Play} tooltip="Playback history" onClick={() => setShowPlayback(true)} />
            <IconBtn icon={isDark ? Sun : Moon} tooltip={isDark ? "Light mode" : "Dark mode"} onClick={() => setIsDark(!isDark)} />
            <IconBtn icon={Keyboard} tooltip="Keyboard shortcuts" onClick={() => setShowKeyboardShortcuts(true)} />
          </div>
        </div>

        {/* FILTER BAR */}
        {showFilters && (
          <div className="sheet-filterbar h-9 border-b flex items-center px-4 gap-3 shrink-0">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-700"><SlidersHorizontal className="h-3 w-3" />Filter</div>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
              <input value={filterValue} onChange={e => setFilterValue(e.target.value)} placeholder="Filter across all columns…" className="sheet-filter-input h-6 w-56 pl-6 pr-2 text-[11px] rounded-md border" />
            </div>
            {filterValue && <span className="text-[11px] text-amber-600 font-medium">{filteredRows.length} of {rows.length} rows</span>}
            <button className="sheet-clear-filter flex items-center gap-1 text-[11px] font-medium px-2 h-6 rounded" onClick={() => { setFilterValue(""); setShowFilters(false); }}>Clear<X className="h-2.5 w-2.5 ml-0.5" /></button>
          </div>
        )}

        {/* MAIN BODY */}
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-hidden relative">
            <DataGrid columns={gridColumns} rows={filteredRows} rowKeyGetter={(row: SheetRow) => row.id} onRowsChange={handleRowsChange} selectedRows={selectedRows} onSelectedRowsChange={setSelectedRows}
              onColumnResize={(idx, width) => { const col = columns[idx - 1]; if (col) handleColumnResize(col.key, width); }}
              rowHeight={row => {
                if (textWrap.textWrapColumns.size === 0) return 32;
                let max = 1; const ri = rows.findIndex(r => r.id === row.id);
                const wk = new Set([...textWrap.textWrapColumns].filter(k => k.startsWith(`${ri}-`)).map(k => k.replace(`${ri}-`, "")));
                wk.forEach(ck => { const v = String(row[ck] || ""); if (!v) return; const cd = columns.find(c => c.key === ck); const cpl = Math.floor(((cd?.width || 160) - 20) / 7); const tl = v.split("\n").reduce((a, l) => a + (Math.ceil(l.length / cpl) || 1), 0); if (tl > max) max = tl; });
                return Math.max(32, 8 + max * 20);
              }}
              headerRowHeight={33} className={`rdg-sheet fill-grid ${isDark ? "rdg-dark" : "rdg-light"}`} />
          </div>
          {effectiveRightPanel && (rightPanel === "history" || rightPanel === "developer" || isOrgSheet) && (
            <RightPanel rightPanel={effectiveRightPanel} isDark={isDark} setRightPanel={setRightPanel} comments={groupedCommentsForPanel} activeCommentCell={activeCommentCell} newCommentText={newCommentText} replyText={replyText} setNewCommentText={setNewCommentText} handleAddComment={handleAddComment} handleReply={handleReply} handleResolveComment={handleResolveComment} setReplyText={setReplyText} history={history} setShowPlayback={setShowPlayback} liveTracking={liveTracking} isOrganizationSheet={isOrgSheet} setLiveTracking={v => setSheetState(p => ({ ...p, liveTracking: v }))} setShowShareDialog={setShowShareDialog} sheetId={sheetId} rows={rows} columns={columns} totalComments={totalComments} members={orgMembers} />
          )}
        </div>

        {/* STATUS BAR */}
        <div className="sheet-statusbar h-5 border-t flex items-center px-4 gap-4 shrink-0">
          <span className="sheet-status-text tabular-nums">{rows.length} rows · {columns.length} cols</span>
          {selectedRows.size > 0 && <span className="sheet-status-highlight">{selectedRows.size} selected</span>}
          {selectedCell && <span className="sheet-status-cell font-mono">{String.fromCharCode(65 + columns.findIndex(c => c.key === selectedCell.col) + 1)}{selectedCell.row + 1}</span>}
          <div className="flex-1" />
          {filterValue && <span className="text-[10px] text-amber-500 font-medium">{filteredRows.length}/{rows.length} rows</span>}
          {isOrgSheet && liveTracking && <span className="sheet-status-text flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />Live</span>}
          <button className="sheet-status-text flex items-center gap-1 hover:opacity-80" onClick={() => setShowKeyboardShortcuts(true)}><Keyboard className="h-2.5 w-2.5" />Shortcuts</button>
        </div>

        {/* MODALS */}
        <PlaybackModal showPlayback={showPlayback} setShowPlayback={setShowPlayback} playbackIndex={playbackIndex} setPlaybackIndex={setPlaybackIndex} isPlaying={isPlaying} setIsPlaying={handleSetIsPlaying} history={history} />
        {isOrgSheet && <ShareDialog showShareDialog={showShareDialog} setShowShareDialog={setShowShareDialog} sheetId={sheetId} isDark={isDark} />}
        <KeyboardShortcutsDialog showKeyboardShortcuts={showKeyboardShortcuts} setShowKeyboardShortcuts={setShowKeyboardShortcuts} />
        <FormulaDialog open={showFormulaDialog} onClose={() => setShowFormulaDialog(false)} onInsert={handleFormulaInsert} />

        {/* STYLES */}
        <style jsx global>{`
        
        `}</style>
      </div>
    </TooltipProvider>
  );
}