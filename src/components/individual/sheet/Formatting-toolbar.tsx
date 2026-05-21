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
  Square,
  X,
  Plus,
  Minus,
  Paintbrush,
} from "lucide-react";
import { CellFormat } from "@/types";

interface FormattingToolbarProps {
  currentFormat?: CellFormat;
  onFormatChange: (format: Partial<CellFormat>) => void;
  disabled?: boolean;
}

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
  currentFormat = {}, // ← add default empty object here
  onFormatChange,
  disabled = false,
}: FormattingToolbarProps) {
  return (
    <div className="flex items-center gap-1">
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
            <Bold
              className={`h-3.5 w-3.5 ${currentFormat.bold ? "text-amber-600" : "text-gray-500"}`}
            />
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
            <Italic
              className={`h-3.5 w-3.5 ${currentFormat.italic ? "text-sky-600" : "text-gray-500"}`}
            />
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
            <Underline
              className={`h-3.5 w-3.5 ${currentFormat.underline ? "text-emerald-600" : "text-gray-500"}`}
            />
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
            <Strikethrough
              className={`h-3.5 w-3.5 ${currentFormat.strikethrough ? "text-rose-600" : "text-gray-500"}`}
            />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Strikethrough</TooltipContent>
      </Tooltip>

      <div className="w-px h-6 bg-border" />

      {/* Quick text utilities */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() =>
              onFormatChange({
                fontSize: Math.min(72, (currentFormat.fontSize ?? 12) + 1),
              })
            }
            disabled={disabled}
          >
            <Plus className="h-3.5 w-3.5 text-gray-500" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Increase Font Size</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() =>
              onFormatChange({
                fontSize: Math.max(8, (currentFormat.fontSize ?? 12) - 1),
              })
            }
            disabled={disabled}
          >
            <Minus className="h-3.5 w-3.5 text-gray-500" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Decrease Font Size</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() =>
              onFormatChange({
                bold: false,
                italic: false,
                underline: false,
                strikethrough: false,
                textColor: "#000000",
                bgColor: "#ffffff",
                align: "left",
                borderStyle: "none",
              })
            }
            disabled={disabled}
          >
            <Paintbrush className="h-3.5 w-3.5 text-gray-500" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Clear Formatting</TooltipContent>
      </Tooltip>

      <div className="w-px h-6 bg-border" />

      {/* Borders */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={
              currentFormat.borderStyle && currentFormat.borderStyle !== "none"
                ? "secondary"
                : "ghost"
            }
            size="sm"
            className="h-8 w-8 p-0"
            disabled={disabled}
          >
            <Square className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 p-3">
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">
              Cell Border
            </div>
            <div className="grid grid-cols-2 gap-1">
              {(["solid", "dashed", "dotted"] as const).map((style) => (
                <Button
                  key={style}
                  variant="ghost"
                  size="sm"
                  className="h-7 justify-start text-xs capitalize"
                  onClick={() => onFormatChange({ borderStyle: style })}
                >
                  {style}
                </Button>
              ))}
              <Button
                variant="ghost"
                size="sm"
                className="h-7 justify-start text-xs"
                onClick={() =>
                  onFormatChange({
                    borderWidth: Math.min(
                      4,
                      (currentFormat.borderWidth ?? 1) + 1,
                    ),
                  })
                }
              >
                Width +
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 justify-start text-xs"
                onClick={() =>
                  onFormatChange({
                    borderWidth: Math.max(
                      1,
                      (currentFormat.borderWidth ?? 1) - 1,
                    ),
                  })
                }
              >
                Width -
              </Button>
            </div>
            <div className="flex items-center gap-2 pt-2 border-t">
              <span className="text-xs text-muted-foreground">Color:</span>
              <input
                type="color"
                className="h-8 w-16 cursor-pointer"
                value={currentFormat.borderColor || "#d1d5db"}
                onChange={(e) =>
                  onFormatChange({
                    borderColor: e.target.value,
                    borderStyle: currentFormat.borderStyle || "solid",
                  })
                }
              />
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs"
                onClick={() => onFormatChange({ borderStyle: "none" })}
              >
                <X className="h-3 w-3 mr-1" />
                Clear
              </Button>
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

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
            <AlignLeft
              className={`h-3.5 w-3.5 ${currentFormat.align === "left" ? "text-violet-600" : "text-gray-500"}`}
            />
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
            <AlignCenter
              className={`h-3.5 w-3.5 ${currentFormat.align === "center" ? "text-violet-600" : "text-gray-500"}`}
            />
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
            <AlignRight
              className={`h-3.5 w-3.5 ${currentFormat.align === "right" ? "text-violet-600" : "text-gray-500"}`}
            />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Align Right</TooltipContent>
      </Tooltip>
    </div>
  );
}

