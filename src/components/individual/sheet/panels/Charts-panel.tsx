"use client";

/**
 * components/individual/sheet/panels/Charts-panel.tsx
 *
 * Professional chart editor panel — Tabs: Data | Design | Format
 *
 * CORRECTED LOGIC:
 *  ─ Pie / Donut / Radar: X column is required; Y is OPTIONAL.
 *    When Y is empty → auto-COUNT occurrences of each X value.
 *    When Y is set   → aggregate that numeric column per X group.
 *    UI hides the Y section or shows it as optional with clear explanation.
 *
 *  ─ Bar / Column / Line / Area / Scatter: X required, Y required (numeric).
 *
 *  ─ ANY column can be X (text, status, priority, date, select, assigned-to…).
 *    This lets users chart "Tasks per Assignee", "Bugs per Status", etc.
 *
 *  ─ aggregateMode defaults:
 *      categorical (pie/donut/radar) → "count"
 *      other                         → "none"
 */

import { useEffect, useState } from "react";
import {
  BarChart3,
  Plus,
  Trash2,
  Database,
  Palette,
  Settings2,
  Check,
  GripVertical,
  Info,
  Sparkles,
} from "lucide-react";
import type {
  SheetChart,
  ChartKind,
  ColorScheme,
  ChartPanelTab,
} from "@/hooks/sheets/use-charts";
import {
  SCHEME_COLORS,
  SCHEME_LABELS,
  getLabelCols,
  getNumericCols,
  CATEGORICAL_KINDS,
  requiresNumericY,
} from "@/hooks/sheets/use-charts";
import type { SheetRow, ColumnDef } from "@/types/index";

// ─────────────────────────────────────────────────────────────
//  CHART KIND OPTIONS (all 8 types)
// ─────────────────────────────────────────────────────────────

const KIND_OPTIONS: { kind: ChartKind; label: string; svg: React.ReactNode }[] =
  [
    {
      kind: "column",
      label: "Column",
      svg: (
        <svg viewBox="0 0 28 22" fill="none" className="w-full h-full">
          <rect
            x="2"
            y="11"
            width="4"
            height="10"
            rx="1"
            fill="currentColor"
            opacity="0.9"
          />
          <rect
            x="8"
            y="5"
            width="4"
            height="16"
            rx="1"
            fill="currentColor"
            opacity="0.7"
          />
          <rect
            x="14"
            y="8"
            width="4"
            height="13"
            rx="1"
            fill="currentColor"
            opacity="0.5"
          />
          <rect
            x="20"
            y="2"
            width="4"
            height="19"
            rx="1"
            fill="currentColor"
            opacity="0.85"
          />
        </svg>
      ),
    },
    {
      kind: "bar",
      label: "Bar",
      svg: (
        <svg viewBox="0 0 28 22" fill="none" className="w-full h-full">
          <rect
            x="2"
            y="2"
            width="24"
            height="4"
            rx="1"
            fill="currentColor"
            opacity="0.9"
          />
          <rect
            x="2"
            y="9"
            width="18"
            height="4"
            rx="1"
            fill="currentColor"
            opacity="0.65"
          />
          <rect
            x="2"
            y="16"
            width="21"
            height="4"
            rx="1"
            fill="currentColor"
            opacity="0.4"
          />
        </svg>
      ),
    },
    {
      kind: "line",
      label: "Line",
      svg: (
        <svg viewBox="0 0 28 22" fill="none" className="w-full h-full">
          <polyline
            points="2,18 7,12 12,15 17,7 22,4 26,9"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="7" cy="12" r="1.8" fill="currentColor" />
          <circle cx="17" cy="7" r="1.8" fill="currentColor" />
          <circle cx="26" cy="9" r="1.8" fill="currentColor" />
        </svg>
      ),
    },
    {
      kind: "area",
      label: "Area",
      svg: (
        <svg viewBox="0 0 28 22" fill="none" className="w-full h-full">
          <path
            d="M2,20 L2,14 L7,10 L12,13 L17,6 L22,3 L26,7 L26,20 Z"
            fill="currentColor"
            opacity="0.2"
          />
          <polyline
            points="2,14 7,10 12,13 17,6 22,3 26,7"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      kind: "pie",
      label: "Pie",
      svg: (
        <svg viewBox="0 0 28 22" fill="none" className="w-full h-full">
          <circle cx="14" cy="11" r="9" fill="currentColor" opacity="0.15" />
          <path
            d="M14,11 L14,2 A9,9 0 0,1 21.8,15.5 Z"
            fill="currentColor"
            opacity="0.9"
          />
          <path
            d="M14,11 L21.8,15.5 A9,9 0 0,1 6.2,15.5 Z"
            fill="currentColor"
            opacity="0.6"
          />
          <path
            d="M14,11 L6.2,15.5 A9,9 0 0,1 14,2 Z"
            fill="currentColor"
            opacity="0.35"
          />
        </svg>
      ),
    },
    {
      kind: "donut",
      label: "Donut",
      svg: (
        <svg viewBox="0 0 28 22" fill="none" className="w-full h-full">
          <circle
            cx="14"
            cy="11"
            r="9"
            fill="none"
            stroke="currentColor"
            strokeWidth="5"
            strokeOpacity="0.15"
          />
          <circle
            cx="14"
            cy="11"
            r="9"
            fill="none"
            stroke="currentColor"
            strokeWidth="5"
            strokeDasharray="28 29"
            opacity="0.9"
            strokeLinecap="round"
          />
          <circle
            cx="14"
            cy="11"
            r="9"
            fill="none"
            stroke="currentColor"
            strokeWidth="5"
            strokeDasharray="18 39"
            strokeDashoffset="-28"
            opacity="0.55"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
    {
      kind: "scatter",
      label: "Scatter",
      svg: (
        <svg viewBox="0 0 28 22" fill="none" className="w-full h-full">
          {(
            [
              [4, 16],
              [8, 8],
              [10, 14],
              [14, 5],
              [17, 12],
              [20, 8],
              [23, 17],
            ] as [number, number][]
          ).map(([cx, cy], i) => (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r="2"
              fill="currentColor"
              opacity={0.4 + (i % 3) * 0.2}
            />
          ))}
        </svg>
      ),
    },
    {
      kind: "radar",
      label: "Radar",
      svg: (
        <svg viewBox="0 0 28 22" fill="none" className="w-full h-full">
          <polygon
            points="14,1 25,8 21,20 7,20 3,8"
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.2"
            strokeWidth="1"
          />
          <polygon
            points="14,4 22,9 19,18 9,18 6,9"
            fill="currentColor"
            opacity="0.2"
          />
          <polygon
            points="14,4 22,9 19,18 9,18 6,9"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            opacity="0.9"
          />
        </svg>
      ),
    },
  ];

// ─────────────────────────────────────────────────────────────
//  SHARED MICRO-COMPONENTS
// ─────────────────────────────────────────────────────────────

const ACCENT = "#1a7a4a";

function Toggle({
  value,
  onChange,
  label,
  isDark,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  label: string;
  isDark: boolean;
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="flex items-center justify-between w-full py-2 px-0 text-left"
    >
      <span
        className="text-[12px]"
        style={{ color: isDark ? "#94a3b8" : "#64748b" }}
      >
        {label}
      </span>
      <div
        className="relative w-9 h-5 rounded-full transition-colors"
        style={{ background: value ? ACCENT : isDark ? "#334155" : "#e2e8f0" }}
      >
        <div
          className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all"
          style={{ left: value ? "18px" : "2px" }}
        />
      </div>
    </button>
  );
}

function SectionLabel({
  children,
  isDark,
}: {
  children: React.ReactNode;
  isDark: boolean;
}) {
  return (
    <p
      className="text-[10px] font-bold uppercase tracking-widest mb-2"
      style={{ color: isDark ? "#475569" : "#94a3b8" }}
    >
      {children}
    </p>
  );
}

function Divider({ isDark }: { isDark: boolean }) {
  return (
    <div
      className="my-4"
      style={{ borderTop: `1px solid ${isDark ? "#1e2330" : "#f1f5f9"}` }}
    />
  );
}

function InfoBadge({
  text,
  isDark,
  variant = "info",
}: {
  text: string;
  isDark: boolean;
  variant?: "info" | "success" | "warn";
}) {
  const colors = {
    info: {
      bg: isDark ? "#0f172a" : "#eff6ff",
      border: isDark ? "#1e3a5f" : "#bfdbfe",
      text: isDark ? "#93c5fd" : "#1e40af",
    },
    success: {
      bg: isDark ? "#052e16" : "#f0fdf4",
      border: isDark ? "#14532d" : "#bbf7d0",
      text: isDark ? "#86efac" : "#166534",
    },
    warn: {
      bg: isDark ? "#2d1b00" : "#fffbeb",
      border: isDark ? "#78350f" : "#fcd34d",
      text: isDark ? "#fcd34d" : "#92400e",
    },
  }[variant];

  return (
    <div
      className="flex items-start gap-1.5 px-3 py-2 rounded-lg mt-1.5"
      style={{ background: colors.bg, border: `1px solid ${colors.border}` }}
    >
      <Info
        className="h-3.5 w-3.5 mt-0.5 shrink-0"
        style={{ color: colors.text }}
      />
      <p className="text-[11px] leading-snug" style={{ color: colors.text }}>
        {text}
      </p>
    </div>
  );
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
  isDark,
  activeChart,
  panelTab,
  setPanelTab,
  rows,
  columns,
  onUpdateChart,
  onRemoveChart,
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
        <div
          className="h-14 w-14 rounded-2xl flex items-center justify-center"
          style={{ background: isDark ? "#1a2035" : "#f8fafc" }}
        >
          <BarChart3 className="h-7 w-7" style={{ color: muted }} />
        </div>
        <div className="space-y-1.5">
          <p className="text-[13px] font-semibold" style={{ color: text }}>
            No chart selected
          </p>
          <p className="text-[11px] leading-relaxed" style={{ color: muted }}>
            Click a chart widget on the sheet to edit it, or use the{" "}
            <strong style={{ color: ACCENT }}>Chart</strong> button in the
            toolbar to insert one.
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
      {/* Tabs */}
      <div
        className="flex items-center px-3 pt-2 pb-0 gap-0.5 shrink-0 border-b"
        style={{ borderColor: border }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setPanelTab(tab.id)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-[11.5px] font-semibold transition-colors"
            style={{
              color: panelTab === tab.id ? ACCENT : sub,
              background: panelTab === tab.id ? tabActiveBg : "transparent",
              borderBottom:
                panelTab === tab.id
                  ? `2px solid ${ACCENT}`
                  : "2px solid transparent",
              marginBottom: "-1px",
            }}
          >
            {tab.icon}
            <span className="ml-1">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab body */}
      <div className="flex-1 overflow-y-auto min-h-0 p-4">
        {panelTab === "data" && (
          <DataTab
            chart={activeChart}
            isDark={isDark}
            rows={rows}
            columns={columns}
            onUpdate={onUpdateChart}
            text={text}
            muted={muted}
            sub={sub}
            border={border}
            inputBg={inputBg}
            inputBorder={inputBorder}
          />
        )}
        {panelTab === "design" && (
          <DesignTab
            chart={activeChart}
            isDark={isDark}
            onUpdate={onUpdateChart}
            text={text}
            muted={muted}
            sub={sub}
            border={border}
          />
        )}
        {panelTab === "format" && (
          <FormatTab
            chart={activeChart}
            isDark={isDark}
            onUpdate={onUpdateChart}
            onRemove={onRemoveChart}
            text={text}
            muted={muted}
            sub={sub}
            border={border}
            inputBg={inputBg}
            inputBorder={inputBorder}
          />
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  DATA TAB
// ─────────────────────────────────────────────────────────────

function DataTab({
  chart,
  isDark,
  rows,
  columns,
  onUpdate,
  text,
  muted,
  sub,
  border,
  inputBg,
  inputBorder,
}: {
  chart: SheetChart;
  isDark: boolean;
  rows: SheetRow[];
  columns: ColumnDef[];
  onUpdate: (p: Partial<SheetChart>) => void;
  text: string;
  muted: string;
  sub: string;
  border: string;
  inputBg: string;
  inputBorder: string;
}) {
  const allCols = getLabelCols(columns);
  const numericCols = getNumericCols(columns);
  const totalRows = rows.length;
  const isCat = CATEGORICAL_KINDS.has(chart.kind);
  const needsY = requiresNumericY(chart.kind);

  const startRow = chart.startRow ?? 0;
  const endRow = chart.endRow ?? totalRows - 1;

  const selectStyle: React.CSSProperties = {
    background: inputBg,
    border: `1px solid ${inputBorder}`,
    color: text,
    borderRadius: "8px",
    padding: "6px 10px",
    fontSize: "12px",
    width: "100%",
    outline: "none",
  };

  return (
    <div className="space-y-4">
      {/* ── Data source mode ─────────────────────────────── */}
      <div>
        <SectionLabel isDark={isDark}>Data Source</SectionLabel>
        <div
          className="flex rounded-lg overflow-hidden border"
          style={{ borderColor: border }}
        >
          {(
            [
              ["sheet", "Sheet Columns"],
              ["manual", "Manual Entry"],
            ] as const
          ).map(([mode, label]) => (
            <button
              key={mode}
              onClick={() => onUpdate({ dataMode: mode })}
              className="flex-1 py-2 text-[11.5px] font-semibold transition-colors"
              style={{
                background: chart.dataMode === mode ? ACCENT : inputBg,
                color: chart.dataMode === mode ? "#fff" : sub,
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <Divider isDark={isDark} />

      {/* ── MANUAL MODE ─────────────────────────────────── */}
      {chart.dataMode === "manual" && (
        <ManualDataEditor
          chart={chart}
          isDark={isDark}
          onUpdate={onUpdate}
          text={text}
          muted={muted}
          sub={sub}
          border={border}
          inputBg={inputBg}
          inputBorder={inputBorder}
        />
      )}

      {/* ── SHEET MODE ──────────────────────────────────── */}
      {chart.dataMode === "sheet" && (
        <>
          {/* ── Row range ─── */}
          <div>
            <SectionLabel isDark={isDark}>Data Range (Rows)</SectionLabel>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  [
                    "From Row",
                    startRow + 1,
                    (v: number) => onUpdate({ startRow: v - 1 }),
                  ],
                  [
                    "To Row",
                    endRow + 1,
                    (v: number) => onUpdate({ endRow: v - 1 }),
                  ],
                ] as const
              ).map(([label, val, setter]) => (
                <div key={label}>
                  <label
                    className="text-[10.5px] block mb-1"
                    style={{ color: muted }}
                  >
                    {label}
                  </label>
                  <input
                    style={selectStyle}
                    type="number"
                    min={1}
                    max={totalRows}
                    value={val}
                    onChange={(e) =>
                      setter(
                        Math.max(
                          1,
                          Math.min(totalRows, Number(e.target.value)),
                        ),
                      )
                    }
                  />
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <p className="text-[10px]" style={{ color: muted }}>
                {totalRows} total · showing rows {startRow + 1}–{endRow + 1} (
                {endRow - startRow + 1} rows)
              </p>
              <button
                onClick={() => onUpdate({ startRow: 0, endRow: null })}
                className="text-[10px] font-bold transition-colors"
                style={{ color: ACCENT }}
              >
                All rows
              </button>
            </div>
            {/* Visual bar */}
            <div
              className="mt-2 h-1.5 rounded-full overflow-hidden"
              style={{ background: isDark ? "#1e2330" : "#f1f5f9" }}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{
                  background: ACCENT,
                  marginLeft: `${(startRow / Math.max(totalRows, 1)) * 100}%`,
                  width: `${((endRow - startRow + 1) / Math.max(totalRows, 1)) * 100}%`,
                }}
              />
            </div>
          </div>

          <Divider isDark={isDark} />

          {/* ── X-Axis (label column) ─── */}
          <div>
            <SectionLabel isDark={isDark}>
              {isCat ? "Slice / Category Column" : "X-Axis (Labels)"}
            </SectionLabel>
            <InfoBadge
              isDark={isDark}
              variant="info"
              text={
                isCat
                  ? "Pick any column whose values become the chart slices — status, assignee, priority, category, etc."
                  : "Pick the column whose values label the horizontal axis — dates, names, categories, etc."
              }
            />
            <div className="mt-2">
              <select
                style={selectStyle}
                value={chart.labelColumnKey ?? ""}
                onChange={(e) =>
                  onUpdate({ labelColumnKey: e.target.value || null })
                }
              >
                <option value="">— Select column —</option>
                {allCols.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.name} ({c.type ?? "text"})
                  </option>
                ))}
              </select>
              {allCols.length === 0 && (
                <p className="text-[11px] mt-1.5" style={{ color: muted }}>
                  No columns found in this sheet.
                </p>
              )}
            </div>
          </div>

          <Divider isDark={isDark} />

          {/* ── Aggregate / count mode ─── */}
          <div>
            <SectionLabel isDark={isDark}>
              {isCat ? "Value to Plot" : "Group Duplicate Labels"}
            </SectionLabel>

            {isCat ? (
              <>
                <InfoBadge
                  isDark={isDark}
                  variant="success"
                  text={
                    chart.aggregateMode === "count"
                      ? "Counting rows — each unique value in the slice column becomes one segment. No numeric column needed."
                      : "Summing / averaging a numeric column per slice group. Select the column below."
                  }
                />
                <div className="grid grid-cols-2 gap-1.5 mt-2">
                  {(
                    [
                      [
                        "count",
                        "Count rows",
                        "Best for: tasks per status, items per assignee",
                      ],
                      ["sum", "Sum column", "Best for: total $ per category"],
                      ["avg", "Average", "Best for: avg score per group"],
                    ] as const
                  ).map(([mode, label, hint]) => (
                    <button
                      key={mode}
                      onClick={() => onUpdate({ aggregateMode: mode })}
                      className="col-span-1 text-left px-3 py-2.5 rounded-xl border-2 transition-all"
                      style={{
                        borderColor:
                          chart.aggregateMode === mode ? ACCENT : border,
                        background:
                          chart.aggregateMode === mode
                            ? `${ACCENT}15`
                            : inputBg,
                        color: chart.aggregateMode === mode ? ACCENT : sub,
                      }}
                    >
                      <p className="text-[11.5px] font-bold">{label}</p>
                      <p className="text-[10px] mt-0.5 leading-tight opacity-70">
                        {hint}
                      </p>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <InfoBadge
                  isDark={isDark}
                  variant="info"
                  text="When multiple rows share the same X label, choose how to combine them."
                />
                <div className="grid grid-cols-2 gap-1.5 mt-2">
                  {(
                    [
                      ["none", "No grouping"],
                      ["sum", "Sum"],
                      ["avg", "Average"],
                      ["count", "Count rows"],
                    ] as const
                  ).map(([mode, label]) => (
                    <button
                      key={mode}
                      onClick={() => onUpdate({ aggregateMode: mode })}
                      className="py-2 text-[11px] font-semibold rounded-lg border-2 transition-all"
                      style={{
                        borderColor:
                          chart.aggregateMode === mode ? ACCENT : border,
                        background:
                          chart.aggregateMode === mode
                            ? `${ACCENT}15`
                            : inputBg,
                        color: chart.aggregateMode === mode ? ACCENT : sub,
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* ── Y-Axis (numeric series) — only shown when needed ─── */}
          {(needsY || (isCat && chart.aggregateMode !== "count")) && (
            <>
              <Divider isDark={isDark} />
              <YAxisSection
                chart={chart}
                isDark={isDark}
                numericCols={numericCols}
                onUpdate={onUpdate}
                isCat={isCat}
                text={text}
                muted={muted}
                sub={sub}
                border={border}
                inputBg={inputBg}
              />
            </>
          )}

          <Divider isDark={isDark} />

          {/* ── Max X labels ─── */}
          {!isCat && (
            <div>
              <SectionLabel isDark={isDark}>Max X-Axis Labels</SectionLabel>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={4}
                  max={50}
                  step={1}
                  value={chart.maxXLabels ?? 12}
                  onChange={(e) =>
                    onUpdate({ maxXLabels: Number(e.target.value) })
                  }
                  className="flex-1"
                  style={{ accentColor: ACCENT }}
                />
                <span
                  className="text-[12px] font-bold w-8 text-right shrink-0"
                  style={{ color: text }}
                >
                  {chart.maxXLabels ?? 12}
                </span>
              </div>
            </div>
          )}

          {/* ── Config summary ─── */}
          {chart.labelColumnKey && (
            <>
              <Divider isDark={isDark} />
              <ConfigSummary
                chart={chart}
                columns={allCols}
                isDark={isDark}
                text={text}
                sub={sub}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  Y-AXIS SECTION (shared, shown only when relevant)
// ─────────────────────────────────────────────────────────────

function YAxisSection({
  chart,
  isDark,
  numericCols,
  onUpdate,
  isCat,
  text,
  muted,
  sub,
  border,
  inputBg,
}: {
  chart: SheetChart;
  isDark: boolean;
  numericCols: ColumnDef[];
  isCat: boolean;
  onUpdate: (p: Partial<SheetChart>) => void;
  text: string;
  muted: string;
  sub: string;
  border: string;
  inputBg: string;
}) {
  void sub;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <SectionLabel isDark={isDark}>
          {isCat ? "Value Column (optional)" : "Y-Axis (Values / Series)"}
        </SectionLabel>
        {!isCat && (
          <button
            onClick={() => {
              const remaining = numericCols.filter(
                (c) => !chart.seriesKeys.includes(c.key),
              );
              if (remaining[0])
                onUpdate({
                  seriesKeys: [...chart.seriesKeys, remaining[0].key],
                });
            }}
            className="flex items-center gap-1 text-[10.5px] font-semibold px-2 py-1 rounded-md"
            style={{ color: ACCENT, background: `${ACCENT}15` }}
          >
            <Plus className="h-3 w-3" /> Add Series
          </button>
        )}
      </div>

      {numericCols.length === 0 ? (
        <InfoBadge
          isDark={isDark}
          variant="warn"
          text="No numeric columns found in this sheet. Add a Number or Currency column to use as values."
        />
      ) : (
        <>
          {isCat ? (
            // Single column picker for categorical charts
            <select
              style={{
                background: inputBg,
                border: `1px solid ${isDark ? "#1e2330" : "#e2e8f0"}`,
                color: text,
                borderRadius: "8px",
                padding: "6px 10px",
                fontSize: "12px",
                width: "100%",
                outline: "none",
              }}
              value={chart.seriesKeys[0] ?? ""}
              onChange={(e) =>
                onUpdate({ seriesKeys: e.target.value ? [e.target.value] : [] })
              }
            >
              <option value="">— Auto-count (no column needed) —</option>
              {numericCols.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.name} ({c.type})
                </option>
              ))}
            </select>
          ) : (
            // Multi-series for other charts
            <>
              {chart.seriesKeys.length === 0 ? (
                <button
                  onClick={() =>
                    numericCols[0] &&
                    onUpdate({ seriesKeys: [numericCols[0].key] })
                  }
                  className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl border-2 border-dashed text-[11.5px] font-semibold"
                  style={{ borderColor: `${ACCENT}60`, color: ACCENT }}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Y-axis column
                </button>
              ) : (
                <div className="space-y-2">
                  {chart.seriesKeys.map((key, idx) => (
                    <div
                      key={key}
                      className="flex items-center gap-2 px-2 py-2 rounded-lg border"
                      style={{
                        borderColor: border,
                        background: isDark ? "#0f1117" : "#f8fafc",
                      }}
                    >
                      <GripVertical
                        className="h-3.5 w-3.5 shrink-0"
                        style={{ color: muted }}
                      />
                      <div
                        className="h-3 w-3 rounded-full shrink-0"
                        style={{
                          background:
                            SCHEME_COLORS[chart.colorScheme]?.[idx] ?? ACCENT,
                        }}
                      />
                      <select
                        style={{
                          background: "transparent",
                          border: "none",
                          color: text,
                          padding: "0",
                          flex: 1,
                          fontSize: "12px",
                          outline: "none",
                        }}
                        value={key}
                        onChange={(e) => {
                          const next = [...chart.seriesKeys];
                          next[idx] = e.target.value;
                          onUpdate({ seriesKeys: next });
                        }}
                      >
                        {numericCols.map((c) => (
                          <option key={c.key} value={c.key}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() =>
                          onUpdate({
                            seriesKeys: chart.seriesKeys.filter(
                              (_, i) => i !== idx,
                            ),
                          })
                        }
                        className="shrink-0 p-0.5 rounded hover:text-red-400 transition-colors"
                        style={{ color: muted }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  CONFIG SUMMARY
// ─────────────────────────────────────────────────────────────

function ConfigSummary({
  chart,
  columns,
  isDark,
  text,
  sub,
}: {
  chart: SheetChart;
  columns: ColumnDef[];
  isDark: boolean;
  text: string;
  sub: string;
}) {
  void isDark;
  const isCat = CATEGORICAL_KINDS.has(chart.kind);
  const xCol = columns.find((c) => c.key === chart.labelColumnKey);
  const yColNames = chart.seriesKeys
    .map((k) => columns.find((c) => c.key === k)?.name ?? k)
    .join(", ");
  const isReady = isCat
    ? !!chart.labelColumnKey
    : !!chart.labelColumnKey && chart.seriesKeys.length > 0;

  if (!isReady) return null;

  return (
    <div
      className="px-3 py-2.5 rounded-xl text-[11px]"
      style={{ background: `${ACCENT}12`, border: `1px solid ${ACCENT}30` }}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <Sparkles className="h-3 w-3" style={{ color: ACCENT }} />
        <p className="font-bold" style={{ color: ACCENT }}>
          Chart ready to render
        </p>
      </div>
      <p style={{ color: sub }}>
        <strong style={{ color: text }}>{chart.kind.toUpperCase()}</strong>
        {" · "}Grouping: <strong style={{ color: text }}>{xCol?.name}</strong>
        {isCat && chart.aggregateMode === "count" && (
          <span style={{ color: ACCENT }}> (counting rows)</span>
        )}
        {yColNames && (
          <>
            {" "}
            · Values: <strong style={{ color: text }}>{yColNames}</strong>
          </>
        )}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  MANUAL DATA EDITOR
// ─────────────────────────────────────────────────────────────

function ManualDataEditor({
  chart,
  isDark,
  onUpdate,
  text,
  muted,
  sub,
  border,
  inputBg,
  inputBorder,
}: {
  chart: SheetChart;
  isDark: boolean;
  onUpdate: (p: Partial<SheetChart>) => void;
  text: string;
  muted: string;
  sub: string;
  border: string;
  inputBg: string;
  inputBorder: string;
}) {
  void sub;
  const isCat = CATEGORICAL_KINDS.has(chart.kind);

  const inputStyle: React.CSSProperties = {
    background: inputBg,
    border: `1px solid ${inputBorder}`,
    color: text,
    borderRadius: "8px",
    padding: "6px 10px",
    fontSize: "12px",
    width: "100%",
    outline: "none",
  };

  return (
    <div className="space-y-4">
      <InfoBadge
        isDark={isDark}
        variant="info"
        text={
          isCat
            ? "Enter category names and their values below. For count-style charts, just enter the counts directly."
            : "Enter comma-separated labels for X, then numeric values for each series."
        }
      />

      {/* Categories */}
      <div>
        <SectionLabel isDark={isDark}>
          {isCat ? "Slice Labels" : "Categories (X-Axis)"}
        </SectionLabel>
        <input
          style={inputStyle}
          placeholder={
            isCat ? "Open, In Progress, Closed…" : "Jan, Feb, Mar, Apr…"
          }
          defaultValue={chart.manualCategories.join(", ")}
          onBlur={(e) => {
            const cats = e.target.value
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean);
            onUpdate({ manualCategories: cats });
          }}
        />
        <p className="text-[10px] mt-1" style={{ color: muted }}>
          {chart.manualCategories.length} categories · comma-separated
        </p>
      </div>

      <Divider isDark={isDark} />

      {/* Series */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <SectionLabel isDark={isDark}>
            {isCat ? "Values" : "Series (Y-Axis Values)"}
          </SectionLabel>
          {!isCat && (
            <button
              onClick={() =>
                onUpdate({
                  manualSeries: [
                    ...chart.manualSeries,
                    {
                      name: `Series ${chart.manualSeries.length + 1}`,
                      values: [],
                    },
                  ],
                })
              }
              className="flex items-center gap-1 text-[10.5px] font-semibold px-2 py-1 rounded-md"
              style={{ color: ACCENT, background: `${ACCENT}15` }}
            >
              <Plus className="h-3 w-3" /> Add
            </button>
          )}
        </div>

        <div className="space-y-3">
          {chart.manualSeries.map((series, idx) => (
            <div
              key={idx}
              className="rounded-xl border p-3 space-y-2"
              style={{
                borderColor: border,
                background: isDark ? "#0f1117" : "#f8fafc",
              }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full shrink-0"
                  style={{
                    background:
                      SCHEME_COLORS[chart.colorScheme]?.[idx] ?? ACCENT,
                  }}
                />
                {!isCat && (
                  <input
                    style={{
                      ...inputStyle,
                      border: "none",
                      background: "transparent",
                      padding: "0",
                      flex: 1,
                      fontWeight: 600,
                    }}
                    defaultValue={series.name}
                    placeholder="Series name"
                    onBlur={(e) => {
                      const next = [...chart.manualSeries];
                      next[idx] = { ...next[idx], name: e.target.value };
                      onUpdate({ manualSeries: next });
                    }}
                  />
                )}
                {isCat && (
                  <span
                    className="flex-1 text-[12px] font-semibold"
                    style={{ color: text }}
                  >
                    Values (match slice labels order)
                  </span>
                )}
                {chart.manualSeries.length > 1 && (
                  <button
                    onClick={() =>
                      onUpdate({
                        manualSeries: chart.manualSeries.filter(
                          (_, i) => i !== idx,
                        ),
                      })
                    }
                    style={{ color: muted }}
                  >
                    <Trash2 className="h-3.5 w-3.5 hover:text-red-400 transition-colors" />
                  </button>
                )}
              </div>
              <input
                style={inputStyle}
                placeholder="42, 78, 55, 91…"
                defaultValue={series.values.join(", ")}
                onBlur={(e) => {
                  const values = e.target.value
                    .split(",")
                    .map((s) => parseFloat(s.trim()))
                    .filter((n) => !isNaN(n));
                  const next = [...chart.manualSeries];
                  next[idx] = { ...next[idx], values };
                  onUpdate({ manualSeries: next });
                }}
              />
              <p className="text-[10px]" style={{ color: muted }}>
                {series.values.length} values
              </p>
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
  chart,
  isDark,
  onUpdate,
  text,
  muted,
  sub,
  border,
}: {
  chart: SheetChart;
  isDark: boolean;
  onUpdate: (p: Partial<SheetChart>) => void;
  text: string;
  muted: string;
  sub: string;
  border: string;
}) {
  void sub;
  return (
    <div className="space-y-4">
      {/* Chart type switcher */}
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
                background:
                  chart.kind === opt.kind
                    ? `${ACCENT}15`
                    : isDark
                      ? "#0f1117"
                      : "#f8fafc",
                color: chart.kind === opt.kind ? ACCENT : muted,
              }}
            >
              <div className="w-7 h-5">{opt.svg}</div>
              <span className="text-[9px] font-bold">{opt.label}</span>
            </button>
          ))}
        </div>

        {/* Hint when switching between categorical / non-categorical */}
        {CATEGORICAL_KINDS.has(chart.kind) && (
          <InfoBadge
            isDark={isDark}
            variant="success"
            text="Pie, Donut & Radar are auto-configured — just pick the slice column and they'll count rows for you."
          />
        )}
      </div>

      <Divider isDark={isDark} />

      {/* Color scheme */}
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
                style={{
                  borderColor: isActive ? ACCENT : border,
                  background: isActive
                    ? `${ACCENT}15`
                    : isDark
                      ? "#0f1117"
                      : "#f8fafc",
                }}
              >
                <div className="flex gap-1 shrink-0">
                  {colors.slice(0, 5).map((c) => (
                    <div
                      key={c}
                      className="h-3.5 w-3.5 rounded-full"
                      style={{ background: c }}
                    />
                  ))}
                </div>
                <span
                  className="text-[12px] font-medium flex-1 text-left"
                  style={{ color: text }}
                >
                  {SCHEME_LABELS[scheme]}
                </span>
                {isActive && (
                  <Check
                    className="h-3.5 w-3.5 shrink-0"
                    style={{ color: ACCENT }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <Divider isDark={isDark} />

      {/* Display toggles */}
      <div>
        <SectionLabel isDark={isDark}>Display Options</SectionLabel>
        <div className="divide-y" style={{ borderColor: border }}>
          <Toggle
            value={chart.showLegend}
            onChange={(v) => onUpdate({ showLegend: v })}
            label="Show Legend"
            isDark={isDark}
          />
          <Toggle
            value={chart.showGrid}
            onChange={(v) => onUpdate({ showGrid: v })}
            label="Show Grid Lines"
            isDark={isDark}
          />
          <Toggle
            value={chart.showLabels}
            onChange={(v) => onUpdate({ showLabels: v })}
            label="Show Data Labels"
            isDark={isDark}
          />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  FORMAT TAB
// ─────────────────────────────────────────────────────────────

function FormatTab({
  chart,
  isDark,
  onUpdate,
  onRemove,
  text,
  muted,
  sub,
  border,
  inputBg,
  inputBorder,
}: {
  chart: SheetChart;
  isDark: boolean;
  onUpdate: (p: Partial<SheetChart>) => void;
  onRemove: () => void;
  text: string;
  muted: string;
  sub: string;
  border: string;
  inputBg: string;
  inputBorder: string;
}) {
  const [title, setTitle] = useState(chart.title ?? "");

  useEffect(() => {
    setTitle(chart.title ?? "");
  }, [chart.title]);

  const inputStyle: React.CSSProperties = {
    background: inputBg,
    border: `1px solid ${inputBorder}`,
    color: text,
    borderRadius: "8px",
    padding: "6px 10px",
    fontSize: "12px",
    width: "100%",
    outline: "none",
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
        <SectionLabel isDark={isDark}>Size (Desktop)</SectionLabel>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              [
                "Width (px)",
                chart.width,
                280,
                1400,
                (v: number) => onUpdate({ width: v }),
              ],
              [
                "Height (px)",
                chart.height,
                180,
                900,
                (v: number) => onUpdate({ height: v }),
              ],
            ] as const
          ).map(([label, val, min, max, setter]) => (
            <div key={label}>
              <label
                className="text-[10.5px] block mb-1"
                style={{ color: muted }}
              >
                {label}
              </label>
              <input
                style={inputStyle}
                type="number"
                min={min}
                max={max}
                defaultValue={val}
                onBlur={(e) => setter(Math.max(min, Number(e.target.value)))}
              />
            </div>
          ))}
        </div>
        <p className="text-[10px] mt-1.5" style={{ color: muted }}>
          On mobile, charts fill the full column width automatically.
        </p>
      </div>

      <Divider isDark={isDark} />

      {/* Meta */}
      <div
        className="px-3 py-2.5 rounded-xl space-y-1"
        style={{
          background: isDark ? "#0f1117" : "#f8fafc",
          border: `1px solid ${border}`,
        }}
      >
        {(
          [
            {
              label: "ID",
              render: () => (
                <span className="font-mono text-[10px]">{chart.id}</span>
              ),
            },
            {
              label: "Kind",
              render: () => (
                <strong style={{ color: text }}>{chart.kind}</strong>
              ),
            },
            {
              label: "Mode",
              render: () => (
                <strong style={{ color: text }}>{chart.dataMode}</strong>
              ),
            },
            {
              label: "Position",
              render: () => (
                <strong style={{ color: text }}>
                  {Math.round(chart.x)}, {Math.round(chart.y)}
                </strong>
              ),
            },
          ] as const
        ).map((item) => (
          <p key={item.label} className="text-[11px]" style={{ color: sub }}>
            {item.label}: {item.render()}
          </p>
        ))}
      </div>

      <Divider isDark={isDark} />

      <div>
        <SectionLabel isDark={isDark}>Danger Zone</SectionLabel>
        <button
          onClick={onRemove}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-[12px] font-semibold transition-colors"
          style={{ borderColor: "#ef4444", color: "#ef4444" }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLElement).style.background = "#ef444415")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLElement).style.background = "transparent")
          }
        >
          <Trash2 className="h-3.5 w-3.5" /> Remove Chart
        </button>
      </div>
    </div>
  );
}

