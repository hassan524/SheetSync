// hooks/sheets/use-row-operations.ts
import { useCallback } from "react";
import { toast } from "sonner";
import type { SheetRow, ColumnDef } from "@/types/sheet.types";

export function useRowOperations(
  rows: SheetRow[],
  columns: ColumnDef[],
  rowsHistory: any,
  onSave: () => void,
) {
  const insertRow = useCallback(() => {
    const newRow: SheetRow = { id: String(Date.now()) };
    columns.forEach((col) => {
      if (col.type === "checkbox") newRow[col.key] = false;
      else if (col.type === "number" || col.type === "currency")
        newRow[col.key] = 0;
      else if (col.type === "priority") newRow[col.key] = "low";
      else if (col.type === "status") newRow[col.key] = "todo";
      else if (col.type === "date")
        newRow[col.key] = new Date().toISOString().split("T")[0];
      else newRow[col.key] = "";
    });
    rowsHistory.pushState([...rows, newRow]);
    onSave();
  }, [columns, rows, rowsHistory, onSave]);

  const deleteRow = useCallback(
    (selectedRows: Set<string>) => {
      if (selectedRows.size === 0) {
        toast.error("Select rows to delete");
        return;
      }
      rowsHistory.pushState(rows.filter((row) => !selectedRows.has(row.id)));
      onSave();
    },
    [rows, rowsHistory, onSave],
  );

  return {
    insertRow,
    deleteRow,
  };
}
