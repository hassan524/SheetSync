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
    sx: number;
    sy: number;
    ox: number;
    oy: number;
  } | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const [pos, setPos] = useState({ x: chart.x, y: chart.y });
  const [size, setSize] = useState({ w: chart.width, h: chart.height });
  const [minimized, setMinimized] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [viewport, setViewport] = useState({ w: 1200, h: 800 });

  // Keep viewport for mobile clamping
  useEffect(() => {
    if (typeof window === "undefined") return;
    const update = () =>
      setViewport({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const clamp = useCallback(
    (x: number, y: number, w: number, h: number) => {
      const pad = 8;
      const maxX = Math.max(pad, viewport.w - w - pad);
      const maxY = Math.max(pad, viewport.h - h - pad);
      return {
        x: Math.min(maxX, Math.max(pad, x)),
        y: Math.min(maxY, Math.max(pad, y)),
      };
    },
    [viewport],
  );

  // ── Drag (Pointer events: works on mouse + touch) ──
  const onDragPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      pointerIdRef.current = e.pointerId;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      dragRef.current = { sx: e.clientX, sy: e.clientY, ox: pos.x, oy: pos.y };
      setDragging(true);
    },
    [pos],
  );

  const onDragPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return;
      if (pointerIdRef.current !== e.pointerId) return;
      if (!dragRef.current) return;
      const next = {
        x: dragRef.current.ox + (e.clientX - dragRef.current.sx),
        y: dragRef.current.oy + (e.clientY - dragRef.current.sy),
      };
      const clamped = clamp(
        next.x,
        next.y,
        size.w,
        minimized ? 54 : size.h,
      );
      setPos(clamped);
    },
    [dragging, clamp, size.w, size.h, minimized],
  );

  const onDragPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (pointerIdRef.current !== e.pointerId) return;
      let finalPos = pos;
      if (dragRef.current) {
        finalPos = clamp(
          dragRef.current.ox + (e.clientX - dragRef.current.sx),
          dragRef.current.oy + (e.clientY - dragRef.current.sy),
          size.w,
          minimized ? 54 : size.h,
        );
        setPos(finalPos);
      }
      pointerIdRef.current = null;
      dragRef.current = null;
      setDragging(false);
      onPositionChange(chart.id, finalPos.x, finalPos.y);
    },
    [chart.id, onPositionChange, pos, clamp, size.w, size.h, minimized],
  );

  // ── Resize (Pointer events) ──
  const resizeRef = useRef<{
    sx: number;
    sy: number;
    ow: number;
    oh: number;
  } | null>(null);
  const [resizing, setResizing] = useState(false);

  const onResizePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      pointerIdRef.current = e.pointerId;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      resizeRef.current = {
        sx: e.clientX,
        sy: e.clientY,
        ow: size.w,
        oh: size.h,
      };
      setResizing(true);
    },
    [size],
  );

  const onResizePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!resizing) return;
      if (pointerIdRef.current !== e.pointerId) return;
      if (!resizeRef.current) return;
      const w = Math.max(
        320,
        resizeRef.current.ow + e.clientX - resizeRef.current.sx,
      );
      const h = Math.max(
        220,
        resizeRef.current.oh + e.clientY - resizeRef.current.sy,
      );
      const maxW = Math.max(320, viewport.w - 16);
      const maxH = Math.max(220, viewport.h - 80);
      setSize({ w: Math.min(maxW, w), h: Math.min(maxH, h) });
    },
    [resizing, viewport.w, viewport.h],
  );

  const onResizePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (pointerIdRef.current !== e.pointerId) return;
      let finalSize = size;
      if (resizeRef.current) {
        const w = Math.max(
          320,
          resizeRef.current.ow + e.clientX - resizeRef.current.sx,
        );
        const h = Math.max(
          220,
          resizeRef.current.oh + e.clientY - resizeRef.current.sy,
        );
        const maxW = Math.max(320, viewport.w - 16);
        const maxH = Math.max(220, viewport.h - 80);
        finalSize = { w: Math.min(maxW, w), h: Math.min(maxH, h) };
        setSize(finalSize);
      }
      pointerIdRef.current = null;
      resizeRef.current = null;
      setResizing(false);
      onSizeChange(chart.id, finalSize.w, finalSize.h);
      const clamped = clamp(
        pos.x,
        pos.y,
        finalSize.w,
        minimized ? 54 : finalSize.h,
      );
      setPos(clamped);
    },
    [
      chart.id,
      onSizeChange,
      size,
      viewport.w,
      viewport.h,
      clamp,
      pos.x,
      pos.y,
      minimized,
    ],
  );

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
        touchAction: "none",
        userSelect: "none",
      }}
    >
      {/* ── Header ── */}
      <div
        className="flex items-center gap-2 px-3 py-2 shrink-0 border-b"
        style={{
          background: headerBg,
          borderColor: border,
          cursor: dragging ? "grabbing" : "grab",
          userSelect: "none",
          touchAction: "none",
        }}
        onPointerDown={onDragPointerDown}
        onPointerMove={onDragPointerMove}
        onPointerUp={onDragPointerUp}
        onPointerCancel={onDragPointerUp}
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
          onPointerDown={(e) => e.stopPropagation()}
          onPointerUp={(e) => e.stopPropagation()}
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
          onPointerDown={(e) => e.stopPropagation()}
          onPointerUp={(e) => e.stopPropagation()}
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
          className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize z-20"
          style={{ touchAction: "none" }}
          onPointerDown={onResizePointerDown}
          onPointerMove={onResizePointerMove}
          onPointerUp={onResizePointerUp}
          onPointerCancel={onResizePointerUp}
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

