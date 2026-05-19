"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ListChecks, Plus, Trash2 } from "lucide-react";
import type { ColumnDef } from "@/types";
import SelectOptionsDialog from "../dialogs/Select-options-dialog";

type ColumnDraft = {
  key: string;
  name: string;
  type: NonNullable<ColumnDef["type"]>;
  width?: number;
  selectOptions?: string[];
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
  onApply,
}: {
  isDark: boolean;
  columns: ColumnDef[];
  onApply: (columns: ColumnDef[]) => void;
}) {
  const [drafts, setDrafts] = useState<ColumnDraft[]>([]);
  const [selectOptionsDraftKey, setSelectOptionsDraftKey] = useState<
    string | null
  >(null);

  useEffect(() => {
    setDrafts(columns.map(makeDraft));
  }, [columns]);

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
      setSelectOptionsDraftKey(key);
    }
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

  const activeSelectDraft = drafts.find(
    (draft) => draft.key === selectOptionsDraftKey,
  );

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
            className={`rounded-lg border p-2.5 space-y-2 ${
              isDark
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
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 w-full justify-start gap-1.5 text-xs"
                onClick={() => setSelectOptionsDraftKey(draft.key)}
              >
                <ListChecks className="h-3.5 w-3.5" />
                {draft.selectOptions?.length
                  ? `${draft.selectOptions.length} options`
                  : "Add select options"}
              </Button>
            )}
          </div>
        ))}
      </div>

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

      <SelectOptionsDialog
        open={Boolean(selectOptionsDraftKey)}
        onClose={() => setSelectOptionsDraftKey(null)}
        onConfirm={(options) => {
          if (!selectOptionsDraftKey) return;
          updateDraft(selectOptionsDraftKey, { selectOptions: options });
        }}
        initialOptions={activeSelectDraft?.selectOptions ?? []}
        isDark={isDark}
      />
    </div>
  );
}
