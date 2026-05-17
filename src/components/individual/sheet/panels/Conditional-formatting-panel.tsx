"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import type {
  ConditionalFormatOperator,
  ConditionalFormatRule,
  ColumnDef,
} from "@/types";

interface ConditionalFormattingPanelProps {
  isDark: boolean;
  columns: ColumnDef[];
  selectedCell: { row: number; col: string } | null;
  rules: ConditionalFormatRule[];
  onSaveRule: (rule: ConditionalFormatRule) => void;
  onDeleteRule: (ruleId: string) => void;
}

const OPERATORS: { value: ConditionalFormatOperator; label: string }[] = [
  { value: "not_empty", label: "Is not empty" },
  { value: "empty", label: "Is empty" },
  { value: "contains", label: "Text contains" },
  { value: "equals", label: "Equals" },
  { value: "not_equals", label: "Does not equal" },
  { value: "gt", label: "Greater than" },
  { value: "gte", label: "Greater than or equal" },
  { value: "lt", label: "Less than" },
  { value: "lte", label: "Less than or equal" },
  { value: "between", label: "Is between" },
];

function columnIndexToName(index: number) {
  let n = index + 1;
  let name = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    name = String.fromCharCode(65 + rem) + name;
    n = Math.floor((n - 1) / 26);
  }
  return name;
}

function parseA1Ref(ref: string) {
  const match = ref.trim().match(/^([A-Z]+)(\d+)$/i);
  if (!match) return null;
  const letters = match[1].toUpperCase();
  let col = 0;
  for (let i = 0; i < letters.length; i++) {
    col = col * 26 + letters.charCodeAt(i) - 64;
  }
  const row = Number(match[2]);
  if (!Number.isFinite(row) || row < 1) return null;
  return { row: row - 1, col: col - 1 };
}

function parseRange(range: string) {
  const parts = range.split(":").map((part) => parseA1Ref(part));
  if (!parts[0]) return null;
  const start = parts[0];
  const end = parts[1] ?? parts[0];
  if (!end) return null;
  return {
    startRow: Math.min(start.row, end.row),
    endRow: Math.max(start.row, end.row),
    startCol: Math.min(start.col, end.col),
    endCol: Math.max(start.col, end.col),
  };
}

export default function ConditionalFormattingPanel({
  isDark,
  columns,
  selectedCell,
  rules,
  onSaveRule,
  onDeleteRule,
}: ConditionalFormattingPanelProps) {
  const selectedColIndex = selectedCell
    ? columns.findIndex((col) => col.key === selectedCell.col)
    : 0;
  const defaultRange =
    selectedCell && selectedColIndex >= 0
      ? `${columnIndexToName(selectedColIndex)}${selectedCell.row + 1}`
      : "A1:A10";

  const [range, setRange] = useState(defaultRange);
  const [operator, setOperator] =
    useState<ConditionalFormatOperator>("not_empty");
  const [value, setValue] = useState("");
  const [value2, setValue2] = useState("");
  const [bgColor, setBgColor] = useState("#fef3c7");
  const [textColor, setTextColor] = useState("#111827");
  const [bold, setBold] = useState(true);
  const [italic, setItalic] = useState(false);
  const parsedRange = useMemo(() => parseRange(range), [range]);

  const needsValue = !["not_empty", "empty"].includes(operator);
  const rootStyle = isDark
    ? "bg-gray-950 text-gray-100 border-gray-800"
    : "bg-white text-gray-900 border-gray-100";

  return (
    <div className={`${rootStyle} h-full flex flex-col overflow-hidden`}>
      <div className="px-4 py-3 border-b">
        <div className="text-xs font-semibold">Conditional formatting</div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="rounded-lg border border-border bg-background p-3 space-y-3">
          <label className="block text-[11px] font-medium text-muted-foreground">
            Apply to range
          </label>
          <input
            value={range}
            onChange={(e) => setRange(e.target.value.toUpperCase())}
            className="w-full h-8 rounded-md border border-border bg-background px-2.5 text-xs outline-none"
            placeholder="A1:C20"
          />

          <label className="block text-[11px] font-medium text-muted-foreground">
            Format cells if
          </label>
          <select
            value={operator}
            onChange={(e) =>
              setOperator(e.target.value as ConditionalFormatOperator)
            }
            className="w-full h-8 rounded-md border border-border bg-background px-2.5 text-xs outline-none"
          >
            {OPERATORS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {needsValue && (
            <div className="flex gap-2">
              <input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="min-w-0 flex-1 h-8 rounded-md border border-border bg-background px-2.5 text-xs outline-none"
                placeholder="Value"
              />
              {operator === "between" && (
                <input
                  value={value2}
                  onChange={(e) => setValue2(e.target.value)}
                  className="min-w-0 flex-1 h-8 rounded-md border border-border bg-background px-2.5 text-xs outline-none"
                  placeholder="And"
                />
              )}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-border bg-background p-3 space-y-3">
          <div className="text-[11px] font-medium text-muted-foreground">
            Formatting style
          </div>
          <div className="flex items-center gap-2">
            <button
              className={`h-8 w-8 rounded border text-xs font-bold ${
                bold ? "border-primary bg-primary/10" : "border-border"
              }`}
              onClick={() => setBold((v) => !v)}
              type="button"
            >
              B
            </button>
            <button
              className={`h-8 w-8 rounded border text-xs italic ${
                italic ? "border-primary bg-primary/10" : "border-border"
              }`}
              onClick={() => setItalic((v) => !v)}
              type="button"
            >
              I
            </button>
            <input
              type="color"
              value={textColor}
              onChange={(e) => setTextColor(e.target.value)}
              className="h-8 w-12"
              title="Text color"
            />
            <input
              type="color"
              value={bgColor}
              onChange={(e) => setBgColor(e.target.value)}
              className="h-8 w-12"
              title="Fill color"
            />
            <div
              className="h-8 flex-1 rounded border border-border px-2 text-xs flex items-center"
              style={{
                color: textColor,
                backgroundColor: bgColor,
                fontWeight: bold ? 700 : 400,
                fontStyle: italic ? "italic" : "normal",
              }}
            >
              Preview
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-[11px] font-medium text-muted-foreground">
            Existing rules
          </div>
          {rules.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-3 text-[11px] text-muted-foreground">
              No conditional formatting rules yet.
            </div>
          ) : (
            rules.map((rule) => (
              <div
                key={rule.id}
                className="rounded-lg border border-border bg-background p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-xs font-medium truncate">
                      {rule.range}
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      {
                        OPERATORS.find(
                          (option) => option.value === rule.operator,
                        )?.label
                      }{" "}
                      {rule.value}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="text-[11px] text-red-500 hover:underline"
                    onClick={() => onDeleteRule(rule.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="border-t px-4 py-3">
        <Button
          className="w-full"
          size="sm"
          disabled={!parsedRange || (needsValue && !value.trim())}
          onClick={() => {
            if (!parsedRange) return;
            onSaveRule({
              id:
                typeof crypto !== "undefined" && crypto.randomUUID
                  ? crypto.randomUUID()
                  : String(Date.now()),
              range,
              ...parsedRange,
              operator,
              value,
              value2,
              format: { bgColor, textColor, bold, italic },
            });
          }}
        >
          Add rule
        </Button>
      </div>
    </div>
  );
}
