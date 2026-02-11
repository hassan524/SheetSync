// utils/columnTypes.ts (or wherever you want)

import type { ColumnDef } from "@tanstack/react-table";

export type ColumnWithExtras<T = any> = ColumnDef<T> & {
  accessorKey?: string;
  background?: string;
  icon?: string;
  icon2?: string;
};