"use client";

import React, { useEffect, useState } from "react";
import { FileSpreadsheet, MoreHorizontal, Star, Download, Trash2, ExternalLink, Pencil } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { getRecentSheets, renameSheet, deleteSheet } from "@/lib/querys/sheets/sheets";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */
interface SheetRow {
  id: string;
  title: string;
  rawDate: string; // ISO string, kept for time-ago calc
  ownerName?: string;
  ownerAvatar?: string;
  templateId?: string | null;
  isOrganization?: boolean;
  organizationName?: string;
  folderName?: string;
}

/* ------------------------------------------------------------------ */
/*  Date helpers                                                        */
/* ------------------------------------------------------------------ */
const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  // e.g. "8 May 2026"
};

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins || 1} min${mins !== 1 ? "s" : ""} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs !== 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days} day${days !== 1 ? "s" : ""} ago`;
  return formatDate(iso);
};

/* ------------------------------------------------------------------ */
/*  Sheet icon — dark green                                             */
/* ------------------------------------------------------------------ */
const SheetIcon = () => (
  <div
    className="shrink-0 flex items-center justify-center rounded-[3px]"
    style={{ width: 22, height: 28, background: "#1a7340" }}
  >
    <svg viewBox="0 0 14 18" fill="none" width="14" height="17">
      <rect x="2.5" y="6"   width="9" height="1.1" fill="white" fillOpacity="0.9" />
      <rect x="2.5" y="8.7" width="9" height="1.1" fill="white" fillOpacity="0.9" />
      <rect x="2.5" y="11.4" width="6" height="1.1" fill="white" fillOpacity="0.9" />
      <path d="M9 1 L13 5 L9 5 Z" fill="white" fillOpacity="0.3" />
      <path d="M9 1 L9 5 L13 5" stroke="white" strokeOpacity="0.5" strokeWidth="0.6" fill="none" />
    </svg>
  </div>
);

/* ------------------------------------------------------------------ */
/*  Avatar                                                              */
/* ------------------------------------------------------------------ */
const Avatar = ({ name, url }: { name: string; url?: string }) => {
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  if (url) {
    return <img src={url} alt={name} className="h-7 w-7 rounded-full object-cover shrink-0" />;
  }
  return (
    <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0 text-[10px] font-semibold text-muted-foreground select-none">
      {initials}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Three-dot menu                                                      */
/* ------------------------------------------------------------------ */
const RowMenu = ({
  sheet, open, onOpenChange, onDeleted, onRenamed, onOpen,
}: {
  sheet: SheetRow;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onDeleted: (id: string) => void;
  onRenamed: (id: string, title: string) => void;
  onOpen: (id: string) => void;
}) => {
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState(sheet.title);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleRename = async () => {
    if (!newName.trim()) {
      toast.error("Sheet name cannot be empty");
      return;
    }
    try {
      await renameSheet({ sheet_id: sheet.id, newName: newName.trim() });
      onRenamed(sheet.id, newName.trim());
      toast.success("Sheet renamed successfully");
      setRenaming(false);
      onOpenChange(false);
    } catch (err) {
      toast.error("Failed to rename sheet");
      console.log("Rename error:", err);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteSheet(sheet.id);
      onDeleted(sheet.id);
      toast.success("Sheet moved to trash");
      setIsDeleting(false);
      onOpenChange(false);
    } catch (err) {
      toast.error("Failed to delete sheet");
    }
  };

  return (
    <>
      <DropdownMenu open={open} onOpenChange={onOpenChange}>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              "h-7 w-7 shrink-0 flex items-center justify-center rounded-md text-muted-foreground",
              "hover:bg-accent hover:text-foreground transition-colors focus:outline-none",
              open ? "opacity-100" : "opacity-0 group-hover/row:opacity-100",
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44 text-sm">
          <DropdownMenuItem className="gap-2" onClick={(e) => { e.stopPropagation(); setRenaming(true); }}>
            <Pencil className="h-3.5 w-3.5" /> Rename
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-2" onClick={(e) => { e.stopPropagation(); onOpen(sheet.id); }}>
            <ExternalLink className="h-3.5 w-3.5" /> Open
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-2" onClick={(e) => { e.stopPropagation(); window.open(`/sheet/${sheet.id}`, '_blank'); }}>
            <Download className="h-3.5 w-3.5" /> Download
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive" onClick={(e) => { e.stopPropagation(); setIsDeleting(true); }}>
            <Trash2 className="h-3.5 w-3.5" /> Move to trash
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Rename Dialog */}
      <Dialog open={renaming} onOpenChange={setRenaming}>
        <DialogContent className="w-96">
          <DialogHeader>
            <DialogTitle>Rename Sheet</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New sheet name"
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
              onKeyDown={(e) => { if (e.key === "Enter") handleRename(); }}
            />
          </div>
          <DialogFooter>
            <button
              onClick={() => setRenaming(false)}
              className="px-3 py-1.5 rounded border border-border hover:bg-accent text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleRename}
              className="px-3 py-1.5 rounded bg-primary text-white hover:opacity-90 text-sm"
            >
              Rename
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleting} onOpenChange={setIsDeleting}>
        <DialogContent className="w-96">
          <DialogHeader>
            <DialogTitle>Move to Trash?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Are you sure you want to move "{sheet.title}" to trash? This action can be undone.</p>
          <DialogFooter>
            <button
              onClick={() => setIsDeleting(false)}
              className="px-3 py-1.5 rounded border border-border hover:bg-accent text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="px-3 py-1.5 rounded bg-destructive text-white hover:opacity-90 text-sm"
            >
              Move to Trash
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

/* ------------------------------------------------------------------ */
/*  Row                                                                 */
/* ------------------------------------------------------------------ */
const SheetTableRow = ({
  sheet, onDeleted, onRenamed, onClick,
}: {
  sheet: SheetRow;
  onDeleted: (id: string) => void;
  onRenamed: (id: string, title: string) => void;
  onClick: (id: string) => void;
}) => {
  const [starred, setStarred] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const owner = sheet.ownerName ?? "Me";

  return (
    <div
      className="group/row flex items-center border-b border-border hover:bg-accent/30 cursor-pointer transition-colors"
      style={{ minWidth: 0, padding: "7px 0" }}
      onClick={() => onClick(sheet.id)}
    >
      {/* Star — always takes space, only visible on hover/starred */}
      <button
        className={cn(
          "shrink-0 w-5 flex items-center justify-center transition-colors focus:outline-none mr-1",
          starred ? "text-yellow-400" : "text-transparent group-hover/row:text-muted-foreground hover:!text-yellow-400",
        )}
        onClick={(e) => { e.stopPropagation(); setStarred((s) => !s); }}
      >
        <Star className="h-3.5 w-3.5" fill={starred ? "currentColor" : "none"} />
      </button>

      {/* Icon */}
      <SheetIcon />

      {/* Name — flex-1, truncate */}
      <span className="flex-1 truncate text-sm font-normal ml-2.5 mr-4" style={{ minWidth: 0 }}>
        {sheet.title}
      </span>

      {/* Owner block — never shrinks, always full width */}
      <div className="flex items-center gap-2.5" style={{ flexShrink: 0 }}>
        <Avatar name={owner} url={sheet.ownerAvatar} />
        <div style={{ minWidth: 90 }}>
          <p className="text-xs font-medium leading-tight whitespace-nowrap">{owner}</p>
          <p className="text-[11px] text-muted-foreground leading-tight whitespace-nowrap mt-0.5">
            {formatDate(sheet.rawDate)}
          </p>
        </div>
      </div>

      {/* Gap before dots */}
      <div className="w-3 shrink-0" />

      {/* Three-dot */}
      <RowMenu sheet={sheet} open={menuOpen} onOpenChange={setMenuOpen} onDeleted={onDeleted} onRenamed={onRenamed} onOpen={onClick} />
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Skeleton                                                            */
/* ------------------------------------------------------------------ */
const SkeletonRow = () => (
  <div className="flex items-center border-b border-border gap-2 px-0 py-2">
    <div className="w-5 h-3.5 shrink-0" />
    <div className="w-[22px] h-7 rounded-[3px] shrink-0 animate-pulse bg-muted" />
    <div className="flex-1 h-3.5 rounded animate-pulse bg-muted mx-2" style={{ maxWidth: 220 }} />
    <div className="flex items-center gap-2.5 shrink-0">
      <div className="h-7 w-7 rounded-full animate-pulse bg-muted" />
      <div style={{ minWidth: 90 }}>
        <div className="h-2.5 w-14 rounded animate-pulse bg-muted mb-1" />
        <div className="h-2 w-20 rounded animate-pulse bg-muted" />
      </div>
    </div>
    <div className="w-3 shrink-0" />
    <div className="w-7 h-7 shrink-0" />
  </div>
);

/* ------------------------------------------------------------------ */
/*  Empty                                                               */
/* ------------------------------------------------------------------ */
const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-14 gap-3 text-center">
    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
      <FileSpreadsheet className="h-6 w-6 text-primary/50" />
    </div>
    <div>
      <p className="text-sm font-semibold">No recent sheets</p>
      <p className="text-xs text-muted-foreground mt-0.5">Sheets you open will appear here.</p>
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/*  Main                                                                */
/* ------------------------------------------------------------------ */
const RecentSheets = () => {
  const router = useRouter();
  const [recentSheets, setRecentSheets] = useState<SheetRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await getRecentSheets();
        setRecentSheets(
          data.map((sheet: any) => ({
            id: sheet.id,
            title: sheet.title,
            rawDate: sheet.lastEdited,
            ownerName: sheet.owner?.name ?? sheet.ownerName ?? "Me",
            ownerAvatar: sheet.owner?.avatar_url ?? sheet.owner?.avatar ?? sheet.ownerAvatar ?? undefined,
            templateId: sheet.templateId,
            isOrganization: sheet.isOrganization,
            organizationName: sheet.organization?.name,
            folderName: sheet.folder?.name,
          })),
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <section className="h-full min-h-0 flex flex-col overflow-hidden">
      {/* List — vertical scroll, no border on container */}
      <div className="flex-1 min-h-0 overflow-y-auto styled-scrollbar">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
          : recentSheets.length === 0
          ? <EmptyState />
          : recentSheets.map((sheet) => (
              <SheetTableRow
                key={sheet.id}
                sheet={sheet}
                onDeleted={(id) => setRecentSheets((p) => p.filter((s) => s.id !== id))}
                onRenamed={(id, title) => setRecentSheets((p) => p.map((s) => s.id === id ? { ...s, title } : s))}
                onClick={(id) => router.push(`/sheet/${id}`)}
              />
            ))
        }
      </div>
    </section>
  );
};

export default RecentSheets;