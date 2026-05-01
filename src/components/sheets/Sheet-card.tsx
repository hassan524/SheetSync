"use client";

import { useEffect, useRef } from "react";
import { MoreHorizontal, Star, Users } from "lucide-react";
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

  // 🔥 NEW (for real product feel)
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

  ctx.strokeStyle = "rgba(0,0,0,0.05)";
  ctx.lineWidth = 0.5;

  for (let y = 0; y <= H; y += cH) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
  for (let x = 0; x <= W; x += cW) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
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
    <div
      ref={cardRef}
      onClick={handleClick}
      className="group cursor-pointer"
    >
      {/* Preview */}
      <div className="relative rounded-xl overflow-hidden border bg-white h-[150px] sm:h-[160px] transition hover:shadow-sm">
        <canvas ref={canvasRef} className="w-full h-full" />

        {/* Actions */}
        <div
          className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition"
          onClick={(e) => e.stopPropagation()}
        >
          <Button size="icon" variant="ghost" className="h-7 w-7 bg-white/80">
            <Star
              className={`h-3.5 w-3.5 ${isStarred ? "fill-amber-400 text-amber-400" : "text-gray-400"
                }`}
            />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="h-7 w-7 bg-white/80">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
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

        {/* Template */}
        <div className="absolute bottom-2 left-2 text-[10px] text-muted-foreground font-mono">
          {templateTitle}
        </div>
      </div>

      {/* Info */}
      <div className="mt-3 space-y-1.5">
        {/* Title */}
        <div className="flex items-center justify-between gap-2">
          <p className="text-[14px] sm:text-[15px] font-medium truncate">
            {title}
          </p>

          <span className="text-[11px] text-muted-foreground">
            {formatSize(fileSizeKb)}
          </span>
        </div>

        {/* Meta row */}
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span>{rows.toLocaleString()} rows</span>
            <span>·</span>
            <span>{cols} cols</span>
            <span>·</span>
            <span>{lastEdited}</span>
          </div>
        </div>

        {/* Org / Folder row */}
        <div className="flex items-center justify-between text-[11px]">
          {isOrganization ? (
            <div className="flex items-center gap-1.5 text-blue-600">
              <Users className="h-3 w-3" />
              <span>{organizationName}</span>
              <span className="text-muted-foreground">
                ({membersCount})
              </span>
            </div>
          ) : (
            <span className="text-muted-foreground">
              {folderName || "Personal"}
            </span>
          )}

          {/* Fill */}
          <div className="w-12 h-[2px] bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500"
              style={{ width: `${fillPercent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SheetCard;