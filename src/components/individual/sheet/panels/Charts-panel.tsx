"use client";

import { useEffect, useState } from "react";
import {
  BarChart3, Plus, Trash2, Database, Palette, Settings2,
  Check, GripVertical, Sparkles,
} from "lucide-react";
import type { SheetChart, ChartKind, ColorScheme, ChartPanelTab } from "@/hooks/sheets/use-charts";
import {
  SCHEME_COLORS, SCHEME_LABELS, getLabelCols, getNumericCols,
  CATEGORICAL_KINDS, requiresNumericY, coerceChartNumber,
} from "@/hooks/sheets/use-charts";
import type { SheetRow, ColumnDef } from "@/types/index";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { ddStyle, ddItemStyle } from "@/components/individual/sheet/sheet-ui-helpers";

// ─────────────────────────────────────────────────────────────
//  CHART KIND OPTIONS
// ─────────────────────────────────────────────────────────────

const KIND_OPTIONS: { kind: ChartKind; label: string; svg: React.ReactNode }[] = [
  {
    kind: "column", label: "Column",
    svg: (
      <svg viewBox="0 0 28 22" fill="none" className="w-full h-full">
        <rect x="2" y="11" width="4" height="10" rx="1" fill="currentColor" opacity="0.9" />
        <rect x="8" y="5" width="4" height="16" rx="1" fill="currentColor" opacity="0.7" />
        <rect x="14" y="8" width="4" height="13" rx="1" fill="currentColor" opacity="0.5" />
        <rect x="20" y="2" width="4" height="19" rx="1" fill="currentColor" opacity="0.85" />
      </svg>
    ),
  },
  {
    kind: "bar", label: "Bar",
    svg: (
      <svg viewBox="0 0 28 22" fill="none" className="w-full h-full">
        <rect x="2" y="2" width="24" height="4" rx="1" fill="currentColor" opacity="0.9" />
        <rect x="2" y="9" width="18" height="4" rx="1" fill="currentColor" opacity="0.65" />
        <rect x="2" y="16" width="21" height="4" rx="1" fill="currentColor" opacity="0.4" />
      </svg>
    ),
  },
  {
    kind: "line", label: "Line",
    svg: (
      <svg viewBox="0 0 28 22" fill="none" className="w-full h-full">
        <polyline points="2,18 7,12 12,15 17,7 22,4 26,9" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="7" cy="12" r="1.8" fill="currentColor" />
        <circle cx="17" cy="7" r="1.8" fill="currentColor" />
        <circle cx="26" cy="9" r="1.8" fill="currentColor" />
      </svg>
    ),
  },
  {
    kind: "area", label: "Area",
    svg: (
      <svg viewBox="0 0 28 22" fill="none" className="w-full h-full">
        <path d="M2,20 L2,14 L7,10 L12,13 L17,6 L22,3 L26,7 L26,20 Z" fill="currentColor" opacity="0.2" />
        <polyline points="2,14 7,10 12,13 17,6 22,3 26,7" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    kind: "pie", label: "Pie",
    svg: (
      <svg viewBox="0 0 28 22" fill="none" className="w-full h-full">
        <circle cx="14" cy="11" r="9" fill="currentColor" opacity="0.15" />
        <path d="M14,11 L14,2 A9,9 0 0,1 21.8,15.5 Z" fill="currentColor" opacity="0.9" />
        <path d="M14,11 L21.8,15.5 A9,9 0 0,1 6.2,15.5 Z" fill="currentColor" opacity="0.6" />
        <path d="M14,11 L6.2,15.5 A9,9 0 0,1 14,2 Z" fill="currentColor" opacity="0.35" />
      </svg>
    ),
  },
  {
    kind: "donut", label: "Donut",
    svg: (
      <svg viewBox="0 0 28 22" fill="none" className="w-full h-full">
        <circle cx="14" cy="11" r="9" fill="none" stroke="currentColor" strokeWidth="5" strokeOpacity="0.15" />
        <circle cx="14" cy="11" r="9" fill="none" stroke="currentColor" strokeWidth="5" strokeDasharray="28 29" opacity="0.9" strokeLinecap="round" />
        <circle cx="14" cy="11" r="9" fill="none" stroke="currentColor" strokeWidth="5" strokeDasharray="18 39" strokeDashoffset="-28" opacity="0.55" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    kind: "scatter", label: "Scatter",
    svg: (
      <svg viewBox="0 0 28 22" fill="none" className="w-full h-full">
        {([[4, 16], [8, 8], [10, 14], [14, 5], [17, 12], [20, 8], [23, 17]] as [number, number][]).map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="2" fill="currentColor" opacity={0.4 + (i % 3) * 0.2} />
        ))}
      </svg>
    ),
  },
  {
    kind: "radar", label: "Radar",
    svg: (
      <svg viewBox="0 0 28 22" fill="none" className="w-full h-full">
        <polygon points="14,1 25,8 21,20 7,20 3,8" fill="none" stroke="currentColor" strokeOpacity="0.2" strokeWidth="1" />
        <polygon points="14,4 22,9 19,18 9,18 6,9" fill="currentColor" opacity="0.2" />
        <polygon points="14,4 22,9 19,18 9,18 6,9" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.9" />
      </svg>
    ),
  },
];

const ACCENT = "#1a7a4a";

// ─────────────────────────────────────────────────────────────
//  MICRO-COMPONENTS
// ─────────────────────────────────────────────────────────────

function Toggle({ value, onChange, label, isDark }: { value: boolean; onChange: (v: boolean) => void; label: string; isDark: boolean }) {
  return (
    <button onClick={() => onChange(!value)} className="flex items-center justify-between w-full py-2 px-0 text-left">
      <span className="text-[12px]" style={{ color: isDark ? "#94a3b8" : "#64748b" }}>{label}</span>
      <div className="relative w-9 h-5 rounded-full transition-colors" style={{ background: value ? ACCENT : isDark ? "#334155" : "#e2e8f0" }}>
        <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all" style={{ left: value ? "18px" : "2px" }} />
      </div>
    </button>
  );
}

function SectionLabel({ children, isDark }: { children: React.ReactNode; isDark: boolean }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: isDark ? "#475569" : "#94a3b8" }}>
      {children}
    </p>
  );
}

function Divider({ isDark }: { isDark: boolean }) {
  return <div className="my-4" style={{ borderTop: `1px solid ${isDark ? "#1e2330" : "#f1f5f9"}` }} />;
}

// Shared dropdown content/item props so every Select in this file looks/behaves the same
function ddContentProps(isDark: boolean) {
  return {
    side: "bottom" as const,
    align: "start" as const,
    avoidCollisions: false,
    className: "max-h-56 overflow-y-auto",
    style: ddStyle(isDark),
  };
}

// ─────────────────────────────────────────────────────────────
//  MAIN PANEL
// ─────────────────────────────────────────────────────────────

interface ChartsPanelProps {
  isDark: boolean;
  activeChart: SheetChart | null;
  panelTab: ChartPanelTab;
  setPanelTab: (t: ChartPanelTab) => void;
  rows: SheetRow[];
  columns: ColumnDef[];
  onUpdateChart: (patch: Partial<SheetChart>) => void;
  onRemoveChart: () => void;
}

export default function ChartsPanel({
  isDark, activeChart, panelTab, setPanelTab,
  rows, columns, onUpdateChart, onRemoveChart,
}: ChartsPanelProps) {
  const text = isDark ? "#e2e8f0" : "#0f172a";
  const muted = isDark ? "#475569" : "#94a3b8";
  const sub = isDark ? "#94a3b8" : "#64748b";
  const border = isDark ? "#1e2330" : "#e2e8f0";
  const inputBg = isDark ? "#0f1117" : "#ffffff";
  const inputBorder = isDark ? "#1e2330" : "#e2e8f0";
  const tabActiveBg = isDark ? "#1e2330" : "#f1f5f9";

  if (!activeChart) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 px-5 text-center">
        <div className="h-14 w-14 rounded-2xl flex items-center justify-center" style={{ background: isDark ? "#1a2035" : "#f8fafc" }}>
          <BarChart3 className="h-7 w-7" style={{ color: muted }} />
        </div>
        <div className="space-y-1.5">
          <p className="text-[13px] font-semibold" style={{ color: text }}>No chart selected</p>
          <p className="text-[11px] leading-relaxed" style={{ color: muted }}>
            Click a chart widget on the sheet to edit it, or use the{" "}
            <strong style={{ color: ACCENT }}>Chart</strong> button in the toolbar to insert one.
          </p>
        </div>
      </div>
    );
  }

  const TABS: { id: ChartPanelTab; label: string; icon: React.ReactNode }[] = [
    { id: "data", label: "Data", icon: <Database className="h-3 w-3" /> },
    { id: "design", label: "Design", icon: <Palette className="h-3 w-3" /> },
    { id: "format", label: "Format", icon: <Settings2 className="h-3 w-3" /> },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center px-3 pt-2 pb-0 gap-0.5 shrink-0 border-b" style={{ borderColor: border }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setPanelTab(tab.id)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-[11.5px] font-semibold transition-colors"
            style={{
              color: panelTab === tab.id ? ACCENT : sub,
              background: panelTab === tab.id ? tabActiveBg : "transparent",
              borderBottom: panelTab === tab.id ? `2px solid ${ACCENT}` : "2px solid transparent",
              marginBottom: "-1px",
            }}
          >
            {tab.icon}
            <span className="ml-1">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 p-4">
        {panelTab === "data" && (
          <DataTab
            chart={activeChart} isDark={isDark} rows={rows} columns={columns}
            onUpdate={onUpdateChart} text={text} muted={muted} sub={sub}
            border={border} inputBg={inputBg} inputBorder={inputBorder}
          />
        )}
        {panelTab === "design" && (
          <DesignTab
            chart={activeChart} isDark={isDark} onUpdate={onUpdateChart}
            text={text} muted={muted} border={border}
          />
        )}
        {panelTab === "format" && (
          <FormatTab
            chart={activeChart} isDark={isDark} onUpdate={onUpdateChart}
            onRemove={onRemoveChart} text={text} muted={muted} sub={sub}
            border={border} inputBg={inputBg} inputBorder={inputBorder}
          />
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  DATA TAB — literal row reading, names-only dropdowns
// ─────────────────────────────────────────────────────────────

function DataTab({
  chart, isDark, rows, columns, onUpdate,
  text, muted, sub, border, inputBg, inputBorder,
}: {
  chart: SheetChart; isDark: boolean; rows: SheetRow[]; columns: ColumnDef[];
  onUpdate: (p: Partial<SheetChart>) => void;
  text: string; muted: string; sub: string; border: string; inputBg: string; inputBorder: string;
}) {
  const totalRows = rows.length;
  const isCat = CATEGORICAL_KINDS.has(chart.kind);
  const needsY = requiresNumericY(chart.kind);

  const startRow = chart.startRow ?? 0;
  const endRow = chart.endRow ?? totalRows - 1;
  const labelRowIndex = chart.labelRowIndex ?? 0;

  // Whatever row is picked, its cell value IS the column name. Blank cell → fallback to default column name.
  const headerRow = rows[labelRowIndex];
  const colDisplayName = (col: ColumnDef): string => {
    const val = headerRow ? String(headerRow[col.key] ?? "").trim() : "";
    return val || col.name;
  };

  const allCols = getLabelCols(columns).map(c => ({ ...c, name: colDisplayName(c) }));
  const typedNumericKeys = new Set(getNumericCols(columns).map(c => c.key));
  const numericCols = columns
    .filter((c) => {
      if (c.isExtra || c.hidden) return false;
      if (typedNumericKeys.has(c.key)) return true;
      return rows
        .slice(startRow, endRow + 1)
        .some((row) => coerceChartNumber(row[c.key]) !== null);
    })
    .map(c => ({ ...c, name: colDisplayName(c) }));

  const triggerStyle: React.CSSProperties = {
    background: inputBg,
    border: `1px solid ${inputBorder}`,
    color: text,
    borderRadius: "8px",
    padding: "6px 10px",
    fontSize: "12px",
    width: "100%",
  };

  return (
    <div className="space-y-4">
      {/* Data source mode */}
      <div>
        <SectionLabel isDark={isDark}>Data Source</SectionLabel>
        <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: border }}>
          {(["sheet", "manual"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => onUpdate({ dataMode: mode })}
              className="flex-1 py-2 text-[11.5px] font-semibold transition-colors"
              style={{
                background: chart.dataMode === mode ? ACCENT : inputBg,
                color: chart.dataMode === mode ? "#fff" : sub,
              }}
            >
              {mode === "sheet" ? "Sheet Columns" : "Manual Entry"}
            </button>
          ))}
        </div>
      </div>

      <Divider isDark={isDark} />

      {chart.dataMode === "manual" && (
        <ManualDataEditor
          chart={chart} isDark={isDark} onUpdate={onUpdate}
          text={text} muted={muted} sub={sub} border={border}
          inputBg={inputBg} inputBorder={inputBorder}
        />
      )}

      {chart.dataMode === "sheet" && (
        <>
          {/* Row picker — whatever you pick is used as-is */}
          <div>
            <SectionLabel isDark={isDark}>Pick the Row With Column Names</SectionLabel>
            <Select
              value={String(labelRowIndex)}
              onValueChange={(v) => {
                const next = Number(v);
                onUpdate({
                  labelRowIndex: next,
                  startRow: startRow <= next ? next + 1 : startRow,
                });
              }}
            >
              <SelectTrigger style={triggerStyle} className="h-auto transition-colors hover:opacity-90">
                <SelectValue />
              </SelectTrigger>
              <SelectContent {...ddContentProps(isDark)}>
                {rows.slice(0, Math.min(totalRows, 30)).map((_, idx) => (
                  <SelectItem key={idx} value={String(idx)} style={ddItemStyle(isDark)}>
                    Row {idx + 1}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Direct preview of exactly what's in that row, per column */}
            {headerRow && (
              <div
                className="mt-2 px-3 py-2 rounded-lg text-[11px]"
                style={{ background: isDark ? "#0f1117" : "#f8fafc", border: `1px solid ${border}` }}
              >
                <p className="font-semibold mb-1" style={{ color: muted }}>Using row {labelRowIndex + 1} as column names:</p>
                <div className="flex flex-wrap gap-1">
                  {columns.filter(c => !c.isExtra && !c.hidden).slice(0, 10).map(col => (
                    <span
                      key={col.key}
                      className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                      style={{ background: `${ACCENT}20`, color: ACCENT }}
                    >
                      {colDisplayName(col)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Divider isDark={isDark} />

          {/* Row range */}
          <div>
            <SectionLabel isDark={isDark}>Rows to Chart</SectionLabel>
            <div className="grid grid-cols-2 gap-2">
              {([
                ["From Row", startRow + 1, (v: number) => onUpdate({ startRow: v - 1 })],
                ["To Row", endRow + 1, (v: number) => onUpdate({ endRow: v - 1 })],
              ] as const).map(([label, val, setter]) => (
                <div key={label}>
                  <label className="text-[10.5px] block mb-1" style={{ color: muted }}>{label}</label>
                  <input
                    style={triggerStyle}
                    type="number"
                    min={1}
                    max={totalRows}
                    value={val}
                    onChange={(e) => setter(Math.max(1, Math.min(totalRows, Number(e.target.value))))}
                  />
                </div>
              ))}
            </div>
            <p className="text-[10px] mt-1.5" style={{ color: muted }}>
              {totalRows} total rows · charting rows {startRow + 1}–{endRow + 1}
            </p>

            {rows.slice(startRow, Math.min(endRow + 1, startRow + 3)).length > 0 && (
              <div
                className="mt-2 px-3 py-2 rounded-lg text-[11px]"
                style={{ background: isDark ? "#0f1117" : "#f8fafc", border: `1px solid ${border}` }}
              >
                <p className="font-semibold mb-1" style={{ color: muted }}>Data preview:</p>
                {rows.slice(startRow, Math.min(endRow + 1, startRow + 3)).map((row, i) => (
                  <p key={i} className="text-[10px] truncate" style={{ color: sub }}>
                    Row {startRow + i + 1}: {columns.filter(c => !c.isExtra && !c.hidden).slice(0, 4)
                      .map(c => `${colDisplayName(c)}: ${row[c.key] ?? ""}`).join(" | ")}
                  </p>
                ))}
              </div>
            )}
          </div>

          <Divider isDark={isDark} />

          {/* X-axis column */}
          <div>
            <SectionLabel isDark={isDark}>{isCat ? "Slice / Category Column" : "X-Axis Column"}</SectionLabel>
            <Select
              value={chart.labelColumnKey ?? "__none__"}
              onValueChange={(v) => {
                const nextValue = v === "__none__" ? null : v;
                // 🎯 SIDEBAR X-AXIS CLICK LOG
                console.log("🎯 [ChartsPanel X-Axis Dropdown Clicked]:", {
                  selectedValue: nextValue,
                  chartId: chart.id
                });
                onUpdate({ labelColumnKey: nextValue });
              }}
            >
              <SelectTrigger style={triggerStyle} className="h-auto transition-colors hover:opacity-90">
                <SelectValue placeholder="Select a column" />
              </SelectTrigger>
              <SelectContent {...ddContentProps(isDark)}>
                <SelectItem value="__none__" style={ddItemStyle(isDark)}>Select a column</SelectItem>
                {allCols.map((c) => (
                  <SelectItem key={c.key} value={c.key} style={ddItemStyle(isDark)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Divider isDark={isDark} />

          {/* Aggregate mode */}
          <div>
            <SectionLabel isDark={isDark}>{isCat ? "Value to Plot" : "Group Duplicate Labels"}</SectionLabel>
            {isCat ? (
              <div className="grid grid-cols-2 gap-1.5">
                {(["count", "sum", "avg"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => onUpdate({ aggregateMode: mode })}
                    className="text-left px-3 py-2.5 rounded-xl border-2 transition-all"
                    style={{
                      borderColor: chart.aggregateMode === mode ? ACCENT : border,
                      background: chart.aggregateMode === mode ? `${ACCENT}15` : inputBg,
                      color: chart.aggregateMode === mode ? ACCENT : sub,
                    }}
                  >
                    <p className="text-[11.5px] font-bold">
                      {mode === "count" ? "Count rows" : mode === "sum" ? "Sum column" : "Average"}
                    </p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-1.5">
                {(["none", "sum", "avg", "count"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => onUpdate({ aggregateMode: mode })}
                    className="py-2 text-[11px] font-semibold rounded-lg border-2 transition-all"
                    style={{
                      borderColor: chart.aggregateMode === mode ? ACCENT : border,
                      background: chart.aggregateMode === mode ? `${ACCENT}15` : inputBg,
                      color: chart.aggregateMode === mode ? ACCENT : sub,
                    }}
                  >
                    {mode === "none" ? "No grouping" : mode === "sum" ? "Sum" : mode === "avg" ? "Average" : "Count rows"}
                  </button>
                ))}
              </div>
            )}
          </div>

          {(needsY || (isCat && chart.aggregateMode !== "count")) && (
            <>
              <Divider isDark={isDark} />
              <YAxisSection
                chart={chart} isDark={isDark} numericCols={numericCols}
                onUpdate={onUpdate} isCat={isCat} text={text} muted={muted}
                border={border} inputBg={inputBg}
              />
            </>
          )}

          {(chart.labelColumnKey) && (
            <>
              <Divider isDark={isDark} />
              <ConfigSummary chart={chart} columns={allCols} isDark={isDark} text={text} sub={sub} />
            </>
          )}
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  Y-AXIS SECTION
// ─────────────────────────────────────────────────────────────

function YAxisSection({
  chart, isDark, numericCols, onUpdate, isCat,
  text, muted, border, inputBg,
}: {
  chart: SheetChart; isDark: boolean; numericCols: ColumnDef[]; isCat: boolean;
  onUpdate: (p: Partial<SheetChart>) => void;
  text: string; muted: string; border: string; inputBg: string;
}) {
  const triggerStyle: React.CSSProperties = {
    background: inputBg, border: `1px solid ${border}`, color: text,
    borderRadius: "8px", padding: "6px 10px", fontSize: "12px", width: "100%",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <SectionLabel isDark={isDark}>{isCat ? "Value Column (optional)" : "Y-Axis (Values / Series)"}</SectionLabel>
        {!isCat && (
          <button
            onClick={() => {
              const remaining = numericCols.filter(c => !chart.seriesKeys.includes(c.key));
              if (remaining[0]) onUpdate({ seriesKeys: [...chart.seriesKeys, remaining[0].key] });
            }}
            className="flex items-center gap-1 text-[10.5px] font-semibold px-2 py-1 rounded-md"
            style={{ color: ACCENT, background: `${ACCENT}15` }}
          >
            <Plus className="h-3 w-3" /> Add Series
          </button>
        )}
      </div>

      {numericCols.length === 0 ? (
        <p className="text-[11px]" style={{ color: muted }}>No numeric columns found in this row range.</p>
      ) : isCat ? (
        <Select
          value={chart.seriesKeys[0] ?? "__auto__"}
          onValueChange={(v) => {
            const nextKeys = v === "__auto__" ? [] : [v];
            // 🎯 SIDEBAR PIE/DONUT DATA PLOT CLICK LOG
            console.log("🎯 [ChartsPanel Categorical Value Column Clicked]:", {
              selectedKey: v,
              resultingSeriesKeysArray: nextKeys
            });
            onUpdate({ seriesKeys: nextKeys });
          }}
        >
          <SelectTrigger style={triggerStyle} className="h-auto transition-colors hover:opacity-90">
            <SelectValue />
          </SelectTrigger>
          <SelectContent {...ddContentProps(isDark)}>
            <SelectItem value="__auto__" style={ddItemStyle(isDark)}>— Auto-count —</SelectItem>
            {numericCols.map((c) => (
              <SelectItem key={c.key} value={c.key} style={ddItemStyle(isDark)}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : chart.seriesKeys.length === 0 ? (
        <button
          onClick={() => numericCols[0] && onUpdate({ seriesKeys: [numericCols[0].key] })}
          className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl border-2 border-dashed text-[11.5px] font-semibold"
          style={{ borderColor: `${ACCENT}60`, color: ACCENT }}
        >
          <Plus className="h-3.5 w-3.5" /> Add Y-axis column
        </button>
      ) : (
        <div className="space-y-2">
          {chart.seriesKeys.map((key, idx) => (
            <div key={key} className="flex items-center gap-2 px-2 py-2 rounded-lg border" style={{ borderColor: border, background: isDark ? "#0f1117" : "#f8fafc" }}>
              <GripVertical className="h-3.5 w-3.5 shrink-0" style={{ color: muted }} />
              <div className="h-3 w-3 rounded-full shrink-0" style={{ background: SCHEME_COLORS[chart.colorScheme]?.[idx] ?? ACCENT }} />
              <div className="flex-1">
                <Select
                  value={key}
                  onValueChange={(v) => {
                    const next = [...chart.seriesKeys];
                    next[idx] = v;
                    onUpdate({ seriesKeys: next });
                  }}
                >
                  <SelectTrigger style={{ background: "transparent", border: "none", color: text, padding: "0", fontSize: "12px" }} className="h-auto">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent {...ddContentProps(isDark)}>
                    {numericCols.map((c) => (
                      <SelectItem key={c.key} value={c.key} style={ddItemStyle(isDark)}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <button
                onClick={() => onUpdate({ seriesKeys: chart.seriesKeys.filter((_, i) => i !== idx) })}
                className="shrink-0 p-0.5 rounded hover:text-red-400 transition-colors"
                style={{ color: muted }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  CONFIG SUMMARY
// ─────────────────────────────────────────────────────────────

function ConfigSummary({ chart, columns, isDark, text, sub }: {
  chart: SheetChart; columns: ColumnDef[]; isDark: boolean; text: string; sub: string;
}) {
  void isDark;
  const xCol = columns.find(c => c.key === chart.labelColumnKey);
  const yColNames = chart.seriesKeys.map(k => columns.find(c => c.key === k)?.name ?? k).join(", ");
  const isCat = CATEGORICAL_KINDS.has(chart.kind);

  return (
    <div className="px-3 py-2.5 rounded-xl text-[11px]" style={{ background: `${ACCENT}12`, border: `1px solid ${ACCENT}30` }}>
      <div className="flex items-center gap-1.5 mb-1">
        <Sparkles className="h-3 w-3" style={{ color: ACCENT }} />
        <p className="font-bold" style={{ color: ACCENT }}>Chart configuration</p>
      </div>
      <p style={{ color: sub }}>
        <strong style={{ color: text }}>{chart.kind.toUpperCase()}</strong>
        {xCol && <span> · X: <strong style={{ color: text }}>{xCol.name}</strong></span>}
        {isCat && chart.aggregateMode === "count" && <span style={{ color: ACCENT }}> (counting rows)</span>}
        {yColNames && <span> · Y: <strong style={{ color: text }}>{yColNames}</strong></span>}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  MANUAL DATA EDITOR
// ─────────────────────────────────────────────────────────────

function ManualDataEditor({
  chart, isDark, onUpdate, text, muted, sub, border, inputBg, inputBorder,
}: {
  chart: SheetChart; isDark: boolean; onUpdate: (p: Partial<SheetChart>) => void;
  text: string; muted: string; sub: string; border: string; inputBg: string; inputBorder: string;
}) {
  void sub;
  const isCat = CATEGORICAL_KINDS.has(chart.kind);
  const inputStyle: React.CSSProperties = {
    background: inputBg, border: `1px solid ${inputBorder}`, color: text,
    borderRadius: "8px", padding: "6px 10px", fontSize: "12px", width: "100%", outline: "none",
  };

  return (
    <div className="space-y-4">
      <div>
        <SectionLabel isDark={isDark}>{isCat ? "Slice Labels" : "Categories (X-Axis)"}</SectionLabel>
        <input
          style={inputStyle}
          placeholder={isCat ? "Open, In Progress, Closed…" : "Jan, Feb, Mar, Apr…"}
          defaultValue={chart.manualCategories.join(", ")}
          onBlur={(e) => {
            const cats = e.target.value.split(",").map(s => s.trim()).filter(Boolean);
            onUpdate({ manualCategories: cats });
          }}
        />
        <p className="text-[10px] mt-1" style={{ color: muted }}>{chart.manualCategories.length} categories · comma-separated</p>
      </div>
      <Divider isDark={isDark} />
      <div>
        <div className="flex items-center justify-between mb-2">
          <SectionLabel isDark={isDark}>{isCat ? "Values" : "Series (Y-Axis Values)"}</SectionLabel>
          {!isCat && (
            <button
              onClick={() => onUpdate({ manualSeries: [...chart.manualSeries, { name: `Series ${chart.manualSeries.length + 1}`, values: [] }] })}
              className="flex items-center gap-1 text-[10.5px] font-semibold px-2 py-1 rounded-md"
              style={{ color: ACCENT, background: `${ACCENT}15` }}
            >
              <Plus className="h-3 w-3" /> Add
            </button>
          )}
        </div>
        <div className="space-y-3">
          {chart.manualSeries.map((series, idx) => (
            <div key={idx} className="rounded-xl border p-3 space-y-2" style={{ borderColor: border, background: isDark ? "#0f1117" : "#f8fafc" }}>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full shrink-0" style={{ background: SCHEME_COLORS[chart.colorScheme]?.[idx] ?? ACCENT }} />
                {!isCat && (
                  <input
                    style={{ ...inputStyle, border: "none", background: "transparent", padding: "0", flex: 1, fontWeight: 600 }}
                    defaultValue={series.name}
                    placeholder="Series name"
                    onBlur={(e) => { const next = [...chart.manualSeries]; next[idx] = { ...next[idx], name: e.target.value }; onUpdate({ manualSeries: next }); }}
                  />
                )}
                {isCat && <span className="flex-1 text-[12px] font-semibold" style={{ color: text }}>Values</span>}
                {chart.manualSeries.length > 1 && (
                  <button onClick={() => onUpdate({ manualSeries: chart.manualSeries.filter((_, i) => i !== idx) })} style={{ color: muted }}>
                    <Trash2 className="h-3.5 w-3.5 hover:text-red-400 transition-colors" />
                  </button>
                )}
              </div>
              <input
                style={inputStyle}
                placeholder="42, 78, 55, 91…"
                defaultValue={series.values.join(", ")}
                onBlur={(e) => {
                  const values = e.target.value.split(",").map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
                  const next = [...chart.manualSeries]; next[idx] = { ...next[idx], values }; onUpdate({ manualSeries: next });
                }}
              />
              <p className="text-[10px]" style={{ color: muted }}>{series.values.length} values</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  DESIGN TAB
// ─────────────────────────────────────────────────────────────

function DesignTab({
  chart, isDark, onUpdate, text, muted, border,
}: {
  chart: SheetChart; isDark: boolean; onUpdate: (p: Partial<SheetChart>) => void;
  text: string; muted: string; border: string;
}) {
  return (
    <div className="space-y-4">
      <div>
        <SectionLabel isDark={isDark}>Chart Type</SectionLabel>
        <div className="grid grid-cols-4 gap-2">
          {KIND_OPTIONS.map((opt) => (
            <button
              key={opt.kind}
              onClick={() => onUpdate({ kind: opt.kind })}
              className="flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all"
              style={{
                borderColor: chart.kind === opt.kind ? ACCENT : border,
                background: chart.kind === opt.kind ? `${ACCENT}15` : isDark ? "#0f1117" : "#f8fafc",
                color: chart.kind === opt.kind ? ACCENT : muted,
              }}
            >
              <div className="w-7 h-5">{opt.svg}</div>
              <span className="text-[9px] font-bold">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>
      <Divider isDark={isDark} />
      <div>
        <SectionLabel isDark={isDark}>Color Scheme</SectionLabel>
        <div className="space-y-1.5">
          {(Object.keys(SCHEME_COLORS) as ColorScheme[]).map((scheme) => {
            const colors = SCHEME_COLORS[scheme];
            const isActive = chart.colorScheme === scheme;
            return (
              <button
                key={scheme}
                onClick={() => onUpdate({ colorScheme: scheme })}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl border-2 transition-all"
                style={{ borderColor: isActive ? ACCENT : border, background: isActive ? `${ACCENT}15` : isDark ? "#0f1117" : "#f8fafc" }}
              >
                <div className="flex gap-1 shrink-0">
                  {colors.slice(0, 5).map((c) => <div key={c} className="h-3.5 w-3.5 rounded-full" style={{ background: c }} />)}
                </div>
                <span className="text-[12px] font-medium flex-1 text-left" style={{ color: text }}>{SCHEME_LABELS[scheme]}</span>
                {isActive && <Check className="h-3.5 w-3.5 shrink-0" style={{ color: ACCENT }} />}
              </button>
            );
          })}
        </div>
      </div>
      <Divider isDark={isDark} />
      <div>
        <SectionLabel isDark={isDark}>Display Options</SectionLabel>
        <div className="divide-y" style={{ borderColor: border }}>
          <Toggle value={chart.showLegend} onChange={(v) => onUpdate({ showLegend: v })} label="Show Legend" isDark={isDark} />
          <Toggle value={chart.showGrid} onChange={(v) => onUpdate({ showGrid: v })} label="Show Grid Lines" isDark={isDark} />
          <Toggle value={chart.showLabels} onChange={(v) => onUpdate({ showLabels: v })} label="Show Data Labels" isDark={isDark} />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  FORMAT TAB
// ─────────────────────────────────────────────────────────────

function FormatTab({
  chart, isDark, onUpdate, onRemove, text, muted, sub, border, inputBg, inputBorder,
}: {
  chart: SheetChart; isDark: boolean; onUpdate: (p: Partial<SheetChart>) => void; onRemove: () => void;
  text: string; muted: string; sub: string; border: string; inputBg: string; inputBorder: string;
}) {
  const [title, setTitle] = useState(chart.title ?? "");
  useEffect(() => { setTitle(chart.title ?? ""); }, [chart.title]);

  const inputStyle: React.CSSProperties = {
    background: inputBg, border: `1px solid ${inputBorder}`, color: text,
    borderRadius: "8px", padding: "6px 10px", fontSize: "12px", width: "100%", outline: "none",
  };

  return (
    <div className="space-y-4">
      <div>
        <SectionLabel isDark={isDark}>Chart Title</SectionLabel>
        <input
          style={inputStyle}
          placeholder="Enter chart title…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => onUpdate({ title: title.trim() })}
        />
      </div>
      <Divider isDark={isDark} />
      <div>
        <SectionLabel isDark={isDark}>Size</SectionLabel>
        <div className="grid grid-cols-2 gap-2">
          {([
            ["Width (px)", chart.width, 280, 1400, (v: number) => onUpdate({ width: v })],
            ["Height (px)", chart.height, 180, 900, (v: number) => onUpdate({ height: v })],
          ] as const).map(([label, val, min, max, setter]) => (
            <div key={label}>
              <label className="text-[10.5px] block mb-1" style={{ color: muted }}>{label}</label>
              <input style={inputStyle} type="number" min={min} max={max} defaultValue={val} onBlur={(e) => setter(Math.max(min, Number(e.target.value)))} />
            </div>
          ))}
        </div>
      </div>
      <Divider isDark={isDark} />
      <div>
        <SectionLabel isDark={isDark}>Danger Zone</SectionLabel>
        <button
          onClick={onRemove}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-[12px] font-semibold transition-colors"
          style={{ borderColor: "#ef4444", color: "#ef4444" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#ef444415")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
        >
          <Trash2 className="h-3.5 w-3.5" /> Remove Chart
        </button>
      </div>
    </div>
  );
}