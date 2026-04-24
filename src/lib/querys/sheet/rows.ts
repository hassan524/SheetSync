// lib/supabase/sheets/rows.ts
import { supabase } from "../../supabase/client";
import type { SheetRow } from "@/types";

export async function saveRow(
  sheetId: string,
  row: SheetRow,
  position: number,
) {
  const { id, ...data } = row;

  const { error } = await supabase.from("rows").upsert(
    {
      sheet_id: sheetId,
      row_key: id,
      position,
      data,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "sheet_id,row_key" },
  );

  if (error) throw new Error(`Failed to save row: ${error.message}`);
}

export async function saveAllRows(sheetId: string, rows: SheetRow[]) {
  // FIX: Same position-conflict issue as columns. Delete + reinsert is the
  // safest approach when row order can change (sort, delete, paste reorder).
  const { error: deleteError } = await supabase
    .from("rows")
    .delete()
    .eq("sheet_id", sheetId);

  if (deleteError)
    throw new Error(`Failed to clear rows: ${deleteError.message}`);

  if (rows.length === 0) return;

  const rowsToInsert = rows.map((row, idx) => {
    const { id, ...data } = row;
    return {
      sheet_id: sheetId,
      row_key: id,
      position: idx,
      data,
      updated_at: new Date().toISOString(),
    };
  });

  const { error: insertError } = await supabase
    .from("rows")
    .insert(rowsToInsert);

  if (insertError)
    throw new Error(`Failed to save rows: ${insertError.message}`);
}

export async function deleteRows(sheetId: string, rowKeys: string[]) {
  if (rowKeys.length === 0) return;

  const { error } = await supabase
    .from("rows")
    .delete()
    .eq("sheet_id", sheetId)
    .in("row_key", rowKeys);

  if (error) throw new Error(`Failed to delete rows: ${error.message}`);
}
