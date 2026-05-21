
import { supabase as defaultSupabase } from "../../supabase/client";
import type { ColumnDef } from "@/types";

export async function saveAllColumns(sheetId: string, columns: ColumnDef[], client = defaultSupabase) {
  const { error: deleteError } = await client
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
    select_options:
      col.selectOptions && col.selectOptions.length > 0
        ? JSON.stringify(col.selectOptions)
        : null,
    currency_code: col.currencyCode ?? "USD",
    conditional_formatting: col.conditional_formatting ?? null,
  }));

  const { error: insertError } = await client
    .from("columns")
    .insert(columnsToInsert);

  if (insertError)
    throw new Error(`Failed to save columns: ${insertError.message}`);
}

export async function deleteColumn(sheetId: string, columnKey: string) {
  const { error } = await defaultSupabase
    .from("columns")
    .delete()
    .eq("sheet_id", sheetId)
    .eq("column_key", columnKey);

  if (error) throw new Error(`Failed to delete column: ${error.message}`);
}

