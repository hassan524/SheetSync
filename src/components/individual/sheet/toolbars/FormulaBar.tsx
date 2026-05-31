"use client";

import React from "react";
import { ColumnDef } from "@/types/index";
import { SheetRow } from "@/types/index";

interface FormulaBarProps {
  selectedCell: { row: number; col: string } | null;
  columns: ColumnDef[];
  rows: SheetRow[];
  formulas: { formulas: Record<string, string>; columnFormulas: Record<string, string>; setFormulas: (updater: any) => void };
  protection: {
    getCellKey: (row: number, col: string) => string;
    isRowProtected: (rowId: string | number) => boolean;
  };
  sheetId: string;
  isDark: boolean;
  canEditSheet?: boolean;
  onRowsChange: (rows: SheetRow[]) => void;
  onSaveFormula: (sheetId: string, cellKey: string, formula: string) => Promise<void>;
  onDeleteFormula: (sheetId: string, cellKey: string) => Promise<void>;
}

export function FormulaBar({
  selectedCell,
  columns,
  rows,
  formulas,
  protection,
  sheetId,
  isDark,
  canEditSheet = true,
  onRowsChange,
  onSaveFormula,
  onDeleteFormula,
}: FormulaBarProps) {
  const cellLabel = selectedCell
    ? `${String.fromCharCode(65 + columns.findIndex((c) => c.key === selectedCell.col))}${selectedCell.row + 1}`
    : "";

  const cellKey = selectedCell
    ? protection.getCellKey(selectedCell.row, selectedCell.col)
    : null;

  const formulaValue = selectedCell && cellKey
    ? (formulas.formulas[cellKey] ??
      formulas.columnFormulas[selectedCell.col] ??
      String(rows[selectedCell.row]?.[selectedCell.col] ?? ""))
    : "";

  return (
    <div
      className="sheet-toolbar h-8 border-b flex items-center px-3 gap-2 shrink-0"
      style={{ background: "var(--sh-toolbar)" }}
    >
      <div
        className="flex items-center justify-center h-5 px-2 font-mono text-[11px] rounded border shrink-0"
        style={{
          background: "var(--sh-head-bg)",
          color: "var(--sh-col-label)",
          borderColor: "var(--sh-border)",
          minWidth: "36px",
        }}
      >
        {cellLabel}
      </div>
      <div
        className="font-serif italic font-bold shrink-0"
        style={{ color: "var(--sh-muted)" }}
      >
        fx
      </div>
      <input
        className="flex-1 h-full bg-transparent border-0 outline-none text-[12px] font-mono min-w-0"
        style={{ color: "var(--sh-text)", caretColor: "var(--sh-text)" }}
        placeholder={selectedCell ? "Enter a formula starting with =" : ""}
        value={formulaValue}
        readOnly={
          !selectedCell ||
          !canEditSheet ||
          !!(
            selectedCell &&
            rows[selectedCell.row]?.id &&
            protection.isRowProtected(rows[selectedCell.row].id)
          )
        }
        onChange={(e) => {
          if (!selectedCell || !cellKey) return;
          const val = e.target.value;
          if (val.startsWith("=")) {
            formulas.setFormulas((p: any) => ({ ...p, [cellKey]: val }));
          } else {
            formulas.setFormulas((p: any) => {
              const n = { ...p };
              delete n[cellKey];
              return n;
            });
            const nr = [...rows];
            const num = Number(val);
            nr[selectedCell.row] = {
              ...nr[selectedCell.row],
              [selectedCell.col]: val === "" ? "" : !isNaN(num) ? num : val,
            };
            onRowsChange(nr);
          }
        }}
        onBlur={async () => {
          if (!selectedCell || !cellKey || !canEditSheet) return;
          const f = formulas.formulas[cellKey];
          if (f) await onSaveFormula(sheetId, cellKey, f);
          else await onDeleteFormula(sheetId, cellKey).catch(() => {});
        }}
      />
    </div>
  );
}
