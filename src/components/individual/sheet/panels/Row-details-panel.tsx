"use client";

import type { ColumnDef, SheetRow } from "@/types";
import type { HistoryEntry, SheetComment } from "@/lib/querys/sheet/firebase-realtime";

interface RowDetailsPanelProps {
  isDark: boolean;
  row: SheetRow | null;
  rowIndex: number | null;
  columns: ColumnDef[];
  comments: SheetComment[];
  history: HistoryEntry[];
}

export default function RowDetailsPanel({
  isDark,
  row,
  rowIndex,
  columns,
  comments,
  history,
}: RowDetailsPanelProps) {
  if (!row || rowIndex === null) {
    return (
      <div className="h-full flex items-center justify-center px-6 text-center text-xs text-muted-foreground">
        Select a row to inspect its data, comments, and activity.
      </div>
    );
  }

  const rowNumber = rowIndex + 1;
  const rowHistory = history.filter((entry) =>
    String(entry.detail ?? "").includes(`row ${rowNumber}`) ||
    /\b[A-Z]+(\d+)\b/.test(entry.detail ?? "") &&
      (entry.detail ?? "").match(/\b[A-Z]+(\d+)\b/)?.[1] === String(rowNumber),
  );

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      <div>
        <div className={`text-sm font-semibold ${isDark ? "text-gray-100" : "text-gray-900"}`}>
          Row {rowNumber}
        </div>
        <div className="text-[11px] text-muted-foreground font-mono">{row.id}</div>
      </div>

      <section className="space-y-2">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Data
        </div>
        <div className="space-y-1.5">
          {columns.filter((column) => !column.hidden).map((column) => (
            <div
              key={column.key}
              className={`rounded-md border px-2.5 py-2 ${
                isDark ? "border-gray-800 bg-gray-900/50" : "border-border bg-background"
              }`}
            >
              <div className="text-[10px] text-muted-foreground truncate">{column.name}</div>
              <div className="text-xs break-words">
                {String(row[column.key] ?? "") || <span className="text-muted-foreground">Empty</span>}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Comments
        </div>
        {comments.length === 0 ? (
          <div className="text-xs text-muted-foreground">No row comments.</div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="rounded-md border border-border p-2.5">
              <div className="text-[11px] font-semibold">{comment.author}</div>
              <div className="text-xs mt-1">{comment.text}</div>
            </div>
          ))
        )}
      </section>

      <section className="space-y-2">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Activity
        </div>
        {rowHistory.length === 0 ? (
          <div className="text-xs text-muted-foreground">No activity found for this row.</div>
        ) : (
          rowHistory.slice(0, 20).map((entry) => (
            <div key={entry.id} className="rounded-md border border-border p-2.5">
              <div className="text-xs">{entry.detail}</div>
              <div className="text-[10px] text-muted-foreground mt-1">{entry.createdAt}</div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
