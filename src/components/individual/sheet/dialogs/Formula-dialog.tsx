"use client";

import { useState } from "react";
import { Search, Sigma } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { FORMULA_REFERENCE } from "@/data/formulaRefrence";

interface FormulaDialogProps {
  open: boolean;
  onClose: () => void;
  onInsert: (f: string) => void;
  isDark?: boolean;
}

export default function FormulaDialog({
  open,
  onClose,
  onInsert,
  isDark = false,
}: FormulaDialogProps) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<(typeof FORMULA_REFERENCE)[0] | null>(null);

  const filtered = FORMULA_REFERENCE.filter(
    (f) =>
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.category.toLowerCase().includes(search.toLowerCase()) ||
      f.description.toLowerCase().includes(search.toLowerCase()),
  );
  const categories = [...new Set(filtered.map((f) => f.category))];
  const d = isDark;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="max-w-2xl w-[95vw] sheet-dialog"
        style={{
          background: d ? "#0f1117" : "#fff",
          color: d ? "#e2e8f0" : "#1a1d23",
          borderColor: d ? "#1e2330" : "#e8eaed",
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold flex items-center gap-2">
            <Sigma className="h-4 w-4 text-primary" /> Formula Reference
          </DialogTitle>
          <DialogDescription
            style={{ color: d ? "#8892a4" : "#6b7280" }}
            className="text-xs"
          >
            Type a formula into any cell starting with <code>=</code>. Click a formula to see details and insert it.
          </DialogDescription>
        </DialogHeader>

        <div className="relative mb-3">
          <Search
            className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5"
            style={{ color: d ? "#4a5568" : "#9ca3af" }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search formulas…"
            style={{
              background: d ? "#131620" : "#f9fafb",
              borderColor: d ? "#1e2330" : "#e5e7eb",
              color: d ? "#e2e8f0" : "#1a1d23",
            }}
            className="w-full h-8 pl-8 pr-3 text-xs rounded-md border outline-none focus:border-primary"
          />
        </div>

        <div className="flex gap-3 h-60 sm:h-72">
          <div
            className="w-36 sm:w-48 overflow-y-auto border rounded-md flex-shrink-0"
            style={{ borderColor: d ? "#1e2330" : "#e5e7eb" }}
          >
            {categories.map((cat) => (
              <div key={cat}>
                <div
                  className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider border-b sticky top-0"
                  style={{
                    background: d ? "#131620" : "#f9fafb",
                    color: d ? "#4a5568" : "#9ca3af",
                    borderColor: d ? "#1e2330" : "#e5e7eb",
                  }}
                >
                  {cat}
                </div>
                {filtered
                  .filter((f) => f.category === cat)
                  .map((f) => (
                    <button
                      key={f.name}
                      onClick={() => setSelected(f)}
                      style={{
                        background: selected?.name === f.name ? undefined : "transparent",
                        color:
                          selected?.name === f.name ? undefined : d ? "#8892a4" : "#374151",
                        borderColor: d ? "#1e2330" : "#f3f4f6",
                      }}
                      className={`w-full text-left px-2.5 py-1.5 text-[11px] font-mono border-b transition-colors ${selected?.name === f.name ? "bg-primary/10 text-primary font-semibold" : ""}`}
                    >
                      {f.name}
                    </button>
                  ))}
              </div>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto min-w-0">
            {selected ? (
              <div className="space-y-3 p-1">
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-sm font-bold" style={{ color: d ? "#e2e8f0" : "#111827" }}>
                      {selected.name}
                    </span>
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                      style={{ background: d ? "#1e2330" : "#f3f4f6", color: d ? "#8892a4" : "#6b7280" }}
                    >
                      {selected.category}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: d ? "#8892a4" : "#4b5563" }}>
                    {selected.description}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: d ? "#4a5568" : "#9ca3af" }}>
                    Syntax
                  </p>
                  <code className="block text-xs bg-gray-900 text-green-400 px-3 py-2 rounded font-mono break-all">
                    {selected.syntax}
                  </code>
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: d ? "#4a5568" : "#9ca3af" }}>
                    Example
                  </p>
                  <code
                    className="block text-xs px-3 py-2 rounded font-mono border break-all"
                    style={{
                      background: d ? "rgba(37,99,235,0.1)" : "#eff6ff",
                      color: d ? "#93c5fd" : "#1d4ed8",
                      borderColor: d ? "rgba(59,130,246,0.2)" : "#bfdbfe",
                    }}
                  >
                    {selected.example}
                  </code>
                </div>

                <div
                  className="rounded-md p-2.5"
                  style={{
                    background: d ? "rgba(245,158,11,0.08)" : "#fffbeb",
                    borderColor: d ? "rgba(245,158,11,0.2)" : "#fde68a",
                    border: "1px solid",
                  }}
                >
                  <p className="text-[10px] font-semibold mb-0.5" style={{ color: d ? "#fbbf24" : "#92400e" }}>
                    How to use
                  </p>
                  <p className="text-[11px] leading-relaxed" style={{ color: d ? "#fcd34d" : "#92400e" }}>
                    Select a cell, type{" "}
                    <code className="px-1 rounded" style={{ background: d ? "rgba(245,158,11,0.15)" : "#fef3c7" }}>
                      ={" "}
                    </code>{" "}
                    followed by the formula above.
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center gap-2" style={{ color: d ? "#2d3748" : "#d1d5db" }}>
                <Sigma className="h-8 w-8" />
                <p className="text-xs">Select a formula to see details</p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter
          className="flex items-center gap-2 pt-2 border-t flex-wrap"
          style={{ borderColor: d ? "#1e2330" : "#e5e7eb" }}
        >
          <p className="text-[10px] flex-1 min-w-0" style={{ color: d ? "#4a5568" : "#9ca3af" }}>
            Formulas update automatically when referenced cells change.
          </p>
          <button
            onClick={onClose}
            className="text-xs px-3 py-1.5 rounded border transition-colors"
            style={{ borderColor: d ? "#1e2330" : "#e5e7eb", color: d ? "#8892a4" : "#374151", background: "transparent" }}
          >
            Close
          </button>
          {selected && (
            <button
              onClick={() => { onInsert(selected.example); onClose(); }}
              className="text-xs px-3 py-1.5 rounded bg-primary text-white hover:opacity-90 transition-opacity font-medium"
            >
              Insert example
            </button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
