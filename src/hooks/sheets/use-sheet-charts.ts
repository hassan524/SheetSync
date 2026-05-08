/**
 * ============================================================
 *  hooks/sheets/use-sheet-charts.ts
 *  Data parsing · chart state · type suggestion · template presets
 * ============================================================
 */

"use client";

import { useState, useMemo, useCallback } from "react";
import type { SheetRow, ColumnDef } from "@/types/index";

// ─────────────────────────────────────────────
//  PUBLIC TYPES
// ─────────────────────────────────────────────

export type ChartType = "line" | "bar" | "pie";

export interface ColumnAnalysis {
  labelColumns: ColumnDef[];
  numericColumns: ColumnDef[];
}

export interface ChartDataSet {
  categories: string[];
  series: { name: string; data: number[] }[];
}

export interface TemplatePreset {
  id: string;
  label: string;
  chartType: ChartType;
  labelColKey: string;
  numericColKeys: string[];
}

export interface SheetChartsState {
  /** Is there enough data to render any chart? */
  isChartReady: boolean;
  /** Detected label & numeric columns */
  analysis: ColumnAnalysis;
  /** Currently selected chart type */
  chartType: ChartType;
  /** Currently selected label column key */
  labelColumn: string | null;
  /** Currently selected numeric column keys */
  numericColumns: string[];
  /** Extracted chart data for ApexCharts */
  chartData: ChartDataSet;
  /** Auto-suggested chart type based on data shape */
  suggestedType: ChartType;
  /** Available template presets (empty if not a template sheet) */
  templatePresets: TemplatePreset[];
  /** Currently active preset id (null if custom) */
  activePresetId: string | null;
}

export interface SheetChartsActions {
  setChartType: (type: ChartType) => void;
  setLabelColumn: (colKey: string) => void;
  toggleNumericColumn: (colKey: string) => void;
  setNumericColumns: (colKeys: string[]) => void;
  applyPreset: (presetId: string) => void;
  resetToSuggested: () => void;
}

// ─────────────────────────────────────────────
//  CONSTANTS
// ─────────────────────────────────────────────

const NUMERIC_TYPES = new Set(["number", "currency", "progress", "percent"]);

const LABEL_TYPES = new Set(["text", "status", "priority", "select", "date"]);

const EXTRA_COL_REGEX = /^__extra_/;

// ─────────────────────────────────────────────
//  PURE HELPERS
// ─────────────────────────────────────────────

/** Filter out extra/placeholder columns */
function realColumns(columns: ColumnDef[]): ColumnDef[] {
  return columns.filter((c) => !EXTRA_COL_REGEX.test(c.key));
}

/** Analyze columns into label vs numeric buckets */
function analyzeColumns(columns: ColumnDef[]): ColumnAnalysis {
  const cols = realColumns(columns);
  const labelColumns: ColumnDef[] = [];
  const numericColumns: ColumnDef[] = [];

  for (const col of cols) {
    const t = col.type ?? "text";
    if (NUMERIC_TYPES.has(t)) {
      numericColumns.push(col);
    } else if (LABEL_TYPES.has(t)) {
      labelColumns.push(col);
    }
  }

  return { labelColumns, numericColumns };
}

/** Count rows that have at least one non-empty value across the given keys */
function countPopulatedRows(rows: SheetRow[], keys: string[]): number {
  return rows.filter((row) =>
    keys.some((k) => {
      const v = row[k];
      return v !== undefined && v !== null && v !== "";
    }),
  ).length;
}

/** Check if chart can be rendered */
function isChartReady(analysis: ColumnAnalysis, rows: SheetRow[]): boolean {
  if (analysis.labelColumns.length === 0) return false;
  if (analysis.numericColumns.length === 0) return false;

  const allKeys = [
    ...analysis.labelColumns.map((c) => c.key),
    ...analysis.numericColumns.map((c) => c.key),
  ];
  return countPopulatedRows(rows, allKeys) >= 1;
}

/** Extract chart data from rows */
function extractChartData(
  rows: SheetRow[],
  labelColKey: string,
  numericColKeys: string[],
  columns: ColumnDef[],
): ChartDataSet {
  // Filter to rows that have a label
  const validRows = rows.filter((r) => {
    const label = r[labelColKey];
    return label !== undefined && label !== null && label !== "";
  });

  const categories = validRows.map((r) => String(r[labelColKey] ?? ""));

  const series = numericColKeys.map((key) => {
    const col = columns.find((c) => c.key === key);
    return {
      name: col?.name ?? key,
      data: validRows.map((r) => {
        const v = r[key];
        if (v === undefined || v === null || v === "") return 0;
        const n = parseFloat(String(v));
        return isNaN(n) ? 0 : n;
      }),
    };
  });

  return { categories, series };
}

/** Auto-suggest the best chart type */
function suggestChartType(data: ChartDataSet, numericCount: number): ChartType {
  const uniqueCategories = new Set(data.categories).size;

  // Pie: single numeric + few unique categories
  if (numericCount === 1 && uniqueCategories <= 8 && uniqueCategories >= 2) {
    return "pie";
  }

  // Line: many data points (time series feel)
  if (data.categories.length > 20) {
    return "line";
  }

  // Bar: default for categorical data
  return "bar";
}

// ─────────────────────────────────────────────
//  TEMPLATE DETECTION & PRESETS
// ─────────────────────────────────────────────

function detectTemplatePresets(columns: ColumnDef[]): TemplatePreset[] {
  const colKeys = new Set(realColumns(columns).map((c) => c.key));
  const presets: TemplatePreset[] = [];

  // Project Tracker: has task, status, priority, progress
  if (colKeys.has("task") && colKeys.has("status") && colKeys.has("progress")) {
    presets.push({
      id: "proj-status",
      label: "Tasks by Status",
      chartType: "bar",
      labelColKey: "status",
      numericColKeys: ["progress"],
    });
    if (colKeys.has("priority")) {
      presets.push({
        id: "proj-priority",
        label: "Priority Split",
        chartType: "pie",
        labelColKey: "priority",
        numericColKeys: ["progress"],
      });
    }
    presets.push({
      id: "proj-progress",
      label: "Progress Curve",
      chartType: "line",
      labelColKey: "task",
      numericColKeys: ["progress"],
    });
  }

  // Finance Tracker: has income, expense, category
  if (colKeys.has("income") && colKeys.has("expense")) {
    if (colKeys.has("date") || colKeys.has("category")) {
      const dateKey = colKeys.has("date") ? "date" : "category";
      presets.push({
        id: "fin-income-expense",
        label: "Income vs Expense",
        chartType: "line",
        labelColKey: dateKey,
        numericColKeys: ["income", "expense"],
      });
    }
    if (colKeys.has("category")) {
      presets.push({
        id: "fin-categories",
        label: "Category Totals",
        chartType: "bar",
        labelColKey: "category",
        numericColKeys: ["income", "expense"],
      });
    }
  }

  // QA Tracker: has bugId, severity, status
  if (colKeys.has("bugId") && colKeys.has("severity")) {
    presets.push({
      id: "qa-severity",
      label: "Bugs by Severity",
      chartType: "bar",
      labelColKey: "severity",
      numericColKeys: ["bugId"],
    });
    if (colKeys.has("status")) {
      presets.push({
        id: "qa-status",
        label: "Status Distribution",
        chartType: "pie",
        labelColKey: "status",
        numericColKeys: ["bugId"],
      });
    }
  }

  return presets;
}

/**
 * For presets referencing a non-numeric column as "value" (e.g. bugId),
 * we aggregate by counting occurrences of each label value.
 */
function extractAggregatedData(
  rows: SheetRow[],
  labelColKey: string,
  numericColKeys: string[],
  columns: ColumnDef[],
): ChartDataSet {
  const analysis = analyzeColumns(columns);
  const numericKeys = new Set(analysis.numericColumns.map((c) => c.key));

  // Check if ALL selected numeric cols are actually numeric
  const allNumeric = numericColKeys.every((k) => numericKeys.has(k));

  if (allNumeric) {
    return extractChartData(rows, labelColKey, numericColKeys, columns);
  }

  // Aggregation: count occurrences per label value
  const counts = new Map<string, number>();
  for (const row of rows) {
    const label = row[labelColKey];
    if (label === undefined || label === null || label === "") continue;
    const key = String(label);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const categories = Array.from(counts.keys());
  const data = Array.from(counts.values());

  return {
    categories,
    series: [{ name: "Count", data }],
  };
}

// ─────────────────────────────────────────────
//  SAMPLE DATA GENERATORS
// ─────────────────────────────────────────────

export function generateSampleRows(columns: ColumnDef[]): SheetRow[] {
  const real = realColumns(columns);
  const labels = ["Alpha", "Beta", "Gamma", "Delta", "Epsilon"];
  const values = [42, 78, 35, 91, 56];

  const labelCol = real.find((c) => LABEL_TYPES.has(c.type ?? "text"));
  const numCol = real.find((c) => NUMERIC_TYPES.has(c.type ?? "text"));

  if (!labelCol && !numCol) return [];

  return labels.map((name, i) => {
    const row: SheetRow = { id: String(i + 1) };
    for (const col of real) {
      if (col.key === labelCol?.key) row[col.key] = name;
      else if (col.key === numCol?.key) row[col.key] = values[i];
      else row[col.key] = "";
    }
    return row;
  });
}

export function generateBasicStructure(): {
  columns: ColumnDef[];
  rows: SheetRow[];
} {
  const columns: ColumnDef[] = [
    { key: "name", name: "Name", width: 180, editable: true, type: "text" },
    {
      key: "value",
      name: "Value",
      width: 140,
      editable: true,
      type: "number",
    },
  ];
  const items = [
    { name: "Product A", value: 4200 },
    { name: "Product B", value: 3100 },
    { name: "Product C", value: 5800 },
    { name: "Product D", value: 2400 },
    { name: "Product E", value: 6700 },
  ];
  const rows: SheetRow[] = items.map((item, i) => ({
    id: String(i + 1),
    name: item.name,
    value: item.value,
  }));

  return { columns, rows };
}

// ─────────────────────────────────────────────
//  HOOK
// ─────────────────────────────────────────────

export function useSheetCharts(
  rows: SheetRow[],
  columns: ColumnDef[],
): [SheetChartsState, SheetChartsActions] {
  const [chartType, setChartType] = useState<ChartType>("bar");
  const [labelColumn, setLabelColumn] = useState<string | null>(null);
  const [numericCols, setNumericCols] = useState<string[]>([]);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Analyze columns
  const analysis = useMemo(() => analyzeColumns(columns), [columns]);

  // Template presets
  const templatePresets = useMemo(
    () => detectTemplatePresets(columns),
    [columns],
  );

  // Auto-initialize on first valid data
  const effectiveLabelCol = useMemo(() => {
    if (labelColumn && analysis.labelColumns.some((c) => c.key === labelColumn))
      return labelColumn;
    return analysis.labelColumns[0]?.key ?? null;
  }, [labelColumn, analysis.labelColumns]);

  const effectiveNumericCols = useMemo(() => {
    if (numericCols.length > 0) {
      const validKeys = new Set(analysis.numericColumns.map((c) => c.key));
      const filtered = numericCols.filter((k) => validKeys.has(k));
      if (filtered.length > 0) return filtered;
    }
    // Default: first numeric column
    return analysis.numericColumns.length > 0
      ? [analysis.numericColumns[0].key]
      : [];
  }, [numericCols, analysis.numericColumns]);

  // Ready check
  const ready = useMemo(() => isChartReady(analysis, rows), [analysis, rows]);

  // Extract data
  const chartData = useMemo(() => {
    if (!ready || !effectiveLabelCol || effectiveNumericCols.length === 0) {
      return { categories: [], series: [] };
    }
    return extractAggregatedData(
      rows,
      effectiveLabelCol,
      effectiveNumericCols,
      columns,
    );
  }, [rows, columns, effectiveLabelCol, effectiveNumericCols, ready]);

  // Auto-suggest
  const suggestedType = useMemo(
    () => suggestChartType(chartData, effectiveNumericCols.length),
    [chartData, effectiveNumericCols.length],
  );

  // Auto-set type on first load
  const effectiveChartType = useMemo(() => {
    if (!initialized && ready) {
      return suggestedType;
    }
    return chartType;
  }, [initialized, ready, suggestedType, chartType]);

  // ── Actions ─────────────────────────────────

  const handleSetChartType = useCallback((type: ChartType) => {
    setChartType(type);
    setActivePresetId(null);
    setInitialized(true);
  }, []);

  const handleSetLabelColumn = useCallback((colKey: string) => {
    setLabelColumn(colKey);
    setActivePresetId(null);
    setInitialized(true);
  }, []);

  const handleToggleNumericColumn = useCallback(
    (colKey: string) => {
      setNumericCols((prev) => {
        const current =
          prev.length > 0
            ? prev
            : analysis.numericColumns.length > 0
              ? [analysis.numericColumns[0].key]
              : [];
        if (current.includes(colKey)) {
          // Don't allow removing last one
          if (current.length <= 1) return current;
          return current.filter((k) => k !== colKey);
        }
        return [...current, colKey];
      });
      setActivePresetId(null);
      setInitialized(true);
    },
    [analysis.numericColumns],
  );

  const handleSetNumericColumns = useCallback((colKeys: string[]) => {
    setNumericCols(colKeys);
    setActivePresetId(null);
    setInitialized(true);
  }, []);

  const handleApplyPreset = useCallback(
    (presetId: string) => {
      const preset = templatePresets.find((p) => p.id === presetId);
      if (!preset) return;
      setChartType(preset.chartType);
      setLabelColumn(preset.labelColKey);
      setNumericCols(preset.numericColKeys);
      setActivePresetId(presetId);
      setInitialized(true);
    },
    [templatePresets],
  );

  const handleResetToSuggested = useCallback(() => {
    setLabelColumn(null);
    setNumericCols([]);
    setChartType(suggestedType);
    setActivePresetId(null);
    setInitialized(false);
  }, [suggestedType]);

  // ── Return ──────────────────────────────────

  const state: SheetChartsState = {
    isChartReady: ready,
    analysis,
    chartType: effectiveChartType,
    labelColumn: effectiveLabelCol,
    numericColumns: effectiveNumericCols,
    chartData,
    suggestedType,
    templatePresets,
    activePresetId,
  };

  const actions: SheetChartsActions = {
    setChartType: handleSetChartType,
    setLabelColumn: handleSetLabelColumn,
    toggleNumericColumn: handleToggleNumericColumn,
    setNumericColumns: handleSetNumericColumns,
    applyPreset: handleApplyPreset,
    resetToSuggested: handleResetToSuggested,
  };

  return [state, actions];
}
