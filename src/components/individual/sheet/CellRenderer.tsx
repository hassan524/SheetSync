"use client";

import React from "react";
import Image from "next/image";
import { AlertTriangle, Check, Calendar, Lock, MessageSquare, ChevronDown } from "lucide-react";
import { RenderCellProps } from "react-data-grid";
import { SheetRow, ColumnDef } from "@/types/index";
import { getStatusOptionStyle } from "@/lib/sheet-formatting-helpers";
import { getOptionBgStyle, formatSheetDate, ROW_CELL_SELECT_OPTIONS_KEY } from "@/utils/SheetUtils";
import { CommentDot } from "@/components/individual/sheet/sheet-ui-helpers";
import type { SheetComment } from "@/lib/querys/sheet/firebase-realtime";

interface CellRendererProps {
  type: ColumnDef["type"];
  props: RenderCellProps<SheetRow, SheetRow>;
  colKey: string;
  rowIdx: number;
  row: SheetRow;
  displayValue: any;
  rawFormula?: string;
  colDef?: ColumnDef;
  currencyCode?: string;
  isWrapped: boolean;
  isProtected: boolean;
  isOrgSheet: boolean;
  cellStyle: React.CSSProperties;
  cellComments: SheetComment[];
  activeCollab: { name: string; color: string } | null;
  horizontalAlign?: "left" | "center" | "right";
  onCellClick: () => void;
  onCommentClick: (e: React.MouseEvent) => void;
  onPointerDown?: (row: number, colKey: string, e: React.PointerEvent) => void;
  onPointerEnter?: (row: number, colKey: string, e: React.PointerEvent) => void;
  onFillStart?: (row: number, colKey: string, e: React.PointerEvent) => void;
  isSelected?: boolean;
  isActiveSelected?: boolean;
  validationWarning?: string | null;
  mergeStyle?: React.CSSProperties;
  isMergeMaster?: boolean;
  autoOverflowWidth?: number;
  isAutoOverflowMaster?: boolean;
  isAutoOverflowCovered?: boolean;
  mergedHeight?: number;
  isLayoutRow?: boolean;
}

export function CellRenderer({
  type,
  colKey,
  rowIdx,
  row,
  displayValue,
  rawFormula,
  colDef,
  currencyCode,
  isWrapped,
  isProtected,
  isOrgSheet,
  cellStyle,
  cellComments,
  activeCollab,
  horizontalAlign,
  onCellClick,
  onCommentClick,
  onPointerDown,
  onPointerEnter,
  onFillStart,
  isSelected,
  isActiveSelected,
  validationWarning,
  mergeStyle,
  isMergeMaster,
  autoOverflowWidth,
  isAutoOverflowMaster,
  isAutoOverflowCovered,
  mergedHeight,
  isLayoutRow,
}: CellRendererProps) {

  const mergeMode = (mergeStyle as any)?.__mergeMode as string | undefined;
  const mergeTextAlign =
    (cellStyle.textAlign as React.CSSProperties["textAlign"]) ??
    (mergeMode === "center" ? "center" : "left");

  const effectiveType: ColumnDef["type"] =
    (isLayoutRow || (cellStyle as any)?.isLayoutRow) ? "text" : type;

  // ── Cell content engine ────────────────────────────────────────────────
  const cellContent = (() => {
    switch (effectiveType) {
      case "status":
      case "priority": {
        const opt = getStatusOptionStyle(String(displayValue ?? ""));
        if (!opt) return <span className="sheet-cell-text">{displayValue}</span>;
        return (
          <span
            className="sheet-badge-pill"
            style={{ color: opt.color, backgroundColor: opt.bgColor }}
          >
            {opt.label}
          </span>
        );
      }

      case "checkbox":
        return displayValue ? (
          <span className="h-6 w-6 rounded-md bg-emerald-500/15 border border-emerald-600/60 flex items-center justify-center">
            <Check className="h-4 w-4 text-emerald-700" />
          </span>
        ) : (
          <span className="h-5 w-5 rounded border border-gray-400/80 bg-white" />
        );

      case "date":
        return displayValue ? (
          <div className="flex items-center gap-1.5" style={{ color: "inherit" }}>
            <Calendar className="h-3 w-3 shrink-0" style={{ color: "inherit", opacity: 0.5 }} />
            <span className="sheet-cell-text">{formatSheetDate(displayValue)}</span>
          </div>
        ) : null;

      case "currency": {
        const num = Number(displayValue);
        if (!displayValue || displayValue === "" || isNaN(num) || num === 0) return "";
        return (
          <span className="tabular-nums sheet-cell-mono">
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: currencyCode || colDef?.currencyCode || "USD",
              minimumFractionDigits: 2,
            }).format(num)}
          </span>
        );
      }

      case "image": {
        const imgSrc = String(displayValue ?? "").trim();
        const isValidImg =
          imgSrc.startsWith("data:image") ||
          /^https?:\/\/.+\.(png|jpe?g|gif|webp|svg|bmp|ico)(\?.*)?$/i.test(imgSrc) ||
          /^https?:\/\//i.test(imgSrc);
        if (!imgSrc || !isValidImg) {
          return <span className="text-gray-300 text-[10px] italic">No image</span>;
        }
        return (
          <img
            src={imgSrc}
            alt="Cell"
            className="h-8 w-8 rounded object-cover border border-gray-200 cursor-zoom-in"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
            onClick={(e) => {
              e.stopPropagation();
              const overlay = document.createElement("div");
              overlay.style.cssText =
                "position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;cursor:zoom-out";
              const img = document.createElement("img");
              img.src = imgSrc;
              img.style.cssText =
                "max-width:90vw;max-height:90vh;border-radius:8px;object-fit:contain;box-shadow:0 8px 40px rgba(0,0,0,0.6)";
              overlay.appendChild(img);
              overlay.onclick = () => document.body.removeChild(overlay);
              document.body.appendChild(overlay);
            }}
          />
        );
      }

      case "url": {
        if (!displayValue) return null;
        const raw = String(displayValue).trim();
        const href = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
        return (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="sheet-link truncate"
            onClick={(e) => e.stopPropagation()}
          >
            {raw}
          </a>
        );
      }

      case "progress": {
        const pct = Math.min(100, Math.max(0, Number(displayValue ?? 0)));
        const color =
          pct >= 80 ? "#166534" : pct >= 50 ? "#b45309" : pct >= 20 ? "#1d4ed8" : "#6b7280";
        const bg =
          pct >= 80 ? "#dcfce7" : pct >= 50 ? "#fef3c7" : pct >= 20 ? "#dbeafe" : "#f3f4f6";
        return (
          <div className="flex items-center gap-2 w-full px-1">
            <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${pct}%`, backgroundColor: color }}
              />
            </div>
            <span
              className="text-[10.5px] font-semibold tabular-nums shrink-0 px-1.5 py-0.5 rounded"
              style={{ color, backgroundColor: bg }}
            >
              {pct}%
            </span>
          </div>
        );
      }

      case "select": {
        const val = String(displayValue ?? "");
        if (!val)
          return <span className="text-gray-300 text-[10px] italic">Select…</span>;

        // Try to find custom options first in row's cell-specific options
        const rowSelects = row[ROW_CELL_SELECT_OPTIONS_KEY as any];
        let selectOpts: any[] = [];
        if (rowSelects && typeof rowSelects === "object") {
          selectOpts = rowSelects[colKey] ?? [];
        }
        // Fallback to column-level select options
        if (selectOpts.length === 0 && colDef?.selectOptions) {
          selectOpts = colDef.selectOptions;
        }

        // Find the option by label
        const matchedOpt = selectOpts.find(
          (opt) => (typeof opt === "object" ? opt.label : opt) === val
        );

        // Get style using the matched option (or fallback to hashing value)
        const optionStyle = matchedOpt ? getOptionBgStyle(matchedOpt) : getOptionBgStyle(val);

        return (
          <span className="sheet-badge-pill" style={optionStyle}>
            {val}
          </span>
        );
      }

      case "number":
        return displayValue !== undefined ? (
          <span className="truncate sheet-cell-text tabular-nums">{String(displayValue)}</span>
        ) : (
          ""
        );

      default: {
        if (displayValue === undefined) return "";
        const text = String(displayValue);

        if (isMergeMaster) {
          const hasMention = text.includes("@");
          const content = hasMention
            ? text
              .split(/(@[\w][\w\s]*?)(?=\s@|\s[^@\w]|$)/g)
              .filter(Boolean)
              .map((part, i) =>
                part.startsWith("@") ? (
                  <span key={`mention-${i}`} className="sheet-mention">
                    {part}
                  </span>
                ) : (
                  <span key={`text-${i}`}>{part}</span>
                )
              )
            : text;

          return (
            <span
              className="sheet-cell-text"
              style={{
                display: "block",
                width: "100%",
                whiteSpace: isWrapped ? "pre-wrap" : mergeMode === "across" ? "nowrap" : "pre-wrap",
                overflowWrap: isWrapped ? "break-word" : mergeMode === "across" ? "normal" : "break-word",
                wordBreak: isWrapped ? "break-word" : mergeMode === "across" ? "normal" : "break-word",
                overflow: "hidden",
                textOverflow: isWrapped ? "clip" : mergeMode === "across" ? "ellipsis" : "clip",
                textAlign: mergeTextAlign,
                lineHeight: 1.5,
              }}
            >
              {content}
            </span>
          );
        }

        const hasMention = text.includes("@");
        const spanClass = isWrapped
          ? "sheet-cell-text break-words whitespace-pre-wrap w-full"
          : isAutoOverflowMaster
            ? "sheet-cell-text whitespace-pre"
            : "truncate sheet-cell-text";

        if (!hasMention) {
          return <span className={spanClass}>{text}</span>;
        }

        const parts = text
          .split(/(@[\w][\w\s]*?)(?=\s@|\s[^@\w]|$)/g)
          .filter((p) => p !== "");
        return (
          <span className={spanClass}>
            {parts.map((part, i) =>
              part.startsWith("@") ? (
                <span key={`mention-${i}-${part}`} className="sheet-mention">
                  {part}
                </span>
              ) : (
                <span key={`text-${i}`}>{part}</span>
              )
            )}
          </span>
        );
      }
    }
  })();

  const justifyClass =
    horizontalAlign === "center"
      ? "justify-center"
      : horizontalAlign === "right"
        ? "justify-end"
        : horizontalAlign === "left"
          ? "justify-start"
          : type === "currency" || type === "number"
            ? "justify-end"
            : "";

  const shouldAutoOverflow = Boolean(
    isAutoOverflowMaster && autoOverflowWidth && !isWrapped && !isMergeMaster
  );

  const contentStyle: React.CSSProperties | undefined = shouldAutoOverflow
    ? {
      width: autoOverflowWidth,
      maxWidth: "none",
      pointerEvents: "none",
      whiteSpace: "pre",
    }
    : undefined;

  const collabInitials = activeCollab
    ? activeCollab.name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
    : "";

  const isDarkMode = typeof document !== "undefined" && document.body.dataset.sheetDark === "true";
  const rawBg = cellStyle.backgroundColor;
  const isTransparent = !rawBg ||
    rawBg === "transparent" ||
    rawBg === "rgba(0, 0, 0, 0)" ||
    rawBg === "rgba(0,0,0,0)";
  const mergeBg = isTransparent
    ? (isDarkMode ? "#131620" : "#ffffff")
    : rawBg;

  const mergeOverrideStyle: React.CSSProperties = isMergeMaster
    ? {
        position: "absolute",
        top: 0,
        left: 0,
        width: (() => {
          if (mergeMode === "across" || mergeMode === "all" || mergeMode === "center") {
            return autoOverflowWidth ? `${autoOverflowWidth}px` : "100%";
          }
          return "100%";
        })(),
        height: (() => {
          if (mergeMode === "down" || mergeMode === "all" || mergeMode === "center") {
            return mergedHeight ? `${mergedHeight}px` : "100%";
          }
          return "100%";
        })(),
        zIndex: 8,
        backgroundColor: mergeBg,
        boxSizing: "border-box" as const,
        overflow: "hidden",
        clipPath: "inset(0 0 0 0)",
        willChange: "transform",
        transform: "translateZ(0)",
        transition: "background-color 0.1s ease",
        outline: "none",
      }
    : {};

  // ── FIX CONDITIONS: Isolate explicit user custom borders ──────────────────
  const hasExplicitBorder = Boolean(
    (cellStyle.borderStyle && cellStyle.borderStyle !== "none") ||
    (cellStyle.borderTop && cellStyle.borderTop !== "none") ||
    (cellStyle.borderBottom && cellStyle.borderBottom !== "none") ||
    (cellStyle.borderLeft && cellStyle.borderLeft !== "none") ||
    (cellStyle.borderRight && cellStyle.borderRight !== "none")
  );
  
  const explicitBorderStyle: React.CSSProperties = (cellStyle.borderStyle && cellStyle.borderStyle !== "none")
    ? {
        borderStyle: cellStyle.borderStyle,
        borderWidth: cellStyle.borderWidth ?? "1px",
        borderColor: cellStyle.borderColor ?? (isDarkMode ? "#374151" : "#e5e7eb"),
      }
    : {};

  const rootClass = [
    "h-full w-full flex relative group/cell",
    isMergeMaster ? "overflow-visible" : (activeCollab || shouldAutoOverflow ? "overflow-visible" : "overflow-hidden"),
    shouldAutoOverflow ? "sheet-cell-auto-overflow-master" : "",
    isAutoOverflowCovered ? "sheet-cell-auto-overflow-covered" : "",
    isMergeMaster
      ? [
          "items-start pt-1.5 pb-1.5 sheet-cell-merge-master",
          mergeMode === "center" ? "justify-center" : "justify-start",
        ].join(" ")
      : [
          isWrapped ? "items-start pt-1.5" : "items-center",
          justifyClass,
        ].join(" "),
    type === "checkbox" ? "justify-center" : "",
    "px-2.5 gap-1.5",
    !isMergeMaster && isSelected ? "bg-primary/10" : "",
    !isMergeMaster && isActiveSelected ? "sheet-cell-active-selected" : "",
    validationWarning ? "sheet-cell-validation-warning" : "",
    rawFormula ? "sheet-cell-has-formula" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      data-fill-row={rowIdx}
      // ── Explicit structural tags passed straight up to parents via inline CSS variable hooks ──
      data-explicit-border={hasExplicitBorder ? "true" : "false"}
      className={rootClass}
      style={{
        color: "inherit",
        ...cellStyle,
        ...mergeStyle,
        ...mergeOverrideStyle,
        ...explicitBorderStyle, 
        // Force an internal custom variable that bypasses the universal root color override
        ...((hasExplicitBorder && cellStyle.borderColor) ? { "--local-border-color": cellStyle.borderColor } : {}),
        ...(isMergeMaster ? { overflow: "hidden" } : {}),
        ...(activeCollab
          ? {
              outline: `2px solid ${activeCollab.color}`,
              outlineOffset: "-2px",
              backgroundColor: `${activeCollab.color}18`,
            }
          : {}),
      }}
      onClick={(e) => {
        if (isMergeMaster) e.stopPropagation();
        onCellClick();
      }}
      onPointerDown={(e) => {
        if (isMergeMaster) e.stopPropagation();
        if (onPointerDown) onPointerDown(rowIdx, colKey, e);
      }}
      onPointerEnter={(e) => {
        if (onPointerEnter) onPointerEnter(rowIdx, colKey, e);
      }}
      title={
        activeCollab
          ? `${activeCollab.name} is editing this cell`
          : validationWarning ?? undefined
      }
    >
      {activeCollab && (
        <div className="absolute left-0 z-50 pointer-events-none select-none" style={{ top: "-24px" }}>
          <div
            className="flex items-center gap-1 pl-1 pr-2 py-[3px] rounded-sm shadow-lg whitespace-nowrap"
            style={{ backgroundColor: activeCollab.color, boxShadow: `0 2px 10px ${activeCollab.color}66` }}
          >
            <div
              className="h-4 w-4 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: "rgba(255,255,255,0.3)", fontSize: "8px", fontWeight: 800, color: "#fff", lineHeight: 1 }}
            >
              {collabInitials}
            </div>
            <span style={{ fontSize: "10px", fontWeight: 600, color: "#fff", lineHeight: 1 }}>
              {activeCollab.name}
            </span>
          </div>
          <div style={{ width: 0, height: 0, borderLeft: "4px solid transparent", borderRight: "4px solid transparent", borderTop: `4px solid ${activeCollab.color}`, marginLeft: "8px" }} />
        </div>
      )}

      {validationWarning && (
        <span className="sheet-validation-marker" aria-label={validationWarning}>
          <AlertTriangle className="h-3 w-3" />
        </span>
      )}

      {isProtected && (
        <Lock className="absolute top-1 right-1 h-2 w-2 text-gray-300 opacity-0 group-hover/cell:opacity-60 transition-opacity" />
      )}

      {isOrgSheet && cellComments.length > 0 && (
        <CommentDot count={cellComments.length} />
      )}

      <span className={shouldAutoOverflow ? "sheet-cell-auto-overflow-content" : "contents"} style={contentStyle}>
        {cellContent}
      </span>

      {(effectiveType === "priority" || effectiveType === "status" || effectiveType === "select") && (
        <ChevronDown className="h-3.5 w-3.5 text-gray-400/60 group-hover/cell:text-gray-400 transition-colors ml-auto shrink-0 pointer-events-none" />
      )}

      {isSelected && onFillStart && (
        <button
          type="button"
          className="absolute -bottom-1 -right-1 h-2.5 w-2.5 rounded-sm border border-white bg-primary shadow cursor-crosshair"
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onFillStart(rowIdx, colKey, e);
          }}
          aria-label="Fill handle"
        />
      )}

      {isOrgSheet && (
        <button
          className="absolute bottom-0.5 right-0.5 opacity-0 group-hover/cell:opacity-100 transition-opacity duration-100"
          onClick={onCommentClick}
        >
          <MessageSquare className="h-2.5 w-2.5 text-gray-300 hover:text-amber-500 transition-colors" />
        </button>
      )}
    </div>
  );
}
