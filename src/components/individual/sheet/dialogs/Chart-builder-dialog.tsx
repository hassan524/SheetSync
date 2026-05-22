"use client";

/**
 * components/individual/sheet/dialogs/ChartBuilderDialog.tsx
 *
 * Professional chart builder dialog — Zoho/Google Sheets style.
 * • Auto-detects sheet data (populated template vs blank sheet)
 * • Manual data entry for blank sheets
 * • Live ApexCharts preview inside dialog
 * • Calls onInsert(chart) — no DB save, caller adds to in-memory state
 */

import { useState, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  X,
  Plus,
  Trash2,
  RefreshCw,
  Check,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import type { SheetRow, ColumnDef } from "@/types/index";
import type {
  InsertedChartType,
  InsertedChart,
} from "@/hooks/sheets/use-inserted-charts";

const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

// ─────────────────────────────────────────────
//  CONSTANTS
// ─────────────────────────────────────────────

const NUMERIC_TYPES = new Set(["number", "currency", "progress", "percent"]);
const LABEL_TYPES = new Set(["text", "status", "priority", "select", "date"]);
const EXTRA_COL_RE = /^__extra_/;

type ColorScheme =
  | "ocean"
  | "sunset"
  | "forest"
  | "candy"
  | "monochrome"
  | "corporate";
type DataMode = "sheet" | "manual";
type Tab = "type" | "data" | "customize";

const COLOR_SCHEMES: Record<ColorScheme, { label: string; colors: string[] }> =
  {
    ocean: {
      label: "Ocean",
      colors: ["#0ea5e9", "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6"],
    },
    sunset: {
      label: "Sunset",
      colors: ["#f59e0b", "#f97316", "#ef4444", "#ec4899", "#a855f7"],
    },
    forest: {
      label: "Forest",
      colors: ["#22c55e", "#16a34a", "#84cc16", "#10b981", "#14b8a6"],
    },
    candy: {
      label: "Candy",
      colors: ["#f472b6", "#fb7185", "#fbbf24", "#34d399", "#60a5fa"],
    },
    monochrome: {
      label: "Mono",
      colors: ["#1e293b", "#475569", "#94a3b8", "#64748b", "#334155"],
    },
    corporate: {
      label: "Corporate",
      colors: ["#1d4ed8", "#7c3aed", "#059669", "#d97706", "#dc2626"],
    },
  };

interface ChartTypeDef {
  id: InsertedChartType;
  label: string;
  description: string;
  group: string;
  icon: string; // emoji fallback — clean and zero-dependency
}

const CHART_TYPES: ChartTypeDef[] = [
  {
    id: "bar",
    label: "Bar",
    description: "Compare categories",
    group: "Bar",
    icon: "▊",
  },
  {
    id: "line",
    label: "Line",
    description: "Trends over time",
    group: "Line",
    icon: "╱",
  },
  {
    id: "area",
    label: "Area",
    description: "Volume over time",
    group: "Line",
    icon: "▲",
  },
  {
    id: "pie",
    label: "Pie",
    description: "Distribution",
    group: "Circular",
    icon: "◕",
  },
  {
    id: "donut",
    label: "Donut",
    description: "Distribution + KPI",
    group: "Circular",
    icon: "◎",
  },
  {
    id: "scatter",
    label: "Scatter",
    description: "Correlation",
    group: "Other",
    icon: "⁙",
  },
  {
    id: "radar",
    label: "Radar",
    description: "Multi-axis compare",
    group: "Other",
    icon: "⬡",
  },
];

// ─────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────

function realCols(cols: ColumnDef[]) {
  return cols.filter((c) => !EXTRA_COL_RE.test(c.key));
}
function labelCols(cols: ColumnDef[]) {
  return realCols(cols).filter((c) => LABEL_TYPES.has(c.type ?? "text"));
}
function numericCols(cols: ColumnDef[]) {
  return realCols(cols).filter((c) => NUMERIC_TYPES.has(c.type ?? "text"));
}
function sheetHasData(rows: SheetRow[], lc: ColumnDef[], nc: ColumnDef[]) {
  if (!lc.length || !nc.length) return false;
  const keys = [...lc.map((c) => c.key), ...nc.map((c) => c.key)];
  return rows.some((r) =>
    keys.some((k) => r[k] !== undefined && r[k] !== null && r[k] !== ""),
  );
}
function uid() {
  return Math.random().toString(36).slice(2, 9);
}

interface ManualRow {
  id: string;
  label: string;
  [k: string]: string | number;
}

function defaultManualRows(): ManualRow[] {
  return [
    { id: uid(), label: "Category A", s0: 42 },
    { id: uid(), label: "Category B", s0: 78 },
    { id: uid(), label: "Category C", s0: 35 },
    { id: uid(), label: "Category D", s0: 91 },
    { id: uid(), label: "Category E", s0: 56 },
  ];
}

// ─────────────────────────────────────────────
//  APEXCHARTS OPTIONS
// ─────────────────────────────────────────────

function buildPreviewOptions(
  chartType: InsertedChartType,
  categories: string[],
  colors: string[],
  showLegend: boolean,
  showGrid: boolean,
  isDark: boolean,
): ApexCharts.ApexOptions {
  const text = isDark ? "#94a3b8" : "#64748b";
  const grid = isDark ? "#1e2330" : "#f1f5f9";
  const isPolar = chartType === "pie" || chartType === "donut";

  return {
    chart: {
      type:
        chartType === "donut"
          ? "donut"
          : chartType === "pie"
            ? "pie"
            : (chartType as any),
      background: "transparent",
      toolbar: { show: false },
      animations: { enabled: true, speed: 300 },
      fontFamily: "inherit",
    },
    colors,
    theme: { mode: isDark ? "dark" : "light" },
    legend: {
      show: showLegend,
      position: "bottom",
      labels: { colors: text },
      fontSize: "11px",
    },
    tooltip: { theme: isDark ? "dark" : "light" },
    stroke: {
      curve: "smooth",
      width: chartType === "line" || chartType === "area" ? 2.5 : 0,
    },
    fill: { opacity: chartType === "area" ? 0.15 : 1 },
    dataLabels: { enabled: false },
    grid: {
      show: showGrid && !isPolar && chartType !== "radar",
      borderColor: grid,
      strokeDashArray: 3,
    },
    ...(!isPolar && {
      xaxis: {
        categories,
        labels: {
          style: { colors: text, fontSize: "10px" },
          rotate: categories.length > 8 ? -30 : 0,
        },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: { labels: { style: { colors: text, fontSize: "10px" } } },
    }),
    ...(isPolar && { labels: categories }),
    plotOptions: {
      bar: { borderRadius: 4 },
      pie: { donut: { size: "55%" } },
    },
  };
}

// ─────────────────────────────────────────────
//  PROPS
// ─────────────────────────────────────────────

interface ChartBuilderDialogProps {
  open: boolean;
  onClose: () => void;
  rows: SheetRow[];
  columns: ColumnDef[];
  /** Called when user clicks Insert — no DB, pure in-memory */
  onInsert: (
    chart: Omit<InsertedChart, "id" | "x" | "y" | "width" | "height">,
  ) => void;
  isDark?: boolean;
}

// ─────────────────────────────────────────────
//  COMPONENT
// ─────────────────────────────────────────────

export default function ChartBuilderDialog({
  open,
  onClose,
  rows,
  columns,
  onInsert,
  isDark = false,
}: ChartBuilderDialogProps) {
  const lc = useMemo(() => labelCols(columns), [columns]);
  const nc = useMemo(() => numericCols(columns), [columns]);
  const populated = useMemo(() => sheetHasData(rows, lc, nc), [rows, lc, nc]);

  // ── State ─────────────────────────────────
  const [tab, setTab] = useState<Tab>("type");
  const [chartType, setChartType] = useState<InsertedChartType>("bar");
  const [title, setTitle] = useState("My Chart");
  const [dataMode, setDataMode] = useState<DataMode>(() =>
    populated ? "sheet" : "manual",
  );
  const [labelKey, setLabelKey] = useState<string | null>(
    () => lc[0]?.key ?? null,
  );
  const [seriesKeys, setSeriesKeys] = useState<string[]>(() =>
    nc.slice(0, 2).map((c) => c.key),
  );
  const [manualRows, setManualRows] = useState<ManualRow[]>(defaultManualRows);
  const [manualSeries, setManualSeries] = useState([
    { id: "s0", name: "Value" },
  ]);
  const [scheme, setScheme] = useState<ColorScheme>("ocean");
  const [showLegend, setShowLegend] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [showLabels, setShowLabels] = useState(false);

  // Re-sync when dialog opens
  useEffect(() => {
    if (!open) return;
    setLabelKey(lc[0]?.key ?? null);
    setSeriesKeys(nc.slice(0, 2).map((c) => c.key));
    setDataMode(populated ? "sheet" : "manual");
    setTab("type");
    setTitle("My Chart");
  }, [open]);

  const colors = COLOR_SCHEMES[scheme].colors;

  // ── Derive preview data ───────────────────
  const previewCategories = useMemo<string[]>(() => {
    if (dataMode === "manual") return manualRows.map((r) => r.label || "—");
    if (!labelKey) return [];
    return rows
      .filter(
        (r) =>
          r[labelKey] !== undefined &&
          r[labelKey] !== null &&
          r[labelKey] !== "",
      )
      .map((r) => String(r[labelKey]));
  }, [dataMode, manualRows, rows, labelKey]);

  const previewSeries = useMemo(() => {
    if (dataMode === "manual") {
      return manualSeries.map((s) => ({
        name: s.name,
        data: manualRows.map((r) => {
          const v = r[s.id];
          return typeof v === "number" ? v : parseFloat(String(v)) || 0;
        }),
      }));
    }
    if (!labelKey) return [];
    const validRows = rows.filter(
      (r) =>
        r[labelKey] !== undefined && r[labelKey] !== null && r[labelKey] !== "",
    );
    return seriesKeys.map((key) => {
      const col = columns.find((c) => c.key === key);
      return {
        name: col?.name ?? key,
        data: validRows.map((r) => {
          const v = r[key];
          return v === undefined || v === null || v === ""
            ? 0
            : parseFloat(String(v)) || 0;
        }),
      };
    });
  }, [dataMode, manualRows, manualSeries, rows, columns, labelKey, seriesKeys]);

  const apexOptions = useMemo(
    () =>
      buildPreviewOptions(
        chartType,
        previewCategories,
        colors,
        showLegend,
        showGrid,
        isDark,
      ),
    [chartType, previewCategories, colors, showLegend, showGrid, isDark],
  );

  const apexSeries = useMemo(() => {
    if (chartType === "pie" || chartType === "donut") {
      return previewSeries[0]?.data ?? [];
    }
    return previewSeries;
  }, [chartType, previewSeries]);

  const hasData =
    previewCategories.length > 0 &&
    previewSeries.some((s) => s.data.length > 0);

  // ── Manual data helpers ───────────────────
  const addManualRow = () => {
    const newRow: ManualRow = {
      id: uid(),
      label: `Category ${manualRows.length + 1}`,
    };
    manualSeries.forEach((s) => (newRow[s.id] = 0));
    setManualRows((p) => [...p, newRow]);
  };
  const removeManualRow = (id: string) => {
    if (manualRows.length <= 1) return;
    setManualRows((p) => p.filter((r) => r.id !== id));
  };
  const updateCell = (rowId: string, key: string, val: string) => {
    setManualRows((p) =>
      p.map((r) =>
        r.id === rowId
          ? { ...r, [key]: key === "label" ? val : parseFloat(val) || 0 }
          : r,
      ),
    );
  };
  const addManualSeriesCol = () => {
    const id = `s${manualSeries.length}`;
    setManualSeries((p) => [...p, { id, name: `Series ${p.length + 1}` }]);
    setManualRows((p) => p.map((r) => ({ ...r, [id]: 0 })));
  };
  const removeManualSeriesCol = (id: string) => {
    if (manualSeries.length <= 1) return;
    setManualSeries((p) => p.filter((s) => s.id !== id));
  };

  const toggleSeriesKey = (key: string) => {
    setSeriesKeys((prev) => {
      if (prev.includes(key))
        return prev.length <= 1 ? prev : prev.filter((k) => k !== key);
      return [...prev, key];
    });
  };

  // ── Insert ────────────────────────────────
  const handleInsert = () => {
    onInsert({
      title,
      chartType,
      data: { categories: previewCategories, series: previewSeries },
      colorScheme: scheme,
      showLegend,
      showGrid,
    });
    onClose();
  };

  // ── Styles ────────────────────────────────
  const bg = isDark ? "#0f1117" : "#ffffff";
  const surface = isDark ? "#131620" : "#f8fafc";
  const border = isDark ? "#1e2330" : "#e2e8f0";
  const text = isDark ? "#e2e8f0" : "#0f172a";
  const muted = isDark ? "#475569" : "#94a3b8";
  const inputBg = isDark ? "#0a0d14" : "#ffffff";
  const accent = "#0ea5e9";

  const TABS: { id: Tab; label: string }[] = [
    { id: "type", label: "Chart Type" },
    { id: "data", label: "Data" },
    { id: "customize", label: "Style" },
  ];

  const GROUPS = [...new Set(CHART_TYPES.map((c) => c.group))];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="p-0 border-0 overflow-hidden gap-0"
        style={{
          maxWidth: "1020px",
          width: "96vw",
          maxHeight: "90vh",
          borderRadius: "18px",
          background: bg,
          boxShadow: "0 32px 80px rgba(0,0,0,0.28)",
        }}
      >
        {/* ═══ HEADER ═══════════════════════════════════ */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b shrink-0"
          style={{ borderColor: border, background: surface }}
        >
          <div className="flex items-center gap-3">
            <div
              className="h-9 w-9 rounded-xl flex items-center justify-center"
              style={{ background: `${accent}1a` }}
            >
              <TrendingUp className="h-4.5 w-4.5" style={{ color: accent }} />
            </div>
            <div>
              <h2 className="font-semibold text-[15px]" style={{ color: text }}>
                Insert Chart
              </h2>
              <p className="text-[11px]" style={{ color: muted }}>
                Preview updates live as you configure
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-7 w-7 rounded-lg flex items-center justify-center transition-colors"
            style={{ color: muted }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ═══ BODY ═══════════════════════════════════ */}
        <div
          className="flex overflow-hidden"
          style={{ height: "calc(90vh - 136px)" }}
        >
          {/* ── LEFT PANEL ─────────────────────────────── */}
          <div
            className="flex flex-col border-r shrink-0 overflow-hidden"
            style={{ width: "320px", borderColor: border, background: surface }}
          >
            {/* Tab strip */}
            <div
              className="flex gap-0 shrink-0 border-b"
              style={{ borderColor: border }}
            >
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className="flex-1 py-2.5 text-[12px] font-medium transition-all border-b-2"
                  style={{
                    color: tab === t.id ? accent : muted,
                    borderBottomColor: tab === t.id ? accent : "transparent",
                    background: tab === t.id ? `${accent}0a` : "transparent",
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {/* ══ TYPE TAB ══════════════════════════════ */}
              {tab === "type" && (
                <>
                  <div>
                    <label
                      className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5"
                      style={{ color: muted }}
                    >
                      Chart title
                    </label>
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full h-8 px-3 text-[13px] rounded-lg border outline-none"
                      style={{
                        background: inputBg,
                        borderColor: border,
                        color: text,
                      }}
                    />
                  </div>

                  {GROUPS.map((group) => (
                    <div key={group}>
                      <label
                        className="block text-[11px] font-semibold uppercase tracking-wider mb-2"
                        style={{ color: muted }}
                      >
                        {group}
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {CHART_TYPES.filter((c) => c.group === group).map(
                          (ct) => (
                            <button
                              key={ct.id}
                              onClick={() => setChartType(ct.id)}
                              className="flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all"
                              style={{
                                borderColor:
                                  chartType === ct.id ? accent : border,
                                background:
                                  chartType === ct.id ? `${accent}0f` : inputBg,
                                color: chartType === ct.id ? accent : text,
                              }}
                            >
                              <span className="text-xl leading-none">
                                {ct.icon}
                              </span>
                              <span className="text-[11px] font-semibold">
                                {ct.label}
                              </span>
                              <span
                                className="text-[9px]"
                                style={{ color: muted }}
                              >
                                {ct.description}
                              </span>
                            </button>
                          ),
                        )}
                      </div>
                    </div>
                  ))}

                  <div className="pt-1">
                    <button
                      className="w-full flex items-center justify-between text-[12px] font-medium h-8 px-3 rounded-lg"
                      style={{ background: `${accent}0f`, color: accent }}
                      onClick={() => setTab("data")}
                    >
                      <span>Next: Configure Data</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </>
              )}

              {/* ══ DATA TAB ══════════════════════════════ */}
              {tab === "data" && (
                <>
                  {/* Mode switcher */}
                  <div>
                    <label
                      className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5"
                      style={{ color: muted }}
                    >
                      Data source
                    </label>
                    <div
                      className="flex rounded-lg border p-0.5 gap-0.5"
                      style={{ borderColor: border, background: inputBg }}
                    >
                      {(["sheet", "manual"] as DataMode[]).map((m) => (
                        <button
                          key={m}
                          onClick={() => setDataMode(m)}
                          className="flex-1 h-7 rounded-md text-[11.5px] font-medium transition-all"
                          style={{
                            background: dataMode === m ? accent : "transparent",
                            color: dataMode === m ? "#fff" : muted,
                          }}
                        >
                          {m === "sheet" ? "From Sheet" : "Enter Manually"}
                        </button>
                      ))}
                    </div>
                    {!populated && dataMode === "sheet" && (
                      <div
                        className="mt-2 flex gap-2 items-start px-2.5 py-2 rounded-lg text-[11px]"
                        style={{ background: "#fef3c720", color: "#d97706" }}
                      >
                        <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                        Sheet has no numeric data yet. Use manual mode or add
                        data to your sheet first.
                      </div>
                    )}
                  </div>

                  {/* ── SHEET MODE ── */}
                  {dataMode === "sheet" && (
                    <>
                      <div>
                        <label
                          className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5"
                          style={{ color: muted }}
                        >
                          Label column (X axis)
                        </label>
                        {lc.length === 0 ? (
                          <p
                            className="text-[11px] italic"
                            style={{ color: muted }}
                          >
                            No text columns found
                          </p>
                        ) : (
                          <div className="space-y-1">
                            {lc.map((col) => (
                              <button
                                key={col.key}
                                onClick={() => setLabelKey(col.key)}
                                className="w-full flex items-center justify-between h-8 px-3 rounded-lg border text-[12px] transition-all"
                                style={{
                                  borderColor:
                                    labelKey === col.key ? accent : border,
                                  background:
                                    labelKey === col.key
                                      ? `${accent}0f`
                                      : inputBg,
                                  color: text,
                                }}
                              >
                                {col.name}
                                {labelKey === col.key && (
                                  <Check
                                    className="h-3.5 w-3.5"
                                    style={{ color: accent }}
                                  />
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <div>
                        <label
                          className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5"
                          style={{ color: muted }}
                        >
                          Value columns (Y axis)
                        </label>
                        {nc.length === 0 ? (
                          <p
                            className="text-[11px] italic"
                            style={{ color: muted }}
                          >
                            No numeric columns found
                          </p>
                        ) : (
                          <div className="space-y-1">
                            {nc.map((col, i) => (
                              <button
                                key={col.key}
                                onClick={() => toggleSeriesKey(col.key)}
                                className="w-full flex items-center gap-2.5 h-8 px-3 rounded-lg border text-[12px] transition-all"
                                style={{
                                  borderColor: seriesKeys.includes(col.key)
                                    ? colors[i % colors.length]
                                    : border,
                                  background: seriesKeys.includes(col.key)
                                    ? `${colors[i % colors.length]}15`
                                    : inputBg,
                                  color: text,
                                }}
                              >
                                <span
                                  className="h-2.5 w-2.5 rounded-full shrink-0 transition-opacity"
                                  style={{
                                    background: colors[i % colors.length],
                                    opacity: seriesKeys.includes(col.key)
                                      ? 1
                                      : 0.25,
                                  }}
                                />
                                <span className="flex-1 text-left">
                                  {col.name}
                                </span>
                                {seriesKeys.includes(col.key) && (
                                  <Check
                                    className="h-3.5 w-3.5 shrink-0"
                                    style={{ color: colors[i % colors.length] }}
                                  />
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* ── MANUAL MODE ── */}
                  {dataMode === "manual" && (
                    <>
                      {/* Series management */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label
                            className="text-[11px] font-semibold uppercase tracking-wider"
                            style={{ color: muted }}
                          >
                            Series
                          </label>
                          <button
                            onClick={addManualSeriesCol}
                            className="flex items-center gap-1 text-[11px] font-medium px-2 h-6 rounded-md"
                            style={{ color: accent, background: `${accent}15` }}
                          >
                            <Plus className="h-3 w-3" /> Add
                          </button>
                        </div>
                        <div className="space-y-1.5">
                          {manualSeries.map((s, si) => (
                            <div key={s.id} className="flex items-center gap-2">
                              <span
                                className="h-3 w-3 rounded-full shrink-0"
                                style={{
                                  background: colors[si % colors.length],
                                }}
                              />
                              <input
                                value={s.name}
                                onChange={(e) =>
                                  setManualSeries((p) =>
                                    p.map((ms) =>
                                      ms.id === s.id
                                        ? { ...ms, name: e.target.value }
                                        : ms,
                                    ),
                                  )
                                }
                                className="flex-1 h-7 px-2 text-[12px] rounded-lg border outline-none"
                                style={{
                                  background: inputBg,
                                  borderColor: border,
                                  color: text,
                                }}
                              />
                              {manualSeries.length > 1 && (
                                <button
                                  onClick={() => removeManualSeriesCol(s.id)}
                                  className="h-6 w-6 flex items-center justify-center rounded-md"
                                  style={{ color: "#ef4444" }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Data table */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label
                            className="text-[11px] font-semibold uppercase tracking-wider"
                            style={{ color: muted }}
                          >
                            Data rows
                          </label>
                          <button
                            onClick={addManualRow}
                            className="flex items-center gap-1 text-[11px] font-medium px-2 h-6 rounded-md"
                            style={{ color: accent, background: `${accent}15` }}
                          >
                            <Plus className="h-3 w-3" /> Row
                          </button>
                        </div>
                        <div
                          className="rounded-xl border overflow-hidden"
                          style={{ borderColor: border }}
                        >
                          {/* Header */}
                          <div
                            className="grid text-[10px] font-semibold uppercase tracking-wider px-2 py-1.5"
                            style={{
                              gridTemplateColumns: `1fr ${manualSeries.map(() => "72px").join(" ")} 26px`,
                              background: isDark ? "#0a0d14" : "#f1f5f9",
                              color: muted,
                              borderBottom: `1px solid ${border}`,
                            }}
                          >
                            <span>Label</span>
                            {manualSeries.map((s) => (
                              <span key={s.id} className="text-right">
                                {s.name}
                              </span>
                            ))}
                            <span />
                          </div>
                          {/* Rows */}
                          {manualRows.map((row, ri) => (
                            <div
                              key={row.id}
                              className="grid items-center px-2 py-1 gap-1"
                              style={{
                                gridTemplateColumns: `1fr ${manualSeries.map(() => "72px").join(" ")} 26px`,
                                borderBottom:
                                  ri < manualRows.length - 1
                                    ? `1px solid ${border}`
                                    : "none",
                              }}
                            >
                              <input
                                value={row.label}
                                onChange={(e) =>
                                  updateCell(row.id, "label", e.target.value)
                                }
                                className="h-6 px-1.5 text-[11px] rounded border outline-none"
                                style={{
                                  background: inputBg,
                                  borderColor: border,
                                  color: text,
                                }}
                              />
                              {manualSeries.map((s) => (
                                <input
                                  key={s.id}
                                  value={String(row[s.id] ?? 0)}
                                  onChange={(e) =>
                                    updateCell(row.id, s.id, e.target.value)
                                  }
                                  type="number"
                                  className="h-6 px-1.5 text-[11px] rounded border outline-none text-right tabular-nums"
                                  style={{
                                    background: inputBg,
                                    borderColor: border,
                                    color: text,
                                  }}
                                />
                              ))}
                              <button
                                onClick={() => removeManualRow(row.id)}
                                className="h-6 w-6 flex items-center justify-center rounded-md"
                                style={{
                                  color: "#ef4444",
                                  opacity: manualRows.length <= 1 ? 0.3 : 1,
                                }}
                                disabled={manualRows.length <= 1}
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}

              {/* ══ STYLE TAB ══════════════════════════════ */}
              {tab === "customize" && (
                <>
                  <div>
                    <label
                      className="block text-[11px] font-semibold uppercase tracking-wider mb-2"
                      style={{ color: muted }}
                    >
                      Color palette
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(
                        Object.entries(COLOR_SCHEMES) as [
                          ColorScheme,
                          (typeof COLOR_SCHEMES)[ColorScheme],
                        ][]
                      ).map(([key, s]) => (
                        <button
                          key={key}
                          onClick={() => setScheme(key)}
                          className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all"
                          style={{
                            borderColor: scheme === key ? accent : border,
                            background:
                              scheme === key ? `${accent}0f` : inputBg,
                          }}
                        >
                          <div className="flex gap-0.5">
                            {s.colors.slice(0, 4).map((c, i) => (
                              <span
                                key={i}
                                className="h-3 w-3 rounded-full"
                                style={{ background: c }}
                              />
                            ))}
                          </div>
                          <span
                            className="text-[10px] font-medium"
                            style={{ color: scheme === key ? accent : text }}
                          >
                            {s.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label
                      className="block text-[11px] font-semibold uppercase tracking-wider mb-2"
                      style={{ color: muted }}
                    >
                      Display options
                    </label>
                    <div className="space-y-2">
                      {(
                        [
                          {
                            key: "showLegend",
                            label: "Show legend",
                            val: showLegend,
                            set: setShowLegend,
                          },
                          {
                            key: "showGrid",
                            label: "Show grid lines",
                            val: showGrid,
                            set: setShowGrid,
                          },
                          {
                            key: "showLabels",
                            label: "Show data labels",
                            val: showLabels,
                            set: setShowLabels,
                          },
                        ] as const
                      ).map(({ key, label, val, set }) => (
                        <div
                          key={key}
                          className="flex items-center justify-between h-9 px-3 rounded-lg border"
                          style={{ borderColor: border, background: inputBg }}
                        >
                          <span className="text-[12px]" style={{ color: text }}>
                            {label}
                          </span>
                          <button
                            onClick={() => (set as any)((p: boolean) => !p)}
                            className="h-5 w-9 rounded-full transition-all relative"
                            style={{ background: val ? accent : border }}
                          >
                            <span
                              className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all"
                              style={{ left: val ? "18px" : "2px" }}
                            />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
            {/* end tab body */}
          </div>
          {/* end left panel */}

          {/* ── RIGHT PANEL: PREVIEW ─────────────────── */}
          <div
            className="flex-1 flex flex-col overflow-hidden"
            style={{ background: bg }}
          >
            {/* Preview header */}
            <div
              className="flex items-center justify-between px-5 py-2.5 border-b shrink-0"
              style={{ borderColor: border }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="text-[11px] font-medium"
                  style={{ color: muted }}
                >
                  Live Preview
                </span>
                <span
                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                  style={{ background: `${accent}15`, color: accent }}
                >
                  {CHART_TYPES.find((c) => c.id === chartType)?.label}
                </span>
              </div>
              <div
                className="flex gap-1 items-center text-[11px]"
                style={{ color: muted }}
              >
                {previewCategories.length} cats · {previewSeries.length} series
              </div>
            </div>

            {/* Chart */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 pb-4 overflow-hidden">
              {title && (
                <h3
                  className="text-[15px] font-semibold mb-3 text-center"
                  style={{ color: text }}
                >
                  {title}
                </h3>
              )}

              {hasData ? (
                <div
                  className="w-full rounded-2xl border overflow-hidden"
                  style={{
                    borderColor: border,
                    background: isDark ? "#0a0d14" : "#f8fafc",
                    maxWidth: "580px",
                  }}
                >
                  <ApexChart
                    key={`${chartType}-${scheme}-${previewCategories.join(",")}-${previewSeries.map((s) => s.name).join(",")}`}
                    type={
                      chartType === "donut"
                        ? "donut"
                        : chartType === "pie"
                          ? "pie"
                          : chartType === "radar"
                            ? "radar"
                            : chartType === "area"
                              ? "area"
                              : chartType === "scatter"
                                ? "scatter"
                                : chartType === "line"
                                  ? "line"
                                  : "bar"
                    }
                    options={apexOptions}
                    series={apexSeries as any}
                    width="100%"
                    height={300}
                  />
                </div>
              ) : (
                <div
                  className="flex flex-col items-center justify-center gap-3 rounded-2xl border w-full max-w-md h-64"
                  style={{
                    borderColor: border,
                    background: isDark ? "#0a0d14" : "#f8fafc",
                  }}
                >
                  <AlertCircle
                    className="h-8 w-8 opacity-30"
                    style={{ color: muted }}
                  />
                  <p className="text-sm font-medium" style={{ color: muted }}>
                    No data to preview
                  </p>
                  <p className="text-xs opacity-60" style={{ color: muted }}>
                    {dataMode === "sheet"
                      ? "Select a label and at least one value column"
                      : "Add rows in the Data tab"}
                  </p>
                  <button
                    onClick={() => setTab("data")}
                    className="text-[12px] font-medium px-4 py-1.5 rounded-lg"
                    style={{ background: `${accent}15`, color: accent }}
                  >
                    Go to Data tab →
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div
              className="flex items-center justify-between px-5 py-3.5 border-t shrink-0"
              style={{ borderColor: border, background: surface }}
            >
              <button
                onClick={onClose}
                className="h-8 px-4 rounded-lg text-[12.5px] font-medium border transition-colors"
                style={{
                  borderColor: border,
                  color: muted,
                  background: inputBg,
                }}
              >
                Cancel
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setTitle("My Chart");
                    setChartType("bar");
                    setManualRows(defaultManualRows());
                    setManualSeries([{ id: "s0", name: "Value" }]);
                    setScheme("ocean");
                    setShowLegend(true);
                    setShowGrid(true);
                    setDataMode(populated ? "sheet" : "manual");
                  }}
                  className="h-8 px-3 rounded-lg text-[12px] font-medium border flex items-center gap-1.5"
                  style={{
                    borderColor: border,
                    color: muted,
                    background: inputBg,
                  }}
                >
                  <RefreshCw className="h-3 w-3" /> Reset
                </button>
                <button
                  onClick={handleInsert}
                  disabled={!hasData}
                  className="h-8 px-5 rounded-lg text-[12.5px] font-semibold flex items-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: hasData ? accent : border,
                    color: "#fff",
                    boxShadow: hasData ? `0 4px 14px ${accent}40` : "none",
                  }}
                >
                  Insert Chart <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

