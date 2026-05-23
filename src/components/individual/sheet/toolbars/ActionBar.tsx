"use client";

import React from "react";
import {
  Plus, Trash2, ArrowDownAZ, ArrowUpAZ, SlidersHorizontal, Eye, EyeOff,
  BarChart3, MessageSquare, Users, Clock, Columns3, Code2, Paintbrush,
  Sun, Moon, Keyboard, ChevronDown, Rows3, PanelRight, Lock, Zap, Sparkles, ListChecks,
  Pin,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ColumnDef } from "@/types/index";
import { IconBtn, ToolSep, ddStyle, ddItemStyle } from "@/components/individual/sheet/sheet-ui-helpers";
import type { RightPanelType } from "@/components/individual/sheet/Right-panel";
import { ConditionalFormatRule } from "@/types/index";

interface ActionBarProps {
  isDark: boolean;
  isOrgSheet: boolean;
  userRole?: "owner" | "editor" | "viewer";
  ownerId: string | null;
  currentUserId?: string;
  selectedRows: Set<string>;
  selectedCell: { row: number; col: string } | null;
  columns: ColumnDef[];
  showFilters: boolean;
  filterValue: string;
  advancedFiltersCount: number;
  chartCount: number;
  showChartPicker: boolean;
  conditionalRulesCount: number;
  effectiveRightPanel: RightPanelType;
  totalComments: number;
  historyLength: number;
  frozenRowsCount?: number;
  onInsertRow: () => void;
  onInsertColumn: (type: ColumnDef["type"]) => void;
  onDeleteRow: () => void;
  onSortAsc: () => void;
  onSortDesc: () => void;
  onToggleFilters: () => void;
  onHideColumn: () => void;
  onToggleChartPicker: () => void;
  onTogglePanel: (panel: RightPanelType) => void;
  onToggleRowProtection?: () => void;
  onTogglePinRow?: () => void;
  selectedRowPinned?: boolean;
  onToggleDark: () => void;
  onToggleFreezeRows?: () => void;
  chartBtnRef: React.RefObject<HTMLButtonElement>;
}

const COLUMN_TYPES: ColumnDef["type"][] = [
  "text", "number", "currency", "date", "checkbox",
  "status", "priority", "url", "image", "select", "progress",
];

export function ActionBar({
  isDark, isOrgSheet, userRole, ownerId, currentUserId,
  selectedRows, selectedCell, columns, showFilters, filterValue,
  advancedFiltersCount, chartCount, showChartPicker, conditionalRulesCount,
  effectiveRightPanel, totalComments, frozenRowsCount = 0,
  onInsertRow, onInsertColumn, onDeleteRow, onSortAsc, onSortDesc,
  onToggleFilters, onHideColumn, onToggleChartPicker, onTogglePanel,
  onToggleRowProtection, onToggleDark, onToggleFreezeRows, chartBtnRef,
  onTogglePinRow, selectedRowPinned,
}: ActionBarProps) {
  const selStyle = ddStyle(isDark);
  const isViewer = userRole === "viewer";
  const isOwner = ownerId === currentUserId;
  const selectedColHidden = selectedCell
    ? columns.find((c) => c.key === selectedCell.col)?.hidden
    : false;

  return (
    <div className="sheet-actionbar border-b shrink-0" style={{ height: "36px" }}>
      <div className="h-full flex items-center px-2 gap-0.5 overflow-x-auto hide-scrollbar">
        {!isViewer && (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="sheet-action-btn flex items-center gap-1 h-6 px-2.5 rounded text-[11px] font-medium shrink-0"
                  onClick={onInsertRow}
                >
                  <Plus className="h-3 w-3" />
                  Row
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="sheet-tooltip text-[11px]">
                Insert a new row at the bottom
              </TooltipContent>
            </Tooltip>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="sheet-action-btn flex items-center gap-1 h-6 px-2.5 rounded text-[11px] font-medium shrink-0">
                  <Plus className="h-3 w-3" />
                  Column
                  <ChevronDown className="h-2.5 w-2.5 opacity-50 ml-0.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                collisionPadding={10}
                className="w-44 max-h-[min(60vh,300px)] overflow-y-auto hide-scrollbar"
                style={selStyle}
              >
                <DropdownMenuLabel
                  className="text-[10px] uppercase tracking-wider"
                  style={{ color: isDark ? "#4a5568" : "#9ca3af" }}
                >
                  Column type
                </DropdownMenuLabel>
                <DropdownMenuSeparator style={{ background: isDark ? "#1e2330" : "#e8eaed" }} />
                {COLUMN_TYPES.map((t) => (
                  <DropdownMenuItem
                    key={t}
                    className="text-xs capitalize"
                    onClick={() => onInsertColumn(t)}
                    style={ddItemStyle(isDark)}
                  >
                    {t === "select" ? "Dropdown" : t}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  disabled={selectedRows.size === 0}
                  onClick={onDeleteRow}
                  className={`sheet-action-btn sheet-action-btn--danger flex items-center gap-1 h-6 px-2.5 rounded text-[11px] font-medium shrink-0 ${selectedRows.size === 0 ? "opacity-35 cursor-not-allowed" : ""}`}
                >
                  <Trash2 className="h-3 w-3" />
                  {selectedRows.size > 0 ? `Delete (${selectedRows.size})` : "Delete"}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="sheet-tooltip text-[11px]">
                Delete selected rows
              </TooltipContent>
            </Tooltip>
            {onToggleFreezeRows && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className={`sheet-action-btn flex items-center gap-1 h-6 px-2.5 rounded text-[11px] font-medium shrink-0 ${frozenRowsCount > 0 ? "sheet-action-btn--active" : ""}`}
                    onClick={onToggleFreezeRows}
                  >
                    <Rows3 className="h-3.5 w-3.5" />
                    {frozenRowsCount > 0 ? "Unfreeze top row" : "Freeze top row"}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="sheet-tooltip text-[11px]">
                  Freeze keeps the top row visible while scrolling; it does not lock editing
                </TooltipContent>
              </Tooltip>
            )}
            <ToolSep />

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="sheet-action-btn flex items-center gap-1 h-6 px-2.5 rounded text-[11px] font-medium shrink-0"
                  onClick={onSortAsc}
                >
                  <ArrowDownAZ className="h-3.5 w-3.5" />
                  A→Z
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="sheet-tooltip text-[11px]">
                Sort selected column A to Z
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="sheet-action-btn flex items-center gap-1 h-6 px-2.5 rounded text-[11px] font-medium shrink-0"
                  onClick={onSortDesc}
                >
                  <ArrowUpAZ className="h-3.5 w-3.5" />
                  Z→A
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="sheet-tooltip text-[11px]">
                Sort selected column Z to A
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className={`sheet-action-btn flex items-center gap-1 h-6 px-2.5 rounded text-[11px] font-medium shrink-0 ${showFilters ? "sheet-action-btn--active" : ""}`}
                  onClick={onToggleFilters}
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  Filter
                  {(filterValue || advancedFiltersCount > 0) && (
                    <span className="h-1.5 w-1.5 rounded-full bg-primary ml-0.5" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="sheet-tooltip text-[11px]">
                Filter rows by column values
              </TooltipContent>
            </Tooltip>
            <ToolSep />

            {isOrgSheet && isOwner && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className="sheet-action-btn flex items-center gap-1 h-6 px-2.5 rounded text-[11px] font-medium shrink-0"
                    onClick={onHideColumn}
                  >
                    {selectedColHidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    {selectedColHidden ? "Show" : "Hide"}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="sheet-tooltip text-[11px]">
                  {selectedColHidden ? "Show hidden column" : "Hide column from view"} (owner only)
                </TooltipContent>
              </Tooltip>
            )}

            {/* Chart button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  ref={chartBtnRef}
                  className={`sheet-action-btn flex items-center gap-1 h-6 px-2.5 rounded text-[11px] font-medium shrink-0 ${showChartPicker ? "sheet-action-btn--active" : ""}`}
                  onClick={onToggleChartPicker}
                  style={chartCount > 0 ? { color: "#0ea5e9" } : undefined}
                >
                  <BarChart3 className="h-3.5 w-3.5" />
                  Chart
                  {chartCount > 0 && (
                    <span
                      className="text-[9px] font-bold px-1 py-0.5 rounded-full ml-0.5"
                      style={{ background: "#0ea5e920", color: "#0ea5e9" }}
                    >
                      {chartCount}
                    </span>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="sheet-tooltip text-[11px]">
                {showChartPicker ? "Close chart picker" : "Insert a chart"}
              </TooltipContent>
            </Tooltip>
            <ToolSep />
          </>
        )}

        {/* Panel toggles */}
        <IconBtn
          icon={MessageSquare}
          tooltip="Comments"
          onClick={() => onTogglePanel("comments")}
          active={effectiveRightPanel === "comments"}
          badge={totalComments}
        />
        <IconBtn
          icon={PanelRight}
          tooltip="Row details"
          onClick={() => onTogglePanel("row-details")}
          active={effectiveRightPanel === "row-details"}
          disabled={!selectedCell}
        />
        <IconBtn
          icon={Pin}
          tooltip="Pin row"
          onClick={onTogglePinRow}
          active={!!selectedRowPinned}
          disabled={!selectedCell || !onTogglePinRow}
        />
        <IconBtn
          icon={Lock}
          tooltip="Lock/unlock editing for the selected row"
          onClick={onToggleRowProtection}
          disabled={!selectedCell || !onToggleRowProtection}
        />
        {isOrgSheet && (
          <IconBtn
            icon={Users}
            tooltip="Collaborators"
            onClick={() => onTogglePanel("collaborators")}
            active={effectiveRightPanel === "collaborators"}
          />
        )}
        <IconBtn icon={Clock} tooltip="Time Travel — replay & branch" onClick={() => onTogglePanel("timetravel")} active={effectiveRightPanel === "timetravel"} />
        <IconBtn icon={Columns3} tooltip="Columns" onClick={() => onTogglePanel("columns")} active={effectiveRightPanel === "columns"} />
        <IconBtn icon={ListChecks} tooltip="Validation rules" onClick={() => onTogglePanel("validation")} active={effectiveRightPanel === "validation"} />
        <IconBtn icon={Zap} tooltip="Automation rules" onClick={() => onTogglePanel("automation")} active={effectiveRightPanel === "automation"} />
        <IconBtn icon={Sparkles} tooltip="AI assistant" onClick={() => onTogglePanel("aiassistant")} active={effectiveRightPanel === "aiassistant"} />
        <IconBtn icon={Code2} tooltip="Developer tools" onClick={() => onTogglePanel("developer")} active={effectiveRightPanel === "developer"} />
        <IconBtn
          icon={BarChart3}
          tooltip="Charts panel"
          onClick={() => onTogglePanel("charts")}
          active={effectiveRightPanel === "charts"}
          badge={chartCount > 0 ? chartCount : undefined}
        />
        <IconBtn
          icon={Paintbrush}
          tooltip="Conditional formatting"
          onClick={() => onTogglePanel("conditional")}
          active={effectiveRightPanel === "conditional"}
          badge={conditionalRulesCount > 0 ? conditionalRulesCount : undefined}
        />
        <IconBtn icon={isDark ? Sun : Moon} tooltip={isDark ? "Light mode" : "Dark mode"} onClick={onToggleDark} />
        <IconBtn icon={Keyboard} tooltip="Keyboard shortcuts" onClick={() => onTogglePanel("shortcuts")} active={effectiveRightPanel === "shortcuts"} />
      </div>
    </div>
  );
}
