import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Plus,
  Minus,
  Paintbrush,
  Type,
  ChevronDown,
  WrapText,
  Eye,
  EyeOff,
  ArrowUpDown,
  Filter,
  LayoutGrid,
  Columns,
  Rows,
} from "lucide-react";
import type { CellFormat } from "@/lib/sheet-templates";

interface SheetToolbarProps {
  onFormat: (fmt: Partial<CellFormat>) => void;
  onInsertRow: () => void;
  onDeleteRow: () => void;
  onInsertCol: () => void;
  onDeleteCol: () => void;
  currentFormat: CellFormat;
  onToggleFilter?: () => void;
  onToggleSort?: () => void;
  filterActive?: boolean;
  sortActive?: boolean;
}

const COLORS = [
  "#000000",
  "#434343",
  "#666666",
  "#999999",
  "#cccccc",
  "#ffffff",
  "#e06666",
  "#f6b26b",
  "#ffd966",
  "#93c47d",
  "#76a5af",
  "#6fa8dc",
  "#8e7cc3",
  "#c27ba0",
  "#cc0000",
  "#e69138",
  "#f1c232",
  "#6aa84f",
  "#45818e",
  "#3d85c6",
  "#674ea7",
  "#a64d79",
  "#1a5632",
  "#2d7a4a",
  "#4caf50",
  "#81c784",
];

const FONT_SIZES = [8, 9, 10, 11, 12, 13, 14, 16, 18, 20, 24, 28, 36, 48];

const ToolBtn = ({
  active,
  onClick,
  children,
  tip,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  tip: string;
}) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        variant="ghost"
        size="icon"
        className={`h-7 w-7 p-0 rounded-md transition-colors ${active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}
        onClick={onClick}
      >
        {children}
      </Button>
    </TooltipTrigger>
    <TooltipContent side="bottom" className="text-xs">
      {tip}
    </TooltipContent>
  </Tooltip>
);

const Divider = () => <div className="w-px h-5 bg-border mx-0.5" />;

const SheetToolbar = ({
  onFormat,
  onInsertRow,
  onDeleteRow,
  onInsertCol,
  onDeleteCol,
  currentFormat,
  onToggleFilter,
  onToggleSort,
  filterActive,
  sortActive,
}: SheetToolbarProps) => {
  const [fontSize, setFontSize] = useState(currentFormat.fontSize || 13);

  return (
    <div className="flex items-center gap-0.5 px-3 py-1 border-b border-border bg-card/80 backdrop-blur-sm">
      {/* Feature toggles */}
      <div className="flex items-center gap-0.5 mr-1">
        <Button
          variant="ghost"
          size="sm"
          className={`h-7 text-xs gap-1 px-2 rounded-md ${sortActive ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}
          onClick={onToggleSort}
        >
          <ArrowUpDown className="h-3 w-3" /> Sort
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={`h-7 text-xs gap-1 px-2 rounded-md ${filterActive ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}
          onClick={onToggleFilter}
        >
          <Filter className="h-3 w-3" /> Filter
        </Button>
      </div>

      <Divider />

      {/* Font Size */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-14 text-xs gap-0.5 px-2 font-mono text-muted-foreground hover:text-foreground"
          >
            {fontSize}
            <ChevronDown className="h-2.5 w-2.5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-20 p-1" align="start">
          {FONT_SIZES.map((s) => (
            <button
              key={s}
              className={`w-full text-left px-2 py-1 text-xs rounded hover:bg-accent transition-colors ${s === fontSize ? "bg-primary/10 text-primary font-medium" : ""}`}
              onClick={() => {
                setFontSize(s);
                onFormat({ fontSize: s });
              }}
            >
              {s}
            </button>
          ))}
        </PopoverContent>
      </Popover>

      <Divider />

      {/* Text Formatting */}
      <ToolBtn
        active={currentFormat.bold}
        onClick={() => onFormat({ bold: !currentFormat.bold })}
        tip="Bold (Ctrl+B)"
      >
        <Bold className="h-3.5 w-3.5" />
      </ToolBtn>
      <ToolBtn
        active={currentFormat.italic}
        onClick={() => onFormat({ italic: !currentFormat.italic })}
        tip="Italic (Ctrl+I)"
      >
        <Italic className="h-3.5 w-3.5" />
      </ToolBtn>
      <ToolBtn
        active={currentFormat.underline}
        onClick={() => onFormat({ underline: !currentFormat.underline })}
        tip="Underline (Ctrl+U)"
      >
        <Underline className="h-3.5 w-3.5" />
      </ToolBtn>
      <ToolBtn
        active={currentFormat.strikethrough}
        onClick={() =>
          onFormat({ strikethrough: !currentFormat.strikethrough })
        }
        tip="Strikethrough"
      >
        <Strikethrough className="h-3.5 w-3.5" />
      </ToolBtn>

      <Divider />

      {/* Text Color */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
          >
            <div className="flex flex-col items-center">
              <Type className="h-3.5 w-3.5" />
              <div
                className="h-0.5 w-3.5 rounded-full mt-0.5"
                style={{
                  backgroundColor: currentFormat.textColor || "currentColor",
                }}
              />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-44 p-2" align="start">
          <p className="text-[10px] text-muted-foreground mb-1.5 font-medium uppercase tracking-wider">
            Text Color
          </p>
          <div className="grid grid-cols-8 gap-1">
            {COLORS.map((c) => (
              <button
                key={c}
                className="h-5 w-5 rounded-sm border border-border/50 hover:scale-125 transition-transform cursor-pointer"
                style={{ backgroundColor: c }}
                onClick={() => onFormat({ textColor: c })}
              />
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* Background Color */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
          >
            <Paintbrush className="h-3.5 w-3.5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-44 p-2" align="start">
          <p className="text-[10px] text-muted-foreground mb-1.5 font-medium uppercase tracking-wider">
            Fill Color
          </p>
          <div className="grid grid-cols-8 gap-1">
            {COLORS.map((c) => (
              <button
                key={c}
                className="h-5 w-5 rounded-sm border border-border/50 hover:scale-125 transition-transform cursor-pointer"
                style={{ backgroundColor: c }}
                onClick={() => onFormat({ bgColor: c })}
              />
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <Divider />

      {/* Alignment */}
      <ToolBtn
        active={currentFormat.align === "left"}
        onClick={() => onFormat({ align: "left" })}
        tip="Align Left"
      >
        <AlignLeft className="h-3.5 w-3.5" />
      </ToolBtn>
      <ToolBtn
        active={currentFormat.align === "center"}
        onClick={() => onFormat({ align: "center" })}
        tip="Align Center"
      >
        <AlignCenter className="h-3.5 w-3.5" />
      </ToolBtn>
      <ToolBtn
        active={currentFormat.align === "right"}
        onClick={() => onFormat({ align: "right" })}
        tip="Align Right"
      >
        <AlignRight className="h-3.5 w-3.5" />
      </ToolBtn>
      <ToolBtn
        active={currentFormat.wrapText}
        onClick={() => onFormat({ wrapText: !currentFormat.wrapText })}
        tip="Wrap Text"
      >
        <WrapText className="h-3.5 w-3.5" />
      </ToolBtn>

      <Divider />

      {/* Insert/Delete */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1 px-2 text-muted-foreground hover:text-foreground"
            onClick={onInsertRow}
          >
            <Plus className="h-3 w-3" />
            <Rows className="h-3 w-3" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          Insert Row
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1 px-2 text-muted-foreground hover:text-foreground"
            onClick={onDeleteRow}
          >
            <Minus className="h-3 w-3" />
            <Rows className="h-3 w-3" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          Delete Row
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1 px-2 text-muted-foreground hover:text-foreground"
            onClick={onInsertCol}
          >
            <Plus className="h-3 w-3" />
            <Columns className="h-3 w-3" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          Insert Column
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1 px-2 text-muted-foreground hover:text-foreground"
            onClick={onDeleteCol}
          >
            <Minus className="h-3 w-3" />
            <Columns className="h-3 w-3" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          Delete Column
        </TooltipContent>
      </Tooltip>
    </div>
  );
};

export default SheetToolbar;
