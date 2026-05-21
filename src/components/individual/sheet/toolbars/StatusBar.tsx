"use client";

import React from "react";
import { BarChart3, Keyboard } from "lucide-react";
import { ColumnDef } from "@/types/index";
import type { RightPanelType } from "@/components/individual/sheet/Right-panel";

interface StatusBarProps {
  rowCount: number;
  columnCount: number;
  selectedRowsCount: number;
  selectedCell: { row: number; col: string } | null;
  columns: ColumnDef[];
  filterValue: string;
  filteredRowsCount: number;
  totalRowsCount: number;
  isOrgSheet: boolean;
  liveTracking: boolean;
  chartCount: number;
  onChartsClick: () => void;
  onShortcutsClick: () => void;
}

export function StatusBar({
  rowCount, columnCount, selectedRowsCount, selectedCell, columns,
  filterValue, filteredRowsCount, totalRowsCount,
  isOrgSheet, liveTracking, chartCount,
  onChartsClick, onShortcutsClick,
}: StatusBarProps) {
  const cellLabel = selectedCell
    ? `${String.fromCharCode(65 + columns.findIndex((c) => c.key === selectedCell.col) + 1)}${selectedCell.row + 1}`
    : null;

  return (
    <div className="sheet-statusbar h-5 border-t flex items-center px-3 gap-3 shrink-0 overflow-x-auto no-scrollbar">
      <span className="sheet-status-text tabular-nums shrink-0">
        {rowCount}r · {columnCount}c
      </span>
      {selectedRowsCount > 0 && (
        <span className="sheet-status-highlight shrink-0">{selectedRowsCount} sel</span>
      )}
      {cellLabel && (
        <span className="sheet-status-cell font-mono shrink-0">{cellLabel}</span>
      )}
      <div className="flex-1" />
      {filterValue && (
        <span className="text-[10px] text-amber-500 font-medium shrink-0">
          {filteredRowsCount}/{totalRowsCount}
        </span>
      )}
      {isOrgSheet && liveTracking && (
        <span className="sheet-status-text flex items-center gap-1 shrink-0">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live
        </span>
      )}
      {chartCount > 0 && (
        <span
          className="text-[10px] font-medium shrink-0 flex items-center gap-1 cursor-pointer hover:opacity-80"
          style={{ color: "#0ea5e9" }}
          onClick={onChartsClick}
        >
          <BarChart3 className="h-2.5 w-2.5" />
          {chartCount} chart{chartCount !== 1 ? "s" : ""}
        </span>
      )}
      <button
        className="sheet-status-text hidden sm:flex items-center gap-1 hover:opacity-80 shrink-0"
        onClick={onShortcutsClick}
      >
        <Keyboard className="h-2.5 w-2.5" />
        Shortcuts
      </button>
    </div>
  );
}