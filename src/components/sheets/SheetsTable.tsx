"use client";

import React, { useEffect, useState, useMemo } from "react";
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
import { renameSheet, deleteSheet } from "@/lib/querys/sheets/sheets";
import { updateSheetStarred } from "@/lib/querys/sheet/sheet";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface SheetRow {
  id: string;
  title: string;
  rawDate: string;
  ownerName: string;
  ownerAvatar?: string;
  isStarred: boolean;
  isOrganization: boolean;
  members: {
    id: string;
    name: string;
    avatar?: string;
  }[];
}

interface SheetsTableProps {
  sheets: any[];
  onDeleted?: (id: string) => void;
  onRenamed?: (id: string, title: string) => void;
  emptyText?: string;
  emptyDescription?: string;
  hidePrivate?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Date helpers                                                       */
/* ------------------------------------------------------------------ */
const formatDate = (iso: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

/* ------------------------------------------------------------------ */
/*  Sheet icon — dark green                                            */
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
/*  Avatar                                                             */
/* ------------------------------------------------------------------ */
const Avatar = ({ name, url, className = "h-7 w-7 text-[10px]" }: { name: string; url?: string; className?: string }) => {
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  if (url) {
    return <img src={url} alt={name} className={cn("rounded-full object-cover shrink-0", className)} />;
  }
  return (
    <div className={cn("rounded-full bg-muted flex items-center justify-center shrink-0 font-semibold text-muted-foreground select-none", className)}>
      {initials}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Three-dot menu                                                     */
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
              open ? "opacity-100" : "opacity-100 sm:opacity-0 sm:group-hover/row:opacity-100",
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
/*  Row Component                                                      */
/* ------------------------------------------------------------------ */
const SheetTableRow = ({
  sheet, onDeleted, onRenamed, onClick, hidePrivate,
}: {
  sheet: SheetRow;
  onDeleted: (id: string) => void;
  onRenamed: (id: string, title: string) => void;
  onClick: (id: string) => void;
  hidePrivate?: boolean;
}) => {
  const [starred, setStarred] = useState(sheet.isStarred);
  const [menuOpen, setMenuOpen] = useState(false);
  const owner = sheet.ownerName ?? "Me";

  useEffect(() => {
    setStarred(sheet.isStarred);
  }, [sheet.isStarred]);

  const handleStarToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const newStarred = !starred;
    setStarred(newStarred);
    try {
      await updateSheetStarred(sheet.id, newStarred);
      toast.success(newStarred ? "Added to starred" : "Removed from starred");
    } catch {
      setStarred(!newStarred);
      toast.error("Failed to update star");
    }
  };

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
        onClick={handleStarToggle}
      >
        <Star className="h-3.5 w-3.5" fill={starred ? "currentColor" : "none"} />
      </button>

      {/* Icon */}
      <SheetIcon />

      {/* Name block — left-aligned */}
      <div className="flex items-center min-w-0 flex-[1.5] md:flex-[1.5] mr-2 md:mr-4">
        <span className="whitespace-nowrap text-sm font-normal ml-2.5">
          {sheet.title}
        </span>
      </div>

      {/* Owner block — left-aligned on mobile, centered on desktop */}
      <div className="flex-1 flex items-center justify-start md:justify-center min-w-0 px-2 md:px-4">
        <div className="flex items-center gap-2.5">
          <Avatar name={owner} url={sheet.ownerAvatar} />
          <div style={{ minWidth: 90 }} className="text-left">
            <p className="text-xs font-medium leading-tight whitespace-nowrap">{owner}</p>
            <p className="text-[11px] text-muted-foreground leading-tight whitespace-nowrap mt-0.5">
              {formatDate(sheet.rawDate)}
            </p>
          </div>
        </div>
      </div>

      {/* Center block — members avatars (avaa and me in center-right) */}
      <div className="flex-[1] hidden md:flex items-center justify-center min-w-0 px-4">
        {sheet.isOrganization ? (
          <div className="flex -space-x-1.5 overflow-hidden">
            {sheet.members.slice(0, 3).map((member, i) => (
              <div
                key={member.id ?? i}
                className="h-5 w-5 rounded-full border border-background overflow-hidden shrink-0"
                title={member.name}
              >
                <Avatar name={member.name} url={member.avatar} className="h-5 w-5 text-[8px]" />
              </div>
            ))}
            {sheet.members.length > 3 && (
              <div className="h-5 w-5 rounded-full bg-muted border border-background flex items-center justify-center text-[8px] font-semibold text-muted-foreground shrink-0 select-none">
                +{sheet.members.length - 3}
              </div>
            )}
          </div>
        ) : hidePrivate ? null : (
          <span className="inline-flex rounded-md bg-secondary/80 px-2 py-0.5 text-[10px] font-semibold text-secondary-foreground whitespace-nowrap select-none">
            Private
          </span>
        )}
      </div>

      {/* Three-dot container — normal (not sticky) on the right side */}
      <div className="shrink-0 flex items-center justify-end w-10 pr-2 pl-2">
        <RowMenu
          sheet={sheet}
          open={menuOpen}
          onOpenChange={setMenuOpen}
          onDeleted={onDeleted}
          onRenamed={onRenamed}
          onOpen={onClick}
        />
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */
const SheetsTable: React.FC<SheetsTableProps> = ({
  sheets,
  onDeleted,
  onRenamed,
  emptyText = "No sheets yet",
  emptyDescription = "Spreadsheets will appear here.",
  hidePrivate = false,
}) => {
  const router = useRouter();

  const mappedSheets: SheetRow[] = useMemo(() => {
    return (sheets ?? []).map((s: any) => {
      const owner = s.owner ?? { name: "You" };

      // Map members
      let rawMembers: any[] = [];
      if (Array.isArray(s.members)) {
        rawMembers = s.members;
      } else if (Array.isArray(s.sheet_members)) {
        rawMembers = s.sheet_members;
      } else if (Array.isArray(s.organization?.members)) {
        rawMembers = s.organization.members;
      } else if (Array.isArray(s.organizationMembers)) {
        rawMembers = s.organizationMembers;
      }

      const mappedMembers = rawMembers.map((member: any) => {
        const profile = member.profiles ?? member;
        const name = profile.name ?? profile.email ?? "Member";
        return {
          id: member.id ?? profile.id,
          name: name,
          avatar: profile.avatar_url ?? profile.avatar ?? undefined,
        };
      });

      return {
        id: s.id,
        title: s.title,
        rawDate: s.lastEdited ?? s.updated_at ?? s.created_at ?? "",
        ownerName: owner.name ?? "You",
        ownerAvatar: owner.avatar_url ?? owner.avatar ?? undefined,
        isStarred: s.isStarred ?? s.is_starred ?? false,
        isOrganization: s.isOrganization || !!s.organization_id || s.source === "organization",
        members: mappedMembers,
      };
    });
  }, [sheets]);

  if (mappedSheets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-14 gap-3 text-center border rounded-xl bg-card/30 min-h-[300px]">
        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <FileSpreadsheet className="h-6 w-6 text-primary/50" />
        </div>
        <div>
          <p className="text-sm font-semibold">{emptyText}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{emptyDescription}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto styled-scrollbar">
      <div className="flex flex-col min-h-[300px] min-w-[480px] md:min-w-0">
        {mappedSheets.map((sheet) => (
          <SheetTableRow
            key={sheet.id}
            sheet={sheet}
            onDeleted={(id) => onDeleted?.(id)}
            onRenamed={(id, title) => onRenamed?.(id, title)}
            onClick={(id) => router.push(`/sheet/${id}`)}
            hidePrivate={hidePrivate}
          />
        ))}
      </div>
    </div>
  );
};

export default SheetsTable;
