"use client";

import React from "react";
import {
  Undo2, Redo2, Copy, Scissors, Clipboard, WrapText, Lock, Unlock,
  Sigma, SlidersHorizontal, Search, X, ChevronsLeftRight, ChevronsRightLeft,
  Maximize2, Merge, Split,
} from "lucide-react";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CellFormat, ColumnDef } from "@/types/index";
import FormattingToolbar from "@/components/individual/sheet/Formatting-toolbar";
import CellTypeSelector from "@/components/individual/sheet/Cell-type-selector";
import { IconBtn, ToolSep, ddStyle, ddItemStyle } from "@/components/individual/sheet/sheet-ui-helpers";

interface FormattingBarProps {
  isDark: boolean;
  selectedCell: { row: number; col: string } | null;
  selectedCellType: ColumnDef["type"] | null;
  isSelectedColumnWrapped: boolean;
  isProtected: boolean;
  canProtectRows?: boolean;
  fontFamily: string;
  fontSize: string;
  zoomLevel: number;
  filteredRowsCount: number;
  searchQuery: string;
  showSearch: boolean;
  canUndo: boolean;
  canRedo: boolean;
  currentFormat: CellFormat;
  onUndo: () => void;
  onRedo: () => void;
  onZoomChange: (z: number) => void;
  onCopy: () => void;
  onCut: () => void;
  onPaste: () => void;
  onFontFamilyChange: (f: string) => void;
  onFontSizeChange: (s: string) => void;
  onFormatChange: (format: Partial<CellFormat>) => void;
  onCellTypeChange: (type: ColumnDef["type"]) => void;
  onTextWrapToggle: () => void;
  onProtectionToggle: () => void;
  onFillColumnNumbers: () => void;
  onFillColumnHashNumbers: () => void;
  onFormulaOpen: () => void;
  onSearchToggle: () => void;
  onSearchChange: (q: string) => void;
  onSearchClose: () => void;
  onSort: (dir: "asc" | "desc") => void;
  onHideColumn: () => void;
  selectedColumnKey?: string | null;
  selectedColumnWidth?: number | null;
  onSetColumnWidth?: (w: number) => void;
  onExpandAllColumns?: (amount: number) => void;
  onDragResizeAllColumns?: (delta: number) => void;
  onEndResizeAllColumns?: () => void;
  onOpenValidation?: () => void;
  canMergeSelection?: boolean;
  isMergedSelection?: boolean;
  onMergeSelection?: (mode: "all" | "across" | "down" | "center") => void;
  onUnmergeSelection?: () => void;
}

const FONT_FAMILIES = [
  "Arial", "Calibri", "Inter", "DM Sans", "Geist Sans", "Roboto",
  "Verdana", "Helvetica", "Times New Roman", "Georgia", "Courier New",
  "Trebuchet MS", "Monaco",
];
const FONT_SIZES = ["8", "9", "10", "11", "12", "14", "16", "18", "24", "36"];

export function FormattingBar({
  isDark, selectedCell, selectedCellType, isSelectedColumnWrapped, isProtected, canProtectRows = true,
  fontFamily, fontSize, zoomLevel, filteredRowsCount, searchQuery, showSearch,
  canUndo, canRedo, currentFormat,
  onUndo, onRedo, onZoomChange, onCopy, onCut, onPaste,
  onFontFamilyChange, onFontSizeChange, onFormatChange, onCellTypeChange,
  onTextWrapToggle, onProtectionToggle,
  onFillColumnNumbers = () => { }, onFillColumnHashNumbers = () => { },
  onFormulaOpen, onSearchToggle, onSearchChange, onSearchClose, onSort, onHideColumn,
  selectedColumnKey, selectedColumnWidth, onSetColumnWidth, onExpandAllColumns,
  onDragResizeAllColumns, onEndResizeAllColumns, onOpenValidation,
  canMergeSelection = false, isMergedSelection = false, onMergeSelection, onUnmergeSelection,
}: FormattingBarProps) {
  const selStyle = ddStyle(isDark);

  const dragResizeStartX = React.useRef<number | null>(null);
  const [isDraggingAll, setIsDraggingAll] = React.useState(false);

  const handleAllColumnsPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragResizeStartX.current = e.clientX;
    setIsDraggingAll(true);
  };
  const handleAllColumnsPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (dragResizeStartX.current === null) return;
    const deltaX = e.clientX - dragResizeStartX.current;
    if (Math.abs(deltaX) >= 8) {
      onDragResizeAllColumns?.(Math.sign(deltaX) * 10);
      dragResizeStartX.current = e.clientX;
    }
  };
  const handleAllColumnsPointerEnd = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    dragResizeStartX.current = null;
    setIsDraggingAll(false);
    onEndResizeAllColumns?.();
  };

  const [widthVal, setWidthVal] = React.useState(String(selectedColumnWidth ?? 160));
  React.useEffect(() => {
    setWidthVal(String(selectedColumnWidth ?? 160));
  }, [selectedColumnWidth]);

  return (
    <div
      className="sheet-toolbar sheet-formatting-bar border-b shrink-0"
      style={{ height: "36px" }}
    >
      {/* Single scrollable row */}
      <div
        className="sheet-header-scrollbar h-full flex items-center gap-0.5 px-2 overflow-x-auto"
        style={{ flexWrap: "nowrap", minWidth: 0 }}
      >
        {/* Undo / Redo */}
        <IconBtn icon={Undo2} tooltip="Undo" shortcut="Ctrl+Z" onClick={onUndo} disabled={!canUndo} />
        <IconBtn icon={Redo2} tooltip="Redo" shortcut="Ctrl+Y" onClick={onRedo} disabled={!canRedo} />
        <ToolSep />

        {/* Zoom */}
        <Select value={String(zoomLevel)} onValueChange={(v) => onZoomChange(Number(v))}>
          <SelectTrigger
            className="sheet-select h-[22px] w-[54px] text-[10px] rounded px-1.5 shrink-0"
            style={selStyle}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent style={selStyle}>
            {[50, 75, 90, 100, 110, 125, 150, 200].map((z) => (
              <SelectItem key={z} value={String(z)} className="text-xs" style={ddItemStyle(isDark)}>
                {z}%
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <ToolSep />

        {/* Clipboard */}
        <IconBtn icon={Copy} tooltip="Copy" shortcut="Ctrl+C" onClick={onCopy} />
        <IconBtn icon={Scissors} tooltip="Cut" shortcut="Ctrl+X" onClick={onCut} />
        <IconBtn icon={Clipboard} tooltip="Paste" shortcut="Ctrl+V" onClick={onPaste} />
        <ToolSep />

        {/* Merge */}
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <button
                  className={`sheet-icon-btn h-[22px] px-1.5 rounded flex items-center gap-1 shrink-0 text-[10px] font-medium ${canMergeSelection && !isMergedSelection ? "sheet-icon-btn--active" : ""}`}
                  disabled={!canMergeSelection && !isMergedSelection}
                >
                  <Merge className="h-3 w-3" />
                  <span>Merge</span>
                </button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="sheet-tooltip text-[11px]">Merge cells</TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="start" style={selStyle} className="w-40">
            <DropdownMenuItem className="text-xs" onClick={() => onMergeSelection?.("all")} style={ddItemStyle(isDark)}>Merge all</DropdownMenuItem>
            <DropdownMenuItem className="text-xs" onClick={() => onMergeSelection?.("across")} style={ddItemStyle(isDark)}>Merge across</DropdownMenuItem>
            <DropdownMenuItem className="text-xs" onClick={() => onMergeSelection?.("down")} style={ddItemStyle(isDark)}>Merge down</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-xs" onClick={() => onMergeSelection?.("center")} style={ddItemStyle(isDark)}>Merge &amp; center</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <IconBtn
          icon={Split}
          tooltip="Unmerge cells"
          onClick={onUnmergeSelection ?? (() => {})}
          disabled={!isMergedSelection}
          active={isMergedSelection}
        />
        <ToolSep />

        {/* Font family */}
        <Select value={fontFamily} onValueChange={onFontFamilyChange}>
          <SelectTrigger
            className="sheet-select h-[22px] w-[84px] text-[10px] rounded px-1.5 shrink-0"
            style={selStyle}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent style={selStyle}>
            {FONT_FAMILIES.map((f) => (
              <SelectItem key={f} value={f} className="text-xs" style={{ ...ddItemStyle(isDark), fontFamily: f }}>
                {f}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Font size */}
        <Select value={fontSize} onValueChange={onFontSizeChange}>
          <SelectTrigger
            className="sheet-select h-[22px] w-[42px] text-[10px] rounded px-1.5 ml-0.5 shrink-0"
            style={selStyle}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent style={selStyle}>
            {FONT_SIZES.map((s) => (
              <SelectItem key={s} value={s} className="text-xs" style={ddItemStyle(isDark)}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <ToolSep />

        {/* Cell type (only when cell selected, no column) */}
        {selectedCell && selectedCellType && !selectedColumnKey && (
          <>
            <CellTypeSelector currentType={selectedCellType} onChangeType={onCellTypeChange} />
            <ToolSep />
          </>
        )}

        {/* Formatting toolbar (bold, italic, underline, colors, align) */}
        <FormattingToolbar
          currentFormat={currentFormat}
          onFormatChange={onFormatChange}
          disabled={!selectedCell}
        />
        <ToolSep />

        {/* Wrap + Protect */}
        <IconBtn
          icon={WrapText}
          tooltip="Text Wrap"
          onClick={onTextWrapToggle}
          disabled={!selectedCell}
          active={isSelectedColumnWrapped}
        />
        <IconBtn
          icon={isProtected ? Lock : Unlock}
          tooltip={canProtectRows ? "Protect row" : "Owner only"}
          onClick={onProtectionToggle}
          disabled={!selectedCell || !canProtectRows}
          active={isProtected}
        />
        <ToolSep />

        {/* Formula */}
        <button
          onClick={onFormulaOpen}
          className="sheet-formula-btn flex items-center gap-1 h-[22px] px-2 rounded text-[10px] font-medium shrink-0"
        >
          <Sigma className="h-3 w-3" />
          <span>Formula</span>
        </button>
        <ToolSep />

        {/* Column resize */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button onClick={() => onExpandAllColumns?.(-15)} className="sheet-icon-btn h-[22px] w-[22px] rounded flex items-center justify-center shrink-0">
              <ChevronsRightLeft className="h-3 w-3" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="sheet-tooltip text-[11px]">Shrink all columns</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button onClick={() => onExpandAllColumns?.(15)} className="sheet-icon-btn h-[22px] w-[22px] rounded flex items-center justify-center shrink-0">
              <ChevronsLeftRight className="h-3 w-3" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="sheet-tooltip text-[11px]">Expand all columns</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onPointerDown={handleAllColumnsPointerDown}
              onPointerMove={handleAllColumnsPointerMove}
              onPointerUp={handleAllColumnsPointerEnd}
              onPointerCancel={handleAllColumnsPointerEnd}
              className={`sheet-icon-btn h-[22px] w-[22px] rounded flex items-center justify-center shrink-0 ${isDraggingAll ? "bg-primary/15" : ""}`}
            >
              <Maximize2 className="h-3 w-3" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="sheet-tooltip text-[11px]">Drag to resize all columns</TooltipContent>
        </Tooltip>
        <ToolSep />

        {/* Column-specific: width + validation */}
        {selectedColumnKey && (
          <>
            <span className="text-[9px] uppercase font-bold tracking-wider select-none shrink-0" style={{ color: isDark ? "#4a5568" : "#9ca3af" }}>W</span>
            <input
              type="text"
              className="h-[22px] w-10 rounded border border-border bg-background px-1 text-[10px] text-center outline-none focus:ring-1 focus:ring-primary/30 font-mono ml-0.5 shrink-0"
              value={widthVal}
              onChange={(e) => setWidthVal(e.target.value)}
              onBlur={() => {
                const val = Number(widthVal.replace(/[^\d]/g, ""));
                if (!Number.isNaN(val) && val >= 30 && val <= 600) {
                  onSetColumnWidth?.(val);
                } else {
                  setWidthVal(String(selectedColumnWidth ?? 160));
                }
              }}
              onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
            />
            <ToolSep />
            <button
              onClick={onOpenValidation}
              className="sheet-icon-btn h-[22px] px-1.5 rounded flex items-center gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 shrink-0 text-[10px] font-semibold"
            >
              <SlidersHorizontal className="h-3 w-3" />
              <span>Validation</span>
            </button>
            <ToolSep />
          </>
        )}

        {/* Search */}
        {showSearch ? (
          <div className="flex items-center gap-0.5 shrink-0">
            <div className="relative">
              <Search className="absolute left-1.5 top-1/2 -translate-y-1/2 h-2.5 w-2.5 text-gray-400" />
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search…"
                className="sheet-search-input h-[22px] w-28 pl-5 pr-2 text-[10px] rounded"
              />
              {searchQuery && (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-gray-400">
                  {filteredRowsCount}
                </span>
              )}
            </div>
            <button className="sheet-icon-btn h-[22px] w-[22px] rounded flex items-center justify-center shrink-0" onClick={onSearchClose}>
              <X className="h-2.5 w-2.5" />
            </button>
          </div>
        ) : (
          <IconBtn icon={Search} tooltip="Search" shortcut="Ctrl+F" onClick={onSearchToggle} />
        )}
        <ToolSep />

        {/* More dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="sheet-icon-btn h-[22px] px-1.5 rounded flex items-center gap-1 shrink-0 text-[10px]"
              disabled={!selectedCell}
            >
              <SlidersHorizontal className="h-3 w-3" />
              <span>More</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" collisionPadding={10} className="w-52 max-h-[min(60vh,300px)] overflow-y-auto hide-scrollbar" style={selStyle}>
            <DropdownMenuLabel className="text-[10px] uppercase tracking-wider" style={{ color: isDark ? "#4a5568" : "#9ca3af" }}>Text style</DropdownMenuLabel>
            {[
              ["Bold", () => onFormatChange({ bold: !currentFormat.bold })],
              ["Italic", () => onFormatChange({ italic: !currentFormat.italic })],
              ["Underline", () => onFormatChange({ underline: !currentFormat.underline })],
              ["Strikethrough", () => onFormatChange({ strikethrough: !currentFormat.strikethrough })],
            ].map(([label, action]) => (
              <DropdownMenuItem key={label as string} className="text-xs" onClick={action as any} style={ddItemStyle(isDark)}>{label as string}</DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-[10px] uppercase tracking-wider" style={{ color: isDark ? "#4a5568" : "#9ca3af" }}>Alignment</DropdownMenuLabel>
            {(["left", "center", "right"] as const).map((align) => (
              <DropdownMenuItem key={align} className="text-xs capitalize" onClick={() => onFormatChange({ align })} style={ddItemStyle(isDark)}>
                Align {align.charAt(0).toUpperCase() + align.slice(1)}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-[10px] uppercase tracking-wider" style={{ color: isDark ? "#4a5568" : "#9ca3af" }}>Font size</DropdownMenuLabel>
            <DropdownMenuItem className="text-xs" onClick={() => onFormatChange({ fontSize: Math.max(8, (currentFormat.fontSize ?? 12) - 1) })} style={ddItemStyle(isDark)}>Decrease size</DropdownMenuItem>
            <DropdownMenuItem className="text-xs" onClick={() => onFormatChange({ fontSize: Math.min(72, (currentFormat.fontSize ?? 12) + 1) })} style={ddItemStyle(isDark)}>Increase size</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-[10px] uppercase tracking-wider" style={{ color: isDark ? "#4a5568" : "#9ca3af" }}>Text color</DropdownMenuLabel>
            {[["Black", "#000000"], ["Red", "#dc2626"], ["Blue", "#2563eb"], ["Green", "#16a34a"]].map(([label, color]) => (
              <DropdownMenuItem key={label} className="text-xs" onClick={() => onFormatChange({ textColor: color })} style={ddItemStyle(isDark)}>{label}</DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-[10px] uppercase tracking-wider" style={{ color: isDark ? "#4a5568" : "#9ca3af" }}>Fill color</DropdownMenuLabel>
            {[["White", "#ffffff"], ["Yellow", "#fef3c7"], ["Gray", "#e5e7eb"], ["Green", "#dcfce7"]].map(([label, color]) => (
              <DropdownMenuItem key={label} className="text-xs" onClick={() => onFormatChange({ bgColor: color })} style={ddItemStyle(isDark)}>{label}</DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-[10px] uppercase tracking-wider" style={{ color: isDark ? "#4a5568" : "#9ca3af" }}>Borders</DropdownMenuLabel>
            {[
              ["Solid border", { borderStyle: "solid", borderWidth: 1, borderColor: "#111827" }],
              ["Dashed border", { borderStyle: "dashed", borderWidth: 1, borderColor: "#111827" }],
              ["Dotted border", { borderStyle: "dotted", borderWidth: 1, borderColor: "#111827" }],
              ["Remove border", { borderStyle: "none" }],
            ].map(([label, fmt]) => (
              <DropdownMenuItem key={label as string} className="text-xs" onClick={() => onFormatChange(fmt as any)} style={ddItemStyle(isDark)}>{label as string}</DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-[10px] uppercase tracking-wider" style={{ color: isDark ? "#4a5568" : "#9ca3af" }}>Sheet actions</DropdownMenuLabel>
            <DropdownMenuItem className="text-xs" onClick={onTextWrapToggle} style={ddItemStyle(isDark)}>Toggle text wrap</DropdownMenuItem>
            <DropdownMenuItem className="text-xs" onClick={onFillColumnNumbers} style={ddItemStyle(isDark)}>Fill 1, 2, 3...</DropdownMenuItem>
            <DropdownMenuItem className="text-xs" onClick={onFillColumnHashNumbers} style={ddItemStyle(isDark)}>Fill #1, #2, #3...</DropdownMenuItem>
            <DropdownMenuItem className="text-xs" onClick={() => onSort("asc")} style={ddItemStyle(isDark)}>Sort A → Z</DropdownMenuItem>
            <DropdownMenuItem className="text-xs" onClick={() => onSort("desc")} style={ddItemStyle(isDark)}>Sort Z → A</DropdownMenuItem>
            <DropdownMenuItem className="text-xs" onClick={onHideColumn} style={ddItemStyle(isDark)}>Hide selected column</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

      </div>
    </div>
  );
}