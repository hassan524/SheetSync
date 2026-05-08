"use client";

/**
 * components/individual/sheet/InsertedChart.tsx
 * Draggable, resizable chart widget that floats over the grid.
 * Uses ApexCharts. No DB — data passed directly as props.
 */

import { useRef, useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  X,
  GripHorizontal,
  Maximize2,
  Minimize2,
  BarChart2,
} from "lucide-react";
import type { InsertedChart } from "@/hooks/sheets/use-inserted-charts";

const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

// ─── Color schemes ───────────────────────────────────────────
const SCHEME_COLORS: Record<string, string[]> = {
  ocean: ["#0ea5e9", "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6"],
  sunset: ["#f59e0b", "#f97316", "#ef4444", "#ec4899", "#a855f7"],
  forest: ["#22c55e", "#16a34a", "#84cc16", "#10b981", "#14b8a6"],
  candy: ["#f472b6", "#fb7185", "#fbbf24", "#34d399", "#60a5fa"],
  monochrome: ["#1e293b", "#475569", "#94a3b8", "#cbd5e1", "#64748b"],
  corporate: ["#1d4ed8", "#7c3aed", "#059669", "#d97706", "#dc2626"],
};

// ─── ApexCharts options builder ──────────────────────────────
function buildOptions(
  chart: InsertedChart,
  isDark: boolean,
): ApexCharts.ApexOptions {
  const colors = SCHEME_COLORS[chart.colorScheme] ?? SCHEME_COLORS.ocean;
  const textColor = isDark ? "#94a3b8" : "#64748b";
  const gridColor = isDark ? "#1e2330" : "#f1f5f9";
  const bgColor = "transparent";

  const base: ApexCharts.ApexOptions = {
    chart: {
      type:
        chart.chartType === "donut"
          ? "donut"
          : chart.chartType === "pie"
            ? "pie"
            : chart.chartType === "radar"
              ? "radar"
              : (chart.chartType as any),
      background: bgColor,
      toolbar: { show: false },
      animations: { enabled: true, speed: 400 },
      fontFamily: "inherit",
    },
    colors,
    theme: { mode: isDark ? "dark" : "light" },
    legend: {
      show: chart.showLegend,
      position: "bottom",
      labels: { colors: textColor },
      fontSize: "11px",
    },
    tooltip: {
      theme: isDark ? "dark" : "light",
      style: { fontSize: "12px" },
    },
    stroke: {
      curve: "smooth",
      width: chart.chartType === "line" || chart.chartType === "area" ? 2.5 : 0,
    },
    fill: {
      opacity: chart.chartType === "area" ? 0.18 : 1,
    },
    dataLabels: { enabled: false },
    grid: {
      show:
        chart.showGrid && !["pie", "donut", "radar"].includes(chart.chartType),
      borderColor: gridColor,
      strokeDashArray: 3,
    },
    xaxis: {
      categories: chart.data.categories,
      labels: {
        style: { colors: textColor, fontSize: "11px" },
        rotate: chart.data.categories.length > 8 ? -30 : 0,
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: { style: { colors: textColor, fontSize: "11px" } },
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        columnWidth: chart.data.series.length > 2 ? "70%" : "50%",
      },
      pie: { donut: { size: "55%" } },
      radar: { polygons: { strokeColors: gridColor } },
    },
  };

  // For pie/donut pass labels instead of categories
  if (chart.chartType === "pie" || chart.chartType === "donut") {
    return {
      ...base,
      labels: chart.data.categories,
      xaxis: undefined,
      yaxis: undefined,
    };
  }

  return base;
}

function buildSeries(chart: InsertedChart) {
  if (chart.chartType === "pie" || chart.chartType === "donut") {
    return chart.data.series[0]?.data ?? [];
  }
  return chart.data.series.map((s) => ({ name: s.name, data: s.data }));
}

// ─── Component ────────────────────────────────────────────────
interface InsertedChartProps {
  chart: InsertedChart;
  isDark: boolean;
  onRemove: (id: string) => void;
  onPositionChange: (id: string, x: number, y: number) => void;
  onSizeChange: (id: string, w: number, h: number) => void;
}

export default function InsertedChartWidget({
  chart,
  isDark,
  onRemove,
  onPositionChange,
  onSizeChange,
}: InsertedChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);
  const [pos, setPos] = useState({ x: chart.x, y: chart.y });
  const [size, setSize] = useState({ w: chart.width, h: chart.height });
  const [minimized, setMinimized] = useState(false);
  const [dragging, setDragging] = useState(false);

  // ── Drag ──────────────────────────────────
  const onDragStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        origX: pos.x,
        origY: pos.y,
      };
      setDragging(true);
    },
    [pos],
  );

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      setPos({ x: dragRef.current.origX + dx, y: dragRef.current.origY + dy });
    };
    const onUp = () => {
      setDragging(false);
      onPositionChange(chart.id, pos.x, pos.y);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [dragging, pos, chart.id, onPositionChange]);

  // ── Resize ─────────────────────────────────
  const resizeRef = useRef<{
    startX: number;
    startY: number;
    origW: number;
    origH: number;
  } | null>(null);
  const [resizing, setResizing] = useState(false);

  const onResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      resizeRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        origW: size.w,
        origH: size.h,
      };
      setResizing(true);
    },
    [size],
  );

  useEffect(() => {
    if (!resizing) return;
    const onMove = (e: MouseEvent) => {
      if (!resizeRef.current) return;
      const w = Math.max(
        320,
        resizeRef.current.origW + e.clientX - resizeRef.current.startX,
      );
      const h = Math.max(
        220,
        resizeRef.current.origH + e.clientY - resizeRef.current.startY,
      );
      setSize({ w, h });
    };
    const onUp = () => {
      setResizing(false);
      onSizeChange(chart.id, size.w, size.h);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [resizing, size, chart.id, onSizeChange]);

  const border = isDark ? "#1e2330" : "#e2e8f0";
  const bg = isDark ? "#0f1117" : "#ffffff";
  const headerBg = isDark ? "#131620" : "#f8fafc";
  const titleColor = isDark ? "#e2e8f0" : "#0f172a";
  const mutedColor = isDark ? "#475569" : "#94a3b8";

  const options = buildOptions(chart, isDark);
  const series = buildSeries(chart);

  return (
    <div
      ref={containerRef}
      className="absolute z-10 rounded-2xl shadow-2xl flex flex-col overflow-hidden select-none"
      style={{
        left: pos.x,
        top: pos.y,
        width: size.w,
        height: minimized ? "auto" : size.h,
        border: `1.5px solid ${border}`,
        background: bg,
        cursor: dragging ? "grabbing" : "default",
        transition: dragging || resizing ? "none" : "box-shadow 0.15s",
        boxShadow: dragging
          ? "0 24px 48px rgba(0,0,0,0.28)"
          : "0 8px 32px rgba(0,0,0,0.12)",
      }}
    >
      {/* ── Header ── */}
      <div
        className="flex items-center gap-2 px-3 py-2 shrink-0 border-b"
        style={{
          background: headerBg,
          borderColor: border,
          cursor: "grab",
          userSelect: "none",
        }}
        onMouseDown={onDragStart}
      >
        <GripHorizontal
          className="h-3.5 w-3.5 shrink-0"
          style={{ color: mutedColor }}
        />
        <BarChart2
          className="h-3.5 w-3.5 shrink-0"
          style={{ color: "#0ea5e9" }}
        />
        <span
          className="flex-1 text-[12px] font-semibold truncate"
          style={{ color: titleColor }}
        >
          {chart.title}
        </span>
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={() => setMinimized((p) => !p)}
          className="h-5 w-5 flex items-center justify-center rounded-md transition-colors hover:bg-gray-100"
          style={{ color: mutedColor }}
        >
          {minimized ? (
            <Maximize2 className="h-3 w-3" />
          ) : (
            <Minimize2 className="h-3 w-3" />
          )}
        </button>
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={() => onRemove(chart.id)}
          className="h-5 w-5 flex items-center justify-center rounded-md transition-colors hover:bg-red-50"
          style={{ color: "#ef4444" }}
        >
          <X className="h-3 w-3" />
        </button>
      </div>

      {/* ── Chart body ── */}
      {!minimized && (
        <div
          className="flex-1 overflow-hidden px-2 pb-2 pt-1"
          style={{ minHeight: 0 }}
        >
          <ApexChart
            key={`${chart.chartType}-${chart.colorScheme}-${chart.data.categories.join(",")}`}
            type={
              chart.chartType === "donut"
                ? "donut"
                : chart.chartType === "pie"
                  ? "pie"
                  : chart.chartType === "radar"
                    ? "radar"
                    : chart.chartType === "area"
                      ? "area"
                      : chart.chartType === "scatter"
                        ? "scatter"
                        : chart.chartType === "line"
                          ? "line"
                          : "bar"
            }
            options={options}
            series={series as any}
            width="100%"
            height={size.h - 54}
          />
        </div>
      )}

      {/* ── Resize handle ── */}
      {!minimized && (
        <div
          className="absolute bottom-0 right-0 w-5 h-5 cursor-se-resize"
          onMouseDown={onResizeStart}
          style={{ zIndex: 20 }}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            className="absolute bottom-1.5 right-1.5"
          >
            <path
              d="M11 1L1 11M11 6L6 11M11 11"
              stroke={mutedColor}
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
      )}
    </div>
  );
}
