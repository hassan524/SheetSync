"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Columns3,
  ListChecks,
  Plus,
  Trash2,
  GripVertical,
  ChevronRight,
  Eye,
  EyeOff,
  RefreshCw,
} from "lucide-react";
import type { ColumnDef, SelectOption, SheetRow } from "@/types";
import {
  columnIndexToName,
  getOptionBgStyle,
  getSelectOptionLabel,
} from "@/utils/SheetUtils";

// ── Types ──────────────────────────────────────────────────────────────────

type ColumnDraft = {
  key: string;
  name: string;
  type: NonNullable<ColumnDef["type"]>;
  width?: number;
  selectOptions?: SelectOption[];
  hidden?: boolean;
  isNew?: boolean;
};

const TYPE_OPTIONS: NonNullable<ColumnDef["type"]>[] = [
  "text",
  "number",
  "currency",
  "date",
  "checkbox",
  "status",
  "priority",
  "select",
  "url",
  "progress",
  "percent",
  "image",
];

const TYPE_LABELS: Record<string, string> = {
  text: "Text",
  number: "Number",
  currency: "Currency",
  date: "Date",
  checkbox: "Checkbox",
  status: "Status",
  priority: "Priority",
  select: "Select",
  url: "URL",
  progress: "Progress",
  percent: "Percent",
  image: "Image",
};

const TYPE_COLORS: Record<string, string> = {
  text: "bg-slate-100 text-slate-600",
  number: "bg-blue-50 text-blue-600",
  currency: "bg-emerald-50 text-emerald-600",
  date: "bg-violet-50 text-violet-600",
  checkbox: "bg-orange-50 text-orange-600",
  status: "bg-amber-50 text-amber-600",
  priority: "bg-red-50 text-red-600",
  select: "bg-indigo-50 text-indigo-600",
  url: "bg-cyan-50 text-cyan-600",
  progress: "bg-teal-50 text-teal-600",
  percent: "bg-lime-50 text-lime-600",
  image: "bg-pink-50 text-pink-600",
};

const TYPE_COLORS_DARK: Record<string, string> = {
  text: "bg-slate-800 text-slate-300",
  number: "bg-blue-900/40 text-blue-300",
  currency: "bg-emerald-900/40 text-emerald-300",
  date: "bg-violet-900/40 text-violet-300",
  checkbox: "bg-orange-900/40 text-orange-300",
  status: "bg-amber-900/40 text-amber-300",
  priority: "bg-red-900/40 text-red-300",
  select: "bg-indigo-900/40 text-indigo-300",
  url: "bg-cyan-900/40 text-cyan-300",
  progress: "bg-teal-900/40 text-teal-300",
  percent: "bg-lime-900/40 text-lime-300",
  image: "bg-pink-900/40 text-pink-300",
};

// ── Helpers ────────────────────────────────────────────────────────────────

function makeDraft(col: ColumnDef): ColumnDraft {
  return {
    key: col.key,
    name: col.name || col.key,
    type: col.type ?? "text",
    width: col.width,
    selectOptions: col.selectOptions ?? [],
    hidden: col.hidden ?? false,
  };
}

// ── Component ──────────────────────────────────────────────────────────────

export default function ColumnsPanel({
  isDark,
  columns,
  rows,
  onApply,
  onBulkUpdate,
  focusedColumnKey,
}: {
  isDark: boolean;
  columns: ColumnDef[];
  rows: SheetRow[];
  onApply: (columns: ColumnDef[]) => void;
  onBulkUpdate?: (
    columnKey: string,
    range: { start: number; end: number } | "all",
    value: string,
  ) => void;
  focusedColumnKey?: string | null;
}) {
  const [drafts, setDrafts] = useState<ColumnDraft[]>([]);
  const [activeColumnKey, setActiveColumnKey] = useState<string | null>(
    focusedColumnKey ?? null,
  );
  const [expandedSelectKey, setExpandedSelectKey] = useState<string | null>(
    null,
  );
  const [newOptionLabel, setNewOptionLabel] = useState("");
  const [newOptionColor, setNewOptionColor] = useState("#dbeafe");

  // Bulk-update state — stored as strings so inputs stay controlled
  const [bulkFromRow, setBulkFromRow] = useState("1");
  const [bulkToRow, setBulkToRow] = useState("");
  const [bulkValue, setBulkValue] = useState("");

  const listRef = useRef<HTMLDivElement>(null);

  // ── Sync drafts when columns prop changes ──────────────────────────────
  useEffect(() => {
    setDrafts(columns.map(makeDraft));
  }, [columns]);

  // ── Sync focused column ────────────────────────────────────────────────
  useEffect(() => {
    if (!focusedColumnKey) return;
    setActiveColumnKey(focusedColumnKey);
    const col = columns.find((c) => c.key === focusedColumnKey);
    if (col?.type === "select") setExpandedSelectKey(focusedColumnKey);
  }, [columns, focusedColumnKey]);

  // ── Derived values ─────────────────────────────────────────────────────
  const activeColumn =
    drafts.find((d) => d.key === activeColumnKey) ?? drafts[0] ?? null;

  const totalRows = rows.length;

  // Parse inputs: clamp to valid range, no negatives
  const fromParsed = parseInt(bulkFromRow, 10);
  const toParsed = bulkToRow.trim() === "" ? totalRows : parseInt(bulkToRow, 10);

  const fromRow = Number.isFinite(fromParsed) ? Math.max(1, fromParsed) : 1;
  const toRow = Number.isFinite(toParsed) ? Math.max(fromRow, Math.min(toParsed, totalRows)) : totalRows;

  const isAllRows = fromRow === 1 && toRow === totalRows;

  const previewRows =
    activeColumn
      ? rows
          .map((row, idx) => ({ idx, value: row[activeColumn.key] }))
          .slice(fromRow - 1, toRow)
      : [];

  // ── Draft mutators ─────────────────────────────────────────────────────
  const updateDraft = (key: string, patch: Partial<ColumnDraft>) => {
    setDrafts((prev) =>
      prev.map((d) => (d.key === key ? { ...d, ...patch } : d)),
    );
  };

  const updateDraftType = (key: string, type: ColumnDraft["type"]) => {
    updateDraft(key, { type });
    if (type === "select") setExpandedSelectKey(key);
    else if (expandedSelectKey === key) setExpandedSelectKey(null);
  };

  const updateSelectOption = (
    key: string,
    idx: number,
    patch: Partial<{ label: string; bgColor: string }>,
  ) => {
    setDrafts((prev) =>
      prev.map((d) => {
        if (d.key !== key) return d;
        const opts = (d.selectOptions ?? []).map((opt, i) => {
          if (i !== idx) return opt;
          const norm =
            typeof opt === "string"
              ? { label: opt, bgColor: getOptionBgStyle(opt).backgroundColor }
              : opt;
          return { ...norm, ...patch };
        });
        return { ...d, selectOptions: opts };
      }),
    );
  };

  const addSelectOption = (key: string) => {
    const label = newOptionLabel.trim();
    if (!label) return;
    updateDraft(key, {
      selectOptions: [
        ...(drafts.find((d) => d.key === key)?.selectOptions ?? []),
        { label, bgColor: newOptionColor },
      ],
    });
    setNewOptionLabel("");
    setNewOptionColor("#dbeafe");
  };

  const removeSelectOption = (key: string, idx: number) => {
    setDrafts((prev) =>
      prev.map((d) => {
        if (d.key !== key) return d;
        const opts = (d.selectOptions ?? []).filter((_, i) => i !== idx);
        return { ...d, selectOptions: opts };
      }),
    );
  };

  const addColumn = () => {
    const key = `col_custom_${Date.now()}`;
    const newDraft: ColumnDraft = {
      key,
      name: "",
      type: "text",
      width: 160,
      selectOptions: [],
      isNew: true,
    };
    setDrafts((prev) => [...prev, newDraft]);
    setActiveColumnKey(key);
    setTimeout(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    }, 50);
  };

  const removeDraft = (key: string) => {
    setDrafts((prev) => {
      const next = prev.filter((d) => d.key !== key);
      if (activeColumnKey === key) setActiveColumnKey(next[0]?.key ?? null);
      return next;
    });
  };

  const handleApply = () => {
    const nextColumns = drafts
      .filter((d) => d.name.trim())
      .map((d, index) => {
        const existing = columns.find((c) => c.key === d.key);
        return {
          ...(existing ?? {}),
          key: d.key,
          name: d.name.trim(),
          type: d.type,
          width: d.width ?? existing?.width ?? 160,
          editable: true,
          position: index,
          hidden: d.hidden ?? false,
          ...(d.type === "select" ? { selectOptions: d.selectOptions ?? [] } : {}),
        } as ColumnDef;
      });
    onApply(nextColumns);
  };

  const handleBulkUpdate = () => {
    if (!activeColumn || !onBulkUpdate) return;
    const range =
      isAllRows
        ? ("all" as const)
        : { start: fromRow - 1, end: toRow - 1 };
    onBulkUpdate(activeColumn.key, range, bulkValue);
    // Reset bulk update form after saving
    setBulkFromRow("1");
    setBulkToRow("");
    setBulkValue("");
  };

  // ── Styles helpers ─────────────────────────────────────────────────────
  const d = isDark;
  const base = d ? "bg-gray-950 text-gray-100" : "bg-white text-gray-900";
  const border = d ? "border-gray-800" : "border-gray-200";
  const subtle = d ? "text-gray-400" : "text-gray-500";
  const inputCls = `h-8 text-xs ${d ? "bg-gray-900/30 border-gray-700 text-gray-100 placeholder:text-gray-600" : ""}`;
  const selectCls = `h-8 w-full rounded-md border px-2 text-xs outline-none transition-colors ${
    d ? "border-gray-700 bg-gray-900 text-gray-200" : "border-gray-200 bg-white text-gray-800"
  }`;
  const sectionCls = `rounded-lg border ${d ? "border-gray-800 bg-gray-900/50" : "border-gray-100 bg-gray-50/60"}`;

  // Solid background for sticky footers
  const footerBg = d ? "bg-gray-950" : "bg-white";

  return (
    <div className={`h-full flex flex-col overflow-hidden ${base}`}>

      {/* ── TOP: Column list ──────────────────────────────────────────── */}
      <div className="flex flex-col min-h-0 flex-[0_0_auto]" style={{ maxHeight: "42%" }}>
        {/* <div className={`flex items-center justify-between px-3 py-2 border-b shrink-0 ${border} ${footerBg}`}>
          <div className="flex items-center gap-1.5">
            <Columns3 className="h-3.5 w-3.5 text-blue-500 shrink-0" />
          </div>
          <button
            type="button"
            onClick={addColumn}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
              d
                ? "bg-blue-500/15 text-blue-400 hover:bg-blue-500/25"
                : "bg-blue-50 text-blue-600 hover:bg-blue-100"
            }`}
          >
            <Plus className="h-3 w-3" />
            Add
          </button>
        </div> */}

        <div
          ref={listRef}
          className="overflow-y-auto px-2 py-2 space-y-1"
        >
          {drafts.map((draft, index) => {
            const isActive = draft.key === activeColumnKey;
            const typeBadge = d
              ? (TYPE_COLORS_DARK[draft.type] ?? "bg-gray-800 text-gray-300")
              : (TYPE_COLORS[draft.type] ?? "bg-gray-100 text-gray-600");

            return (
              <div
                key={draft.key}
                onClick={() => setActiveColumnKey(draft.key)}
                className={`group flex items-center gap-2 rounded-lg px-2.5 py-2 cursor-pointer transition-all ${
                  isActive
                    ? d
                      ? "bg-blue-500/15 ring-1 ring-blue-500/40"
                      : "bg-blue-50 ring-1 ring-blue-200"
                    : d
                    ? "hover:bg-gray-800/70"
                    : "hover:bg-gray-50"
                }`}
              >
                {/* Grip */}
                <GripVertical
                  className={`h-3.5 w-3.5 shrink-0 opacity-0 group-hover:opacity-60 transition-opacity cursor-move ${subtle}`}
                />

                {/* Index badge */}
                <span
                  className={`h-5 w-5 rounded text-[10px] font-bold flex items-center justify-center shrink-0 ${
                    isActive
                      ? "bg-blue-500 text-white"
                      : d
                      ? "bg-gray-800 text-gray-400"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {columnIndexToName(index)}
                </span>

                {/* Name */}
                <span className={`flex-1 text-xs truncate font-medium ${d ? "text-gray-200" : "text-gray-800"}`}>
                  {draft.name || <span className={`italic ${subtle}`}>Untitled</span>}
                </span>

                {/* Type badge */}
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md shrink-0 ${typeBadge}`}>
                  {TYPE_LABELS[draft.type] ?? draft.type}
                </span>

                {/* Hidden indicator */}
                {draft.hidden && (
                  <EyeOff className={`h-3 w-3 shrink-0 ${subtle}`} />
                )}

                {/* Chevron */}
                <ChevronRight
                  className={`h-3.5 w-3.5 shrink-0 transition-transform ${
                    isActive ? "rotate-90 text-blue-500" : subtle
                  }`}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* ── DIVIDER ───────────────────────────────────────────────────── */}
      <div className={`border-t ${border} shrink-0`} />

      {/* ── BOTTOM: Edit selected column ─────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 min-h-0">
        {activeColumn ? (
          <>
            {/* Column title */}
            <div className="flex items-center gap-2">
              <h3 className={`text-sm font-semibold truncate ${d ? "text-gray-100" : "text-gray-900"}`}>
                {activeColumn.name || "Untitled"}
              </h3>
            </div>

            {/* Name + type */}
            <div className={`${sectionCls} p-3 space-y-2.5`}>
              <div>
                <label className={`text-[10px] font-semibold uppercase tracking-wide block mb-1.5 ${subtle}`}>
                  Column name
                </label>
                <Input
                  value={activeColumn.name}
                  onChange={(e) => updateDraft(activeColumn.key, { name: e.target.value })}
                  placeholder="Column name"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={`text-[10px] font-semibold uppercase tracking-wide block mb-1.5 ${subtle}`}>
                  Type
                </label>
                <select
                  value={activeColumn.type}
                  onChange={(e) => updateDraftType(activeColumn.key, e.target.value as ColumnDraft["type"])}
                  className={selectCls}
                >
                  {TYPE_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Visibility toggle */}
              <div className="flex items-center justify-between">
                <label className={`text-[10px] font-semibold uppercase tracking-wide ${subtle}`}>
                  Visibility
                </label>
                <button
                  type="button"
                  onClick={() => updateDraft(activeColumn.key, { hidden: !activeColumn.hidden })}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                    activeColumn.hidden
                      ? d
                        ? "bg-red-900/30 text-red-400"
                        : "bg-red-50 text-red-500"
                      : d
                      ? "bg-emerald-900/30 text-emerald-400"
                      : "bg-emerald-50 text-emerald-600"
                  }`}
                >
                  {activeColumn.hidden ? (
                    <><EyeOff className="h-3 w-3" /> Hidden</>
                  ) : (
                    <><Eye className="h-3 w-3" /> Visible</>
                  )}
                </button>
              </div>

              {/* Delete */}
              <button
                type="button"
                disabled={drafts.length <= 1}
                onClick={() => removeDraft(activeColumn.key)}
                className={`w-full flex items-center justify-center gap-1.5 h-7 rounded-md text-[11px] font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                  d
                    ? "bg-red-900/20 text-red-400 hover:bg-red-900/40"
                    : "bg-red-50 text-red-500 hover:bg-red-100"
                }`}
              >
                <Trash2 className="h-3 w-3" />
                Remove column
              </button>
            </div>

            {/* Select options (if type = select) */}
            {activeColumn.type === "select" && (
              <div className={`${sectionCls} p-3 space-y-2.5`}>
                <div className="flex items-center justify-between">
                  <label className={`text-[10px] font-semibold uppercase tracking-wide ${subtle}`}>
                    Select options
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedSelectKey((k) =>
                        k === activeColumn.key ? null : activeColumn.key,
                      )
                    }
                    className={`flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded transition-colors ${
                      d ? "text-blue-400 hover:bg-blue-900/30" : "text-blue-600 hover:bg-blue-50"
                    }`}
                  >
                    <ListChecks className="h-3 w-3" />
                    {expandedSelectKey === activeColumn.key ? "Collapse" : `${activeColumn.selectOptions?.length ?? 0} options`}
                  </button>
                </div>

                {expandedSelectKey === activeColumn.key && (
                  <>
                    <div className="space-y-1.5">
                      {(activeColumn.selectOptions ?? []).map((opt, oi) => {
                        const label = getSelectOptionLabel(opt);
                        const norm =
                          typeof opt === "string"
                            ? { label, bgColor: getOptionBgStyle(opt).backgroundColor }
                            : opt;
                        return (
                          <div
                            key={`${activeColumn.key}-opt-${oi}`}
                            className={`flex items-center gap-2 p-1.5 rounded-lg ${d ? "bg-gray-800/60" : "bg-white border border-gray-100"}`}
                          >
                            <span
                              className="h-5 w-5 rounded-md shrink-0 border border-black/10"
                              style={{ backgroundColor: norm.bgColor }}
                            />
                            <Input
                              value={label}
                              onChange={(e) =>
                                updateSelectOption(activeColumn.key, oi, { label: e.target.value })
                              }
                              className={`flex-1 h-7 text-xs border-0 bg-transparent px-1 focus-visible:ring-0 ${d ? "text-gray-200" : "text-gray-800"}`}
                            />
                            <input
                              type="color"
                              value={norm.bgColor}
                              onChange={(e) =>
                                updateSelectOption(activeColumn.key, oi, { bgColor: e.target.value })
                              }
                              className="h-7 w-8 rounded border border-gray-200 cursor-pointer shrink-0 p-0"
                            />
                            <button
                              type="button"
                              onClick={() => removeSelectOption(activeColumn.key, oi)}
                              className={`h-7 w-7 flex items-center justify-center rounded transition-colors shrink-0 ${
                                d ? "text-red-400 hover:bg-red-900/30" : "text-red-400 hover:bg-red-50"
                              }`}
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    {/* Add new option */}
                    <div className={`flex items-center gap-2 p-1.5 rounded-lg border-dashed border ${d ? "border-gray-700 bg-gray-800/30" : "border-gray-200 bg-gray-50"}`}>
                      <Input
                        value={newOptionLabel}
                        onChange={(e) => setNewOptionLabel(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") { e.preventDefault(); addSelectOption(activeColumn.key); }
                        }}
                        placeholder="New option…"
                        className={`flex-1 h-7 text-xs border-0 bg-transparent px-1 focus-visible:ring-0 ${d ? "text-gray-200 placeholder:text-gray-600" : ""}`}
                      />
                      <input
                        type="color"
                        value={newOptionColor}
                        onChange={(e) => setNewOptionColor(e.target.value)}
                        className="h-7 w-8 rounded border border-gray-200 cursor-pointer shrink-0 p-0"
                      />
                      <button
                        type="button"
                        disabled={!newOptionLabel.trim()}
                        onClick={() => addSelectOption(activeColumn.key)}
                        className={`h-7 w-7 flex items-center justify-center rounded transition-colors shrink-0 disabled:opacity-40 ${
                          d ? "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30" : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                        }`}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── Bulk update ──────────────────────────────────────────── */}
            <div className={`${sectionCls} p-3 space-y-3`}>
              <div className="flex items-center gap-1.5">
                <RefreshCw className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                <span className={`text-[10px] font-semibold uppercase tracking-wide ${subtle}`}>
                  Bulk update values
                </span>
              </div>

              {/* Row range */}
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className={`text-[10px] font-medium ${subtle}`}>
                    Row range
                  </span>
                  <span className={`text-[10px] ${subtle}`}>
                    (total: {totalRows})
                  </span>
                  {isAllRows && (
                    <span className={`ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded ${
                      d ? "bg-amber-900/30 text-amber-400" : "bg-amber-50 text-amber-600"
                    }`}>
                      All rows
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-[1fr_16px_1fr] items-center gap-1">
                  <Input
                    type="number"
                    min={1}
                    max={totalRows}
                    value={bulkFromRow}
                    onChange={(e) => {
                      // No negatives, no zero
                      const raw = e.target.value.replace(/[^0-9]/g, "");
                      setBulkFromRow(raw === "" ? "" : String(Math.max(1, parseInt(raw, 10))));
                    }}
                    placeholder="1"
                    className={inputCls}
                  />
                  <span className={`text-center text-xs ${subtle}`}>–</span>
                  <Input
                    type="number"
                    min={1}
                    max={totalRows}
                    value={bulkToRow}
                    onChange={(e) => {
                      // No negatives
                      const raw = e.target.value.replace(/[^0-9]/g, "");
                      setBulkToRow(raw === "" ? "" : String(Math.max(1, parseInt(raw, 10))));
                    }}
                    placeholder={String(totalRows)}
                    className={inputCls}
                  />
                </div>
                <p className={`mt-1 text-[10px] ${subtle}`}>
                  Leave "to" blank to go till the last row.{" "}
                  {!isAllRows && `Affecting rows ${fromRow}–${toRow}.`}
                </p>
              </div>

              {/* Value input */}
              <div>
                <label className={`text-[10px] font-medium block mb-1.5 ${subtle}`}>
                  New value to set
                </label>
                <Input
                  value={bulkValue}
                  onChange={(e) => setBulkValue(e.target.value)}
                  placeholder='e.g. "Done", "0", empty to clear'
                  className={inputCls}
                />
              </div>

              {/* Preview */}
              {previewRows.length > 0 && (
                <div>
                  <span className={`text-[10px] font-medium block mb-1.5 ${subtle}`}>
                    Preview ({previewRows.length} row{previewRows.length !== 1 ? "s" : ""})
                  </span>
                  <div
                    className={`rounded-md border overflow-hidden ${d ? "border-gray-700" : "border-gray-200"}`}
                  >
                    <div
                      className={`max-h-32 overflow-y-auto divide-y text-[11px] ${
                        d ? "divide-gray-800" : "divide-gray-100"
                      }`}
                    >
                      {previewRows.map(({ idx, value }) => (
                        <div
                          key={`${activeColumn.key}-prev-${idx}`}
                          className={`grid grid-cols-[36px_1fr] gap-2 px-2.5 py-1.5 ${
                            d ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          <span className={`tabular-nums ${subtle}`}>{idx + 1}</span>
                          <span className="truncate">
                            {bulkValue
                              ? (
                                <span className={d ? "text-amber-400" : "text-amber-600"}>
                                  → {bulkValue || <em className={subtle}>empty</em>}
                                </span>
                              )
                              : (String(value ?? "") || <em className={subtle}>empty</em>)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <Button
                type="button"
                size="sm"
                variant="outline"
                className={`w-full gap-1.5 text-xs ${
                  d
                    ? "border-amber-700/50 text-amber-400 hover:bg-amber-900/20"
                    : "border-amber-300 text-amber-700 hover:bg-amber-50"
                }`}
                disabled={!onBulkUpdate || !activeColumn}
                onClick={handleBulkUpdate}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                {isAllRows
                  ? `Update all ${totalRows} rows`
                  : `Update rows ${fromRow}–${toRow}`}
              </Button>
            </div>
          </>
        ) : (
          <div className={`flex flex-col items-center justify-center py-10 text-center ${subtle}`}>
            <Columns3 className="h-8 w-8 mb-2 opacity-30" />
            <p className="text-xs">Select a column above to edit it</p>
          </div>
        )}
      </div>

      {/* ── STICKY FOOTER: Apply — solid background so it never bleeds ── */}
      {/* Sticky footer: show only when bulk-update is NOT available to avoid duplicate update buttons */}
      {!onBulkUpdate && (
        <div className={`px-3 py-2.5 border-t shrink-0 ${border} ${footerBg}`}>
          <Button
            type="button"
            size="sm"
            className="w-full gap-1.5 text-xs"
            onClick={handleApply}
            disabled={!drafts.some((d) => d.name.trim())}
          >
            Apply column changes
          </Button>
        </div>
      )}
    </div>
  );
}