"use client";

import { useEffect, useState } from "react";
import type { ColumnDef, SheetRow } from "@/types";
import type { HistoryEntry, SheetComment } from "@/lib/querys/sheet/firebase-realtime";

interface RowDetailsPanelProps {
  isDark: boolean;
  row: SheetRow | null;
  rowIndex: number | null;
  columns: ColumnDef[];
  comments: SheetComment[];
  history: HistoryEntry[];
  onUpdateRow?: (rowId: string, updates: Record<string, any>) => void;
}

export default function RowDetailsPanel({
  isDark,
  row,
  rowIndex,
  columns,
  comments,
  history,
  onUpdateRow,
}: RowDetailsPanelProps) {
  if (!row || rowIndex === null) {
    return (
      <div className="h-full flex items-center justify-center px-6 text-center text-xs text-muted-foreground">
        Select a row to inspect its data, comments, and activity.
      </div>
    );
  }

  const rowNumber = rowIndex + 1;
  const rowData = row as Record<string, any>;
  const status = rowData.status ?? "active";
  const pinned = rowData.pinned ?? false;
  const [editingStatus, setEditingStatus] = useState(status);
  const [editingPinned, setEditingPinned] = useState(pinned);

  useEffect(() => {
    setEditingStatus(status);
    setEditingPinned(pinned);
  }, [status, pinned]);

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
        <div className="flex flex-wrap gap-2 mt-2">
          <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-700">
            {status}
          </span>
          <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] text-slate-700">
            {pinned ? "Pinned" : "Not pinned"}
          </span>
        </div>
        <div className="text-[11px] text-muted-foreground font-mono mt-2">{row.id}</div>
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
        <div className="flex items-center justify-between">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Row settings
          </div>
          <button
            type="button"
            disabled={!onUpdateRow}
            className="rounded-md border px-3 py-1 text-[11px] font-semibold transition hover:border-slate-400 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
            onClick={() => onUpdateRow?.(row.id, { status: editingStatus, pinned: editingPinned })}
          >
            Save
          </button>
        </div>

        <div className="space-y-3 rounded-md border px-3.5 py-3 text-sm shadow-sm">
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Status
            </label>
            <select
              value={editingStatus}
              onChange={(event) => setEditingStatus(event.target.value)}
              className="mt-2 w-full rounded-md border p-2 text-sm"
            >
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          <div>
            <label className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Pin row</span>
              <input
                type="checkbox"
                checked={editingPinned}
                onChange={(event) => setEditingPinned(event.target.checked)}
                className="h-4 w-4 rounded border border-border bg-background"
              />
            </label>
          </div>
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
