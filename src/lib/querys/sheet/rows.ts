// lib/supabase/sheets/rows.ts
import { supabase as defaultSupabase } from "../../supabase/client";
import type { SheetRow } from "@/types";

function getLastUsedRowIndex(rows: SheetRow[]): number {
  for (let i = rows.length - 1; i >= 0; i--) {
    const row = rows[i];
    const hasContent = Object.entries(row).some(([key, value]) => {
      if (key === "id") return false;
      if (value === null || value === undefined) return false;
      if (typeof value === "string") return value.trim() !== "";
      if (typeof value === "number") return !Number.isNaN(value);
      if (typeof value === "boolean") return value;
      return true;
    });
    if (hasContent) return i;
  }
  return -1;
}

export async function saveRow(
  sheetId: string,
  row: SheetRow,
  position: number,
  client = defaultSupabase
) {
  const { id, ...data } = row;

  const { error } = await defaultSupabase.from("rows").upsert(
    {
      sheet_id: sheetId,
      row_key: id,
      position,
      data,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "sheet_id,row_key" }
  );

  if (error) throw new Error(`Failed to save row: ${error.message}`);
}

export async function saveAllRows(
  sheetId: string,
  rows: SheetRow[],
  client = defaultSupabase
) {
  const { error: deleteError } = await client
    .from("rows")
    .delete()
    .eq("sheet_id", sheetId);

  if (deleteError)
    throw new Error(`Failed to clear rows: ${deleteError.message}`);

  if (rows.length === 0) return;

  const lastUsed = getLastUsedRowIndex(rows);
  const effectiveRows = lastUsed >= 0 ? rows.slice(0, lastUsed + 1) : [];
  if (effectiveRows.length === 0) return;

  const rowsToInsert = effectiveRows.map((row, idx) => {
    const { id, ...data } = row;
    return {
      sheet_id: sheetId,
      row_key: id,
      position: idx,
      data,
      updated_at: new Date().toISOString(),
    };
  });

  const { error: insertError } = await client
    .from("rows")
    .insert(rowsToInsert);

  if (insertError)
    throw new Error(`Failed to save rows: ${insertError.message}`);
}

export async function deleteRows(
  sheetId: string,
  rowKeys: string[],
  client = defaultSupabase
) {
  if (rowKeys.length === 0) return;

  const { error } = await defaultSupabase
    .from("rows")
    .delete()
    .eq("sheet_id", sheetId)
    .in("row_key", rowKeys);

  if (error) throw new Error(`Failed to delete rows: ${error.message}`);
}

