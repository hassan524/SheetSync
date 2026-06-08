"use client";

import { Sheet } from "@/types";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, FolderOpen, Plus } from "lucide-react";
import { SheetsTable } from "@/components/sheets";
import { useRouter } from "next/navigation";

interface Props {
  sheets: Sheet[];
  searchQuery: string;
  folderName: string;
  onNewSheet: () => void;
  onDeleted?: (id: string) => void;
}

const SheetsGrid = ({
  sheets,
  searchQuery,
  folderName,
  onNewSheet,
  onDeleted,
}: Props) => {
  const router = useRouter();

  const handleDeleted = (id: string) => {
    onDeleted?.(id);
    router.refresh();
  };

  const handleRenamed = () => {
    router.refresh();
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between my-4 px-1 py-2.5">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <FolderOpen className="h-4 w-4 text-primary" />
          </div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-foreground">
              {folderName}
            </h2>
            <span className="text-[11px] text-muted-foreground font-medium bg-muted px-2 py-0.5 rounded-full">
              {sheets.length} {sheets.length === 1 ? "sheet" : "sheets"}
            </span>
          </div>
        </div>
      </div>

      {/* Empty state */}
      {sheets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 rounded-xl border-2 border-dashed border-border bg-muted/10">
          <div className="h-14 w-14 rounded-xl bg-muted/40 flex items-center justify-center mb-4">
            <FileSpreadsheet className="h-7 w-7 text-muted-foreground/50" />
          </div>
          <p className="font-medium">
            {searchQuery ? "No results found" : "This folder is empty"}
          </p>
          <p className="text-sm text-muted-foreground/70 mt-1 mb-4">
            {searchQuery
              ? "Try a different search term"
              : "Create your first sheet here"}
          </p>
          {!searchQuery && (
            <Button size="sm" onClick={onNewSheet}>
              <Plus className="h-4 w-4 mr-1.5" />
              New Sheet
            </Button>
          )}
        </div>
      ) : (
        <SheetsTable
          sheets={sheets}
          onDeleted={handleDeleted}
          onRenamed={handleRenamed}
          emptyText="No sheets yet"
          emptyDescription="Sheets in this folder will appear here."
        />
      )}
    </div>
  );
};

export default SheetsGrid;
