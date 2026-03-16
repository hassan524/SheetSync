"use client";

import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ── Types ──────────────────────────────────────────────────────────
export interface DataTableColumn<T> {
  key: string;
  header: string;
  width?: string;        // e.g. "120px", "1fr" — leave undefined to auto-fill
  render: (row: T) => ReactNode;
}

export interface DataTableAction<T> {
  render: (row: T) => ReactNode; 
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  getKey: (row: T) => string;
  action?: DataTableAction<T>;
  emptyText?: string;
}

// ── Component ──────────────────────────────────────────────────────
export function DataTable<T>({
  columns,
  rows,
  getKey,
  action,
  emptyText = "No data yet.",
}: DataTableProps<T>) {
  if (!rows.length) {
    return (
      <div className="border rounded-xl p-10 text-center text-sm text-muted-foreground">
        {emptyText}
      </div>
    );
  }

  return (
    // Outer wrapper clips border-radius; inner div enables horizontal scroll on mobile
    <div className="border rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse" style={{ minWidth: "600px" }}>
          <colgroup>
            {columns.map((col) => (
              <col key={col.key} style={{ width: col.width ?? "auto" }} />
            ))}
            {action && <col style={{ width: "36px" }} />}
          </colgroup>

          {/* Header */}
          <thead>
            <tr className="border-b bg-muted/20">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap"
                >
                  {col.header}
                </th>
              ))}
              {action && <th className="px-4 py-2.5" />}
            </tr>
          </thead>

          {/* Rows */}
          <tbody className="divide-y">
            {rows.map((row) => (
              <tr
                key={getKey(row)}
                className="transition-all duration-150 hover:bg-muted/10 hover:scale-[1.002] hover:shadow-sm cursor-pointer"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className="px-4 py-3 align-middle text-sm"
                  >
                    {col.render(row)}
                  </td>
                ))}
                {action && (
                  <td className="px-4 py-3 align-middle">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground/30 hover:text-muted-foreground"
                        >
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        {action.render(row)}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}