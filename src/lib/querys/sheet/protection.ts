// lib/supabase/sheets/protection.ts
import { supabase } from "../../supabase/client";

export async function protectCell(sheetId: string, cellKey: string) {
  const { error } = await supabase.from("protected_cells").upsert(
    {
      sheet_id: sheetId,
      cell_key: cellKey,
    },
    { onConflict: "sheet_id,cell_key" },
  );

  if (error) throw new Error(`Failed to protect cell: ${error.message}`);
}

export async function unprotectCell(sheetId: string, cellKey: string) {
  const { error } = await supabase
    .from("protected_cells")
    .delete()
    .eq("sheet_id", sheetId)
    .eq("cell_key", cellKey);

  if (error) throw new Error(`Failed to unprotect cell: ${error.message}`);
}
