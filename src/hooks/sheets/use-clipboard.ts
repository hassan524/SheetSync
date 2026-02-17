// hooks/sheets/use-clipboard.ts
import { useState, useCallback } from "react";
import { toast } from "sonner";
import type { SheetRow } from "@/types/sheet.types";

export function useClipboard(
  rows: SheetRow[],
  rowsHistory: any,
  onSave: () => void,
) {
  const [copiedCells, setCopiedCells] = useState<{
    data: any;
    source: { row: number; col: string };
  } | null>(null);

  const copyCellOrRange = useCallback(
    (selectedCell: { row: number; col: string } | null) => {
      if (!selectedCell) {
        toast.error("Select a cell to copy");
        return;
      }
      const row = rows[selectedCell.row];
      const value = row[selectedCell.col];
      setCopiedCells({ data: value, source: selectedCell });
      toast.success("Copied");
    },
    [rows],
  );

  const pasteCellOrRange = useCallback(
    (selectedCell: { row: number; col: string } | null) => {
      if (!selectedCell || !copiedCells) {
        toast.error("Nothing to paste");
        return;
      }
      const newRows = [...rows];
      newRows[selectedCell.row] = {
        ...newRows[selectedCell.row],
        [selectedCell.col]: copiedCells.data,
      };
      rowsHistory.pushState(newRows);
      onSave();
      toast.success("Pasted");
    },
    [copiedCells, rows, rowsHistory, onSave],
  );

  const cutCellOrRange = useCallback(
    (selectedCell: { row: number; col: string } | null) => {
      if (!selectedCell) {
        toast.error("Select a cell to cut");
        return;
      }
      const row = rows[selectedCell.row];
      const value = row[selectedCell.col];
      setCopiedCells({ data: value, source: selectedCell });

      const newRows = [...rows];
      newRows[selectedCell.row] = {
        ...newRows[selectedCell.row],
        [selectedCell.col]: "",
      };
      rowsHistory.pushState(newRows);
      onSave();
      toast.success("Cut");
    },
    [rows, rowsHistory, onSave],
  );

  return {
    copiedCells,
    copyCellOrRange,
    pasteCellOrRange,
    cutCellOrRange,
  };
}
