"use client";

import { StarOff, Loader2 } from "lucide-react";
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import {
  Share2,
  Download,
  Trash2,
  FileSpreadsheet,
  Layers,
  Code2,
  Printer,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { updateSheetStarred } from "@/lib/querys/sheet/sheet";
import { deleteSheet } from "@/lib/querys/sheets/sheets";
import { exportSheet } from "@/lib/querys/export";
import { toast } from "sonner";
import { useState } from "react";
import {
  colName,
  colPersonal,
  colMembers,
  colCreated,
  colLastModified,
  type UniversalSheetRow,
} from "@/data/tables/universalSheetColumns";

// Re-export type so Starred-list doesn't break
export type StarredSheetRow = UniversalSheetRow;

// ── Use the same 5 standard columns ──────────────────────────────
export const starredColumns = [
  colName,
  colPersonal,
  colMembers,
  colCreated,
  colLastModified,
];

export function StarredAction({
  onUnstar,
}: {
  onUnstar?: (id: string) => void;
}) {
  return {
    render: (s: UniversalSheetRow) => (
      <StarredActionMenu sheet={s} onUnstar={onUnstar} />
    ),
  };
}

function StarredActionMenu({
  sheet,
  onUnstar,
}: {
  sheet: UniversalSheetRow;
  onUnstar?: (id: string) => void;
}) {
  const router = useRouter();
  const [downloading, setDownloading] = useState(false);

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

  return (
    <>
      <DropdownMenuItem
        className="text-xs gap-2"
        onClick={() => {
          const url = `${window.location.origin}/sheet/${sheet.id}`;
          navigator.clipboard
            .writeText(url)
            .then(() => toast.success("Link copied to clipboard"));
        }}
      >
        <Share2 className="h-3.5 w-3.5" /> Copy Link
      </DropdownMenuItem>

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

      <DropdownMenuItem
        className="text-xs gap-2 text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/30"
        onClick={async () => {
          try {
            await deleteSheet(sheet.id);
            toast.success(`"${sheet.title}" deleted`);
            onUnstar?.(sheet.id);
            router.refresh();
          } catch (err: any) {
            toast.error(err?.message ?? "Delete failed");
          }
        }}
      >
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

