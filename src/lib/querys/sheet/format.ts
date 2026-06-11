// lib/supabase/sheets/formats.ts
import { supabase } from "../../supabase/client";
import type { CellFormat } from "@/types";

export async function saveCellFormat(
  sheetId: string,
  cellKey: string,
  format: CellFormat,
) {
  const { error } = await supabase.from("cell_formats").upsert(
    {
      sheet_id: sheetId,
      cell_key: cellKey,
      bold: format.bold ?? false,
      italic: format.italic ?? false,
      underline: format.underline ?? false,
      strikethrough: format.strikethrough ?? false,
      font_size: format.fontSize ?? 12,
      font_family: format.fontFamily ?? "Arial",
      text_color: format.textColor ?? "#000000",
      bg_color: format.bgColor ?? "#ffffff",
      text_align: format.align ?? "left",
      text_wrap: format.textWrap ?? false,
      border_style: format.borderStyle ?? "none",
      border_color: format.borderColor ?? "#d1d5db",
      border_width: format.borderWidth ?? 1,
      merge: format.merge ?? null,
    },
    { onConflict: "sheet_id,cell_key" },
  );

  if (error) throw new Error(`Failed to save cell format: ${error.message}`);
}

export async function saveAllCellFormats(
  sheetId: string,
  formats: Record<string, CellFormat>,
) {
  const entries = Object.entries(formats);
  const deleteResult = await supabase
    .from("cell_formats")
    .delete()
    .eq("sheet_id", sheetId);
  if (deleteResult.error)
    throw new Error(`Failed to replace cell formats: ${deleteResult.error.message}`);
  if (entries.length === 0) return;

  const rows = entries.map(([cellKey, format]) => ({
    sheet_id: sheetId,
    cell_key: cellKey,
    bold: format.bold ?? false,
    italic: format.italic ?? false,
    underline: format.underline ?? false,
    strikethrough: format.strikethrough ?? false,
    font_size: format.fontSize ?? 12,
    font_family: format.fontFamily ?? "Arial",
    text_color: format.textColor ?? "#000000",
    bg_color: format.bgColor ?? "#ffffff",
    text_align: format.align ?? "left",
    text_wrap: format.textWrap ?? false,
    border_style: format.borderStyle ?? "none",
    border_color: format.borderColor ?? "#d1d5db",
    border_width: format.borderWidth ?? 1,
    merge: format.merge ?? null,
  }));

  const { error } = await supabase
    .from("cell_formats")
    .upsert(rows, { onConflict: "sheet_id,cell_key" });

  if (error)
    throw new Error(`Failed to save imported formats: ${error.message}`);
}

