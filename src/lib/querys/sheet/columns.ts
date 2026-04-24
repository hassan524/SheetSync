// lib/supabase/sheets/columns.ts
import { supabase } from "../../supabase/client";
import type { ColumnDef } from "@/types";

export async function saveAllColumns(sheetId: string, columns: ColumnDef[]) {
  // FIX: The unique(sheet_id, position) constraint causes upsert to fail when
  // columns are reordered because two columns temporarily share a position.
  // Solution: delete all existing columns for this sheet then reinsert.
  // This is safe because column data lives in rows.data (JSONB), not here.
  const { error: deleteError } = await supabase
    .from("columns")
    .delete()
    .eq("sheet_id", sheetId);

  if (deleteError)
    throw new Error(`Failed to clear columns: ${deleteError.message}`);

  if (columns.length === 0) return;

  const columnsToInsert = columns.map((col, idx) => ({
    sheet_id: sheetId,
    column_key: col.key,
    name: col.name,
    type: col.type ?? "text",
    width: col.width ?? 150,
    position: idx,
    // text_wrap_enabled: textWrapColumns.has(col.key),
  }));

  const { error: insertError } = await supabase
    .from("columns")
    .insert(columnsToInsert);

  if (insertError)
    throw new Error(`Failed to save columns: ${insertError.message}`);
}

export async function deleteColumn(sheetId: string, columnKey: string) {
  const { error } = await supabase
    .from("columns")
    .delete()
    .eq("sheet_id", sheetId)
    .eq("column_key", columnKey);

  if (error) throw new Error(`Failed to delete column: ${error.message}`);
}
