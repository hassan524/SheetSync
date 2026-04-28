// lib/supabase/sheets/formulas.ts
import { supabase } from "../../supabase/client";

// ─────────────────────────────────────────────
//  PER-CELL FORMULAS  (cell_key = "rowIdx-colKey")
// ─────────────────────────────────────────────

export async function saveFormula(
  sheetId: string,
  cellKey: string,
  formula: string,
) {
  const { error } = await supabase.from("formulas").upsert(
    {
      sheet_id: sheetId,
      cell_key: cellKey,
      formula,
    },
    { onConflict: "sheet_id,cell_key" },
  );

  if (error) throw new Error(`Failed to save formula: ${error.message}`);
}

export async function deleteFormula(sheetId: string, cellKey: string) {
  const { error } = await supabase
    .from("formulas")
    .delete()
    .eq("sheet_id", sheetId)
    .eq("cell_key", cellKey);

  if (error) throw new Error(`Failed to delete formula: ${error.message}`);
}

// ─────────────────────────────────────────────
//  COLUMN FORMULAS  (cell_key = "col:colKey")
//  Stored in the SAME `formulas` table with a
//  "col:" prefix so no schema change is needed.
// ─────────────────────────────────────────────

export async function saveColumnFormula(
  sheetId: string,
  columnKey: string,
  formula: string,
) {
  const cellKey = `col:${columnKey}`;
  const { error } = await supabase.from("formulas").upsert(
    {
      sheet_id: sheetId,
      cell_key: cellKey,
      formula,
    },
    { onConflict: "sheet_id,cell_key" },
  );

  if (error)
    throw new Error(`Failed to save column formula: ${error.message}`);
}

export async function deleteColumnFormula(
  sheetId: string,
  columnKey: string,
) {
  const cellKey = `col:${columnKey}`;
  const { error } = await supabase
    .from("formulas")
    .delete()
    .eq("sheet_id", sheetId)
    .eq("cell_key", cellKey);

  if (error)
    throw new Error(`Failed to delete column formula: ${error.message}`);
}
