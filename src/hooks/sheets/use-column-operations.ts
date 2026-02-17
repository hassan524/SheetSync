// hooks/sheets/use-column-operations.ts
import { useState, useCallback } from "react";
import { toast } from "sonner";
import type { SheetRow, ColumnDef } from "@/types/sheet.types";

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
        name: `Column ${columns.length + 1}`,
        width: 150,
        editable: true,
        resizable: true,
        type: type,
      };

      columnsHistory.pushState([...columns, newColumn]);

      const newRows = rows.map((row) => {
        const updatedRow = { ...row };
        if (type === "checkbox") updatedRow[newKey] = false;
        else if (type === "number" || type === "currency")
          updatedRow[newKey] = 0;
        else if (type === "priority") updatedRow[newKey] = "low";
        else if (type === "status") updatedRow[newKey] = "todo";
        else if (type === "date")
          updatedRow[newKey] = new Date().toISOString().split("T")[0];
        else updatedRow[newKey] = "";
        return updatedRow;
      });

      rowsHistory.pushState(newRows);
      onSave();
    },
    [columns, rows, columnsHistory, rowsHistory, onSave],
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
      columnsHistory.pushState(
        columns.map((col) =>
          col.key === colKey ? { ...col, type: newType } : col,
        ),
      );

      const newRows = rows.map((row) => {
        const updatedRow = { ...row };
        if (newType === "checkbox") updatedRow[colKey] = false;
        else if (newType === "priority") updatedRow[colKey] = "low";
        else if (newType === "status") updatedRow[colKey] = "todo";
        else if (newType === "date")
          updatedRow[colKey] = new Date().toISOString().split("T")[0];
        else if (newType === "number" || newType === "currency")
          updatedRow[colKey] = 0;
        else updatedRow[colKey] = String(updatedRow[colKey] || "");
        return updatedRow;
      });

      rowsHistory.pushState(newRows);
      onSave();
      toast.success(`Column changed to ${newType}`);
    },
    [columns, rows, columnsHistory, rowsHistory, onSave],
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
    deleteColumn,
    changeColumnType,
    handleColumnResize,
    handleColumnDragStart,
    handleColumnDragOver,
    handleColumnDragEnd,
  };
}
