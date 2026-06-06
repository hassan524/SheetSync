"use client";

import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

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
  className?: string;
}

// ── Empty SVG ──────────────────────────────────────────────────────
function DefaultEmptyIcon() {
  return (
    <svg
      width="72"
      height="72"
      viewBox="0 0 72 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="10"
        y="8"
        width="52"
        height="56"
        rx="7"
        fill="currentColor"
        className="text-muted/30"
      />
      <rect
        x="10"
        y="8"
        width="52"
        height="56"
        rx="7"
        stroke="currentColor"
        strokeWidth="1.5"
        className="text-border"
      />
      <rect
        x="10"
        y="8"
        width="52"
        height="14"
        rx="7"
        fill="currentColor"
        className="text-muted/50"
      />
      <rect
        x="10"
        y="15"
        width="52"
        height="7"
        fill="currentColor"
        className="text-muted/50"
      />
      <line
        x1="30"
        y1="8"
        x2="30"
        y2="64"
        stroke="currentColor"
        strokeWidth="1"
        className="text-border/60"
      />
      <line
        x1="50"
        y1="8"
        x2="50"
        y2="64"
        stroke="currentColor"
        strokeWidth="1"
        className="text-border/60"
      />
      <line
        x1="10"
        y1="36"
        x2="62"
        y2="36"
        stroke="currentColor"
        strokeWidth="1"
        className="text-border/60"
      />
      <line
        x1="10"
        y1="50"
        x2="62"
        y2="50"
        stroke="currentColor"
        strokeWidth="1"
        className="text-border/60"
      />
      <rect
        x="14"
        y="28"
        width="12"
        height="2.5"
        rx="1.25"
        fill="currentColor"
        className="text-muted-foreground/25"
      />
      <rect
        x="34"
        y="28"
        width="8"
        height="2.5"
        rx="1.25"
        fill="currentColor"
        className="text-muted-foreground/20"
      />
      <rect
        x="14"
        y="42"
        width="10"
        height="2.5"
        rx="1.25"
        fill="currentColor"
        className="text-muted-foreground/15"
      />
      <rect
        x="34"
        y="42"
        width="12"
        height="2.5"
        rx="1.25"
        fill="currentColor"
        className="text-muted-foreground/10"
      />
      <circle cx="54" cy="54" r="11" fill="hsl(var(--background))" />
      <circle
        cx="54"
        cy="54"
        r="11"
        stroke="currentColor"
        strokeWidth="1.5"
        className="text-border"
      />
      <line
        x1="50"
        y1="54"
        x2="58"
        y2="54"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        className="text-muted-foreground/60"
      />
      <line
        x1="54"
        y1="50"
        x2="54"
        y2="58"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        className="text-muted-foreground/60"
      />
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
  onRowClick,
  className,
}: DataTableProps<T>) {
  // ── Empty state ────────────────────────────────────────────────
  if (!rows.length) {
    return (
      <div
        className={cn(
          "border rounded-xl overflow-hidden flex flex-col items-center justify-center gap-5 p-10 text-center bg-card/30",
          className,
        )}
        style={{ minHeight: "min(400px, 65vh)" }}
      >
        <div className="text-muted-foreground/50 p-5 bg-muted/20 rounded-2xl">
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
      className={cn(
        "overflow-hidden flex flex-col bg-transparent",
        "h-[400px] md:h-[65vh]",
        className,
      )}
    >
      <div className="overflow-auto flex-1 styled-scrollbar">
        <table
          className="w-max min-w-full table-auto border-collapse"
        >
          <colgroup>
            {columns.map((col) => (
              <col key={col.key} style={{ width: col.width ?? "auto" }} />
            ))}
            {action && <col style={{ width: "44px" }} />}
          </colgroup>

          {/* Header */}
          <thead className="sticky top-0 z-10">
            <tr className="border-b bg-muted/40 backdrop-blur-sm">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-2.5 text-left text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap select-none"
                >
                  {col.header}
                </th>
              ))}
              {action && <th className="px-3 py-2.5" />}
            </tr>
          </thead>

          {/* Rows */}
          <tbody className="divide-y divide-border/60">
            {rows.map((row, idx) => (
              <tr
                key={getKey(row)}
                className={cn(
                  "group/row transition-colors duration-100",
                  onRowClick ? "cursor-pointer" : "",
                  idx % 2 === 1 ? "bg-muted/[0.025]" : "bg-background",
                  "hover:bg-primary/[0.03]",
                )}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className="px-4 py-3 align-middle text-sm whitespace-nowrap"
                  >
                    <div className="max-w-full overflow-hidden">
                      {col.render(row)}
                    </div>
                  </td>
                ))}
                {action && (
                  <td
                    className="px-2 py-3 align-middle"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-100 sm:opacity-0 sm:group-hover/row:opacity-100 focus:opacity-100 data-[state=open]:opacity-100 text-muted-foreground hover:text-foreground hover:bg-muted transition-opacity"
                        >
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
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

      {/* Footer */}
      <div className="border-t px-4 py-2 flex items-center justify-between bg-muted/20 shrink-0">
        <span className="text-[11px] text-muted-foreground">
          {rows.length} {rows.length === 1 ? "item" : "items"}
        </span>
      </div>
    </div>
  );
}

