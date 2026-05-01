"use client";

import { useEffect, useRef } from "react";
import { MoreHorizontal, Star, Users, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SHEET_TEMPLATES } from "@/constants/Sheet-templates";
import { useSheetTransition } from "@/hooks/sheets/use-sheet-transition";

interface SheetCardProps {
  id: string;
  title: string;
  lastEdited: string;
  rows: number;
  cols: number;
  templateId: string;
  fileSizeKb: number;
  fillPercent?: number;
  isStarred?: boolean;
  isOrganization?: boolean;
  organizationName?: string;
  membersCount?: number;
  folderName?: string;
}

// ─── Texture ─────────────────────────────────────────

function drawTexture(canvas: HTMLCanvasElement) {
  const dpr = window.devicePixelRatio || 1;
  const W = canvas.offsetWidth;
  const H = canvas.offsetHeight;
  if (!W || !H) return;

  canvas.width = W * dpr;
  canvas.height = H * dpr;

  const ctx = canvas.getContext("2d")!;
  ctx.scale(dpr, dpr);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);

  const cW = 40;
  const cH = 26;

  const greenRowsHeight = H * 0.7;
  const filledRows = Math.ceil(greenRowsHeight / cH);

  for (let row = 0; row < filledRows; row++) {
    const y = row * cH;
    const progress = row / filledRows;
    const alpha = 0.10 * (1 - progress) + 0.01 * progress;
    ctx.fillStyle = `rgba(16, 185, 129, ${alpha})`;
    ctx.fillRect(0, y, W, cH);
  }

  ctx.strokeStyle = "rgba(0,0,0,0.045)";
  ctx.lineWidth = 0.5;

  for (let y = 0; y <= H; y += cH) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
  for (let x = 0; x <= W; x += cW) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }

  // header row slightly stronger
  ctx.fillStyle = "rgba(16, 185, 129, 0.10)";
  ctx.fillRect(0, 0, W, cH);
}

// ─── Helpers ─────────────────────────────────────────

function formatSize(kb: number) {
  return kb >= 1000 ? (kb / 1000).toFixed(1) + " MB" : `${kb} KB`;
}

// ─── Component ───────────────────────────────────────

const SheetCard = ({
  id,
  title,
  lastEdited,
  rows,
  cols,
  templateId,
  fileSizeKb,
  fillPercent = 40,
  isStarred,
  isOrganization,
  organizationName,
  membersCount,
  folderName,
}: SheetCardProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const { openSheet } = useSheetTransition();

  const templateTitle =
    SHEET_TEMPLATES.find((t) => t.id === templateId)?.title || "Sheet";

  useEffect(() => {
    if (!canvasRef.current) return;
    drawTexture(canvasRef.current);
    const ro = new ResizeObserver(() => {
      if (canvasRef.current) drawTexture(canvasRef.current);
    });
    ro.observe(canvasRef.current);
    return () => ro.disconnect();
  }, []);

  const handleClick = () => openSheet(id, templateId, cardRef);

  return (
    <div ref={cardRef} onClick={handleClick} className="group cursor-pointer">

      {/* Preview */}
      <div className="relative rounded-xl overflow-hidden border border-border bg-white h-[140px] sm:h-[150px] transition-all duration-200 group-hover:shadow-md group-hover:border-border/80">
        <canvas ref={canvasRef} className="w-full h-full" />

        {/* template tag — top left */}
        <div className="absolute top-2 left-2">
          <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-white/90 border border-border/50 text-muted-foreground font-mono">
            {templateTitle}
          </span>
        </div>

        {/* rows × cols — bottom left */}
        <div className="absolute bottom-2 left-2">
          <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-white/90 border border-border/50 text-muted-foreground">
            {rows.toLocaleString()} rows · {cols} cols
          </span>
        </div>

        {/* file size — bottom right */}
        <div className="absolute bottom-2 right-2">
          <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-white/90 border border-border/50 text-muted-foreground">
            {formatSize(fileSizeKb)}
          </span>
        </div>

        {/* Actions — top right, shown on hover */}
        <div
          className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 bg-white/95 border border-border/50 rounded-lg shadow-sm hover:bg-white"
          >
            <Star
              className={`h-3 w-3 ${isStarred
                ? "fill-amber-400 text-amber-400"
                : "text-muted-foreground"
                }`}
            />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 bg-white/95 border border-border/50 rounded-lg shadow-sm hover:bg-white"
              >
                <MoreHorizontal className="h-3 w-3 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="text-xs">
              <DropdownMenuItem>Open</DropdownMenuItem>
              <DropdownMenuItem>Duplicate</DropdownMenuItem>
              <DropdownMenuItem>Move</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Rename</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Info */}
      <div className="mt-2.5 space-y-1.5 px-0.5">

        {/* Title */}
        <p className="text-[13px] font-medium truncate text-foreground">
          {title}
        </p>

        {/* row 1 — rows · cols · last edited */}
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <span>{rows.toLocaleString()} rows</span>
          <span>·</span>
          <span>{cols} cols</span>
          <span>·</span>
          <span>{lastEdited}</span>
        </div>

        {/* row 2 — personal/org + fill bar */}
        <div className="flex items-center justify-between gap-2">
          {isOrganization ? (
            <div className="flex items-center gap-1 text-[10px]">
              <Users className="h-2.5 w-2.5 text-primary flex-shrink-0" />
              <span className="text-primary truncate max-w-[100px]">
                {organizationName}
              </span>
              {membersCount !== undefined && (
                <span className="text-muted-foreground">· {membersCount} members</span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <FolderOpen className="h-2.5 w-2.5 flex-shrink-0" />
              <span>{folderName || "Personal"}</span>
            </div>
          )}

          {/* fill bar */}
          <div className="w-12 h-[2px] bg-border rounded-full overflow-hidden flex-shrink-0">
            <div
              className="h-full bg-primary rounded-full"
              style={{ width: `${fillPercent}%` }}
            />
          </div>
        </div>

      </div>
    </div>
  );
};

export default SheetCard;