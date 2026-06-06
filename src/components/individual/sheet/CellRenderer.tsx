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
}: CellRendererProps) {

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
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
            onClick={(e) => {
              e.stopPropagation();
              const overlay = document.createElement("div");
              overlay.style.cssText =
                "position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;cursor:zoom-out";
              const img = document.createElement("img");
              img.src = imgSrc;
              img.style.cssText = "max-width:90vw;max-height:90vh;border-radius:8px;object-fit:contain;box-shadow:0 8px 40px rgba(0,0,0,0.6)";
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
        ) : "";

      default: {
        if (displayValue === undefined) return "";
        const text = String(displayValue);
        const hasMention = text.includes("@");
        if (!hasMention) {
          return (
            <span
              className={
                isWrapped
                  ? "sheet-cell-text break-words whitespace-pre-wrap w-full"
                  : "truncate sheet-cell-text"
              }
            >
              {text}
            </span>
          );
        }
        // Split on @Word sequences and render mentions styled
        const parts = text.split(/(@[\w][\w\s]*?)(?=\s@|\s[^@\w]|$)/g).filter(p => p !== "");
        return (
          <span
            className={
              isWrapped
                ? "sheet-cell-text break-words whitespace-pre-wrap w-full"
                : "truncate sheet-cell-text"
            }
          >
            {parts.map((part, i) =>
              part.startsWith("@") ? (
                <span key={`mention-${i}-${part}`} className="sheet-mention">{part}</span>
              ) : (
                <span key={`text-${i}`}>{part}</span>
              )
            )}
          </span>
        );
      }
    }
  })();

  // ── Alignment ─────────────────────────────────────────────────────────
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

  // First two initials of collaborator name for the avatar bubble
  const collabInitials = activeCollab
    ? activeCollab.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "";

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div
      data-fill-row={rowIdx}
      className={[
        "h-full w-full flex relative group/cell",
        // must be overflow-visible so the label above the cell is visible
        activeCollab ? "overflow-visible" : "overflow-hidden",
        isWrapped ? "items-start pt-1.5" : "items-center",
        justifyClass,
        type === "checkbox" ? "justify-center" : "",
        "px-2.5 py-1 gap-1.5",
        isSelected ? "bg-primary/10" : "",
        isActiveSelected ? "sheet-cell-active-selected" : "",
        validationWarning ? "sheet-cell-validation-warning" : "",
      ].join(" ")}
      style={{
        color: "inherit",
        ...cellStyle,
        // strong colored border + very subtle background tint
        ...(activeCollab
          ? {
            outline: `2px solid ${activeCollab.color}`,
            outlineOffset: "-2px",
            backgroundColor: `${activeCollab.color}18`,
          }
          : {}),
      }}
      onClick={onCellClick}
      onPointerDown={(e) => { if (onPointerDown) onPointerDown(rowIdx, colKey, e); }}
      onPointerEnter={(e) => { if (onPointerEnter) onPointerEnter(rowIdx, colKey, e); }}
      title={activeCollab ? `${activeCollab.name} is editing this cell` : validationWarning ?? undefined}
    >
      {/* ── Collaborator name tag floating above cell ─────────────────── */}
      {activeCollab && (
        <div
          className="absolute left-0 z-50 pointer-events-none select-none"
          style={{ top: "-24px" }}
        >
          {/* pill with avatar initials + name */}
          <div
            className="flex items-center gap-1 pl-1 pr-2 py-[3px] rounded-sm shadow-lg whitespace-nowrap"
            style={{
              backgroundColor: activeCollab.color,
              boxShadow: `0 2px 10px ${activeCollab.color}66`,
            }}
          >
            {/* initials circle */}
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
            {/* full name */}
            <span style={{ fontSize: "10px", fontWeight: 600, color: "#fff", lineHeight: 1 }}>
              {activeCollab.name}
            </span>
          </div>
          {/* tiny downward triangle pointing at cell */}
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

      {/* ── Validation warning icon ───────────────────────────────────── */}
      {validationWarning && (
        <span className="sheet-validation-marker" aria-label={validationWarning}>
          <AlertTriangle className="h-3 w-3" />
        </span>
      )}

      {/* ── Row lock icon ─────────────────────────────────────────────── */}
      {isProtected && (
        <Lock className="absolute top-1 right-1 h-2 w-2 text-gray-300 opacity-0 group-hover/cell:opacity-60 transition-opacity" />
      )}

      {/* ── Comment dot ───────────────────────────────────────────────── */}
      {isOrgSheet && cellComments.length > 0 && <CommentDot count={cellComments.length} />}

      {/* ── Main cell content ─────────────────────────────────────────── */}
      {cellContent}

      {/* ── Fill handle drag button ───────────────────────────────────── */}
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