"use client";

/**
 * components/individual/sheet/Charts-picker.tsx
 *
 * Floating chart-type picker.
 * Smart suggestions derived from the sheet's actual column types.
 *
 * CORRECTED:
 *  - Donut/Pie suggestions use COUNT mode — no numeric column needed
 *  - Suggestions work with any categorical column (status, priority, assignee, etc.)
 *  - "Tasks per Assignee" type charts now suggested automatically
 *  - Manual entry preset correctly populates manualCategories & manualSeries
 */

import { useEffect, useRef, useMemo } from "react";
import { X, Sparkles } from "lucide-react";
import type { ChartKind, SheetChart } from "@/hooks/sheets/use-charts";
import type { SheetRow, ColumnDef } from "@/types/index";

// ─────────────────────────────────────────────────────────────
//  CHART TYPE GRID DEFINITIONS
// ─────────────────────────────────────────────────────────────

interface ChartTypeDef {
  kind: ChartKind;
  label: string;
  description: string;
  group: "Basic" | "Circular" | "Advanced";
  svg: React.ReactNode;
}

const CHART_TYPES: ChartTypeDef[] = [
  {
    kind: "bar",
    label: "Bar",
    description: "Horizontal bars",
    group: "Basic",
    svg: (
      <svg viewBox="0 0 40 32" fill="none" className="w-full h-full">
        <rect
          x="2"
          y="4"
          width="36"
          height="6"
          rx="2"
          fill="currentColor"
          opacity="0.9"
        />
        <rect
          x="2"
          y="13"
          width="26"
          height="6"
          rx="2"
          fill="currentColor"
          opacity="0.65"
        />
        <rect
          x="2"
          y="22"
          width="32"
          height="6"
          rx="2"
          fill="currentColor"
          opacity="0.4"
        />
      </svg>
    ),
  },
  {
    kind: "column",
    label: "Column",
    description: "Vertical bars",
    group: "Basic",
    svg: (
      <svg viewBox="0 0 40 32" fill="none" className="w-full h-full">
        <rect
          x="3"
          y="16"
          width="6"
          height="14"
          rx="2"
          fill="currentColor"
          opacity="0.9"
        />
        <rect
          x="12"
          y="8"
          width="6"
          height="22"
          rx="2"
          fill="currentColor"
          opacity="0.7"
        />
        <rect
          x="21"
          y="12"
          width="6"
          height="18"
          rx="2"
          fill="currentColor"
          opacity="0.5"
        />
        <rect
          x="30"
          y="4"
          width="6"
          height="26"
          rx="2"
          fill="currentColor"
          opacity="0.85"
        />
      </svg>
    ),
  },
  {
    kind: "line",
    label: "Line",
    description: "Trend over time",
    group: "Basic",
    svg: (
      <svg viewBox="0 0 40 32" fill="none" className="w-full h-full">
        <polyline
          points="2,26 10,18 18,22 26,10 34,6 38,14"
          stroke="currentColor"
          strokeWidth="2.5"
          fill="none"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {[2, 10, 18, 26, 34, 38].map((cx, i) => {
          const cy = [26, 18, 22, 10, 6, 14][i];
          return <circle key={i} cx={cx} cy={cy} r="2.5" fill="currentColor" />;
        })}
      </svg>
    ),
  },
  {
    kind: "area",
    label: "Area",
    description: "Volume over time",
    group: "Basic",
    svg: (
      <svg viewBox="0 0 40 32" fill="none" className="w-full h-full">
        <path
          d="M2,28 L2,20 L10,14 L18,18 L26,8 L34,4 L38,10 L38,28 Z"
          fill="currentColor"
          opacity="0.25"
        />
        <polyline
          points="2,20 10,14 18,18 26,8 34,4 38,10"
          stroke="currentColor"
          strokeWidth="2.5"
          fill="none"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    kind: "pie",
    label: "Pie",
    description: "Part of whole",
    group: "Circular",
    svg: (
      <svg viewBox="0 0 40 32" fill="none" className="w-full h-full">
        <circle cx="20" cy="16" r="13" fill="currentColor" opacity="0.15" />
        <path
          d="M20,16 L20,3 A13,13 0 0,1 31.26,22.5 Z"
          fill="currentColor"
          opacity="0.9"
        />
        <path
          d="M20,16 L31.26,22.5 A13,13 0 0,1 8.74,22.5 Z"
          fill="currentColor"
          opacity="0.6"
        />
        <path
          d="M20,16 L8.74,22.5 A13,13 0 0,1 20,3 Z"
          fill="currentColor"
          opacity="0.35"
        />
      </svg>
    ),
  },
  {
    kind: "donut",
    label: "Donut",
    description: "Pie with KPI center",
    group: "Circular",
    svg: (
      <svg viewBox="0 0 40 32" fill="none" className="w-full h-full">
        <circle
          cx="20"
          cy="16"
          r="13"
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          strokeOpacity="0.15"
        />
        <circle
          cx="20"
          cy="16"
          r="13"
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          strokeDasharray="40 42"
          opacity="0.9"
          strokeLinecap="round"
        />
        <circle
          cx="20"
          cy="16"
          r="13"
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          strokeDasharray="25 57"
          strokeDashoffset="-40"
          opacity="0.55"
          strokeLinecap="round"
        />
        <circle
          cx="20"
          cy="16"
          r="7"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeOpacity="0.2"
        />
      </svg>
    ),
  },
  {
    kind: "scatter",
    label: "Scatter",
    description: "Correlation & spread",
    group: "Advanced",
    svg: (
      <svg viewBox="0 0 40 32" fill="none" className="w-full h-full">
        {(
          [
            [6, 24],
            [10, 12],
            [14, 20],
            [18, 8],
            [20, 18],
            [24, 14],
            [28, 22],
            [30, 6],
            [34, 16],
            [36, 26],
          ] as [number, number][]
        ).map(([cx, cy], i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r="2.5"
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
    description: "Multi-axis compare",
    group: "Advanced",
    svg: (
      <svg viewBox="0 0 40 32" fill="none" className="w-full h-full">
        <polygon
          points="20,2 36,12 30,30 10,30 4,12"
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.2"
          strokeWidth="1"
        />
        <polygon
          points="20,8 30,14 26,26 14,26 10,14"
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.15"
          strokeWidth="1"
        />
        <polygon
          points="20,5 33,13 28,28 12,28 7,13"
          fill="currentColor"
          opacity="0.2"
        />
        <polygon
          points="20,5 33,13 28,28 12,28 7,13"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          opacity="0.9"
        />
      </svg>
    ),
  },
];

const GROUPS: ChartTypeDef["group"][] = ["Basic", "Circular", "Advanced"];

// ─────────────────────────────────────────────────────────────
//  SMART SUGGESTION BUILDER
//
//  Rules:
//   1. Any column with text / status / priority / select / date values
//      → can be charted as donut/pie (COUNT mode, no Y column needed)
//   2. Numeric columns + a label column → bar / column / line
//   3. Checkbox columns → donut done-vs-pending
// ─────────────────────────────────────────────────────────────

interface Suggestion {
  label: string;
  kind: ChartKind;
  description: string;
  preset: Partial<SheetChart>;
  svg: React.ReactNode;
}

function buildSuggestions(
  rows: SheetRow[],
  columns: ColumnDef[],
): Suggestion[] {
  const suggestions: Suggestion[] = [];

  // Columns that carry categorical data (good for grouping)
  const catCols = columns.filter((c) =>
    ["text", "status", "priority", "select"].includes(c.type ?? "text"),
  );
  // Numeric columns
  const numCols = columns.filter((c) =>
    ["number", "currency", "progress"].includes(c.type ?? "text"),
  );
  const dateCol = columns.find(
    (c) => c.type === "date" || ["date", "due", "start"].includes(c.key),
  );
  const checkCols = columns.filter((c) => c.type === "checkbox");

  // ── For every categorical column, suggest a donut count chart ──
  catCols.forEach((col) => {
    // Count unique values
    const seen = new Set<string>();
    rows.forEach((r) => {
      const v = String(r[col.key] ?? "").trim();
      if (v) seen.add(v);
    });
    if (seen.size < 2 || seen.size > 12) return; // skip trivial or huge

    const isStatus =
      col.key === "status" || col.name?.toLowerCase() === "status";
    const isPriority =
      col.key === "priority" || col.name?.toLowerCase() === "priority";
    const isAssignee =
      col.name?.toLowerCase().includes("assign") ||
      col.name?.toLowerCase().includes("owner");

    const label = isStatus
      ? "Status Overview"
      : isPriority
        ? "Priority Breakdown"
        : isAssignee
          ? `Tasks per ${col.name}`
          : `By ${col.name}`;

    const kind: ChartKind = isAssignee ? "bar" : isStatus ? "donut" : "column";

    suggestions.push({
      label,
      kind,
      description: `Count items grouped by ${col.name}`,
      preset: {
        title: label,
        dataMode: "sheet",
        labelColumnKey: col.key,
        seriesKeys: [],
        aggregateMode: "count",
        colorScheme: isStatus ? "forest" : isPriority ? "sunset" : "ocean",
        showLegend: true,
        showLabels: kind === "donut",
      },
      svg: (
        <svg viewBox="0 0 32 24" fill="none">
          {kind === "donut" ? (
            <>
              <circle
                cx="16"
                cy="12"
                r="9"
                fill="none"
                stroke="#1a7a4a"
                strokeWidth="5"
                strokeOpacity="0.15"
              />
              <circle
                cx="16"
                cy="12"
                r="9"
                fill="none"
                stroke="#1a7a4a"
                strokeWidth="5"
                strokeDasharray="28 29"
                opacity="0.9"
                strokeLinecap="round"
              />
              <circle
                cx="16"
                cy="12"
                r="9"
                fill="none"
                stroke="#22c55e"
                strokeWidth="5"
                strokeDasharray="18 39"
                strokeDashoffset="-28"
                opacity="0.6"
                strokeLinecap="round"
              />
            </>
          ) : kind === "bar" ? (
            <>
              <rect
                x="2"
                y="2"
                width="20"
                height="4"
                rx="1"
                fill="#0ea5e9"
                opacity="0.9"
              />
              <rect
                x="2"
                y="9"
                width="14"
                height="4"
                rx="1"
                fill="#0ea5e9"
                opacity="0.65"
              />
              <rect
                x="2"
                y="16"
                width="17"
                height="4"
                rx="1"
                fill="#0ea5e9"
                opacity="0.4"
              />
            </>
          ) : (
            <>
              <rect
                x="2"
                y="12"
                width="5"
                height="10"
                rx="1"
                fill="#f59e0b"
                opacity="0.9"
              />
              <rect
                x="9"
                y="6"
                width="5"
                height="16"
                rx="1"
                fill="#f97316"
                opacity="0.8"
              />
              <rect
                x="16"
                y="14"
                width="5"
                height="8"
                rx="1"
                fill="#22c55e"
                opacity="0.7"
              />
              <rect
                x="23"
                y="10"
                width="5"
                height="12"
                rx="1"
                fill="#94a3b8"
                opacity="0.5"
              />
            </>
          )}
        </svg>
      ),
    });
  });

  // ── Numeric trend (date + numeric) ──
  if (dateCol && numCols.length > 0) {
    suggestions.push({
      label: "Trend Over Time",
      kind: "line",
      description: `${numCols[0].name} over ${dateCol.name}`,
      preset: {
        title: `${numCols[0].name} Over Time`,
        dataMode: "sheet",
        labelColumnKey: dateCol.key,
        seriesKeys: [numCols[0].key],
        aggregateMode: "none",
        maxXLabels: 12,
        colorScheme: "ocean",
        showGrid: true,
        showLegend: false,
      },
      svg: (
        <svg viewBox="0 0 32 24" fill="none">
          <polyline
            points="2,20 8,14 14,17 20,8 26,4 30,10"
            stroke="#0ea5e9"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
          <circle cx="8" cy="14" r="2" fill="#0ea5e9" />
          <circle cx="20" cy="8" r="2" fill="#0ea5e9" />
          <circle cx="30" cy="10" r="2" fill="#0ea5e9" />
        </svg>
      ),
    });
  }

  // ── Multi-metric comparison ──
  if (numCols.length >= 2) {
    const labelCol =
      columns.find(
        (c) =>
          c.name?.toLowerCase().includes("name") ||
          c.name?.toLowerCase().includes("title"),
      ) ??
      catCols[0] ??
      columns[0];

    if (labelCol) {
      suggestions.push({
        label: "Compare Metrics",
        kind: "bar",
        description: `${numCols
          .slice(0, 2)
          .map((c) => c.name)
          .join(" vs ")}`,
        preset: {
          title: "Metrics Comparison",
          dataMode: "sheet",
          labelColumnKey: labelCol.key,
          seriesKeys: numCols.slice(0, 2).map((c) => c.key),
          aggregateMode: "none",
          maxXLabels: 10,
          colorScheme: "corporate",
        },
        svg: (
          <svg viewBox="0 0 32 24" fill="none">
            <rect
              x="2"
              y="4"
              width="20"
              height="5"
              rx="1"
              fill="#1d4ed8"
              opacity="0.9"
            />
            <rect
              x="2"
              y="11"
              width="14"
              height="5"
              rx="1"
              fill="#7c3aed"
              opacity="0.8"
            />
            <rect
              x="2"
              y="18"
              width="17"
              height="4"
              rx="1"
              fill="#059669"
              opacity="0.7"
            />
          </svg>
        ),
      });
    }
  }

  // ── Checkbox completion ──
  if (checkCols.length > 0) {
    let done = 0,
      pending = 0;
    rows.forEach((r) => {
      checkCols.forEach((c) => {
        r[c.key] ? done++ : pending++;
      });
    });
    if (done + pending > 0) {
      suggestions.push({
        label: "Task Completion",
        kind: "donut",
        description: "Done vs pending",
        preset: {
          title: "Task Completion",
          dataMode: "manual",
          manualCategories: ["Done", "Pending"],
          manualSeries: [{ name: "Tasks", values: [done, pending] }],
          colorScheme: "forest",
          showLabels: true,
          showLegend: true,
        },
        svg: (
          <svg viewBox="0 0 32 24" fill="none">
            <circle
              cx="16"
              cy="12"
              r="9"
              fill="none"
              stroke="#22c55e"
              strokeWidth="5"
              strokeDasharray="35 22"
              opacity="0.9"
              strokeLinecap="round"
            />
            <circle
              cx="16"
              cy="12"
              r="9"
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="5"
              strokeDasharray="20 37"
              strokeDashoffset="-35"
              opacity="0.5"
              strokeLinecap="round"
            />
          </svg>
        ),
      });
    }
  }

  // Deduplicate same kind+labelColumnKey
  const seen = new Set<string>();
  return suggestions
    .filter((s) => {
      const key = `${s.kind}-${(s.preset as any).labelColumnKey ?? s.kind}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 6); // max 6 suggestions
}

// ─────────────────────────────────────────────────────────────
//  COMPONENT
// ─────────────────────────────────────────────────────────────

interface ChartPickerProps {
  isDark: boolean;
  anchorRef?: React.RefObject<HTMLElement | null>;
  rows: SheetRow[];
  columns: ColumnDef[];
  onSelect: (kind: ChartKind, preset?: Partial<SheetChart>) => void;
  onClose: () => void;
}

export default function ChartPicker({
  isDark,
  anchorRef,
  rows,
  columns,
  onSelect,
  onClose,
}: ChartPickerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const suggestions = useMemo(
    () => buildSuggestions(rows, columns),
    [rows, columns],
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        ref.current &&
        !ref.current.contains(e.target as Node) &&
        !anchorRef?.current?.contains(e.target as Node)
      )
        onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose, anchorRef]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const bg = isDark ? "#131620" : "#ffffff";
  const border = isDark ? "#1e2330" : "#e2e8f0";
  const text = isDark ? "#e2e8f0" : "#0f172a";
  const muted = isDark ? "#475569" : "#94a3b8";
  const hoverBg = isDark ? "#1a2035" : "#f8fafc";
  const accent = "#1a7a4a";

  const cardHover = (
    e: React.MouseEvent<HTMLButtonElement>,
    enter: boolean,
  ) => {
    const el = e.currentTarget;
    el.style.borderColor = enter ? accent : border;
    el.style.background = enter ? `${accent}12` : "transparent";
    el.style.transform = enter ? "translateY(-1px)" : "translateY(0)";
  };

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        ref={ref}
        className="fixed z-50 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        style={{
          bottom: "52px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "min(580px, 95vw)",
          maxHeight: "min(560px, 85vh)",
          border: `1.5px solid ${border}`,
          background: bg,
          boxShadow: isDark
            ? "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)"
            : "0 32px 80px rgba(0,0,0,0.18)",
          animation: "chartPickerIn 0.18s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3.5 border-b shrink-0"
          style={{ borderColor: border }}
        >
          <div>
            <p className="text-[13px] font-semibold" style={{ color: text }}>
              Insert Chart
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: muted }}>
              Choose a type — configure data in the Charts panel →
            </p>
          </div>
          <button
            onClick={onClose}
            className="h-7 w-7 rounded-lg flex items-center justify-center transition-colors"
            style={{ color: muted }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.background = hoverBg)
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.background =
                "transparent")
            }
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-4 space-y-5">
          {/* ── Suggestions ── */}
          {suggestions.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2.5">
                <Sparkles className="h-3.5 w-3.5" style={{ color: accent }} />
                <p
                  className="text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: accent }}
                >
                  Suggested for your data
                </p>
              </div>
              <div
                className="grid gap-2"
                style={{
                  gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
                }}
              >
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => onSelect(s.kind, s.preset)}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all text-left"
                    style={{
                      borderColor: `${accent}50`,
                      background: `${accent}08`,
                      transition: "all 0.12s",
                    }}
                    onMouseEnter={(e) => cardHover(e, true)}
                    onMouseLeave={(e) => cardHover(e, false)}
                  >
                    <div className="w-8 h-6 shrink-0" style={{ color: accent }}>
                      {s.svg}
                    </div>
                    <div className="w-full">
                      <p
                        className="text-[11px] font-semibold leading-tight"
                        style={{ color: text }}
                      >
                        {s.label}
                      </p>
                      <p
                        className="text-[9.5px] mt-0.5 leading-tight opacity-60"
                        style={{ color: text }}
                      >
                        {s.description}
                      </p>
                    </div>
                    <span
                      className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full self-start"
                      style={{ background: `${accent}20`, color: accent }}
                    >
                      {s.kind}
                    </span>
                  </button>
                ))}
              </div>

              {/* Divider before all types */}
              <div
                className="mt-4 pt-4 border-t"
                style={{ borderColor: border }}
              >
                <p
                  className="text-[10px] font-bold uppercase tracking-widest mb-2.5"
                  style={{ color: muted }}
                >
                  All Chart Types
                </p>
              </div>
            </div>
          )}

          {/* ── All types ── */}
          {suggestions.length === 0 && (
            <p
              className="text-[10px] font-bold uppercase tracking-widest mb-2.5"
              style={{ color: muted }}
            >
              All Chart Types
            </p>
          )}

          {GROUPS.map((group) => (
            <div key={group}>
              <p
                className="text-[10px] font-semibold uppercase tracking-widest mb-2 px-1"
                style={{ color: muted }}
              >
                {group}
              </p>
              <div
                className="grid gap-2"
                style={{
                  gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
                }}
              >
                {CHART_TYPES.filter((c) => c.group === group).map((ct) => (
                  <button
                    key={ct.kind}
                    onClick={() => onSelect(ct.kind)}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-150"
                    style={{
                      borderColor: border,
                      background: "transparent",
                      color: muted,
                      transition: "all 0.12s",
                    }}
                    onMouseEnter={(e) => cardHover(e, true)}
                    onMouseLeave={(e) => cardHover(e, false)}
                  >
                    <div className="w-10 h-8">{ct.svg}</div>
                    <span
                      className="text-[11px] font-semibold"
                      style={{ color: text }}
                    >
                      {ct.label}
                    </span>
                    <span
                      className="text-[9.5px] text-center opacity-60"
                      style={{ color: text }}
                    >
                      {ct.description}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div
          className="px-5 py-2.5 border-t text-center shrink-0"
          style={{ borderColor: border }}
        >
          <p className="text-[10.5px]" style={{ color: muted }}>
            Pie · Donut · Radar automatically count rows — no numeric column
            required
          </p>
        </div>
      </div>

      <style>{`
        @keyframes chartPickerIn {
          from { opacity: 0; transform: translateX(-50%) translateY(8px) scale(0.97); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0)  scale(1); }
        }
      `}</style>
    </>
  );
}
