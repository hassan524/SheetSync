// components/sheet/CellTypeSelector.tsx
"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Type,
  Hash,
  DollarSign,
  Calendar,
  CheckSquare,
  Link,
  AlertCircle,
  ChevronDown,
} from "lucide-react";
import { ColumnDef } from "@/types/sheet.types";

interface CellTypeSelectorProps {
  currentType: ColumnDef["type"];
  onChangeType: (type: ColumnDef["type"]) => void;
  disabled?: boolean;
}

const CELL_TYPES = [
  { type: "text" as const, label: "Text", icon: Type },
  { type: "number" as const, label: "Number", icon: Hash },
  { type: "currency" as const, label: "Currency", icon: DollarSign },
  { type: "date" as const, label: "Date", icon: Calendar },
  { type: "checkbox" as const, label: "Checkbox", icon: CheckSquare },
  { type: "url" as const, label: "URL", icon: Link },
  { type: "priority" as const, label: "Priority", icon: AlertCircle },
  { type: "status" as const, label: "Status", icon: AlertCircle },
];

export default function CellTypeSelector({
  currentType,
  onChangeType,
  disabled,
}: CellTypeSelectorProps) {
  const current = CELL_TYPES.find((t) => t.type === currentType);
  const Icon = current?.icon || Type;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 px-2.5"
          disabled={disabled}
        >
          <Icon className="h-3.5 w-3.5" />
          <span className="text-xs">{current?.label || "Text"}</span>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-40">
        {CELL_TYPES.map(({ type, label, icon: ItemIcon }) => (
          <DropdownMenuItem
            key={type}
            onClick={() => onChangeType(type)}
            className="text-xs gap-2"
          >
            <ItemIcon className="h-3 w-3" />
            {label}
            {currentType === type && (
              <span className="ml-auto text-primary">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
