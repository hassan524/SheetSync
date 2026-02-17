// components/sheets/sheet-client.tsx
// ============================================================
// MAIN SHEET CLIENT COMPONENT
// This is the brain of the entire spreadsheet.
// It's a CLIENT component (runs in browser, not server)
// because it needs: useState, useEffect, event handlers, etc.
//
// HOW IT CONNECTS TO EVERYTHING:
// 1. Gets URL params → decides which template/sheet to load
// 2. Sets up history (undo/redo) for rows and columns
// 3. Initializes ALL custom hooks (formatting, clipboard, etc.)
// 4. Builds the grid columns definition (what DataGrid renders)
// 5. Renders: Header → Toolbar → DataGrid
// ============================================================

"use client";

import {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
  startTransition, // ← FIX #1: used to wrap setState inside useEffect
} from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

// react-data-grid: the actual spreadsheet grid library
// Column = type for column definitions
// RenderCellProps = props passed to cell renderer (view mode)
// RenderEditCellProps = props passed to cell renderer (edit mode)
import DataGrid, {
  Column,
  RenderCellProps,
  RenderEditCellProps,
} from "react-data-grid";
import "react-data-grid/lib/styles.css";

// UI components from shadcn
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

// Icons from lucide-react
import {
  ArrowLeft,
  Check,
  Loader2,
  Download,
  Share2,
  Star,
  CheckSquare,
  Square,
  GripVertical,
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
} from "lucide-react";

// Toast notifications (shows "Copied", "Saved", error messages etc.)
import { toast } from "sonner";

// ---- Sub-components inside the sheet ----
// FormattingToolbar: Bold, Italic, Underline, font size, colors, align buttons
import FormattingToolbar from "@/components/individual/sheets/Formatting-toolbar";
// ColumnHeaderMenu: Right-click menu on column header (rename, change type, delete)
import ColumnHeaderMenu from "@/components/individual/sheets/Column-header-menu";
// CellTypeSelector: Dropdown to change cell type (text, number, date, checkbox...)
import CellTypeSelector from "@/components/individual/sheets/Cell-type-selector";

// ---- Custom Hooks ----
// useHistory: manages undo/redo stack for rows and columns
import { useHistory } from "@/hooks/use-history";
// useSheetFormatting: manages cell formats (bold, italic, colors, alignment)
import { useSheetFormatting } from "@/hooks/sheets/use-sheet-formatting";
// useTextWrap: manages which columns have text wrap enabled + row height calculation
import { useTextWrap } from "@/hooks/sheets/use-text-wrap";
// useClipboard: manages copy, cut, paste for cells
import { useClipboard } from "@/hooks/sheets/use-clipboard";
// useProtectedCells: manages locked/protected cells (can't be edited)
import { useProtectedCells } from "@/hooks/sheets/use-protected-cells";
// useRowOperations: insert row, delete row
import { useRowOperations } from "@/hooks/sheets/use-row-operations";
// useColumnOperations: insert/delete/resize/reorder columns
import { useColumnOperations } from "@/hooks/sheets/use-column-operations";
// useCellTypes: per-cell type overrides (column is "text" but this cell is "priority")
import { useCellTypes } from "@/hooks/sheets/use-cell-types";
// useFormulas: stores and evaluates formulas like =SUM(A1:A5)
import { useFormulas } from "@/hooks/sheets/use-formulas";
// useKeyboardShortcuts: Ctrl+C, Ctrl+V, Ctrl+Z, Ctrl+B etc.
import { useKeyboardShortcuts } from "@/hooks/sheets/use-keyboard-shortcuts";

// ---- Types ----
// SheetRow: { id: string, [colKey: string]: any } - one row of data
// ColumnDef: { key, name, type, width, ... } - defines a column
// SaveStatus: 'saving' | 'saved' - shown in header
// PRIORITY_OPTIONS: [{ value: 'low', label: 'Low', color: '...', bgColor: '...' }]
// STATUS_OPTIONS: [{ value: 'todo', label: 'Todo', color: '...', bgColor: '...' }]
import {
  SheetRow,
  ColumnDef,
  SaveStatus,
  PRIORITY_OPTIONS,
  STATUS_OPTIONS,
} from "@/types/sheet.types";

// ---- Template Utilities ----
// getTemplateData: returns initial rows/columns based on template type
// recalculateBudget: auto-calculates totals for budget template
// recalculateInventory: auto-calculates totals for inventory template
import {
  getTemplateData,
  recalculateBudget,
  recalculateInventory,
} from "@/lib/sheet-templates";

// ============================================================
// COMPONENT
// ============================================================
export default function SheetClient() {
  // ── URL PARAMS ──────────────────────────────────────────
  // params.id = the sheet ID from /sheets/[id]
  const params = useParams<{ id?: string }>();

  // searchParams = query string values
  // e.g. /sheets/123?template=budget&org=true
  const searchParams = useSearchParams();

  // templateId: which template to use as starting data
  // 'blank' | 'budget' | 'inventory' etc.
  const templateId = searchParams?.get("template") || "blank";

  // isOrganizationSheet: true if this sheet belongs to an org
  // used to show the "Organization" badge in the header
  const isOrganizationSheet = searchParams?.get("org") === "true";

  // router: used for navigation (e.g. router.back() on back button)
  const router = useRouter();

  // ── INITIAL DATA ─────────────────────────────────────────
  // getTemplateData returns { title, rows, columns } based on templateId
  // useMemo: only recalculates when templateId changes (not on every render)
  const initialData = useMemo(() => getTemplateData(templateId), [templateId]);

  // ── HISTORY (UNDO/REDO) ──────────────────────────────────
  // useHistory maintains a stack of past/future states
  // rowsHistory.currentState = current rows
  // rowsHistory.pushState(newRows) = make a new undoable edit
  // rowsHistory.undo() = go back one step
  // rowsHistory.redo() = go forward one step
  // rowsHistory.canUndo / rowsHistory.canRedo = booleans for disabling buttons
  const rowsHistory = useHistory<SheetRow[]>(initialData.rows);
  const columnsHistory = useHistory<ColumnDef[]>(initialData.columns);

  // ── CORE STATE ────────────────────────────────────────────
  // title: the spreadsheet title shown in header (editable input)
  const [title, setTitle] = useState<string>(initialData.title);

  // rows: current array of row objects
  // Each row: { id: 'row_1', col_1: 'Rent', col_2: 1000, ... }
  const [rows, setRows] = useState<SheetRow[]>(initialData.rows);

  // columns: current array of column definitions
  // Each column: { key: 'col_1', name: 'Item', type: 'text', width: 150 }
  const [columns, setColumns] = useState<ColumnDef[]>(initialData.columns);

  // starred: whether user has starred/favorited this sheet
  const [starred, setStarred] = useState<boolean>(false);

  // searchQuery: text typed in search box to filter visible rows
  const [searchQuery, setSearchQuery] = useState<string>("");

  // saveStatus: 'saving' shows spinner, 'saved' shows checkmark
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");

  // saveTimeout: ref to hold the debounce timer for saving
  // useRef so it persists across renders without causing re-renders
  const saveTimeout = useRef<NodeJS.Timeout | undefined>(undefined);

  // selectedRows: Set of row IDs that are checked/selected
  // Used for bulk delete. e.g. Set(['row_1', 'row_3'])
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  // selectedCell: which cell is currently focused/selected
  // { row: 2, col: 'col_1' } means row index 2, column key 'col_1'
  // null means no cell is selected
  const [selectedCell, setSelectedCell] = useState<{
    row: number;
    col: string;
  } | null>(null);

  // ── FIX #1: SYNC HISTORY → STATE ──────────────────────────
  // PROBLEM: calling setState directly in useEffect is synchronous
  // and can cause cascading renders (the lint error you saw)
  //
  // WHY WE NEED THIS SYNC AT ALL:
  // When user presses Ctrl+Z, rowsHistory.undo() updates
  // rowsHistory.currentState, but `rows` state doesn't know about it.
  // We need to sync history's current state → local state.
  //
  // FIX: wrap setState in startTransition()
  // startTransition tells React: "this is a low-priority update,
  // batch it safely and don't trigger cascading renders"
  useEffect(() => {
    startTransition(() => {
      setRows(rowsHistory.currentState);
    });
  }, [rowsHistory.currentState]);

  useEffect(() => {
    startTransition(() => {
      setColumns(columnsHistory.currentState);
    });
  }, [columnsHistory.currentState]);

  // ── SAVE FUNCTION ─────────────────────────────────────────
  // triggerSave: debounced save function
  // Every time something changes, call triggerSave()
  // It waits 800ms after the LAST change before actually saving
  //
  // WHY DEBOUNCE:
  // User types "Hello" (5 keystrokes) → only 1 save at the end
  // Without debounce: 5 saves for 5 keystrokes = wasteful
  //
  // TODO: Replace setTimeout body with actual Supabase calls:
  // await saveRow(sheetId, changedRow, position)
  // await updateSheetTitle(sheetId, title)
  // etc.
  const triggerSave = useCallback(() => {
    setSaveStatus("saving");
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      // TODO: Save to Supabase here
      // Example: await saveRow(params.id!, changedRow, position)
      setSaveStatus("saved");
    }, 800);
  }, []);

  // ── ALL CUSTOM HOOKS ──────────────────────────────────────
  // Each hook manages one specific feature of the spreadsheet.
  // They all receive what they need and return functions + state.
  // triggerSave is passed to each so they can trigger saves.

  // formatting: handles bold, italic, underline, font size, colors, alignment
  // formatting.cellFormats = { '0-col_1': { bold: true, color: '#ff0000' } }
  // formatting.applyFormat(selectedCell, { bold: true }) = make selected cell bold
  // formatting.getCellStyle(rowIdx, colKey, textWrapColumns) = returns CSS object
  // formatting.getCurrentCellFormat(selectedCell) = returns format of selected cell
  const formatting = useSheetFormatting(triggerSave);

  // textWrap: handles text wrapping per column
  // textWrap.textWrapColumns = Set(['col_1', 'col_3']) - these columns wrap text
  // textWrap.toggleTextWrap(colKey) = toggle wrap on/off for a column
  // textWrap.toggleTextWrapForSelectedColumn(selectedCell) = toggle for selected cell's column
  // textWrap.calculateRowHeight(rowIdx) = returns height in px based on content
  const textWrap = useTextWrap(rows, triggerSave);

  // clipboard: handles copy, cut, paste
  // clipboard.copyCellOrRange(selectedCell) = copy cell value to internal clipboard
  // clipboard.cutCellOrRange(selectedCell) = copy + clear cell
  // clipboard.pasteCellOrRange(selectedCell) = paste copied value into selected cell
  const clipboard = useClipboard(rows, rowsHistory, triggerSave);

  // protection: handles locking/unlocking cells
  // protection.protectedCells = Set(['0-col_1', '5-col_2']) - locked cell keys
  // protection.toggleProtectCell(selectedCell) = lock/unlock selected cell
  // protection.isCellProtected(rowIdx, colKey) = returns boolean
  // protection.getCellKey(rowIdx, colKey) = returns '0-col_1' string
  const protection = useProtectedCells(triggerSave);

  // rowOps: handles row-level operations
  // rowOps.insertRow() = adds a new empty row at the bottom
  // rowOps.deleteRow(selectedRows) = deletes all selected rows
  const rowOps = useRowOperations(rows, columns, rowsHistory, triggerSave);

  // colOps: handles column-level operations
  // colOps.insertColumn(type) = adds new column of given type
  // colOps.deleteColumn(colKey) = removes a column
  // colOps.changeColumnType(colKey, newType) = changes column type
  // colOps.handleColumnResize(colKey, width, setColumns) = updates column width
  // colOps.handleColumnDragStart/Over/End = drag to reorder columns
  const colOps = useColumnOperations(
    rows,
    columns,
    columnsHistory,
    rowsHistory,
    triggerSave,
  );

  // cellTypes: handles per-cell type overrides
  // A column might be "text" but one cell can be overridden to "priority"
  // cellTypes.getCellType(rowIdx, colKey, defaultType) = returns effective type
  // cellTypes.changeCellType(rowIdx, colKey, newType) = override this cell's type
  const cellTypes = useCellTypes(rows, rowsHistory, triggerSave);

  // formulas: handles formula storage and evaluation
  // formulas.formulas = { '5-col_2': '=SUM(A1:A5)' }
  // formulas.setFormulas(updater) = update formula state
  // formulas.evaluateFormula(formula, rowIdx) = calculate formula result
  const formulas = useFormulas(rows, columns);

  // ── KEYBOARD SHORTCUTS ───────────────────────────────────
  // Sets up window event listeners for keyboard shortcuts:
  // Ctrl+Z = undo, Ctrl+Y = redo
  // Ctrl+C = copy, Ctrl+V = paste, Ctrl+X = cut
  // Ctrl+B = bold, Ctrl+I = italic, Ctrl+U = underline
  // All functions are passed from the hooks above
  useKeyboardShortcuts({
    selectedCell,
    rowsHistory,
    getCurrentCellFormat: formatting.getCurrentCellFormat,
    applyFormat: formatting.applyFormat,
    copyCellOrRange: clipboard.copyCellOrRange,
    pasteCellOrRange: clipboard.pasteCellOrRange,
    cutCellOrRange: clipboard.cutCellOrRange,
  });

  // ── EXPORT ───────────────────────────────────────────────
  // Converts the current sheet data to CSV format and downloads it
  // Steps:
  // 1. Create header row from column names
  // 2. Create data rows from row values
  // 3. Join with commas and newlines
  // 4. Create a Blob (binary file object)
  // 5. Create a download link and click it programmatically
  const handleExport = useCallback(() => {
    const csvHeaders = columns.map((c) => c.name).join(",");
    const csvRows = rows.map((row) =>
      columns
        .map((col) => {
          const val = row[col.key] ?? "";
          // Wrap in quotes if value contains a comma (CSV standard)
          return typeof val === "string" && val.includes(",")
            ? `"${val}"`
            : val;
        })
        .join(","),
    );
    const csvContent = [csvHeaders, ...csvRows].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title}.csv`;
    link.click();
    URL.revokeObjectURL(url); // Clean up memory
    toast.success("Exported successfully");
  }, [columns, rows, title]);

  // ── RENDER CELL BY TYPE ──────────────────────────────────
  // This function renders the DISPLAY version of a cell (not edit mode)
  // Called by renderCell inside gridColumns
  //
  // Parameters:
  // - type: the cell type ('text', 'number', 'priority', 'checkbox', etc.)
  // - props: RenderCellProps from react-data-grid (contains row data)
  // - colKey: the column key ('col_1', 'col_2', etc.)
  //
  // Flow:
  // 1. Get row index from rows array
  // 2. Get cell style (bold, colors, etc.) from formatting hook
  // 3. Check if cell has a formula → evaluate it
  // 4. Render different JSX based on type
  const renderCellByType = useCallback(
    (
      type: ColumnDef["type"],
      props: RenderCellProps<SheetRow>,
      colKey: string,
    ) => {
      const { row } = props;

      // Find which row index this is (0, 1, 2...)
      const rowIdx = rows.findIndex((r) => r.id === row.id);

      // Get CSS style for this cell (bold, italic, colors, text-align, wrap)
      // textWrap.textWrapColumns is passed to determine white-space CSS
      const cellStyle = formatting.getCellStyle(
        rowIdx,
        colKey,
        textWrap.textWrapColumns,
      );

      // cellKey format: '0-col_1' (rowIndex-columnKey)
      // Used as key in formulas, cellFormats, protectedCells objects
      const cellKey = protection.getCellKey(rowIdx, colKey);

      // Check if this cell has a formula stored
      const formula = formulas.formulas[cellKey];

      // Check if this cell is protected (locked)
      const isProtected = protection.isCellProtected(rowIdx, colKey);

      // displayValue: what to actually show in the cell
      // If cell has a formula, evaluate it (e.g. =SUM(A1:A5) → 150)
      // Otherwise show the raw stored value
      let displayValue = row[colKey];
      if (formula && formula.startsWith("=")) {
        displayValue = formulas.evaluateFormula(formula, rowIdx);
      }

      // Render the cell content based on type
      const cellContent = (() => {
        switch (type) {
          // PRIORITY: renders a colored badge like "🔴 High"
          case "priority": {
            const option = PRIORITY_OPTIONS.find(
              (o) => o.value === displayValue,
            );
            return option ? (
              <span
                className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
                style={{ color: option.color, backgroundColor: option.bgColor }}
              >
                {option.label}
              </span>
            ) : null;
          }

          // STATUS: renders a colored badge like "🟡 In Progress"
          case "status": {
            const option = STATUS_OPTIONS.find((o) => o.value === displayValue);
            return option ? (
              <span
                className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
                style={{ color: option.color, backgroundColor: option.bgColor }}
              >
                {option.label}
              </span>
            ) : null;
          }

          // CHECKBOX: renders a checkmark icon or empty square
          case "checkbox":
            return displayValue ? (
              <CheckSquare className="h-4 w-4 text-green-600" />
            ) : (
              <Square className="h-4 w-4 text-muted-foreground/40" />
            );

          // DATE: renders calendar icon + formatted date string
          case "date":
            return displayValue ? (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3 w-3 text-gray-500" />
                <span>{String(displayValue)}</span>
              </div>
            ) : null;

          // CURRENCY: renders "$1,000.00" format
          case "currency":
            return displayValue
              ? `$${Number(displayValue).toLocaleString("en-US", { minimumFractionDigits: 2 })}`
              : "";

          // URL: renders a clickable link
          case "url":
            return displayValue ? (
              <a
                href={String(displayValue)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline truncate"
              >
                {String(displayValue)}
              </a>
            ) : null;

          // TEXT / NUMBER / default: render as plain string
          default:
            return displayValue !== undefined ? String(displayValue) : "";
        }
      })();

      // Wrapper div for the cell
      // - justify-end for numbers/currency (right align)
      // - justify-center for checkboxes
      // - onClick: set this as the selected cell
      // - isProtected: show tiny lock icon in corner
      return (
        <div
          className={`
          h-full w-full flex items-center
          ${type === "currency" || type === "number" ? "justify-end" : ""}
          ${type === "checkbox" ? "justify-center" : ""}
          px-2.5 py-2 text-xs gap-1.5 relative
        `}
          style={cellStyle}
          onClick={() => setSelectedCell({ row: rowIdx, col: colKey })}
        >
          {/* Show lock icon if cell is protected */}
          {isProtected && (
            <Lock className="absolute top-1 right-1 h-2.5 w-2.5 text-gray-400" />
          )}
          {cellContent}
        </div>
      );
      // FIX #2 & #3: renderCellByType was causing useMemo to fail
      // because it was defined inline inside useMemo's dependency array.
      // Extracting it as useCallback with explicit deps fixes the
      // "Could not preserve existing manual memoization" error.
    },
    [
      rows,
      formatting,
      textWrap.textWrapColumns,
      protection,
      formulas,
      setSelectedCell,
    ],
  );

  // ── GRID COLUMNS DEFINITION ──────────────────────────────
  // This useMemo builds the column config array for react-data-grid
  // It recalculates only when its dependencies change
  //
  // FIX #2 & #3: The "Compilation Skipped: Existing memoization could not
  // be preserved" error happened because renderCellByType was defined
  // INSIDE the useMemo callback, making it uncacheable.
  // Solution: move renderCellByType OUTSIDE as a useCallback (done above)
  // Now useMemo can properly cache gridColumns.
  const gridColumns = useMemo<Column<SheetRow>[]>(() => {
    // ── ROW NUMBER COLUMN ──
    // The frozen left column showing 1, 2, 3...
    // frozen: true = stays visible when scrolling horizontally
    // resizable: false = can't resize this column
    const rowNumberColumn: Column<SheetRow> = {
      key: "row-number",
      name: "",
      width: 60,
      frozen: true,
      resizable: false,
      renderHeaderCell: () => <div className="h-full w-full bg-gray-50" />,
      renderCell(props: RenderCellProps<SheetRow>) {
        const rowIdx = rows.findIndex((r) => r.id === props.row.id);
        return (
          <div className="h-full w-full flex items-center justify-center text-[11px] font-medium text-gray-600 bg-gray-50">
            {rowIdx + 1}
          </div>
        );
      },
    };

    // ── DATA COLUMNS ──
    // Map each ColumnDef to a react-data-grid Column config
    const dataColumns = columns.map(
      (col): Column<SheetRow> => ({
        key: col.key, // 'col_1', 'col_2' etc. - unique identifier
        name: col.name, // 'Item', 'Amount' etc. - shown in header
        width: col.width || 150,
        resizable: true, // User can drag to resize

        // ── HEADER CELL ──
        // Rendered at the top of each column
        // Contains: drag handle, column name, wrap indicator, menu
        renderHeaderCell: () => (
          <div
            className="h-full w-full flex items-center gap-1 px-2 group bg-gray-50 border-b border-r border-gray-200"
            // draggable: allows user to drag and reorder columns
            draggable
            onDragStart={() => colOps.handleColumnDragStart(col.key)}
            onDragOver={(e) =>
              colOps.handleColumnDragOver(e, col.key, setColumns)
            }
            onDragEnd={colOps.handleColumnDragEnd}
          >
            {/* Grip icon - only visible on hover, indicates draggable */}
            <GripVertical className="h-3 w-3 text-gray-400 flex-shrink-0 cursor-move opacity-0 group-hover:opacity-100" />

            {/* Column name */}
            <span className="flex-1 text-[11px] font-semibold truncate text-gray-700">
              {col.name}
            </span>

            {/* Show wrap icon if text wrap is enabled for this column */}
            {textWrap.textWrapColumns.has(col.key) && (
              <WrapText className="h-3 w-3 text-green-600" />
            )}

            {/* Column header context menu (right-click style dropdown)
              Allows: change column type, delete column, toggle text wrap */}
            <ColumnHeaderMenu
              column={col}
              onChangeType={(newType) =>
                colOps.changeColumnType(col.key, newType)
              }
              onDelete={() => colOps.deleteColumn(col.key)}
              onToggleTextWrap={() => textWrap.toggleTextWrap(col.key)}
              textWrapEnabled={textWrap.textWrapColumns.has(col.key)}
            />
          </div>
        ),

        // ── VIEW CELL (read mode) ──
        // Rendered when user is NOT editing the cell
        // Gets effective cell type (might be overridden per-cell)
        // then delegates to renderCellByType for the actual JSX
        renderCell(props: RenderCellProps<SheetRow>) {
          const rowIdx = rows.findIndex((r) => r.id === props.row.id);
          // getCellType: checks cellTypeOverrides first, then falls back to column type
          const cellType = cellTypes.getCellType(
            rowIdx,
            col.key,
            col.type || "text",
          );
          return renderCellByType(cellType, props, col.key);
        },

        // ── EDIT CELL (edit mode) ──
        // Rendered when user double-clicks or starts typing in a cell
        // Returns different input types based on cell type
        renderEditCell(props: RenderEditCellProps<SheetRow>) {
          const { row, column, onRowChange } = props;
          const rowIdx = rows.findIndex((r) => r.id === row.id);
          const cellType = cellTypes.getCellType(
            rowIdx,
            col.key,
            col.type || "text",
          );

          // Get CSS styles for the input (matches display style)
          const cellStyle = formatting.getCellStyle(
            rowIdx,
            column.key,
            textWrap.textWrapColumns,
          );

          // Cell key for looking up formula, protection status
          const cellKey = protection.getCellKey(rowIdx, col.key);
          const formula = formulas.formulas[cellKey];
          const isTextWrap = textWrap.textWrapColumns.has(col.key);
          const isProtected = protection.isCellProtected(rowIdx, col.key);

          // ── PROTECTED: can't edit ──
          // If cell is protected, show lock icon and block editing
          if (isProtected) {
            toast.error("Cell is protected");
            return (
              <div className="h-full w-full flex items-center px-2.5 text-xs bg-gray-100">
                <Lock className="h-3 w-3 mr-1 text-gray-500" />
                Protected
              </div>
            );
          }

          // ── PRIORITY / STATUS: dropdown select ──
          // Shows dropdown with color-coded options
          if (cellType === "priority" || cellType === "status") {
            const options =
              cellType === "priority" ? PRIORITY_OPTIONS : STATUS_OPTIONS;
            return (
              <Select
                value={row[column.key] as string}
                onValueChange={(value) =>
                  onRowChange({ ...row, [column.key]: value })
                }
              >
                <SelectTrigger className="h-full border-0 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <span
                        className="px-2 py-0.5 rounded-full text-[11px] font-semibold"
                        style={{
                          color: option.color,
                          backgroundColor: option.bgColor,
                        }}
                      >
                        {option.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            );
          }

          // ── DATE: native date picker ──
          if (cellType === "date") {
            return (
              <input
                className="w-full h-full px-2.5 text-xs bg-transparent outline-none border-0"
                style={cellStyle}
                type="date"
                autoFocus
                value={String(row[column.key] || "")}
                onChange={(e) =>
                  onRowChange({ ...row, [column.key]: e.target.value })
                }
              />
            );
          }

          // ── CHECKBOX: toggle on click ──
          // Clicking toggles true/false
          if (cellType === "checkbox") {
            return (
              <div
                className="h-full flex items-center justify-center cursor-pointer"
                onClick={() =>
                  onRowChange({ ...row, [column.key]: !row[column.key] })
                }
              >
                {row[column.key] ? (
                  <CheckSquare className="h-4 w-4 text-green-600" />
                ) : (
                  <Square className="h-4 w-4 text-muted-foreground/40" />
                )}
              </div>
            );
          }

          // ── NUMBER / CURRENCY: right-aligned numeric input ──
          // Also supports formulas (=SUM, =AVERAGE, etc.)
          // If user types '=', it's stored as a formula not a value
          if (cellType === "number" || cellType === "currency") {
            return (
              <input
                className="w-full h-full px-2.5 text-xs bg-transparent outline-none border-0 text-right tabular-nums"
                style={cellStyle}
                type="text"
                autoFocus
                placeholder={formula ? formula : undefined}
                value={
                  formula ||
                  (row[column.key] !== undefined && row[column.key] !== 0
                    ? String(row[column.key])
                    : "")
                }
                onChange={(e) => {
                  const val = e.target.value;
                  if (val.startsWith("=")) {
                    // Store as formula (will be evaluated on render)
                    formulas.setFormulas((prev) => ({
                      ...prev,
                      [cellKey]: val,
                    }));
                  } else {
                    // Remove formula if user stopped using one
                    formulas.setFormulas((prev) => {
                      const newFormulas = { ...prev };
                      delete newFormulas[cellKey];
                      return newFormulas;
                    });
                    const newValue = val === "" ? 0 : Number(val);
                    if (!isNaN(newValue)) {
                      onRowChange({ ...row, [column.key]: newValue });
                    }
                  }
                }}
                onBlur={() => triggerSave()} // Save when user clicks away
              />
            );
          }

          // ── TEXT WITH WRAP: textarea (multi-line) ──
          // When text wrap is enabled, use textarea so user can press Enter
          // for new lines. Shift+Enter = no-op (DataGrid default is submit)
          if (isTextWrap) {
            return (
              <textarea
                className="w-full h-full px-2.5 py-2 text-xs bg-transparent outline-none border-0 resize-none"
                style={cellStyle}
                autoFocus
                value={String(row[column.key] || "")}
                onChange={(e) =>
                  onRowChange({ ...row, [column.key]: e.target.value })
                }
                onKeyDown={(e) => {
                  // Prevent Enter from closing the edit cell (allow newlines)
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.stopPropagation();
                  }
                }}
              />
            );
          }

          // ── DEFAULT TEXT: plain input ──
          return (
            <input
              className="w-full h-full px-2.5 text-xs bg-transparent outline-none border-0"
              style={cellStyle}
              autoFocus
              value={String(row[column.key] || "")}
              onChange={(e) =>
                onRowChange({ ...row, [column.key]: e.target.value })
              }
            />
          );
        },
      }),
    );

    return [rowNumberColumn, ...dataColumns];
  }, [
    // Dependencies: when any of these change, gridColumns is recalculated
    columns, // column definitions changed
    rows, // rows changed (needed for row index lookups)
    formatting, // formatting hook methods changed
    textWrap, // text wrap state changed
    cellTypes, // cell type overrides changed
    formulas, // formulas changed
    colOps, // column operation handlers changed
    protection, // protection state changed
    triggerSave, // save function reference changed
    renderCellByType, // FIX #3: now a stable useCallback reference
  ]);

  // ── HANDLE ROWS CHANGE ───────────────────────────────────
  // Called by DataGrid whenever any cell value changes
  // updatedRows = new array with the changed row
  //
  // Flow:
  // 1. If budget/inventory template → auto-recalculate totals
  // 2. Push to history (enables undo/redo)
  // 3. Trigger debounced save
  const handleRowsChange = useCallback(
    (updatedRows: SheetRow[]) => {
      let finalRows = updatedRows;
      // Budget template: auto-calculate total column
      if (templateId === "budget") finalRows = recalculateBudget(updatedRows);
      // Inventory template: auto-calculate stock value
      if (templateId === "inventory")
        finalRows = recalculateInventory(updatedRows);
      rowsHistory.pushState(finalRows);
      triggerSave();
    },
    [templateId, rowsHistory, triggerSave],
  );

  // ── FILTERED ROWS ─────────────────────────────────────────
  // If user typed in search box, filter rows to only show matches
  // Checks ALL columns for a match (case-insensitive)
  // Returns all rows if no search query
  const filteredRows = useMemo<SheetRow[]>(() => {
    if (!searchQuery) return rows;
    return rows.filter((row) =>
      columns.some((col) => {
        const value = row[col.key];
        return (
          value &&
          String(value).toLowerCase().includes(searchQuery.toLowerCase())
        );
      }),
    );
  }, [rows, searchQuery, columns]);

  // ── SELECTED CELL TYPE ────────────────────────────────────
  // What type is the currently selected cell?
  // Used to show the CellTypeSelector in the toolbar
  // Returns null if no cell selected
  const selectedCellType = useMemo(() => {
    if (!selectedCell) return null;
    const col = columns.find((c) => c.key === selectedCell.col);
    if (!col) return null;
    // getCellType: checks override first, then column default
    return cellTypes.getCellType(
      selectedCell.row,
      selectedCell.col,
      col.type || "text",
    );
  }, [selectedCell, columns, cellTypes]);

  // ── IS SELECTED COLUMN WRAPPED ────────────────────────────
  // Is text wrap enabled for the column of the selected cell?
  // Used to show WrapText button as active/inactive in toolbar
  const isSelectedColumnWrapped = useMemo(() => {
    if (!selectedCell) return false;
    return textWrap.textWrapColumns.has(selectedCell.col);
  }, [selectedCell, textWrap.textWrapColumns]);

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="h-screen flex flex-col bg-white">
      {/* ── HEADER ──────────────────────────────────────────
          Contains: back button, sheet icon, title input,
          star button, save status, org badge, export, share
      */}
      <header className="h-12 border-b border-gray-200 bg-gray-50 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          {/* Back button: navigates to previous page */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </Button>

          {/* Sheet icon */}
          <FileSpreadsheet className="h-4 w-4 text-green-600" />

          {/* Editable title input
              onChange: update title state + trigger debounced save */}
          <Input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              triggerSave();
            }}
            className="h-8 w-64 border-0 bg-white font-medium text-sm focus-visible:ring-1 focus-visible:ring-green-500 px-2 rounded"
          />

          {/* Star button: toggle favorite
              filled yellow = starred, gray = not starred */}
          <button onClick={() => setStarred(!starred)}>
            <Star
              className={`h-4 w-4 ${starred ? "fill-yellow-400 text-yellow-400" : "text-gray-400 hover:text-yellow-400"}`}
            />
          </button>

          {/* Save status indicator
              'saving' = spinning loader
              'saved' = green checkmark */}
          <div className="flex items-center gap-1 text-[11px] text-gray-500 ml-2">
            {saveStatus === "saving" ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Check className="h-3 w-3 text-green-600" />
                Saved
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Organization badge: only shown if this is an org sheet */}
          {isOrganizationSheet && (
            <Badge
              variant="outline"
              className="text-[10px] h-6 border-green-200 text-green-700 bg-green-50 gap-1"
            >
              <Users className="h-3 w-3" />
              Organization
            </Badge>
          )}

          {/* Export button: downloads CSV file */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs gap-1.5 border border-green-600 text-green-700 hover:bg-green-50"
            onClick={handleExport}
          >
            <Download className="h-3.5 w-3.5" /> Export
          </Button>

          {/* Share button: TODO - implement share link */}
          <Button
            variant="default"
            size="sm"
            className="h-8 text-xs gap-1.5 bg-green-600 hover:bg-green-700"
            onClick={() => toast.info("Share link copied!")}
          >
            <Share2 className="h-3.5 w-3.5" /> Share
          </Button>
        </div>
      </header>

      {/* ── TOOLBAR ─────────────────────────────────────────
          Contains: undo/redo, clipboard, cell type selector,
          formatting options, text wrap, protect, add/delete rows/cols
      */}
      <div className="h-11 border-b border-gray-200 bg-white flex items-center justify-between px-3">
        <div className="flex items-center gap-1">
          {/* Undo button - disabled if nothing to undo */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => rowsHistory.undo()}
            disabled={!rowsHistory.canUndo}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="h-4 w-4" />
          </Button>

          {/* Redo button - disabled if nothing to redo */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => rowsHistory.redo()}
            disabled={!rowsHistory.canRedo}
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Copy: copies selected cell value to internal clipboard */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => clipboard.copyCellOrRange(selectedCell)}
            title="Copy (Ctrl+C)"
          >
            <Copy className="h-4 w-4" />
          </Button>

          {/* Cut: copies + clears selected cell */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => clipboard.cutCellOrRange(selectedCell)}
            title="Cut (Ctrl+X)"
          >
            <Scissors className="h-4 w-4" />
          </Button>

          {/* Paste: pastes clipboard value into selected cell */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => clipboard.pasteCellOrRange(selectedCell)}
            title="Paste (Ctrl+V)"
          >
            <Clipboard className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Cell Type Selector: only shown when a cell is selected
              Allows changing this specific cell's type */}
          {selectedCell && selectedCellType && (
            <>
              <CellTypeSelector
                currentType={selectedCellType}
                onChangeType={(newType) =>
                  cellTypes.changeCellType(
                    selectedCell.row,
                    selectedCell.col,
                    newType,
                  )
                }
              />
              <Separator orientation="vertical" className="h-6 mx-1" />
            </>
          )}

          {/* Formatting Toolbar: bold, italic, underline, font size, colors, align
              currentFormat: current format of selected cell (to show active state)
              onFormatChange: applies format change to selected cell
              disabled: toolbar is greyed out if no cell selected */}
          <FormattingToolbar
            currentFormat={formatting.getCurrentCellFormat(selectedCell)}
            onFormatChange={(format) =>
              formatting.applyFormat(selectedCell, format)
            }
            disabled={!selectedCell}
          />

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Text Wrap Toggle: wraps text in the selected cell's column
              Shows as "secondary" (active) when wrap is enabled
              Disabled if no cell selected */}
          <Button
            variant={isSelectedColumnWrapped ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() =>
              textWrap.toggleTextWrapForSelectedColumn(selectedCell)
            }
            disabled={!selectedCell}
            title={
              isSelectedColumnWrapped
                ? "Disable text wrap for this column"
                : "Enable text wrap for this column"
            }
          >
            <WrapText
              className={`h-4 w-4 ${isSelectedColumnWrapped ? "text-green-600" : ""}`}
            />
          </Button>

          {/* Protect Cell Toggle: lock/unlock the selected cell
              Shows red lock icon when cell is protected
              Shows gray unlock icon when cell is not protected */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => protection.toggleProtectCell(selectedCell)}
            disabled={!selectedCell}
            title={
              selectedCell &&
              protection.isCellProtected(selectedCell.row, selectedCell.col)
                ? "Unprotect cell"
                : "Protect cell"
            }
          >
            {selectedCell &&
            protection.isCellProtected(selectedCell.row, selectedCell.col) ? (
              <Lock className="h-4 w-4 text-red-600" />
            ) : (
              <Unlock className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Right side: Add/Delete row and column buttons */}
        <div className="flex items-center gap-1">
          {/* Add Row: inserts a new empty row at the bottom */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs gap-1.5 border border-gray-300 hover:bg-gray-50"
            onClick={rowOps.insertRow}
          >
            <Plus className="h-3.5 w-3.5" /> Row
          </Button>

          {/* Add Column: inserts a new text column at the right */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs gap-1.5 border border-gray-300 hover:bg-gray-50"
            onClick={() => colOps.insertColumn("text")}
          >
            <Plus className="h-3.5 w-3.5" /> Column
          </Button>

          {/* Delete Row: deletes all selected (checked) rows
              Disabled if no rows are selected
              Shows count of selected rows in button label */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs gap-1.5 text-red-600 border border-red-200 hover:bg-red-50"
            onClick={() => rowOps.deleteRow(selectedRows)}
            disabled={selectedRows.size === 0}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete {selectedRows.size > 0 && `(${selectedRows.size})`}
          </Button>
        </div>
      </div>

      {/* ── DATA GRID ────────────────────────────────────────
          The main spreadsheet grid from react-data-grid library
          
          columns: our column definitions (from gridColumns useMemo)
          rows: filtered rows to display
          rowKeyGetter: tells DataGrid which field is the unique ID
          onRowsChange: called when user edits a cell
          selectedRows: which rows have their checkbox checked
          onSelectedRowsChange: called when user checks/unchecks rows
          onColumnResize: called when user drags column border to resize
          rowHeight: function that returns height for each row (varies with text wrap)
          headerRowHeight: fixed height for the header row
      */}
      <div className="flex-1 overflow-hidden bg-white">
        <DataGrid
          columns={gridColumns}
          rows={filteredRows}
          rowKeyGetter={(row: SheetRow) => row.id}
          onRowsChange={handleRowsChange}
          selectedRows={selectedRows}
          onSelectedRowsChange={setSelectedRows}
          onColumnResize={(idx, width) => {
            // idx is 1-based because of the row number column at index 0
            const col = columns[idx - 1];
            if (col) colOps.handleColumnResize(col.key, width, setColumns);
          }}
          rowHeight={(row) => {
            // Dynamic row height: taller for text-wrapped cells with multiple lines
            const rowIdx = rows.findIndex((r) => r.id === row.id);
            return textWrap.calculateRowHeight(rowIdx);
          }}
          headerRowHeight={36}
          className="rdg-light fill-grid"
        />
      </div>

      {/* ── GLOBAL CSS for react-data-grid ───────────────────
          Overrides default DataGrid styles to match our design
          Uses CSS custom properties (--rdg-*) for theming
      */}
      <style jsx global>{`
        .rdg {
          border: none;
          --rdg-selection-color: #16a34a;
          --rdg-background-color: #ffffff;
          --rdg-header-background-color: #f9fafb;
          --rdg-row-hover-background-color: #f9fafb;
          --rdg-border-color: #e5e7eb;
        }
        .rdg-cell {
          border-right: 1px solid #e5e7eb;
          border-bottom: 1px solid #e5e7eb;
          padding: 0 !important;
          background-color: #ffffff;
          cursor: pointer;
        }
        .rdg-header-row {
          background: #f9fafb;
          border-bottom: 1px solid #d1d5db;
        }
        .rdg-header-cell {
          border-right: 1px solid #e5e7eb;
          padding: 0 !important;
        }
        .rdg-row:hover .rdg-cell {
          background: #f9fafb;
        }
        .rdg-cell[aria-selected="true"] {
          outline: 2px solid #16a34a;
          outline-offset: -2px;
          z-index: 1;
        }
        .fill-grid {
          block-size: 100%;
        }
        .rdg-cell:first-child {
          background-color: #f9fafb !important;
          border-right: 1px solid #d1d5db !important;
          font-weight: 500;
          position: sticky;
          left: 0;
          z-index: 2;
        }
        .rdg-header-cell:first-child {
          background: #f9fafb !important;
          border-right: 1px solid #d1d5db !important;
        }
      `}</style>
    </div>
  );
}
