import { ConditionalFormatRule, PRIORITY_OPTIONS, STATUS_OPTIONS } from "@/types/index";
import { STATUS_COLORS } from "@/lib/sheet-templates";

export function isCellInConditionalRange(
  rule: ConditionalFormatRule,
  rowIdx: number,
  colIdx: number,
) {
  return (
    rowIdx >= rule.startRow &&
    rowIdx <= rule.endRow &&
    colIdx >= rule.startCol &&
    colIdx <= rule.endCol
  );
}

export function conditionalRuleMatches(rule: ConditionalFormatRule, raw: unknown) {
  const text = String(raw ?? "").trim();
  const target = rule.value.trim();
  const lowerText = text.toLowerCase();
  const lowerTarget = target.toLowerCase();

  if (rule.operator === "empty") return text === "";
  if (rule.operator === "not_empty") return text !== "";
  if (rule.operator === "contains") return lowerText.includes(lowerTarget);
  if (rule.operator === "equals") return lowerText === lowerTarget;
  if (rule.operator === "not_equals") return lowerText !== lowerTarget;

  const value = Number(raw);
  const target1 = Number(rule.value);
  const target2 = Number(rule.value2);
  if (Number.isNaN(value) || Number.isNaN(target1)) return false;
  if (rule.operator === "gt") return value > target1;
  if (rule.operator === "gte") return value >= target1;
  if (rule.operator === "lt") return value < target1;
  if (rule.operator === "lte") return value <= target1;
  if (rule.operator === "between") {
    if (Number.isNaN(target2)) return false;
    return (
      value >= Math.min(target1, target2) && value <= Math.max(target1, target2)
    );
  }
  return false;
}

export function getStatusOptionStyle(value: string) {
  const normalized = value.trim().toLowerCase();
  return (
    Object.entries(STATUS_COLORS).find(
      ([key]) => key.toLowerCase() === normalized,
    )?.[1] ??
    [...PRIORITY_OPTIONS, ...STATUS_OPTIONS].find(
      (option) =>
        option.value.toLowerCase() === normalized ||
        option.label.toLowerCase() === normalized,
    )
  );
}
