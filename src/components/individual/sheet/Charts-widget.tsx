"use client";

/**
 * components/individual/sheet/ChartWidget.tsx
 *
 * Draggable + resizable floating chart widget.
 * FIXED: isUnconfigured now correctly allows pie/donut/radar with just a label column (no Y needed)
 * FIXED: resolveChartData handles count mode for categorical charts
 */

import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import {
  X,
  GripHorizontal,
  Minimize2,
  Maximize2,
  Pencil,
  BarChart3,
  Settings2,
} from "lucide-react";
import type { SheetChart } from "@/hooks/sheets/use-charts";
import {
  SCHEME_COLORS,
  CATEGORICAL_KINDS,
  getLabelCols,
  isChartableLabelColumn,
  coerceChartNumber,
} from "@/hooks/sheets/use-charts";
import type { SheetRow, ColumnDef } from "@/types/index";
import { formatSheetDate } from "@/utils/SheetUtils";

const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

// ─────────────────────────────────────────────────────────────
//  RESOLVE CHART DATA (self-contained, correct logic)
// ─────────────────────────────────────────────────────────────

function resolveChartData(
  chart: SheetChart,
  rows: SheetRow[],
  columns: ColumnDef[],
): { categories: string[]; series: { name: string; data: number[] }[] } {
  // ── MANUAL MODE ──
  if (chart.dataMode === "manual") {
    return {
      categories: chart.manualCategories,
      series: chart.manualSeries.map((s) => ({ name: s.name, data: s.values })),
    };
  }

  // ── SHEET MODE ──
  if (!chart.labelColumnKey) return { categories: [], series: [] };
  const labelColumn = columns.find((c) => c.key === chart.labelColumnKey);
  if (!isChartableLabelColumn(labelColumn)) return { categories: [], series: [] };
  const isDateLabel = labelColumn?.type === "date";

  const start = Math.max(0, chart.startRow ?? 0);
  const end =
    chart.endRow != null
      ? Math.min(rows.length - 1, chart.endRow)
      : rows.length - 1;

  const sliced = rows
    .slice(start, end + 1)
    .filter(
      (r) =>
        r[chart.labelColumnKey!] !== undefined &&
        r[chart.labelColumnKey!] !== null &&
        String(r[chart.labelColumnKey!]).trim() !== "",
    );

  if (sliced.length === 0) return { categories: [], series: [] };

  const isCat = CATEGORICAL_KINDS.has(chart.kind);
  const noSeries = chart.seriesKeys.length === 0;

  // COUNT MODE — pie/donut/radar with no Y column, or explicit count aggregate
  if ((isCat && noSeries) || chart.aggregateMode === "count") {
    const countMap = new Map<string, number>();
    sliced.forEach((r) => {
      const rawLabel = String(r[chart.labelColumnKey!]).trim();
      const label = isDateLabel ? formatSheetDate(rawLabel) : rawLabel;
      if (label) countMap.set(label, (countMap.get(label) ?? 0) + 1);
    });
    const categories = Array.from(countMap.keys());
    return {
      categories,
      series: [
        { name: "Count", data: categories.map((l) => countMap.get(l)!) },
      ],
    };
  }

  // NO GROUPING — each row is one data point
  if (chart.aggregateMode === "none") {
    let displayRows = sliced;
    const max = chart.maxXLabels ?? 12;
    if (sliced.length > max) {
      const step = Math.ceil(sliced.length / max);
      displayRows = sliced.filter((_, i) => i % step === 0);
    }
    const categories = displayRows.map((r) => {
      const raw = String(r[chart.labelColumnKey!]).trim();
      return isDateLabel ? formatSheetDate(raw) : raw;
    });
    const series = chart.seriesKeys.map((key) => {
      const col = columns.find((c) => c.key === key);
      return {
        name: col?.name ?? key,
        data: displayRows.map((r) => {
          return coerceChartNumber(r[key]) ?? 0;
        }),
      };
    });
    return { categories, series };
  }

  // SUM / AVG per unique label
  const labelMap = new Map<string, { sums: number[]; counts: number[] }>();
  const sc = chart.seriesKeys.length;
  sliced.forEach((r) => {
    const rawLabel = String(r[chart.labelColumnKey!]).trim();
    const label = isDateLabel ? formatSheetDate(rawLabel) : rawLabel;
    if (!labelMap.has(label))
      labelMap.set(label, {
        sums: new Array(sc).fill(0),
        counts: new Array(sc).fill(0),
      });
    const entry = labelMap.get(label)!;
    chart.seriesKeys.forEach((key, si) => {
      const v = coerceChartNumber(r[key]);
      if (v !== null) {
        entry.sums[si] += v;
        entry.counts[si]++;
      }
    });
  });

  let allLabels = Array.from(labelMap.keys());
  const max = chart.maxXLabels ?? 12;
  if (allLabels.length > max) {
    const step = Math.ceil(allLabels.length / max);
    allLabels = allLabels.filter((_, i) => i % step === 0);
  }

  const series = chart.seriesKeys.map((key, si) => {
    const col = columns.find((c) => c.key === key);
    return {
      name: col?.name ?? key,
      data: allLabels.map((label) => {
        const e = labelMap.get(label);
        if (!e || e.counts[si] === 0) return 0;
        return chart.aggregateMode === "avg"
          ? e.sums[si] / e.counts[si]
          : e.sums[si];
      }),
    };
  });

  return { categories: allLabels, series };
}

// ─────────────────────────────────────────────────────────────
//  BUILD APEX OPTIONS
// ─────────────────────────────────────────────────────────────

function buildOptions(
  chart: SheetChart,
  categories: string[],
  isDark: boolean,
  widgetWidth: number,
): ApexCharts.ApexOptions {
  const colors = SCHEME_COLORS[chart.colorScheme] ?? SCHEME_COLORS.ocean;
  const textC = isDark ? "#94a3b8" : "#64748b";
  const gridC = isDark ? "#1e2330" : "#f1f5f9";
  const isPolar = chart.kind === "pie" || chart.kind === "donut";
  const isRadar = chart.kind === "radar";
  const isMobile = widgetWidth < 360;

  const labelCount = categories.length;
  const rotate = labelCount > 8 ? -45 : 0;
  const maxHeight = labelCount > 8 ? 72 : 36;

  return {
    chart: {
      type:
        chart.kind === "donut"
          ? "donut"
          : chart.kind === "column"
            ? "bar"
            : (chart.kind as any),
      background: "transparent",
      toolbar: { show: false },
      animations: { enabled: true, speed: 400 },
      fontFamily: "inherit",
      redrawOnParentResize: true,
    },
    colors,
    theme: { mode: isDark ? "dark" : "light" },

    legend: {
      show: chart.showLegend && !isMobile,
      position: "bottom",
      labels: { colors: textC },
      fontSize: "11px",
      markers: { size: 5 },
      itemMargin: { horizontal: 6 },
    },

    tooltip: {
      theme: isDark ? "dark" : "light",
      style: { fontSize: "12px" },
    },

    stroke: {
      curve: "smooth",
      width: chart.kind === "line" || chart.kind === "area" ? 2.5 : 0,
    },

    fill: {
      opacity: chart.kind === "area" ? 0.18 : 1,
      type: chart.kind === "area" ? "gradient" : "solid",
      gradient:
        chart.kind === "area"
          ? {
              shadeIntensity: 1,
              opacityFrom: 0.25,
              opacityTo: 0.02,
              stops: [0, 100],
            }
          : undefined,
    },

    dataLabels: {
      enabled: chart.showLabels,
      style: { fontSize: "10px", fontWeight: 600 },
      dropShadow: { enabled: false },
      formatter: (val: number) =>
        typeof val === "number"
          ? Number.isInteger(val)
            ? String(val)
            : val.toFixed(1)
          : String(val),
    },

    grid: {
      show: chart.showGrid && !isPolar && !isRadar,
      borderColor: gridC,
      strokeDashArray: 3,
      padding: { left: 2, right: 2, top: 0, bottom: 0 },
    },

    ...(!isPolar &&
      !isRadar && {
        xaxis: {
          categories,
          labels: {
            style: { colors: textC, fontSize: isMobile ? "9px" : "11px" },
            rotate,
            trim: true,
            maxHeight,
            hideOverlappingLabels: true,
          },
          axisBorder: { show: false },
          axisTicks: { show: false },
          tickAmount: Math.min(categories.length, chart.maxXLabels ?? 12),
        },
        yaxis: {
          labels: {
            style: { colors: textC, fontSize: isMobile ? "9px" : "11px" },
            formatter: (val: number) =>
              typeof val === "number"
                ? val >= 1000
                  ? `${(val / 1000).toFixed(1)}k`
                  : String(Math.round(val))
                : String(val),
          },
        },
      }),

    ...(isPolar && { labels: categories }),

    plotOptions: {
      bar: {
        horizontal: chart.kind === "bar",
        borderRadius: 4,
        columnWidth:
          Math.min(70, Math.max(20, 80 - categories.length * 2)) + "%",
        barHeight: "60%",
      },

      pie: {
        donut: {
          size: "55%",
          labels: {
            show: chart.showLabels,

            // ✅ CORRECT styling places
            name: {
              color: textC,
              fontSize: "12px",
            },
            value: {
              color: textC,
              fontSize: "12px",
            },

            // ✅ FIXED: removed invalid `style`
            total: {
              show: chart.showLabels,
              label: "Total",
              formatter: (w: any) => {
                const sum = w.globals.seriesTotals.reduce(
                  (a: number, b: number) => a + b,
                  0,
                );
                return String(sum);
              },
            },
          },
        },
      },

      radar: {
        polygons: {
          strokeColors: gridC,
          fill: { colors: [isDark ? "#0f1117" : "#f8fafc"] },
        },
      },
    },
  };
}

// ─────────────────────────────────────────────────────────────
//  COMPONENT
// ─────────────────────────────────────────────────────────────

interface ChartWidgetProps {
  chart: SheetChart;
  isActive: boolean;
  isDark: boolean;
  rows: SheetRow[];
  columns: ColumnDef[];
  onSelect: (id: string) => void;
  onOpenEditor: (id: string) => void;
  onRemove: (id: string) => void;
  onPositionChange: (id: string, x: number, y: number) => void;
  onSizeChange: (id: string, w: number, h: number) => void;
  onMinimize: (id: string, val: boolean) => void;
}

export default function ChartWidget({
  chart,
  isActive,
  isDark,
  rows,
  columns,
  onSelect,
  onOpenEditor,
  onRemove,
  onPositionChange,
  onSizeChange,
  onMinimize,
}: ChartWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: chart.x, y: chart.y });
  const [size, setSize] = useState({ w: chart.width, h: chart.height });
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);
  const dragRef = useRef<{
    sx: number;
    sy: number;
    ox: number;
    oy: number;
  } | null>(null);
  const resizeRef = useRef<{
    sx: number;
    sy: number;
    ow: number;
    oh: number;
  } | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const [viewport, setViewport] = useState({ w: 1200, h: 800 });

  const isMobile = viewport.w < 640;

  useEffect(() => {
    setPos({ x: chart.x, y: chart.y });
  }, [chart.x, chart.y]);
  useEffect(() => {
    setSize({ w: chart.width, h: chart.height });
  }, [chart.width, chart.height]);

  // Keep viewport for mobile sizing/clamping
  useEffect(() => {
    if (typeof window === "undefined") return;
    const update = () =>
      setViewport({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    setSize((prev) => {
      const maxW = viewport.w - 16;
      const maxH = viewport.h - 80;
      const nextW = Math.min(prev.w, maxW);
      const nextH = Math.min(prev.h, maxH);
      if (nextW === prev.w && nextH === prev.h) return prev;
      return {
        w: nextW,
        h: nextH,
      };
    });
  }, [viewport.w, viewport.h]);

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

  // ── DRAG (Pointer events: works on mouse + touch) ──
  const onDragPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      pointerIdRef.current = e.pointerId;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      dragRef.current = { sx: e.clientX, sy: e.clientY, ox: pos.x, oy: pos.y };
      setDragging(true);
      onSelect(chart.id);
    },
    [pos, chart.id, onSelect],
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
        chart.minimized ? 54 : size.h,
      );
      setPos(clamped);
    },
    [dragging, clamp, size.w, size.h, chart.minimized],
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
          chart.minimized ? 54 : size.h,
        );
        setPos(finalPos);
      }
      pointerIdRef.current = null;
      dragRef.current = null;
      setDragging(false);
      onPositionChange(chart.id, finalPos.x, finalPos.y);
    },
    [chart.id, onPositionChange, pos, clamp, size.w, size.h, chart.minimized],
  );

  // ── RESIZE (Pointer events) ──
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
      const minW = viewport.w < 640 ? 220 : 280;
      const minH = viewport.w < 640 ? 160 : 180;
      const w = Math.max(
        minW,
        resizeRef.current.ow + e.clientX - resizeRef.current.sx,
      );
      const h = Math.max(
        minH,
        resizeRef.current.oh + e.clientY - resizeRef.current.sy,
      );
      const maxW = Math.max(minW, viewport.w - 16);
      const maxH = Math.max(minH, viewport.h - 80);
      setSize({ w: Math.min(maxW, w), h: Math.min(maxH, h) });
    },
    [resizing, viewport.w, viewport.h],
  );

  const onResizePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (pointerIdRef.current !== e.pointerId) return;
      let finalSize = size;
      if (resizeRef.current) {
        const minW = viewport.w < 640 ? 220 : 280;
        const minH = viewport.w < 640 ? 160 : 180;
        const w = Math.max(
          minW,
          resizeRef.current.ow + e.clientX - resizeRef.current.sx,
        );
        const h = Math.max(
          minH,
          resizeRef.current.oh + e.clientY - resizeRef.current.sy,
        );
        const maxW = Math.max(minW, viewport.w - 16);
        const maxH = Math.max(minH, viewport.h - 80);
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
        chart.minimized ? 54 : finalSize.h,
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
      chart.minimized,
    ],
  );

  // ── Data ──
  const { categories, series } = useMemo(
    () => resolveChartData(chart, rows, columns),
    [chart, rows, columns],
  );

  const apexOptions = useMemo(
    () => buildOptions(chart, categories, isDark, size.w),
    [chart, categories, isDark, size.w],
  );

  const apexSeries = useMemo(() => {
    if (chart.kind === "pie" || chart.kind === "donut")
      return series[0]?.data ?? [];
    return series;
  }, [chart.kind, series]);

  const hasData =
    categories.length > 0 &&
    series.length > 0 &&
    series.some((s) => s.data.length > 0);

  // ── CORRECT isUnconfigured check ──
  // Categorical charts (pie/donut/radar) only need labelColumnKey
  // Other charts need labelColumnKey + at least one seriesKey
  const isCat = CATEGORICAL_KINDS.has(chart.kind);
  const labelColumn = columns.find((c) => c.key === chart.labelColumnKey);
  const invalidLabelColumn =
    chart.dataMode === "sheet" &&
    !!chart.labelColumnKey &&
    !isChartableLabelColumn(labelColumn);

  const isUnconfigured =
    chart.dataMode === "sheet"
      ? !chart.labelColumnKey ||
        invalidLabelColumn ||
        (!isCat && chart.seriesKeys.length === 0)
      : chart.manualCategories.length === 0 ||
        chart.manualSeries.every((s) => s.values.length === 0);

  // ── Theme ──
  const accent = "#1a7a4a";
  const accentBorder = isActive ? accent : isDark ? "#1e2330" : "#e2e8f0";
  const bg = isDark ? "#0f1117" : "#ffffff";
  const headBg = isDark ? "#131620" : "#f8fafc";
  const titleC = isDark ? "#e2e8f0" : "#0f172a";
  const mutedC = isDark ? "#475569" : "#94a3b8";

  const effectiveW = isMobile ? Math.min(size.w, viewport.w - 16) : size.w;
  const effectiveH = size.h;
  const mobileStyle: React.CSSProperties = {
    position: "absolute",
    left: isMobile
      ? clamp(pos.x, pos.y, effectiveW, chart.minimized ? 54 : effectiveH).x
      : pos.x,
    top: isMobile
      ? clamp(pos.x, pos.y, effectiveW, chart.minimized ? 54 : effectiveH).y
      : pos.y,
    width: effectiveW,
    height: chart.minimized ? "auto" : effectiveH,
  };

  return (
    <div
      ref={containerRef}
      className="z-10 rounded-2xl flex flex-col overflow-hidden"
      style={{
        ...mobileStyle,
        border: `2px solid ${accentBorder}`,
        background: bg,
        cursor: dragging ? "grabbing" : "default",
        transition:
          dragging || resizing
            ? "none"
            : "border-color 0.15s, box-shadow 0.15s",
        boxShadow: isActive
          ? `0 0 0 3px ${accent}25, 0 16px 48px rgba(0,0,0,0.22)`
          : isDark
            ? "0 8px 32px rgba(0,0,0,0.5)"
            : "0 8px 32px rgba(0,0,0,0.1)",
        userSelect: "none",
        position: "absolute",
        touchAction: "none",
      }}
      onClick={() => onSelect(chart.id)}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2 shrink-0 border-b"
        style={{
          background: headBg,
          borderColor: isDark ? "#1e2330" : "#e2e8f0",
          cursor: dragging ? "grabbing" : "grab",
          touchAction: "none",
        }}
        onPointerDown={onDragPointerDown}
        onPointerMove={onDragPointerMove}
        onPointerUp={onDragPointerUp}
        onPointerCancel={onDragPointerUp}
      >
        <GripHorizontal
          className="h-3.5 w-3.5 shrink-0"
          style={{ color: mutedC }}
        />
        <BarChart3 className="h-3.5 w-3.5 shrink-0" style={{ color: accent }} />
        <span
          className="flex-1 text-[12px] font-semibold truncate"
          style={{ color: titleC }}
        >
          {chart.title || "Untitled Chart"}
        </span>
        <span
          className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full shrink-0"
          style={{ background: `${accent}20`, color: accent }}
        >
          {chart.kind}
        </span>
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onPointerUp={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onOpenEditor(chart.id);
          }}
          className="h-5 w-5 flex items-center justify-center rounded-md shrink-0"
          style={{ color: mutedC }}
          title="Edit in panel"
        >
          <Pencil className="h-3 w-3" />
        </button>
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onPointerUp={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onMinimize(chart.id, !chart.minimized);
          }}
          className="h-5 w-5 flex items-center justify-center rounded-md shrink-0"
          style={{ color: mutedC }}
        >
          {chart.minimized ? (
            <Maximize2 className="h-3 w-3" />
          ) : (
            <Minimize2 className="h-3 w-3" />
          )}
        </button>
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onPointerUp={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onRemove(chart.id);
          }}
          className="h-5 w-5 flex items-center justify-center rounded-md shrink-0 hover:text-red-400 transition-colors"
          style={{ color: mutedC }}
        >
          <X className="h-3 w-3" />
        </button>
      </div>

      {/* Body */}
      {!chart.minimized && (
        <div
          className="flex-1 overflow-hidden"
          style={{ minHeight: 0, padding: "6px 6px 4px" }}
        >
          {isUnconfigured ? (
            // Prompt to configure
            <div
              className="h-full flex flex-col items-center justify-center gap-3"
              style={{ color: mutedC }}
            >
              <div
                className="h-14 w-14 rounded-2xl flex items-center justify-center"
                style={{ background: isDark ? "#1a2035" : "#f1f5f9" }}
              >
                <Settings2 className="h-7 w-7 opacity-40" />
              </div>
              <div className="text-center space-y-1 px-4">
                <p
                  className="text-[13px] font-semibold"
                  style={{ color: titleC }}
                >
                  Select Data Column
                </p>
                <p className="text-[11px] opacity-60 max-w-[200px] leading-relaxed">
                  {isCat
                    ? "Open the editor → pick any column (status, assignee, priority…) to group and count."
                    : "Open the editor → pick a label column and at least one numeric value column."}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenEditor(chart.id);
                }}
                onMouseDown={(e) => e.stopPropagation()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11.5px] font-semibold"
                style={{ background: accent, color: "#fff" }}
              >
                <Pencil className="h-3 w-3" /> Open Editor
              </button>
            </div>
          ) : hasData ? (
            <ApexChart
              key={`${chart.id}-${chart.kind}-${chart.colorScheme}-${categories.length}-${series.length}`}
              type={
                chart.kind === "donut"
                  ? "donut"
                  : chart.kind === "pie"
                    ? "pie"
                    : chart.kind === "radar"
                      ? "radar"
                      : chart.kind === "area"
                        ? "area"
                        : chart.kind === "scatter"
                          ? "scatter"
                          : chart.kind === "line"
                            ? "line"
                            : "bar"
              }
              options={apexOptions}
              series={apexSeries as any}
              width="100%"
              height={isMobile ? 260 : size.h - 52}
            />
          ) : (
            // Has config but rows returned nothing
            <div
              className="h-full flex flex-col items-center justify-center gap-2"
              style={{ color: mutedC }}
            >
              <BarChart3 className="h-8 w-8 opacity-20" />
              <p className="text-[12px] font-medium opacity-50">
                No data in selected range
              </p>
              <p className="text-[10px] opacity-30">
                Check that the selected column has values in the chosen row
                range.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Resize handle */}
      {!chart.minimized && (
        <div
          className="absolute bottom-0 right-0 w-10 h-10 cursor-se-resize z-20"
          style={{ touchAction: "none" }}
          onPointerDown={onResizePointerDown}
          onPointerMove={onResizePointerMove}
          onPointerUp={onResizePointerUp}
          onPointerCancel={onResizePointerUp}
        >
          <div className="absolute inset-0 flex items-end justify-end pr-1.5 pb-1.5">
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              className=""
            >
              <path
                d="M10 2L2 10M10 6L6 10M10 10"
                stroke={mutedC}
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}

