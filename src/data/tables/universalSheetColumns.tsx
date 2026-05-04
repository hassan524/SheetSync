"use client";

import { FileText, Clock, Building2, Folder, Star, StarOff } from "lucide-react";
import { DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Edit3, Share2, Download, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { timeAgo } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { updateSheetStarred } from "@/lib/querys/sheet/sheet";
import { toast } from "sonner";

// ── Universal row type ─────────────────────────────────────────────
export interface UniversalSheetRow {
  id: string;
  title: string;
  is_starred?: boolean;
  source?: "personal" | "organization";
  organizationName?: string;
  organizationId?: string;
  folderName?: string;
  owner?: {
    name?: string;
    email?: string;
    initials?: string;
    avatar?: string;
  };
  collaborators?: number;
  lastModified?: string;
  createdAt?: string;
  size?: string;
  rows?: number;
  columns?: number;
  visibility?: "private" | "team" | "public";
  activeEditors?: number;
}

// ── Name column ────────────────────────────────────────────────────
export const colName = {
  key: "title",
  header: "Sheet Name",
  render: (s: UniversalSheetRow) => (
    <div className="flex items-center gap-3 min-w-0">
      <div className="h-7 w-7 rounded-lg border bg-card flex items-center justify-center shadow-sm shrink-0">
        <FileText className="h-3.5 w-3.5 text-primary/60" />
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium truncate max-w-[180px] block">{s.title}</span>
          {s.is_starred && <Star className="h-3 w-3 text-amber-400 fill-amber-400 shrink-0" />}
        </div>
        {(s.activeEditors ?? 0) > 0 && (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-green-600">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
            {s.activeEditors} editing now
          </span>
        )}
      </div>
    </div>
  ),
};

// ── Source column (personal vs org) ───────────────────────────────
export const colSource = {
  key: "source",
  header: "Source",
  width: "160px",
  render: (s: UniversalSheetRow) => {
    if (s.source === "organization" && s.organizationName) {
      return (
        <Badge
          variant="outline"
          className="text-[11px] gap-1 font-normal py-0 px-2 h-5 bg-blue-50 border-blue-200 text-blue-700 max-w-[130px]"
        >
          <Building2 className="h-3 w-3 shrink-0" />
          <span className="truncate">{s.organizationName}</span>
        </Badge>
      );
    }
    if (s.folderName) {
      return (
        <Badge
          variant="outline"
          className="text-[11px] gap-1 font-normal py-0 px-2 h-5 bg-primary/5 border-primary/15 max-w-[130px]"
        >
          <Folder className="h-3 w-3 text-primary/60 shrink-0" />
          <span className="truncate">{s.folderName}</span>
        </Badge>
      );
    }
    return (
      <span className="text-[11px] text-muted-foreground bg-muted rounded-full px-2 py-0.5 font-medium">
        Personal
      </span>
    );
  },
};

// ── Owner column ───────────────────────────────────────────────────
export const colOwner = {
  key: "owner",
  header: "Owner",
  width: "150px",
  render: (s: UniversalSheetRow) => (
    <div className="flex items-center gap-2">
      <Avatar className="h-6 w-6 shrink-0">
        {s.owner?.avatar ? (
          <AvatarImage src={s.owner.avatar} />
        ) : (
          <AvatarFallback className="text-[9px] font-semibold bg-primary/10 text-primary">
            {s.owner?.initials ?? "ME"}
          </AvatarFallback>
        )}
      </Avatar>
      <div className="min-w-0">
        <p className="text-xs text-foreground truncate font-medium">{s.owner?.name ?? "You"}</p>
        {s.owner?.email && (
          <p className="text-[10px] text-muted-foreground truncate">{s.owner.email}</p>
        )}
      </div>
    </div>
  ),
};

// ── Collaborators column ───────────────────────────────────────────
export const colCollaborators = {
  key: "collaborators",
  header: "Shared",
  width: "100px",
  render: (s: UniversalSheetRow) => {
    const count = s.collaborators ?? 0;
    if (count === 0)
      return <span className="text-xs text-muted-foreground">Only you</span>;
    return (
      <div className="flex items-center gap-1.5">
        <div className="flex shrink-0">
          {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
            <div
              key={i}
              className="h-5 w-5 rounded-full bg-muted border-2 border-background"
              style={{ marginLeft: i ? -5 : 0 }}
            />
          ))}
        </div>
        <span className="text-xs text-muted-foreground">{count}</span>
      </div>
    );
  },
};

// ── Last modified column ───────────────────────────────────────────
export const colLastModified = {
  key: "last_modified",
  header: "Last Modified",
  width: "130px",
  render: (s: UniversalSheetRow) => (
    <div className="flex items-center gap-1 text-xs text-muted-foreground">
      <Clock className="h-3 w-3 shrink-0" />
      <span>{s.lastModified ? timeAgo(s.lastModified) : "—"}</span>
    </div>
  ),
};

// ── Created column ─────────────────────────────────────────────────
export const colCreated = {
  key: "created_at",
  header: "Created",
  width: "120px",
  render: (s: UniversalSheetRow) => (
    <span className="text-xs text-muted-foreground">
      {s.createdAt ? timeAgo(s.createdAt) : "—"}
    </span>
  ),
};

// ── Rows column ────────────────────────────────────────────────────
export const colRows = {
  key: "rows",
  header: "Rows",
  width: "80px",
  render: (s: UniversalSheetRow) => (
    <span className="text-xs text-muted-foreground tabular-nums">
      {s.rows != null ? s.rows.toLocaleString() : "—"}
    </span>
  ),
};

// ── Columns column ─────────────────────────────────────────────────
export const colCols = {
  key: "columns",
  header: "Cols",
  width: "70px",
  render: (s: UniversalSheetRow) => (
    <span className="text-xs text-muted-foreground tabular-nums">
      {s.columns != null ? s.columns.toLocaleString() : "—"}
    </span>
  ),
};

// ── Column presets ─────────────────────────────────────────────────
// For pages that need the source badge (files, recent)
export const sheetsWithSourceColumns = [
  colName,
  colSource,
  colOwner,
  colCollaborators,
  colLastModified,
  colCreated,
  colRows,
  colCols,
];

// For personal sheets folder view (no source needed)
export const sheetsPersonalColumns = [
  colName,
  colOwner,
  colCollaborators,
  colLastModified,
  colCreated,
  colRows,
  colCols,
];

// ── Shared action menu ─────────────────────────────────────────────
function SheetActionMenu({ sheet }: { sheet: UniversalSheetRow }) {
  const router = useRouter();

  return (
    <>
      <DropdownMenuItem
        className="text-xs gap-2"
        onClick={() => router.push(`/sheet/${sheet.id}`)}
      >
        <Edit3 className="h-3.5 w-3.5" /> Open & Edit
      </DropdownMenuItem>
      <DropdownMenuItem
        className="text-xs gap-2"
        onClick={() => toast.info("Share — coming soon")}
      >
        <Share2 className="h-3.5 w-3.5" /> Share
      </DropdownMenuItem>
      <DropdownMenuItem
        className="text-xs gap-2"
        onClick={() => toast.info("Download — coming soon")}
      >
        <Download className="h-3.5 w-3.5" /> Download
      </DropdownMenuItem>
      <DropdownMenuItem
        className="text-xs gap-2"
        onClick={async () => {
          try {
            await updateSheetStarred(sheet.id, !sheet.is_starred);
            toast.success(
              sheet.is_starred ? "Removed from starred" : "Added to starred",
            );
          } catch {
            toast.error("Failed to update star");
          }
        }}
      >
        {sheet.is_starred ? (
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
      <DropdownMenuItem
        className="text-xs gap-2 text-red-600 focus:text-red-600"
        onClick={() => toast.info("Delete — coming soon")}
      >
        <Trash2 className="h-3.5 w-3.5" /> Delete
      </DropdownMenuItem>
    </>
  );
}

export const universalSheetAction = {
  render: (s: UniversalSheetRow) => <SheetActionMenu sheet={s} />,
};

// ── Empty icon ─────────────────────────────────────────────────────
export function UniversalEmptyIcon() {
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
      <rect
        x="10"
        y="8"
        width="52"
        height="14"
        rx="7"
        fill="currentColor"
        className="text-muted/50"
      />
      <rect
        x="10"
        y="15"
        width="52"
        height="7"
        fill="currentColor"
        className="text-muted/50"
      />
      <line
        x1="30"
        y1="8"
        x2="30"
        y2="64"
        stroke="currentColor"
        strokeWidth="1"
        className="text-border/60"
      />
      <line
        x1="50"
        y1="8"
        x2="50"
        y2="64"
        stroke="currentColor"
        strokeWidth="1"
        className="text-border/60"
      />
      <line
        x1="10"
        y1="36"
        x2="62"
        y2="36"
        stroke="currentColor"
        strokeWidth="1"
        className="text-border/60"
      />
      <line
        x1="10"
        y1="50"
        x2="62"
        y2="50"
        stroke="currentColor"
        strokeWidth="1"
        className="text-border/60"
      />
      <circle cx="54" cy="54" r="11" fill="hsl(var(--background))" />
      <circle
        cx="54"
        cy="54"
        r="11"
        stroke="currentColor"
        strokeWidth="1.5"
        className="text-border"
      />
      <line
        x1="50"
        y1="54"
        x2="58"
        y2="54"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        className="text-muted-foreground/60"
      />
      <line
        x1="54"
        y1="50"
        x2="54"
        y2="58"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        className="text-muted-foreground/60"
      />
    </svg>
  );
}
