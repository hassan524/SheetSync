// hooks/sheets/use-cell-types.ts
import { useState, useCallback } from "react";
import { toast } from "sonner";
import type { SheetRow, ColumnDef } from "@/types/sheet.types";

export function useCellTypes(
  rows: SheetRow[],
  rowsHistory: any,
  onSave: () => void,
) {
  const [cellTypeOverrides, setCellTypeOverrides] = useState<
    Record<string, ColumnDef["type"]>
  >({});

  const getCellKey = (rowIdx: number, colKey: string) => `${rowIdx}-${colKey}`;

  const getCellType = useCallback(
    (
      rowIdx: number,
      colKey: string,
      defaultType: ColumnDef["type"],
    ): ColumnDef["type"] => {
      const cellKey = getCellKey(rowIdx, colKey);
      return cellTypeOverrides[cellKey] || defaultType;
    },
    [cellTypeOverrides],
  );

  const changeCellType = useCallback(
    (rowIdx: number, colKey: string, newType: ColumnDef["type"]) => {
      const cellKey = getCellKey(rowIdx, colKey);
      setCellTypeOverrides((prev) => ({ ...prev, [cellKey]: newType }));

      const newRows = [...rows];
      const row = newRows[rowIdx];
      if (newType === "checkbox") row[colKey] = false;
      else if (newType === "priority") row[colKey] = "low";
      else if (newType === "status") row[colKey] = "todo";
      else if (newType === "date")
        row[colKey] = new Date().toISOString().split("T")[0];
      else if (newType === "number" || newType === "currency") row[colKey] = 0;
      else row[colKey] = String(row[colKey] || "");

      rowsHistory.pushState(newRows);
      onSave();
      toast.success(`Cell changed to ${newType}`);
    },
    [rows, rowsHistory, onSave],
  );

  return {
    cellTypeOverrides,
    setCellTypeOverrides,
    getCellType,
    changeCellType,
  };
}
