/**
 * ============================================================
 *  lib/querys/sheet/snapshots.ts
 *
 *  CRUD helpers for the sheet_snapshots table (Supabase).
 *  A snapshot captures the full row + column state of a sheet
 *  at a specific moment — used by the Time-Travel feature.
 * ============================================================
 */

import { supabase } from "@/lib/supabase/client";
import type { SheetRow, ColumnDef } from "@/types/index";

// ─────────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────────

export interface SheetSnapshot {
  id: string;
  sheet_id: string;
  label: string;
  created_by: string | null;
  creator_name?: string | null;
  created_at: string;
  rows_data: SheetRow[];
  columns_data: ColumnDef[];
}

// ─────────────────────────────────────────────
//  READ
// ─────────────────────────────────────────────

/** Fetch all snapshots for a sheet, newest first. */
export async function getSnapshots(sheetId: string): Promise<SheetSnapshot[]> {
  const { data, error } = await supabase
    .from("sheet_snapshots")
    .select("*")
    .eq("sheet_id", sheetId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[snapshots] getSnapshots error:", error.message);
    return [];
  }
  return (data ?? []) as SheetSnapshot[];
}

// ─────────────────────────────────────────────
//  CREATE
// ─────────────────────────────────────────────

interface CreateSnapshotArgs {
  sheetId: string;
  label: string;
  createdBy?: string;
  rows: SheetRow[];
  columns: ColumnDef[];
}

export async function createSnapshot({
  sheetId,
  label,
  createdBy,
  rows,
  columns,
}: CreateSnapshotArgs): Promise<SheetSnapshot | null> {
  const { data, error } = await supabase
    .from("sheet_snapshots")
    .insert({
      sheet_id: sheetId,
      label,
      created_by: createdBy ?? null,
      rows_data: rows,
      columns_data: columns,
    })
    .select("*")
    .single();

  if (error) {
    console.error("[snapshots] createSnapshot error:", error.message);
    return null;
  }
  return data as SheetSnapshot;
}

// ─────────────────────────────────────────────
//  UPDATE
// ─────────────────────────────────────────────

export async function updateSnapshotLabel(
  id: string,
  label: string,
): Promise<void> {
  const { error } = await supabase
    .from("sheet_snapshots")
    .update({ label })
    .eq("id", id);

  if (error)
    console.error("[snapshots] updateSnapshotLabel error:", error.message);
}

// ─────────────────────────────────────────────
//  DELETE
// ─────────────────────────────────────────────

export async function deleteSnapshot(id: string): Promise<void> {
  const { error } = await supabase
    .from("sheet_snapshots")
    .delete()
    .eq("id", id);

  if (error) console.error("[snapshots] deleteSnapshot error:", error.message);
}

// ─────────────────────────────────────────────
//  AUTO-SNAPSHOT (throttled)
// ─────────────────────────────────────────────

const AUTO_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
let lastAutoSnapshot = 0;

/**
 * Auto-save a snapshot at most once every 5 minutes.
 * Call this on every significant edit — it will no-op
 * if the interval hasn't elapsed.
 */
export async function maybeAutoSnapshot(
  sheetId: string,
  rows: SheetRow[],
  columns: ColumnDef[],
  userId?: string,
): Promise<void> {
  const now = Date.now();
  if (now - lastAutoSnapshot < AUTO_INTERVAL_MS) return;
  lastAutoSnapshot = now;

  await createSnapshot({
    sheetId,
    label: `Auto-save — ${new Date().toLocaleTimeString()}`,
    createdBy: userId,
    rows,
    columns,
  });
}

