"use client";

import { Sheet } from "@/types";
import SheetCard from "@/components/sheets/Sheet-card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileSpreadsheet, FolderOpen, Plus, Grid3X3, List } from "lucide-react";
import { formatDistanceToNowStrict, parseISO } from "date-fns";
import { DataTable } from "@/components/common/Data-table";
import {
  sheetsPersonalColumns,
  universalSheetAction,
  UniversalEmptyIcon,
  type UniversalSheetRow,
} from "@/data/tables/universalSheetColumns";

interface Props {
  sheets: Sheet[];
  viewMode: "grid" | "table";
  searchQuery: string;
  folderName: string;
  onNewSheet: () => void;
  onDeleted?: (id: string) => void;
  onViewModeChange?: (mode: "grid" | "table") => void;
}

const SheetsGrid = ({
  sheets,
  viewMode,
  searchQuery,
  folderName,
  onNewSheet,
  onViewModeChange,
}: Props) => {
  const tableRows: UniversalSheetRow[] = sheets.map((s) => ({
    id: s.id,
    title: s.title,
    is_starred: s.is_starred,
    source: "personal",
    folderName: folderName || undefined,
    owner: s.owner ?? { name: "You", initials: "ME" },
    collaborators: s.collaborators ?? 0,
    members: (s as any).members ?? (s as any).sheet_members ?? [],
    lastModified: s.updated_at ?? undefined,
    createdAt: s.created_at ?? undefined,
    rows: s.rows ?? undefined,
    columns: s.columns ?? undefined,
    templateId: (s as any).templateId ?? (s as any).template_id ?? undefined,
    visibility: s.visibility,
    activeEditors: s.activeEditors ?? undefined,
  }));

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

        {/* Inline view toggle */}
        {onViewModeChange && (
          <Tabs
            value={viewMode}
            onValueChange={(v) => onViewModeChange(v as "grid" | "table")}
          >
            <TabsList className="h-8 p-0.5">
              <TabsTrigger value="grid" className="h-7 w-8 p-0">
                <Grid3X3 className="h-3.5 w-3.5" />
              </TabsTrigger>
              <TabsTrigger value="table" className="h-7 w-8 p-0">
                <List className="h-3.5 w-3.5" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}
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
      ) : viewMode === "grid" ? (
        /* GRID VIEW */
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {sheets.map((sheet, index) => {
            const lastEdited = sheet.updated_at
              ? formatDistanceToNowStrict(parseISO(sheet.updated_at), {
                  addSuffix: true,
                })
              : "—";
            return (
              <div
                key={sheet.id}
                style={{ animationDelay: `${index * 50}ms` }}
                className="animate-scale-in"
              >
                <SheetCard
                  id={sheet.id}
                  title={sheet.title}
                  lastEdited={lastEdited}
                  isStarred={sheet.is_starred}
                  templateId={sheet.template_id ?? ""}
                  folderName={folderName}
                  rows={sheet.rows ?? 0}
                  cols={sheet.columns ?? 0}
                  fillPercent={40}
                />
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW — same universal table */
        <DataTable
          columns={sheetsPersonalColumns}
          rows={tableRows}
          getKey={(s) => s.id}
          action={universalSheetAction}
          emptyText="No sheets yet"
          emptyDescription="Sheets in this folder will appear here."
          emptyIcon={<UniversalEmptyIcon />}
        />
      )}
    </div>
  );
};

export default SheetsGrid;
