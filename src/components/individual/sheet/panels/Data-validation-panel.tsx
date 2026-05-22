"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ColumnDef } from "@/types";

interface DataValidationPanelProps {
  isDark: boolean;
  column: ColumnDef | null;
  onSave: (rules: any) => void;
}

export default function DataValidationPanel({
  isDark,
  column,
  onSave,
}: DataValidationPanelProps) {
  const [type, setType] = useState<"dropdown" | "number">("dropdown");
  const [options, setOptions] = useState("");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");

  useEffect(() => {
    const rules = column?.validation_rules;
    setType(rules?.type === "number" ? "number" : "dropdown");
    setOptions(Array.isArray(rules?.options) ? rules.options.join(", ") : "");
    setMin(rules?.min ?? "");
    setMax(rules?.max ?? "");
  }, [column?.key, column?.validation_rules]);

  if (!column) {
    return (
      <div className="h-full flex items-center justify-center px-6 text-center text-xs text-muted-foreground">
        Select a column first.
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <div className={`text-sm font-semibold ${isDark ? "text-gray-100" : "text-gray-900"}`}>
            {column.name}
          </div>
          <div className="text-[11px] text-muted-foreground">Restrict input for this column.</div>
        </div>

        <select
          value={type}
          onChange={(event) => setType(event.target.value as "dropdown" | "number")}
          className={`h-9 w-full rounded-md border px-2 text-xs outline-none ${
            isDark ? "border-gray-800 bg-gray-950 text-gray-200" : "border-border bg-background"
          }`}
        >
          <option value="dropdown">Dropdown values</option>
          <option value="number">Number range</option>
        </select>

        {type === "dropdown" ? (
          <div className="space-y-2">
            <label className="text-[11px] font-medium text-muted-foreground">
              Allowed values
            </label>
            <textarea
              value={options}
              onChange={(event) => setOptions(event.target.value)}
              placeholder="Laptop, Mobile, Done"
              className={`min-h-32 w-full rounded-md border p-2 text-xs outline-none ${
                isDark ? "border-gray-800 bg-gray-950 text-gray-200" : "border-border bg-background"
              }`}
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">Min</label>
              <Input value={min} onChange={(event) => setMin(event.target.value)} className="h-8 text-xs" />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">Max</label>
              <Input value={max} onChange={(event) => setMax(event.target.value)} className="h-8 text-xs" />
            </div>
          </div>
        )}
      </div>

      <div className={`border-t p-3 ${isDark ? "border-gray-800" : "border-border"}`}>
        <Button
          className="w-full h-9 text-xs"
          onClick={() => {
            if (type === "dropdown") {
              onSave({
                type: "dropdown",
                options: options.split(",").map((item) => item.trim()).filter(Boolean),
              });
            } else {
              onSave({
                type: "number",
                min: min === "" ? undefined : Number(min),
                max: max === "" ? undefined : Number(max),
              });
            }
          }}
        >
          Save validation
        </Button>
      </div>
    </div>
  );
}
