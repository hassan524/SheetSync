/**
 * ============================================================
 *  use-formulas.ts  —  FULLY FIXED v3
 * ============================================================
 *
 * WHAT THIS FILE DOES (plain English):
 * ─────────────────────────────────────
 * When a user types a formula into a cell (anything starting with "="),
 * this hook:
 *   1. STORES the raw formula string (e.g. "=SUM(income, 0, 9)")
 *   2. PREPROCESSES it — converts your custom column-name syntax
 *      into standard Excel A1 notation the parser understands
 *   3. EVALUATES it — runs the expression through hot-formula-parser
 *   4. RETURNS the computed value to display in the cell
 *
 * ──────────────────────────────────────────────────────────────
 * ROOT CAUSES FOUND IN YOUR CONSOLE LOGS (ALL NOW FIXED):
 * ──────────────────────────────────────────────────────────────
 *
 * BUG 1 — STALE FORMULAS FROM DATABASE
 *   Your cells have =SUM(amount, 0, 10) and =AVG(price, 0, 20) saved
 *   from a DIFFERENT sheet (one that had "amount"/"price" columns).
 *   This sheet only has: date, category, desc, income, expense, balance, status.
 *   "amount" and "price" genuinely don't exist here — the lookup correctly
 *   returns index=-1. The formula engine is RIGHT. The data is wrong.
 *   FIX: Show a clear "#STALE!" error that tells the user EXACTLY which
 *        columns are available, so they can fix their formula.
 *
 * BUG 2 — STRING LITERALS MATCHED AS COLUMN NAMES
 *   =REPLACE(name, "Inc", "LLC") — the Step B regex was matching "Inc"
 *   and "LLC" (words inside quotes) as potential column names.
 *   Also "REPLAC" was being matched as a partial word due to regex boundary.
 *   FIX: Strip all quoted strings to placeholders BEFORE running the
 *        identifier regex, then restore them after. This is withStringsProtected().
 *
 * BUG 3 — WRONG FUNCTION SIGNATURES
 *   Excel's REPLACE(old_text, start_num, num_chars, new_text) takes NUMERIC
 *   position args — it's not a text-search function. What you want is
 *   SUBSTITUTE(text, old_text, new_text).
 *   Excel's SUMIF(range, criteria, sum_range) has a different signature
 *   than your custom 5-arg syntax.
 *   FIX: Added custom SUMIF conversion (5-arg → proper Excel SUMIF).
 *        SUBSTITUTE passes through natively to the parser.
 *
 * BUG 4 — FUNCTION NAME PARTIAL MATCHING
 *   The varRegex /\b([a-zA-Z_]\w*)(?!\s*\()/ was matching INSIDE function
 *   names: "SUMIF" → matched "SUMI" as an identifier. Word boundary \b
 *   was not working correctly with the negative lookahead.
 *   FIX: Use splitTopLevelArgs() to parse args properly, and apply the
 *        regex only to the INTERIOR of the expression using withStringsProtected().
 *
 * ──────────────────────────────────────────────────────────────
 * SUPPORTED FORMULA SYNTAXES:
 * ──────────────────────────────────────────────────────────────
 *
 * Standard Excel (passed through unchanged — parser handles natively):
 *   =SUM(A1:A10)            =IF(B2>100,"high","low")
 *   =AVERAGE(C1:C20)        =A1 * B1 + C1
 *   =SUBSTITUTE(D1,"x","y") =ROUND(E1, 2)
 *   =MAX(A1:A50)            =COUNT(B1:B50)
 *
 * Your column-name shortcuts (converted to Excel A1 refs):
 *   =income                        → D{currentRow}
 *   =income * 1.1                  → D2 * 1.1
 *   =income - expense              → D2 - E2
 *   =SUM(income, 0, 9)             → SUM(D1:D10)     [rows 0–9, 10 rows]
 *   =AVERAGE(balance, 0, 19)       → AVERAGE(F1:F20) [rows 0–19, 20 rows]
 *   =SUM(income)                   → SUM(D1:D50)     [entire column]
 *   =COLVAL(expense)               → E2              [this row only]
 *   =SUMIF(income,status,"paid",0,19) → SUMIF(G1:G20,"paid",D1:D20)
 *
 * ============================================================
 */

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import type { SheetRow, ColumnDef } from "@/types/index";
import { Parser } from "hot-formula-parser";

// ─────────────────────────────────────────────────────────────
//  DEBUG FLAG — set false before shipping to production
// ─────────────────────────────────────────────────────────────
const FORMULA_DEBUG = true;

function fLog(...args: any[])   { if (FORMULA_DEBUG) console.log("[Formula]",    ...args); }
function fWarn(...args: any[])  { if (FORMULA_DEBUG) console.warn("[Formula ⚠]", ...args); }
function fError(...args: any[]) { console.error("[Formula ❌]", ...args); }

// ─────────────────────────────────────────────────────────────
//  columnIndexToLetter
//  Convert 0-based column index to Excel letter notation.
//  0→A, 1→B, 25→Z, 26→AA, 27→AB ...
//  String.fromCharCode(65 + i) BREAKS at i=26 (gives "["), don't use it.
// ─────────────────────────────────────────────────────────────
function columnIndexToLetter(index: number): string {
  let letter = "";
  let n = index + 1;
  while (n > 0) {
    const rem = (n - 1) % 26;
    letter = String.fromCharCode(65 + rem) + letter;
    n = Math.floor((n - 1) / 26);
  }
  return letter;
}

// ─────────────────────────────────────────────────────────────
//  withStringsProtected
//
//  WHY THIS EXISTS:
//  Step B replaces column-name identifiers in an expression.
//  But it must NOT match words inside quoted string literals.
//  Example: =SUBSTITUTE(desc, "old value", "new value")
//  Without protection: "old", "value", "new" get treated as column names.
//  With protection: we swap strings to __STR_0__, run the regex, then swap back.
//
//  HOW IT WORKS:
//    Input:  SUBSTITUTE(desc, "old value", "new value")
//    Swap:   SUBSTITUTE(desc, __STR_0__, __STR_1__)
//    Regex:  SUBSTITUTE(D2, __STR_0__, __STR_1__)   [desc→D2, STR tokens skipped]
//    Restore: SUBSTITUTE(D2, "old value", "new value")
// ─────────────────────────────────────────────────────────────
function withStringsProtected(expr: string, transform: (s: string) => string): string {
  const literals: string[] = [];

  // Pull out all "..." and '...' and replace with __STR_N__ tokens
  const stripped = expr.replace(/"([^"\\]|\\.)*"|'([^'\\]|\\.)*'/g, (match) => {
    const idx = literals.length;
    literals.push(match);
    return `__STR_${idx}__`;
  });

  const transformed = transform(stripped);

  // Put the string literals back
  return transformed.replace(/__STR_(\d+)__/g, (_, i) => literals[parseInt(i, 10)]);
}

// ─────────────────────────────────────────────────────────────
//  splitTopLevelArgs
//
//  Split a function's argument string on commas, but ONLY at the
//  top level — not inside nested parentheses or quoted strings.
//
//  Why simple split(",") fails:
//    "income, status, "paid, pending", 0, 20"
//    split → ["income", " status", " "paid", " pending"", " 0", " 20"]  ❌
//    This fn → ["income", "status", '"paid, pending"', "0", "20"]       ✅
//
//  Also handles nested function calls:
//    "IF(a>0, 1, 0), other_arg"
//    split → ["IF(a>0", " 1", " 0)", " other_arg"]  ❌
//    This fn → ['IF(a>0, 1, 0)', 'other_arg']        ✅
// ─────────────────────────────────────────────────────────────
function splitTopLevelArgs(argsStr: string): string[] {
  const args: string[] = [];
  let depth   = 0;      // Nesting depth (increments on "(", decrements on ")")
  let inStr   = false;  // Are we inside a quoted string?
  let strChar = "";     // Which quote opened the string (" or ')
  let current = "";

  for (let i = 0; i < argsStr.length; i++) {
    const ch = argsStr[i];

    if (inStr) {
      current += ch;
      if (ch === strChar && argsStr[i - 1] !== "\\") inStr = false;
    } else if (ch === '"' || ch === "'") {
      inStr = true; strChar = ch; current += ch;
    } else if (ch === "(") {
      depth++; current += ch;
    } else if (ch === ")") {
      depth--; current += ch;
    } else if (ch === "," && depth === 0) {
      // Top-level comma = argument separator
      args.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }

  if (current.trim()) args.push(current.trim());
  return args;
}

// ─────────────────────────────────────────────────────────────
//  MAIN HOOK
// ─────────────────────────────────────────────────────────────
export function useFormulas(rows: SheetRow[], columns: ColumnDef[]) {
  /**
   * formulas:       { "rowIdx-colKey": "=SUM(income, 0, 9)" }
   *                 Cell-level formulas. Stored when user types into a cell.
   *
   * columnFormulas: { "income": "=income * 1.1" }
   *                 Applied to every cell in a column. Cell-level overrides this.
   */
  const [formulas,       setFormulas]       = useState<Record<string, string>>({});
  const [columnFormulas, setColumnFormulas] = useState<Record<string, string>>({});

  /**
   * WHY REFS:
   * The parser events (callCellValue, callRangeValue) fire synchronously
   * inside parser.parse(). The parser is created ONCE in useMemo([]).
   * If we read `rows`/`columns` from the closure at creation time, they'd
   * be the stale values from mount. Refs always point to the current value.
   */
  const rowsRef           = useRef(rows);
  const columnsRef        = useRef(columns);
  const formulasRef       = useRef(formulas);
  const columnFormulasRef = useRef(columnFormulas);

  /**
   * Cycle detection set.
   * Before evaluating cell X, we add it here.
   * If callCellValue asks for X again while X is already being evaluated
   * → that's a circular reference → we return #CYCLE! and break the loop.
   */
  const evaluatingRef = useRef<Set<string>>(new Set());

  // Sync refs every render
  useEffect(() => {
    rowsRef.current           = rows;
    columnsRef.current        = columns;
    formulasRef.current       = formulas;
    columnFormulasRef.current = columnFormulas;

    fLog("Refs synced →", {
      rows:    rows.length,
      columns: columns.map(c => `${c.key}(${c.name})`).join(", "),
    });
  }, [rows, columns, formulas, columnFormulas]);

  // ─────────────────────────────────────────────────────────────
  //  findColumnIndex — single source of truth for column lookup
  //  Matches by key OR display name, case-insensitive.
  //  Returns index or -1.
  // ─────────────────────────────────────────────────────────────
  const findColumnIndex = useCallback((nameOrKey: string): number => {
    const lower = nameOrKey.toLowerCase().trim();
    return columnsRef.current.findIndex(
      c => c.key.toLowerCase() === lower || c.name.toLowerCase() === lower
    );
  }, []);

  // ─────────────────────────────────────────────────────────────
  //  PARSER — created ONCE on mount.
  //
  //  hot-formula-parser handles ALL standard Excel functions natively.
  //  We only wire up the DATA events (callCellValue, callRangeValue)
  //  that give it access to our grid's values.
  //
  //  IMPORTANT: We do NOT add a callFunction handler.
  //  Having one with a "default" case was the original bug — it intercepted
  //  native Excel functions (REPLACE, SUBSTITUTE, etc.) and returned errors.
  // ─────────────────────────────────────────────────────────────
  const parser = useMemo(() => {
    fLog("Creating parser instance (once on mount)");
    const p = new Parser();

    // ── EVENT: callCellValue ────────────────────────────────
    // Fires when parser needs a single cell value, e.g. evaluating "A1"
    // We look up the value from our rows array.
    p.on("callCellValue", (cellCoord: any, done: any) => {
      const rIdx   = cellCoord.row.index;
      const cIdx   = cellCoord.column.index;
      const colDef = columnsRef.current[cIdx];

      if (!colDef) {
        fError(`callCellValue: no column at index ${cIdx}`);
        done(""); return;
      }
      if (rIdx < 0 || rIdx >= rowsRef.current.length) {
        fError(`callCellValue: row ${rIdx} out of range`);
        done(""); return;
      }

      const cellKey = `${rIdx}-${colDef.key}`;

      // Cycle detection
      if (evaluatingRef.current.has(cellKey)) {
        fError(`CIRCULAR REFERENCE at ${cellKey}`);
        done("#CYCLE!"); return;
      }

      let val = rowsRef.current[rIdx][colDef.key];

      // If this cell itself has a formula, evaluate it recursively
      const cellFormula   = formulasRef.current[cellKey];
      const colFormula    = columnFormulasRef.current[colDef.key];
      const activeFormula = cellFormula ?? colFormula;

      if (activeFormula?.startsWith("=")) {
        evaluatingRef.current.add(cellKey);
        const { error, result } = p.parse(activeFormula.substring(1));
        evaluatingRef.current.delete(cellKey);
        val = error ? error : result;
      }

      const num    = Number(val);
      const isNum  = val !== "" && val !== null && val !== undefined && !isNaN(num);
      done(isNum ? num : (val ?? ""));
    });

    // ── EVENT: callRangeValue ────────────────────────────────
    // Fires when parser needs a range of cells, e.g. "A1:C5"
    // Returns a 2D array [[row0col0, row0col1], [row1col0, row1col1], ...]
    p.on("callRangeValue", (startCoord: any, endCoord: any, done: any) => {
      const r1 = startCoord.row.index;
      const r2 = endCoord.row.index;
      const c1 = startCoord.column.index;
      const c2 = endCoord.column.index;

      const fragment: any[][] = [];

      for (let r = r1; r <= r2; r++) {
        const rowData: any[] = [];
        for (let c = c1; c <= c2; c++) {
          const colDef = columnsRef.current[c];
          if (!colDef || r < 0 || r >= rowsRef.current.length) {
            rowData.push(""); continue;
          }

          const cellKey = `${r}-${colDef.key}`;

          if (evaluatingRef.current.has(cellKey)) {
            rowData.push("#CYCLE!"); continue;
          }

          let val = rowsRef.current[r][colDef.key];
          const cellFormula   = formulasRef.current[cellKey];
          const colFormula    = columnFormulasRef.current[colDef.key];
          const activeFormula = cellFormula ?? colFormula;

          if (activeFormula?.startsWith("=")) {
            evaluatingRef.current.add(cellKey);
            const { error, result } = p.parse(activeFormula.substring(1));
            evaluatingRef.current.delete(cellKey);
            val = error ? error : result;
          }

          const num   = Number(val);
          const isNum = val !== "" && val !== null && val !== undefined && !isNaN(num);
          rowData.push(isNum ? num : (val ?? ""));
        }
        fragment.push(rowData);
      }

      done(fragment);
    });

    // callVariable fires if an identifier survived preprocessing without being
    // converted to an A1 ref or a string literal.
    p.on("callVariable", (name: string, done: any) => {
      // Don't treat this as an error visible in cells — just return Excel's
      // standard #NAME? error which means "unrecognised name"
      fWarn(`callVariable: "${name}" was not converted to a cell ref by preprocessing.`);
      done("#NAME?");
    });

    fLog("Parser ready ✅");
    return p;
  }, []);

  // ─────────────────────────────────────────────────────────────
  //  preprocessLegacyFormula
  //
  //  THE MOST IMPORTANT FUNCTION IN THIS FILE.
  //  Converts your custom column-name syntax → standard Excel A1 notation.
  //
  //  Call sequence when user types =SUM(income, 0, 9) in row 1:
  //    formula = "=SUM(income, 0, 9)", currentRowIdx = 1
  //    → strip "=" → expr = "SUM(income, 0, 9)"
  //    → detect fn="SUM", args=["income","0","9"]
  //    → 3-arg pattern: col="income", startRow=0, endRow=9
  //    → findColumnIndex("income") → 3
  //    → columnIndexToLetter(3) → "D"
  //    → return "SUM(D1:D10)"
  //    → parser.parse("SUM(D1:D10)") → 450  ✅
  // ─────────────────────────────────────────────────────────────
  const preprocessLegacyFormula = useCallback(
    (formula: string, currentRowIdx: number): string => {
      const expr = formula.substring(1).trim(); // Strip leading "="

      fLog(`preprocess("${formula}", row=${currentRowIdx})`);

      // ── STEP 1: Detect top-level function call ──────────────
      // Matches: FUNCNAME(anything)
      // Uses case-insensitive flag since user might type =sum(...) or =Sum(...)
      const fnMatch = expr.match(/^([A-Z_][A-Z0-9_]*)\s*\((.*)\)$/is);

      if (fnMatch) {
        let fn        = fnMatch[1].toUpperCase();
        const argsStr = fnMatch[2];

        // Map non-Excel aliases to their Excel names
        if (fn === "AVG")   fn = "AVERAGE";
        if (fn === "STDEV") fn = "STDEV";  // already correct in Excel

        // Split args respecting nested parens and quoted strings
        const args = splitTopLevelArgs(argsStr);

        fLog(`  fn="${fn}" args=[${args.map(a => `"${a}"`).join(", ")}]`);

        // ── Pattern A: 3-arg legacy (col, startRow, endRow) ──
        // =SUM(income, 0, 9)     → SUM(D1:D10)
        // =AVERAGE(balance, 0, 4) → AVERAGE(F1:F5)
        if (args.length === 3) {
          const [colArg, startStr, endStr] = args;
          const startRow = parseInt(startStr.trim(), 10);
          const endRow   = parseInt(endStr.trim(), 10);

          // Only treat as legacy pattern if args 2+3 are integers
          if (!isNaN(startRow) && !isNaN(endRow)) {
            const colIdx = findColumnIndex(colArg.trim());
            if (colIdx !== -1) {
              const letter = columnIndexToLetter(colIdx);
              const result = `${fn}(${letter}${startRow + 1}:${letter}${endRow + 1})`;
              fLog(`  → 3-arg legacy: "${result}"`);
              return result;
            } else {
              // Column doesn't exist in THIS sheet — stale formula from another sheet
              const available = columnsRef.current.map(c => c.key).join(", ");
              fError(
                `Stale formula: column "${colArg.trim()}" not in this sheet.`,
                `\nThis formula was probably saved from a different sheet.`,
                `\nColumns in this sheet: ${available}`,
                `\nFix: change your formula to use one of: ${available}`
              );
              return `"#STALE! '${colArg.trim()}' not found. Available: ${available}"`;
            }
          }
        }

        // ── Pattern B: 1-arg (col only) ──
        // =SUM(income)    → SUM(D1:D50)  [entire column]
        // =COLVAL(expense) → E2           [current row]
        if (args.length === 1) {
          const colArg = args[0].trim();

          // Already an A1 ref? Pass through.
          if (/^[A-Z]+\d+$/i.test(colArg)) {
            return `${fn}(${colArg})`;
          }

          const colIdx = findColumnIndex(colArg);
          if (colIdx !== -1) {
            const letter = columnIndexToLetter(colIdx);
            if (fn === "COLVAL") {
              const result = `${letter}${currentRowIdx + 1}`;
              fLog(`  → COLVAL: "${result}"`);
              return result;
            }
            const totalRows = rowsRef.current.length;
            const result    = `${fn}(${letter}1:${letter}${totalRows})`;
            fLog(`  → 1-arg entire col: "${result}"`);
            return result;
          } else {
            const available = columnsRef.current.map(c => c.key).join(", ");
            fError(`Stale formula: column "${colArg}" not in this sheet. Available: ${available}`);
            return `"#STALE! '${colArg}' not found. Available: ${available}"`;
          }
        }

        // ── Pattern C: Custom 5-arg SUMIF ──
        // =SUMIF(valueCol, conditionCol, "criteria", startRow, endRow)
        // Example: =SUMIF(income, status, "paid", 0, 19)
        // Converts to Excel: =SUMIF(G1:G20,"paid",D1:D20)
        //   (Excel SUMIF: range=condition column, criteria=value, sum_range=value column)
        if (fn === "SUMIF" && args.length === 5) {
          const [valColArg, condColArg, criteriaArg, startStr, endStr] = args;
          const startRow = parseInt(startStr.trim(), 10);
          const endRow   = parseInt(endStr.trim(), 10);

          if (!isNaN(startRow) && !isNaN(endRow)) {
            const valIdx  = findColumnIndex(valColArg.trim());
            const condIdx = findColumnIndex(condColArg.trim());

            if (valIdx !== -1 && condIdx !== -1) {
              const valLetter  = columnIndexToLetter(valIdx);
              const condLetter = columnIndexToLetter(condIdx);
              const r1 = startRow + 1;
              const r2 = endRow + 1;
              // Excel SUMIF(range, criteria, sum_range)
              const result = `SUMIF(${condLetter}${r1}:${condLetter}${r2},${criteriaArg.trim()},${valLetter}${r1}:${valLetter}${r2})`;
              fLog(`  → custom SUMIF: "${result}"`);
              return result;
            }
          }
        }

        // ── Pattern D: Multi-arg native Excel function ──
        // IF, SUBSTITUTE, ROUND, CONCAT, etc.
        // May contain column names as some of the args.
        // Fall through to Step 2 to replace column names inside the args.
        fLog(`  Multi-arg "${fn}" — falling to Step 2 for column name replacement`);
      }

      // ── STEP 2: Replace standalone column names with A1 refs ──
      //
      // Handles expressions like:
      //   income * 1.1          → D2 * 1.1
      //   income - expense      → D2 - E2
      //   IF(income > 0, income, 0)  → IF(D2 > 0, D2, 0)
      //
      // Rules:
      //   - String literals are protected (not scanned for column names)
      //   - Already-valid A1 refs are skipped (A1, B22, etc.)
      //   - Function names are skipped (SUM, IF, etc. — followed by "(")
      //   - Reserved words are skipped (TRUE, FALSE, AND, OR, NOT)
      const result = withStringsProtected(expr, (safeExpr) => {
        // Match identifiers NOT followed by "(" (those would be function names)
        const varRegex = /\b([A-Za-z_][A-Za-z0-9_]*)(?!\s*\()\b/g;

        return safeExpr.replace(varRegex, (match) => {
          // Skip A1-style cell refs
          if (/^[A-Z]+\d+$/i.test(match)) return match;

          // Skip string placeholder tokens
          if (/^__STR_\d+__$/.test(match)) return match;

          // Skip Excel/JS reserved words
          const reserved = new Set([
            "TRUE", "FALSE", "AND", "OR", "NOT",
            "true", "false", "null", "undefined",
          ]);
          if (reserved.has(match)) return match;

          const colIdx = findColumnIndex(match);
          if (colIdx !== -1) {
            const ref = `${columnIndexToLetter(colIdx)}${currentRowIdx + 1}`;
            fLog(`  Step 2: "${match}" → "${ref}"`);
            return ref;
          }

          // Not a column name — leave it (number, operator token, unknown identifier)
          return match;
        });
      });

      fLog(`  Step 2 result: "${result}"`);
      return result;
    },
    [findColumnIndex]
  );

  // ─────────────────────────────────────────────────────────────
  //  evaluateFormula — PUBLIC entry point
  //
  //  Called by the grid for every cell that has a formula.
  //  Returns the computed value (number, string, boolean) or an error string.
  //
  //  Full call flow:
  //    User types =SUM(income, 0, 9) in row 1, col "balance"
  //    → setFormulas({ "1-balance": "=SUM(income, 0, 9)" })
  //    → grid calls evaluateFormula("=SUM(income, 0, 9)", 1)
  //    → preprocessLegacyFormula → "SUM(D1:D10)"
  //    → parser.parse("SUM(D1:D10)")
  //    → callRangeValue fires for D1:D10
  //    → we return [450, 200, 100, ...] from rows
  //    → parser computes SUM → 750
  //    → cell displays 750  ✅
  // ─────────────────────────────────────────────────────────────
  const evaluateFormula = useCallback(
    (formula: string, currentRowIdx: number): any => {
      if (!formula || !String(formula).startsWith("=")) return formula;

      fLog(`evaluateFormula("${formula}", row=${currentRowIdx})`);

      const expr           = preprocessLegacyFormula(formula, currentRowIdx);
      const { error, result } = parser.parse(expr);

      if (error) {
        fError(`Parser error: formula="${formula}" → expr="${expr}" → ${error}`);
        return error;
      }

      fLog(`  Result: ${result}`);
      return result;
    },
    [parser, preprocessLegacyFormula]
  );

  // ─────────────────────────────────────────────────────────────
  //  getFormula — returns the raw formula string for a cell (if any)
  //  Cell-level wins over column-level.
  // ─────────────────────────────────────────────────────────────
  const getFormula = useCallback(
    (rowIdx: number, colKey: string): string | undefined => {
      const cellKey = `${rowIdx}-${colKey}`;
      return formulas[cellKey] ?? columnFormulas[colKey];
    },
    [formulas, columnFormulas]
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