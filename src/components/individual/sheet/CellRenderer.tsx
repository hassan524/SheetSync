"use client";

import React, { useCallback } from "react";
import Image from "next/image";
import { Check, Calendar, Lock, MessageSquare } from "lucide-react";
import { RenderCellProps } from "react-data-grid";
import { SheetRow, ColumnDef } from "@/types/index";
import { getStatusOptionStyle } from "@/lib/sheet-formatting-helpers";
import { getOptionBgStyle } from "@/utils/SheetUtils";
import { CommentDot, CollabCursor } from "@/components/individual/sheet/sheet-ui-helpers";
import type { SheetComment } from "@/lib/querys/sheet/firebase-realtime";

interface CellRendererProps {
  type: ColumnDef["type"];
  props: RenderCellProps<SheetRow, SheetRow>;
  colKey: string;
  rowIdx: number;
  row: SheetRow;
  displayValue: any;
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
}

export function CellRenderer({
  type,
  colKey,
  rowIdx,
  row,
  displayValue,
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
  onPointerDown, onPointerEnter, onFillStart,
  isSelected
}: CellRendererProps) {
  const cellContent = (() => {
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
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3 w-3 text-gray-400" />
            <span className="sheet-cell-text">{String(displayValue)}</span>
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
        ) : (
          ""
        );
      case "image":
        return displayValue ? (
          <Image
            src={String(displayValue)}
            alt="Cell"
            width={32}
            height={32}
            unoptimized
            className="h-8 w-8 rounded object-cover border border-gray-200"
          />
        ) : (
          <span className="text-gray-300 text-[10px] italic">Image URL…</span>
        );
      case "url":
        return displayValue ? (
          <a
            href={String(displayValue)}
            target="_blank"
            rel="noopener noreferrer"
            className="sheet-link truncate"
          >
            {String(displayValue)}
          </a>
        ) : null;
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
      default:
        return displayValue !== undefined ? (
          <span
            className={
              isWrapped
                ? "sheet-cell-text break-words whitespace-pre-wrap w-full"
                : "truncate sheet-cell-text"
            }
          >
            {String(displayValue)}
          </span>
        ) : (
          ""
        );
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

  return (
    <div
      data-fill-row={rowIdx}
      className={`h-full w-full flex relative group/cell ${isWrapped ? "items-start pt-1.5" : "items-center"} ${justifyClass} ${type === "checkbox" ? "justify-center" : ""} px-2.5 py-1 gap-1.5 ${isSelected ? "bg-primary/10" : ""}`}
      style={{
        color: "inherit",
        ...cellStyle,
        ...(activeCollab
          ? { outline: `2px solid ${activeCollab.color}`, outlineOffset: "-2px" }
          : {}),
      }}
      onClick={onCellClick}
      onPointerDown={(e) => { if (onPointerDown) onPointerDown(rowIdx, colKey, e); }}
      onPointerEnter={(e) => { if (onPointerEnter) onPointerEnter(rowIdx, colKey, e); }}
    >
      {isProtected && (
        <Lock className="absolute top-1 right-1 h-2 w-2 text-gray-300 opacity-0 group-hover/cell:opacity-60 transition-opacity" />
      )}
      {isOrgSheet && cellComments.length > 0 && <CommentDot count={cellComments.length} />}
      {activeCollab && <CollabCursor name={activeCollab.name} color={activeCollab.color} />}
      {cellContent}
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
