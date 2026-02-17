// hooks/sheets/use-sheet-formatting.ts
import { useState, useCallback } from "react";
import { toast } from "sonner";
import type { CellFormat } from "@/types/sheet.types";

export function useSheetFormatting(onSave: () => void) {
  const [cellFormats, setCellFormats] = useState<Record<string, CellFormat>>(
    {},
  );

  const getCellKey = (rowIdx: number, colKey: string) => `${rowIdx}-${colKey}`;

  const getCurrentCellFormat = useCallback(
    (selectedCell: { row: number; col: string } | null): CellFormat => {
      if (!selectedCell) return {};
      return cellFormats[getCellKey(selectedCell.row, selectedCell.col)] || {};
    },
    [cellFormats],
  );

  const applyFormat = useCallback(
    (
      selectedCell: { row: number; col: string } | null,
      formatUpdate: Partial<CellFormat>,
    ) => {
      if (!selectedCell) {
        toast.error("Please select a cell first");
        return;
      }

      const cellKey = getCellKey(selectedCell.row, selectedCell.col);
      setCellFormats((prev) => ({
        ...prev,
        [cellKey]: { ...prev[cellKey], ...formatUpdate },
      }));
      onSave();
    },
    [onSave],
  );

  const getCellStyle = useCallback(
    (
      rowIdx: number,
      colKey: string,
      textWrapColumns: Set<string>,
    ): React.CSSProperties => {
      const format = cellFormats[getCellKey(rowIdx, colKey)] || {};
      const isWrapEnabled = textWrapColumns.has(colKey);

      return {
        fontWeight: format.bold ? 700 : 400,
        fontStyle: format.italic ? "italic" : "normal",
        textDecoration:
          [
            format.underline && "underline",
            format.strikethrough && "line-through",
          ]
            .filter(Boolean)
            .join(" ") || "none",
        fontSize: format.fontSize ? `${format.fontSize}px` : "12px",
        color: format.textColor || "#000000",
        backgroundColor: format.bgColor || "#ffffff",
        textAlign: (format.align as any) || "left",
        whiteSpace: isWrapEnabled ? "pre-wrap" : "nowrap",
        wordBreak: isWrapEnabled ? "break-word" : "normal",
        overflow: isWrapEnabled ? "visible" : "hidden",
        textOverflow: isWrapEnabled ? "clip" : "ellipsis",
      };
    },
    [cellFormats],
  );

  return {
    cellFormats,
    setCellFormats,
    getCurrentCellFormat,
    applyFormat,
    getCellStyle,
  };
}
