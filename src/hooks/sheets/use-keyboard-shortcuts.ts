// hooks/sheets/use-keyboard-shortcuts.ts
import { useEffect } from "react";
import type { CellFormat } from "@/types/sheet.types";

interface UseKeyboardShortcutsProps {
  selectedCell: { row: number; col: string } | null;
  rowsHistory: any;
  getCurrentCellFormat: (
    selectedCell: { row: number; col: string } | null,
  ) => CellFormat;
  applyFormat: (
    selectedCell: { row: number; col: string } | null,
    format: Partial<CellFormat>,
  ) => void;
  copyCellOrRange: (selectedCell: { row: number; col: string } | null) => void;
  pasteCellOrRange: (selectedCell: { row: number; col: string } | null) => void;
  cutCellOrRange: (selectedCell: { row: number; col: string } | null) => void;
}

export function useKeyboardShortcuts({
  selectedCell,
  rowsHistory,
  getCurrentCellFormat,
  applyFormat,
  copyCellOrRange,
  pasteCellOrRange,
  cutCellOrRange,
}: UseKeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        rowsHistory.undo();
      }

      // Redo
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === "y" || (e.shiftKey && e.key === "z"))
      ) {
        e.preventDefault();
        rowsHistory.redo();
      }

      // Copy
      if ((e.ctrlKey || e.metaKey) && e.key === "c") {
        e.preventDefault();
        copyCellOrRange(selectedCell);
      }

      // Paste
      if ((e.ctrlKey || e.metaKey) && e.key === "v") {
        e.preventDefault();
        pasteCellOrRange(selectedCell);
      }

      // Cut
      if ((e.ctrlKey || e.metaKey) && e.key === "x") {
        e.preventDefault();
        cutCellOrRange(selectedCell);
      }

      // Bold
      if ((e.ctrlKey || e.metaKey) && e.key === "b" && selectedCell) {
        e.preventDefault();
        const currentFormat = getCurrentCellFormat(selectedCell);
        applyFormat(selectedCell, { bold: !currentFormat.bold });
      }

      // Italic
      if ((e.ctrlKey || e.metaKey) && e.key === "i" && selectedCell) {
        e.preventDefault();
        const currentFormat = getCurrentCellFormat(selectedCell);
        applyFormat(selectedCell, { italic: !currentFormat.italic });
      }

      // Underline
      if ((e.ctrlKey || e.metaKey) && e.key === "u" && selectedCell) {
        e.preventDefault();
        const currentFormat = getCurrentCellFormat(selectedCell);
        applyFormat(selectedCell, { underline: !currentFormat.underline });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    selectedCell,
    rowsHistory,
    getCurrentCellFormat,
    applyFormat,
    copyCellOrRange,
    pasteCellOrRange,
    cutCellOrRange,
  ]);
}
