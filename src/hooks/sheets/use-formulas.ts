/**
 * ============================================================
 *  use-formulas.ts  —  v7 FINAL
 * ============================================================
 *
 * HOW EVERY ARG IS RESOLVED (applies to ALL formulas):
 * ─────────────────────────────────────────────────────
 *  "B1"        → specific cell, row 1 col B  (A1 ref) — value of THAT cell
 *  "income"    → current row's value in the "income" column
 *  "42"        → number literal 42
 *  '"hello"'   → string literal hello
 *  "IF(...)"   → nested formula result
 *
 * So =MULTIPLY(B1, 2)  works  (B1 → specific cell value, 2 → literal)
 *    =MULTIPLY(price, 2) works (price → current-row value of "price" col)
 *    =MULTIPLY(B1, C1)  works  (both specific cells)
 *    =SUBSTITUTE(A1, "Inc", "LLC") works
 *    =SUBSTITUTE(company, "Inc", "LLC") works
 *    =ADD(B1, B2) works — B1 and B2 are independent cells
 *
 * AGGREGATE FUNCTIONS (SUM, AVG, MAX, MIN, etc.) accept EITHER:
 *  =SUM(A1:A10)               → A1-range via parser
 *  =SUM(income, 0, 9)         → column "income", rows 0–9
 *  =SUM(income)               → column "income", ALL rows
 *  =SUM(B1, B10)              → col B rows 1–10 (A1 start/end refs)
 *
 * SCALAR FUNCTIONS (MULTIPLY, ADD, ROUND, etc.) accept ANY mix:
 *  =MULTIPLY(B1, C1)          → value of B1 × value of C1
 *  =MULTIPLY(price, 1.1)      → current-row price × 1.1
 *  =MULTIPLY(B1, tax_rate)    → value of B1 × current-row tax_rate
 *  =ADD(B1, B2)               → value of B1 + value of B2
 *
 * ARITHMETIC (no function name) accepts:
 *  =B1 * C1                   → specific cells
 *  =price * 1.1               → current-row column * literal
 *  =B1 + revenue              → mix of A1 ref and column name
 *
 * ============================================================
 */

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import type { SheetRow, ColumnDef } from "@/types/index";
import { Parser } from "hot-formula-parser";

// ─────────────────────────────────────────────────────────────
//  A1 REFERENCE HELPERS
// ─────────────────────────────────────────────────────────────

/**
 * Parse "B3" → { colIdx: 1, rowIdx: 2 }  (both 0-based)
 * Returns null if not a valid A1 ref.
 */
function parseA1Ref(token: string): { colIdx: number; rowIdx: number } | null {
  const m = token.match(/^([A-Z]+)(\d+)$/i);
  if (!m) return null;
  const letters = m[1].toUpperCase();
  const row1Based = parseInt(m[2], 10);
  if (row1Based < 1) return null;
  let colIdx = 0;
  for (let i = 0; i < letters.length; i++) {
    colIdx = colIdx * 26 + (letters.charCodeAt(i) - 64);
  }
  return { colIdx: colIdx - 1, rowIdx: row1Based - 1 };
}

function isA1Token(token: string): boolean {
  return /^[A-Z]+\d+$/i.test(token);
}

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
//  STRING UTILITIES
// ─────────────────────────────────────────────────────────────

function splitTopLevelArgs(str: string): string[] {
  const args: string[] = [];
  let depth = 0, inStr = false, strChar = "", cur = "";
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (inStr) {
      cur += ch;
      if (ch === strChar && str[i - 1] !== "\\") inStr = false;
    } else if (ch === '"' || ch === "'") {
      inStr = true; strChar = ch; cur += ch;
    } else if (ch === "(") { depth++; cur += ch; }
    else if (ch === ")") { depth--; cur += ch; }
    else if (ch === "," && depth === 0) { args.push(cur.trim()); cur = ""; }
    else { cur += ch; }
  }
  if (cur.trim()) args.push(cur.trim());
  return args;
}

function stripQuotes(s: string): string {
  if (s.length >= 2 &&
    ((s.startsWith('"') && s.endsWith('"')) ||
      (s.startsWith("'") && s.endsWith("'")))) {
    return s.slice(1, -1);
  }
  return s;
}

function isStringLiteral(s: string): boolean {
  return s.length >= 2 &&
    ((s.startsWith('"') && s.endsWith('"')) ||
      (s.startsWith("'") && s.endsWith("'")));
}

function isNumericLiteral(s: string): boolean {
  return s.trim() !== "" && !isNaN(Number(s));
}

// ─────────────────────────────────────────────────────────────
//  RESOLVED ARG
// ─────────────────────────────────────────────────────────────

interface ResolvedArg {
  raw: string;
  value: any;          // the resolved scalar value
  isCol: boolean;      // true = was a column-name ref (whole-col semantics)
  colIdx: number;      // valid when isCol=true OR isA1=true
  colKey: string;      // valid when isCol=true OR isA1=true
  isA1: boolean;       // true = was an A1-style ref
  a1Row: number;       // 0-based row when isA1=true
}

// ─────────────────────────────────────────────────────────────
//  FORMULA CONTEXT
// ─────────────────────────────────────────────────────────────

interface FormulaContext {
  rows: SheetRow[];
  columns: ColumnDef[];
  currentRowIdx: number;
  evaluateFormula: (formula: string, rowIdx: number) => any;
  findColumnIndex: (name: string) => number;
  /** Numeric values from a column over a row range */
  getColValues: (ci: number, start: number, end: number) => number[];
  /** Raw values from a column over a row range */
  getColRawValues: (ci: number, start: number, end: number) => any[];
}

type FormulaFn = (args: ResolvedArg[], ctx: FormulaContext) => any;

// ─────────────────────────────────────────────────────────────
//  AGGREGATE HELPERS
//
//  For aggregate functions (SUM, AVG, …):
//    arg[0] = column ref (colKey or A1 ref treated as column pointer)
//    arg[1] = optional startRow (number literal OR A1 ref → use its rowIdx)
//    arg[2] = optional endRow   (number literal OR A1 ref → use its rowIdx)
//
//  This means:
//    =SUM(income, 0, 9)   → col "income", rows 0–9
//    =SUM(income)         → col "income", all rows
//    =SUM(B1, B5)         → col B (=col 1), rows 0–4  (B1→row0, B5→row4)
// ─────────────────────────────────────────────────────────────

function resolveAggCol(arg: ResolvedArg, ctx: FormulaContext): number {
  if (arg.isA1 || arg.isCol) return arg.colIdx;
  return ctx.findColumnIndex(String(arg.value));
}

function resolveAggStart(arg: ResolvedArg | undefined, ctx: FormulaContext): number {
  if (!arg) return 0;
  if (arg.isA1) return arg.a1Row;
  return Number(arg.value) || 0;
}

function resolveAggEnd(arg: ResolvedArg | undefined, ctx: FormulaContext): number {
  if (!arg) return ctx.rows.length - 1;
  if (arg.isA1) return arg.a1Row;
  return Number(arg.value) ?? ctx.rows.length - 1;
}

function numVals(args: ResolvedArg[], ctx: FormulaContext, colArgIdx: number): number[] {
  const colArg = args[colArgIdx];
  if (!colArg) return [];
  const ci = resolveAggCol(colArg, ctx);
  if (ci === -1) return [];
  const start = resolveAggStart(args[colArgIdx + 1], ctx);
  const end = resolveAggEnd(args[colArgIdx + 2], ctx);
  return ctx.getColValues(ci, start, end);
}

function rawVals(args: ResolvedArg[], ctx: FormulaContext, colArgIdx: number): any[] {
  const colArg = args[colArgIdx];
  if (!colArg) return [];
  const ci = resolveAggCol(colArg, ctx);
  if (ci === -1) return [];
  const start = resolveAggStart(args[colArgIdx + 1], ctx);
  const end = resolveAggEnd(args[colArgIdx + 2], ctx);
  return ctx.getColRawValues(ci, start, end);
}

// ─────────────────────────────────────────────────────────────
//  SCALAR VALUE HELPER
//
//  Use this for ALL scalar (single-value) formulas like MULTIPLY,
//  ADD, ROUND, UPPER, IF, etc.
//
//  arg.value is ALREADY the resolved scalar — it contains:
//   - the actual cell value if the arg was a column name or A1 ref
//   - the literal number/string if the arg was a literal
//   - the nested formula result if the arg was a function call
//
//  So for scalar ops: just use arg.value directly. No extra lookup needed.
// ─────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────
//  FORMULA IMPLEMENTATIONS
//
//  KEY RULE: For scalar/single-value formulas, ALWAYS use
//  args[N]?.value directly. It is already resolved regardless
//  of whether the user passed B1, a column key, or a literal.
//
//  For aggregate formulas (SUM, AVG, etc.), use numVals() /
//  rawVals() / resolveAggCol() helpers which work on the full
//  column range.
// ─────────────────────────────────────────────────────────────

const FORMULA_IMPL: Record<string, FormulaFn> = {

  // ── MATH AGGREGATE ────────────────────────────────────────
  SUM: (args, ctx) => { const v = numVals(args, ctx, 0); return v.reduce((a, b) => a + b, 0); },
  AVG: (args, ctx) => { const v = numVals(args, ctx, 0); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0; },
  AVERAGE: (args, ctx) => FORMULA_IMPL.AVG(args, ctx),
  COUNT: (args, ctx) => numVals(args, ctx, 0).length,
  COUNTA: (args, ctx) => rawVals(args, ctx, 0).filter(v => v !== "" && v !== null && v !== undefined).length,
  COUNTBLANK: (args, ctx) => rawVals(args, ctx, 0).filter(v => v === "" || v === null || v === undefined).length,
  MAX: (args, ctx) => { const v = numVals(args, ctx, 0); return v.length ? Math.max(...v) : 0; },
  MIN: (args, ctx) => { const v = numVals(args, ctx, 0); return v.length ? Math.min(...v) : 0; },
  RANGE: (args, ctx) => { const v = numVals(args, ctx, 0); return v.length ? Math.max(...v) - Math.min(...v) : 0; },
  MEDIAN: (args, ctx) => {
    const v = [...numVals(args, ctx, 0)].sort((a, b) => a - b);
    if (!v.length) return 0;
    const m = Math.floor(v.length / 2);
    return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
  },
  MODE: (args, ctx) => {
    const v = numVals(args, ctx, 0);
    if (!v.length) return 0;
    const freq: Record<number, number> = {};
    v.forEach(n => freq[n] = (freq[n] || 0) + 1);
    return Number(Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0]);
  },
  STDEV: (args, ctx) => {
    const v = numVals(args, ctx, 0);
    if (!v.length) return 0;
    const mean = v.reduce((a, b) => a + b, 0) / v.length;
    return Math.sqrt(v.reduce((a, b) => a + (b - mean) ** 2, 0) / v.length);
  },
  VARIANCE: (args, ctx) => {
    const v = numVals(args, ctx, 0);
    if (!v.length) return 0;
    const mean = v.reduce((a, b) => a + b, 0) / v.length;
    return v.reduce((a, b) => a + (b - mean) ** 2, 0) / v.length;
  },
  PERCENTILE: (args, ctx) => {
    const ci = resolveAggCol(args[0], ctx);
    const pct = Number(args[1]?.value ?? 50) / 100;
    const start = resolveAggStart(args[2], ctx);
    const end = resolveAggEnd(args[3], ctx);
    const v = [...ctx.getColValues(ci, start, end)].sort((a, b) => a - b);
    if (!v.length) return 0;
    return v[Math.floor(pct * (v.length - 1))];
  },
  PERCENTRANK: (args, ctx) => {
    const v = numVals(args, ctx, 0);
    const cur = Number(args[0].value);
    const sorted = [...v].sort((a, b) => a - b);
    const rank = sorted.indexOf(cur);
    return v.length > 1 ? Math.round((rank / (v.length - 1)) * 100) : 100;
  },
  SUMIF: (args, ctx) => {
    const sumCi = resolveAggCol(args[0], ctx);
    const condCi = resolveAggCol(args[1], ctx);
    const criteria = String(args[2]?.value ?? "").toLowerCase();
    const start = resolveAggStart(args[3], ctx);
    const end = resolveAggEnd(args[4], ctx);
    if (sumCi === -1 || condCi === -1) return 0;
    const sumKey = ctx.columns[sumCi]?.key;
    const condKey = ctx.columns[condCi]?.key;
    let total = 0;
    for (let r = start; r <= Math.min(end, ctx.rows.length - 1); r++) {
      if (String(ctx.rows[r]?.[condKey] ?? "").toLowerCase() === criteria)
        total += Number(ctx.rows[r]?.[sumKey] ?? 0) || 0;
    }
    return total;
  },
  COUNTIF: (args, ctx) => {
    const ci = resolveAggCol(args[0], ctx);
    const val = String(args[1]?.value ?? "").toLowerCase();
    const start = resolveAggStart(args[2], ctx);
    const end = resolveAggEnd(args[3], ctx);
    if (ci === -1) return 0;
    const key = ctx.columns[ci].key;
    let count = 0;
    for (let r = start; r <= Math.min(end, ctx.rows.length - 1); r++) {
      if (String(ctx.rows[r]?.[key] ?? "").toLowerCase() === val) count++;
    }
    return count;
  },
  AVERAGEIF: (args, ctx) => {
    const avgCi = resolveAggCol(args[0], ctx);
    const condCi = resolveAggCol(args[1], ctx);
    const criteria = String(args[2]?.value ?? "").toLowerCase();
    const start = resolveAggStart(args[3], ctx);
    const end = resolveAggEnd(args[4], ctx);
    if (avgCi === -1 || condCi === -1) return 0;
    const avgKey = ctx.columns[avgCi]?.key;
    const condKey = ctx.columns[condCi]?.key;
    const vals: number[] = [];
    for (let r = start; r <= Math.min(end, ctx.rows.length - 1); r++) {
      if (String(ctx.rows[r]?.[condKey] ?? "").toLowerCase() === criteria)
        vals.push(Number(ctx.rows[r]?.[avgKey] ?? 0) || 0);
    }
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  },
  MAXIF: (args, ctx) => {
    const ci = resolveAggCol(args[0], ctx);
    const condCi = resolveAggCol(args[1], ctx);
    const crit = String(args[2]?.value ?? "").toLowerCase();
    const start = resolveAggStart(args[3], ctx);
    const end = resolveAggEnd(args[4], ctx);
    if (ci === -1 || condCi === -1) return 0;
    const key = ctx.columns[ci].key;
    const condKey = ctx.columns[condCi].key;
    const vals: number[] = [];
    for (let r = start; r <= Math.min(end, ctx.rows.length - 1); r++) {
      if (String(ctx.rows[r]?.[condKey] ?? "").toLowerCase() === crit)
        vals.push(Number(ctx.rows[r]?.[key] ?? 0));
    }
    return vals.length ? Math.max(...vals) : 0;
  },
  MINIF: (args, ctx) => {
    const ci = resolveAggCol(args[0], ctx);
    const condCi = resolveAggCol(args[1], ctx);
    const crit = String(args[2]?.value ?? "").toLowerCase();
    const start = resolveAggStart(args[3], ctx);
    const end = resolveAggEnd(args[4], ctx);
    if (ci === -1 || condCi === -1) return 0;
    const key = ctx.columns[ci].key;
    const condKey = ctx.columns[condCi].key;
    const vals: number[] = [];
    for (let r = start; r <= Math.min(end, ctx.rows.length - 1); r++) {
      if (String(ctx.rows[r]?.[condKey] ?? "").toLowerCase() === crit)
        vals.push(Number(ctx.rows[r]?.[key] ?? 0));
    }
    return vals.length ? Math.min(...vals) : 0;
  },
  UNIQUE_COUNT: (args, ctx) => new Set(rawVals(args, ctx, 0).map(String)).size,
  FIRST: (args, ctx) => rawVals(args, ctx, 0).find(v => v !== "" && v !== null && v !== undefined) ?? "",
  LAST: (args, ctx) => {
    const v = rawVals(args, ctx, 0).filter(v => v !== "" && v !== null && v !== undefined);
    return v.length ? v[v.length - 1] : "";
  },
  GROWTH: (args, ctx) => {
    const v = numVals(args, ctx, 0);
    if (v.length < 2 || v[0] === 0) return 0;
    return Math.round(((v[v.length - 1] - v[0]) / v[0]) * 10000) / 100;
  },
  CUMSUM: (args, ctx) => {
    const ci = resolveAggCol(args[0], ctx);
    const start = resolveAggStart(args[1], ctx);
    if (ci === -1) return 0;
    const key = ctx.columns[ci].key;
    let sum = 0;
    for (let r = start; r <= ctx.currentRowIdx; r++)
      sum += Number(ctx.rows[r]?.[key] ?? 0) || 0;
    return sum;
  },
  NORMALIZE: (args, ctx) => {
    const ci = resolveAggCol(args[0], ctx);
    const rowIdx = args[1] ? (args[1].isA1 ? args[1].a1Row : Number(args[1].value)) : ctx.currentRowIdx;
    const start = resolveAggStart(args[2], ctx);
    const end = resolveAggEnd(args[3], ctx);
    if (ci === -1) return 0;
    const key = ctx.columns[ci].key;
    const val = Number(ctx.rows[rowIdx]?.[key] ?? 0);
    const v = ctx.getColValues(ci, start, end);
    const mn = Math.min(...v), mx = Math.max(...v);
    return mx === mn ? 0 : Math.round(((val - mn) / (mx - mn)) * 1000) / 1000;
  },
  RANK: (args, ctx) => {
    const ci = resolveAggCol(args[0], ctx);
    const rowIdx = args[1] ? (args[1].isA1 ? args[1].a1Row : Number(args[1].value)) : ctx.currentRowIdx;
    const start = resolveAggStart(args[2], ctx);
    const end = resolveAggEnd(args[3], ctx);
    if (ci === -1) return 0;
    const key = ctx.columns[ci].key;
    const val = Number(ctx.rows[rowIdx]?.[key] ?? 0);
    const v = [...ctx.getColValues(ci, start, end)].sort((a, b) => b - a);
    return v.indexOf(val) + 1;
  },
  SCORE: (args, ctx) => {
    const ci = resolveAggCol(args[0], ctx);
    const start = resolveAggStart(args[1], ctx);
    const end = resolveAggEnd(args[2], ctx);
    if (ci === -1) return 0;
    const key = ctx.columns[ci].key;
    const val = Number(ctx.rows[ctx.currentRowIdx]?.[key] ?? 0);
    const v = ctx.getColValues(ci, start, end);
    const mn = Math.min(...v), mx = Math.max(...v);
    return mx === mn ? 0 : Math.round(((val - mn) / (mx - mn)) * 100);
  },

  // ── MATH SCALAR ───────────────────────────────────────────
  //
  //  All scalar math functions accept ANY arg type:
  //   - A1 ref like B1, C3     → resolveArg already resolved it to the cell's value
  //   - column key like "price" → resolveArg resolved it to the current row's value
  //   - number literal like 5   → resolveArg resolved it to the number 5
  //   - string literal          → resolveArg stripped quotes
  //   - nested function         → resolveArg evaluated it
  //
  //  In every case: args[N].value is the final scalar. Just use it.
  //
  ROUND: (args) => {
    const n = Number(args[0]?.value ?? 0);
    const d = Number(args[1]?.value ?? 0);
    return Math.round(n * 10 ** d) / 10 ** d;
  },
  CEIL: (args) => Math.ceil(Number(args[0]?.value ?? 0)),
  FLOOR: (args) => Math.floor(Number(args[0]?.value ?? 0)),
  ABS: (args) => Math.abs(Number(args[0]?.value ?? 0)),
  SQRT: (args) => Math.sqrt(Number(args[0]?.value ?? 0)),
  POWER: (args) => Math.pow(Number(args[0]?.value ?? 0), Number(args[1]?.value ?? 2)),
  MOD: (args) => Number(args[0]?.value ?? 0) % Number(args[1]?.value ?? 1),
  LOG: (args) => Math.log(Number(args[0]?.value ?? 1)) / Math.log(Number(args[1]?.value ?? 10)),
  LOG10: (args) => Math.log10(Number(args[0]?.value ?? 1)),
  EXP: (args) => Math.exp(Number(args[0]?.value ?? 0)),
  SIGN: (args) => Math.sign(Number(args[0]?.value ?? 0)),
  CLAMP: (args) => Math.min(Math.max(Number(args[0]?.value ?? 0), Number(args[1]?.value ?? 0)), Number(args[2]?.value ?? 100)),

  // ── ARITHMETIC SCALAR ─────────────────────────────────────
  //
  //  These accept any two values: cell refs (A1 or column key) or literals.
  //  Both args are already resolved scalars — just add/subtract/etc.
  //
  //  Examples that all work:
  //    =ADD(B1, C1)          — add two specific cells
  //    =ADD(price, 10)       — current-row price + literal
  //    =ADD(B1, tax_rate)    — specific cell + current-row column
  //    =MULTIPLY(B1, 5)      — specific cell * literal
  //    =MULTIPLY(price, qty) — two current-row columns
  //    =DIVIDE(B1, C2)       — two specific cells from different rows
  //
  ADD: (args) => Number(args[0]?.value ?? 0) + Number(args[1]?.value ?? 0),
  SUBTRACT: (args) => Number(args[0]?.value ?? 0) - Number(args[1]?.value ?? 0),
  MULTIPLY: (args) => Number(args[0]?.value ?? 0) * Number(args[1]?.value ?? 1),
  DIVIDE: (args) => {
    const divisor = Number(args[1]?.value ?? 1);
    return divisor !== 0 ? Number(args[0]?.value ?? 0) / divisor : "#DIV/0!";
  },

  COLVAL: (args, ctx) => {
    // =COLVAL(B3) → value of specific cell B3
    // =COLVAL(price) → current row's price
    if (args[0]?.isA1) return args[0].value;
    const ci = resolveAggCol(args[0], ctx);
    if (ci === -1) return "";
    return ctx.rows[ctx.currentRowIdx]?.[ctx.columns[ci].key] ?? "";
  },

  // ── TEXT ──────────────────────────────────────────────────
  // All text functions: args[0].value is already the resolved string
  // regardless of whether user passed B1, a column key, or a literal.
  UPPER: (args) => String(args[0]?.value ?? "").toUpperCase(),
  LOWER: (args) => String(args[0]?.value ?? "").toLowerCase(),
  PROPER: (args) => String(args[0]?.value ?? "").replace(/\b\w/g, c => c.toUpperCase()),
  TRIM: (args) => String(args[0]?.value ?? "").trim(),
  LEN: (args) => String(args[0]?.value ?? "").length,
  CONCAT: (args) => args.map(a => String(a.value ?? "")).join(""),
  JOIN: (args) => [String(args[0]?.value ?? ""), String(args[1]?.value ?? "")].join(String(args[2]?.value ?? " ")),
  LEFT: (args) => String(args[0]?.value ?? "").slice(0, Number(args[1]?.value ?? 1)),
  RIGHT: (args) => { const s = String(args[0]?.value ?? ""); return s.slice(-Math.max(1, Number(args[1]?.value ?? 1))); },
  MID: (args) => {
    const s = String(args[0]?.value ?? "");
    const start = Number(args[1]?.value ?? 1) - 1;
    return s.slice(start, start + Number(args[2]?.value ?? 1));
  },
  SUBSTITUTE: (args) => {
    const text = String(args[0]?.value ?? "");
    const oldStr = String(args[1]?.value ?? "");
    const newStr = String(args[2]?.value ?? "");
    if (!oldStr) return text;
    return text.split(oldStr).join(newStr);
  },
  REPLACE: (args) => {
    const text = String(args[0]?.value ?? "");
    const start = Number(args[1]?.value ?? 1) - 1;
    const len = Number(args[2]?.value ?? 0);
    return text.slice(0, start) + String(args[3]?.value ?? "") + text.slice(start + len);
  },
  REPEAT: (args) => String(args[0]?.value ?? "").repeat(Math.max(0, Number(args[1]?.value ?? 1))),
  SPLIT: (args) => String(args[0]?.value ?? "").split(String(args[1]?.value ?? " "))[Number(args[2]?.value ?? 0)] ?? "",
  CONTAINS: (args) => String(args[0]?.value ?? "").toLowerCase().includes(String(args[1]?.value ?? "").toLowerCase()) ? "✓" : "✗",
  STARTSWITH: (args) => String(args[0]?.value ?? "").toLowerCase().startsWith(String(args[1]?.value ?? "").toLowerCase()) ? "✓" : "✗",
  ENDSWITH: (args) => String(args[0]?.value ?? "").toLowerCase().endsWith(String(args[1]?.value ?? "").toLowerCase()) ? "✓" : "✗",
  INDEXOF: (args) => String(args[0]?.value ?? "").indexOf(String(args[1]?.value ?? "")),
  WORDCOUNT: (args) => String(args[0]?.value ?? "").trim().split(/\s+/).filter(Boolean).length,
  REVERSE: (args) => String(args[0]?.value ?? "").split("").reverse().join(""),
  PAD: (args) => String(args[0]?.value ?? "").padStart(Number(args[1]?.value ?? 0), String(args[2]?.value ?? " ")),
  PADLEFT: (args) => String(args[0]?.value ?? "").padStart(Number(args[1]?.value ?? 0), String(args[2]?.value ?? " ")),
  PADRIGHT: (args) => String(args[0]?.value ?? "").padEnd(Number(args[1]?.value ?? 0), String(args[2]?.value ?? " ")),
  EXTRACTNUMBER: (args) => (String(args[0]?.value ?? "").match(/[\d.]+/g) || []).join(""),
  SLUGIFY: (args) => String(args[0]?.value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
  INITIALS: (args) => String(args[0]?.value ?? "").split(/\s+/).map((w: string) => w[0]).filter(Boolean).join("").toUpperCase(),
  MASK: (args) => {
    const s = String(args[0]?.value ?? "");
    const n = Number(args[1]?.value ?? 4);
    return "*".repeat(Math.max(0, s.length - n)) + s.slice(-n);
  },
  TRUNCATE: (args) => {
    const s = String(args[0]?.value ?? "");
    const max = Number(args[1]?.value ?? 50);
    const suf = String(args[2]?.value ?? "…");
    return s.length > max ? s.slice(0, max) + suf : s;
  },
  ENCODE: (args) => encodeURIComponent(String(args[0]?.value ?? "")),
  DECODE: (args) => { try { return decodeURIComponent(String(args[0]?.value ?? "")); } catch { return String(args[0]?.value ?? ""); } },
  BASE64: (args) => { try { return btoa(String(args[0]?.value ?? "")); } catch { return ""; } },

  // ── LOGIC ─────────────────────────────────────────────────
  IF: (args) => {
    if (args.length <= 3) {
      // Standard 3-arg: IF(condition, trueResult, falseResult)
      // condition can be: A1 ref, column key, nested formula, or literal
      const cond = args[0]?.value;
      const isTruthy = cond && cond !== 0 && cond !== "0" && cond !== false && cond !== "false" && cond !== "";
      return isTruthy ? args[1]?.value : args[2]?.value;
    }
    // 4-arg: IF(value, matchValue, trueResult, falseResult)
    return String(args[0]?.value ?? "").toLowerCase() === String(args[1]?.value ?? "").toLowerCase()
      ? args[2]?.value : args[3]?.value;
  },
  IFN: (args) => args[0]?.value ? args[1]?.value : args[2]?.value,
  IFERROR: (args) => {
    const v = args[0]?.value;
    return (v === null || v === undefined || v === "" || String(v).startsWith("#")) ? args[1]?.value : v;
  },
  IFEMPTY: (args) => (args[0]?.value === null || args[0]?.value === undefined || args[0]?.value === "") ? args[1]?.value : args[0]?.value,
  SWITCH: (args) => {
    const cellVal = String(args[0]?.value ?? "").toLowerCase();
    for (let i = 1; i + 1 < args.length; i += 2) {
      if (cellVal === String(args[i]?.value ?? "").toLowerCase()) return args[i + 1]?.value;
    }
    return args.length % 2 === 0 ? args[args.length - 1]?.value : "";
  },
  AND: (args) => args.every(a => !!a.value) ? "✓" : "✗",
  OR: (args) => args.some(a => !!a.value) ? "✓" : "✗",
  NOT: (args) => !args[0]?.value ? "✓" : "✗",
  XOR: (args) => (!!args[0]?.value !== !!args[1]?.value) ? "✓" : "✗",
  GT: (args) => Number(args[0]?.value ?? 0) > Number(args[1]?.value ?? 0) ? "✓" : "✗",
  LT: (args) => Number(args[0]?.value ?? 0) < Number(args[1]?.value ?? 0) ? "✓" : "✗",
  GTE: (args) => Number(args[0]?.value ?? 0) >= Number(args[1]?.value ?? 0) ? "✓" : "✗",
  LTE: (args) => Number(args[0]?.value ?? 0) <= Number(args[1]?.value ?? 0) ? "✓" : "✗",
  EQ: (args) => String(args[0]?.value ?? "").toLowerCase() === String(args[1]?.value ?? "").toLowerCase() ? "✓" : "✗",
  NEQ: (args) => String(args[0]?.value ?? "").toLowerCase() !== String(args[1]?.value ?? "").toLowerCase() ? "✓" : "✗",
  BETWEEN: (args) => {
    const v = Number(args[0]?.value ?? 0);
    return v >= Number(args[1]?.value ?? 0) && v <= Number(args[2]?.value ?? 100) ? "✓" : "✗";
  },

  // ── TYPE CHECK ────────────────────────────────────────────
  ISNUMBER: (args) => !isNaN(Number(args[0]?.value)) && String(args[0]?.value).trim() !== "" ? "✓" : "✗",
  ISEMPTY: (args) => (args[0]?.value === "" || args[0]?.value == null) ? "✓" : "✗",
  ISNOTEMPTY: (args) => (args[0]?.value !== "" && args[0]?.value != null) ? "✓" : "✗",
  ISBOOL: (args) => typeof args[0]?.value === "boolean" ? "✓" : "✗",
  ISTEXT: (args) => isNaN(Number(args[0]?.value)) && typeof args[0]?.value === "string" ? "✓" : "✗",
  ISURL: (args) => { try { new URL(String(args[0]?.value ?? "")); return "✓"; } catch { return "✗"; } },
  ISEMAIL: (args) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(args[0]?.value ?? "")) ? "✓" : "✗",
  TYPEOF: (args) => {
    const v = args[0]?.value;
    if (v === "" || v == null) return "empty";
    if (typeof v === "boolean") return "boolean";
    if (!isNaN(Number(v))) return "number";
    return "text";
  },
  TOTEXT: (args) => String(args[0]?.value ?? ""),
  TONUMBER: (args) => Number((String(args[0]?.value ?? "").match(/[\d.]+/) || ["0"])[0]),
  TOBOOL: (args) => ["true", "1", "yes", "on"].includes(String(args[0]?.value ?? "").toLowerCase()),

  // ── DATE ──────────────────────────────────────────────────
  TODAY: () => new Date().toISOString().slice(0, 10),
  NOW: () => new Date().toLocaleString(),
  YEAR: (args) => new Date(String(args[0]?.value ?? "")).getFullYear(),
  MONTH: (args) => new Date(String(args[0]?.value ?? "")).getMonth() + 1,
  DAY: (args) => new Date(String(args[0]?.value ?? "")).getDate(),
  HOUR: (args) => new Date(String(args[0]?.value ?? "")).getHours(),
  MINUTE: (args) => new Date(String(args[0]?.value ?? "")).getMinutes(),
  WEEKDAY: (args) => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date(String(args[0]?.value ?? "")).getDay()],
  WEEKNUM: (args) => {
    const d = new Date(String(args[0]?.value ?? ""));
    const start = new Date(d.getFullYear(), 0, 1);
    return Math.ceil(((d.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7);
  },
  QUARTER: (args) => Math.ceil((new Date(String(args[0]?.value ?? "")).getMonth() + 1) / 3),
  DATEDIFF: (args) => Math.round((new Date(String(args[1]?.value ?? "")).getTime() - new Date(String(args[0]?.value ?? "")).getTime()) / 86400000),
  DATEADD: (args) => { const d = new Date(String(args[0]?.value ?? "")); d.setDate(d.getDate() + Number(args[1]?.value ?? 0)); return d.toISOString().slice(0, 10); },
  MONTHSADD: (args) => { const d = new Date(String(args[0]?.value ?? "")); d.setMonth(d.getMonth() + Number(args[1]?.value ?? 0)); return d.toISOString().slice(0, 10); },
  YEARSADD: (args) => { const d = new Date(String(args[0]?.value ?? "")); d.setFullYear(d.getFullYear() + Number(args[1]?.value ?? 0)); return d.toISOString().slice(0, 10); },
  AGE: (args) => {
    const d = new Date(String(args[0]?.value ?? "")), now = new Date();
    let age = now.getFullYear() - d.getFullYear();
    if (now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())) age--;
    return age;
  },
  BUSINESSDAYS: (args) => {
    const d1 = new Date(String(args[0]?.value ?? "")), d2 = new Date(String(args[1]?.value ?? ""));
    let count = 0, cur = new Date(d1);
    while (cur <= d2) { const day = cur.getDay(); if (day !== 0 && day !== 6) count++; cur.setDate(cur.getDate() + 1); }
    return count;
  },
  FORMATDATE: (args) => {
    const d = new Date(String(args[0]?.value ?? "")), fmt = String(args[1]?.value ?? "iso").toLowerCase();
    if (fmt === "long") return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    if (fmt === "medium") return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    if (fmt === "short") return d.toLocaleDateString("en-US");
    if (fmt === "time") return d.toLocaleTimeString("en-US");
    return d.toISOString().slice(0, 10);
  },
  ISWEEKEND: (args) => { const d = new Date(String(args[0]?.value ?? "")).getDay(); return (d === 0 || d === 6) ? "✓" : "✗"; },
  ISWEEKDAY: (args) => { const d = new Date(String(args[0]?.value ?? "")).getDay(); return (d >= 1 && d <= 5) ? "✓" : "✗"; },
  ISLEAPYEAR: (args) => { const y = new Date(String(args[0]?.value ?? "")).getFullYear(); return (y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0)) ? "✓" : "✗"; },
  DAYSINMONTH: (args) => { const d = new Date(String(args[0]?.value ?? "")); return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(); },
  FROMUNIX: (args) => new Date(Number(args[0]?.value ?? 0) * 1000).toISOString().slice(0, 10),
  TOUNIX: (args) => Math.floor(new Date(String(args[0]?.value ?? "")).getTime() / 1000),

  // ── DISPLAY ───────────────────────────────────────────────
  CURRENCY: (args) => Number(args[0]?.value ?? 0).toLocaleString("en-US", { style: "currency", currency: String(args[1]?.value ?? "USD") }),
  PERCENT: (args) => `${Number(args[0]?.value ?? 0).toFixed(Number(args[1]?.value ?? 1))}%`,
  NUMFORMAT: (args) => Number(args[0]?.value ?? 0).toLocaleString("en-US", { minimumFractionDigits: Number(args[1]?.value ?? 0), maximumFractionDigits: Number(args[1]?.value ?? 0) }),
  EMOJI_BOOL: (args) => args[0]?.value ? "✅" : "❌",
  TRAFFIC_LIGHT: (args) => { const v = Number(args[0]?.value ?? 0); return v >= 70 ? "🟢" : v >= 40 ? "🟡" : "🔴"; },
  GRADE: (args) => { const v = Number(args[0]?.value ?? 0); return v >= 90 ? "A" : v >= 80 ? "B" : v >= 70 ? "C" : v >= 60 ? "D" : "F"; },
  LABEL: (args, ctx) => {
    const v = Number(args[0]?.value ?? 0);
    const vals = numVals(args, ctx, 0);
    const mn = Math.min(...vals), mx = Math.max(...vals);
    const pct = mx === mn ? 0 : (v - mn) / (mx - mn);
    return pct >= 0.67 ? "High" : pct >= 0.33 ? "Medium" : "Low";
  },
  SPARKLINE: (args, ctx) => {
    const bars = ["▁", "▂", "▃", "▄", "▅", "▆", "▇", "█"];
    const vals = numVals(args, ctx, 0);
    if (!vals.length) return "";
    const mn = Math.min(...vals), mx = Math.max(...vals);
    return vals.map(v => bars[mx === mn ? 3 : Math.floor(((v - mn) / (mx - mn)) * 7)]).join("");
  },
  STARS: (args) => {
    const n = Math.round(Math.min(Number(args[0]?.value ?? 0), Number(args[1]?.value ?? 5)));
    const max = Number(args[1]?.value ?? 5);
    return "★".repeat(n) + "☆".repeat(max - n);
  },
  PROGRESSBAR: (args) => {
    const pct = Math.min(100, Math.max(0, Number(args[0]?.value ?? 0)));
    const fill = Math.round(pct / 10);
    return `[${"█".repeat(fill)}${"░".repeat(10 - fill)}] ${pct}%`;
  },
  TREND: (args, ctx) => {
    const vals = numVals(args, ctx, 0);
    if (vals.length < 2) return "→";
    return vals[vals.length - 1] > vals[0] ? "↑" : vals[vals.length - 1] < vals[0] ? "↓" : "→";
  },
  OUTLIER: (args, ctx) => {
    const ci = resolveAggCol(args[0], ctx);
    const rowIdx = args[1] ? (args[1].isA1 ? args[1].a1Row : Number(args[1].value)) : ctx.currentRowIdx;
    const start = resolveAggStart(args[2], ctx);
    const end = resolveAggEnd(args[3], ctx);
    if (ci === -1) return "";
    const key = ctx.columns[ci].key;
    const val = Number(ctx.rows[rowIdx]?.[key] ?? 0);
    const v = ctx.getColValues(ci, start, end);
    const mean = v.reduce((a, b) => a + b, 0) / v.length;
    const std = Math.sqrt(v.reduce((a, b) => a + (b - mean) ** 2, 0) / v.length);
    return Math.abs(val - mean) > 2 * std ? "⚠️" : "";
  },
  PLURALIZE: (args) => Number(args[0]?.value ?? 0) === 1 ? `1 ${args[1]?.value}` : `${args[0]?.value} ${args[2]?.value}`,
  ORDINAL: (args) => {
    const n = Number(args[0]?.value ?? 0);
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  },
  HEATCOLOR: (args, ctx) => {
    const v = Number(args[0]?.value ?? 0);
    const vals = numVals(args, ctx, 0);
    const mn = Math.min(...vals), mx = Math.max(...vals);
    const pct = mx === mn ? 0 : (v - mn) / (mx - mn);
    return pct >= 0.67 ? "high" : pct >= 0.33 ? "medium" : "low";
  },
  ROMANIZE: (args) => {
    let n = Number(args[0]?.value ?? 0);
    const val = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
    const sym = ["M", "CM", "D", "CD", "C", "XC", "L", "XL", "X", "IX", "V", "IV", "I"];
    let r = "";
    for (let i = 0; i < val.length; i++) { while (n >= val[i]) { r += sym[i]; n -= val[i]; } }
    return r;
  },

  // ── LOOKUP ────────────────────────────────────────────────
  VLOOKUP: (args, ctx) => {
    const lookCi = resolveAggCol(args[0], ctx);
    const lookVal = String(args[1]?.value ?? "").toLowerCase();
    const retCi = resolveAggCol(args[2], ctx);
    const start = resolveAggStart(args[3], ctx);
    const end = resolveAggEnd(args[4], ctx);
    if (lookCi === -1 || retCi === -1) return "#N/A";
    const lookKey = ctx.columns[lookCi].key, retKey = ctx.columns[retCi].key;
    for (let r = start; r <= Math.min(end, ctx.rows.length - 1); r++) {
      if (String(ctx.rows[r]?.[lookKey] ?? "").toLowerCase() === lookVal) return ctx.rows[r]?.[retKey] ?? "";
    }
    return "#N/A";
  },
  HLOOKUP: (args, ctx) => FORMULA_IMPL.VLOOKUP(args, ctx),
  MATCH: (args, ctx) => {
    const ci = resolveAggCol(args[0], ctx);
    const val = String(args[1]?.value ?? "").toLowerCase();
    const start = resolveAggStart(args[2], ctx);
    const end = resolveAggEnd(args[3], ctx);
    if (ci === -1) return -1;
    const key = ctx.columns[ci].key;
    for (let r = start; r <= Math.min(end, ctx.rows.length - 1); r++) {
      if (String(ctx.rows[r]?.[key] ?? "").toLowerCase() === val) return r;
    }
    return -1;
  },
  INDEX: (args, ctx) => {
    const ci = resolveAggCol(args[0], ctx);
    const rowIdx = args[1] ? (args[1].isA1 ? args[1].a1Row : Number(args[1].value)) : ctx.currentRowIdx;
    if (ci === -1) return "";
    return ctx.rows[rowIdx]?.[ctx.columns[ci].key] ?? "";
  },
  RELATED: (args, ctx) => FORMULA_IMPL.COLVAL(args, ctx),

  // ── ARRAY / SET ───────────────────────────────────────────
  VALUES: (args, ctx) => rawVals(args, ctx, 0).filter(v => v !== "" && v != null).join(", "),
  UNIQUE: (args, ctx) => [...new Set(rawVals(args, ctx, 0).map(String))].join(", "),
  FILTERVALS: (args, ctx) => {
    const sumCi = resolveAggCol(args[0], ctx);
    const condCi = resolveAggCol(args[1], ctx);
    const crit = String(args[2]?.value ?? "").toLowerCase();
    const start = resolveAggStart(args[3], ctx);
    const end = resolveAggEnd(args[4], ctx);
    if (sumCi === -1 || condCi === -1) return "";
    const sumKey = ctx.columns[sumCi].key, condKey = ctx.columns[condCi].key;
    const results: any[] = [];
    for (let r = start; r <= Math.min(end, ctx.rows.length - 1); r++) {
      if (String(ctx.rows[r]?.[condKey] ?? "").toLowerCase() === crit) results.push(ctx.rows[r]?.[sumKey] ?? "");
    }
    return results.join(", ");
  },
  TOP: (args, ctx) => {
    const ci = resolveAggCol(args[0], ctx);
    const n = Number(args[1]?.value ?? 3);
    const start = resolveAggStart(args[2], ctx);
    const end = resolveAggEnd(args[3], ctx);
    if (ci === -1) return "";
    return [...ctx.getColValues(ci, start, end)].sort((a, b) => b - a).slice(0, n).join(", ");
  },
  BOTTOM: (args, ctx) => {
    const ci = resolveAggCol(args[0], ctx);
    const n = Number(args[1]?.value ?? 3);
    const start = resolveAggStart(args[2], ctx);
    const end = resolveAggEnd(args[3], ctx);
    if (ci === -1) return "";
    return [...ctx.getColValues(ci, start, end)].sort((a, b) => a - b).slice(0, n).join(", ");
  },
  FLATTEN: (args, ctx) => [...new Set(numVals(args, ctx, 0))].sort((a, b) => a - b).join(", "),

  // ── FINANCIAL ─────────────────────────────────────────────
  ROI: (args) => {
    const gain = Number(args[0]?.value ?? 0), cost = Number(args[1]?.value ?? 1);
    return cost === 0 ? 0 : Math.round(((gain - cost) / cost) * 10000) / 100;
  },
  MARGIN: (args) => {
    const rev = Number(args[0]?.value ?? 0), cost = Number(args[1]?.value ?? 0);
    return rev === 0 ? 0 : Math.round(((rev - cost) / rev) * 10000) / 100;
  },
  MARKUP: (args) => {
    const cost = Number(args[0]?.value ?? 0), price = Number(args[1]?.value ?? 0);
    return cost === 0 ? 0 : Math.round(((price - cost) / cost) * 10000) / 100;
  },
  CAGR: (args) => {
    const s = Number(args[0]?.value ?? 0), e = Number(args[1]?.value ?? 0), y = Number(args[2]?.value ?? 1);
    return s === 0 || y === 0 ? 0 : Math.round((Math.pow(e / s, 1 / y) - 1) * 10000) / 100;
  },
  PMT: (args) => {
    const rate = Number(args[0]?.value ?? 0) / 100 / 12;
    const n = Number(args[1]?.value ?? 1), pv = Number(args[2]?.value ?? 0);
    if (rate === 0) return pv / n;
    return Math.round((pv * rate / (1 - Math.pow(1 + rate, -n))) * 100) / 100;
  },
  COMPOUND: (args) => {
    const p = Number(args[0]?.value ?? 0), r = Number(args[1]?.value ?? 0) / 100, y = Number(args[2]?.value ?? 1);
    return Math.round(p * Math.pow(1 + r, y) * 100) / 100;
  },
  SIMPLE_INTEREST: (args) => {
    const p = Number(args[0]?.value ?? 0), r = Number(args[1]?.value ?? 0) / 100, y = Number(args[2]?.value ?? 1);
    return Math.round(p * r * y * 100) / 100;
  },
  DEPRECIATION: (args) => {
    const cost = Number(args[0]?.value ?? 0), salvage = Number(args[1]?.value ?? 0), life = Number(args[2]?.value ?? 1);
    return life === 0 ? 0 : Math.round(((cost - salvage) / life) * 100) / 100;
  },
  BREAKEVEN: (args) => {
    const fixed = Number(args[0]?.value ?? 0), price = Number(args[1]?.value ?? 0), varCost = Number(args[2]?.value ?? 0);
    return price === varCost ? Infinity : Math.ceil(fixed / (price - varCost));
  },
  TAX: (args) => Math.round(Number(args[0]?.value ?? 0) * Number(args[1]?.value ?? 0) / 100 * 100) / 100,
  AFTERTAX: (args) => Math.round(Number(args[0]?.value ?? 0) * (1 - Number(args[1]?.value ?? 0) / 100) * 100) / 100,

  // ── UTILITY ───────────────────────────────────────────────
  RANDOM: () => Math.random(),
  RANDOMINT: (args) => { const mn = Number(args[0]?.value ?? 0), mx = Number(args[1]?.value ?? 100); return Math.floor(Math.random() * (mx - mn + 1)) + mn; },
  UUID: () => (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  ROW: (_, ctx) => ctx.currentRowIdx + 1,
  HASH: (args) => { let h = 0; for (const c of String(args[0]?.value ?? "")) h = Math.imul(31, h) + c.charCodeAt(0) | 0; return Math.abs(h).toString(16); },
  BINARY: (args) => (Number(args[0]?.value ?? 0) >>> 0).toString(2),
  HEX: (args) => (Number(args[0]?.value ?? 0) >>> 0).toString(16).toUpperCase(),
  OCTAL: (args) => (Number(args[0]?.value ?? 0) >>> 0).toString(8),
  CHARCODE: (args) => String(args[0]?.value ?? "").charCodeAt(0) || 0,
  CHAR: (args) => String.fromCharCode(Number(args[0]?.value ?? 65)),

  // ── CONVERSIONS ───────────────────────────────────────────
  CELSIUSTOFAHRENHEIT: (args) => Math.round((Number(args[0]?.value ?? 0) * 9 / 5 + 32) * 10) / 10,
  FAHRENHEITTOCELSIUS: (args) => Math.round(((Number(args[0]?.value ?? 0) - 32) * 5 / 9) * 10) / 10,
  KGTOLBS: (args) => Math.round(Number(args[0]?.value ?? 0) * 2.20462 * 100) / 100,
  LBSTOKG: (args) => Math.round(Number(args[0]?.value ?? 0) / 2.20462 * 100) / 100,
  KMTOMI: (args) => Math.round(Number(args[0]?.value ?? 0) * 0.621371 * 100) / 100,
  MITOKM: (args) => Math.round(Number(args[0]?.value ?? 0) * 1.60934 * 100) / 100,
  LTOGAL: (args) => Math.round(Number(args[0]?.value ?? 0) * 0.264172 * 100) / 100,
  GALTOL: (args) => Math.round(Number(args[0]?.value ?? 0) * 3.78541 * 100) / 100,
  MSTOKPH: (args) => Math.round(Number(args[0]?.value ?? 0) * 3.6 * 100) / 100,
  KPHTOMS: (args) => Math.round(Number(args[0]?.value ?? 0) / 3.6 * 100) / 100,
  BMI: (args) => { const w = Number(args[0]?.value ?? 0), h = Number(args[1]?.value ?? 1); return h === 0 ? 0 : Math.round(w / (h * h) * 10) / 10; },
  DISTANCE: (args) => {
    const [lat1, lon1, lat2, lon2] = args.map(a => Number(a.value ?? 0) * Math.PI / 180);
    const R = 6371, dLat = lat2 - lat1, dLon = lon2 - lon1;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
  },
};

// ─────────────────────────────────────────────────────────────
//  ARITHMETIC EVALUATOR
//  =B1*C1, =price*1.1, =B1+revenue, =A1-B1
// ─────────────────────────────────────────────────────────────

const JS_RESERVED = new Set(["true", "false", "null", "undefined", "Infinity", "NaN"]);

function evaluateArithmetic(
  expr: string,
  rowIdx: number,
  rows: SheetRow[],
  columns: ColumnDef[],
  findColumnIndex: (n: string) => number
): any {
  // 1. Protect string literals
  const literals: string[] = [];
  let safe = expr.replace(/"([^"\\]|\\.)*"|'([^'\\]|\\.)*'/g, m => {
    literals.push(m); return `__S${literals.length - 1}__`;
  });

  // 2. Replace A1 refs FIRST (they match [A-Z]+\d+, must come before col name replace)
  safe = safe.replace(/\b([A-Z]+\d+)\b/gi, match => {
    if (/^__S\d+__$/.test(match)) return match;
    const ref = parseA1Ref(match);
    if (!ref || ref.colIdx >= columns.length || ref.rowIdx >= rows.length) return "0";
    const val = rows[ref.rowIdx]?.[columns[ref.colIdx]?.key];
    const num = Number(val);
    return isNaN(num) ? `"${String(val ?? "")}"` : String(num);
  });

  // 3. Replace column name identifiers (not followed by '(')
  safe = safe.replace(/\b([A-Za-z_][A-Za-z0-9_]*)(?!\s*\()\b/g, match => {
    if (/^__S\d+__$/.test(match)) return match;
    if (JS_RESERVED.has(match)) return match;
    const ci = findColumnIndex(match);
    if (ci !== -1) {
      const val = rows[rowIdx]?.[columns[ci].key];
      const num = Number(val);
      return isNaN(num) ? `"${String(val ?? "")}"` : String(num);
    }
    return match;
  });

  // 4. Restore string literals
  safe = safe.replace(/__S(\d+)__/g, (_, i) => literals[parseInt(i, 10)]);

  try {
    // eslint-disable-next-line no-new-func
    return Function(`"use strict"; return (${safe})`)();
  } catch {
    return "#EXPR!";
  }
}

// ─────────────────────────────────────────────────────────────
//  ARG RESOLVER  —  single source of truth for all arg types
//
//  After this function runs, arg.value is ALWAYS the final scalar.
//  Formula implementations never need to do another lookup.
// ─────────────────────────────────────────────────────────────

function resolveArg(
  raw: string,
  rowIdx: number,
  rows: SheetRow[],
  columns: ColumnDef[],
  formulas: Record<string, string>,
  columnFormulas: Record<string, string>,
  evaluating: Set<string>,
  findColumnIndex: (n: string) => number,
  evalFn: (expr: string, rIdx: number) => any
): ResolvedArg {
  const t = raw.trim();
  const blank: Omit<ResolvedArg, "raw" | "value"> = { isCol: false, colIdx: -1, colKey: "", isA1: false, a1Row: -1 };

  // Quoted string literal — strip quotes so value is the bare string
  if (isStringLiteral(t)) return { ...blank, raw: t, value: stripQuotes(t) };

  // Numeric literal
  if (isNumericLiteral(t)) return { ...blank, raw: t, value: Number(t) };

  // Boolean literals
  if (t.toUpperCase() === "TRUE") return { ...blank, raw: t, value: true };
  if (t.toUpperCase() === "FALSE") return { ...blank, raw: t, value: false };

  // Nested function call  e.g. UPPER(name), IF(done, 1, 0)
  if (/^[A-Z_][A-Z0-9_]*\s*\(/i.test(t)) {
    return { ...blank, raw: t, value: evalFn(t, rowIdx) };
  }

  // A1-style cell reference  e.g. B3, AA12
  // IMPORTANT: Check BEFORE column name lookup — "B3" is not a column named "B3"
  if (isA1Token(t)) {
    const ref = parseA1Ref(t);
    if (ref && ref.colIdx < columns.length && ref.rowIdx < rows.length) {
      const colDef = columns[ref.colIdx];
      if (colDef) {
        const cellKey = `${ref.rowIdx}-${colDef.key}`;
        const cellFormula = formulas[cellKey] ?? columnFormulas[colDef.key];
        let val: any;
        if (cellFormula?.startsWith("=") && !evaluating.has(cellKey)) {
          evaluating.add(cellKey);
          val = evalFn(cellFormula.slice(1), ref.rowIdx);
          evaluating.delete(cellKey);
        } else {
          val = rows[ref.rowIdx]?.[colDef.key];
        }
        // value is the cell's actual value — ready to use
        return { raw: t, value: val, isCol: false, colIdx: ref.colIdx, colKey: colDef.key, isA1: true, a1Row: ref.rowIdx };
      }
    }
    // A1 ref out of bounds → 0
    return { ...blank, raw: t, value: 0 };
  }

  // Column name / key  e.g. "income", "company_name"
  // value = current row's value in that column
  const ci = findColumnIndex(t);
  if (ci !== -1) {
    const colKey = columns[ci].key;
    const cellKey = `${rowIdx}-${colKey}`;
    const cellFormula = formulas[cellKey] ?? columnFormulas[colKey];
    let val: any;
    if (cellFormula?.startsWith("=") && !evaluating.has(cellKey)) {
      evaluating.add(cellKey);
      val = evalFn(cellFormula.slice(1), rowIdx);
      evaluating.delete(cellKey);
    } else {
      val = rows[rowIdx]?.[colKey];
    }
    // value is the current row's value in this column — ready to use
    return { raw: t, value: val, isCol: true, colIdx: ci, colKey, isA1: false, a1Row: -1 };
  }

  // Unknown identifier — treat as empty string
  return { ...blank, raw: t, value: "" };
}

// ─────────────────────────────────────────────────────────────
//  MAIN EVALUATOR
// ─────────────────────────────────────────────────────────────

function parseAndEval(
  expr: string,
  rowIdx: number,
  rows: SheetRow[],
  columns: ColumnDef[],
  formulas: Record<string, string>,
  columnFormulas: Record<string, string>,
  evaluating: Set<string>,
  findColumnIndex: (n: string) => number
): any {
  expr = expr.trim();

  const evalSub = (sub: string, rIdx: number) =>
    parseAndEval(sub, rIdx, rows, columns, formulas, columnFormulas, evaluating, findColumnIndex);

  // Bare A1 ref  e.g. =B3
  if (isA1Token(expr)) {
    const ref = parseA1Ref(expr);
    if (ref && ref.colIdx < columns.length && ref.rowIdx < rows.length) {
      const colDef = columns[ref.colIdx];
      if (colDef) {
        const cellKey = `${ref.rowIdx}-${colDef.key}`;
        const cellFormula = formulas[cellKey] ?? columnFormulas[colDef.key];
        if (cellFormula?.startsWith("=") && !evaluating.has(cellKey)) {
          evaluating.add(cellKey);
          const result = evalSub(cellFormula.slice(1), ref.rowIdx);
          evaluating.delete(cellKey);
          return result;
        }
        return rows[ref.rowIdx]?.[colDef.key];
      }
    }
    return 0;
  }

  // Function call  e.g. MULTIPLY(B1, 2), ADD(price, tax_rate)
  const fnMatch = expr.match(/^([A-Z_][A-Z0-9_]*)\s*\((.*)\)$/is);
  if (fnMatch) {
    const fnName = fnMatch[1].toUpperCase();
    const impl = FORMULA_IMPL[fnName];
    if (!impl) return `#NAME? '${fnName}'`;

    const rawArgList = splitTopLevelArgs(fnMatch[2]);
    const resolved = rawArgList.map(raw =>
      resolveArg(raw.trim(), rowIdx, rows, columns, formulas, columnFormulas, evaluating, findColumnIndex, evalSub)
    );

    const ctx: FormulaContext = {
      rows, columns, currentRowIdx: rowIdx,
      evaluateFormula: (f, r) => evalSub(f.startsWith("=") ? f.slice(1) : f, r),
      findColumnIndex,
      getColValues: (ci, start, end) => {
        if (ci < 0 || ci >= columns.length) return [];
        const key = columns[ci].key;
        const vals: number[] = [];
        for (let r = Math.max(0, start); r <= Math.min(end, rows.length - 1); r++) {
          const n = Number(rows[r]?.[key]);
          if (!isNaN(n)) vals.push(n);
        }
        return vals;
      },
      getColRawValues: (ci, start, end) => {
        if (ci < 0 || ci >= columns.length) return [];
        const key = columns[ci].key;
        const vals: any[] = [];
        for (let r = Math.max(0, start); r <= Math.min(end, rows.length - 1); r++)
          vals.push(rows[r]?.[key]);
        return vals;
      },
    };

    try { return impl(resolved, ctx); }
    catch (e: any) { return `#ERR! ${e?.message ?? ""}`; }
  }

  // Arithmetic expression  e.g. B1*C1, price*1.1, B1+revenue
  return evaluateArithmetic(expr, rowIdx, rows, columns, findColumnIndex);
}

// ─────────────────────────────────────────────────────────────
//  HOOK
// ─────────────────────────────────────────────────────────────

export function useFormulas(rows: SheetRow[], columns: ColumnDef[]) {
  const [formulas, setFormulas] = useState<Record<string, string>>({});
  const [columnFormulas, setColumnFormulas] = useState<Record<string, string>>({});

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

  /**
   * findColumnIndex — never matches A1-style tokens.
   * "B3" → -1 (it's an A1 ref, not a column name)
   * "income" → finds the column with key or name "income"
   */
  const findColumnIndex = useCallback((nameOrKey: string): number => {
    if (isA1Token(nameOrKey)) return -1;
    const lower = nameOrKey.toLowerCase().trim();
    return columnsRef.current.findIndex(
      c => c.key.toLowerCase() === lower || c.name.toLowerCase() === lower
    );
  }, []);

  // hot-formula-parser — only used for range syntax like SUM(A1:A10)
  const parser = useMemo(() => {
    const p = new Parser();
    p.on("callCellValue", (cellCoord: any, done: any) => {
      const rIdx = cellCoord.row.index, cIdx = cellCoord.column.index;
      const colDef = columnsRef.current[cIdx];
      if (!colDef || rIdx < 0 || rIdx >= rowsRef.current.length) { done(""); return; }
      const val = rowsRef.current[rIdx][colDef.key];
      const num = Number(val);
      done(!isNaN(num) && val !== "" && val !== null && val !== undefined ? num : (val ?? ""));
    });
    p.on("callRangeValue", (startCoord: any, endCoord: any, done: any) => {
      const fragment: any[][] = [];
      for (let r = startCoord.row.index; r <= endCoord.row.index; r++) {
        const rowData: any[] = [];
        for (let c = startCoord.column.index; c <= endCoord.column.index; c++) {
          const colDef = columnsRef.current[c];
          if (!colDef || r < 0 || r >= rowsRef.current.length) { rowData.push(""); continue; }
          const val = rowsRef.current[r][colDef.key];
          const num = Number(val);
          rowData.push(!isNaN(num) && val !== "" && val !== null && val !== undefined ? num : (val ?? ""));
        }
        fragment.push(rowData);
      }
      done(fragment);
    });
    p.on("callVariable", (_: string, done: any) => done("#NAME?"));
    return p;
  }, []);

  const evaluateFormula = useCallback(
    (formula: string, currentRowIdx: number): any => {
      if (!formula || !String(formula).startsWith("=")) return formula;
      const expr = formula.slice(1).trim();

      // Delegate A1-range syntax (SUM(A1:A10)) to hot-formula-parser
      if (/[A-Z]+\d+\s*:/i.test(expr)) {
        const { error, result } = parser.parse(expr);
        if (!error) return result;
      }

      return parseAndEval(
        expr, currentRowIdx,
        rowsRef.current, columnsRef.current,
        formulasRef.current, columnFormulasRef.current,
        evaluatingRef.current, findColumnIndex
      );
    },
    [parser, findColumnIndex]
  );

  const getFormula = useCallback(
    (rowIdx: number, colKey: string): string | undefined =>
      formulas[`${rowIdx}-${colKey}`] ?? columnFormulas[colKey],
    [formulas, columnFormulas]
  );

  return { formulas, setFormulas, columnFormulas, setColumnFormulas, evaluateFormula, getFormula };
}