"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ColumnDef, SelectOption } from "@/types";
import { getOptionBgStyle, getSelectOptionLabel } from "@/utils/SheetUtils";

interface SelectOptionsPanelProps {
  isDark: boolean;
  column: ColumnDef | null;
  onInsert: (options: SelectOption[]) => void;
}

export default function SelectOptionsPanel({
  isDark,
  column,
  onInsert,
}: SelectOptionsPanelProps) {
  const [options, setOptions] = useState<SelectOption[]>([]);
  const [label, setLabel] = useState("");
  const [bgColor, setBgColor] = useState("#dbeafe");

  useEffect(() => {
    setOptions(column?.selectOptions ?? []);
    setLabel("");
    setBgColor("#dbeafe");
  }, [column?.key, column?.selectOptions]);

  const addOption = () => {
    const nextLabel = label.trim();
    if (!nextLabel) return;
    setOptions((prev) => [...prev, { label: nextLabel, bgColor }]);
    setLabel("");
    setBgColor("#dbeafe");
  };

  const updateOption = (
    index: number,
    patch: Partial<Exclude<SelectOption, string>>,
  ) => {
    setOptions((prev) =>
      prev.map((option, idx) => {
        if (idx !== index) return option;
        const normalized =
          typeof option === "string"
            ? {
                label: option,
                bgColor: getOptionBgStyle(option).backgroundColor,
              }
            : option;
        return { ...normalized, ...patch };
      }),
    );
  };

  const removeOption = (index: number) => {
    setOptions((prev) => prev.filter((_, idx) => idx !== index));
  };

  if (!column) {
    return (
      <div className="h-full flex items-center justify-center px-6 text-center text-xs text-muted-foreground">
        Select a dropdown column first.
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div>
          <p
            className={`text-[11px] ${
              isDark ? "text-gray-500" : "text-muted-foreground"
            }`}
          >
            {column.name}
          </p>
        </div>

        <div className="space-y-2">
          {options.map((option, index) => {
            const optionLabel = getSelectOptionLabel(option);
            const normalized =
              typeof option === "string"
                ? {
                    label: option,
                    bgColor: getOptionBgStyle(option).backgroundColor,
                  }
                : option;
            return (
              <div
                key={`${column.key}-${index}`}
                className="grid grid-cols-[1fr_44px_34px] gap-2 items-center"
              >
                <Input
                  value={optionLabel}
                  onChange={(event) =>
                    updateOption(index, { label: event.target.value })
                  }
                  className="h-8 text-xs"
                />
                <input
                  type="color"
                  value={normalized.bgColor}
                  onChange={(event) =>
                    updateOption(index, { bgColor: event.target.value })
                  }
                  className="h-8 w-full rounded border border-border bg-background cursor-pointer"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-500"
                  onClick={() => removeOption(index)}
                  aria-label="Remove option"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-[1fr_44px_34px] gap-2 items-center">
          <Input
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addOption();
              }
            }}
            placeholder="Option label"
            className="h-8 text-xs"
          />
          <input
            type="color"
            value={bgColor}
            onChange={(event) => setBgColor(event.target.value)}
            className="h-8 w-full rounded border border-border bg-background cursor-pointer"
          />
          <Button
            type="button"
            size="icon"
            className="h-8 w-8"
            onClick={addOption}
            disabled={!label.trim()}
            aria-label="Add option"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div
        className={`shrink-0 border-t p-3 ${
          isDark ? "border-gray-800" : "border-border"
        }`}
      >
        <Button
          type="button"
          className="w-full h-9 text-xs"
          onClick={() => onInsert(options)}
        >
          Insert
        </Button>
      </div>
    </div>
  );
}
