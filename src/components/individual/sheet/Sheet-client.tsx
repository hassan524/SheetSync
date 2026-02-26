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
import "react-data-grid/lib/styles.css";
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
import {
  SheetRow,
  ColumnDef,
  SaveStatus,
  PRIORITY_OPTIONS,
  STATUS_OPTIONS,
} from "@/types/sheet.types";
import {
  getTemplateData,
  recalculateBudget,
  recalculateInventory,
} from "@/lib/sheet-templates";

// ── SUPABASE LIB IMPORTS ─────────────────────
// Each file handles one specific table
import { updateSheetTitle, updateSheetStarred } from "@/lib/querys/sheet/sheet";
import { saveRow, saveAllRows, deleteRows } from "@/lib/querys/sheet/rows";
import { saveAllColumns, deleteColumn } from "@/lib/querys/sheet/columns";
import { saveCellFormat } from "@/lib/querys/sheet/format";
import { saveFormula, deleteFormula } from "@/lib/querys/sheet/formulas";
import { protectCell, unprotectCell } from "@/lib/querys/sheet/protection";

export default function SheetClient() {
  const params = useParams<{ id?: string }>();
  const searchParams = useSearchParams();
  const templateId = searchParams?.get("template") || "blank";
  const isOrganizationSheet = searchParams?.get("org") === "true";
  const router = useRouter();

  // sheetId: the actual DB id of this sheet
  // Used in every save call: saveRow(sheetId, ...)
  const sheetId = params?.id ?? "";

  const initialData = useMemo(() => getTemplateData(templateId), [templateId]);

  // ── HISTORY ──────────────────────────────────
  const rowsHistory = useHistory<SheetRow[]>(initialData.rows);
  const columnsHistory = useHistory<ColumnDef[]>(initialData.columns);

  // ── CORE STATE ───────────────────────────────
  const [title, setTitle] = useState<string>(initialData.title);
  const [rows, setRows] = useState<SheetRow[]>(initialData.rows);
  const [columns, setColumns] = useState<ColumnDef[]>(initialData.columns);
  const [starred, setStarred] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [selectedCell, setSelectedCell] = useState<{
    row: number;
    col: string;
  } | null>(null);

  // ── DEBOUNCE REFS ────────────────────────────
  // Separate timers for different debounced operations
  // useRef so they persist across renders without causing re-renders
  const titleSaveTimeout = useRef<NodeJS.Timeout | undefined>(undefined);
  const rowSaveTimeout = useRef<NodeJS.Timeout | undefined>(undefined);
  const columnResizeTimeout = useRef<NodeJS.Timeout | undefined>(undefined);

  // ── SYNC HISTORY → STATE ─────────────────────
  // When undo/redo changes history, sync back to local state
  // startTransition: prevents cascading renders (fixes error #1)
  useEffect(() => {
    startTransition(() => setRows(rowsHistory.currentState));
  }, [rowsHistory.currentState]);

  useEffect(() => {
    startTransition(() => setColumns(columnsHistory.currentState));
  }, [columnsHistory.currentState]);

  // ── SAVE STATUS HELPER ───────────────────────
  // Call this before any async save to show "Saving..." in header
  // Call setSaveStatus('saved') after save completes
  const markSaving = useCallback(() => setSaveStatus("saving"), []);
  const markSaved = useCallback(() => setSaveStatus("saved"), []);

  // ── ALL HOOKS ────────────────────────────────
  const formatting = useSheetFormatting(() => {}); // formatting saves handled inline below
  const textWrap = useTextWrap(rows, () => {}); // text wrap saves handled inline below
  const clipboard = useClipboard(rows, rowsHistory, () => {});
  const protection = useProtectedCells(() => {}); // protection saves handled inline below
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

  // ── KEYBOARD SHORTCUTS ───────────────────────
  useKeyboardShortcuts({
    selectedCell,
    rowsHistory,
    getCurrentCellFormat: formatting.getCurrentCellFormat,
    applyFormat: formatting.applyFormat,
    copyCellOrRange: clipboard.copyCellOrRange,
    pasteCellOrRange: clipboard.pasteCellOrRange,
    cutCellOrRange: clipboard.cutCellOrRange,
  });

  // ══════════════════════════════════════════════
  // SAVE HANDLERS - one for each type of change
  // ══════════════════════════════════════════════

  // ── SAVE TITLE ───────────────────────────────
  // Debounced 1 second - user might still be typing
  const handleTitleChange = useCallback(
    (newTitle: string) => {
      setTitle(newTitle);
      markSaving();
      if (titleSaveTimeout.current) clearTimeout(titleSaveTimeout.current);
      titleSaveTimeout.current = setTimeout(async () => {
        await updateSheetTitle(sheetId, newTitle);
        markSaved();
      }, 1000);
    },
    [sheetId, markSaving, markSaved],
  );

  // ── SAVE STARRED ─────────────────────────────
  // Immediate - single boolean toggle, tiny operation
  const handleStarredToggle = useCallback(async () => {
    const newStarred = !starred;
    setStarred(newStarred);
    await updateSheetStarred(sheetId, newStarred);
  }, [starred, sheetId]);

  // ── SAVE ROW (cell edit) ─────────────────────
  // Called by handleRowsChange whenever a cell value changes
  // Debounced 800ms - user might still be typing in the cell
  // Only saves the single row that changed (efficient!)
  const handleSaveChangedRow = useCallback(
    (updatedRows: SheetRow[], previousRows: SheetRow[]) => {
      // Find which specific row changed by comparing old vs new
      const changedRow = updatedRows.find((row, idx) => {
        const oldRow = previousRows[idx];
        // If row doesn't exist in old array or data changed
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
    },
    [sheetId, markSaving, markSaved],
  );

  // ── SAVE CELL FORMAT ─────────────────────────
  // Called when user applies bold, italic, color, alignment etc.
  // Immediate - no debounce, small data, important to save instantly
  const handleFormatChange = useCallback(
    async (format: any) => {
      if (!selectedCell) return;

      // 1. Update React state immediately (user sees change instantly)
      formatting.applyFormat(selectedCell, format);

      // 2. Get the full merged format for this cell
      const currentFormat = formatting.getCurrentCellFormat(selectedCell);
      const mergedFormat = { ...currentFormat, ...format };

      // 3. Build cell key: 'rowIndex-columnKey' e.g. '2-col_1'
      const cellKey = `${selectedCell.row}-${selectedCell.col}`;

      // 4. Save to DB
      markSaving();
      await saveCellFormat(sheetId, cellKey, mergedFormat);
      markSaved();
    },
    [selectedCell, formatting, sheetId, markSaving, markSaved],
  );

  // ── SAVE PROTECTION ──────────────────────────
  // Called when user clicks Lock/Unlock button
  // Immediate - critical security feature
  const handleProtectionToggle = useCallback(async () => {
    if (!selectedCell) return;

    const cellKey = protection.getCellKey(selectedCell.row, selectedCell.col);
    const isCurrentlyProtected = protection.isCellProtected(
      selectedCell.row,
      selectedCell.col,
    );

    // 1. Update state immediately
    protection.toggleProtectCell(selectedCell);

    // 2. Save to DB
    markSaving();
    if (isCurrentlyProtected) {
      // Was protected → now unprotecting → DELETE from protected_cells
      await unprotectCell(sheetId, cellKey);
    } else {
      // Was not protected → now protecting → INSERT into protected_cells
      await protectCell(sheetId, cellKey);
    }
    markSaved();
  }, [selectedCell, protection, sheetId, markSaving, markSaved]);

  // ── SAVE ADD ROW ─────────────────────────────
  // Called when user clicks "+ Row" button
  // Saves ALL rows because positions need updating
  const handleInsertRow = useCallback(async () => {
    // 1. Update state (rowOps.insertRow pushes to history)
    rowOps.insertRow();

    // 2. Get the new rows array from history after insert
    // Small delay to let history update
    setTimeout(async () => {
      markSaving();
      await saveAllRows(sheetId, rowsHistory.currentState);
      markSaved();
    }, 50);
  }, [rowOps, sheetId, rowsHistory, markSaving, markSaved]);

  // ── SAVE DELETE ROW ──────────────────────────
  // Called when user clicks Delete button with rows selected
  const handleDeleteRow = useCallback(async () => {
    if (selectedRows.size === 0) return;

    const rowKeysToDelete = Array.from(selectedRows);

    // 1. Update state
    rowOps.deleteRow(selectedRows);

    // 2. Delete specific rows from DB
    markSaving();
    await deleteRows(sheetId, rowKeysToDelete);

    // 3. Re-save remaining rows to fix positions
    setTimeout(async () => {
      await saveAllRows(sheetId, rowsHistory.currentState);
      markSaved();
    }, 50);
  }, [selectedRows, rowOps, sheetId, rowsHistory, markSaving, markSaved]);

  // ── SAVE ADD COLUMN ──────────────────────────
  // Called when user clicks "+ Column" button
  const handleInsertColumn = useCallback(
    async (type: ColumnDef["type"]) => {
      // 1. Update state
      colOps.insertColumn(type);

      // 2. Save all columns + rows (rows need new column key in JSONB)
      setTimeout(async () => {
        markSaving();
        await Promise.all([
          saveAllColumns(
            sheetId,
            columnsHistory.currentState,
            textWrap.textWrapColumns,
          ),
          saveAllRows(sheetId, rowsHistory.currentState),
        ]);
        markSaved();
      }, 50);
    },
    [
      colOps,
      sheetId,
      columnsHistory,
      rowsHistory,
      textWrap.textWrapColumns,
      markSaving,
      markSaved,
    ],
  );

  // ── SAVE DELETE COLUMN ───────────────────────
  // Called when user deletes a column from header menu
  const handleDeleteColumn = useCallback(
    async (colKey: string) => {
      // 1. Update state
      colOps.deleteColumn(colKey);

      // 2. Delete column from DB
      markSaving();
      await deleteColumn(sheetId, colKey);

      // 3. Re-save remaining columns and all rows (remove that key from JSONB)
      setTimeout(async () => {
        await Promise.all([
          saveAllColumns(
            sheetId,
            columnsHistory.currentState,
            textWrap.textWrapColumns,
          ),
          saveAllRows(sheetId, rowsHistory.currentState),
        ]);
        markSaved();
      }, 50);
    },
    [
      colOps,
      sheetId,
      columnsHistory,
      rowsHistory,
      textWrap.textWrapColumns,
      markSaving,
      markSaved,
    ],
  );

  // ── SAVE COLUMN TYPE CHANGE ──────────────────
  // Called when user changes column type from header menu
  const handleChangeColumnType = useCallback(
    async (colKey: string, newType: ColumnDef["type"]) => {
      // 1. Update state
      colOps.changeColumnType(colKey, newType);

      // 2. Save columns (type changed) + rows (values converted for new type)
      setTimeout(async () => {
        markSaving();
        await Promise.all([
          saveAllColumns(
            sheetId,
            columnsHistory.currentState,
            textWrap.textWrapColumns,
          ),
          saveAllRows(sheetId, rowsHistory.currentState),
        ]);
        markSaved();
      }, 50);
    },
    [
      colOps,
      sheetId,
      columnsHistory,
      rowsHistory,
      textWrap.textWrapColumns,
      markSaving,
      markSaved,
    ],
  );

  // ── SAVE COLUMN RESIZE ───────────────────────
  // Debounced 500ms - resize fires many times while dragging
  // Only save after user stops dragging
  const handleColumnResize = useCallback(
    (colKey: string, width: number) => {
      // 1. Update state immediately (visual feedback while dragging)
      colOps.handleColumnResize(colKey, width, setColumns);

      // 2. Debounced save
      if (columnResizeTimeout.current)
        clearTimeout(columnResizeTimeout.current);
      columnResizeTimeout.current = setTimeout(async () => {
        markSaving();
        await saveAllColumns(
          sheetId,
          columnsHistory.currentState,
          textWrap.textWrapColumns,
        );
        markSaved();
      }, 500);
    },
    [
      colOps,
      sheetId,
      columnsHistory,
      textWrap.textWrapColumns,
      markSaving,
      markSaved,
    ],
  );

  // ── SAVE COLUMN REORDER ──────────────────────
  // Called when user finishes drag-and-drop reordering
  const handleColumnDragEnd = useCallback(async () => {
    colOps.handleColumnDragEnd();

    setTimeout(async () => {
      markSaving();
      await saveAllColumns(
        sheetId,
        columnsHistory.currentState,
        textWrap.textWrapColumns,
      );
      markSaved();
    }, 50);
  }, [
    colOps,
    sheetId,
    columnsHistory,
    textWrap.textWrapColumns,
    markSaving,
    markSaved,
  ]);

  // ── SAVE TEXT WRAP ───────────────────────────
  // Called when user toggles text wrap on a column
  // Text wrap is stored as a boolean on the columns table
  const handleTextWrapToggle = useCallback(
    async (colKey: string) => {
      // 1. Update state
      textWrap.toggleTextWrap(colKey);

      // 2. Save columns (text_wrap_enabled updated)
      setTimeout(async () => {
        markSaving();
        await saveAllColumns(sheetId, columns, textWrap.textWrapColumns);
        markSaved();
      }, 50);
    },
    [textWrap, sheetId, columns, markSaving, markSaved],
  );

  // ── EXPORT ───────────────────────────────────
  const handleExport = useCallback(() => {
    const csvHeaders = columns.map((c) => c.name).join(",");
    const csvRows = rows.map((row) =>
      columns
        .map((col) => {
          const val = row[col.key] ?? "";
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
    URL.revokeObjectURL(url);
    toast.success("Exported successfully");
  }, [columns, rows, title]);

  // ── RENDER CELL BY TYPE ──────────────────────
  const renderCellByType = useCallback(
    (
      type: ColumnDef["type"],
      props: RenderCellProps<SheetRow>,
      colKey: string,
    ) => {
      const { row } = props;
      const rowIdx = rows.findIndex((r) => r.id === row.id);
      const cellStyle = formatting.getCellStyle(
        rowIdx,
        colKey,
        textWrap.textWrapColumns,
      );
      const cellKey = protection.getCellKey(rowIdx, colKey);
      const formula = formulas.formulas[cellKey];
      const isProtected = protection.isCellProtected(rowIdx, colKey);

      let displayValue = row[colKey];
      if (formula && formula.startsWith("=")) {
        displayValue = formulas.evaluateFormula(formula, rowIdx);
      }

      const cellContent = (() => {
        switch (type) {
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
          case "checkbox":
            return displayValue ? (
              <CheckSquare className="h-4 w-4 text-green-600" />
            ) : (
              <Square className="h-4 w-4 text-muted-foreground/40" />
            );
          case "date":
            return displayValue ? (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3 w-3 text-gray-500" />
                <span>{String(displayValue)}</span>
              </div>
            ) : null;
          case "currency":
            return displayValue
              ? `$${Number(displayValue).toLocaleString("en-US", { minimumFractionDigits: 2 })}`
              : "";
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
          default:
            return displayValue !== undefined ? String(displayValue) : "";
        }
      })();

      return (
        <div
          className={`h-full w-full flex items-center
          ${type === "currency" || type === "number" ? "justify-end" : ""}
          ${type === "checkbox" ? "justify-center" : ""}
          px-2.5 py-2 text-xs gap-1.5 relative`}
          style={cellStyle}
          onClick={() => setSelectedCell({ row: rowIdx, col: colKey })}
        >
          {isProtected && (
            <Lock className="absolute top-1 right-1 h-2.5 w-2.5 text-gray-400" />
          )}
          {cellContent}
        </div>
      );
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

  // ── GRID COLUMNS ─────────────────────────────
  const gridColumns = useMemo<Column<SheetRow>[]>(() => {
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

    const dataColumns = columns.map(
      (col): Column<SheetRow> => ({
        key: col.key,
        name: col.name,
        width: col.width || 150,
        resizable: true,

        renderHeaderCell: () => (
          <div
            className="h-full w-full flex items-center gap-1 px-2 group bg-gray-50 border-b border-r border-gray-200"
            draggable
            onDragStart={() => colOps.handleColumnDragStart(col.key)}
            onDragOver={(e) =>
              colOps.handleColumnDragOver(e, col.key, setColumns)
            }
            onDragEnd={handleColumnDragEnd} // ← uses our save handler
          >
            <GripVertical className="h-3 w-3 text-gray-400 flex-shrink-0 cursor-move opacity-0 group-hover:opacity-100" />
            <span className="flex-1 text-[11px] font-semibold truncate text-gray-700">
              {col.name}
            </span>
            {textWrap.textWrapColumns.has(col.key) && (
              <WrapText className="h-3 w-3 text-green-600" />
            )}
            <ColumnHeaderMenu
              column={col}
              onChangeType={(newType) =>
                handleChangeColumnType(col.key, newType)
              }
              onDelete={() => handleDeleteColumn(col.key)}
              onToggleTextWrap={() => handleTextWrapToggle(col.key)}
              textWrapEnabled={textWrap.textWrapColumns.has(col.key)}
            />
          </div>
        ),

        renderCell(props: RenderCellProps<SheetRow>) {
          const rowIdx = rows.findIndex((r) => r.id === props.row.id);
          const cellType = cellTypes.getCellType(
            rowIdx,
            col.key,
            col.type || "text",
          );
          return renderCellByType(cellType, props, col.key);
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
          const formula = formulas.formulas[cellKey];
          const isTextWrap = textWrap.textWrapColumns.has(col.key);
          const isProtected = protection.isCellProtected(rowIdx, col.key);

          if (isProtected) {
            toast.error("Cell is protected");
            return (
              <div className="h-full w-full flex items-center px-2.5 text-xs bg-gray-100">
                <Lock className="h-3 w-3 mr-1 text-gray-500" />
                Protected
              </div>
            );
          }

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
                    // Store as formula string
                    formulas.setFormulas((prev) => ({
                      ...prev,
                      [cellKey]: val,
                    }));
                  } else {
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
                onBlur={async () => {
                  // Save formula when user clicks away
                  if (formula) {
                    await saveFormula(sheetId, cellKey, formula);
                  } else {
                    await deleteFormula(sheetId, cellKey);
                  }
                }}
              />
            );
          }

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
                  if (e.key === "Enter" && !e.shiftKey) e.stopPropagation();
                }}
              />
            );
          }

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
    columns,
    rows,
    formatting,
    textWrap,
    cellTypes,
    formulas,
    colOps,
    protection,
    renderCellByType,
    handleColumnDragEnd,
    handleChangeColumnType,
    handleDeleteColumn,
    handleTextWrapToggle,
    sheetId,
  ]);

  // ── HANDLE ROWS CHANGE ───────────────────────
  // Called by DataGrid when any cell value changes
  // Saves the specific row that changed (debounced)
  const handleRowsChange = useCallback(
    (updatedRows: SheetRow[]) => {
      const previousRows = rows; // capture before state update
      let finalRows = updatedRows;
      if (templateId === "budget") finalRows = recalculateBudget(updatedRows);
      if (templateId === "inventory")
        finalRows = recalculateInventory(updatedRows);

      rowsHistory.pushState(finalRows);

      // Save only the row that changed
      handleSaveChangedRow(finalRows, previousRows);
    },
    [templateId, rowsHistory, rows, handleSaveChangedRow],
  );

  // ── FILTERED ROWS ─────────────────────────────
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

  const selectedCellType = useMemo(() => {
    if (!selectedCell) return null;
    const col = columns.find((c) => c.key === selectedCell.col);
    if (!col) return null;
    return cellTypes.getCellType(
      selectedCell.row,
      selectedCell.col,
      col.type || "text",
    );
  }, [selectedCell, columns, cellTypes]);

  const isSelectedColumnWrapped = useMemo(() => {
    if (!selectedCell) return false;
    return textWrap.textWrapColumns.has(selectedCell.col);
  }, [selectedCell, textWrap.textWrapColumns]);

  // ══════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════
  return (
    <div className="h-screen flex flex-col bg-white">
      {/* HEADER */}
      <header className="h-12 border-b border-gray-200 bg-gray-50 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </Button>
          <FileSpreadsheet className="h-4 w-4 text-green-600" />

          {/* Title input - uses handleTitleChange which debounces the save */}
          <Input
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="h-8 w-64 border-0 bg-white font-medium text-sm focus-visible:ring-1 focus-visible:ring-green-500 px-2 rounded"
          />

          {/* Star button - uses handleStarredToggle which saves immediately */}
          <button onClick={handleStarredToggle}>
            <Star
              className={`h-4 w-4 ${starred ? "fill-yellow-400 text-yellow-400" : "text-gray-400 hover:text-yellow-400"}`}
            />
          </button>

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
          {isOrganizationSheet && (
            <Badge
              variant="outline"
              className="text-[10px] h-6 border-green-200 text-green-700 bg-green-50 gap-1"
            >
              <Users className="h-3 w-3" />
              Organization
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs gap-1.5 border border-green-600 text-green-700 hover:bg-green-50"
            onClick={handleExport}
          >
            <Download className="h-3.5 w-3.5" /> Export
          </Button>
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

      {/* TOOLBAR */}
      <div className="h-11 border-b border-gray-200 bg-white flex items-center justify-between px-3">
        <div className="flex items-center gap-1">
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

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => clipboard.copyCellOrRange(selectedCell)}
            title="Copy (Ctrl+C)"
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => clipboard.cutCellOrRange(selectedCell)}
            title="Cut (Ctrl+X)"
          >
            <Scissors className="h-4 w-4" />
          </Button>
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

          {/* FormattingToolbar now calls handleFormatChange which saves to DB */}
          <FormattingToolbar
            currentFormat={formatting.getCurrentCellFormat(selectedCell)}
            onFormatChange={handleFormatChange}
            disabled={!selectedCell}
          />
          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Text wrap toggle - calls handleTextWrapToggle which saves to DB */}
          <Button
            variant={isSelectedColumnWrapped ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() =>
              selectedCell && handleTextWrapToggle(selectedCell.col)
            }
            disabled={!selectedCell}
            title={
              isSelectedColumnWrapped ? "Disable text wrap" : "Enable text wrap"
            }
          >
            <WrapText
              className={`h-4 w-4 ${isSelectedColumnWrapped ? "text-green-600" : ""}`}
            />
          </Button>

          {/* Protect cell toggle - calls handleProtectionToggle which saves to DB */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleProtectionToggle}
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

        <div className="flex items-center gap-1">
          {/* Add Row - calls handleInsertRow which saves to DB */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs gap-1.5 border border-gray-300 hover:bg-gray-50"
            onClick={handleInsertRow}
          >
            <Plus className="h-3.5 w-3.5" /> Row
          </Button>
          {/* Add Column - calls handleInsertColumn which saves to DB */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs gap-1.5 border border-gray-300 hover:bg-gray-50"
            onClick={() => handleInsertColumn("text")}
          >
            <Plus className="h-3.5 w-3.5" /> Column
          </Button>
          {/* Delete Row - calls handleDeleteRow which saves to DB */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs gap-1.5 text-red-600 border border-red-200 hover:bg-red-50"
            onClick={handleDeleteRow}
            disabled={selectedRows.size === 0}
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete{" "}
            {selectedRows.size > 0 && `(${selectedRows.size})`}
          </Button>
        </div>
      </div>

      {/* GRID */}
      <div className="flex-1 overflow-hidden bg-white">
        <DataGrid
          columns={gridColumns}
          rows={filteredRows}
          rowKeyGetter={(row: SheetRow) => row.id}
          onRowsChange={handleRowsChange}
          selectedRows={selectedRows}
          onSelectedRowsChange={setSelectedRows}
          onColumnResize={(idx, width) => {
            const col = columns[idx - 1];
            if (col) handleColumnResize(col.key, width); // ← save handler
          }}
          rowHeight={(row) => {
            const rowIdx = rows.findIndex((r) => r.id === row.id);
            return textWrap.calculateRowHeight(rowIdx);
          }}
          headerRowHeight={36}
          className="rdg-light fill-grid"
        />
      </div>

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
