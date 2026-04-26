import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import type { SheetRow, ColumnDef } from "@/types/index";
import { Parser } from "hot-formula-parser";

export function useFormulas(rows: SheetRow[], columns: ColumnDef[]) {
  const [formulas, setFormulas] = useState<Record<string, string>>({});
  const [columnFormulas, setColumnFormulas] = useState<Record<string, string>>({});

  // We use refs to avoid re-instantiating the parser when data changes
  const rowsRef = useRef(rows);
  const columnsRef = useRef(columns);
  const formulasRef = useRef(formulas);
  const columnFormulasRef = useRef(columnFormulas);
  const evaluatingRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    rowsRef.current = rows;
    columnsRef.current = columns;
    formulasRef.current = formulas;
    columnFormulasRef.current = columnFormulas;
  }, [rows, columns, formulas, columnFormulas]);

  const parser = useMemo(() => {
    const p = new Parser();

    p.on("callCellValue", (cellCoord: any, done: any) => {
      const rIdx = cellCoord.row.index;
      const colDef = columnsRef.current[cellCoord.column.index];

      if (!colDef || rIdx < 0 || rIdx >= rowsRef.current.length) {
        done("");
        return;
      }

      const cellKey = `${rIdx}-${colDef.key}`;

      if (evaluatingRef.current.has(cellKey)) {
        done("#CYCLE!");
        return;
      }

      let val = rowsRef.current[rIdx][colDef.key];
      const f = formulasRef.current[cellKey] ?? columnFormulasRef.current[colDef.key];

      if (f && String(f).startsWith("=")) {
        evaluatingRef.current.add(cellKey);
        const expr = f.substring(1);
        const { error, result } = p.parse(expr);
        evaluatingRef.current.delete(cellKey);

        if (error) {
          val = error;
        } else {
          val = result;
        }
      }

      const num = Number(val);
      if (val !== "" && val !== null && val !== undefined && !isNaN(num)) {
        done(num);
      } else {
        done(val ?? "");
      }
    });

    p.on("callVariable", (name: string, done: any) => {
      done(`#ERROR (Unknown variable: ${name})`);
    });

    p.on("callFunction", (name: string, params: any[], done: any) => {
      const rows = rowsRef.current;
      const cols = columnsRef.current;

      // Helper to get column index by key or name
      const findCol = (key: string) =>
        cols.findIndex(
          (c) => c.key === key || c.name.toLowerCase() === key.toLowerCase()
        );

      switch (name.toUpperCase()) {

        case "SUMIF": {
          // params come in as the evaluated args from the preprocessor
          // BUT since your syntax isn't Excel-native, you need to intercept
          // before parse — see Step 4 below
          done("#SUMIF needs preprocessing");
          break;
        }

        default:
          console.warn("Unknown function:", name, params);
          done(`#ERROR (Unknown: ${name})`);
      }
    });

    p.on("callRangeValue", (startCellCoord: any, endCellCoord: any, done: any) => {
      const fragment = [];
      for (let r = startCellCoord.row.index; r <= endCellCoord.row.index; r++) {
        const rowData = [];
        for (let c = startCellCoord.column.index; c <= endCellCoord.column.index; c++) {
          const colDef = columnsRef.current[c];
          if (!colDef || r < 0 || r >= rowsRef.current.length) {
            rowData.push("");
            continue;
          }

          const cellKey = `${r}-${colDef.key}`;
          let val = rowsRef.current[r][colDef.key];
          const f = formulasRef.current[cellKey] ?? columnFormulasRef.current[colDef.key];

          if (f && String(f).startsWith("=")) {
            if (evaluatingRef.current.has(cellKey)) {
              rowData.push("#CYCLE!");
              continue;
            }
            evaluatingRef.current.add(cellKey);
            const expr = f.substring(1);
            const { error, result } = p.parse(expr);
            evaluatingRef.current.delete(cellKey);
            val = error ? error : result;
          }

          const num = Number(val);
          if (val !== "" && val !== null && val !== undefined && !isNaN(num)) {
            rowData.push(num);
          } else {
            rowData.push(val ?? "");
          }
        }
        fragment.push(rowData);
      }
      done(fragment);
    });

    return p;
  }, []);

  const getFormula = useCallback(
    (rowIdx: number, colKey: string): string | undefined => {
      const cellKey = `${rowIdx}-${colKey}`;
      if (formulas[cellKey]) return formulas[cellKey];
      if (columnFormulas[colKey]) return columnFormulas[colKey];
      return undefined;
    },
    [formulas, columnFormulas],
  );

  // Pre-process old syntax to Excel syntax: e.g. SUM(amount, 0, 10) -> SUM(A1:A11)
  const preprocessLegacyFormula = useCallback((formula: string, currentRowIdx: number) => {
    let expr = formula.substring(1).trim();

    // 1. Handle old functions like SUM(amount, 0, 10)
    const fnMatch = expr.match(/^([A-Z_]+)\((.*)\)$/i);
    if (fnMatch) {
      let fn = fnMatch[1].toUpperCase();
      if (fn === 'AVG') fn = 'AVERAGE';

      const argsStr = fnMatch[2];
      const args = argsStr.split(",").map(s => s.trim());

      if (args.length === 3) {
        const [colKey, startRowStr, endRowStr] = args;
        const startRow = parseInt(startRowStr, 10);
        const endRow = parseInt(endRowStr, 10);

        if (!isNaN(startRow) && !isNaN(endRow)) {
          const colIndex = columnsRef.current.findIndex(c => c.key === colKey || c.name.toLowerCase() === colKey.toLowerCase());
          if (colIndex !== -1) {
            const colLetter = String.fromCharCode(65 + colIndex);
            return `${fn}(${colLetter}${startRow + 1}:${colLetter}${endRow + 1})`;
          } else {
            return `UNKNOWN_COL("${colKey}")`;
          }
        }
      }

      // Support single column arg e.g. COLVAL(amount) -> B5 (current row)
      if (args.length === 1) {
        const colKey = args[0];
        const colIndex = columnsRef.current.findIndex(c => c.key === colKey || c.name.toLowerCase() === colKey.toLowerCase());
        if (colIndex !== -1) {
          const colLetter = String.fromCharCode(65 + colIndex);
          if (fn === 'COLVAL') {
            return `${colLetter}${currentRowIdx + 1}`;
          } else {
            return `${fn}(${colLetter}1:${colLetter}${rowsRef.current.length})`;
          }
        } else {
          return `UNKNOWN_COL("${colKey}")`;
        }
      }
    }

    // 2. Replace standalone column names with the cell reference for the current row
    // E.g. `=amount * 10` -> `=B5 * 10`
    const varRegex = /([a-zA-Z_]\w*)(?!\s*\()/g;
    expr = expr.replace(varRegex, (match) => {
      // Don't replace standard Excel coordinates like A1, B22, etc.
      if (/^[A-Z]+\d+$/i.test(match)) return match;

      const colIndex = columnsRef.current.findIndex(c => c.key === match || c.name.toLowerCase() === match.toLowerCase());
      if (colIndex !== -1) {
        const colLetter = String.fromCharCode(65 + colIndex);
        return `${colLetter}${currentRowIdx + 1}`;
      }
      return match;
    });

    return expr;
  }, []);

  const evaluateFormula = useCallback(
    (formula: string, currentRowIdx: number): any => {
      if (!formula || !String(formula).startsWith("=")) return formula;

      const expr = preprocessLegacyFormula(formula, currentRowIdx);
      const { error, result } = parser.parse(expr);
      return error ? error : result;
    },
    [parser, preprocessLegacyFormula],
  );

  return {
    formulas,
    setFormulas,
    columnFormulas,
    setColumnFormulas,
    evaluateFormula,
    getFormula,
  };
}
