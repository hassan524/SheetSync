import { useCallback } from "react";
import { toast } from "sonner";
import { SheetRow, ColumnDef, SaveStatus, SelectOption } from "@/types/index";
import { saveAllRows } from "@/lib/querys/sheet/rows";
import { saveAllColumns, deleteColumn } from "@/lib/querys/sheet/columns";
import { logActivity } from "@/lib/querys/activity/activity";
import { logColAdd, logColDelete, logColumnRename } from "@/lib/querys/sheet/firebase-realtime";
import { normalizeGeneratedColumnNames, columnIndexToName } from "@/utils/SheetUtils";
import { SelectSetupDialogState } from "@/types/index";

interface UseColOpsProps {
  sheetId: string;
  organizationId: string | null;
  isOrgSheet: boolean;
  title: string;
  rows: SheetRow[];
  columns: ColumnDef[];
  setSheetState: (updater: any) => void;
  setSelectSetupDialog: (d: SelectSetupDialogState) => void;
  setSaveStatus: (s: SaveStatus) => void;
  colOps: {
    insertColumn: (type: ColumnDef["type"]) => void;
    deleteColumn: (key: string) => void;
    changeColumnType: (key: string, type: ColumnDef["type"]) => { updatedColumns: ColumnDef[]; updatedRows: SheetRow[] };
    renameColumn: (key: string, name: string) => void;
    handleColumnDragStart: (key: string) => void;
    handleColumnDragOver: (e: any, key: string, setter: any) => void;
    handleColumnDragEnd: () => void;
    handleColumnResize: (key: string, width: number, setter: any) => void;
  };
  columnsHistory: { currentState: ColumnDef[]; pushState: (cols: ColumnDef[]) => void };
  rowsHistory: { currentState: SheetRow[]; pushState: (rows: SheetRow[]) => void };
  markSaving: () => void;
  markSaved: () => void;
  currentUser: { id: string } | null;
  selectedCell: { row: number; col: string } | null;
}

export function useSheetColOps({
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
}: UseColOpsProps) {
  const persistColumns = useCallback(
    async (nextColumns: ColumnDef[]) => {
      setSheetState((p: any) => ({ ...p, columns: nextColumns }));
      columnsHistory.pushState(nextColumns);
      markSaving();
      await saveAllColumns(sheetId, nextColumns);
      markSaved();
    },
    [columnsHistory, markSaved, markSaving, sheetId, setSheetState],
  );

  const handleInsertColumn = useCallback(
    async (type: ColumnDef["type"]) => {
      colOps.insertColumn(type);
      setTimeout(async () => {
        markSaving();
        const normalizedCols = normalizeGeneratedColumnNames(columnsHistory.currentState);
        columnsHistory.pushState(normalizedCols);
        setSheetState((p: any) => ({ ...p, columns: normalizedCols }));
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
        }).catch(() => { });
      }, 50);
    },
    [colOps, sheetId, columnsHistory, rowsHistory, markSaving, markSaved, isOrgSheet, organizationId, title, setSheetState],
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
        }).catch(() => { });
      }, 50);
    },
    [colOps, sheetId, columnsHistory, rowsHistory, markSaving, markSaved, columns, isOrgSheet, organizationId, title],
  );

  const handleChangeColumnType = useCallback(
    async (colKey: string, newType: ColumnDef["type"]) => {
      if (!newType) return;

      try {
        markSaving();

        const { updatedColumns, updatedRows } = colOps.changeColumnType(
          colKey,
          newType,
        );

        await Promise.all([
          saveAllColumns(sheetId, updatedColumns),
          saveAllRows(sheetId, updatedRows),
        ]);

        markSaved();
      } catch (err: any) {
        console.error(err);
      }
    },
    [colOps, sheetId]
  );
  const handleColumnDragEnd = useCallback(async () => {
    colOps.handleColumnDragEnd();
    setTimeout(async () => {
      markSaving();
      await saveAllColumns(sheetId, columnsHistory.currentState);
      markSaved();
    }, 50);
  }, [colOps, sheetId, columnsHistory, markSaving, markSaved]);

  const handleColumnResize = useCallback(
    (colKey: string, width: number) => {
      colOps.handleColumnResize(colKey, width, (updater: any) => {
        setSheetState((p: any) => ({
          ...p,
          columns: typeof updater === "function" ? updater(p.columns) : updater,
        }));
      });
      setTimeout(async () => {
        markSaving();
        await saveAllColumns(sheetId, columnsHistory.currentState);
        markSaved();
      }, 500);
    },
    [colOps, sheetId, columnsHistory, markSaving, markSaved, setSheetState],
  );

  const handleHideColumn = useCallback(async () => {
    if (!isOrgSheet || !currentUser) {
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
    setSheetState((p: any) => ({ ...p, columns: updatedColumns }));
    columnsHistory.pushState(updatedColumns);
    markSaving();
    await saveAllColumns(sheetId, updatedColumns);
    markSaved();
    toast.success(col.hidden ? "Column shown" : "Column hidden");
  }, [selectedCell, columns, sheetId, columnsHistory, markSaving, markSaved, isOrgSheet, currentUser, setSheetState]);

  const handleRenameColumn = useCallback(
    async (colKey: string, newName: string) => {
      const oldName = columns.find((c) => c.key === colKey)?.name ?? colKey;
      colOps.renameColumn(colKey, newName);
      setTimeout(async () => {
        markSaving();
        await saveAllColumns(sheetId, columnsHistory.currentState);
        if (isOrgSheet) logColumnRename(sheetId, oldName, newName);
        markSaved();
      }, 50);
    },
    [colOps, sheetId, columnsHistory, markSaving, markSaved, isOrgSheet, columns],
  );

  const insertColumnAt = useCallback(
    (index: number, base?: ColumnDef | null, mode: "blank" | "duplicate" = "blank") => {
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
        ...(type === "currency" ? { currencyCode: base?.currencyCode ?? "USD" } : {}),
        ...(type === "select" && base?.selectOptions ? { selectOptions: base.selectOptions } : {}),
      };
      const nextCols = [...columns];
      nextCols.splice(Math.max(0, Math.min(nextCols.length, index)), 0, newCol);
      const namedCols = mode === "duplicate" ? nextCols : normalizeGeneratedColumnNames(nextCols);
      columnsHistory.pushState(namedCols);
      setSheetState((p: any) => ({ ...p, columns: namedCols }));
      const nextRows = rows.map((r) => {
        const nr: any = { ...r };
        if (mode === "duplicate" && base) {
          nr[newKey] = r[base.key];
        } else {
          if (type === "checkbox") nr[newKey] = false;
          else if (type === "number" || type === "currency" || type === "progress") nr[newKey] = 0;
          else if (type === "image") nr[newKey] = "";
          else if (type === "priority") nr[newKey] = "Medium";
          else if (type === "status") nr[newKey] = "Not Started";
          else if (type === "date") nr[newKey] = new Date().toISOString().split("T")[0];
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
        else if (type === "number" || type === "currency" || type === "progress") nr[col.key] = 0;
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
    [rows, rowsHistory, markSaving, markSaved, sheetId, setSaveStatus],
  );

  const handleUpdateSelectOptions = useCallback(
    async (colKey: string, options: SelectOption[]) => {
      setSheetState((p: any) => ({
        ...p,
        columns: p.columns.map((c: ColumnDef) =>
          c.key === colKey ? { ...c, selectOptions: options } : c,
        ),
      }));
      columnsHistory.pushState(
        columns.map((c) => (c.key === colKey ? { ...c, selectOptions: options } : c)),
      );
      markSaving();
      setTimeout(async () => {
        await saveAllColumns(sheetId, columnsHistory.currentState);
        markSaved();
      }, 50);
    },
    [columns, columnsHistory, sheetId, markSaving, markSaved, setSheetState],
  );

  return {
    persistColumns,
    handleInsertColumn,
    handleDeleteColumn,
    handleChangeColumnType,
    handleColumnDragEnd,
    handleColumnResize,
    handleHideColumn,
    handleRenameColumn,
    insertColumnAt,
    clearColumnValues,
    handleUpdateSelectOptions,
  };
}
