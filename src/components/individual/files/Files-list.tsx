"use client";

import React, { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SheetCard from "@/components/sheets/Sheet-card";
import { DataTable } from "@/components/common/Data-table";
import {
  sheetColumns,
  sheetAction,
  NoSheetsIcon,
} from "@/data/tables/personalSheets/personalTableColumns";
import type { SheetRow } from "@/data/tables/personalSheets/personalTableColumns";
import { Search, Grid3X3, List } from "lucide-react";

interface FilesListProps {
  sheets: any[];
}

const FilesList: React.FC<FilesListProps> = ({ sheets }) => {
  const [viewMode, setViewMode] = useState<"cards" | "table">("table");
  const [searchQuery, setSearchQuery] = useState("");

  const tableRows: SheetRow[] = useMemo(
    () =>
      sheets.map((s: any) => ({
        id: s.id,
        title: s.title,
        is_starred: s.is_starred,
        owner: { name: "You", initials: "ME" },
        lastModified: s.updated_at,
        createdAt: s.created_at,
        rows: s.rows?.length,
        columns: s.columns?.length,
      })),
    [sheets],
  );

  const filtered = useMemo(
    () => tableRows.filter((s) => s.title.toLowerCase().includes(searchQuery.toLowerCase())),
    [tableRows, searchQuery],
  );

  return (
    <>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search all files..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "cards" | "table")}>
          <TabsList className="h-9">
            <TabsTrigger value="table" className="px-3">
              <List className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="cards" className="px-3">
              <Grid3X3 className="h-4 w-4" />
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {viewMode === "table" ? (
        <DataTable
          columns={sheetColumns}
          rows={filtered}
          getKey={(s) => s.id}
          action={sheetAction}
          emptyText="No files found"
          emptyDescription="Create a new sheet to get started."
          emptyIcon={<NoSheetsIcon />}
        />
      ) : (
        <>
          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((sheet, index) => (
                <div key={sheet.id} style={{ animationDelay: `${index * 30}ms` }}>
                  <SheetCard
                    id={sheet.id}
                    title={sheet.title}
                    lastEdited={sheet.lastModified || ""}
                    isStarred={sheet.is_starred}
                    templateId="default"
                    fileSizeKb={100}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 animate-fade-in">
              <p className="text-muted-foreground">No files found matching your search.</p>
            </div>
          )}
        </>
      )}
    </>
  );
};

export default FilesList;
