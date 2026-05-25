"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ListChecks, Plus, Trash2 } from "lucide-react";
import type { ColumnDef, SelectOption, SheetRow } from "@/types";
import { getOptionBgStyle, getSelectOptionLabel } from "@/utils/SheetUtils";

type ColumnDraft = {
  key: string;
  name: string;
  type: NonNullable<ColumnDef["type"]>;
  width?: number;
  selectOptions?: SelectOption[];
  isNew?: boolean;
};

const TYPE_OPTIONS: NonNullable<ColumnDef["type"]>[] = [
  "text",
  "number",
  "currency",
  "date",
  "checkbox",
  "status",
  "priority",
  "select",
  "url",
  "progress",
  "percent",
  "image",
];

function makeDraft(col: ColumnDef): ColumnDraft {
  return {
    key: col.key,
    name: col.name || col.key,
    type: col.type ?? "text",
    width: col.width,
    selectOptions: col.selectOptions ?? [],
  };
}

export default function ColumnsPanel({
  isDark,
  columns,
  rows,
  onApply,
  onBulkUpdate,
  focusedColumnKey,
}: {
  isDark: boolean;
  columns: ColumnDef[];
  rows: SheetRow[];
  onApply: (columns: ColumnDef[]) => void;
  onBulkUpdate?: (columnKey: string, limit: number | "all", value: string) => void;
  focusedColumnKey?: string | null;
}) {
  const [drafts, setDrafts] = useState<ColumnDraft[]>([]);
  const [expandedSelectKey, setExpandedSelectKey] = useState<string | null>(null);
  const [newOptionLabel, setNewOptionLabel] = useState("");
  const [newOptionColor, setNewOptionColor] = useState("#dbeafe");
  const [activeColumnKey, setActiveColumnKey] = useState<string | null>(focusedColumnKey ?? null);
  const [bulkLimit, setBulkLimit] = useState<"all" | "10">("10");
  const [bulkValue, setBulkValue] = useState("");

  useEffect(() => {
    setDrafts(columns.map(makeDraft));
  }, [columns]);

  useEffect(() => {
    if (!focusedColumnKey) return;
    const target = columns.find((column) => column.key === focusedColumnKey);
    if (target?.type === "select") {
      setExpandedSelectKey(focusedColumnKey);
    }
    setActiveColumnKey(focusedColumnKey);
  }, [columns, focusedColumnKey]);

  const activeColumn = drafts.find((draft) => draft.key === activeColumnKey) ?? drafts[0] ?? null;
  const activeColumnValues = activeColumn
    ? rows.map((row, index) => ({
        index,
        value: row[activeColumn.key] ?? "",
      }))
    : [];

  const updateDraft = (
    key: string,
    patch: Partial<Pick<ColumnDraft, "name" | "type" | "selectOptions">>,
  ) => {
    setDrafts((prev) =>
      prev.map((draft) => (draft.key === key ? { ...draft, ...patch } : draft)),
    );
  };

  const updateDraftType = (key: string, type: ColumnDraft["type"]) => {
    updateDraft(key, { type });
    if (type === "select") {
      setExpandedSelectKey(key);
    }
  };

  const updateSelectOption = (
    key: string,
    index: number,
    patch: Partial<Exclude<SelectOption, string>>,
  ) => {
    setDrafts((prev) =>
      prev.map((draft) => {
        if (draft.key !== key) return draft;
        const selectOptions = (draft.selectOptions ?? []).map((option, idx) => {
          if (idx !== index) return option;
          const normalized =
            typeof option === "string"
              ? {
                  label: option,
                  bgColor: getOptionBgStyle(option).backgroundColor,
                }
              : option;
          return { ...normalized, ...patch };
        });
        return { ...draft, selectOptions };
      }),
    );
  };

  const addSelectOption = (key: string) => {
    const label = newOptionLabel.trim();
    if (!label) return;
    updateDraft(key, {
      selectOptions: [
        ...(drafts.find((draft) => draft.key === key)?.selectOptions ?? []),
        { label, bgColor: newOptionColor },
      ],
    });
    setNewOptionLabel("");
    setNewOptionColor("#dbeafe");
  };

  const removeSelectOption = (key: string, index: number) => {
    const draft = drafts.find((item) => item.key === key);
    updateDraft(key, {
      selectOptions: (draft?.selectOptions ?? []).filter((_, idx) => idx !== index),
    });
  };

  const addColumn = () => {
    const key = `col_custom_${Date.now()}`;
    setDrafts((prev) => [
      ...prev,
      {
        key,
        name: "",
        type: "text",
        width: 160,
        selectOptions: [],
        isNew: true,
      },
    ]);
  };

  const removeDraft = (key: string) => {
    setDrafts((prev) => prev.filter((draft) => draft.key !== key));
  };

  const handleApply = () => {
    const nextColumns = drafts
      .filter((draft) => draft.name.trim())
      .map((draft, index) => {
        const existing = columns.find((col) => col.key === draft.key);
        return {
          ...(existing ?? {}),
          key: draft.key,
          name: draft.name.trim(),
          type: draft.type,
          width: draft.width ?? existing?.width ?? 160,
          editable: true,
          position: index,
          ...(draft.type === "select"
            ? { selectOptions: draft.selectOptions ?? [] }
            : {}),
        } as ColumnDef;
      });
    onApply(nextColumns);
  };

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      <div>
        <p
          className={`text-xs leading-relaxed ${
            isDark ? "text-gray-400" : "text-muted-foreground"
          }`}
        >
          Rename A, B, C style columns and set their data type. Add names like
          Title, Name, or Value, then apply them to the sheet.
        </p>
      </div>

      <div className="space-y-2">
        {drafts.map((draft, index) => (
          <div
            key={draft.key}
            onClick={() => setActiveColumnKey(draft.key)}
            className={`rounded-lg border p-2.5 space-y-2 ${
              activeColumnKey === draft.key
                ? "border-primary bg-primary/5"
                : isDark
                ? "border-gray-800 bg-gray-900/60"
                : "border-border bg-card"
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`h-7 w-7 rounded-md flex items-center justify-center text-[11px] font-semibold shrink-0 ${
                  isDark
                    ? "bg-gray-800 text-gray-300"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {index + 1}
              </span>
              <Input
                value={draft.name}
                onChange={(event) =>
                  updateDraft(draft.key, { name: event.target.value })
                }
                placeholder="Column name"
                className="h-8 text-xs"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => removeDraft(draft.key)}
                disabled={drafts.length <= 1}
                aria-label="Remove column"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
            <select
              value={draft.type}
              onChange={(event) =>
                updateDraftType(
                  draft.key,
                  event.target.value as ColumnDraft["type"],
                )
              }
              className={`h-8 w-full rounded-md border px-2 text-xs outline-none ${
                isDark
                  ? "border-gray-800 bg-gray-950 text-gray-200"
                  : "border-border bg-background"
              }`}
            >
              {TYPE_OPTIONS.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            {draft.type === "select" && (
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 w-full justify-start gap-1.5 text-xs"
                  onClick={() =>
                    setExpandedSelectKey((current) =>
                      current === draft.key ? null : draft.key,
                    )
                  }
                >
                  <ListChecks className="h-3.5 w-3.5" />
                  {draft.selectOptions?.length
                    ? `${draft.selectOptions.length} options`
                    : "Add select options"}
                </Button>
                {expandedSelectKey === draft.key && (
                  <div
                    className={`space-y-2 rounded-md border p-2 ${
                      isDark
                        ? "border-gray-800 bg-gray-950"
                        : "border-border bg-background"
                    }`}
                  >
                    {(draft.selectOptions ?? []).map((option, optionIndex) => {
                      const label = getSelectOptionLabel(option);
                      const normalized =
                        typeof option === "string"
                          ? {
                              label,
                              bgColor: getOptionBgStyle(option).backgroundColor,
                            }
                          : option;
                      return (
                        <div
                          key={`${draft.key}-${optionIndex}`}
                          className="grid grid-cols-[1fr_42px_32px] gap-1.5 items-center"
                        >
                          <Input
                            value={label}
                            onChange={(event) =>
                              updateSelectOption(draft.key, optionIndex, {
                                label: event.target.value,
                              })
                            }
                            className="h-8 text-xs"
                          />
                          <input
                            type="color"
                            className="h-8 w-full rounded border border-border bg-background cursor-pointer"
                            value={normalized.bgColor}
                            onChange={(event) =>
                              updateSelectOption(draft.key, optionIndex, {
                                bgColor: event.target.value,
                              })
                            }
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500"
                            onClick={() =>
                              removeSelectOption(draft.key, optionIndex)
                            }
                            aria-label="Remove option"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      );
                    })}
                    <div className="grid grid-cols-[1fr_42px_32px] gap-1.5 items-center">
                      <Input
                        value={newOptionLabel}
                        onChange={(event) => setNewOptionLabel(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            addSelectOption(draft.key);
                          }
                        }}
                        placeholder="Option label"
                        className="h-8 text-xs"
                      />
                      <input
                        type="color"
                        className="h-8 w-full rounded border border-border bg-background cursor-pointer"
                        value={newOptionColor}
                        onChange={(event) => setNewOptionColor(event.target.value)}
                      />
                      <Button
                        type="button"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => addSelectOption(draft.key)}
                        disabled={!newOptionLabel.trim()}
                        aria-label="Add option"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {activeColumn && (
        <div
          className={`rounded-lg border p-3 space-y-3 ${
            isDark ? "border-gray-800 bg-gray-900/60" : "border-border bg-card"
          }`}
        >
          <div>
            <p className={`text-xs font-semibold ${isDark ? "text-gray-200" : "text-gray-800"}`}>
              {activeColumn.name || activeColumn.key} values
            </p>
            <p className={`mt-1 text-[11px] ${isDark ? "text-gray-500" : "text-muted-foreground"}`}>
              Review this column and update all rows or only the first 10 cells.
            </p>
          </div>
          <div
            className={`max-h-44 overflow-y-auto rounded-md border ${
              isDark ? "border-gray-800" : "border-border"
            }`}
          >
            {activeColumnValues.slice(0, 50).map(({ index, value }) => (
              <div
                key={`${activeColumn.key}-${index}`}
                className={`grid grid-cols-[42px_1fr] gap-2 border-b px-2 py-1.5 text-[11px] last:border-b-0 ${
                  isDark ? "border-gray-800 text-gray-300" : "border-border text-gray-700"
                }`}
              >
                <span className={isDark ? "text-gray-500" : "text-muted-foreground"}>
                  {index + 1}
                </span>
                <span className="truncate">{String(value || "")}</span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-[96px_1fr] gap-2">
            <select
              value={bulkLimit}
              onChange={(event) => setBulkLimit(event.target.value as "all" | "10")}
              className={`h-8 rounded-md border px-2 text-xs outline-none ${
                isDark
                  ? "border-gray-800 bg-gray-950 text-gray-200"
                  : "border-border bg-background"
              }`}
            >
              <option value="10">First 10</option>
              <option value="all">All rows</option>
            </select>
            <Input
              value={bulkValue}
              onChange={(event) => setBulkValue(event.target.value)}
              placeholder='Value, e.g. "done"'
              className="h-8 text-xs"
            />
          </div>
          <Button
            type="button"
            size="sm"
            className="w-full"
            disabled={!onBulkUpdate}
            onClick={() => onBulkUpdate?.(activeColumn.key, bulkLimit === "all" ? "all" : 10, bulkValue)}
          >
            Update {bulkLimit === "all" ? "all cells" : "first 10 cells"}
          </Button>
        </div>
      )}

      <div className="flex items-center gap-2 sticky bottom-0 bg-inherit pt-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5 flex-1"
          onClick={addColumn}
        >
          <Plus className="h-3.5 w-3.5" />
          Add Column
        </Button>
        <Button
          type="button"
          size="sm"
          className="flex-1"
          onClick={handleApply}
          disabled={!drafts.some((draft) => draft.name.trim())}
        >
          Apply
        </Button>
      </div>
    </div>
  );
}

