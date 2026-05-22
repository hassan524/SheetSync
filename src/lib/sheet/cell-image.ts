/** Max file size before encoding to data URL for in-cell images (~450 KB). */
export const MAX_CELL_EMBEDDED_IMAGE_BYTES = 450_000;

export function isEmbeddedImageCellValue(v: unknown): v is string {
  return typeof v === "string" && v.startsWith("data:image/");
}

