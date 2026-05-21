"use client";

import React from "react";
import { SlidersHorizontal, Search, Plus, X } from "lucide-react";
import { ColumnDef } from "@/types/index";
import { AdvancedFilterRule, FilterOperator } from "@/types/sheet-types";

interface FilterBarProps {
  filterValue: string;
  advancedFilters: AdvancedFilterRule[];
  filterColumns: ColumnDef[];
  filteredRowsCount: number;
  totalRowsCount: number;
  filterSuggestions: Record<string, string[]>;
  onFilterValueChange: (v: string) => void;
  onAddRule: () => void;
  onUpdateRule: (id: string, update: Partial<AdvancedFilterRule>) => void;
  onRemoveRule: (id: string) => void;
  onClear: () => void;
}

function getFilterOperators(columnKey: string, columns: ColumnDef[]): { value: FilterOperator; label: string }[] {
  const col = columns.find((c) => c.key === columnKey);
  const numeric = col?.type === "number" || col?.type === "currency" || col?.type === "progress" || col?.type === "date";
  return numeric
    ? [
        { value: "gt", label: ">" }, { value: "gte", label: ">=" },
        { value: "lt", label: "<" }, { value: "lte", label: "<=" },
        { value: "equals", label: "is" }, { value: "not_equals", label: "is not" },
        { value: "empty", label: "empty" }, { value: "not_empty", label: "not empty" },
      ]
    : [
        { value: "contains", label: "contains" }, { value: "equals", label: "is" },
        { value: "not_equals", label: "is not" }, { value: "empty", label: "empty" },
        { value: "not_empty", label: "not empty" },
      ];
}

export function FilterBar({
  filterValue, advancedFilters, filterColumns, filteredRowsCount, totalRowsCount,
  filterSuggestions, onFilterValueChange, onAddRule, onUpdateRule, onRemoveRule, onClear,
}: FilterBarProps) {
  return (
    <div className="sheet-filterbar min-h-11 border-b flex items-center px-3 py-1.5 gap-2 shrink-0 overflow-x-auto no-scrollbar">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-700 shrink-0">
        <SlidersHorizontal className="h-3 w-3" />
        Filter
      </div>
      <div className="relative shrink-0">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
        <input
          value={filterValue}
          onChange={(e) => onFilterValueChange(e.target.value)}
          placeholder="Search all cells"
          className="sheet-filter-input h-6 w-40 sm:w-56 pl-6 pr-2 text-[11px] rounded-md border"
        />
      </div>

      {advancedFilters.map((rule) => {
        const operators = getFilterOperators(rule.columnKey, filterColumns);
        const needsValue = rule.operator !== "empty" && rule.operator !== "not_empty";
        return (
          <div
            key={rule.id}
            className="flex items-center gap-1 rounded-md border bg-background/80 px-1.5 py-1 shrink-0"
          >
            <select
              className="h-6 max-w-32 rounded border bg-transparent px-1.5 text-[11px] outline-none"
              value={rule.columnKey}
              onChange={(e) => {
                const col = filterColumns.find((c) => c.key === e.target.value);
                onUpdateRule(rule.id, {
                  columnKey: e.target.value,
                  operator: col?.type === "number" || col?.type === "currency" || col?.type === "progress"
                    ? "gt" : "contains",
                  value: "",
                });
              }}
            >
              {filterColumns.map((col) => (
                <option key={col.key} value={col.key}>{col.name}</option>
              ))}
            </select>
            <select
              className="h-6 rounded border bg-transparent px-1.5 text-[11px] outline-none"
              value={rule.operator}
              onChange={(e) =>
                onUpdateRule(rule.id, {
                  operator: e.target.value as FilterOperator,
                  value: e.target.value === "empty" || e.target.value === "not_empty" ? "" : rule.value,
                })
              }
            >
              {operators.map((op) => (
                <option key={op.value} value={op.value}>{op.label}</option>
              ))}
            </select>
            {needsValue && (
              <>
                <input
                  list={`filter-values-${rule.id}`}
                  className="h-6 w-28 rounded border bg-transparent px-1.5 text-[11px] outline-none"
                  value={rule.value}
                  placeholder="value"
                  onChange={(e) => onUpdateRule(rule.id, { value: e.target.value })}
                />
                <datalist id={`filter-values-${rule.id}`}>
                  {(filterSuggestions[rule.columnKey] ?? []).map((value) => (
                    <option key={value} value={value} />
                  ))}
                </datalist>
              </>
            )}
            <button
              className="h-6 w-6 rounded hover:bg-muted flex items-center justify-center"
              onClick={() => onRemoveRule(rule.id)}
              aria-label="Remove filter"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        );
      })}

      <button
        className="sheet-action-btn flex items-center gap-1 h-6 px-2 rounded text-[11px] font-medium shrink-0"
        onClick={onAddRule}
        disabled={filterColumns.length === 0}
      >
        <Plus className="h-3 w-3" />
        Rule
      </button>
      {(filterValue || advancedFilters.length > 0) && (
        <span className="text-[11px] text-amber-600 font-medium shrink-0">
          {filteredRowsCount}/{totalRowsCount} rows
        </span>
      )}
      <button
        className="sheet-clear-filter flex items-center gap-1 text-[11px] font-medium px-2 h-6 rounded shrink-0"
        onClick={onClear}
      >
        Clear
        <X className="h-2.5 w-2.5 ml-0.5" />
      </button>
    </div>
  );
}