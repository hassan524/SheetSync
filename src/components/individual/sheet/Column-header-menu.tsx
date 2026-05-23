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
import { CellFormat, ColumnDef, SelectOption } from "@/types";
import { getOptionBgStyle, getSelectOptionLabel } from "@/utils/SheetUtils";

interface ColumnHeaderMenuProps {
  column: ColumnDef;
  onChangeType: (type: ColumnDef["type"]) => void;
  onOpenColumnPanel?: () => void;
  onDelete: () => void;
  onRename?: (newName: string) => void;
  onToggleTextWrap?: () => void;
  textWrapEnabled?: boolean;
  columnFormula?: string;
  onApplyColumnFormula?: (formula: string) => void;
  onRemoveColumnFormula?: () => void;
  selectOptions?: SelectOption[];
  onUpdateSelectOptions?: (options: SelectOption[]) => void;
  onInsertLeft?: () => void;
  onInsertRight?: () => void;
  onDuplicate?: () => void;
  onClearColumn?: () => void;
  onSortAsc?: () => void;
  onSortDesc?: () => void;
  onFillColumnNumbers?: () => void;
  onFillColumnHashNumbers?: () => void;
  onSetCurrency?: (currencyCode: string) => void;
  onApplyColumnFormat?: (format: Partial<CellFormat>) => void;
  onToggleFreeze?: () => void;
  onOpenValidationPanel?: () => void;
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
  { type: "select" as const, label: "Select", icon: ListChecks },
  { type: "progress" as const, label: "Progress", icon: BarChart2 },
  { type: "image" as const, label: "Image", icon: Link },
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
  onOpenColumnPanel,
  onDelete,
  onRename,
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
  onFillColumnNumbers,
  onFillColumnHashNumbers,
  onSetCurrency,
  onApplyColumnFormat,
  onToggleFreeze,
  onOpenValidationPanel,
}: ColumnHeaderMenuProps) {
  const [renameValue, setRenameValue] = useState(column.name);
  const [open, setOpen] = useState(false);
  const [typeMenuOpen, setTypeMenuOpen] = useState(false);
  const [colFormulaValue, setColFormulaValue] = useState(columnFormula || "");
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
        if (!v) setTypeMenuOpen(false);
        if (v) {
          setColFormulaValue(columnFormula || "");
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
        className="sheet-scrollbar w-52 z-[130] rounded-xl border border-border/70 shadow-xl p-1.5 overflow-y-auto overscroll-contain"
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

        <DropdownMenuSub open={typeMenuOpen} onOpenChange={setTypeMenuOpen}>
          <DropdownMenuSubTrigger
            className="text-xs gap-2"
            onPointerEnter={() => setTypeMenuOpen(true)}
            onClick={(event) => {
              event.preventDefault();
              setTypeMenuOpen((value) => !value);
            }}
          >
            <Type className="h-3 w-3" />
            Change type
            <span className="ml-auto text-muted-foreground capitalize">
              {column.type ?? "text"}
            </span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent
            sideOffset={0}
            collisionPadding={10}
            className="sheet-column-type-submenu sheet-mobile-submenu sheet-scrollbar w-44 max-h-72 overflow-y-auto z-[150]"
          >
            {COLUMN_TYPES.map(({ type, label, icon: Icon }) => (
              <DropdownMenuItem
                key={type}
                onClick={() => {
                  onChangeType(type);
                  setOpen(false);
                }}
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



        {column.type === "currency" && onSetCurrency && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="text-xs gap-2">
                <BadgeDollarSign className="h-3 w-3" />
                Currency ({column.currencyCode || "USD"})
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent
                collisionPadding={10}
                className="sheet-mobile-submenu w-48"
              >
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
              <DropdownMenuItem onClick={onInsertLeft} className="text-xs gap-2">
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
            {onFillColumnNumbers && (
              <DropdownMenuItem
                onClick={onFillColumnNumbers}
                className="text-xs gap-2"
              >
                <Hash className="h-3 w-3" />
                Fill sequential numbers
              </DropdownMenuItem>
            )}
            {onFillColumnHashNumbers && (
              <DropdownMenuItem
                onClick={onFillColumnHashNumbers}
                className="text-xs gap-2"
              >
                <Hash className="h-3 w-3" />
                Fill #1, #2, #3...
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

        {column.type === "select" && onOpenColumnPanel && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-xs gap-2"
              onClick={() => {
                onOpenColumnPanel();
                setOpen(false);
              }}
            >
              <ListChecks className="h-3 w-3" />
              Edit select options
              {selectOptions?.length ? (
                <span className="ml-auto text-muted-foreground">
                  {selectOptions.length}
                </span>
              ) : null}
            </DropdownMenuItem>
          </>
        )}

        {onToggleFreeze && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-xs gap-2" onClick={onToggleFreeze}>
              {column.frozen ? "Unfreeze column" : "Freeze column"}
              {column.frozen && <span className="ml-auto text-primary">✓</span>}
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
