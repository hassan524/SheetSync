"use client";

import { useEffect, useRef, useState } from "react";
import { FileSpreadsheet, Copy, MoreHorizontal, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SHEET_TEMPLATES } from "@/constants/Sheet-templates";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SheetCardProps {
  title: string;
  lastEdited: string;
  isStarred?: boolean;
  rows: number;
  cols: number;
  tag: string;
  fillPercent: number;
  fileSizeKb: number;
  onClick?: () => void;
  templateId: string;
}

// ─── Canvas texture ───────────────────────────────────────────────────────────

function drawTexture(canvas: HTMLCanvasElement) {
  const dpr = window.devicePixelRatio || 1;
  const W = canvas.offsetWidth;
  const H = canvas.offsetHeight;
  if (!W || !H) return;

  canvas.width = W * dpr;
  canvas.height = H * dpr;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(dpr, dpr);

  // plain white base
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);

  const cW = 40;
  const cH = 26;

  // very faint grid — just enough to feel like a spreadsheet
  ctx.strokeStyle = "rgba(0,0,0,0.06)";
  ctx.lineWidth = 0.5;
  for (let y = 0; y <= H; y += cH) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
  for (let x = 0; x <= W; x += cW) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }

  // header row
  ctx.fillStyle = "rgba(0,0,0,0.04)";
  ctx.fillRect(0, 0, W, cH);

  // row number col
  ctx.fillStyle = "rgba(0,0,0,0.025)";
  ctx.fillRect(0, 0, cW * 0.9, H);

  // fake cell content bars
  const fills: [number, number, boolean][] = [
    [2, 1, true], [3, 1, false], [4, 1, true], [5, 1, false], [6, 1, true], [7, 1, false],
    [2, 2, false], [3, 2, true], [5, 2, false],
    [2, 3, true], [4, 3, false], [6, 3, true],
    [2, 4, false], [3, 4, true], [4, 4, false],
    [2, 5, true], [5, 5, false], [6, 5, true],
    [2, 6, false], [4, 6, true], [7, 6, false],
  ];
  fills.forEach(([col, row, wide]) => {
    const x = col * cW + 3;
    const y = row * cH + 5;
    const w = wide ? cW - 8 : cW - 16;
    ctx.fillStyle = "rgba(0,0,0,0.045)";
    ctx.beginPath();
    ctx.roundRect(x, y, w, cH - 10, 1.5);
    ctx.fill();
  });

  // bottom fade so it softly disappears
  const grad = ctx.createLinearGradient(0, H * 0.5, 0, H);
  grad.addColorStop(0, "rgba(255,255,255,0)");
  grad.addColorStop(1, "rgba(255,255,255,0.9)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatSize(kb: number): string {
  return kb >= 1000 ? (kb / 1000).toFixed(1) + "mb" : kb + "kb";
}

// ─── Component ────────────────────────────────────────────────────────────────

const SheetCard = ({
  title,
  lastEdited,
  isStarred = false,
  rows,
  cols,
  tag,
  fillPercent,
  fileSizeKb,
  onClick,
  templateId
}: SheetCardProps) => {
const canvasRef = useRef<HTMLCanvasElement>(null);

const templateTitle = SHEET_TEMPLATES.find(t => t.id === templateId)?.title ?? tag;
console.log('template title', templateTitle, 'template id', templateId)

useEffect(() => {
  if (!canvasRef.current) return;
  drawTexture(canvasRef.current);
  const ro = new ResizeObserver(() => {
    if (canvasRef.current) drawTexture(canvasRef.current);
  });
  ro.observe(canvasRef.current);
  return () => ro.disconnect();
}, []);

  return (
    <div className="group cursor-pointer select-none" onClick={onClick}>

      {/* ── The sheet itself ── */}
      <div className="relative rounded-lg overflow-hidden border border-border transition-all duration-150 group-hover:border-border/80 group-hover:brightness-[0.97] active:scale-[0.988]"
        style={{ height: 160 }}
      >
        <canvas
          ref={canvasRef}
          className="block w-full h-full"
          aria-hidden="true"
        />

        {/* actions — appear on hover, don't open sheet */}
        <div
          className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 rounded-md bg-white/80 hover:bg-white border border-black/8 backdrop-blur-sm"
          >
            <Star className={`h-3 w-3 ${isStarred ? "fill-amber-400 text-amber-400" : "text-gray-400"}`} />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-md bg-white/80 hover:bg-white border border-black/8 backdrop-blur-sm"
              >
                <MoreHorizontal className="h-3 w-3 text-gray-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem>Open</DropdownMenuItem>
              <DropdownMenuItem>Duplicate</DropdownMenuItem>
              <DropdownMenuItem>Move to folder</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Rename</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* tag — bottom left of sheet */}
        <div className="absolute bottom-2 left-2.5 text-[9px] font-mono text-gray-400 select-none">
          {templateTitle}
        </div>
      </div>

      {/* ── Info below the sheet ── */}
      <div className="mt-2.5 px-0.5 space-y-1">

        {/* title row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            {isStarred && (
              <span className="flex-shrink-0 h-[4px] w-[4px] rounded-full bg-amber-400" />
            )}
            <p className="text-[13px] capitalize font-medium text-foreground truncate leading-snug">
              {title}
            </p>
          </div>
          <span className="flex-shrink-0 text-[10px] font-mono text-muted-foreground/60 tabular-nums">
            {formatSize(fileSizeKb)}
          </span>
        </div>

        {/* meta row */}
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10.5px] text-muted-foreground/70 font-mono flex items-center gap-1.5">
            <span>{rows.toLocaleString()} rows</span>
            <span className="opacity-30">·</span>
            <span>{cols} cols</span>
            <span className="opacity-30">·</span>
            <span>{lastEdited}</span>
          </p>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <div className="w-10 h-[2px] rounded-full bg-border overflow-hidden">
              <div
                className="h-full rounded-full bg-green-400"
                style={{ width: `${Math.min(100, Math.max(0, fillPercent))}%` }}
              />
            </div>
            <span className="text-[9.5px] text-muted-foreground/60 font-mono tabular-nums">
              {fillPercent}%
            </span>
          </div>
        </div>

      </div>

    </div>
  );
};

export default SheetCard;