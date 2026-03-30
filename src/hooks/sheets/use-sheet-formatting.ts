// hooks/sheets/use-sheet-formatting.ts
import { useState, useCallback } from "react";
import { toast } from "sonner";
import type { CellFormat } from "@/types/index";

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
        fontFamily: format.fontFamily || undefined,
        fontWeight: format.bold ? 700 : 400,
        fontStyle: format.italic ? "italic" : "normal",
        textDecoration:
          [
            format.underline && "underline",
            format.strikethrough && "line-through",
          ]
            .filter(Boolean)
            .join(" ") || "none",
        fontSize: format.fontSize ? `${format.fontSize}px` : undefined,
        color: format.textColor || undefined,
        backgroundColor: format.bgColor || undefined,
        textAlign: (format.align as any) || undefined,
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
