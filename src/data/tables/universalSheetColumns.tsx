"use client";

import { useState } from "react";
import { FileText, Clock, Star, StarOff, Loader2 } from "lucide-react";
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Download,
  Trash2,
  FileSpreadsheet,
  Layers,
  Code2,
  Printer,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { timeAgo } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { updateSheetStarred } from "@/lib/querys/sheet/sheet";
import { deleteSheet } from "@/lib/querys/sheets/sheets";
import { exportSheet } from "@/lib/querys/export";
import { toast } from "sonner";
import Link from "next/link";
import { SHEET_TEMPLATES } from "@/constants/Sheet-templates";

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
  members?: {
    id?: string;
    name?: string;
    email?: string;
    initials?: string;
    avatar?: string | null;
    status?: "online" | "offline" | string;
  }[];
  lastModified?: string;
  createdAt?: string;
  rows?: number;
  columns?: number;
  templateId?: string;
  visibility?: "private" | "team" | "public";
  activeEditors?: number;
}

// ── Name column (clickable → navigates to sheet) ──────────────────
export const colName = {
  key: "title",
  header: "Name",
  width: "280px",
  render: (s: UniversalSheetRow) => {
    const isImported =
      s.title.toLowerCase().includes("imported") ||
      s.title.toLowerCase().endsWith(".csv") ||
      s.title.toLowerCase().endsWith(".xlsx") ||
      s.title.toLowerCase().endsWith(".xls");
    return (
      <div className="flex items-center gap-3 min-w-0 max-w-full">
        <div className="h-7 w-7 rounded-lg border bg-card flex items-center justify-center shadow-sm shrink-0">
          <FileText className="h-3.5 w-3.5 text-primary/60" />
        </div>
        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="flex items-center gap-1.5 min-w-0">
            <Link
              href={`/sheet/${s.id}`}
              className="expandable-truncate text-sm font-medium min-w-0 block text-foreground hover:text-primary hover:underline transition-colors"
              onClick={(e) => e.stopPropagation()}
              title={s.title}
            >
              {s.title}
            </Link>
            {s.is_starred && (
              <Star className="h-3 w-3 text-amber-400 fill-amber-400 shrink-0" />
            )}
            {isImported && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/50 uppercase tracking-wider scale-95 origin-left shrink-0">
                Imported
              </span>
            )}
          </div>
          {(s.activeEditors ?? 0) > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-green-600">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
              {s.activeEditors} editing now
            </span>
          )}
        </div>
      </div>
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
        <p className="text-xs text-foreground truncate font-medium">
          {s.owner?.name ?? "You"}
        </p>
      </div>
    </div>
  ),
};

// ── Personal column (simple bold text) ─────────────────────────────
export const colMembers = {
  key: "people",
  header: "People",
  width: "170px",
  render: (s: UniversalSheetRow) => {
    if (s.source !== "organization") {
      return (
        <span className="inline-flex rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
          Personal
        </span>
      );
    }

    const members = s.members ?? [];
    const visibleMembers = members.slice(0, 4);
    const extra = Math.max(0, members.length - visibleMembers.length);

    if (!visibleMembers.length) {
      return <span className="text-xs text-muted-foreground">No members</span>;
    }

    return (
      <div className="flex items-center gap-2 min-w-0">
        <div className="flex -space-x-2">
          {visibleMembers.map((member, index) => (
            <Avatar
              key={member.id ?? `${member.email ?? member.name}-${index}`}
              className="h-6 w-6 border-2 border-background"
              title={member.name ?? member.email ?? "Member"}
            >
              {member.avatar ? <AvatarImage src={member.avatar} /> : null}
              <AvatarFallback className="text-[9px] font-semibold bg-primary/10 text-primary">
                {member.initials ??
                  member.name?.charAt(0)?.toUpperCase() ??
                  "M"}
              </AvatarFallback>
            </Avatar>
          ))}
        </div>
        {extra > 0 ? (
          <span className="text-[11px] font-medium text-muted-foreground">
            +{extra}
          </span>
        ) : null}
        <span className="text-xs text-muted-foreground">
          {members.length} {members.length === 1 ? "member" : "members"}
        </span>
      </div>
    );
  },
};

export const colPeople = colMembers;

export const colPersonal = {
  key: "personal",
  header: "Workspace",
  width: "120px",
  render: (s: UniversalSheetRow) => {
    const isPersonal = s.source !== "organization";
    return (
      <span className="inline-flex rounded-md bg-muted/60 px-2 py-0.5 text-xs font-medium text-muted-foreground">
        {isPersonal ? "My workspace" : s.organizationName ?? "Team workspace"}
      </span>
    );
  },
};

export const colFolder = {
  key: "folder",
  header: "Folder",
  width: "150px",
  render: (s: UniversalSheetRow) => (
    <span className="inline-block max-w-[140px] truncate text-xs font-medium text-muted-foreground">
      {s.folderName ?? "Unfiled"}
    </span>
  ),
};

export const colDimensions = {
  key: "dimensions",
  header: "Size",
  width: "110px",
  render: (s: UniversalSheetRow) => {
    const rows = s.rows ?? 0;
    const columns = s.columns ?? 0;

    return (
      <span className="text-xs text-muted-foreground tabular-nums">
        {rows} x {columns}
      </span>
    );
  },
};

export const colVisibility = {
  key: "visibility",
  header: "Visibility",
  width: "120px",
  render: (s: UniversalSheetRow) => (
    <span className="inline-flex rounded-md bg-muted/60 px-2 py-0.5 text-xs font-medium capitalize text-muted-foreground">
      {s.visibility ?? (s.source === "organization" ? "team" : "private")}
    </span>
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

// ── Last modified column ───────────────────────────────────────────
export const colLastModified = {
  key: "last_modified",
  header: "Updated",
  width: "130px",
  render: (s: UniversalSheetRow) => (
    <div className="flex items-center gap-1 text-xs text-muted-foreground">
      <Clock className="h-3 w-3 shrink-0" />
      <span>{s.lastModified ? timeAgo(s.lastModified) : "—"}</span>
    </div>
  ),
};

// ── Column presets — all tables use same 5 columns ─────────────────
export const sheetsWithSourceColumns = [
  colName,
  colPersonal,
  colMembers,
  colCreated,
  colLastModified,
];

// ── Type column (shows template name) ──────────────────────────────
export const colType = {
  key: "templateId",
  header: "Type",
  width: "160px",
  render: (s: UniversalSheetRow) => {
    const template = SHEET_TEMPLATES.find((t) => t.id === s.templateId);
    const title = template?.title || "Blank Sheet";
    return (
      <span className="inline-block max-w-full truncate text-xs font-medium text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-md border">
        {title}
      </span>
    );
  },
};

export const sheetsPersonalColumns = [
  colName,
  colFolder,
  colPeople,
  colType,
  colDimensions,
  colVisibility,
  colCreated,
  colLastModified,
];

// ── Shared action menu ─────────────────────────────────────────────
function SheetActionMenu({
  sheet,
  onDeleted,
}: {
  sheet: UniversalSheetRow;
  onDeleted?: (id: string) => void;
}) {
  const router = useRouter();
  const [starring, setStarring] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleStar = async () => {
    setStarring(true);
    try {
      await updateSheetStarred(sheet.id, !sheet.is_starred);
      toast.success(
        sheet.is_starred ? "Removed from starred" : "Added to starred",
      );
      router.refresh();
    } catch {
      toast.error("Failed to update star");
    } finally {
      setStarring(false);
    }
  };

  const handleDownload = async (format: "csv" | "xlsx" | "pdf" | "json") => {
    setDownloading(true);
    try {
      await exportSheet({ format, sheetId: sheet.id });
      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch (err: any) {
      toast.error(err?.message ?? "Export failed");
    } finally {
      setDownloading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteSheet(sheet.id);
      toast.success(`"${sheet.title}" deleted`);
      onDeleted?.(sheet.id);
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message ?? "Delete failed");
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger
          className="text-xs gap-2"
          disabled={downloading}
        >
          {downloading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Download className="h-3.5 w-3.5" />
          )}
          Download
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent className="w-40">
          <DropdownMenuItem
            className="text-xs gap-2"
            onClick={() => handleDownload("csv")}
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-green-600" /> CSV
            (.csv)
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-xs gap-2"
            onClick={() => handleDownload("xlsx")}
          >
            <Layers className="h-3.5 w-3.5 text-blue-600" /> Excel (.xlsx)
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-xs gap-2"
            onClick={() => handleDownload("pdf")}
          >
            <Printer className="h-3.5 w-3.5 text-red-500" /> PDF (.pdf)
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-xs gap-2"
            onClick={() => handleDownload("json")}
          >
            <Code2 className="h-3.5 w-3.5 text-purple-600" /> JSON (.json)
          </DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuSub>

      <DropdownMenuItem
        className="text-xs gap-2"
        onClick={handleStar}
        disabled={starring}
      >
        {starring ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : sheet.is_starred ? (
          <StarOff className="h-3.5 w-3.5" />
        ) : (
          <Star className="h-3.5 w-3.5" />
        )}
        {sheet.is_starred ? "Unstar" : "Star"}
      </DropdownMenuItem>

      <DropdownMenuSeparator />

      <DropdownMenuItem
        className="text-xs gap-2 text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/30"
        onClick={() => setShowDeleteDialog(true)}
      >
        <Trash2 className="h-3.5 w-3.5" /> Delete
      </DropdownMenuItem>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base">
              Delete sheet?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              <span className="font-medium text-foreground">
                "{sheet.title}"
              </span>{" "}
              will be permanently deleted. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-8 text-xs" disabled={deleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="h-8 text-xs bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
      <rect
        x="14"
        y="28"
        width="12"
        height="2.5"
        rx="1.25"
        fill="currentColor"
        className="text-muted-foreground/25"
      />
      <rect
        x="34"
        y="28"
        width="8"
        height="2.5"
        rx="1.25"
        fill="currentColor"
        className="text-muted-foreground/20"
      />
      <rect
        x="14"
        y="42"
        width="10"
        height="2.5"
        rx="1.25"
        fill="currentColor"
        className="text-muted-foreground/15"
      />
      <rect
        x="34"
        y="42"
        width="12"
        height="2.5"
        rx="1.25"
        fill="currentColor"
        className="text-muted-foreground/10"
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

