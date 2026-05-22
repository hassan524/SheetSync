"use client";

import { Button } from "@/components/ui/button";
import type { ColumnDef } from "@/types";

interface ValidationPanelProps {
  isDark: boolean;
  selectedCell: { row: number; col: string } | null;
  columns: ColumnDef[];
  validationState: {
    scope: "cell" | "column";
    optionsText: string;
  };
  onChangeScope: (scope: "cell" | "column") => void;
  onChangeOptionsText: (value: string) => void;
  onSave: () => void;
}

export default function ValidationPanel({
  isDark,
  selectedCell,
  columns,
  validationState,
  onChangeScope,
  onChangeOptionsText,
  onSave,
}: ValidationPanelProps) {
  const selectedColumn = selectedCell
    ? columns.find((c) => c.key === selectedCell.col)
    : null;
  const cellLabel = selectedCell
    ? `${String.fromCharCode(65 + columns.findIndex((c) => c.key === selectedCell.col))}${selectedCell.row + 1}`
    : null;

  const rootStyle = isDark ? "bg-slate-950 text-slate-100" : "bg-white text-slate-900";

  return (
    <div className={`${rootStyle} h-full flex flex-col overflow-hidden`}>
      <div className="px-4 py-3 border-b">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <span className="text-primary">Validation</span>
        </div>
        <p className="text-[11px] mt-2 text-muted-foreground">
          Configure a dropdown validation list for {selectedColumn?.name ?? "the selected column"}.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="rounded-xl border border-border bg-background p-4 space-y-3">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Apply to
          </div>
          <div className="flex gap-3">
            {(["column", "cell"] as const).map((scope) => (
              <button
                key={scope}
                type="button"
                onClick={() => onChangeScope(scope)}
                className={`rounded-lg border px-3 py-2 text-[12px] transition ${
                  validationState.scope === scope
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-foreground hover:border-primary/50"
                }`}
              >
                {scope === "column" ? "Column" : "Single cell"}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-background p-4 space-y-3">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Options
          </div>
          <textarea
            value={validationState.optionsText}
            onChange={(e) => onChangeOptionsText(e.target.value)}
            placeholder="New, In Progress, Done"
            className="w-full min-h-[160px] rounded-md border border-border bg-background p-3 text-xs outline-none"
          />
          <p className="text-[11px] text-muted-foreground">
            Enter comma-separated dropdown values. Empty values are ignored.
          </p>
        </div>

        {cellLabel ? (
          <div className="rounded-xl border border-border bg-background p-4 text-[11px] text-muted-foreground">
            Configuring validation for <span className="font-semibold text-foreground">{cellLabel}</span>.
          </div>
        ) : null}
      </div>

      <div className="border-t px-4 py-3 flex items-center justify-between gap-3">
        <div className="text-[11px] text-muted-foreground">Validation dropdown list for this column or cell.</div>
        <Button variant="secondary" size="sm" onClick={onSave}>
          Save
        </Button>
      </div>
    </div>
  );
}

