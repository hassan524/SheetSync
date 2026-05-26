"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, ChevronDown, ChevronUp, AlertTriangle, XCircle } from "lucide-react";
import type { ColumnDef } from "@/types";

// ─── Criteria groups (all Google Sheets criteria) ──────────────────────────

const CRITERIA_GROUPS = [
  {
    label: "Dropdown",
    items: [
      { value: "dropdown", label: "Dropdown" },
      { value: "dropdown_range", label: "Dropdown (from a range)" },
    ],
  },
  {
    label: "Text",
    items: [
      { value: "text_contains", label: "Text contains" },
      { value: "text_not_contains", label: "Text does not contain" },
      { value: "text_exactly", label: "Text is exactly" },
      { value: "text_email", label: "Text is valid email" },
      { value: "text_url", label: "Text is valid URL" },
    ],
  },
  {
    label: "Date",
    items: [
      { value: "date_valid", label: "Is valid date" },
      { value: "date_is", label: "Date is" },
      { value: "date_before", label: "Date is before" },
      { value: "date_on_or_before", label: "Date is on or before" },
      { value: "date_after", label: "Date is after" },
      { value: "date_on_or_after", label: "Date is on or after" },
      { value: "date_between", label: "Date is between" },
      { value: "date_not_between", label: "Date is not between" },
    ],
  },
  {
    label: "Number",
    items: [
      { value: "number_gt", label: "Greater than" },
      { value: "number_gte", label: "Greater than or equal to" },
      { value: "number_lt", label: "Less than" },
      { value: "number_lte", label: "Less than or equal to" },
      { value: "number_eq", label: "Is equal to" },
      { value: "number_neq", label: "Is not equal to" },
      { value: "number_between", label: "Is between" },
      { value: "number_not_between", label: "Is not between" },
    ],
  },
];

// Criteria needing two value inputs
const DUAL_INPUT = new Set([
  "date_between",
  "date_not_between",
  "number_between",
  "number_not_between",
]);

// Criteria needing no value input
const NO_INPUT = new Set(["date_valid", "text_email", "text_url"]);

// Criteria needing a textarea (comma-separated options)
const TEXTAREA_INPUT = new Set(["dropdown"]);

type InvalidAction = "warn" | "reject";

interface ValidationRule {
  id: string;
  criteria: string;
  value: string;
  value2: string;
  invalidAction: InvalidAction;
  helpText: string;
  showHelpText: boolean;
  collapsed: boolean;
}

function makeRule(): ValidationRule {
  return {
    id: `rule_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    criteria: "dropdown",
    value: "",
    value2: "",
    invalidAction: "warn",
    helpText: "",
    showHelpText: false,
    collapsed: false,
  };
}

// ─── Column key → spreadsheet letter (A, B, ... Z, AA, AB …) ──────────────

function columnKeyToLetter(key: string, columns: ColumnDef[]): string {
  const idx = columns.findIndex((c) => c.key === key);
  if (idx < 0) return "";
  let n = idx + 1;
  let result = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    result = String.fromCharCode(65 + rem) + result;
    n = Math.floor((n - 1) / 26);
  }
  return result;
}

// ─── Spreadsheet letter → 0-based column index ────────────────────────────

function letterToColIndex(letter: string): number {
  letter = letter.toUpperCase();
  let n = 0;
  for (let i = 0; i < letter.length; i++) {
    n = n * 26 + (letter.charCodeAt(i) - 64);
  }
  return n - 1; // 0-based
}

// ─── Criteria label lookup ─────────────────────────────────────────────────

function getCriteriaLabel(value: string): string {
  for (const group of CRITERIA_GROUPS) {
    const found = group.items.find((item) => item.value === value);
    if (found) return found.label;
  }
  return value;
}

// ─── Map new criteria back to the legacy rule shape SheetClient expects ────

function criteriaToLegacyRule(rule: ValidationRule) {
  if (rule.criteria === "dropdown") {
    return {
      type: "dropdown",
      options: rule.value
        .split(/[,\n]/)
        .map((s) => s.trim())
        .filter(Boolean),
      invalidAction: rule.invalidAction,
      helpText: rule.helpText,
      showHelpText: rule.showHelpText,
    };
  }
  if (rule.criteria === "dropdown_range") {
    return {
      type: "dropdown_range",
      sourceRange: rule.value,
      invalidAction: rule.invalidAction,
      helpText: rule.helpText,
      showHelpText: rule.showHelpText,
    };
  }
  if (rule.criteria.startsWith("number_")) {
    const opMap: Record<string, string> = {
      number_gt: "gt",
      number_gte: "gte",
      number_lt: "lt",
      number_lte: "lte",
      number_eq: "eq",
      number_neq: "neq",
      number_between: "between",
      number_not_between: "not_between",
    };
    return {
      type: "number",
      operator: opMap[rule.criteria] ?? rule.criteria,
      min: rule.value === "" ? undefined : Number(rule.value),
      max:
        DUAL_INPUT.has(rule.criteria) && rule.value2 !== ""
          ? Number(rule.value2)
          : undefined,
      invalidAction: rule.invalidAction,
      helpText: rule.helpText,
      showHelpText: rule.showHelpText,
    };
  }
  // Text / date criteria — pass through for future handler expansion
  return {
    type: rule.criteria,
    value: rule.value,
    value2: DUAL_INPUT.has(rule.criteria) ? rule.value2 : undefined,
    invalidAction: rule.invalidAction,
    helpText: rule.helpText,
    showHelpText: rule.showHelpText,
  };
}

// ─── Custom criteria dropdown (opens downward, grouped) ───────────────────

function CriteriaDropdown({
  value,
  isDark,
  onChange,
}: {
  value: string;
  isDark: boolean;
  onChange: (val: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const d = isDark;

  useEffect(() => {
    if (!open) return;
    const handler = (e: PointerEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("pointerdown", handler);
    return () => window.removeEventListener("pointerdown", handler);
  }, [open]);

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={`h-8 w-full rounded border px-2.5 text-xs text-left flex items-center justify-between outline-none gap-1
          ${d
            ? "border-gray-700 bg-gray-900 text-gray-200 hover:border-gray-600"
            : "border-gray-200 bg-white text-gray-800 hover:border-gray-300"
          }`}
      >
        <span className="truncate">{getCriteriaLabel(value)}</span>
        <ChevronDown className={`h-3 w-3 shrink-0 opacity-50 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Always opens downward via top-full */}
      {open && (
        <div
          className={`absolute left-0 top-full mt-1 z-50 w-full rounded-lg border shadow-xl overflow-y-auto max-h-64
            ${d ? "border-gray-700 bg-gray-900" : "border-gray-200 bg-white"}`}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {CRITERIA_GROUPS.map((group, gi) => (
            <div key={group.label}>
              {gi > 0 && (
                <div className={`mx-2 border-t ${d ? "border-gray-800" : "border-gray-100"}`} />
              )}
              <div
                className={`px-2.5 pt-2 pb-0.5 text-[9px] font-semibold uppercase tracking-wider
                  ${d ? "text-gray-600" : "text-gray-400"}`}
              >
                {group.label}
              </div>
              {group.items.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => {
                    onChange(item.value);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs transition-colors
                    ${value === item.value
                      ? d
                        ? "bg-primary/20 text-primary"
                        : "bg-primary/10 text-primary"
                      : d
                        ? "text-gray-300 hover:bg-gray-800"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Single rule card ──────────────────────────────────────────────────────

function RuleCard({
  rule,
  isDark,
  onChange,
  onRemove,
  isOnly,
}: {
  rule: ValidationRule;
  isDark: boolean;
  onChange: (patch: Partial<ValidationRule>) => void;
  onRemove: () => void;
  isOnly: boolean;
}) {
  const d = isDark;

  const inputCls = `h-8 w-full rounded border px-2 text-xs outline-none
    ${d
      ? "border-gray-700 bg-gray-900 text-gray-200 placeholder:text-gray-600"
      : "border-gray-200 bg-white text-gray-800 placeholder:text-gray-400"
    }`;

  const labelCls = `text-[10px] font-medium ${d ? "text-gray-400" : "text-gray-500"}`;

  const needsDual = DUAL_INPUT.has(rule.criteria);
  const needsNone = NO_INPUT.has(rule.criteria);
  const needsTextarea = TEXTAREA_INPUT.has(rule.criteria);
  const isDateType = rule.criteria.startsWith("date_");

  const summary =
    !needsNone && rule.value
      ? ` · ${rule.value}${rule.value2 ? ` – ${rule.value2}` : ""}`
      : "";

  return (
    <div
      className={`rounded-lg border mb-2 overflow-hidden
        ${d ? "border-gray-700 bg-gray-900" : "border-gray-200 bg-gray-50"}`}
    >
      {/* Card header / collapse toggle */}
      <div
        className={`flex items-center justify-between px-3 py-2 cursor-pointer select-none
          ${d ? "hover:bg-gray-800" : "hover:bg-gray-100"}`}
        onClick={() => onChange({ collapsed: !rule.collapsed })}
      >
        <span className={`text-[11px] font-semibold truncate ${d ? "text-gray-300" : "text-gray-700"}`}>
          {getCriteriaLabel(rule.criteria)}
          {summary && (
            <span className={`font-normal ${d ? "text-gray-500" : "text-gray-400"}`}>
              {summary}
            </span>
          )}
        </span>
        <div className="flex items-center gap-1 shrink-0 ml-1">
          {!isOnly && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className={`p-1 rounded ${d ? "hover:bg-gray-700 text-gray-500" : "hover:bg-gray-200 text-gray-400"}`}
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
          {rule.collapsed ? (
            <ChevronDown className={`h-3.5 w-3.5 ${d ? "text-gray-500" : "text-gray-400"}`} />
          ) : (
            <ChevronUp className={`h-3.5 w-3.5 ${d ? "text-gray-500" : "text-gray-400"}`} />
          )}
        </div>
      </div>

      {/* Expanded body */}
      {!rule.collapsed && (
        <div className={`px-3 pb-3 space-y-3 border-t ${d ? "border-gray-700" : "border-gray-200"}`}>
          <div className="space-y-1 pt-2">
            <label className={labelCls}>Criteria</label>
            <CriteriaDropdown
              value={rule.criteria}
              isDark={d}
              onChange={(val) => onChange({ criteria: val, value: "", value2: "" })}
            />
          </div>

          {needsTextarea && (
            <div className="space-y-1">
              <label className={labelCls}>Options (comma or newline separated)</label>
              <textarea
                value={rule.value}
                onChange={(e) => onChange({ value: e.target.value })}
                placeholder="Option 1, Option 2, Option 3"
                rows={3}
                className={`w-full rounded border p-2 text-xs outline-none resize-none
                  ${d
                    ? "border-gray-700 bg-gray-900 text-gray-200 placeholder:text-gray-600"
                    : "border-gray-200 bg-white text-gray-800 placeholder:text-gray-400"
                  }`}
              />
            </div>
          )}

          {rule.criteria === "dropdown_range" && (
            <div className="space-y-1">
              <label className={labelCls}>Source range (e.g. A1:A10)</label>
              <input
                className={inputCls}
                value={rule.value}
                onChange={(e) => onChange({ value: e.target.value })}
                placeholder="A1:A10"
              />
            </div>
          )}

          {!needsNone && !needsTextarea && !needsDual && rule.criteria !== "dropdown_range" && (
            <div className="space-y-1">
              <label className={labelCls}>Value</label>
              <input
                className={inputCls}
                type={isDateType ? "date" : "text"}
                value={rule.value}
                onChange={(e) => onChange({ value: e.target.value })}
                placeholder={isDateType ? "YYYY-MM-DD" : "Enter value"}
              />
            </div>
          )}

          {needsDual && (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className={labelCls}>From</label>
                <input
                  className={inputCls}
                  type={isDateType ? "date" : "text"}
                  value={rule.value}
                  onChange={(e) => onChange({ value: e.target.value })}
                  placeholder={isDateType ? "Start date" : "Min"}
                />
              </div>
              <div className="space-y-1">
                <label className={labelCls}>To</label>
                <input
                  className={inputCls}
                  type={isDateType ? "date" : "text"}
                  value={rule.value2}
                  onChange={(e) => onChange({ value2: e.target.value })}
                  placeholder={isDateType ? "End date" : "Max"}
                />
              </div>
            </div>
          )}

          {/* Advanced options */}
          <div
            className={`rounded-md border p-2.5 space-y-2.5
              ${d ? "border-gray-700 bg-gray-950" : "border-gray-100 bg-white"}`}
          >
            <span
              className={`text-[10px] font-semibold uppercase tracking-wide
                ${d ? "text-gray-500" : "text-gray-400"}`}
            >
              Advanced options
            </span>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rule.showHelpText}
                onChange={(e) => onChange({ showHelpText: e.target.checked })}
                className="h-3.5 w-3.5 rounded"
                style={{ accentColor: "var(--primary)" }}
              />
              <span className={`text-[11px] ${d ? "text-gray-300" : "text-gray-700"}`}>
                Show help text for a selected cell
              </span>
            </label>
            {rule.showHelpText && (
              <input
                className={inputCls}
                value={rule.helpText}
                onChange={(e) => onChange({ helpText: e.target.value })}
                placeholder="Help text shown to user…"
              />
            )}

            <div className="space-y-1">
              <div className={`text-[10px] mb-1 ${d ? "text-gray-400" : "text-gray-500"}`}>
                If the data is invalid:
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={`invalid-${rule.id}`}
                  checked={rule.invalidAction === "warn"}
                  onChange={() => onChange({ invalidAction: "warn" })}
                  className="h-3.5 w-3.5"
                  style={{ accentColor: "var(--primary)" }}
                />
                <AlertTriangle className="h-3 w-3 text-amber-500" />
                <span className={`text-[11px] ${d ? "text-gray-300" : "text-gray-700"}`}>
                  Show a warning
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={`invalid-${rule.id}`}
                  checked={rule.invalidAction === "reject"}
                  onChange={() => onChange({ invalidAction: "reject" })}
                  className="h-3.5 w-3.5"
                  style={{ accentColor: "var(--primary)" }}
                />
                <XCircle className="h-3 w-3 text-red-500" />
                <span className={`text-[11px] ${d ? "text-gray-300" : "text-gray-700"}`}>
                  Reject the input
                </span>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Props ─────────────────────────────────────────────────────────────────

interface DataValidationPanelProps {
  isDark: boolean;
  column: ColumnDef | null;
  columns: ColumnDef[];
  totalRows?: number;
  onSave: (rules: any) => void;
  // FIXED: 4-arg signature supporting multi-column ranges like D1:F20
  onRangeSelect?: (startColKey: string, endColKey: string, startRow: number, endRow: number) => void;
}

// ─── Main panel ────────────────────────────────────────────────────────────

export default function DataValidationPanel({
  isDark,
  column,
  columns,
  totalRows = 1000,
  onSave,
  onRangeSelect,
}: DataValidationPanelProps) {
  const d = isDark;
  const [rules, setRules] = useState<ValidationRule[]>([makeRule()]);
  const [rangeInput, setRangeInput] = useState("");
  const [hasRules, setHasRules] = useState(false);
  const [applyRange, setApplyRange] = useState<{
    startColKey: string;
    endColKey: string;
    startRow: number;
    endRow: number;
  } | null>(null);

  useEffect(() => {
    if (!column) return;

    const letter = columnKeyToLetter(column.key, columns);
    const defaultRange = letter
      ? `${letter}1:${letter}${totalRows}`
      : `${column.name}1:${column.name}${totalRows}`;
    setRangeInput(defaultRange);
    setApplyRange({ startColKey: column.key, endColKey: column.key, startRow: 0, endRow: totalRows - 1 });

    // FIXED: now passes 4 args — same start and end col for single column
    if (onRangeSelect) {
      onRangeSelect(column.key, column.key, 0, totalRows - 1);
    }

    const existing = column.validation_rules as any;
    if (!existing) {
      setRules([makeRule()]);
      setHasRules(false);
      return;
    }

    const existingRules = Array.isArray(existing?.rules)
      ? existing.rules
      : Array.isArray(existing)
        ? existing
        : [existing];
    const firstExistingRule = existingRules[0] as any;
    if (firstExistingRule?.startColKey && firstExistingRule?.endColKey) {
      const startLetter = columnKeyToLetter(firstExistingRule.startColKey, columns);
      const endLetter = columnKeyToLetter(firstExistingRule.endColKey, columns);
      const savedStartRow = Number.isFinite(Number(firstExistingRule.startRow))
        ? Number(firstExistingRule.startRow)
        : 0;
      const savedEndRow = Number.isFinite(Number(firstExistingRule.endRow))
        ? Number(firstExistingRule.endRow)
        : totalRows - 1;
      if (startLetter && endLetter) {
        setRangeInput(`${startLetter}${savedStartRow + 1}:${endLetter}${savedEndRow + 1}`);
        setApplyRange({
          startColKey: firstExistingRule.startColKey,
          endColKey: firstExistingRule.endColKey,
          startRow: savedStartRow,
          endRow: savedEndRow,
        });
      }
    } else if (firstExistingRule?.startRow !== undefined || firstExistingRule?.endRow !== undefined) {
      const savedStartRow = Number.isFinite(Number(firstExistingRule.startRow))
        ? Number(firstExistingRule.startRow)
        : 0;
      const savedEndRow = Number.isFinite(Number(firstExistingRule.endRow))
        ? Number(firstExistingRule.endRow)
        : totalRows - 1;
      setRangeInput(`${letter}${savedStartRow + 1}:${letter}${savedEndRow + 1}`);
      setApplyRange({ startColKey: column.key, endColKey: column.key, startRow: savedStartRow, endRow: savedEndRow });
    }
    const seededRules = existingRules.map((sourceRule: any) => {
      let seedCriteria = "dropdown";
      let seedValue = "";
      let seedValue2 = "";

      if (sourceRule.type === "dropdown") {
      seedCriteria = "dropdown";
      seedValue = Array.isArray(sourceRule.options)
        ? sourceRule.options.join(", ")
        : "";
    } else if (sourceRule.type === "dropdown_range") {
      seedCriteria = "dropdown_range";
      seedValue = sourceRule.sourceRange ?? sourceRule.value ?? "";
    } else if (sourceRule.type === "number") {
      const opBack: Record<string, string> = {
        gt: "number_gt",
        gte: "number_gte",
        lt: "number_lt",
        lte: "number_lte",
        eq: "number_eq",
        neq: "number_neq",
        between: "number_between",
        not_between: "number_not_between",
      };
      seedCriteria = opBack[sourceRule.operator ?? "gt"] ?? "number_gt";
      seedValue = sourceRule.min !== undefined ? String(sourceRule.min) : "";
      seedValue2 = sourceRule.max !== undefined ? String(sourceRule.max) : "";
    } else {
      seedCriteria = sourceRule.type ?? "dropdown";
      seedValue = sourceRule.value ?? "";
      seedValue2 = sourceRule.value2 ?? "";
    }

      return {
        ...makeRule(),
        criteria: seedCriteria,
        value: seedValue,
        value2: seedValue2,
        invalidAction: sourceRule.invalidAction === "reject" ? "reject" : "warn",
        helpText: sourceRule.helpText ?? "",
        showHelpText: Boolean(sourceRule.showHelpText),
      };
    });

    setRules(seededRules.length > 0 ? seededRules : [makeRule()]);
    setHasRules(true);
   
  }, [column?.key]);

  // FIXED: parses D1:F20 style ranges and calls 4-arg onRangeSelect
  const handleRangeChange = useCallback(
    (val: string) => {
      setRangeInput(val);
      if (!onRangeSelect) return;

      // Matches: D1:F20  or  D:F  or  B1:B500
      const match = val.trim().match(/^([A-Z]+)(\d*):([A-Z]+)(\d*)$/i);
      if (!match) return;

      const [, startLetter, startRowStr, endLetter, endRowStr] = match;

      const startColIdx = letterToColIndex(startLetter);
      const endColIdx   = letterToColIndex(endLetter);

      const startColKey = columns[startColIdx]?.key;
      const endColKey   = columns[endColIdx]?.key;
      if (!startColKey || !endColKey) return;

      const startRow = startRowStr ? Math.max(0, Number(startRowStr) - 1) : 0;
      const endRow   = endRowStr   ? Math.min(totalRows - 1, Number(endRowStr) - 1) : totalRows - 1;

      setApplyRange({ startColKey, endColKey, startRow, endRow });
      onRangeSelect(startColKey, endColKey, startRow, endRow);
    },
    [columns, onRangeSelect, totalRows],
  );

  const updateRule = useCallback((id: string, patch: Partial<ValidationRule>) => {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }, []);

  const removeRule = useCallback((id: string) => {
    setRules((prev) => {
      const next = prev.filter((r) => r.id !== id);
      if (next.length === 0) {
        setHasRules(false);
        return [makeRule()];
      }
      return next;
    });
  }, []);

  const handleDone = useCallback(() => {
    if (!column) return;
    const activeRules = rules.map(criteriaToLegacyRule);
    if (activeRules.length === 0) return;
    onSave({
      type: "ruleSet",
      rules: activeRules,
      _applyTo: applyRange ?? {
        startColKey: column.key,
        endColKey: column.key,
        startRow: 0,
        endRow: totalRows - 1,
      },
    });
  }, [applyRange, column, rules, onSave, totalRows]);

  const handleRemoveAll = useCallback(() => {
    if (!column) return;
    setRules([makeRule()]);
    setHasRules(false);
    onSave({
      _remove: true,
      _applyTo: applyRange ?? {
        startColKey: column.key,
        endColKey: column.key,
        startRow: 0,
        endRow: totalRows - 1,
      },
    });
  }, [applyRange, column, onSave, totalRows]);

  if (!column) {
    return (
      <div className="h-full flex items-center justify-center px-6 text-center text-xs text-muted-foreground">
        Select a column first to set validation rules.
      </div>
    );
  }

  const labelCls = `text-[10px] font-medium ${d ? "text-gray-400" : "text-gray-500"}`;
  const inputCls = `h-8 w-full rounded border px-2 text-xs outline-none
    ${d
      ? "border-gray-700 bg-gray-900 text-gray-200 placeholder:text-gray-600"
      : "border-gray-200 bg-white text-gray-800 placeholder:text-gray-400"
    }`;

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-3 space-y-3">

        {/* ── Apply to range ── */}
        <div className="space-y-1">
          <label className={labelCls}>Apply to range</label>
          <div className="flex gap-1.5">
            <input
              className={inputCls}
              value={rangeInput}
              onChange={(e) => handleRangeChange(e.target.value)}
              placeholder="B1:B1000"
            />
            {/* Grid icon — resets to full column */}
            <button
              type="button"
              title="Highlight full column"
              onClick={() => {
                const letter = columnKeyToLetter(column.key, columns);
                const full = letter
                  ? `${letter}1:${letter}${totalRows}`
                  : rangeInput;
                setRangeInput(full);
                // FIXED: 4-arg call
                setApplyRange({ startColKey: column.key, endColKey: column.key, startRow: 0, endRow: totalRows - 1 });
                if (onRangeSelect) onRangeSelect(column.key, column.key, 0, totalRows - 1);
              }}
              className={`h-8 w-8 shrink-0 rounded border flex items-center justify-center
                ${d
                  ? "border-gray-700 bg-gray-900 text-gray-400 hover:bg-gray-800"
                  : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                }`}
            >
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-current">
                <rect x="1" y="1" width="6" height="6" rx="1" opacity="0.35" />
                <rect x="9" y="1" width="6" height="6" rx="1" opacity="0.35" />
                <rect x="1" y="9" width="6" height="6" rx="1" opacity="0.35" />
                <rect x="9" y="9" width="6" height="6" rx="1" />
              </svg>
            </button>
          </div>
        </div>

        <div className={`border-t ${d ? "border-gray-800" : "border-gray-100"}`} />

        {/* ── Rules section ── */}
        {!hasRules ? (
          <button
            type="button"
            onClick={() => setHasRules(true)}
            className={`w-full flex items-center justify-center gap-1.5 h-9 rounded-lg border-2 border-dashed text-xs font-medium transition-colors
              ${d
                ? "border-gray-700 text-gray-500 hover:border-primary hover:text-primary"
                : "border-gray-200 text-gray-400 hover:border-primary hover:text-primary"
              }`}
          >
            <Plus className="h-3.5 w-3.5" />
            Add rule
          </button>
        ) : (
          <>
            {rules.map((rule) => (
              <RuleCard
                key={rule.id}
                rule={rule}
                isDark={d}
                onChange={(patch) => updateRule(rule.id, patch)}
                onRemove={() => removeRule(rule.id)}
                isOnly={rules.length === 1}
              />
            ))}

            <button
              type="button"
              onClick={() => setRules((prev) => [...prev, makeRule()])}
              className={`w-full flex items-center justify-center gap-1.5 h-8 rounded-lg border border-dashed text-[11px] font-medium transition-colors
                ${d
                  ? "border-gray-700 text-gray-500 hover:border-primary hover:text-primary"
                  : "border-gray-200 text-gray-400 hover:border-primary hover:text-primary"
                }`}
            >
              <Plus className="h-3 w-3" />
              Add another rule
            </button>
          </>
        )}
      </div>

      {/* ── Footer ── */}
      <div className={`border-t p-3 flex gap-2 shrink-0 ${d ? "border-gray-800" : "border-border"}`}>
        <Button
          variant="outline"
          className="flex-1 h-9 text-xs"
          onClick={handleRemoveAll}
        >
          Remove rule
        </Button>
        <Button
          className="flex-1 h-9 text-xs"
          onClick={handleDone}
          disabled={!hasRules}
        >
          Done
        </Button>
      </div>
    </div>
  );
}
