"use client";

/**
 * hooks/sheets/use-inserted-charts.ts
 * Manages the list of charts inserted onto the sheet.
 * Pure in-memory — no DB, no persistence.
 */

import { useState, useCallback } from "react";

export type InsertedChartType =
  | "bar"
  | "line"
  | "area"
  | "pie"
  | "donut"
  | "scatter"
  | "radar";

export interface InsertedChartSeries {
  name: string;
  data: number[];
  color?: string;
}

export interface InsertedChartData {
  categories: string[];
  series: InsertedChartSeries[];
}

export interface InsertedChart {
  id: string;
  title: string;
  chartType: InsertedChartType;
  data: InsertedChartData;
  colorScheme: string;
  showLegend: boolean;
  showGrid: boolean;
  /** Position on screen (draggable) */
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface UseInsertedChartsReturn {
  charts: InsertedChart[];
  addChart: (
    chart: Omit<InsertedChart, "id" | "x" | "y" | "width" | "height">,
  ) => void;
  removeChart: (id: string) => void;
  updateChartPosition: (id: string, x: number, y: number) => void;
  updateChartSize: (id: string, width: number, height: number) => void;
  clearAll: () => void;
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export function useInsertedCharts(): UseInsertedChartsReturn {
  const [charts, setCharts] = useState<InsertedChart[]>([]);

  const addChart = useCallback(
    (chart: Omit<InsertedChart, "id" | "x" | "y" | "width" | "height">) => {
      const count = charts.length;
      setCharts((prev) => [
        ...prev,
        {
          ...chart,
          id: uid(),
          x: 60 + count * 24,
          y: 60 + count * 24,
          width: 520,
          height: 340,
        },
      ]);
    },
    [charts.length],
  );

  const removeChart = useCallback((id: string) => {
    setCharts((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const updateChartPosition = useCallback(
    (id: string, x: number, y: number) => {
      setCharts((prev) => prev.map((c) => (c.id === id ? { ...c, x, y } : c)));
    },
    [],
  );

  const updateChartSize = useCallback(
    (id: string, width: number, height: number) => {
      setCharts((prev) =>
        prev.map((c) => (c.id === id ? { ...c, width, height } : c)),
      );
    },
    [],
  );

  const clearAll = useCallback(() => setCharts([]), []);

  return {
    charts,
    addChart,
    removeChart,
    updateChartPosition,
    updateChartSize,
    clearAll,
  };
}

