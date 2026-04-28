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
  width?: string;
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
  emptyDescription?: string;
  emptyIcon?: ReactNode;
  onRowClick?: (row: T) => void;
}

// ── Empty SVG ──────────────────────────────────────────────────────
function DefaultEmptyIcon() {
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="8" width="52" height="56" rx="7" fill="currentColor" className="text-muted/30" />
      <rect x="10" y="8" width="52" height="56" rx="7" stroke="currentColor" strokeWidth="1.5" className="text-border" />
      <rect x="10" y="8" width="52" height="14" rx="7" fill="currentColor" className="text-muted/50" />
      <rect x="10" y="15" width="52" height="7" fill="currentColor" className="text-muted/50" />
      <line x1="30" y1="8" x2="30" y2="64" stroke="currentColor" strokeWidth="1" className="text-border/60" />
      <line x1="50" y1="8" x2="50" y2="64" stroke="currentColor" strokeWidth="1" className="text-border/60" />
      <line x1="10" y1="36" x2="62" y2="36" stroke="currentColor" strokeWidth="1" className="text-border/60" />
      <line x1="10" y1="50" x2="62" y2="50" stroke="currentColor" strokeWidth="1" className="text-border/60" />
      <rect x="14" y="28" width="12" height="2.5" rx="1.25" fill="currentColor" className="text-muted-foreground/25" />
      <rect x="34" y="28" width="8" height="2.5" rx="1.25" fill="currentColor" className="text-muted-foreground/20" />
      <rect x="14" y="42" width="10" height="2.5" rx="1.25" fill="currentColor" className="text-muted-foreground/15" />
      <rect x="34" y="42" width="12" height="2.5" rx="1.25" fill="currentColor" className="text-muted-foreground/10" />
      <circle cx="54" cy="54" r="11" fill="hsl(var(--background))" />
      <circle cx="54" cy="54" r="11" stroke="currentColor" strokeWidth="1.5" className="text-border" />
      <line x1="50" y1="54" x2="58" y2="54" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="text-muted-foreground/60" />
      <line x1="54" y1="50" x2="54" y2="58" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="text-muted-foreground/60" />
    </svg>
  );
}

// ── Component ──────────────────────────────────────────────────────
export function DataTable<T>({
  columns,
  rows,
  getKey,
  action,
  emptyText = "Nothing here yet",
  emptyDescription = "Data will appear here once added.",
  emptyIcon,
  onRowClick
}: DataTableProps<T>) {

  // ── Empty state ────────────────────────────────────────────────
  if (!rows.length) {
    return (
      <div
        className="border rounded-xl overflow-hidden flex flex-col items-center justify-center gap-5 p-10 text-center"
        style={{ minHeight: "65vh" }}
      >
        <div className="text-muted-foreground/60">
          {emptyIcon ?? <DefaultEmptyIcon />}
        </div>
        <div className="space-y-1.5">
          <p className="text-sm font-semibold text-foreground">{emptyText}</p>
          <p className="text-xs text-muted-foreground max-w-[220px] leading-relaxed mx-auto">
            {emptyDescription}
          </p>
        </div>
      </div>
    );
  }

  // ── Data table ─────────────────────────────────────────────────
  return (
    <div
      className="border rounded-xl overflow-hidden flex flex-col"
      style={{ minHeight: "65vh", maxHeight: "65vh" }}
    >
      <div className="overflow-x-auto overflow-y-auto flex-1">
        <table className="w-full border-collapse" style={{ minWidth: "600px" }}>
          <colgroup>
            {columns.map((col) => (
              <col key={col.key} style={{ width: col.width ?? "auto" }} />
            ))}
            {action && <col style={{ width: "36px" }} />}
          </colgroup>

          {/* Header */}
          <thead className="sticky top-0 z-10">
            <tr className="border-b bg-muted/30 backdrop-blur-sm">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap"
                >
                  {col.header}
                </th>
              ))}
              {action && <th className="px-4 py-3" />}
            </tr>
          </thead>

          {/* Rows */}
          <tbody className="divide-y">
            {rows.map((row) => (
              <tr
                key={getKey(row)}
                className="transition-colors duration-150 hover:bg-muted/10 cursor-pointer"
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3.5 align-middle text-sm">
                    {col.render(row)}
                  </td>
                ))}
                {action && (
                  <td className="px-4 py-3.5 align-middle">
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