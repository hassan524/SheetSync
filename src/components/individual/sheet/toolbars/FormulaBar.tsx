"use client";

import React, { useEffect, useRef, useCallback } from "react";
import { ColumnDef, SheetRow } from "@/types/index";

interface FormulaBarProps {
  selectedCell: { row: number; col: string } | null;
  columns: ColumnDef[];
  rows: SheetRow[];
  formulas: {
    formulas: Record<string, string>;
    columnFormulas: Record<string, string>;
    setFormulas: (updater: any) => void;
    evaluateFormula?: (formula: string, rowIdx: number) => any;
  };
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
  const inputRef = useRef<HTMLInputElement>(null);
  const mirrorRef = useRef<HTMLSpanElement>(null);
  // Track whether user is actively typing — block ALL external syncs while true
  const isTypingRef = useRef(false);
  // Track the cell we last synced so we know when cell selection changes
  const lastSyncedCellRef = useRef<string>("");

  const colIndex = selectedCell
    ? columns.findIndex((c) => c.key === selectedCell.col)
    : -1;

  const cellLabel =
    selectedCell && colIndex >= 0
      ? `${String.fromCharCode(65 + colIndex)}${selectedCell.row + 1}`
      : "";

  const cellKey =
    selectedCell && colIndex >= 0
      ? protection.getCellKey(selectedCell.row, selectedCell.col)
      : null;

  const storedFormula = cellKey
    ? formulas.formulas[cellKey] ??
      formulas.columnFormulas[selectedCell!.col] ??
      ""
    : "";

  const rawCellValue = selectedCell
    ? String(rows[selectedCell.row]?.[selectedCell.col] ?? "")
    : "";

  const displayValue = storedFormula || rawCellValue;

  const isReadOnly =
    !selectedCell ||
    !canEditSheet ||
    !!(
      selectedCell &&
      rows[selectedCell.row]?.id &&
      protection.isRowProtected(rows[selectedCell.row].id)
    );

  // Sync input ONLY when the selected cell changes (not on every render)
  const currentCellKey = cellKey ?? "";
  useEffect(() => {
    // If the cell changed, always sync regardless of typing
    if (lastSyncedCellRef.current !== currentCellKey) {
      lastSyncedCellRef.current = currentCellKey;
      isTypingRef.current = false;
      if (inputRef.current) {
        inputRef.current.value = displayValue;
      }
      syncMirror(displayValue);
      return;
    }
    // Same cell — only sync if user is NOT typing
    if (!isTypingRef.current && inputRef.current) {
      inputRef.current.value = displayValue;
      syncMirror(displayValue);
    }
  });
  // No dependency array — runs every render but the isTypingRef gate
  // prevents cursor interference while the user is typing

  function syncMirror(val: string) {
    if (mirrorRef.current) {
      mirrorRef.current.textContent = val;
      const w = mirrorRef.current.offsetWidth + 24;
      if (inputRef.current) {
        inputRef.current.style.width = Math.max(120, w) + "px";
        inputRef.current.style.flex = "none";
      }
    }
  }

  const handleFocus = useCallback(() => {
    isTypingRef.current = true;
    // Ensure we show the formula on focus
    if (inputRef.current && displayValue) {
      inputRef.current.value = displayValue;
      syncMirror(displayValue);
    }
   
  }, [displayValue]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (isReadOnly || !selectedCell || !cellKey) return;

      isTypingRef.current = true;
      const val = e.target.value;

      // Update mirror width inline — NO state update, no re-render
      syncMirror(val);

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
          [selectedCell.col]:
            val === "" ? "" : !isNaN(num) && val !== "" ? num : val,
        };
        onRowsChange(nr);
      }
    },
     
    [isReadOnly, selectedCell, cellKey, rows, onRowsChange],
  );

  const handleBlur = useCallback(async () => {
    isTypingRef.current = false;

    if (!selectedCell || !cellKey || !canEditSheet) return;

    // Read directly from the input DOM — not from stale closure
    const currentVal = inputRef.current?.value ?? "";

    if (currentVal.startsWith("=")) {
      // Save the formula that's actually in the input right now
      formulas.setFormulas((p: any) => ({ ...p, [cellKey]: currentVal }));
      await onSaveFormula(sheetId, cellKey, currentVal);
    } else {
      formulas.setFormulas((p: any) => {
        const n = { ...p };
        delete n[cellKey];
        return n;
      });
      await onDeleteFormula(sheetId, cellKey).catch(() => {});
    }
   
  }, [selectedCell, cellKey, canEditSheet, sheetId, onSaveFormula, onDeleteFormula]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        inputRef.current?.blur();
      }
      if (e.key === "Escape") {
        isTypingRef.current = false;
        if (inputRef.current) {
          inputRef.current.value = displayValue;
          syncMirror(displayValue);
        }
        formulas.setFormulas((p: any) => {
          if (!cellKey) return p;
          const n = { ...p };
          if (storedFormula) n[cellKey] = storedFormula;
          else delete n[cellKey];
          return n;
        });
        inputRef.current?.blur();
      }
    },
     
    [displayValue, storedFormula, cellKey],
  );

  return (
    <div
      className="sheet-toolbar h-8 border-b flex items-center px-3 gap-2 shrink-0"
      style={{ background: "var(--sh-toolbar)" }}
    >
      {/* Cell label */}
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

      {/* fx */}
      <div
        className="font-serif italic font-bold shrink-0"
        style={{ color: "var(--sh-muted)" }}
      >
        fx
      </div>

      {/* Mirror span — measures text width without causing re-renders */}
      <span
        ref={mirrorRef}
        aria-hidden="true"
        style={{
          position: "absolute",
          visibility: "hidden",
          whiteSpace: "pre",
          fontSize: "12px",
          fontFamily: "monospace",
          pointerEvents: "none",
        }}
      />

      {/* 
        Fully uncontrolled input.
        No `value` prop at all — React never touches the DOM value.
        Width is set imperatively via syncMirror(), not via state.
        Cursor NEVER jumps because React NEVER re-sets the input.
      */}
      <input
        ref={inputRef}
        className="h-full bg-transparent border-0 outline-none text-[12px] font-mono"
        style={{
          color: "var(--sh-text)",
          caretColor: "var(--sh-text)",
          minWidth: "120px",
          flex: "1",
        }}
        placeholder={
          selectedCell ? "Enter a value or formula starting with =" : ""
        }
        readOnly={isReadOnly}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
}