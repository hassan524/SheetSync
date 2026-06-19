"use client";

/**
 * hooks/sheets/use-charts.ts
 *
 * Professional chart system with correct data resolution for every chart type.
 *
 * KEY LOGIC:
 *  - Pie/Donut/Radar  → categorical charts — X column = labels, NO Y required
 *                        If Y is omitted   → auto-COUNT occurrences of each X label
 *                        If Y is provided  → sum/avg that column per X label
 *  - Bar/Column/Line/Area/Scatter → Y is required (numeric column)
 *  - ANY column type can be used as X (text, status, priority, date, select, assigned-to, etc.)
 *  - aggregateMode applies to ALL sheet-mode charts, not just duplicate labels
 *  - Manual mode works for all chart types; no Y needed for pie/donut
 */

import { useState, useCallback, useRef, useEffect } from "react";
import type { SheetRow, ColumnDef } from "@/types/index";

// ─────────────────────────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────────────────────────

export type ChartKind =
  | "bar"
  | "column"
  | "line"
  | "area"
  | "pie"
  | "donut"
  | "scatter"
  | "radar";

export type ColorScheme =
  | "ocean"
  | "sunset"
  | "forest"
  | "candy"
  | "mono"
  | "corporate";

export type AggregateMode = "count" | "sum" | "avg" | "none";

export interface ManualSeriesEntry {
  name: string;
  values: number[];
}

export interface SheetChart {
  id: string;
  title: string;
  kind: ChartKind;
  labelRowIndex: number;

  // ── data source ─────────────────────────────────────────
  dataMode: "sheet" | "manual";

  // ── sheet mode ──────────────────────────────────────────
  /** Column whose values become the X-axis labels / pie slices */
  labelColumnKey: string | null;

  /**
   * Y-axis numeric columns.
   * For pie/donut/radar in COUNT mode, this can be EMPTY — the chart
   * will auto-count how many rows have each labelColumn value.
   * For bar/column/line/area at least one numeric column is required.
   */
  seriesKeys: string[];

  /** 0-based, inclusive */
  startRow: number;
  /** 0-based, inclusive; null = all rows */
  endRow: number | null;

  /**
   * How to combine rows that share the same X label.
   *   "count" — count rows (default for pie/donut when no seriesKeys)
   *   "sum"   — sum the numeric columns
   *   "avg"   — average the numeric columns
   *   "none"  — no grouping; each row is one data point
   */
  aggregateMode: AggregateMode;

  // ── manual mode ─────────────────────────────────────────
  manualCategories: string[];
  manualSeries: ManualSeriesEntry[];

  // ── style ────────────────────────────────────────────────
  colorScheme: ColorScheme;
  showLegend: boolean;
  showGrid: boolean;
  showLabels: boolean;
  /** Max ticks on X-axis to prevent crowding (default 12) */
  maxXLabels: number;

  // ── layout ───────────────────────────────────────────────
  x: number;
  y: number;
  width: number;
  height: number;
  minimized: boolean;
}

export type ChartPanelTab = "data" | "design" | "format";

export interface UseChartsReturn {
  charts: SheetChart[];
  activeChartId: string | null;
  activeChart: SheetChart | null;

  showPicker: boolean;
  openPicker: () => void;
  closePicker: () => void;

  panelTab: ChartPanelTab;
  setPanelTab: (t: ChartPanelTab) => void;

  insertChart: (
    kind: ChartKind,
    rows: SheetRow[],
    columns: ColumnDef[],
    preset?: Partial<SheetChart>,
  ) => string;
  removeChart: (id: string) => void;
  removeAll: () => void;
  setActiveChart: (id: string | null) => void;

  updateChart: (id: string, patch: Partial<SheetChart>) => void;
  updatePosition: (id: string, x: number, y: number) => void;
  updateSize: (id: string, w: number, h: number) => void;

  /** Replace all charts (e.g. hydrate from DB). */
  replaceAll: (next: SheetChart[]) => void;
}

export interface UseChartsOptions {
  /**
   * If provided, charts will be loaded/saved to localStorage under this key.
   * This enables persistence across leaving/re-opening a sheet.
   */
  storageKey?: string | null;
}

// ─────────────────────────────────────────────────────────────
//  CONSTANTS
// ─────────────────────────────────────────────────────────────

export const SCHEME_COLORS: Record<ColorScheme, string[]> = {
  ocean: ["#0ea5e9", "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6"],
  sunset: ["#f59e0b", "#f97316", "#ef4444", "#ec4899", "#a855f7"],
  forest: ["#1a7a4a", "#22c55e", "#16a34a", "#84cc16", "#10b981"],
  candy: ["#f472b6", "#fb7185", "#fbbf24", "#34d399", "#60a5fa"],
  mono: ["#1e293b", "#475569", "#94a3b8", "#cbd5e1", "#64748b"],
  corporate: ["#1d4ed8", "#7c3aed", "#059669", "#d97706", "#dc2626"],
};

export const SCHEME_LABELS: Record<ColorScheme, string> = {
  ocean: "Ocean",
  sunset: "Sunset",
  forest: "Forest",
  candy: "Candy",
  mono: "Mono",
  corporate: "Corporate",
};

const EXTRA_COL_RE = /^__extra_/;

export const NUMERIC_TYPES = new Set([
  "number",
  "currency",
  "progress",
  "percent",
]);

/** Chart types that are purely categorical (no Y required) */
export const CATEGORICAL_KINDS = new Set<ChartKind>(["pie", "donut", "radar"]);

/** Returns true if the chart kind requires explicit Y-axis series */
export function requiresNumericY(kind: ChartKind): boolean {
  return !CATEGORICAL_KINDS.has(kind);
}

/** Column types/names that should never be used as chart labels/categories */
const NON_CHARTABLE_TYPES = new Set(["image", "checkbox", "url"]);
const NON_CHARTABLE_LABEL_RE =
  /(^|[\s_-])(id|ids|uuid|guid|description|desc|details?|notes?|comment|comments|bug\s*id|ticket\s*id|issue\s*id)([\s_-]|$)/i;

/** All columns usable as X-axis (label) — excludes row-number pseudo-columns and non-chartable types */
export function getLabelCols(columns: ColumnDef[]): ColumnDef[] {
  return columns.filter(
    (c) =>
      !EXTRA_COL_RE.test(c.key) &&
      !c.hidden &&
      !NON_CHARTABLE_TYPES.has(c.type ?? "text") &&
      !NON_CHARTABLE_LABEL_RE.test(`${c.name ?? ""} ${c.key ?? ""}`),
  );
}

export function rowLooksLikeHeader(
  row: SheetRow | undefined,
  columns: ColumnDef[],
): boolean {
  if (!row) return false;
  const checkCols = getLabelCols(columns);
  if (checkCols.length === 0) return false;
  const nonEmpty = checkCols.filter(
    (c) => String(row[c.key] ?? "").trim().length > 0,
  );
  return nonEmpty.length >= Math.ceil(checkCols.length * 0.6);
}

export function isChartableLabelColumn(column: ColumnDef | undefined): boolean {
  if (!column) return false;
  return getLabelCols([column]).length === 1;
}

/** Columns that carry numeric data (valid Y-axis choices) */
export function getNumericCols(columns: ColumnDef[]): ColumnDef[] {
  return columns.filter(
    (c) => !EXTRA_COL_RE.test(c.key) && !c.hidden && NUMERIC_TYPES.has(c.type ?? "text"),
  );
}

export function coerceChartNumber(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const raw = String(value).trim();
  if (!raw) return null;
  const normalized = raw.replace(/[$,%\s,]/g, "");
  if (!/^[-+]?\d*\.?\d+$/.test(normalized)) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatChartAxisDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function getColumnNameFromHeaderRow(
  column: ColumnDef | undefined,
  rows: SheetRow[],
  headerRowIndex: number,
): string | null {
  if (!column || headerRowIndex < 0) return null;
  const headerValue = String(rows[headerRowIndex]?.[column.key] ?? "").trim();
  return headerValue || column.name || column.key;
}

function getLikelyColumnHeaderValues(
  column: ColumnDef | undefined,
  rows: SheetRow[],
): Set<string> {
  const values = new Set<string>();
  if (!column) return values;

  [column.name, column.key].forEach((value) => {
    const normalized = String(value ?? "").trim().toLowerCase();
    if (normalized) values.add(normalized);
  });

  rows.filter((row) => (row as any)._isHeaderRow).forEach((row) => {
    const value = String(row[column.key] ?? "").trim();
    if (value && value.length <= 80) values.add(value.toLowerCase());
  });

  return values;
}

function isColumnHeaderValue(
  value: string,
  column: ColumnDef | undefined,
  rows: SheetRow[],
  headerRowIndex: number,
): boolean {
  if (!column) return false;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return false;
  const names = new Set(
    [column.name, column.key, getColumnNameFromHeaderRow(column, rows, headerRowIndex)]
      .filter(Boolean)
      .map((name) => String(name).trim().toLowerCase()),
  );
  return names.has(normalized);
}

const DEFAULT_CHART: Omit<SheetChart, "id" | "title" | "kind" | "x" | "y"> = {
  dataMode: "sheet",
  labelColumnKey: null,
  seriesKeys: [],
  startRow: 0,
  endRow: null,
  aggregateMode: "count",
  manualCategories: [],
  manualSeries: [{ name: "Series 1", values: [] }],
  colorScheme: "ocean",
  showLegend: true,
  showGrid: true,
  showLabels: false,
  maxXLabels: 12,
  width: 540,
  height: 360,
  minimized: false,
  labelRowIndex: 0,
};

// ─────────────────────────────────────────────────────────────
//  RESOLVE CHART DATA
//  Exported so ChartWidget and ChartsPanel can both use it.
// ─────────────────────────────────────────────────────────────

export function resolveChartData(
  chart: SheetChart,
  rows: SheetRow[],
  columns: ColumnDef[],
): { categories: string[]; series: { name: string; data: number[] }[] } {
  // ── MANUAL MODE ───────────────────────────────────────────
  if (chart.dataMode === "manual") {
    return {
      categories: chart.manualCategories,
      series: chart.manualSeries.map((s) => ({ name: s.name, data: s.values })),
    };
  }

  // ── SHEET MODE ────────────────────────────────────────────
  if (!chart.labelColumnKey) return { categories: [], series: [] };
  const labelColumn = columns.find((c) => c.key === chart.labelColumnKey);
  if (!isChartableLabelColumn(labelColumn)) return { categories: [], series: [] };
  const likelyLabelHeaders = getLikelyColumnHeaderValues(labelColumn, rows);
  const isDateLabel =
    labelColumn?.type === "date" ||
    /(^|[\s_-])date([\s_-]|$)/i.test(
      getColumnNameFromHeaderRow(labelColumn, rows, chart.labelRowIndex ?? -1) ?? "",
    );
  const formatLabel = (raw: string) => (isDateLabel ? formatChartAxisDate(raw) : raw);

  // Apply row range
  const start = Math.max(0, chart.startRow ?? 0);
  const end =
    chart.endRow != null
      ? Math.min(rows.length - 1, chart.endRow)
      : rows.length - 1;

  const isSingleSelectedRow = start === end;

  const sliced = rows
    .slice(start, end + 1)
    .filter((row, index) => {
      // 1. Properly skip the exact header row by its absolute layout index
      const absoluteRowIndex = start + index;
      if (absoluteRowIndex === chart.labelRowIndex) return false;

      // 2. Skip explicitly marked virtual header rows
      if ((row as any)._isHeaderRow) return false;

      const labelVal = row[chart.labelColumnKey!];
      if (labelVal === undefined || labelVal === null || String(labelVal).trim() === "") return false;

      const labelStr = String(labelVal).trim();

      // 3. Optional Date Validation
      if (isDateLabel) {
        const d = new Date(labelStr);
        if (isNaN(d.getTime())) return false;
      }
      return true;
    });

  if (sliced.length === 0) return { categories: [], series: [] };

  const isCategorical = CATEGORICAL_KINDS.has(chart.kind);
  const noSeriesKeys = chart.seriesKeys.length === 0;
  const isCountMode = (isCategorical && noSeriesKeys) || chart.aggregateMode === "count";

  let dataRows = sliced;
  if (!isCountMode) {
    dataRows = sliced.filter((r) =>
      chart.seriesKeys.some((key) => {
        const v = coerceChartNumber(r[key]);
        return v !== null;
      }),
    );
    if (dataRows.length === 0) return { categories: [], series: [] };
  }

  // ── COUNT MODE (pie / donut / radar with no Y column, or aggregateMode=count) ──
  if (isCountMode) {
    const countMap = new Map<string, number>();
    sliced.forEach((r) => {
      const label = formatLabel(String(r[chart.labelColumnKey!]).trim());
      if (label) countMap.set(label, (countMap.get(label) ?? 0) + 1);
    });

    const categories = Array.from(countMap.keys());
    const data = categories.map((l) => countMap.get(l)!);

    return {
      categories,
      series: [{ name: "Count", data }],
    };
  }

  // ── WITH Y SERIES (sum / avg / none) ─────────────────────
  if (chart.aggregateMode === "none") {
    // Each row = one data point, no grouping
    let displayRows = dataRows;
    const max = chart.maxXLabels ?? 12;
    if (dataRows.length > max) {
      const step = Math.ceil(dataRows.length / max);
      displayRows = dataRows.filter((_, i) => i % step === 0);
    }

    const categories = displayRows.map((r) =>
      formatLabel(String(r[chart.labelColumnKey!]).trim()),
    );
    const series = chart.seriesKeys.map((key) => {
      const col = columns.find((c) => c.key === key);
      return {
        name: getColumnNameFromHeaderRow(col, rows, chart.labelRowIndex) ?? key,
        data: displayRows.map((r) => {
          return coerceChartNumber(r[key]) ?? 0;
        }),
      };
    });

    return { categories, series };
  }

  // ── SUM / AVG per unique label ────────────────────────────
  const labelMap = new Map<string, { sums: number[]; counts: number[] }>();
  const seriesCount = chart.seriesKeys.length;

  dataRows.forEach((r) => {
    const label = formatLabel(String(r[chart.labelColumnKey!]).trim());
    if (!labelMap.has(label)) {
      labelMap.set(label, {
        sums: new Array(seriesCount).fill(0),
        counts: new Array(seriesCount).fill(0),
      });
    }
    const entry = labelMap.get(label)!;
    chart.seriesKeys.forEach((key, si) => {
      const v = coerceChartNumber(r[key]);
      if (v !== null) {
        entry.sums[si] += v;
        entry.counts[si] += 1;
      }
    });
  });

  // Respect maxXLabels for aggregated results too
  let allLabels = Array.from(labelMap.keys());
  const max = chart.maxXLabels ?? 12;
  if (allLabels.length > max) {
    const step = Math.ceil(allLabels.length / max);
    allLabels = allLabels.filter((_, i) => i % step === 0);
  }

  const series = chart.seriesKeys.map((key, si) => {
    const col = columns.find((c) => c.key === key);
    return {
      name: getColumnNameFromHeaderRow(col, rows, chart.labelRowIndex) ?? key,
      data: allLabels.map((label) => {
        const entry = labelMap.get(label);
        if (!entry || entry.counts[si] === 0) return 0;
        return chart.aggregateMode === "avg"
          ? entry.sums[si] / entry.counts[si]
          : entry.sums[si];
      }),
    };
  });

  return { categories: allLabels, series };
}

// ─────────────────────────────────────────────────────────────
//  HOOK (optionally persisted)
// ─────────────────────────────────────────────────────────────

export function useCharts(opts?: UseChartsOptions): UseChartsReturn {
  const storageKey = opts?.storageKey ?? null;
  const [charts, setCharts] = useState<SheetChart[]>([]);
  const [activeChartId, setActiveId] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [panelTab, setPanelTab] = useState<ChartPanelTab>("data");
  const countRef = useRef(0);
  const hydratedRef = useRef(false);

  const activeChart = charts.find((c) => c.id === activeChartId) ?? null;

  // Load from localStorage when storageKey changes
  useEffect(() => {
    if (!storageKey) return;
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        if (Array.isArray(parsed)) {
          const loaded = parsed as SheetChart[];
          setCharts(loaded);
          countRef.current = loaded.length;
          // keep active id if exists, otherwise clear
          setActiveId((prev) =>
            prev && loaded.some((c) => c.id === prev) ? prev : null,
          );
        }
      }
    } catch {
      // ignore corrupted storage
    }
    hydratedRef.current = true;
  }, [storageKey]);

  // Persist to localStorage
  useEffect(() => {
    if (!storageKey) return;
    if (typeof window === "undefined") return;
    // Avoid clobbering existing saved charts on first mount before hydration.
    if (!hydratedRef.current) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(charts));
    } catch {
      // ignore quota / private mode errors
    }
  }, [charts, storageKey]);

  const openPicker = useCallback(() => setShowPicker(true), []);
  const closePicker = useCallback(() => setShowPicker(false), []);

  const insertChart = useCallback(
    (
      kind: ChartKind,
      _rows: SheetRow[],
      _columns: ColumnDef[],
      preset?: Partial<SheetChart>,
    ) => {
      const idx = countRef.current++;
      const id = uid();

      // Smart defaults per kind
      const smartDefaults: Partial<SheetChart> = {};
      if (CATEGORICAL_KINDS.has(kind)) {
        smartDefaults.aggregateMode = "count";
        smartDefaults.seriesKeys = [];
      } else {
        smartDefaults.aggregateMode = "none";
      }

      const chart: SheetChart = {
        ...DEFAULT_CHART,
        ...smartDefaults,
        id,
        title: preset?.title ?? `Chart ${idx + 1}`,
        kind,
        x: 60 + (idx % 5) * 32,
        y: 60 + (idx % 5) * 32,
        ...preset,
      };

      setCharts((p) => [...p, chart]);
      setActiveId(id);
      setShowPicker(false);
      setPanelTab("data");
      return id;
    },
    [],
  );

  const removeChart = useCallback((id: string) => {
    setCharts((p) => p.filter((c) => c.id !== id));
    setActiveId((prev) => (prev === id ? null : prev));
  }, []);

  const removeAll = useCallback(() => {
    setCharts([]);
    setActiveId(null);
  }, []);

  const setActiveChart = useCallback((id: string | null) => {
    setActiveId(id);
    if (id) setPanelTab("data");
  }, []);

  const updateChart = useCallback((id: string, patch: Partial<SheetChart>) => {
    setCharts((p) =>
      p.map((c) => {
        if (c.id !== id) return c;
        const updated = { ...c, ...patch };

        // Auto-fix: if kind changed to categorical, clear forced numeric seriesKeys requirement
        if (patch.kind && CATEGORICAL_KINDS.has(patch.kind)) {
          if (updated.aggregateMode === "none") updated.aggregateMode = "count";
        }
        // Auto-fix: if kind changed away from categorical and no seriesKeys, keep them
        if (patch.kind && !CATEGORICAL_KINDS.has(patch.kind)) {
          if (
            updated.aggregateMode === "count" &&
            updated.seriesKeys.length === 0
          ) {
            updated.aggregateMode = "none";
          }
        }

        return updated;
      }),
    );
  }, []);

  const updatePosition = useCallback((id: string, x: number, y: number) => {
    setCharts((p) => p.map((c) => (c.id === id ? { ...c, x, y } : c)));
  }, []);

  const updateSize = useCallback((id: string, w: number, h: number) => {
    setCharts((p) =>
      p.map((c) => (c.id === id ? { ...c, width: w, height: h } : c)),
    );
  }, []);

  const replaceAll = useCallback((next: SheetChart[]) => {
    setCharts(next);
    countRef.current = next.length;
    setActiveId((prev) =>
      prev && next.some((c) => c.id === prev) ? prev : null,
    );
    setShowPicker(false);
  }, []);



  return {
    charts,
    activeChartId,
    activeChart,
    showPicker,
    openPicker,
    closePicker,
    panelTab,
    setPanelTab,
    insertChart,
    removeChart,
    removeAll,
    setActiveChart,
    updateChart,
    updatePosition,
    updateSize,
    replaceAll,
  };
}

