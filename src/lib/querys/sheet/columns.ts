// lib/supabase/sheets/columns.ts
import { supabase } from "../../supabase/client";
import type { ColumnDef } from "@/types/sheet.types";

export async function saveAllColumns(
  sheetId: string,
  columns: ColumnDef[],
  textWrapColumns: Set<string>,
) {
  const columnsToUpsert = columns.map((col, idx) => ({
    sheet_id: sheetId,
    column_key: col.key,
    name: col.name,
    type: col.type,
    width: col.width ?? 150,
    position: idx,
    text_wrap_enabled: textWrapColumns.has(col.key),
  }));

  await supabase
    .from("columns")
    .upsert(columnsToUpsert, { onConflict: "sheet_id,column_key" });
}

export async function deleteColumn(sheetId: string, columnKey: string) {
  await supabase
    .from("columns")
    .delete()
    .eq("sheet_id", sheetId)
    .eq("column_key", columnKey);
}
