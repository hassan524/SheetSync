import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FileText, Users, Clock, Star } from "lucide-react";
import { DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Edit3, Share2, Download, Trash2 } from "lucide-react";
import { timeAgo } from "@/lib/utils";

export interface SheetRow {
  id: string;
  title: string;
  is_starred?: boolean;
  owner?: {
    name?: string;
    email?: string;
    initials?: string;
    avatar?: string; // added avatar
  };
  collaborators?: number;
  lastModified?: string;
  createdAt?: string;
  size?: string;
  rows?: number;
  columns?: number;
}

export const sheetColumns = [
  {
    key: "title",
    header: "Sheet Name",
    render: (s: SheetRow) => (
      <div className="flex items-center gap-3">
        <div className="h-7 w-7 rounded-lg border bg-card flex items-center justify-center shadow-sm shrink-0">
          <FileText className="h-3.5 w-3.5 text-primary/60" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium truncate max-w-[200px] block">{s.title}</span>
            {s.is_starred && <Star className="h-3 w-3 text-amber-400 fill-amber-400 shrink-0" />}
          </div>
        </div>
      </div>
    ),
  },

  {
    key: "owner",
    header: "Owner",
    width: "180px",
    render: (s: SheetRow) => (
      <div className="flex items-center gap-2">
        <Avatar className="h-6 w-6 shrink-0">
          {s.owner?.avatar ? (
            <AvatarImage src={s.owner.avatar} />
          ) : (
            <AvatarFallback className="text-[9px] font-semibold bg-primary/10 text-primary">
              {s.owner?.initials ?? "?"}
            </AvatarFallback>
          )}
        </Avatar>
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground truncate">{s.owner?.name ?? "You"}</span>
          {s.owner?.email && <span className="text-[11px] text-muted-foreground truncate">{s.owner.email}</span>}
        </div>
      </div>
    ),
  },

  {
    key: "collaborators",
    header: "Shared",
    width: "140px",
    render: (s: SheetRow) => {
      const count = s.collaborators ?? 0;
      if (count === 0) return <span className="text-xs text-muted-foreground">Only you</span>;
      return (
        <span className="text-xs text-muted-foreground">
          {count} {count === 1 ? "person" : "people"}
        </span>
      );
    },
  },

  {
    key: "last_modified",
    header: "Last Modified",
    width: "140px",
    render: (s: SheetRow) => (
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Clock className="h-3 w-3" />
        <span>{s.lastModified ? timeAgo(s.lastModified) : "—"}</span>
      </div>
    ),
  },

  {
    key: "created_at",
    header: "Created",
    width: "140px",
    render: (s: SheetRow) => (
      <span className="text-xs text-muted-foreground">
        {s.createdAt ? timeAgo(s.createdAt) : "—"}
      </span>
    ),
  },

  {
    key: "size",
    header: "Size",
    width: "100px",
    render: (s: SheetRow) => <span className="text-xs text-muted-foreground">{s.size ?? "—"}</span>,
  },

  {
    key: "rows",
    header: "Rows",
    width: "90px",
    render: (s: SheetRow) => <span className="text-xs text-muted-foreground">{s.rows ?? "—"}</span>,
  },

  {
    key: "columns",
    header: "Columns",
    width: "90px",
    render: (s: SheetRow) => <span className="text-xs text-muted-foreground">{s.columns ?? "—"}</span>,
  },
];

export const sheetAction = {
  render: (s: SheetRow) => (
    <>
      <DropdownMenuItem className="text-xs gap-2">
        <Edit3 className="h-3.5 w-3.5" /> Open & Edit
      </DropdownMenuItem>
      <DropdownMenuItem className="text-xs gap-2">
        <Share2 className="h-3.5 w-3.5" /> Share
      </DropdownMenuItem>
      <DropdownMenuItem className="text-xs gap-2">
        <Download className="h-3.5 w-3.5" /> Download
      </DropdownMenuItem>
      <DropdownMenuItem className="text-xs gap-2">
        <Star className="h-3.5 w-3.5" /> {s.is_starred ? "Unstar" : "Star"}
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem className="text-xs gap-2 text-red-600 focus:text-red-600">
        <Trash2 className="h-3.5 w-3.5" /> Delete
      </DropdownMenuItem>
    </>
  ),
};
export function NoSheetsIcon() {
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="8" width="52" height="56" rx="7" fill="currentColor" className="text-muted/30" />
      <rect x="10" y="8" width="52" height="56" rx="7" stroke="currentColor" strokeWidth="1.5" className="text-border" />
      {/* plus badge */}
      <circle cx="54" cy="54" r="11" fill="hsl(var(--background))" />
      <circle cx="54" cy="54" r="11" stroke="currentColor" strokeWidth="1.5" className="text-border" />
      <line x1="50" y1="54" x2="58" y2="54" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="text-muted-foreground/60" />
      <line x1="54" y1="50" x2="54" y2="58" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="text-muted-foreground/60" />
    </svg>
  );
}