# SheetSync Formula System

This document explains how formulas work in the SheetSync editor.

## Entry Points

- Formula state and evaluation live in `src/hooks/sheets/use-formulas.ts`.
- The formula bar is `src/components/individual/sheet/toolbars/FormulaBar.tsx`.
- Formula examples are shown by `src/components/individual/sheet/dialogs/Formula-dialog.tsx`.
- Formula persistence lives in `src/lib/querys/sheet/formulas.ts`.

## Storage

Formulas are stored separately from row values.

- Cell formulas use keys like `0-col_a`, where `0` is the row index and `col_a` is the column key.
- Column formulas use keys prefixed with `col:` in the database and are loaded into `columnFormulas`.
- A formula must start with `=`.
- If a cell stops starting with `=`, the stored formula is deleted and the raw cell value is saved.

## Evaluation Flow

When a cell renders:

1. `Sheet-client.tsx` asks `formulas.getFormula(rowIdx, colKey)`.
2. If the formula starts with `=`, `formulas.evaluateFormula(formula, rowIdx)` runs.
3. The returned value is displayed in the grid.
4. The original formula remains visible in the formula bar and edit input.

## Parser Strategy

SheetSync uses two formula paths:

- Standard Excel-like parser: `hot-formula-parser`.
- SheetSync fallback parser: custom functions that understand column names and current-row values.

The evaluator tries the standard parser first. If it cannot parse the formula, it falls back to SheetSync's custom parser.

## References

Formulas can reference data in these ways:

- `A1`: exact cell reference.
- `A1:A10`: range reference for parser-supported functions.
- `price`: current row value in the column whose key or name is `price`.
- `42`: number literal.
- `"hello"`: string literal.
- `TRUE` / `FALSE`: boolean literals.
- Nested formulas, for example `=IF(price > 10, UPPER(status), "low")`.

Examples:

```text
=B1*C1
=SUM(A1:A10)
=price * 1.1
=IF(price > 10, "High", "Low")
=IF(status = "Done", 1, 0)
=CONCAT(first_name, " ", last_name)
```

## Excel-Style Formulas

Standard formulas with normal spreadsheet references are handled by `hot-formula-parser` when supported by that library.

Examples:

```text
=IF(A1>10, "High", "Low")
=SUM(A1:A10)
=AVERAGE(B1:B20)
=MIN(C1:C10)
=MAX(C1:C10)
=COUNT(A1:A100)
```

## SheetSync Column-Name Formulas

The fallback parser supports formulas using column names or keys for current-row logic.

Examples:

```text
=IF(amount > 1000, "Large", "Small")
=IF(status = "Done", "Complete", "Open")
=ROUND(price * quantity, 2)
=UPPER(customer)
=SUBSTITUTE(company, "Inc", "LLC")
```

Excel comparison operators are normalized in fallback expressions:

- `=` becomes equality
- `<>` becomes not equal
- `>`, `>=`, `<`, and `<=` work as expected

## Built-In Custom Functions

The custom formula table is `FORMULA_IMPL` in `use-formulas.ts`.

It includes groups for:

- math and aggregates, such as `SUM`, `AVG`, `MIN`, `MAX`, `COUNT`, `COUNTIF`
- scalar math, such as `ADD`, `SUBTRACT`, `MULTIPLY`, `DIVIDE`, `ROUND`
- text, such as `UPPER`, `LOWER`, `TRIM`, `LEN`, `CONCAT`, `SUBSTITUTE`
- logic, such as `IF`, `IFERROR`, `SWITCH`, `AND`, `OR`, `NOT`
- lookup/list helpers, such as `VLOOKUP`, `MATCH`, `INDEX`, `UNIQUE`, `FILTERVALS`
- date/time helpers
- finance, analytics, and utility helpers

The formula dialog reads examples from `src/data/formulaRefrence.ts`.

## Column Formulas

A column formula is set from the column header menu.

- It applies to every row in that column.
- A cell-specific formula overrides the column formula for that cell.
- Removing the column formula deletes the column-level formula entry.

## Circular References

The evaluator tracks active cell keys in an `evaluating` set. If a referenced cell is already being evaluated, it avoids recursively evaluating the same key again. This prevents simple circular formula loops from crashing the UI.

## Current Limits

SheetSync aims for Excel-like behavior, but it is not a full Excel engine.

- It supports many Excel-style formulas through `hot-formula-parser`.
- It supports many SheetSync-specific column-name formulas through the fallback parser.
- It does not currently implement every Excel function, array formula behavior, spill ranges, workbook references, named ranges, or volatile recalculation semantics.
- Unsupported function names return an error such as `#NAME?`.
