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

const CHUNK = 500;
const POSITION_OFFSET = 1_000_000;

export async function saveAllRows(
  sheetId: string,
  rows: SheetRow[],
  client = defaultSupabase
) {
  if (rows.length === 0) {
    await client.from("rows").delete().eq("sheet_id", sheetId);
    return;
  }

  const lastUsed = getLastUsedRowIndex(rows);
  const effectiveRows = lastUsed >= 0 ? rows.slice(0, lastUsed + 1) : [];

  if (effectiveRows.length === 0) {
    await client.from("rows").delete().eq("sheet_id", sheetId);
    return;
  }

  const now = new Date().toISOString();

  // Phase 1: write all rows with position + OFFSET so no two rows
  // collide with each other's current (pre-update) positions mid-batch.
  const phase1 = effectiveRows.map((row, idx) => {
    const { id, ...data } = row;
    return {
      sheet_id: sheetId,
      row_key: id,
      position: idx + POSITION_OFFSET,
      data,
      updated_at: now,
    };
  });

  for (let i = 0; i < phase1.length; i += CHUNK) {
    const { error } = await client
      .from("rows")
      .upsert(phase1.slice(i, i + CHUNK), { onConflict: "sheet_id,row_key" });
    if (error) throw new Error(`Failed to save rows (phase 1): ${error.message}`);
  }

  // Phase 2: write the real positions now that no conflicts exist.
  const phase2 = effectiveRows.map((row, idx) => {
    const { id, ...data } = row;
    return {
      sheet_id: sheetId,
      row_key: id,
      position: idx,
      data,
      updated_at: now,
    };
  });

  for (let i = 0; i < phase2.length; i += CHUNK) {
    const { error } = await client
      .from("rows")
      .upsert(phase2.slice(i, i + CHUNK), { onConflict: "sheet_id,row_key" });
    if (error) throw new Error(`Failed to save rows (phase 2): ${error.message}`);
  }

  // Delete rows no longer in the effective set.
  const activeKeys = new Set(effectiveRows.map((r) => r.id));
  const { data: existingRows } = await client
    .from("rows")
    .select("row_key")
    .eq("sheet_id", sheetId);
  if (existingRows) {
    const toDelete = existingRows
      .map((r) => r.row_key)
      .filter((k) => !activeKeys.has(k));
    if (toDelete.length > 0) {
      await client
        .from("rows")
        .delete()
        .eq("sheet_id", sheetId)
        .in("row_key", toDelete);
    }
  }
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