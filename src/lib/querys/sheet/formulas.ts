// lib/supabase/sheets/formulas.ts
import { supabase } from "../../supabase/client";

export async function saveFormula(
  sheetId: string,
  cellKey: string,
  formula: string,
) {
  await supabase.from("formulas").upsert(
    {
      sheet_id: sheetId,
      cell_key: cellKey,
      formula,
    },
    { onConflict: "sheet_id,cell_key" },
  );
}

export async function deleteFormula(sheetId: string, cellKey: string) {
  await supabase
    .from("formulas")
    .delete()
    .eq("sheet_id", sheetId)
    .eq("cell_key", cellKey);
}
