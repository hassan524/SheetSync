// hooks/sheets/use-text-wrap.ts
import { useState, useCallback } from "react";
import { toast } from "sonner";
import type { SheetRow } from "@/types/sheet.types";

export function useTextWrap(rows: SheetRow[], onSave: () => void) {
  const [textWrapColumns, setTextWrapColumns] = useState<Set<string>>(
    new Set(),
  );

  const toggleTextWrap = useCallback(
    (colKey: string) => {
      setTextWrapColumns((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(colKey)) {
          newSet.delete(colKey);
          toast.success("Text wrap disabled");
        } else {
          newSet.add(colKey);
          toast.success("Text wrap enabled");
        }
        return newSet;
      });
      onSave();
    },
    [onSave],
  );

  const toggleTextWrapForSelectedColumn = useCallback(
    (selectedCell: { row: number; col: string } | null) => {
      if (!selectedCell) {
        toast.error("Please select a cell in the column you want to wrap");
        return;
      }
      toggleTextWrap(selectedCell.col);
    },
    [toggleTextWrap],
  );

  const calculateRowHeight = useCallback(
    (rowIdx: number): number => {
      const row = rows[rowIdx];
      if (!row) return 36;

      let maxHeight = 36;
      const lineHeight = 20;

      textWrapColumns.forEach((colKey) => {
        const value = row[colKey];
        if (value && typeof value === "string") {
          const lines = value.split("\n").length;
          const estimatedHeight = lines * lineHeight + 16;
          maxHeight = Math.max(maxHeight, estimatedHeight);
        }
      });

      return maxHeight;
    },
    [rows, textWrapColumns],
  );

  return {
    textWrapColumns,
    setTextWrapColumns,
    toggleTextWrap,
    toggleTextWrapForSelectedColumn,
    calculateRowHeight,
  };
}
