// lib/supabase/sheets/rows.ts
import { supabase } from "../../supabase/client";
import type { SheetRow } from "@/types/sheet.types";

// Save a single row (upsert = insert or update)
export async function saveRow(
  sheetId: string,
  row: SheetRow,
  position: number,
) {
  const { id, ...data } = row;

  await supabase.from("rows").upsert(
    {
      sheet_id: sheetId,
      row_key: id,
      position,
      data,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "sheet_id,row_key" },
  );
}

// Save multiple rows at once (when adding/deleting rows)
export async function saveAllRows(sheetId: string, rows: SheetRow[]) {
  const rowsToUpsert = rows.map((row, idx) => {
    const { id, ...data } = row;
    return {
      sheet_id: sheetId,
      row_key: id,
      position: idx,
      data,
      updated_at: new Date().toISOString(),
    };
  });

  await supabase
    .from("rows")
    .upsert(rowsToUpsert, { onConflict: "sheet_id,row_key" });
}

// Delete a row
export async function deleteRows(sheetId: string, rowKeys: string[]) {
  await supabase
    .from("rows")
    .delete()
    .eq("sheet_id", sheetId)
    .in("row_key", rowKeys);
}
