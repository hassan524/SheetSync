// lib/supabase/sheets/sheets.ts
import { supabase } from "../../supabase/client";

export async function loadSheet(sheetId: string) {
  const [sheet, columns, rows, formats, formulas, protectedCells] =
    await Promise.all([
      supabase.from("sheets").select("*").eq("id", sheetId).single(),
      supabase
        .from("columns")
        .select("*")
        .eq("sheet_id", sheetId)
        .order("position"),
      supabase
        .from("rows")
        .select("*")
        .eq("sheet_id", sheetId)
        .order("position"),
      supabase.from("cell_formats").select("*").eq("sheet_id", sheetId),
      supabase.from("formulas").select("*").eq("sheet_id", sheetId),
      supabase.from("protected_cells").select("*").eq("sheet_id", sheetId),
    ]);

  // Surface any load errors immediately so they're not swallowed
  if (sheet.error)
    throw new Error(`Failed to load sheet: ${sheet.error.message}`);
  if (columns.error)
    throw new Error(`Failed to load columns: ${columns.error.message}`);
  if (rows.error) throw new Error(`Failed to load rows: ${rows.error.message}`);

  return {
    id: sheet.data.id,
    title: sheet.data.title,
    isStarred: sheet.data.is_starred,
    isPersonal: sheet.data.is_personal,
    ownerId: sheet.data.owner_id,
    size: sheet.data.size_mb,
    created_at: sheet.data.created_at,
    updated_at: sheet.data.updated_at,

    columns:
      columns.data?.map((col) => ({
        key: col.column_key,
        name: col.name,
        type: col.type,
        width: col.width,
        position: col.position,
      })) ?? [],

    rows:
      rows.data?.map((row) => ({
        id: row.row_key,
        ...row.data,
      })) ?? [],

    // FIX: now includes fontFamily which was missing before
    cellFormats: Object.fromEntries(
      (formats.data ?? []).map((f) => [
        f.cell_key,
        {
          bold: f.bold ?? false,
          italic: f.italic ?? false,
          underline: f.underline ?? false,
          strikethrough: f.strikethrough ?? false,
          fontSize: f.font_size ?? 12,
          fontFamily: f.font_family ?? "Arial", // ← was missing
          textColor: f.text_color ?? "#000000",
          bgColor: f.bg_color ?? "#ffffff",
          align: f.text_align ?? "left",
          textWrap: f.text_wrap,
        },
      ]),
    ),

    formulas: Object.fromEntries(
      (formulas.data ?? [])
        .filter((f) => !f.cell_key.startsWith("col:"))
        .map((f) => [f.cell_key, f.formula]),
    ),

    columnFormulas: Object.fromEntries(
      (formulas.data ?? [])
        .filter((f) => f.cell_key.startsWith("col:"))
        .map((f) => [f.cell_key.replace("col:", ""), f.formula]),
    ),

    protectedCells: new Set((protectedCells.data ?? []).map((p) => p.cell_key)),

    textWrapColumns: new Set(
      (columns.data ?? [])
        .filter((col) => col.text_wrap_enabled)
        .map((col) => col.column_key),
    ),
  };
}

export async function updateSheetTitle(sheetId: string, title: string) {
  const { error } = await supabase
    .from("sheets")
    .update({ title, updated_at: new Date().toISOString() })
    .eq("id", sheetId);
  if (error) throw new Error(`Failed to update title: ${error.message}`);
}

export async function updateSheetStarred(sheetId: string, isStarred: boolean) {
  const { error } = await supabase
    .from("sheets")
    .update({ is_starred: isStarred, updated_at: new Date().toISOString() })
    .eq("id", sheetId);
  if (error) throw new Error(`Failed to update starred: ${error.message}`);
}
