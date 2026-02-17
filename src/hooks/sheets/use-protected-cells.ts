// hooks/sheets/use-protected-cells.ts
import { useState, useCallback } from "react";
import { toast } from "sonner";

export function useProtectedCells(onSave: () => void) {
  const [protectedCells, setProtectedCells] = useState<Set<string>>(new Set());

  const getCellKey = (rowIdx: number, colKey: string) => `${rowIdx}-${colKey}`;

  const toggleProtectCell = useCallback(
    (selectedCell: { row: number; col: string } | null) => {
      if (!selectedCell) {
        toast.error("Select a cell");
        return;
      }
      const cellKey = getCellKey(selectedCell.row, selectedCell.col);
      setProtectedCells((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(cellKey)) {
          newSet.delete(cellKey);
          toast.success("Cell unprotected");
        } else {
          newSet.add(cellKey);
          toast.success("Cell protected");
        }
        return newSet;
      });
      onSave();
    },
    [onSave],
  );

  const isCellProtected = useCallback(
    (rowIdx: number, colKey: string): boolean => {
      return protectedCells.has(getCellKey(rowIdx, colKey));
    },
    [protectedCells],
  );

  return {
    protectedCells,
    setProtectedCells,
    toggleProtectCell,
    isCellProtected,
    getCellKey,
  };
}
