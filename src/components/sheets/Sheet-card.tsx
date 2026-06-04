"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { SHEET_TEMPLATES } from "@/constants/Sheet-templates";
import { useSheetTransition } from "@/hooks/sheets/use-sheet-transition";
import { updateSheetStarred } from "@/lib/querys/sheet/sheet";
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
  isOrganization,
  organizationName,
  onDeleted,
}: SheetCardProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { openSheet } = useSheetTransition();

  const [showDelete, setShowDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [starred, setStarred] = useState(Boolean(isStarred));
  const [isStarring, setIsStarring] = useState(false);
  const [prefetched, setPrefetched] = useState(false);

  const prefetchSheet = useCallback(() => {
    if (prefetched) return;
    const url = isOrganization
      ? `/sheet/${id}?template=${templateId}&org=true`
      : `/sheet/${id}?template=${templateId}`;
    router.prefetch(url);
    setPrefetched(true);
  }, [id, isOrganization, templateId, prefetched, router]);

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

  useEffect(() => {
    setStarred(Boolean(isStarred));
  }, [isStarred]);

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

  const handleStar = async () => {
    setIsStarring(true);
    const next = !starred;
    setStarred(next);
    try {
      await updateSheetStarred(id, next);
      router.refresh();
      toast.success(next ? "Added to starred" : "Removed from starred");
    } catch {
      setStarred(!next);
      toast.error("Failed to update star");
    } finally {
      setIsStarring(false);
    }
  };

  return (
    <>
      <div
        ref={cardRef}
        onClick={() => openSheet(id, templateId, cardRef)}
        onMouseEnter={prefetchSheet}
        className="group cursor-pointer"
      >
        <div className="relative rounded-xl overflow-hidden border border-border bg-white h-[140px] sm:h-[150px] transition-all group-hover:shadow-md">
          <canvas ref={canvasRef} className="w-full h-full" />

          <div className="absolute top-2 left-2 flex items-center gap-1">
            <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-white/90 border text-muted-foreground font-mono">
              {templateTitle}
            </span>
            {isOrganization && (
              <span
                className="text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-50/95 border border-emerald-200 text-emerald-700 font-semibold"
                title={organizationName || "Organization sheet"}
              >
                ORG
              </span>
            )}
          </div>

          <div
            className="absolute top-2 right-2 flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 bg-transparent hover:bg-muted/60"
              onClick={handleStar}
              disabled={isStarring}
              aria-label={starred ? "Unstar sheet" : "Star sheet"}
            >
              <Star
                className={`h-3 w-3 ${
                  starred
                    ? "fill-amber-400 text-amber-400"
                    : "text-muted-foreground"
                }`}
              />
            </Button>

            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 bg-transparent hover:bg-destructive/10"
              onClick={(e) => {
                e.stopPropagation();
                setShowDelete(true);
              }}
              aria-label="Delete sheet"
            >
              <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
            </Button>
          </div>
        </div>

        <div className="mt-2.5 space-y-1.5 px-0.5">
          <p className="expandable-truncate text-[13px] font-medium group-hover:underline underline-offset-2" title={title} tabIndex={0}>
            {title}
          </p>

          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <span>{lastEdited}</span>
          </div>
        </div>
      </div>

      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent className="max-w-sm" onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm">Delete sheet?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              <span className="font-medium">"{title}"</span> will be permanently
              deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel
              disabled={isDeleting}
              className="h-8 text-xs"
            >
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="h-8 text-xs bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default SheetCard;

