// components/sheet/FormattingToolbar.tsx
"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Type,
  Palette,
  ChevronDown,
} from "lucide-react";
import { CellFormat } from "@/types/sheet.types";

interface FormattingToolbarProps {
  currentFormat: CellFormat;
  onFormatChange: (format: Partial<CellFormat>) => void;
  disabled?: boolean;
}

const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32];

const PRESET_COLORS = [
  "#000000",
  "#434343",
  "#666666",
  "#999999",
  "#b7b7b7",
  "#cccccc",
  "#d9d9d9",
  "#efefef",
  "#f3f3f3",
  "#ffffff",
  "#980000",
  "#ff0000",
  "#ff9900",
  "#ffff00",
  "#00ff00",
  "#00ffff",
  "#4a86e8",
  "#0000ff",
  "#9900ff",
  "#ff00ff",
  "#e6b8af",
  "#f4cccc",
  "#fce5cd",
  "#fff2cc",
  "#d9ead3",
  "#d0e0e3",
  "#c9daf8",
  "#cfe2f3",
  "#d9d2e9",
  "#ead1dc",
];

export default function FormattingToolbar({
  currentFormat,
  onFormatChange,
  disabled = false,
}: FormattingToolbarProps) {
  return (
    <div className="flex items-center gap-1">
      {/* Font Size */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1 px-2"
            disabled={disabled}
          >
            <Type className="h-3.5 w-3.5" />
            <span className="text-xs">{currentFormat.fontSize || 12}</span>
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-32 p-2">
          <div className="grid grid-cols-2 gap-1">
            {FONT_SIZES.map((size) => (
              <Button
                key={size}
                variant="ghost"
                size="sm"
                className="h-7 justify-start text-xs"
                onClick={() => onFormatChange({ fontSize: size })}
              >
                {size}
              </Button>
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="w-px h-6 bg-border" />

      {/* Text Styling */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={currentFormat.bold ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => onFormatChange({ bold: !currentFormat.bold })}
            disabled={disabled}
          >
            <Bold className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Bold (Ctrl+B)</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={currentFormat.italic ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => onFormatChange({ italic: !currentFormat.italic })}
            disabled={disabled}
          >
            <Italic className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Italic (Ctrl+I)</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={currentFormat.underline ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() =>
              onFormatChange({ underline: !currentFormat.underline })
            }
            disabled={disabled}
          >
            <Underline className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Underline (Ctrl+U)</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={currentFormat.strikethrough ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() =>
              onFormatChange({ strikethrough: !currentFormat.strikethrough })
            }
            disabled={disabled}
          >
            <Strikethrough className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Strikethrough</TooltipContent>
      </Tooltip>

      <div className="w-px h-6 bg-border" />

      {/* Text Color */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 relative"
            disabled={disabled}
          >
            <Type className="h-3.5 w-3.5" />
            <div
              className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5"
              style={{ backgroundColor: currentFormat.textColor || "#000000" }}
            />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64 p-3">
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground mb-2">
              Text Color
            </div>
            <div className="grid grid-cols-10 gap-1">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  className="h-6 w-6 rounded border border-border hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  onClick={() => onFormatChange({ textColor: color })}
                />
              ))}
            </div>
            <div className="flex items-center gap-2 pt-2 border-t">
              <span className="text-xs text-muted-foreground">Custom:</span>
              <input
                type="color"
                className="h-8 w-16 cursor-pointer"
                value={currentFormat.textColor || "#000000"}
                onChange={(e) => onFormatChange({ textColor: e.target.value })}
              />
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Background Color */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 relative"
            disabled={disabled}
          >
            <Palette className="h-3.5 w-3.5" />
            <div
              className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5"
              style={{ backgroundColor: currentFormat.bgColor || "#ffffff" }}
            />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64 p-3">
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground mb-2">
              Fill Color
            </div>
            <div className="grid grid-cols-10 gap-1">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  className="h-6 w-6 rounded border border-border hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  onClick={() => onFormatChange({ bgColor: color })}
                />
              ))}
            </div>
            <div className="flex items-center gap-2 pt-2 border-t">
              <span className="text-xs text-muted-foreground">Custom:</span>
              <input
                type="color"
                className="h-8 w-16 cursor-pointer"
                value={currentFormat.bgColor || "#ffffff"}
                onChange={(e) => onFormatChange({ bgColor: e.target.value })}
              />
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs"
                onClick={() => onFormatChange({ bgColor: "#ffffff" })}
              >
                Reset
              </Button>
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="w-px h-6 bg-border" />

      {/* Alignment */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={currentFormat.align === "left" ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => onFormatChange({ align: "left" })}
            disabled={disabled}
          >
            <AlignLeft className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Align Left</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={currentFormat.align === "center" ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => onFormatChange({ align: "center" })}
            disabled={disabled}
          >
            <AlignCenter className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Align Center</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={currentFormat.align === "right" ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => onFormatChange({ align: "right" })}
            disabled={disabled}
          >
            <AlignRight className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Align Right</TooltipContent>
      </Tooltip>
    </div>
  );
}
