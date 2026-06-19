"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
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

function DebouncedColorInput({
  value,
  onCommit,
  className = "h-8 w-16 cursor-pointer",
}: {
  value: string;
  onCommit: (color: string) => void;
  className?: string;
}) {
  const [local, setLocal] = useState(value);
  const rafRef = useRef<number | null>(null);
  const pendingRef = useRef<string | null>(null);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  const scheduleCommit = useCallback(
    (color: string) => {
      pendingRef.current = color;
      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        if (pendingRef.current !== null) {
          onCommit(pendingRef.current);
          pendingRef.current = null;
        }
      });
    },
    [onCommit],
  );

  const flushCommit = useCallback(
    (color: string) => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      pendingRef.current = null;
      onCommit(color);
    },
    [onCommit],
  );

  return (
    <input
      type="color"
      className={className}
      value={local}
      onInput={(e) => {
        const next = (e.target as HTMLInputElement).value;
        setLocal(next);
        scheduleCommit(next);
      }}
      onChange={(e) => flushCommit(e.target.value)}
      onBlur={(e) => flushCommit((e.target as HTMLInputElement).value)}
    />
  );
}

interface FormattingToolbarProps {
  currentFormat?: CellFormat;
  onFormatChange: (format: Partial<CellFormat>) => void;
  disabled?: boolean;
}

const PRESET_COLORS = [
  "#000000", "#434343", "#666666", "#999999", "#b7b7b7",
  "#cccccc", "#d9d9d9", "#efefef", "#f3f3f3", "#ffffff",
  "#980000", "#ff0000", "#ff9900", "#ffff00", "#00ff00",
  "#00ffff", "#4a86e8", "#0000ff", "#9900ff", "#ff00ff",
  "#e6b8af", "#f4cccc", "#fce5cd", "#fff2cc", "#d9ead3",
  "#d0e0e3", "#c9daf8", "#cfe2f3", "#d9d2e9", "#ead1dc",
];

const TOOL_GROUP_CLASS =
  "flex items-center rounded-md border border-border/60 bg-background/70 p-0.5 gap-0.5 shrink-0 shadow-sm";

export default function FormattingToolbar({
  currentFormat = {},
  onFormatChange,
  disabled = false,
}: FormattingToolbarProps) {
  const [borderOpen, setBorderOpen] = useState(false);
  const [textColorOpen, setTextColorOpen] = useState(false);
  const [bgColorOpen, setBgColorOpen] = useState(false);

  return (
    <div className="flex items-center gap-1.5">
      {/* Group 1: Text Styling */}
      <div className={TOOL_GROUP_CLASS}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={currentFormat.bold ? "secondary" : "ghost"}
              size="icon"
              className="h-7 w-7 rounded"
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
              className="h-7 w-7 rounded"
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
              className="h-7 w-7 rounded"
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
              className="h-7 w-7 rounded"
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
      </div>

      {/* Group 2: Font Size & Clear Formatting */}
      <div className={TOOL_GROUP_CLASS}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded"
              onClick={() =>
                onFormatChange({
                  fontSize: Math.min(72, (currentFormat.fontSize ?? 12) + 1),
                })
              }
              disabled={disabled}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Increase Font Size</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded"
              onClick={() =>
                onFormatChange({
                  fontSize: Math.max(8, (currentFormat.fontSize ?? 12) - 1),
                })
              }
              disabled={disabled}
            >
              <Minus className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Decrease Font Size</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded"
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
              <Paintbrush className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Clear Formatting</TooltipContent>
        </Tooltip>
      </div>

      {/* Group 3: Colors & Borders */}
      <div className={TOOL_GROUP_CLASS}>
        {/* Borders */}
        <Popover open={borderOpen} onOpenChange={setBorderOpen}>
          <PopoverTrigger asChild>
            <Button
              variant={
                currentFormat.borderStyle && currentFormat.borderStyle !== "none"
                  ? "secondary"
                  : "ghost"
              }
              size="icon"
              className="h-7 w-7 rounded p-0"
              disabled={disabled}
            >
              <Square className="h-3.5 w-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2.5" align="start">
            <div className="space-y-2.5">
              {/* Style */}
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                  Style
                </div>
                <div className="flex gap-1">
                  {(["solid", "dashed", "dotted"] as const).map((style) => (
                    <button
                      key={style}
                      className={`flex-1 h-6 rounded text-[10px] border transition-colors ${
                        currentFormat.borderStyle === style
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:bg-muted"
                      }`}
                      onClick={() =>
                        onFormatChange({
                          borderStyle: style,
                          borderColor: currentFormat.borderColor || "#000000",
                          borderWidth: currentFormat.borderWidth ?? 1,
                        })
                      }
                    >
                      {style.charAt(0).toUpperCase() + style.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color */}
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                  Color
                </div>
                <div className="grid grid-cols-10 gap-0.5">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      className="h-4 w-4 rounded-sm border border-border/50 hover:scale-110 transition-transform"
                      style={{
                        backgroundColor: color,
                        boxShadow:
                          currentFormat.borderColor === color
                            ? "0 0 0 1.5px hsl(var(--primary))"
                            : "none",
                      }}
                      onClick={() =>
                        onFormatChange({
                          borderColor: color,
                          borderStyle: currentFormat.borderStyle || "solid",
                          borderWidth: currentFormat.borderWidth ?? 1,
                        })
                      }
                    />
                  ))}
                </div>
              </div>

              {/* Width */}
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                  Width
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    className="h-6 w-6 rounded border border-border hover:bg-muted flex items-center justify-center"
                    onClick={() =>
                      onFormatChange({
                        borderWidth: Math.max(1, (currentFormat.borderWidth ?? 1) - 1),
                        borderStyle: currentFormat.borderStyle || "solid",
                        borderColor: currentFormat.borderColor || "#000000",
                      })
                    }
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="text-xs font-mono w-6 text-center">
                    {currentFormat.borderWidth ?? 1}
                  </span>
                  <button
                    className="h-6 w-6 rounded border border-border hover:bg-muted flex items-center justify-center"
                    onClick={() =>
                      onFormatChange({
                        borderWidth: Math.min(4, (currentFormat.borderWidth ?? 1) + 1),
                        borderStyle: currentFormat.borderStyle || "solid",
                        borderColor: currentFormat.borderColor || "#000000",
                      })
                    }
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {/* Clear */}
              <button
                className="w-full flex items-center gap-1.5 px-2 py-1 rounded text-xs text-muted-foreground hover:bg-muted/60 border border-border/50 transition-colors"
                onClick={() => onFormatChange({ borderStyle: "none" })}
              >
                <X className="h-3 w-3" /> Clear border
              </button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Text Color */}
        <Popover open={textColorOpen} onOpenChange={setTextColorOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded p-0 relative"
              disabled={disabled}
            >
              <Type className="h-3.5 w-3.5" />
              <div
                className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5"
                style={{ backgroundColor: currentFormat.textColor || "#000000" }}
              />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3" align="start">
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
                <DebouncedColorInput
                  value={currentFormat.textColor || "#000000"}
                  onCommit={(color) => onFormatChange({ textColor: color })}
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Background Color */}
        <Popover open={bgColorOpen} onOpenChange={setBgColorOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded p-0 relative"
              disabled={disabled}
            >
              <Palette className="h-3.5 w-3.5" />
              <div
                className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5"
                style={{ backgroundColor: currentFormat.bgColor || "#ffffff" }}
              />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3" align="start">
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
                <DebouncedColorInput
                  value={currentFormat.bgColor || "#ffffff"}
                  onCommit={(color) => onFormatChange({ bgColor: color })}
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
          </PopoverContent>
        </Popover>
      </div>

      {/* Group 4: Alignment */}
      <div className={TOOL_GROUP_CLASS}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={currentFormat.align === "left" ? "secondary" : "ghost"}
              size="icon"
              className="h-7 w-7 rounded"
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
              className="h-7 w-7 rounded"
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
              className="h-7 w-7 rounded"
              onClick={() => onFormatChange({ align: "right" })}
              disabled={disabled}
            >
              <AlignRight className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Align Right</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
