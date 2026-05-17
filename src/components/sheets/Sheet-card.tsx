"use client";

import { useEffect, useRef, useState } from "react";
import { Star, Trash2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { SHEET_TEMPLATES } from "@/constants/Sheet-templates";
import { useSheetTransition } from "@/hooks/sheets/use-sheet-transition";
import { deleteSheet } from "@/lib/querys/sheets/sheets";
import { toast } from "sonner";

interface SheetCardProps {
  id: string;
  title: string;
  lastEdited: string;
  rows?: number;
  cols?: number;
  templateId: string;
  fillPercent?: number;
  isStarred?: boolean;
  isOrganization?: boolean;
  organizationName?: string;
  membersCount?: number;
  folderName?: string;
  onDeleted?: (id: string) => void;
}

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

  const cW = 40,
    cH = 26;
  const filledRows = Math.ceil((H * 0.7) / cH);

  for (let row = 0; row < filledRows; row++) {
    const progress = row / filledRows;
    const alpha = 0.1 * (1 - progress) + 0.01 * progress;
    ctx.fillStyle = `rgba(16, 185, 129, ${alpha})`;
    ctx.fillRect(0, row * cH, W, cH);
  }

  ctx.strokeStyle = "rgba(0,0,0,0.045)";
  ctx.lineWidth = 0.5;

  for (let y = 0; y <= H; y += cH) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  for (let x = 0; x <= W; x += cW) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }

  ctx.fillStyle = "rgba(16, 185, 129, 0.10)";
  ctx.fillRect(0, 0, W, cH);
}

const SheetCard = ({
  id,
  title,
  lastEdited,
  templateId,
  isStarred,
  onDeleted,
}: SheetCardProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const { openSheet } = useSheetTransition();

  const [showDelete, setShowDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      await deleteSheet(id);

      // instant UI update first
      onDeleted?.(id);

      setShowDelete(false);
      toast.success("Sheet deleted");
    } catch {
      toast.error("Failed to delete sheet");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div
        ref={cardRef}
        onClick={() => openSheet(id, templateId, cardRef)}
        className="group cursor-pointer"
      >
        <div className="relative rounded-xl overflow-hidden border border-border bg-white h-[140px] sm:h-[150px] transition-all group-hover:shadow-md">
          <canvas ref={canvasRef} className="w-full h-full" />

          <div className="absolute top-2 left-2">
            <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-white/90 border text-muted-foreground font-mono">
              {templateTitle}
            </span>
          </div>

          <div
            className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 bg-white/95 border"
            >
              <MoreHorizontal className="h-3 w-3 text-muted-foreground" />
            </Button>

            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 bg-white/95 border"
            >
              <Star
                className={`h-3 w-3 ${
                  isStarred
                    ? "fill-amber-400 text-amber-400"
                    : "text-muted-foreground"
                }`}
              />
            </Button>

            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 bg-white/95 border hover:border-destructive/40"
              onClick={(e) => {
                e.stopPropagation();
                setShowDelete(true);
              }}
            >
              <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
            </Button>
          </div>
        </div>

        <div className="mt-2.5 space-y-1.5 px-0.5">
          <p className="text-[13px] font-medium truncate group-hover:underline underline-offset-2">
            {title}
          </p>

          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <span>{lastEdited}</span>
          </div>
        </div>
      </div>

      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">Delete sheet?</DialogTitle>
            <DialogDescription className="text-xs">
              <span className="font-medium">"{title}"</span> will be permanently
              deleted.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDelete(false)}
            >
              Cancel
            </Button>

            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SheetCard;
