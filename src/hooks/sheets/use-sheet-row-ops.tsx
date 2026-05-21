import { useCallback } from "react";
import { toast } from "sonner";
import { SheetRow, ColumnDef, SaveStatus } from "@/types/index";
import { saveAllRows, deleteRows } from "@/lib/querys/sheet/rows";
import { logActivity } from "@/lib/querys/activity/activity";
import { logRowAdd, logRowDelete } from "@/lib/querys/sheet/firebase-realtime";

interface UseRowOpsProps {
  sheetId: string;
  organizationId: string | null;
  isOrgSheet: boolean;
  title: string;
  rows: SheetRow[];
  columns: ColumnDef[];
  selectedRows: Set<string>;
  setSelectedRows: (s: Set<string>) => void;
  setSaveStatus: (s: SaveStatus) => void;
  rowOps: { insertRow: () => void; deleteRow: (selected: Set<string>) => void };
  rowsHistory: { currentState: SheetRow[]; pushState: (rows: SheetRow[]) => void };
  markSaving: () => void;
  markSaved: () => void;
}

export function useSheetRowOps({
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
}: UseRowOpsProps) {
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
  }, [rowOps, sheetId, rowsHistory, markSaving, markSaved, isOrgSheet, organizationId, title, setSaveStatus]);

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
  }, [selectedRows, rowOps, sheetId, rowsHistory, markSaving, markSaved, setSelectedRows, isOrgSheet, organizationId, title, setSaveStatus]);

  const handleSort = useCallback(
    (dir: "asc" | "desc") => {
      if (!rows.length) {
        toast.info("Select a column first to sort");
        return;
      }
      // sort happens externally via selectedCell — kept here for action bar
      toast.info("Select a cell in the column you want to sort");
    },
    [rows],
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
    [rows, rowsHistory],
  );

  const handleSortBySelectedCell = useCallback(
    (selectedCell: { row: number; col: string } | null, dir: "asc" | "desc") => {
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
    [rows, rowsHistory],
  );

  return {
    handleInsertRow,
    handleDeleteRow,
    handleSort,
    handleSortByColumn,
    handleSortBySelectedCell,
  };
}