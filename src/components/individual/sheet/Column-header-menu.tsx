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
} from "lucide-react";
import { ColumnDef } from "@/types";

interface ColumnHeaderMenuProps {
  column: ColumnDef;
  onChangeType: (type: ColumnDef["type"]) => void;
  onDelete: () => void;
  onRename?: (newName: string) => void;
  onToggleTextWrap?: () => void;
  textWrapEnabled?: boolean;
  columnFormula?: string;
  onApplyColumnFormula?: (formula: string) => void;
  onRemoveColumnFormula?: () => void;
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
];

export default function ColumnHeaderMenu({
  column,
  onChangeType,
  onDelete,
  onRename,
  onToggleTextWrap,
  textWrapEnabled,
  columnFormula,
  onApplyColumnFormula,
  onRemoveColumnFormula,
}: ColumnHeaderMenuProps) {
  const [renameValue, setRenameValue] = useState(column.name);
  const [open, setOpen] = useState(false);
  const [colFormulaValue, setColFormulaValue] = useState(columnFormula || "");

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

      <DropdownMenuContent align="start" className="w-52">
        {/* ── Rename section ── */}
        {onRename && (
          <>
            <DropdownMenuLabel className="text-[10px] text-gray-400 uppercase tracking-wider pb-1">
              Column Name
            </DropdownMenuLabel>
            <div className="px-2 pb-2 flex items-center gap-1.5">
              <input
                className="flex-1 h-7 px-2 text-xs rounded border border-gray-200 bg-gray-50 outline-none focus:border-primary focus:bg-white"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
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
              <button
                className="h-7 w-7 flex items-center justify-center rounded bg-primary text-white hover:opacity-90 shrink-0"
                onClick={() => {
                  handleRenameSubmit();
                  setOpen(false);
                }}
              >
                <Check className="h-3 w-3" />
              </button>
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

        {/* ── Column Formula ── */}
        {onApplyColumnFormula && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-[10px] text-gray-400 uppercase tracking-wider pb-1 flex items-center gap-1">
              <Sigma className="h-3 w-3" /> Column Formula
            </DropdownMenuLabel>
            <div className="px-2 pb-2 flex items-center gap-1.5">
              <input
                className="flex-1 h-7 px-2 text-xs font-mono rounded border border-gray-200 bg-gray-50 outline-none focus:border-primary focus:bg-white"
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
