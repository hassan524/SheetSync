"use client";

import { SheetItem } from "@/data/sheets";
import SheetCard from "@/components/sheets/Sheet-card";
import SheetsTable from "@/components/tables/Sheets-table";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, FolderOpen, Plus } from "lucide-react";

interface Props {
  sheets: SheetItem[];
  viewMode: "grid" | "table";
  searchQuery: string;
  folderName: string;
  onNewSheet: () => void;
}

const SheetsGrid = ({
  sheets,
  viewMode,
  searchQuery,
  folderName,
  onNewSheet,
}: Props) => {
  const tableData = sheets.map((s) => ({
    id: s.id,
    title: s.title,
    owner: s.owner,
    visibility: s.visibility,
    lastModified: s.lastEdited,
    lastModifiedBy: s.lastModifiedBy,
    collaborators: s.collaborators,
    activeEditors: s.activeEditors,
    isStarred: s.isStarred,
    size: s.size,
  }));

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-2 mb-3">
        <FolderOpen className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-medium text-muted-foreground">
          {folderName}
        </h2>
        <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
          {sheets.length}
        </span>
      </div>

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
              : "Create a new sheet to get started"}
          </p>
          {!searchQuery && (
            <Button size="sm" onClick={onNewSheet}>
              <Plus className="h-4 w-4 mr-1.5" />
              New Sheet
            </Button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sheets.map((sheet, index) => (
            <div
              key={sheet.id}
              className="animate-scale-in"
              style={{ animationDelay: `${index * 30}ms` }}
            >
              <SheetCard
                title={sheet.title}
                lastEdited={sheet.lastEdited}
                isStarred={sheet.isStarred}
                sharedWith={sheet.sharedWith}
              />
            </div>
          ))}
        </div>
      ) : (
        <SheetsTable sheets={tableData} />
      )}
    </div>
  );
};

export default SheetsGrid;
