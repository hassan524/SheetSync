// lib/supabase/sheets/sheets.ts
import { supabase } from "../../supabase/client";

export async function loadSheet(sheetId: string) {
  // Get Single Sheet Data
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

  return {
    id: sheet.data.id,
    title: sheet.data.title,
    isStarred: sheet.data.is_starred,
    // Transform columns
    columns:
      columns.data?.map((col) => ({
        key: col.column_key,
        name: col.name,
        type: col.type,
        width: col.width,
        position: col.position,
      })) ?? [],
    // Transform rows - JSONB data spread into row object
    rows:
      rows.data?.map((row) => ({
        id: row.row_key,
        ...row.data, // { col_1: "value", col_2: 100 }
      })) ?? [],
    // Transform formats into Record<cellKey, format>
    cellFormats: Object.fromEntries(
      (formats.data ?? []).map((f) => [
        f.cell_key,
        {
          bold: f.bold,
          italic: f.italic,
          underline: f.underline,
          strikethrough: f.strikethrough,
          fontSize: f.font_size,
          textColor: f.text_color,
          bgColor: f.bg_color,
          align: f.text_align,
        },
      ]),
    ),
    // Transform formulas into Record<cellKey, formula>
    formulas: Object.fromEntries(
      (formulas.data ?? []).map((f) => [f.cell_key, f.formula]),
    ),
    // Transform to Set of cell keys
    protectedCells: new Set((protectedCells.data ?? []).map((p) => p.cell_key)),
    // Text wrap columns from column data
    textWrapColumns: new Set(
      (columns.data ?? [])
        .filter((col) => col.text_wrap_enabled)
        .map((col) => col.column_key),
    ),
  };
}

export async function updateSheetTitle(sheetId: string, title: string) {
  await supabase
    .from("sheets")
    .update({ title, updated_at: new Date().toISOString() })
    .eq("id", sheetId);
}

export async function updateSheetStarred(sheetId: string, isStarred: boolean) {
  await supabase
    .from("sheets")
    .update({ is_starred: isStarred })
    .eq("id", sheetId);
}
