import { useCallback, useRef } from "react";
import { toast } from "sonner";
import { SheetRow, ColumnDef, SaveStatus } from "@/types/index";
import { saveRow, saveAllRows } from "@/lib/querys/sheet/rows";
import { saveAllColumns } from "@/lib/querys/sheet/columns";
import { saveAllCellFormats } from "@/lib/querys/sheet/format";
import { saveAllFormulas } from "@/lib/querys/sheet/formulas";
import { logActivity } from "@/lib/querys/activity/activity";
import { logCellEdit } from "@/lib/querys/sheet/firebase-realtime";
import { maybeAutoSnapshot } from "@/lib/querys/sheet/snapshots";
import { exportSheet, ExportFormat } from "@/lib/querys/export";

interface UsePersistenceProps {
  sheetId: string;
  organizationId: string | null;
  isOrgSheet: boolean;
  title: string;
  rows: SheetRow[];
  columns: ColumnDef[];
  currentUserId?: string;
  setSaveStatus: (s: SaveStatus) => void;
  rowsHistoryCurrentState: SheetRow[];
}

export function useSheetPersistence({
  sheetId,
  organizationId,
  isOrgSheet,
  title,
  rows,
  columns,
  currentUserId,
  setSaveStatus,
  rowsHistoryCurrentState,
}: UsePersistenceProps) {
  const rowSaveTimeout = useRef<NodeJS.Timeout | undefined>(undefined);
  const pendingRowSavesRef = useRef<Map<string, { row: SheetRow; position: number }>>(new Map());
  const activityLogTimeout = useRef<NodeJS.Timeout | undefined>(undefined);

  const markSaving = useCallback(() => setSaveStatus("saving"), [setSaveStatus]);
  const markSaved = useCallback(() => setSaveStatus("saved"), [setSaveStatus]);

  const logCellEditActivity = useCallback(
    (sheetTitle: string, cellLabel?: string) => {
      clearTimeout(activityLogTimeout.current);
      activityLogTimeout.current = setTimeout(() => {
        logActivity({
          sheetId,
          organizationId: organizationId ?? undefined,
          action: cellLabel ? "updated cell" : "updated cells",
          target: cellLabel ? `${cellLabel} in ${sheetTitle || title}` : sheetTitle || title,
        }).catch(() => {});
      }, 30000);
    },
    [sheetId, organizationId, title],
  );

  const persistPendingRowsNow = useCallback(async () => {
    clearTimeout(rowSaveTimeout.current);
    const pendingRows = Array.from(pendingRowSavesRef.current.values());
    pendingRowSavesRef.current.clear();
    if (pendingRows.length === 0) return;
    try {
      await Promise.all(
        pendingRows.map(({ row, position }) => saveRow(sheetId, row, position)),
      );
    } catch (error: any) {
      toast.error(error?.message ?? "Some cell changes failed to save.");
    }
  }, [sheetId]);

  const queueChangedRowsSave = useCallback(
    (updated: SheetRow[], prev: SheetRow[]) => {
      updated.forEach((row, index) => {
        const prevRow = prev[index];
        if (!prevRow || JSON.stringify(row) !== JSON.stringify(prevRow)) {
          pendingRowSavesRef.current.set(row.id, { row, position: index });
        }
      });
      if (pendingRowSavesRef.current.size === 0) return;
      clearTimeout(rowSaveTimeout.current);
      rowSaveTimeout.current = setTimeout(() => {
        persistPendingRowsNow();
      }, 180);
    },
    [persistPendingRowsNow],
  );

  const handleRowsChange = useCallback(
    (
      updatedRows: SheetRow[],
      prevRows: SheetRow[],
      pushState: (rows: SheetRow[]) => void,
    ) => {
      pushState(updatedRows);
      queueChangedRowsSave(updatedRows, prevRows);
      let hadChange = false;
      let firstChangedCell: string | undefined;
      updatedRows.forEach((row, rowIdx) => {
        const prevRow = prevRows[rowIdx];
        if (!prevRow) return;
        columns.forEach((col) => {
          const o = prevRow[col.key];
          const n = row[col.key];
          if (o !== n) {
            hadChange = true;
            const cl = String.fromCharCode(65 + columns.findIndex((c) => c.key === col.key));
            firstChangedCell ??= `${cl}${rowIdx + 1}`;
            logCellEdit(sheetId, `${cl}${rowIdx + 1}`, col.name, o ?? null, n ?? null);
          }
        });
      });
      if (hadChange) {
        logCellEditActivity(title, firstChangedCell);
        maybeAutoSnapshot(sheetId, updatedRows, columns, currentUserId).catch(() => {});
      }
    },
    [columns, sheetId, title, queueChangedRowsSave, logCellEditActivity, currentUserId],
  );

  const handleExport = useCallback(
    async (format: ExportFormat) => {
      const id = toast.loading(`Preparing ${format.toUpperCase()} export…`);
      try {
        await persistPendingRowsNow();
        await exportSheet({ format, sheetId });
        toast.success(`Downloaded as ${format.toUpperCase()}`, { id });
      } catch (error: any) {
        toast.error(error?.message ?? "Export failed. Please try again.", { id });
      }
    },
    [persistPendingRowsNow, sheetId],
  );

  return {
    markSaving,
    markSaved,
    persistPendingRowsNow,
    queueChangedRowsSave,
    handleRowsChange,
    handleExport,
    logCellEditActivity,
  };
}