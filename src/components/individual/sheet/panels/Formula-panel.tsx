"use client";

import { useState } from "react";
import { Search, Sigma } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FORMULA_REFERENCE } from "@/data/formulaRefrence";
import type { ColumnDef } from "@/types";

interface FormulaPanelProps {
  isDark: boolean;
  selectedCell: { row: number; col: string } | null;
  columns: ColumnDef[];
  onInsert: (example: string) => void;
}

export default function FormulaPanel({
  isDark,
  selectedCell,
  columns,
  onInsert,
}: FormulaPanelProps) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<
    (typeof FORMULA_REFERENCE)[0] | null
  >(null);

  const filtered = FORMULA_REFERENCE.filter(
    (f) =>
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.category.toLowerCase().includes(search.toLowerCase()) ||
      f.description.toLowerCase().includes(search.toLowerCase()),
  );
  const categories = [...new Set(filtered.map((f) => f.category))];

  const selectedCellLabel = selectedCell
    ? `${String.fromCharCode(
        65 + columns.findIndex((c) => c.key === selectedCell.col),
      )}${selectedCell.row + 1}`
    : null;

  const rootStyle = isDark ? "bg-slate-950 text-slate-100" : "bg-white text-slate-900";

  return (
    <div className={`${rootStyle} h-full flex flex-col overflow-hidden`}>
      <div className="px-4 py-3 border-b">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Sigma className="h-3.5 w-3.5 text-primary" />
          Formula reference
        </div>
        <p className="text-[11px] mt-2 text-muted-foreground">
          Select a formula and insert an example into {selectedCellLabel ?? "a cell"}.
        </p>
      </div>

      <div className="flex gap-3 p-4 overflow-hidden min-h-0">
        <div className="w-44 overflow-y-auto rounded-xl border border-border bg-background" style={{ maxHeight: "calc(100vh - 140px)" }}>
          <div className="px-3 py-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search formulas…"
                className="w-full rounded-md border border-border bg-background py-2 pl-10 pr-3 text-xs outline-none"
              />
            </div>
          </div>
          <div className="space-y-1 px-1 pb-2">
            {categories.map((cat) => (
              <div key={cat}>
                <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                  {cat}
                </div>
                {filtered
                  .filter((f) => f.category === cat)
                  .map((f) => (
                    <button
                      key={f.name}
                      onClick={() => setSelected(f)}
                      className={`w-full text-left px-3 py-2 text-[11px] transition-colors ${
                        selected?.name === f.name
                          ? "bg-primary/10 text-primary font-semibold"
                          : "text-foreground hover:bg-gray-100 dark:hover:bg-white/5"
                      }`}
                    >
                      {f.name}
                    </button>
                  ))}
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto rounded-xl border border-border bg-background p-4">
          {selected ? (
            <div className="space-y-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold">{selected.name}</span>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {selected.category}
                  </span>
                </div>
                <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
                  {selected.description}
                </p>
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                  Syntax
                </div>
                <div className="rounded-md border border-border bg-slate-950/5 p-3 font-mono text-[11px]">
                  {selected.syntax}
                </div>
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                  Example
                </div>
                <div className="rounded-md border border-border bg-slate-950/5 p-3 font-mono text-[11px]">
                  {selected.example}
                </div>
              </div>

              <div className="rounded-md border border-amber-200 bg-amber-50/50 p-3 text-[11px] text-amber-900">
                Type a formula directly in the cell starting with <code>=</code>, or insert the example below.
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-sm text-muted-foreground">
              <Sigma className="h-7 w-7 mb-3 text-primary" />
              <p>Select a formula to see details.</p>
            </div>
          )}
        </div>
      </div>

      <div className="border-t px-4 py-3 flex items-center justify-between gap-3">
        <div className="text-[11px] text-muted-foreground">
          {selectedCellLabel ? `Inserting into ${selectedCellLabel}` : "Select a cell first."}
        </div>
        <Button
          variant="secondary"
          size="sm"
          disabled={!selected || !selectedCell}
          onClick={() => {
            if (selected) onInsert(selected.example);
          }}
        >
          Insert formula
        </Button>
      </div>
    </div>
  );
}
