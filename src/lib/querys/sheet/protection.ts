// lib/supabase/sheets/protection.ts
import { supabase } from "../../supabase/client";

export async function protectCell(sheetId: string, cellKey: string) {
  await supabase.from("protected_cells").upsert(
    {
      sheet_id: sheetId,
      cell_key: cellKey,
    },
    { onConflict: "sheet_id,cell_key" },
  );
}

export async function unprotectCell(sheetId: string, cellKey: string) {
  await supabase
    .from("protected_cells")
    .delete()
    .eq("sheet_id", sheetId)
    .eq("cell_key", cellKey);
}
