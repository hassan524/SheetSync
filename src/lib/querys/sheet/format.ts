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
    },
    { onConflict: "sheet_id,cell_key" },
  );

  if (error) throw new Error(`Failed to save cell format: ${error.message}`);
}
