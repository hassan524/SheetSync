"use client";

import React from "react";
import {
  Undo2, Redo2, Copy, Scissors, Clipboard, WrapText, Lock, Unlock,
  Sigma, SlidersHorizontal, Search, X, ChevronsLeftRight, ChevronsRightLeft, Maximize2,
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
}

const FONT_FAMILIES = [
  "Arial", "Calibri", "Inter", "DM Sans", "Geist Sans", "Roboto",
  "Verdana", "Helvetica", "Times New Roman", "Georgia", "Courier New",
  "Trebuchet MS", "Monaco",
];
const FONT_SIZES = ["8", "9", "10", "11", "12", "14", "16", "18", "24", "36"];

export function FormattingBar({
  isDark, selectedCell, selectedCellType, isSelectedColumnWrapped, isProtected,
  fontFamily, fontSize, zoomLevel, filteredRowsCount, searchQuery, showSearch,
  canUndo, canRedo, currentFormat,
  onUndo, onRedo, onZoomChange, onCopy, onCut, onPaste,
  onFontFamilyChange, onFontSizeChange, onFormatChange, onCellTypeChange,
  onTextWrapToggle, onProtectionToggle, onFillColumnNumbers = () => {}, onFillColumnHashNumbers = () => {}, onFormulaOpen,
  onSearchToggle, onSearchChange, onSearchClose, onSort, onHideColumn,
  selectedColumnKey, selectedColumnWidth, onSetColumnWidth, onExpandAllColumns,
  onDragResizeAllColumns, onEndResizeAllColumns, onOpenValidation,
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
    <div className="sheet-toolbar sheet-formatting-bar border-b shrink-0" style={{ height: "40px" }}>
      <div className="h-full flex items-center px-2 gap-0.5 overflow-x-auto hide-scrollbar min-w-0">
        <IconBtn icon={Undo2} tooltip="Undo" shortcut="Ctrl+Z" onClick={onUndo} disabled={!canUndo} />
        <IconBtn icon={Redo2} tooltip="Redo" shortcut="Ctrl+Y" onClick={onRedo} disabled={!canRedo} />
        <ToolSep />
        <Select value={String(zoomLevel)} onValueChange={(v) => onZoomChange(Number(v))}>
          <SelectTrigger
            className="sheet-select h-7 w-[68px] text-[11px] not-italic rounded-md px-2 border shrink-0"
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

        {/* Global Column Width Expand/Shrink buttons */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => onExpandAllColumns?.(-15)}
              className="sheet-icon-btn h-7 w-7 rounded flex items-center justify-center shrink-0 ml-1"
            >
              <ChevronsRightLeft className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="sheet-tooltip text-[11px]">
            Shrink all columns
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => onExpandAllColumns?.(15)}
              className="sheet-icon-btn h-7 w-7 rounded flex items-center justify-center shrink-0"
            >
              <ChevronsLeftRight className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="sheet-tooltip text-[11px]">
            Expand all columns
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onPointerDown={handleAllColumnsPointerDown}
              onPointerMove={handleAllColumnsPointerMove}
              onPointerUp={handleAllColumnsPointerEnd}
              onPointerCancel={handleAllColumnsPointerEnd}
              className={`sheet-icon-btn h-7 w-7 rounded flex items-center justify-center shrink-0 ${isDraggingAll ? "bg-primary/15" : ""}`}
              title="Drag to resize all columns"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="sheet-tooltip text-[11px]">
            Drag to resize all columns
          </TooltipContent>
        </Tooltip>

        <ToolSep />
        <IconBtn icon={Copy} tooltip="Copy" shortcut="Ctrl+C" onClick={onCopy} />
        <IconBtn icon={Scissors} tooltip="Cut" shortcut="Ctrl+X" onClick={onCut} />
        <IconBtn icon={Clipboard} tooltip="Paste" shortcut="Ctrl+V" onClick={onPaste} />
        <ToolSep />
        <Select value={fontFamily} onValueChange={onFontFamilyChange}>
          <SelectTrigger
            className="sheet-select h-7 w-[100px] text-[11px] not-italic rounded-md px-2 border shrink-0"
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
        <Select value={fontSize} onValueChange={onFontSizeChange}>
          <SelectTrigger
            className="sheet-select h-7 w-[54px] text-[11px] not-italic tabular-nums rounded-md px-2 border ml-1 shrink-0"
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
        {selectedCell && selectedCellType && (
          <>
            <CellTypeSelector currentType={selectedCellType} onChangeType={onCellTypeChange} />
            <ToolSep />
          </>
        )}
        <FormattingToolbar
          currentFormat={currentFormat}
          onFormatChange={onFormatChange}
          disabled={!selectedCell}
        />
        {/* Advanced dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="sheet-icon-btn h-7 px-2 rounded flex items-center gap-1.5 shrink-0"
              disabled={!selectedCell}
              title="Advanced formatting"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span className="text-[11px]">Advanced</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            collisionPadding={10}
            className="w-56 max-h-[min(60vh,300px)] overflow-y-auto hide-scrollbar"
            style={selStyle}
          >
            <DropdownMenuLabel className="text-[10px] uppercase tracking-wider" style={{ color: isDark ? "#4a5568" : "#9ca3af" }}>Text style</DropdownMenuLabel>
            {[
              ["Bold", () => onFormatChange({ bold: !currentFormat.bold })],
              ["Italic", () => onFormatChange({ italic: !currentFormat.italic })],
              ["Underline", () => onFormatChange({ underline: !currentFormat.underline })],
              ["Strikethrough", () => onFormatChange({ strikethrough: !currentFormat.strikethrough })],
            ].map(([label, action]) => (
              <DropdownMenuItem key={label as string} className="text-xs" onClick={action as any} style={ddItemStyle(isDark)}>
                {label as string}
              </DropdownMenuItem>
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
        <ToolSep />
        <IconBtn icon={WrapText} tooltip="Text Wrap" onClick={onTextWrapToggle} disabled={!selectedCell} active={isSelectedColumnWrapped} />
        <IconBtn
          icon={isProtected ? Lock : Unlock}
          tooltip="Protect row"
          onClick={onProtectionToggle}
          disabled={!selectedCell}
          active={isProtected}
        />
        <ToolSep />
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onFormulaOpen}
              className="sheet-formula-btn flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-medium transition-all shrink-0"
            >
              <Sigma className="h-3.5 w-3.5" />
              <span>Formulas</span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="sheet-tooltip text-[11px]">
            Browse and insert formulas
          </TooltipContent>
        </Tooltip>

        {/* Selected Column Specific Controls (Width & Validation) */}
        {selectedColumnKey && (
          <>
            <ToolSep />
            <div className="flex items-center gap-1.5 shrink-0 ml-1">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider select-none">Col Width</span>
              <input
                type="text"
                className="h-7 w-12 rounded-md border border-border bg-background px-1 text-xs text-center outline-none focus:ring-2 focus:ring-primary/30 font-mono font-medium"
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
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.currentTarget.blur();
                  }
                }}
              />
            </div>
            <ToolSep />
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onOpenValidation}
                  className="sheet-icon-btn h-7 px-2.5 rounded-md flex items-center gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-all shrink-0 font-semibold"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  <span className="text-[11px]">Validation</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="sheet-tooltip text-[11px]">
                Add data validation for this column
              </TooltipContent>
            </Tooltip>
          </>
        )}

        <ToolSep />
        {showSearch ? (
          <div className="flex items-center gap-1 shrink-0">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search…"
                className="sheet-search-input h-7 w-32 sm:w-44 pl-6 pr-2 text-[11px] rounded-md"
              />
              {searchQuery && (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">
                  {filteredRowsCount}
                </span>
              )}
            </div>
            <button
              className="sheet-icon-btn h-7 w-7 rounded flex items-center justify-center shrink-0"
              onClick={onSearchClose}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <IconBtn icon={Search} tooltip="Search" shortcut="Ctrl+F" onClick={onSearchToggle} />
        )}
      </div>
    </div>
  );
}
