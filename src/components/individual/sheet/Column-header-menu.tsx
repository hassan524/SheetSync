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
  Bold,
  Italic,
  Minus,
} from "lucide-react";
import { CellFormat, ColumnDef } from "@/types";

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
  onApplyColumnFormat?: (format: Partial<CellFormat>) => void;
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
  { type: "select" as const, label: "Dropdown", icon: ListChecks },
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
  "CHF",
  "CNY",
  "HKD",
  "NZD",
  "SEK",
  "KRW",
  "SGD",
  "NOK",
  "MXN",
  "RUB",
  "ZAR",
  "BRL",
  "TRY",
  "TWD",
  "DKK",
  "PLN",
  "THB",
  "IDR",
  "HUF",
  "CZK",
  "ILS",
  "CLP",
  "PHP",
  "MYR",
  "COP",
  "SAR",
  "RON",
  "VND",
  "EGP",
  "NGN",
  "BDT",
  "KES",
  "GHS",
  "TZS",
  "UGX",
  "MAD",
].sort();

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
  onApplyColumnFormat,
}: ColumnHeaderMenuProps) {
  const [renameValue, setRenameValue] = useState(column.name);
  const [open, setOpen] = useState(false);
  const [colFormulaValue, setColFormulaValue] = useState(columnFormula || "");
  const [newOptionValue, setNewOptionValue] = useState("");
  const [widthValue, setWidthValue] = useState(String(column.width ?? 160));
  const [currencySearch, setCurrencySearch] = useState("");

  const filteredCurrencies = CURRENCY_CODES.filter((c) =>
    c.toLowerCase().includes(currencySearch.toLowerCase()),
  );
  const canSortColumn = column.type !== "image";
  const canUseColumnFormula = !["checkbox", "image", "select"].includes(
    column.type || "text",
  );
  const columnFormat = column.conditional_formatting?.columnFormat ?? {};

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
        if (v) {
          setColFormulaValue(columnFormula || "");
          setWidthValue(String(column.width ?? 160));
          setCurrencySearch("");
        }
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 opacity-100 sm:opacity-0 sm:group-hover/header:opacity-100 transition-opacity"
        >
          <MoreVertical className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        collisionPadding={10}
        className="sheet-scrollbar w-64 z-[130] rounded-xl border border-border/70 shadow-xl p-1.5 overflow-y-auto overscroll-contain"
        style={{
          maxHeight:
            "min(var(--radix-dropdown-menu-content-available-height), calc(100vh - 7rem), 26rem)",
        }}
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
          <DropdownMenuSubContent collisionPadding={10}>
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
        {/* Column width */}
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
              <DropdownMenuSubContent collisionPadding={10} className="w-48">
                <div className="p-1.5">
                  <input
                    className="w-full h-8 px-2.5 text-xs rounded-md border border-border bg-background text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="Search currency..."
                    value={currencySearch}
                    onChange={(e) => setCurrencySearch(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  />
                </div>
                <div
                  className="sheet-scrollbar overflow-y-auto overscroll-contain"
                  style={{
                    maxHeight:
                      "min(var(--radix-dropdown-menu-content-available-height), 18rem)",
                  }}
                >
                  {filteredCurrencies.length === 0 ? (
                    <div className="p-2 text-center text-xs text-muted-foreground">
                      No currency found
                    </div>
                  ) : (
                    filteredCurrencies.map((code) => (
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
                    ))
                  )}
                </div>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </>
        )}

        {/* ── Quick actions ── */}
        {(onInsertLeft ||
          onInsertRight ||
          onDuplicate ||
          onClearColumn ||
          (canSortColumn && (onSortAsc || onSortDesc))) && (
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
            {canSortColumn && onSortAsc && (
              <DropdownMenuItem onClick={onSortAsc} className="text-xs gap-2">
                Sort A → Z
              </DropdownMenuItem>
            )}
            {canSortColumn && onSortDesc && (
              <DropdownMenuItem onClick={onSortDesc} className="text-xs gap-2">
                Sort Z → A
              </DropdownMenuItem>
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

        {onApplyColumnFormat && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase tracking-wider pb-1 px-2">
              Edit column
            </DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => onApplyColumnFormat({ bold: !columnFormat.bold })}
              className="text-xs gap-2"
            >
              <Bold className="h-3 w-3" />
              Bold column
              {columnFormat.bold && (
                <span className="ml-auto text-primary">✓</span>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                onApplyColumnFormat({ italic: !columnFormat.italic })
              }
              className="text-xs gap-2"
            >
              <Italic className="h-3 w-3" />
              Italic column
              {columnFormat.italic && (
                <span className="ml-auto text-primary">On</span>
              )}
            </DropdownMenuItem>
            <div className="px-2 py-2 space-y-2">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  className="h-8 w-8 rounded-md border border-border hover:bg-muted flex items-center justify-center"
                  onClick={(e) => {
                    e.stopPropagation();
                    onApplyColumnFormat({
                      fontSize: Math.max(8, (columnFormat.fontSize ?? 12) - 1),
                    });
                  }}
                >
                  <Minus className="h-3 w-3" />
                </button>
                <input
                  className="h-8 flex-1 min-w-0 rounded-md border border-border bg-background px-2 text-xs text-center outline-none focus:ring-2 focus:ring-primary/30"
                  value={columnFormat.fontSize ?? 12}
                  inputMode="numeric"
                  onChange={(e) => {
                    const value = Number(e.target.value.replace(/[^\d]/g, ""));
                    if (!Number.isNaN(value)) {
                      onApplyColumnFormat({
                        fontSize: Math.max(8, Math.min(72, value)),
                      });
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                />
                <button
                  type="button"
                  className="h-8 w-8 rounded-md border border-border hover:bg-muted flex items-center justify-center"
                  onClick={(e) => {
                    e.stopPropagation();
                    onApplyColumnFormat({
                      fontSize: Math.min(72, (columnFormat.fontSize ?? 12) + 1),
                    });
                  }}
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className="space-y-1">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    Text
                  </span>
                  <input
                    type="color"
                    className="h-8 w-full rounded border border-border bg-background cursor-pointer"
                    value={columnFormat.textColor ?? "#000000"}
                    onChange={(e) =>
                      onApplyColumnFormat({ textColor: e.target.value })
                    }
                    onClick={(e) => e.stopPropagation()}
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    Fill
                  </span>
                  <input
                    type="color"
                    className="h-8 w-full rounded border border-border bg-background cursor-pointer"
                    value={columnFormat.bgColor ?? "#ffffff"}
                    onChange={(e) =>
                      onApplyColumnFormat({ bgColor: e.target.value })
                    }
                    onClick={(e) => e.stopPropagation()}
                  />
                </label>
              </div>
            </div>
          </>
        )}

        {/* ── Column Formula ── */}
        {canUseColumnFormula && onApplyColumnFormula && (
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

