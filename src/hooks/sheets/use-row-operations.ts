// hooks/sheets/use-row-operations.ts
import { useCallback } from "react";
import { toast } from "sonner";
import { SheetRow, ColumnDef } from "@/types";

export function useRowOperations(
  rows: SheetRow[],
  columns: ColumnDef[],
  rowsHistory: any,
  onSave: () => void,
) {
  const insertRow = useCallback(() => {
    const newRow: SheetRow = { id: String(Date.now()) };

    columns.forEach((col) => {
      if (col.type === "checkbox") {
        newRow[col.key] = false;
      } else if (
        col.type === "number" ||
        col.type === "currency" ||
        col.type === "progress"
      ) {
        newRow[col.key] = 0;
      } else if (col.type === "date") {
        newRow[col.key] = new Date().toISOString().split("T")[0];
      } else if (col.type === "status") {
        // key-based defaults for status columns
        if (col.key === "status") newRow[col.key] = "Not Started";
        else if (col.key === "severity") newRow[col.key] = "Medium";
        else newRow[col.key] = "Not Started";
      } else if (col.type === "priority") {
        // key-based defaults for priority columns
        if (col.key === "priority") newRow[col.key] = "Medium";
        else if (col.key === "severity") newRow[col.key] = "Medium";
        else newRow[col.key] = "Medium";
      } else {
        newRow[col.key] = "";
      }
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
