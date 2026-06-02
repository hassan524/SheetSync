"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
  Check,
  BarChart2,
  ListChecks,
  Plus,
  Copy,
  BadgeDollarSign,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { CellFormat, ColumnDef, SelectOption } from "@/types";

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
  { type: "text" as const,     label: "Text",     icon: Type },
  { type: "number" as const,   label: "Number",   icon: Hash },
  { type: "currency" as const, label: "Currency", icon: DollarSign },
  { type: "date" as const,     label: "Date",     icon: Calendar },
  { type: "checkbox" as const, label: "Checkbox", icon: CheckSquare },
  { type: "url" as const,      label: "URL",      icon: Link },
  { type: "priority" as const, label: "Priority", icon: AlertCircle },
  { type: "status" as const,   label: "Status",   icon: AlertCircle },
  { type: "select" as const,   label: "Select",   icon: ListChecks },
  { type: "progress" as const, label: "Progress", icon: BarChart2 },
  { type: "image" as const,    label: "Image",    icon: Link },
];

const CURRENCY_CODES = [
  "USD","EUR","GBP","PKR","INR","AED","JPY","CAD","AUD","CHF","CNY","HKD",
  "NZD","SEK","KRW","SGD","NOK","MXN","RUB","ZAR","BRL","TRY","TWD","DKK",
  "PLN","THB","IDR","HUF","CZK","ILS","CLP","PHP","MYR","COP","SAR","RON",
  "VND","EGP","NGN","BDT","KES","GHS","TZS","UGX","MAD",
].sort();

// Shared class for all clickable rows — consistent hover + cursor
const ROW_CLS =
  "cursor-pointer w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded-md " +
  "hover:bg-accent hover:text-accent-foreground active:bg-accent/80 transition-colors select-none";

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
  const [renameValue, setRenameValue]       = useState(column.name);
  const [open, setOpen]                     = useState(false);
  const [typeExpanded, setTypeExpanded]     = useState(false);
  const [currencyExpanded, setCurrencyExpanded] = useState(false);
  const [currencySearch, setCurrencySearch] = useState("");

  const filteredCurrencies = CURRENCY_CODES.filter((c) =>
    c.toLowerCase().includes(currencySearch.toLowerCase()),
  );
  const canSortColumn = column.type !== "image";

  const handleRenameSubmit = () => {
    if (renameValue.trim() && onRename) onRename(renameValue.trim());
  };

  const handleOpenChange = (v: boolean) => {
    setOpen(v);
    if (!v) { setTypeExpanded(false); setCurrencyExpanded(false); }
    if (v)  { setCurrencySearch(""); }
  };

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
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
        className="sheet-scrollbar w-56 z-[130] rounded-xl border border-border/70 shadow-xl p-1.5 overflow-y-auto overscroll-contain"
        style={{
          maxHeight:
            "min(var(--radix-dropdown-menu-content-available-height), calc(100vh - 7rem), 28rem)",
        }}
      >
        {/* ── Rename ── */}
        {onRename && (
          <>
            <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase tracking-wider pb-1 px-2">
              Column Name
            </DropdownMenuLabel>
            <div className="px-1.5 pb-2">
              <input
                className="w-full h-8 px-2.5 text-xs rounded-md border border-border bg-background text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={handleRenameSubmit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { handleRenameSubmit(); setOpen(false); }
                  if (e.key === "Escape") setRenameValue(column.name);
                  e.stopPropagation();
                }}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <DropdownMenuSeparator />
          </>
        )}

        {/* ── Change Type — inline accordion ── */}
        <button
          className={ROW_CLS}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setTypeExpanded((v) => !v);
            setCurrencyExpanded(false);
          }}
        >
          <Type className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="font-medium">Change type</span>
          <span className="ml-auto text-muted-foreground capitalize text-[11px] mr-1">
            {column.type ?? "text"}
          </span>
          {typeExpanded
            ? <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
            : <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />}
        </button>

        {typeExpanded && (
          <div className="mt-0.5 mb-1 ml-3 border-l-2 border-border/40 pl-2 flex flex-col gap-0.5">
            {COLUMN_TYPES.map(({ type, label, icon: Icon }) => {
              const active = column.type === type;
              return (
                <button
                  key={type}
                  className={
                    ROW_CLS +
                    (active ? " text-primary font-medium bg-primary/5" : "")
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpen(false);
                    setTypeExpanded(false);
                    setTimeout(() => onChangeType(type), 0);
                  }}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  {label}
                  {active && <Check className="ml-auto h-3 w-3" />}
                </button>
              );
            })}
          </div>
        )}

        {/* ── Currency picker — inline accordion ── */}
        {column.type === "currency" && onSetCurrency && (
          <>
            <DropdownMenuSeparator />
            <button
              className={ROW_CLS}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setCurrencyExpanded((v) => !v);
                setTypeExpanded(false);
              }}
            >
              <BadgeDollarSign className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="font-medium">Currency</span>
              <span className="ml-auto text-muted-foreground text-[11px] mr-1">
                {column.currencyCode || "USD"}
              </span>
              {currencyExpanded
                ? <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
                : <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />}
            </button>

            {currencyExpanded && (
              <div className="mt-0.5 mb-1 ml-3 border-l-2 border-border/40 pl-2">
                <div className="pb-1.5">
                  <input
                    className="w-full h-7 px-2.5 text-xs rounded-md border border-border bg-background text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="Search…"
                    value={currencySearch}
                    onChange={(e) => setCurrencySearch(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  />
                </div>
                <div className="sheet-scrollbar overflow-y-auto overscroll-contain max-h-36 flex flex-col gap-0.5">
                  {filteredCurrencies.length === 0 ? (
                    <p className="py-2 text-center text-xs text-muted-foreground">
                      No results
                    </p>
                  ) : (
                    filteredCurrencies.map((code) => {
                      const active = (column.currencyCode || "USD") === code;
                      return (
                        <button
                          key={code}
                          className={
                            ROW_CLS +
                            (active ? " text-primary font-medium bg-primary/5" : "")
                          }
                          onClick={(e) => {
                            e.stopPropagation();
                            onSetCurrency(code);
                            setOpen(false);
                          }}
                        >
                          {code}
                          {active && <Check className="ml-auto h-3 w-3" />}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Quick actions ── */}
        {(onInsertLeft || onInsertRight || onDuplicate || onClearColumn ||
          (canSortColumn && (onSortAsc || onSortDesc))) && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase tracking-wider pb-1 px-2">
              Quick actions
            </DropdownMenuLabel>
            {onInsertLeft && (
              <DropdownMenuItem onClick={onInsertLeft} className="cursor-pointer text-xs gap-2">
                <Plus className="h-3.5 w-3.5" />Insert column left
              </DropdownMenuItem>
            )}
            {onInsertRight && (
              <DropdownMenuItem onClick={onInsertRight} className="cursor-pointer text-xs gap-2">
                <Plus className="h-3.5 w-3.5" />Insert column right
              </DropdownMenuItem>
            )}
            {onDuplicate && (
              <DropdownMenuItem onClick={onDuplicate} className="cursor-pointer text-xs gap-2">
                <Copy className="h-3.5 w-3.5" />Duplicate column
              </DropdownMenuItem>
            )}
            {canSortColumn && onSortAsc && (
              <DropdownMenuItem onClick={onSortAsc} className="cursor-pointer text-xs gap-2">
                Sort A → Z
              </DropdownMenuItem>
            )}
            {canSortColumn && onSortDesc && (
              <DropdownMenuItem onClick={onSortDesc} className="cursor-pointer text-xs gap-2">
                Sort Z → A
              </DropdownMenuItem>
            )}
            {onFillColumnNumbers && (
              <DropdownMenuItem onClick={onFillColumnNumbers} className="cursor-pointer text-xs gap-2">
                <Hash className="h-3.5 w-3.5" />Fill sequential numbers
              </DropdownMenuItem>
            )}
            {onFillColumnHashNumbers && (
              <DropdownMenuItem onClick={onFillColumnHashNumbers} className="cursor-pointer text-xs gap-2">
                <Hash className="h-3.5 w-3.5" />Fill #1, #2, #3…
              </DropdownMenuItem>
            )}
            {onClearColumn && (
              <DropdownMenuItem
                onClick={onClearColumn}
                className="cursor-pointer text-xs gap-2 text-amber-700 focus:text-amber-700"
              >
                <Trash2 className="h-3.5 w-3.5" />Clear column values
              </DropdownMenuItem>
            )}
          </>
        )}

        {/* ── Select options ── */}
        {column.type === "select" && onOpenColumnPanel && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-xs gap-2"
              onClick={() => { onOpenColumnPanel(); setOpen(false); }}
            >
              <ListChecks className="h-3.5 w-3.5" />
              Edit select options
              {selectOptions?.length ? (
                <span className="ml-auto text-muted-foreground">{selectOptions.length}</span>
              ) : null}
            </DropdownMenuItem>
          </>
        )}

        {/* ── Freeze ── */}
        {onToggleFreeze && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer text-xs gap-2" onClick={onToggleFreeze}>
              {column.frozen ? "Unfreeze column" : "Freeze column"}
              {column.frozen && <span className="ml-auto text-primary">✓</span>}
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator />

        {/* ── Delete ── */}
        <DropdownMenuItem
          onClick={onDelete}
          className="cursor-pointer text-xs text-destructive focus:text-destructive gap-2"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete Column
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}