// components/sheet/CellContextMenu.tsx
"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Type,
  Hash,
  DollarSign,
  Calendar,
  CheckSquare,
  Link,
  AlertCircle,
} from "lucide-react";
import { ColumnDef } from "@/types/sheet.types";

interface CellContextMenuProps {
  children: React.ReactNode;
  onChangeCellType: (type: ColumnDef["type"]) => void;
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

export default function CellContextMenu({
  children,
  onChangeCellType,
}: CellContextMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-40">
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="text-xs">
            Change Cell Type
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {CELL_TYPES.map(({ type, label, icon: Icon }) => (
              <DropdownMenuItem
                key={type}
                onClick={() => onChangeCellType(type)}
                className="text-xs gap-2"
              >
                <Icon className="h-3 w-3" />
                {label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
