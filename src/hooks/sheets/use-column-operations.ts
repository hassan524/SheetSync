// hooks/sheets/use-column-operations.ts
import { useState, useCallback } from "react";
import { toast } from "sonner";
import type { SheetRow, ColumnDef } from "@/types";

function columnIndexToName(index: number): string {
  let n = index + 1;
  let name = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    name = String.fromCharCode(65 + rem) + name;
    n = Math.floor((n - 1) / 26);
  }
  return name;
}

export function useColumnOperations(
  rows: SheetRow[],
  columns: ColumnDef[],
  columnsHistory: any,
  rowsHistory: any,
  onSave: () => void,
) {
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null);

  const insertColumn = useCallback(
    (type: ColumnDef["type"] = "text") => {
      const newKey = `col_${Date.now()}`;
      const newColumn: ColumnDef = {
        key: newKey,
        name: columnIndexToName(columns.length),
        width: 150,
        editable: true,
        resizable: true,
        type: type,
      };

      columnsHistory.pushState([...columns, newColumn]);

      const newRows = rows.map((row) => {
        const updatedRow = { ...row };
        if (type === "checkbox") updatedRow[newKey] = false;
        else if (
          type === "number" ||
          type === "currency" ||
          type === "progress"
        )
          updatedRow[newKey] = 0;
        else if (type === "priority") updatedRow[newKey] = "Medium";
        else if (type === "status") updatedRow[newKey] = "Not Started";
        else if (type === "date")
          updatedRow[newKey] = new Date().toISOString().split("T")[0];
        else if (type === "select") updatedRow[newKey] = "";
        else updatedRow[newKey] = "";
        return updatedRow;
      });

      rowsHistory.pushState(newRows);
      onSave();
    },
    [columns, rows, columnsHistory, rowsHistory, onSave],
  );

  // ── NEW: rename a column header ──
  const renameColumn = useCallback(
    (colKey: string, newName: string) => {
      if (!newName.trim()) return;
      columnsHistory.pushState(
        columns.map((col) =>
          col.key === colKey ? { ...col, name: newName.trim() } : col,
        ),
      );
      onSave();
    },
    [columns, columnsHistory, onSave],
  );

  const deleteColumn = useCallback(
    (colKey: string) => {
      if (columns.length <= 1) {
        toast.error("Cannot delete the last column");
        return;
      }
      columnsHistory.pushState(columns.filter((c) => c.key !== colKey));
      onSave();
    },
    [columns, columnsHistory, onSave],
  );
  const changeColumnType = useCallback(
    (colKey: string, newType: ColumnDef["type"]) => {
      const updatedColumns = columns.map((col) =>
        col.key === colKey
          ? {
              ...col,
              type: newType,
              ...(newType === "select" ? { selectOptions: col.selectOptions ?? [] } : {}),
            }
          : col
      );

      // 1. convert all rows safely
      const updatedRows = rows.map((row) => {
        const updatedRow = { ...row };

        switch (newType) {
          case "checkbox":
            updatedRow[colKey] = false;
            break;

          case "priority":
            updatedRow[colKey] = "Medium";
            break;

          case "status":
            updatedRow[colKey] = "Not Started";
            break;

          case "date":
            updatedRow[colKey] = new Date().toISOString().split("T")[0];
            break;

          case "number":
          case "currency":
          case "progress":
            updatedRow[colKey] = 0;
            break;

          case "select":
            updatedRow[colKey] = "";
            break;

          case "image":
            updatedRow[colKey] = "";
            break;

          default:
            updatedRow[colKey] = String(updatedRow[colKey] || "");
        }

        return updatedRow;
      });

      columnsHistory.pushState(updatedColumns);
      rowsHistory.pushState(updatedRows);

      onSave();
      toast.success(`Column changed to ${newType}`);

      return { updatedColumns, updatedRows };
    },
    [columns, rows, columnsHistory, rowsHistory, onSave]
  );

  const handleColumnResize = useCallback(
    (
      colKey: string,
      width: number,
      setColumns: (cols: ColumnDef[]) => void,
    ) => {
      setColumns(
        columns.map((col) => (col.key === colKey ? { ...col, width } : col)),
      );
      onSave();
    },
    [columns, onSave],
  );

  const handleColumnDragStart = (colKey: string) => setDraggedColumn(colKey);

  const handleColumnDragOver = (
    e: React.DragEvent,
    colKey: string,
    setColumns: (cols: ColumnDef[]) => void,
  ) => {
    e.preventDefault();
    if (!draggedColumn || draggedColumn === colKey) return;

    const draggedIdx = columns.findIndex((c) => c.key === draggedColumn);
    const targetIdx = columns.findIndex((c) => c.key === colKey);

    if (draggedIdx === -1 || targetIdx === -1) return;

    const newColumns = [...columns];
    const [removed] = newColumns.splice(draggedIdx, 1);
    newColumns.splice(targetIdx, 0, removed);
    setColumns(newColumns);
  };

  const handleColumnDragEnd = () => {
    if (draggedColumn) {
      columnsHistory.pushState(columns);
      onSave();
    }
    setDraggedColumn(null);
  };

  return {
    draggedColumn,
    insertColumn,
    renameColumn,
    deleteColumn,
    changeColumnType,
    handleColumnResize,
    handleColumnDragStart,
    handleColumnDragOver,
    handleColumnDragEnd,
  };
}

