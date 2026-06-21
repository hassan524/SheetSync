import { supabase as defaultSupabase } from "../../supabase/client";
import type { ColumnDef } from "@/types";

export async function saveAllColumns(sheetId: string, columns: ColumnDef[], client = defaultSupabase) {
  console.log(
    "save function running"
  )
  if (columns.length === 0) return;

  const columnsToUpsert = columns.map((col, idx) => ({
    sheet_id: sheetId,
    column_key: col.key,
    name: col.name,
    type: col.type ?? "text",
    width: Math.round(col.width ?? 150),
    position: idx,
    select_options:
      col.selectOptions && col.selectOptions.length > 0
        ? JSON.stringify(col.selectOptions)
        : null,
    currency_code: col.currencyCode ?? "USD",
    conditional_formatting: col.conditional_formatting
      ? JSON.stringify(col.conditional_formatting)
      : null,
  }));

  const { error } = await client
    .from("columns")
    .upsert(columnsToUpsert, { onConflict: "sheet_id,column_key" });

  if (error) {
    console.error("Upsert error:", JSON.stringify(error, null, 2));
    throw new Error(`Failed to save columns: ${error.message}`);
  }
}

export async function updateColumnType(
  sheetId: string,
  columnKey: string,
  newType: string
) {
  const { data, error } = await defaultSupabase
    .from("columns")
    .update({ type: newType })
    .eq("sheet_id", sheetId)
    .eq("column_key", columnKey)
    .select()
    .single();

  if (error) throw new Error(`Failed to update column type: ${error.message}`);
  return data;
}

export async function deleteColumn(sheetId: string, columnKey: string) {
  const { error } = await defaultSupabase
    .from("columns")
    .delete()
    .eq("sheet_id", sheetId)
    .eq("column_key", columnKey);

  if (error) throw new Error(`Failed to delete column: ${error.message}`);
}