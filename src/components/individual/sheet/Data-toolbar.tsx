// components/sheet/DataToolbar.tsx
"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Trash2,
  Calculator,
  Filter,
  ArrowUpDown,
  Undo2,
  Redo2,
  ChevronDown,
} from "lucide-react";
import { ColumnDef } from "@/types/sheet.types";

interface DataToolbarProps {
  onInsertRow: () => void;
  onDeleteRow: () => void;
  onInsertColumn: (type: ColumnDef["type"]) => void;
  onDeleteColumn: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  selectedRowCount: number;
}

export default function DataToolbar({
  onInsertRow,
  onDeleteRow,
  onInsertColumn,
  onDeleteColumn,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  selectedRowCount,
}: DataToolbarProps) {
  const columnTypes: { type: ColumnDef["type"]; label: string }[] = [
    { type: "text", label: "Text" },
    { type: "number", label: "Number" },
    { type: "currency", label: "Currency" },
    { type: "date", label: "Date" },
    { type: "checkbox", label: "Checkbox" },
    { type: "priority", label: "Priority" },
    { type: "status", label: "Status" },
    { type: "url", label: "URL" },
  ];

  return (
    <div className="flex items-center gap-1">
      {/* Undo/Redo */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onUndo}
            disabled={!canUndo}
          >
            <Undo2 className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onRedo}
            disabled={!canRedo}
          >
            <Redo2 className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Redo (Ctrl+Y)</TooltipContent>
      </Tooltip>

      <div className="w-px h-6 bg-border" />

      {/* Insert Row */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 px-2.5"
            onClick={onInsertRow}
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="text-xs">Row</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Insert Row</TooltipContent>
      </Tooltip>

      {/* Insert Column with Type */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 gap-1 px-2.5">
            <Plus className="h-3.5 w-3.5" />
            <span className="text-xs">Column</span>
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-48 p-2" align="start">
          <div className="space-y-1">
            <div className="px-2 py-1 text-[11px] font-medium text-muted-foreground">
              Column Type
            </div>
            {columnTypes.map(({ type, label }) => (
              <Button
                key={type}
                variant="ghost"
                size="sm"
                className="w-full justify-start h-8 text-xs"
                onClick={() => onInsertColumn(type)}
              >
                {label}
              </Button>
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="w-px h-6 bg-border" />

      {/* Delete Row */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 px-2.5 text-destructive hover:text-destructive"
            onClick={onDeleteRow}
            disabled={selectedRowCount === 0}
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="text-xs">
              Delete {selectedRowCount > 0 ? `(${selectedRowCount})` : "Row"}
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Delete Selected Rows</TooltipContent>
      </Tooltip>

      {/* Delete Column */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 px-2.5 text-destructive hover:text-destructive"
            onClick={onDeleteColumn}
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="text-xs">Delete Column</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Delete Selected Column</TooltipContent>
      </Tooltip>

      <div className="w-px h-6 bg-border" />

      {/* Additional Features */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Calculator className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Formulas (Coming Soon)</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Filter className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Filter (Coming Soon)</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowUpDown className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Sort (Coming Soon)</TooltipContent>
      </Tooltip>
    </div>
  );
}
