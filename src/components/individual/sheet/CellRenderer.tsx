"use client";

import React from "react";
import Image from "next/image";
import { AlertTriangle, Check, Calendar, Lock, MessageSquare } from "lucide-react";
import { RenderCellProps } from "react-data-grid";
import { SheetRow, ColumnDef } from "@/types/index";
import { getStatusOptionStyle } from "@/lib/sheet-formatting-helpers";
import { getOptionBgStyle, formatSheetDate } from "@/utils/SheetUtils";
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
}

export function CellRenderer({
  type,
  colKey,
  rowIdx,
  row,
  displayValue,
  rawFormula,
  colDef,
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
}: CellRendererProps) {

  // ── Resolve mergeMode once so both cellContent and outer div can use it ──
  const mergeMode = (mergeStyle as any)?.__mergeMode as string | undefined;

  // ── Cell content by type ───────────────────────────────────────────────
  const cellContent = (() => {
    if (isActiveSelected && rawFormula) {
      return (
        <span className="sheet-cell-text break-words whitespace-pre-wrap w-full font-mono">
          {rawFormula}
        </span>
      );
    }

    switch (type) {
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

      case "currency":
        return displayValue ? (
          <span className="tabular-nums sheet-cell-mono">
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: colDef?.currencyCode || "USD",
              minimumFractionDigits: 2,
            }).format(Number(displayValue))}
          </span>
        ) : "";

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
        const optionStyle = getOptionBgStyle(val);
        if (!val)
          return <span className="text-gray-300 text-[10px] italic">Select…</span>;
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

        // ── Merge master: respect isWrapped + mergeMode for text behaviour ──
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
                // If text wrap enabled → wrap regardless of merge mode.
                // merge-across without wrap → truncate like a normal cell.
                // merge-down / merge-all without wrap → still wrap (multi-row).
                whiteSpace: isWrapped ? "pre-wrap" : mergeMode === "across" ? "nowrap" : "pre-wrap",
                overflowWrap: isWrapped ? "break-word" : mergeMode === "across" ? "normal" : "break-word",
                wordBreak: isWrapped ? "break-word" : mergeMode === "across" ? "normal" : "break-word",
                overflow: "hidden",
                textOverflow: isWrapped ? "clip" : mergeMode === "across" ? "ellipsis" : "clip",
                textAlign: mergeMode === "center" ? "center" : "left",
                lineHeight: 1.5,
              }}
            >
              {content}
            </span>
          );
        }

        // ── Normal (non-merge) text cell ──────────────────────────────────
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

  // ── Alignment (non-merge cells only) ──────────────────────────────────
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

  // ── Merge master background (paints over covered cells) ───────────────
  const mergeBg =
    cellStyle.backgroundColor && cellStyle.backgroundColor !== "transparent"
      ? cellStyle.backgroundColor
      : typeof document !== "undefined" && document.body.dataset.sheetDark === "true"
        ? "#131620"
        : "#ffffff";

  // ── Merge master absolute-positioning override ────────────────────────
  // react-data-grid has no native colspan/rowspan; we fake it by making the
  // master cell position:absolute and sizing it to cover all sibling cells.
  // The bottom border is drawn explicitly so merge-across rows always show
  // the horizontal grid line regardless of the cell's own border being stripped.
  // Always apply absolute overlay for merge masters so the div can
  // visually span beyond the single rdg-cell boundary into sibling cells.
  // The parent rdg-cell must have overflow:visible (handled in sheet.css).
  // ── Merge master absolute-positioning override ────────────────────────
  // Always applied for merge masters. The absolute div escapes the rdg-cell
  // boundary (which must have overflow:visible in CSS) to visually span
  // all merged rows/columns.
  const mergeOverrideStyle: React.CSSProperties = isMergeMaster
    ? {
      position: "absolute",
      top: 0,
      left: 0,
      width: mergeMode === "across" || mergeMode === "all" || mergeMode === "center"
        ? (autoOverflowWidth ? `${autoOverflowWidth - 1}px` : "calc(100% - 1px)")
        : "calc(100% - 1px)",
      height: mergeMode === "down" || mergeMode === "all" || mergeMode === "center"
        ? (mergedHeight ? `${mergedHeight - 1}px` : "calc(100% - 1px)")
        : "calc(100% - 1px)",
      zIndex: 8,
      backgroundColor: mergeBg,
      borderTop: "none",
      borderLeft: "none",
      borderRight: `1px solid var(--rdg-border-color, #e8eaed)`,
      borderBottom: `1px solid var(--rdg-border-color, #e8eaed)`,
      boxShadow: isSelected
        ? "inset 0 0 0 2px var(--primary, #0d7c5f)"
        : "none",
      boxSizing: "border-box",
      overflow: "hidden",
      transition: "background-color 0.1s ease",
      outline: "none",
    }
    : {};

  // ── Class list ────────────────────────────────────────────────────────
  const rootClass = [
    "h-full w-full flex relative group/cell",
    // Overflow — merge masters need visible so the absolute overlay can bleed out
    isMergeMaster ? "overflow-visible" : (activeCollab || shouldAutoOverflow ? "overflow-visible" : "overflow-hidden"),
    shouldAutoOverflow ? "sheet-cell-auto-overflow-master" : "",
    isAutoOverflowCovered ? "sheet-cell-auto-overflow-covered" : "",
    // Vertical + horizontal alignment
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
    // Selection highlight — skip on merge master to avoid fighting mergeOverrideStyle's bg
    !isMergeMaster && isSelected ? "bg-primary/10" : "",
    !isMergeMaster && isActiveSelected ? "sheet-cell-active-selected" : "",
    validationWarning ? "sheet-cell-validation-warning" : "",
  ]
    .filter(Boolean)
    .join(" ");

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div
      data-fill-row={rowIdx}
      className={rootClass}
      style={{
        color: "inherit",
        ...cellStyle,
        ...mergeStyle,
        ...mergeOverrideStyle,
        // Merge master: clip content within the overlay bounds
        ...(isMergeMaster ? { overflow: "hidden" } : {}),
        // Collaborator presence highlight (overrides merge bg for collab)
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
      {/* ── Collaborator name tag floating above cell ──────────────────── */}
      {activeCollab && (
        <div
          className="absolute left-0 z-50 pointer-events-none select-none"
          style={{ top: "-24px" }}
        >
          <div
            className="flex items-center gap-1 pl-1 pr-2 py-[3px] rounded-sm shadow-lg whitespace-nowrap"
            style={{
              backgroundColor: activeCollab.color,
              boxShadow: `0 2px 10px ${activeCollab.color}66`,
            }}
          >
            <div
              className="h-4 w-4 rounded-full flex items-center justify-center shrink-0"
              style={{
                backgroundColor: "rgba(255,255,255,0.3)",
                fontSize: "8px",
                fontWeight: 800,
                color: "#fff",
                lineHeight: 1,
              }}
            >
              {collabInitials}
            </div>
            <span
              style={{ fontSize: "10px", fontWeight: 600, color: "#fff", lineHeight: 1 }}
            >
              {activeCollab.name}
            </span>
          </div>
          <div
            style={{
              width: 0,
              height: 0,
              borderLeft: "4px solid transparent",
              borderRight: "4px solid transparent",
              borderTop: `4px solid ${activeCollab.color}`,
              marginLeft: "8px",
            }}
          />
        </div>
      )}

      {/* ── Validation warning icon ────────────────────────────────────── */}
      {validationWarning && (
        <span className="sheet-validation-marker" aria-label={validationWarning}>
          <AlertTriangle className="h-3 w-3" />
        </span>
      )}

      {/* ── Row lock icon ──────────────────────────────────────────────── */}
      {isProtected && (
        <Lock className="absolute top-1 right-1 h-2 w-2 text-gray-300 opacity-0 group-hover/cell:opacity-60 transition-opacity" />
      )}

      {/* ── Comment dot ───────────────────────────────────────────────── */}
      {isOrgSheet && cellComments.length > 0 && (
        <CommentDot count={cellComments.length} />
      )}

      {/* ── Main cell content ──────────────────────────────────────────── */}
      <span
        className={
          shouldAutoOverflow ? "sheet-cell-auto-overflow-content" : "contents"
        }
        style={contentStyle}
      >
        {cellContent}
      </span>

      {/* ── Fill handle drag button ────────────────────────────────────── */}
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

      {/* ── Comment button (org sheets) ───────────────────────────────── */}
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