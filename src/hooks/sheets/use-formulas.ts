// hooks/sheets/use-formulas.ts
import { useState, useCallback } from "react";
import type { SheetRow, ColumnDef } from "@/types/sheet.types";

export function useFormulas(rows: SheetRow[], columns: ColumnDef[]) {
  const [formulas, setFormulas] = useState<Record<string, string>>({});

  const evaluateFormula = useCallback(
    (formula: string, currentRowIdx: number): any => {
      try {
        if (!formula.startsWith("=")) return formula;

        let expression = formula.substring(1);
        const cellRefRegex = /([A-Z]+)(\d+)/g;

        expression = expression.replace(
          cellRefRegex,
          (match, colName, rowNum) => {
            const targetRowIdx = parseInt(rowNum) - 1;
            const targetCol = columns.find(
              (c) => c.name.toUpperCase() === colName.toUpperCase(),
            );
            if (!targetCol) return "0";
            const targetRow = rows[targetRowIdx];
            if (!targetRow) return "0";
            return String(targetRow[targetCol.key] || 0);
          },
        );

        if (expression.includes("SUM")) {
          const sumMatch = expression.match(
            /SUM\(([A-Z]+)(\d+):([A-Z]+)(\d+)\)/,
          );
          if (sumMatch) {
            const [, startCol, startRow, endCol, endRow] = sumMatch;
            const col = columns.find(
              (c) => c.name.toUpperCase() === startCol.toUpperCase(),
            );
            if (!col) return "#ERROR";

            let sum = 0;
            for (let i = parseInt(startRow) - 1; i < parseInt(endRow); i++) {
              const row = rows[i];
              if (row) sum += Number(row[col.key]) || 0;
            }
            return sum;
          }
        }

        if (expression.includes("AVERAGE")) {
          const avgMatch = expression.match(
            /AVERAGE\(([A-Z]+)(\d+):([A-Z]+)(\d+)\)/,
          );
          if (avgMatch) {
            const [, startCol, startRow, endCol, endRow] = avgMatch;
            const col = columns.find(
              (c) => c.name.toUpperCase() === startCol.toUpperCase(),
            );
            if (!col) return "#ERROR";

            let sum = 0;
            let count = 0;
            for (let i = parseInt(startRow) - 1; i < parseInt(endRow); i++) {
              const row = rows[i];
              if (row && row[col.key] !== undefined) {
                sum += Number(row[col.key]) || 0;
                count++;
              }
            }
            return count > 0 ? sum / count : 0;
          }
        }

        return eval(expression);
      } catch (e) {
        return "#ERROR";
      }
    },
    [rows, columns],
  );

  return {
    formulas,
    setFormulas,
    evaluateFormula,
  };
}
