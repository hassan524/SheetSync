"use client";

import { FileText, Clock, Folder, Building2, Star } from "lucide-react";
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Edit3, Share2, Download, Trash2, StarOff } from "lucide-react";
import { timeAgo } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { updateSheetStarred } from "@/lib/querys/sheet/sheet";
import { toast } from "sonner";

export interface StarredSheetRow {
  id: string;
  title: string;
  templateId?: string;
  lastEdited: string;
  createdAt?: string;
  isOrganization: boolean;
  organization?: { id: string; name: string; membersCount: number } | null;
  folder?: { id: string; name: string } | null;
  rowsCount?: number;
  colsCount?: number;
  isStarred?: boolean;
}

export const starredColumns = [
  {
    key: "title",
    header: "Sheet Name",
    render: (s: StarredSheetRow) => (
      <div className="flex items-center gap-3">
        <div className="h-7 w-7 rounded-lg border bg-card flex items-center justify-center shadow-sm shrink-0">
          <FileText className="h-3.5 w-3.5 text-primary/60" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium truncate max-w-[200px] block">
              {s.title}
            </span>
            <Star className="h-3 w-3 text-amber-400 fill-amber-400 shrink-0" />
          </div>
        </div>
      </div>
    ),
  },

  {
    key: "context",
    header: "Context",
    width: "180px",
    render: (s: StarredSheetRow) => {
      if (s.isOrganization && s.organization) {
        return (
          <Badge
            variant="outline"
            className="font-normal text-xs gap-1 py-0 px-2 h-5"
          >
            <Building2 className="h-3 w-3 text-muted-foreground" />
            <span className="truncate max-w-[120px]">
              {s.organization.name}
            </span>
          </Badge>
        );
      }
      if (s.folder) {
        return (
          <Badge
            variant="outline"
            className="font-normal text-xs gap-1 py-0 px-2 h-5 bg-primary/5 border-primary/10"
          >
            <Folder className="h-3 w-3 text-primary/60" />
            <span className="truncate max-w-[120px]">{s.folder.name}</span>
          </Badge>
        );
      }
      return <span className="text-xs text-muted-foreground">Personal</span>;
    },
  },

  {
    key: "last_modified",
    header: "Last Modified",
    width: "160px",
    render: (s: StarredSheetRow) => (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Clock className="h-3 w-3" />
        <span>{s.lastEdited ? timeAgo(s.lastEdited) : "—"}</span>
      </div>
    ),
  },

  {
    key: "rows",
    header: "Rows",
    width: "90px",
    render: (s: StarredSheetRow) => (
      <span className="text-xs text-muted-foreground">
        {s.rowsCount ?? "—"}
      </span>
    ),
  },

  {
    key: "columns",
    header: "Columns",
    width: "90px",
    render: (s: StarredSheetRow) => (
      <span className="text-xs text-muted-foreground">
        {s.colsCount ?? "—"}
      </span>
    ),
  },
];

export function StarredAction({
  onUnstar,
}: {
  onUnstar?: (id: string) => void;
}) {
  return {
    render: (s: StarredSheetRow) => (
      <StarredActionMenu sheet={s} onUnstar={onUnstar} />
    ),
  };
}

function StarredActionMenu({
  sheet,
  onUnstar,
}: {
  sheet: StarredSheetRow;
  onUnstar?: (id: string) => void;
}) {
  const router = useRouter();

  return (
    <>
      <DropdownMenuItem
        className="text-xs gap-2"
        onClick={() => router.push(`/sheet/${sheet.id}`)}
      >
        <Edit3 className="h-3.5 w-3.5" /> Open & Edit
      </DropdownMenuItem>
      <DropdownMenuItem className="text-xs gap-2">
        <Share2 className="h-3.5 w-3.5" /> Share
      </DropdownMenuItem>
      <DropdownMenuItem className="text-xs gap-2">
        <Download className="h-3.5 w-3.5" /> Download
      </DropdownMenuItem>
      <DropdownMenuItem
        className="text-xs gap-2"
        onClick={async () => {
          try {
            await updateSheetStarred(sheet.id, false);
            onUnstar?.(sheet.id);
            toast.success("Removed from starred");
          } catch {
            toast.error("Failed to unstar");
          }
        }}
      >
        <StarOff className="h-3.5 w-3.5" /> Unstar
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem className="text-xs gap-2 text-red-600 focus:text-red-600">
        <Trash2 className="h-3.5 w-3.5" /> Delete
      </DropdownMenuItem>
    </>
  );
}

export function NoStarredSheetsIcon() {
  return (
    <svg
      width="72"
      height="72"
      viewBox="0 0 72 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="10"
        y="8"
        width="52"
        height="56"
        rx="7"
        fill="currentColor"
        className="text-muted/30"
      />
      <rect
        x="10"
        y="8"
        width="52"
        height="56"
        rx="7"
        stroke="currentColor"
        strokeWidth="1.5"
        className="text-border"
      />
      <path
        d="M36 22l3.5 7 7.5 1.1-5.5 5.3L42.8 43 36 39.2 29.2 43l1.3-7.6L25 30.1l7.5-1.1L36 22z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.2"
        className="text-amber-400/50 fill-amber-400/30"
      />
    </svg>
  );
}
