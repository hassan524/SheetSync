"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, ChevronRight } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";

import { createSheet } from "@/lib/querys/sheets/sheets";
import { logActivity } from "@/lib/querys/activity/activity";
import { SHEET_TEMPLATES, ICON_MAP } from "@/constants/Sheet-templates";
import { Sheet } from "@/types";

const AVAILABLE_TEMPLATES = SHEET_TEMPLATES.slice(0, 4);

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ShowSaveTo?: boolean;
  onSheetCreated?: (sheet: Sheet) => void;
}

const NewSheetModal = ({
  open,
  onOpenChange,
  onSheetCreated,
}: Props) => {
  const [sheetName, setSheetName] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    AVAILABLE_TEMPLATES[0].id,
  );
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  const pathname = usePathname();
  const router = useRouter();

  const organizationId = useMemo(() => {
    const match = pathname.match(/^\/organizations\/([^/]+)/);
    return match ? match[1] : null;
  }, [pathname]);

  useEffect(() => {
    if (open) {
      setActiveIndex(0);
      setSelectedTemplateId(AVAILABLE_TEMPLATES[0].id);
      setSheetName("");
    }
  }, [open]);

  const activeTemplate = AVAILABLE_TEMPLATES[activeIndex];
  const Icon = ICON_MAP[activeTemplate.iconName];

  const scrollTo = (index: number) => {
    const next =
      ((index % AVAILABLE_TEMPLATES.length) + AVAILABLE_TEMPLATES.length) %
      AVAILABLE_TEMPLATES.length;
    setActiveIndex(next);
    setSelectedTemplateId(AVAILABLE_TEMPLATES[next].id);

    const container = carouselRef.current;
    if (container) {
      const card = container.children[next] as HTMLElement;
      card?.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  };

  const handleCreate = async () => {
    if (!sheetName.trim()) {
      toast.error("Enter a sheet name before creating.");
      return;
    }

    try {
      setLoading(true);

      const createdSheet = await createSheet({
        name: sheetName,
        templateId: selectedTemplateId,
        organizationId: organizationId || undefined,
      });

      await logActivity({
        sheetId: createdSheet.id,
        organizationId: organizationId || null,
        action: organizationId
          ? "created sheet in organization"
          : "created sheet",
        target: sheetName,
      });

      onSheetCreated?.(createdSheet);

      toast.success(`Sheet "${sheetName}" created`);
      router.refresh();
      router.push(`/sheet/${createdSheet.id}${organizationId ? "?org=true" : ""}`);
      setSheetName("");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Error creating sheet");
    } finally {
      setLoading(false);
    }
  };

  const canCreate = !!sheetName.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        showCloseButton={false}
        className="sm:max-w-[460px] p-0 overflow-hidden rounded-xl sm:rounded-2xl border border-zinc-200/80 shadow-xl"
      >
        {/* HEADER */}
        <div
          className={`relative h-[120px] sm:h-[160px] overflow-hidden bg-gradient-to-br ${activeTemplate.accent.from}`}
        >
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="absolute top-3.5 right-3.5 z-30 h-7 w-7 cursor-pointer rounded-full bg-black/5 hover:bg-black/10 border flex items-center justify-center transition-colors"
          >
            <X className="h-3.5 w-3.5 text-zinc-500" />
          </button>

          <button
            onClick={() => scrollTo(activeIndex + 1)}
            className="absolute cursor-pointer right-10 top-1/2 -translate-y-1/2 z-10 h-7 w-7 rounded-full bg-white/80 hover:bg-white border shadow-sm flex items-center justify-center"
          >
            <ChevronRight className="h-3.5 w-3.5 text-zinc-600" />
          </button>

          <div className="absolute inset-0 flex flex-col justify-end px-4 pb-3 sm:px-6 sm:pb-4">
            <div className="flex items-center gap-2 mb-1 sm:mb-2">
              <div
                className={`h-6 w-6 sm:h-7 sm:w-7 rounded-lg border flex items-center justify-center ${activeTemplate.accent.iconRing}`}
              >
                {Icon && <Icon className="h-3.5 w-3.5 text-zinc-600" />}
              </div>
              <span className="text-[10px] sm:text-[10.5px] font-semibold uppercase text-zinc-400 tracking-wide">
                {activeTemplate.title}
              </span>
            </div>

            <p className="text-[15px] sm:text-[19px] font-bold leading-snug">
              {activeTemplate.copy.tagline}
            </p>

            {/* Dot indicators */}
            <div className="flex items-center gap-1 mt-3">
              {AVAILABLE_TEMPLATES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => scrollTo(i)}
                  className={`h-1.5 rounded-full transition-all duration-200 ${
                    i === activeIndex ? "w-4 bg-zinc-500" : "w-1.5 bg-zinc-300"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* BODY */}
        <div className="px-4 sm:px-6 py-4 sm:py-5 space-y-4 bg-white">
          <p className="text-xs sm:text-[13px] text-zinc-500 leading-relaxed">
            {activeTemplate.copy.body}
          </p>

          <div className="space-y-1.5">
            <Label>Sheet name</Label>
            <Input
              value={sheetName}
              onChange={(e) => setSheetName(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && canCreate && handleCreate()
              }
              placeholder={`e.g. My ${activeTemplate.title}`}
            />
          </div>
        </div>

        {/* FOOTER */}
        <div className="mobile-dialog-actions flex justify-end gap-2 p-3 sm:p-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!canCreate || loading}>
            {loading ? "Creating..." : "Create"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewSheetModal;
