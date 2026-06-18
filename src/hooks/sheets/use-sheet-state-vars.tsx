import { useState, useMemo } from "react";
import { SheetRow, ColumnDef, SaveStatus, ConditionalFormatRule, SelectOption } from "@/types/index";
import { SheetState, AdvancedFilterRule, SelectSetupDialogState, FilterOperator } from "@/types/index";
import type { RightPanelType } from "@/components/individual/sheet/Right-panel";
import type { OrgMember } from "@/lib/querys/organization/get-sheet-members";
import type { SheetComment, HistoryEntry } from "@/lib/querys/sheet/firebase-realtime";

export function useSheetStateVars(isOrganizationSheet: boolean, importedFrom: string | null) {
  const [sheetState, setSheetState] = useState<SheetState>({
    title: "",
    isOrgSheet: isOrganizationSheet,
    liveTracking: isOrganizationSheet,
    createdAt: null,
    updatedAt: null,
    ownerId: null,
    organizationId: null,
    starred: false,
    rows: [],
    columns: [],
    forkedFromSheetId: null,
    forkedFromSnapshotLabel: null,
    forkedAt: null,
    forkedByUserId: null,
    templateId: null,
  });

  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: string } | null>(null);
  const [rightPanel, setRightPanel] = useState<RightPanelType>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [filterValue, setFilterValue] = useState("");
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilterRule[]>([]);
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
    Record<string, { name: string; color: string; row: number; col: string; x?: number; y?: number; selectedAt?: number; email?: string; avatar_url?: string | null; role?: string }>
  >({});
  const [comments, setComments] = useState<Record<string, SheetComment[]>>({});
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [activeCommentCell, setActiveCommentCell] = useState<string | null>(null);
  const [newCommentText, setNewCommentText] = useState("");
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [forks, setForks] = useState<{ id: string; title: string; forked_at: string | null }[]>([]);
  const [cellSelectOptions, setCellSelectOptions] = useState<Record<string, SelectOption[]>>({});
  const [rowHeights, setRowHeights] = useState<Record<string, number>>({});
  const [showDesktopTip, setShowDesktopTip] = useState(false);
  const [isImportingSheet, setIsImportingSheet] = useState(false);
  const [importSource, setImportSource] = useState<"csv" | "excel" | null>(
    importedFrom === "csv" || importedFrom === "excel" ? importedFrom : null,
  );
  const [selectSetupDialog, setSelectSetupDialog] = useState<SelectSetupDialogState>({
    open: false,
    colKey: null,
    row: null,
    mode: "insert",
  });

  return {
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
  };
}
