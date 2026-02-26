// lib/supabase/sheets/formats.ts
import { supabase } from "../../supabase/client";
import type { CellFormat } from "@/types/sheet.types";

export async function saveCellFormat(
  sheetId: string,
  cellKey: string,
  format: CellFormat,
) {
  await supabase.from("cell_formats").upsert(
    {
      sheet_id: sheetId,
      cell_key: cellKey,
      bold: format.bold ?? false,
      italic: format.italic ?? false,
      underline: format.underline ?? false,
      strikethrough: format.strikethrough ?? false,
      font_size: format.fontSize ?? 12,
      text_color: format.textColor ?? "#000000",
      bg_color: format.bgColor ?? "#ffffff",
      text_align: format.align ?? "left",
    },
    { onConflict: "sheet_id,cell_key" },
  );
}
