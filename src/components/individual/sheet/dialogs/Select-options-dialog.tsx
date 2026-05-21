"use client";

import { useState, useMemo, useEffect } from "react";
import { ListChecks } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { getOptionBgStyle } from "@/utils/SheetUtils";

interface SelectOptionsDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (options: string[]) => void;
  initialOptions?: string[];
  isDark?: boolean;
}

export default function SelectOptionsDialog({
  open,
  onClose,
  onConfirm,
  initialOptions = [],
  isDark = false,
}: SelectOptionsDialogProps) {
  const [input, setInput] = useState(initialOptions.join(", "));

  useEffect(() => {
    if (open) setInput(initialOptions.join(", "));
  }, [open, initialOptions]);

  const parsedOptions = useMemo(
    () =>
      input
        .split(",")
        .map((o) => o.trim())
        .filter(Boolean),
    [input],
  );

  const handleConfirm = () => {
    if (parsedOptions.length === 0) {
      toast.error("Add at least one option");
      return;
    }
    onConfirm(parsedOptions);
    onClose();
  };

  const d = isDark;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="max-w-sm w-[92vw] sheet-dialog"
        style={{
          background: d ? "#0f1117" : "#fff",
          color: d ? "#e2e8f0" : "#1a1d23",
          borderColor: d ? "#1e2330" : "#e8eaed",
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold flex items-center gap-2">
            <ListChecks className="h-4 w-4 text-primary" />
            Set Select Options
          </DialogTitle>
          <DialogDescription
            style={{ color: d ? "#8892a4" : "#6b7280" }}
            className="text-xs"
          >
            Enter options separated by commas. e.g.{" "}
            <code
              style={{ background: d ? "#1e2330" : "#f3f4f6" }}
              className="px-1 rounded"
            >
              Laptop, Phone, iPad
            </code>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-1">
          <textarea
            autoFocus
            style={{
              background: d ? "#131620" : "#f9fafb",
              borderColor: d ? "#1e2330" : "#e5e7eb",
              color: d ? "#e2e8f0" : "#1a1d23",
            }}
            className="w-full h-24 px-3 py-2 text-xs rounded-md border outline-none focus:border-primary resize-none font-mono"
            placeholder="Laptop, Phone, iPad, Monitor…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey))
                handleConfirm();
            }}
          />

          {parsedOptions.length > 0 && (
            <div>
              <p
                className="text-[10px] font-semibold uppercase tracking-wider mb-1.5"
                style={{ color: d ? "#4a5568" : "#9ca3af" }}
              >
                Preview
              </p>
              <div className="flex flex-wrap gap-1.5">
                {parsedOptions.map((opt, i) => {
                  const optionStyle = getOptionBgStyle(opt);
                  return (
                    <span
                      key={i}
                      className="sheet-badge-pill text-[11px]"
                      style={optionStyle}
                    >
                      {opt}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <DialogFooter
          className="gap-2 pt-1 border-t"
          style={{ borderColor: d ? "#1e2330" : "#e5e7eb" }}
        >
          <button
            onClick={onClose}
            className="text-xs px-3 py-1.5 rounded border transition-colors"
            style={{
              borderColor: d ? "#1e2330" : "#e5e7eb",
              color: d ? "#8892a4" : "#374151",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="text-xs px-3 py-1.5 rounded bg-primary text-white hover:opacity-90 font-medium transition-opacity"
          >
            Save Options
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

