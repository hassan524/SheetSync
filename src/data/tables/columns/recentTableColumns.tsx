"use client";

import { FileText, Clock, Folder, Building2, Users } from "lucide-react";
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Edit3, Trash2, Star, StarOff } from "lucide-react";
import { timeAgo } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

export interface RecentSheetRow {
  id: string;
  title: string;
  templateId?: string;
  lastEdited: string;
  isOrganization: boolean;
  organization?: { id: string; name: string; membersCount: number } | null;
  folder?: { id: string; name: string } | null;
  rowsCount?: number;
  colsCount?: number;
  isStarred?: boolean;
}

export const recentColumns = [
  {
    key: "title",
    header: "Sheet Name",
    render: (s: RecentSheetRow) => (
      <div className="flex items-center gap-3">
        <div className="h-7 w-7 rounded-lg border bg-card flex items-center justify-center shadow-sm shrink-0">
          <FileText className="h-3.5 w-3.5 text-primary/60" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium truncate max-w-[180px] block">
              {s.title}
            </span>
            {s.isStarred && (
              <Star className="h-3 w-3 text-amber-400 fill-amber-400 shrink-0" />
            )}
          </div>
        </div>
      </div>
    ),
  },

  {
    key: "context",
    header: "Owner / Context",
    width: "200px",
    render: (s: RecentSheetRow) => {
      if (s.isOrganization && s.organization) {
        return (
          <div className="flex flex-col gap-0.5">
            <Badge
              variant="outline"
              className="font-normal text-xs gap-1 py-0 px-2 h-5 w-fit"
            >
              <Building2 className="h-3 w-3 text-muted-foreground" />
              <span className="truncate max-w-[120px]">
                {s.organization.name}
              </span>
            </Badge>
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" />
              {s.organization.membersCount}{" "}
              {s.organization.membersCount === 1 ? "member" : "members"}
            </span>
          </div>
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
    key: "last_opened",
    header: "Last Opened",
    width: "140px",
    render: (s: RecentSheetRow) => (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Clock className="h-3 w-3" />
        <span>{s.lastEdited ? timeAgo(s.lastEdited) : "—"}</span>
      </div>
    ),
  },
];

function RecentActionMenu({ sheet }: { sheet: RecentSheetRow }) {
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
        {sheet.isStarred ? (
          <>
            <StarOff className="h-3.5 w-3.5" /> Unstar
          </>
        ) : (
          <>
            <Star className="h-3.5 w-3.5" /> Star
          </>
        )}
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem className="text-xs gap-2 text-red-600 focus:text-red-600">
        <Trash2 className="h-3.5 w-3.5" /> Delete
      </DropdownMenuItem>
    </>
  );
}

export const recentAction = {
  render: (s: RecentSheetRow) => <RecentActionMenu sheet={s} />,
};

export function NoRecentSheetsIcon() {
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
        d="M36 28V44M36 28L28 36M36 28L44 36"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-muted-foreground/60"
      />
    </svg>
  );
}
