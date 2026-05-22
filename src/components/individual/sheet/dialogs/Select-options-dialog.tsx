"use client";

import { useState, useEffect, useMemo } from "react";
import { ListChecks, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { getOptionBgStyle, getSelectOptionLabel } from "@/utils/SheetUtils";
import type { SelectOption } from "@/types";

interface SelectOptionsDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (options: SelectOption[]) => void;
  initialOptions?: SelectOption[];
  isDark?: boolean;
}

export default function SelectOptionsDialog({
  open,
  onClose,
  onConfirm,
  initialOptions = [],
  isDark = false,
}: SelectOptionsDialogProps) {
  const [options, setOptions] = useState<SelectOption[]>([]);
  const [newOptionLabel, setNewOptionLabel] = useState("");
  const [newOptionColor, setNewOptionColor] = useState("#dbeafe");

  useEffect(() => {
    if (!open) return;
    setOptions(
      initialOptions.map((option) =>
        typeof option === "string"
          ? { label: option, bgColor: getOptionBgStyle(option).backgroundColor }
          : option,
      ),
    );
    setNewOptionLabel("");
    setNewOptionColor("#dbeafe");
  }, [open, initialOptions]);

  const parsedOptions = useMemo(
    () => options.filter((option) => getSelectOptionLabel(option).trim()),
    [options],
  );

  const handleConfirm = () => {
    if (parsedOptions.length === 0) {
      toast.error("Add at least one option");
      return;
    }
    onConfirm(parsedOptions);
    onClose();
  };

  const addOption = () => {
    const label = newOptionLabel.trim();
    if (!label) return;
    setOptions((prev) => [
      ...prev,
      { label, bgColor: newOptionColor || getOptionBgStyle(label).backgroundColor },
    ]);
    setNewOptionLabel("");
    setNewOptionColor("#dbeafe");
  };

  const removeOption = (index: number) => {
    setOptions((prev) => prev.filter((_, idx) => idx !== index));
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
            Add option labels and pick a background color for each option.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-1">
          <div className="space-y-2">
            {parsedOptions.map((option, i) => (
              <div
                key={i}
                className="grid grid-cols-[1fr_auto_auto] gap-2 items-center rounded-lg border border-border p-2"
              >
                <input
                  className="h-9 px-2 rounded border border-border bg-background text-xs outline-none focus:ring-2 focus:ring-primary/30"
                  value={getSelectOptionLabel(option)}
                  onChange={(e) =>
                    setOptions((prev) =>
                      prev.map((item, idx) =>
                        idx === i
                          ? {
                              label: e.target.value,
                              bgColor:
                                typeof item === "string"
                                  ? getOptionBgStyle(item).backgroundColor
                                  : item.bgColor,
                            }
                          : item,
                      ),
                    )
                  }
                />
                <input
                  type="color"
                  className="h-9 w-11 rounded border border-border p-0"
                  value={
                    typeof option === "string"
                      ? getOptionBgStyle(option).backgroundColor
                      : option.bgColor
                  }
                  onChange={(e) =>
                    setOptions((prev) =>
                      prev.map((item, idx) =>
                        idx === i
                          ? {
                              label: typeof item === "string" ? item : item.label,
                              bgColor: e.target.value,
                            }
                          : item,
                      ),
                    )
                  }
                />
                <button
                  type="button"
                  className="h-9 w-9 rounded-md border border-border text-red-500 hover:bg-red-50"
                  onClick={() => removeOption(i)}
                  aria-label="Remove option"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-[1fr_auto_auto] gap-2 items-center">
            <input
              className="h-9 px-2 rounded border border-border bg-background text-xs outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="New option label"
              value={newOptionLabel}
              onChange={(e) => setNewOptionLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addOption();
                }
              }}
            />
            <input
              type="color"
              className="h-9 w-11 rounded border border-border p-0"
              value={newOptionColor}
              onChange={(e) => setNewOptionColor(e.target.value)}
            />
            <button
              type="button"
              className="h-9 rounded-md bg-primary px-3 text-xs text-white hover:opacity-90"
              onClick={addOption}
              disabled={!newOptionLabel.trim()}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {parsedOptions.length > 0 && (
            <div>
              <p
                className="text-[10px] font-semibold uppercase tracking-wider mb-1.5"
                style={{ color: d ? "#4a5568" : "#9ca3af" }}
              >
                Preview
              </p>
              <div className="flex flex-wrap gap-1.5">
                {parsedOptions.map((option, i) => {
                  const optionStyle = getOptionBgStyle(option);
                  return (
                    <span
                      key={i}
                      className="sheet-badge-pill text-[11px]"
                      style={optionStyle}
                    >
                      {getSelectOptionLabel(option)}
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

