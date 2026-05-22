// lib/supabase/sheets/protection.ts
import { supabase } from "../../supabase/client";

export async function protectCell(sheetId: string, cellKey: string) {
  return protectRow(sheetId, cellKey);
}

export async function unprotectCell(sheetId: string, cellKey: string) {
  return unprotectRow(sheetId, cellKey);
}

export async function protectRow(sheetId: string, rowKey: string) {
  const normalizedRowKey = rowKey.startsWith("row:") ? rowKey : `row:${rowKey}`;
  const { error } = await supabase.from("protected_rows").upsert(
    {
      sheet_id: sheetId,
      row_key: normalizedRowKey,
    },
    { onConflict: "sheet_id,row_key" },
  );

  if (error) throw new Error(`Failed to protect row: ${error.message}`);
}

export async function unprotectRow(sheetId: string, rowKey: string) {
  const normalizedRowKey = rowKey.startsWith("row:") ? rowKey : `row:${rowKey}`;
  const { error } = await supabase
    .from("protected_rows")
    .delete()
    .eq("sheet_id", sheetId)
    .eq("row_key", normalizedRowKey);

  if (error) throw new Error(`Failed to unprotect row: ${error.message}`);
}

