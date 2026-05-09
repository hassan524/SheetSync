"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  MoreVertical,
  Type,
  Hash,
  DollarSign,
  Calendar,
  CheckSquare,
  Link,
  AlertCircle,
  Trash2,
  WrapText,
  Check,
  BarChart2,
  Sigma,
  X,
  ListChecks,
  Plus,
  Copy,
  BadgeDollarSign,
} from "lucide-react";
import { ColumnDef } from "@/types";

interface ColumnHeaderMenuProps {
  column: ColumnDef;
  onChangeType: (type: ColumnDef["type"]) => void;
  onDelete: () => void;
  onRename?: (newName: string) => void;
  onSetWidth?: (width: number) => void;
  onToggleTextWrap?: () => void;
  textWrapEnabled?: boolean;
  columnFormula?: string;
  onApplyColumnFormula?: (formula: string) => void;
  onRemoveColumnFormula?: () => void;
  selectOptions?: string[];
  onUpdateSelectOptions?: (options: string[]) => void;
  onInsertLeft?: () => void;
  onInsertRight?: () => void;
  onDuplicate?: () => void;
  onClearColumn?: () => void;
  onSortAsc?: () => void;
  onSortDesc?: () => void;
  onSetCurrency?: (currencyCode: string) => void;
}

const COLUMN_TYPES = [
  { type: "text" as const, label: "Text", icon: Type },
  { type: "number" as const, label: "Number", icon: Hash },
  { type: "currency" as const, label: "Currency", icon: DollarSign },
  { type: "date" as const, label: "Date", icon: Calendar },
  { type: "checkbox" as const, label: "Checkbox", icon: CheckSquare },
  { type: "url" as const, label: "URL", icon: Link },
  { type: "priority" as const, label: "Priority", icon: AlertCircle },
  { type: "status" as const, label: "Status", icon: AlertCircle },
  { type: "progress" as const, label: "Progress", icon: BarChart2 },
  { type: "image" as const, label: "Image URL", icon: Link },
];

const CURRENCY_CODES = [
  "USD",
  "EUR",
  "GBP",
  "PKR",
  "INR",
  "AED",
  "JPY",
  "CAD",
  "AUD",
];

export default function ColumnHeaderMenu({
  column,
  onChangeType,
  onDelete,
  onRename,
  onSetWidth,
  onToggleTextWrap,
  textWrapEnabled,
  columnFormula,
  onApplyColumnFormula,
  onRemoveColumnFormula,
  selectOptions,
  onUpdateSelectOptions,
  onInsertLeft,
  onInsertRight,
  onDuplicate,
  onClearColumn,
  onSortAsc,
  onSortDesc,
  onSetCurrency,
}: ColumnHeaderMenuProps) {
  const [renameValue, setRenameValue] = useState(column.name);
  const [open, setOpen] = useState(false);
  const [colFormulaValue, setColFormulaValue] = useState(columnFormula || "");
  const [newOptionValue, setNewOptionValue] = useState("");
  const [widthValue, setWidthValue] = useState(String(column.width ?? 160));

  const handleRenameSubmit = () => {
    if (renameValue.trim() && onRename) {
      onRename(renameValue.trim());
    }
  };

  return (
    <DropdownMenu
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) setColFormulaValue(columnFormula || "");
        if (v) setWidthValue(String(column.width ?? 160));
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 opacity-0 group-hover/header:opacity-100 transition-opacity"
        >
          <MoreVertical className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        className="w-64 rounded-xl border border-border/70 shadow-xl p-1.5"
      >
        {/* ── Rename section ── */}
        {onRename && (
          <>
            <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase tracking-wider pb-1 px-2">
              Column Name
            </DropdownMenuLabel>
            <div className="px-2 pb-2">
              <input
                className="w-full h-8 px-2.5 text-xs rounded-md border border-border bg-background text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={() => handleRenameSubmit()}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleRenameSubmit();
                    setOpen(false);
                  }
                  if (e.key === "Escape") {
                    setRenameValue(column.name);
                  }
                  e.stopPropagation();
                }}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <DropdownMenuSeparator />
          </>
        )}

        {/* ── Change type submenu ── */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="text-xs">
            Change Column Type
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {COLUMN_TYPES.map(({ type, label, icon: Icon }) => (
              <DropdownMenuItem
                key={type}
                onClick={() => onChangeType(type)}
                className="text-xs gap-2"
              >
                <Icon className="h-3 w-3" />
                {label}
                {column.type === type && (
                  <span className="ml-auto text-primary">✓</span>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {/* ── Column width (mobile-friendly) ── */}
        {onSetWidth && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase tracking-wider pb-1 px-2">
              Column width
            </DropdownMenuLabel>
            <div className="px-2 pb-2">
              <input
                className="w-full h-8 px-2.5 text-xs rounded-md border border-border bg-background text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                value={widthValue}
                inputMode="numeric"
                onChange={(e) =>
                  setWidthValue(e.target.value.replace(/[^\d]/g, ""))
                }
                onBlur={() => {
                  const w = Math.max(
                    60,
                    Math.min(800, Number(widthValue || 0)),
                  );
                  if (!isNaN(w)) onSetWidth(w);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const w = Math.max(
                      60,
                      Math.min(800, Number(widthValue || 0)),
                    );
                    if (!isNaN(w)) onSetWidth(w);
                    setOpen(false);
                  }
                  e.stopPropagation();
                }}
                onClick={(e) => e.stopPropagation()}
                placeholder="160"
              />
            </div>
          </>
        )}

        {column.type === "currency" && onSetCurrency && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="text-xs gap-2">
                <BadgeDollarSign className="h-3 w-3" />
                Currency ({column.currencyCode || "USD"})
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {CURRENCY_CODES.map((code) => (
                  <DropdownMenuItem
                    key={code}
                    onClick={() => onSetCurrency(code)}
                    className="text-xs gap-2"
                  >
                    {code}
                    {(column.currencyCode || "USD") === code && (
                      <span className="ml-auto text-primary">✓</span>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </>
        )}

        {/* ── Quick actions ── */}
        {(onInsertLeft ||
          onInsertRight ||
          onDuplicate ||
          onClearColumn ||
          onSortAsc ||
          onSortDesc) && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase tracking-wider pb-1 px-2">
              Quick actions
            </DropdownMenuLabel>
            {onInsertLeft && (
              <DropdownMenuItem
                onClick={onInsertLeft}
                className="text-xs gap-2"
              >
                <Plus className="h-3 w-3" />
                Insert column left
              </DropdownMenuItem>
            )}
            {onInsertRight && (
              <DropdownMenuItem
                onClick={onInsertRight}
                className="text-xs gap-2"
              >
                <Plus className="h-3 w-3" />
                Insert column right
              </DropdownMenuItem>
            )}
            {onDuplicate && (
              <DropdownMenuItem onClick={onDuplicate} className="text-xs gap-2">
                <Copy className="h-3 w-3" />
                Duplicate column
              </DropdownMenuItem>
            )}
            {(onSortAsc || onSortDesc) && (
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="text-xs">
                  Sort
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {onSortAsc && (
                    <DropdownMenuItem
                      onClick={onSortAsc}
                      className="text-xs gap-2"
                    >
                      A → Z
                    </DropdownMenuItem>
                  )}
                  {onSortDesc && (
                    <DropdownMenuItem
                      onClick={onSortDesc}
                      className="text-xs gap-2"
                    >
                      Z → A
                    </DropdownMenuItem>
                  )}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            )}
            {onClearColumn && (
              <DropdownMenuItem
                onClick={onClearColumn}
                className="text-xs gap-2 text-amber-700 focus:text-amber-700"
              >
                <Trash2 className="h-3 w-3" />
                Clear column values
              </DropdownMenuItem>
            )}
          </>
        )}

        {/* ── Column Formula ── */}
        {onApplyColumnFormula && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase tracking-wider pb-1 px-2 flex items-center gap-1">
              <Sigma className="h-3 w-3" /> Column Formula
            </DropdownMenuLabel>
            <div className="px-2 pb-2 flex items-center gap-1.5">
              <input
                className="flex-1 h-8 px-2.5 text-xs font-mono rounded-md border border-border bg-background text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                value={colFormulaValue}
                onChange={(e) => setColFormulaValue(e.target.value)}
                placeholder="=UPPER(name)"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && colFormulaValue.startsWith("=")) {
                    onApplyColumnFormula(colFormulaValue);
                    setOpen(false);
                  }
                  e.stopPropagation();
                }}
                onClick={(e) => e.stopPropagation()}
              />
              <button
                className="h-7 w-7 flex items-center justify-center rounded bg-primary text-white hover:opacity-90 shrink-0 disabled:opacity-40"
                disabled={!colFormulaValue.startsWith("=")}
                onClick={() => {
                  if (colFormulaValue.startsWith("=")) {
                    onApplyColumnFormula(colFormulaValue);
                    setOpen(false);
                  }
                }}
              >
                <Check className="h-3 w-3" />
              </button>
            </div>
            {columnFormula && onRemoveColumnFormula && (
              <div className="px-2 pb-2">
                <button
                  className="w-full h-6 flex items-center justify-center gap-1 text-[10px] text-red-500 hover:bg-red-50 rounded transition-colors"
                  onClick={() => {
                    onRemoveColumnFormula();
                    setColFormulaValue("");
                    setOpen(false);
                  }}
                >
                  <X className="h-3 w-3" /> Remove column formula
                </button>
              </div>
            )}
          </>
        )}

        {/* ── Select Options Management ── */}
        {column.type === "select" && onUpdateSelectOptions && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase tracking-wider pb-1 px-2 flex items-center gap-1">
              <ListChecks className="h-3 w-3" /> Select Options
            </DropdownMenuLabel>
            <div className="px-2 pb-1 space-y-1 max-h-32 overflow-y-auto">
              {(selectOptions ?? []).map((opt, i) => (
                <div key={i} className="flex items-center gap-1">
                  <span className="flex-1 text-[11px] truncate px-1.5 py-0.5 rounded bg-muted/50 border border-border">
                    {opt}
                  </span>
                  <button
                    className="h-5 w-5 flex items-center justify-center rounded hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateSelectOptions(
                        (selectOptions ?? []).filter((_, idx) => idx !== i),
                      );
                    }}
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="px-2 pb-2 flex items-center gap-1.5">
              <input
                className="flex-1 h-8 px-2.5 text-xs rounded-md border border-border bg-background text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                value={newOptionValue}
                onChange={(e) => setNewOptionValue(e.target.value)}
                placeholder="Add option…"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newOptionValue.trim()) {
                    onUpdateSelectOptions([
                      ...(selectOptions ?? []),
                      newOptionValue.trim(),
                    ]);
                    setNewOptionValue("");
                  }
                  e.stopPropagation();
                }}
                onClick={(e) => e.stopPropagation()}
              />
              <button
                className="h-7 w-7 flex items-center justify-center rounded bg-primary text-white hover:opacity-90 shrink-0 disabled:opacity-40"
                disabled={!newOptionValue.trim()}
                onClick={(e) => {
                  e.stopPropagation();
                  if (newOptionValue.trim()) {
                    onUpdateSelectOptions([
                      ...(selectOptions ?? []),
                      newOptionValue.trim(),
                    ]);
                    setNewOptionValue("");
                  }
                }}
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          </>
        )}

        {/* ── Text wrap toggle ── */}
        {onToggleTextWrap && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onToggleTextWrap}
              className="text-xs gap-2"
            >
              <WrapText className="h-3 w-3" />
              {textWrapEnabled ? "Disable" : "Enable"} Text Wrap
              {textWrapEnabled && (
                <span className="ml-auto text-primary">✓</span>
              )}
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator />

        {/* ── Delete ── */}
        <DropdownMenuItem
          onClick={onDelete}
          className="text-xs text-destructive focus:text-destructive gap-2"
        >
          <Trash2 className="h-3 w-3" />
          Delete Column
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
