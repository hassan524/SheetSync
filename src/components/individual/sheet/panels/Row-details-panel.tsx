"use client";

import { useEffect, useState } from "react";
import type { ElementType } from "react";
import type { ColumnDef, SheetRow } from "@/types";
import type { HistoryEntry, SheetComment } from "@/lib/querys/sheet/firebase-realtime";
import {
  getChoiceOptionStyle,
  getChoiceOptionsForColumn,
  getSelectOptionLabel,
} from "@/utils/SheetUtils";
import { Clock, MessageSquare, Settings2, Save } from "lucide-react";

interface RowDetailsPanelProps {
  isDark: boolean;
  row: SheetRow | null;
  rowIndex: number | null;
  columns: ColumnDef[];
  comments: SheetComment[];
  history: HistoryEntry[];
  onUpdateRow?: (rowId: string, updates: Record<string, any>) => void;
  isOrganizationSheet?: boolean;
}

function SectionHeader({ icon: Icon, label }: { icon: ElementType; label: string }) {
  return (
    <div className="flex items-center gap-1.5 mb-2.5">
      <Icon className="h-3 w-3 text-zinc-400" />
      <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
        {label}
      </span>
    </div>
  );
}

function Avatar({ name, color }: { name: string; color?: string }) {
  const initials =
    name
      ?.split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?";

  return (
    <div
      className="h-5 w-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white shrink-0"
      style={{ backgroundColor: color || "#6366f1" }}
    >
      {initials}
    </div>
  );
}

function timeAgo(dateStr: string) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;

  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;

  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function getFormattedDate(val: any): string {
  if (!val) return "";
  try {
    const date = new Date(val);
    if (!Number.isNaN(date.getTime())) return date.toISOString().split("T")[0];
  } catch {}
  return String(val ?? "");
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
  const [localValues, setLocalValues] = useState<Record<string, any>>({});
  const [isChanged, setIsChanged] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!row) return;
    setLocalValues({ ...row });
    setIsChanged(false);
  }, [row]);

  if (!row || rowIndex === null) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3 px-6 text-center">
        <div className="h-10 w-10 rounded-xl bg-zinc-100 flex items-center justify-center">
          <Settings2 className="h-4 w-4 text-zinc-400" />
        </div>
        <p className="text-xs text-zinc-400 leading-relaxed max-w-[160px]">
          Select a row to inspect its data and activity
        </p>
      </div>
    );
  }

  const rowNumber = rowIndex + 1;
  const rowHistory = history.filter((entry) => {
    if (entry.rowId && entry.rowId === row.id) return true;
    const detail = entry.detail ?? "";
    if (detail.includes(`row ${rowNumber}`)) return true;
    const match = detail.match(/\b[A-Z]+(\d+)\b/);
    return match?.[1] === String(rowNumber);
  });

  const visibleColumns = columns.filter((column) => !column.hidden);
  const base = isDark ? "bg-gray-950 text-gray-100" : "bg-white text-gray-900";
  const card = isDark ? "bg-gray-900 border-gray-800" : "bg-zinc-50 border-zinc-100";
  const muted = isDark ? "text-gray-400" : "text-zinc-400";
  const divider = isDark ? "border-gray-800" : "border-zinc-100";
  const inputCls = isDark
    ? "bg-gray-900 border-gray-800 text-gray-100 focus:border-indigo-500"
    : "bg-white border-zinc-200 text-zinc-800 focus:border-indigo-500";

  const handleChange = (key: string, value: any) => {
    setLocalValues((prev) => ({ ...prev, [key]: value }));
    setIsChanged(true);
  };

  const handleSave = async () => {
    if (!onUpdateRow || !row) return;
    setSaving(true);
    try {
      const updates: Record<string, any> = {};
      columns.forEach((column) => {
        if (localValues[column.key] !== row[column.key]) {
          updates[column.key] = localValues[column.key];
        }
      });
      if (Object.keys(updates).length > 0) await onUpdateRow(row.id, updates);
      setIsChanged(false);
    } finally {
      setSaving(false);
    }
  };

  const renderInput = (col: ColumnDef, val: any) => {
    const valStr = String(val ?? "");

    if (col.type === "checkbox") {
      const isChecked = val === true || valStr === "true" || valStr === "yes" || valStr === "1";
      return (
        <label className={`flex items-center gap-2 cursor-pointer py-1.5 px-2.5 rounded-md border ${card}`}>
          <input
            type="checkbox"
            checked={isChecked}
            onChange={(event) => handleChange(col.key, event.target.checked)}
            className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
          />
          <span className={`text-xs ${isDark ? "text-zinc-300" : "text-zinc-600"}`}>
            {isChecked ? "Checked" : "Unchecked"}
          </span>
        </label>
      );
    }

    const options = getChoiceOptionsForColumn(col);
    if (options.length > 0) {
      const optionLabels = options.map((option) => getSelectOptionLabel(option));
      const finalOptions =
        valStr && !optionLabels.some((option) => option.toLowerCase() === valStr.toLowerCase())
          ? [valStr, ...optionLabels]
          : optionLabels;
      const selectedOption =
        options.find((option) => getSelectOptionLabel(option).toLowerCase() === valStr.toLowerCase()) ??
        valStr;
      const selectedStyle = valStr ? getChoiceOptionStyle(col.type, selectedOption) : undefined;

      return (
        <select
          value={valStr}
          onChange={(event) => handleChange(col.key, event.target.value)}
          className={`w-full text-xs rounded-md border px-2.5 py-1.5 outline-none transition-colors ${inputCls}`}
          style={
            selectedStyle
              ? {
                  color: selectedStyle.color,
                  backgroundColor: "backgroundColor" in selectedStyle
                    ? selectedStyle.backgroundColor
                    : selectedStyle.bgColor,
                }
              : {}
          }
        >
          {finalOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    }

    if (col.type === "date") {
      return (
        <input
          type="date"
          value={getFormattedDate(val)}
          onChange={(event) => handleChange(col.key, event.target.value)}
          className={`w-full text-xs rounded-md border px-2.5 py-1.5 outline-none transition-colors ${inputCls}`}
        />
      );
    }

    if (col.type === "number" || col.type === "currency" || col.type === "percent" || col.type === "progress") {
      return (
        <input
          type="number"
          value={valStr}
          onChange={(event) => handleChange(col.key, event.target.value === "" ? "" : Number(event.target.value))}
          className={`w-full text-xs rounded-md border px-2.5 py-1.5 outline-none transition-colors tabular-nums ${inputCls}`}
          placeholder="0"
        />
      );
    }

    if (col.type === "url") {
      return (
        <input
          type="url"
          value={valStr}
          onChange={(event) => handleChange(col.key, event.target.value)}
          className={`w-full text-xs rounded-md border px-2.5 py-1.5 outline-none transition-colors ${inputCls}`}
          placeholder="https://..."
        />
      );
    }

    return (
      <input
        type="text"
        value={valStr}
        onChange={(event) => handleChange(col.key, event.target.value)}
        className={`w-full text-xs rounded-md border px-2.5 py-1.5 outline-none transition-colors ${inputCls}`}
        placeholder="Empty"
      />
    );
  };

  return (
    <div className={`h-full overflow-y-auto flex flex-col ${base}`}>
      <div className={`px-4 pt-4 pb-3 border-b ${divider} flex items-center justify-between`}>
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] font-semibold uppercase tracking-widest ${muted}`}>Row</span>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${isDark ? "text-gray-200 bg-gray-800" : "text-zinc-700 bg-zinc-100"}`}>
            #{rowNumber}
          </span>
        </div>
        <p className={`text-[9px] font-mono ${muted} max-w-[120px] truncate`}>{row.id}</p>
      </div>

      <div className="flex-1 px-4 py-4 space-y-5">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <SectionHeader icon={Settings2} label="Data" />
            {isChanged && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold rounded-md bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-sm disabled:opacity-50"
              >
                <Save className="h-3 w-3" />
                {saving ? "Saving..." : "Save"}
              </button>
            )}
          </div>
          <div className="space-y-2.5">
            {visibleColumns.map((col) => (
              <div key={col.key} className="space-y-1">
                <label className={`text-[10px] font-semibold uppercase tracking-wider ${muted}`}>
                  {col.name}
                  {col.type && col.type !== "text" && (
                    <span className={`ml-1.5 text-[8px] font-normal normal-case ${isDark ? "text-gray-500" : "text-zinc-300"}`}>
                      {col.type}
                    </span>
                  )}
                </label>
                {renderInput(col, localValues[col.key])}
              </div>
            ))}
          </div>
        </div>

        <div>
          <SectionHeader icon={MessageSquare} label={`Comments${comments.length ? ` - ${comments.length}` : ""}`} />
          {comments.length === 0 ? (
            <p className={`text-xs ${muted}`}>No comments on this row.</p>
          ) : (
            <div className="space-y-1.5">
              {comments.map((comment) => (
                <div key={comment.id} className={`rounded-lg border px-3 py-2 ${card}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Avatar name={comment.author} color={comment.authorColor} />
                    <span className={`text-xs font-medium ${isDark ? "text-gray-200" : "text-zinc-700"}`}>{comment.author}</span>
                    <span className={`ml-auto text-[9px] shrink-0 ${muted}`}>{timeAgo(comment.createdAt)}</span>
                  </div>
                  <p className={`text-xs leading-snug ${isDark ? "text-gray-300" : "text-zinc-600"}`}>{comment.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <SectionHeader icon={Clock} label={`Activity${rowHistory.length ? ` - ${rowHistory.length}` : ""}`} />
          {rowHistory.length === 0 ? (
            <p className={`text-xs ${muted}`}>No activity for this row.</p>
          ) : (
            <div className="space-y-1.5">
              {rowHistory.slice(0, 20).map((entry) => (
                <div key={entry.id} className={`rounded-lg border px-3 py-2 ${card}`}>
                  {entry.userName && (
                    <div className="flex items-center gap-1.5 mb-1">
                      <Avatar name={entry.userName} color={entry.userColor} />
                      <span className={`text-[11px] font-medium ${isDark ? "text-gray-300" : "text-zinc-600"}`}>{entry.userName}</span>
                    </div>
                  )}
                  <p className={`text-xs leading-snug ${isDark ? "text-gray-300" : "text-zinc-600"}`}>{entry.detail}</p>
                  <p className={`text-[9px] mt-1 ${muted}`}>{timeAgo(entry.createdAt)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
