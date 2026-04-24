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
  Pencil,
  Check,
  BarChart2,
} from "lucide-react";
import { ColumnDef } from "@/types";

interface ColumnHeaderMenuProps {
  column: ColumnDef;
  onChangeType: (type: ColumnDef["type"]) => void;
  onDelete: () => void;
  onRename?: (newName: string) => void;
  onToggleTextWrap?: () => void;
  textWrapEnabled?: boolean;
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
}: ColumnHeaderMenuProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(column.name);
  const [open, setOpen] = useState(false);

  const handleRenameSubmit = () => {
    if (renameValue.trim() && onRename) {
      onRename(renameValue.trim());
    }
    setIsRenaming(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
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
                    setIsRenaming(false);
                    setRenameValue(column.name);
                  }
                  e.stopPropagation(); // prevent grid from catching keystrokes
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
