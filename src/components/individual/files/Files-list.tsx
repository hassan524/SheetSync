"use client";

import React, { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SheetCard from "@/components/sheets/Sheet-card";
import { DataTable } from "@/components/common/Data-table";
import {
  sheetsWithSourceColumns,
  universalSheetAction,
  UniversalEmptyIcon,
  type UniversalSheetRow,
} from "@/data/tables/universalSheetColumns";
import { Search, Grid3X3, List, Building2, FolderOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface FilesListProps {
  sheets: any[];
}

const FilesList: React.FC<FilesListProps> = ({ sheets }) => {
  const [viewMode, setViewMode] = useState<"cards" | "table">("table");
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<
    "all" | "personal" | "organization"
  >("all");

  const tableRows: UniversalSheetRow[] = useMemo(
    () =>
      sheets.map((s: any) => ({
        id: s.id,
        title: s.title,
        is_starred: s.is_starred,
        source: s.organization_id ? "organization" : "personal",
        organizationName: s.organization?.name ?? s.organizationName ?? null,
        organizationId: s.organization_id,
        folderName: s.folder?.name ?? s.folderName ?? null,
        owner: s.owner ?? { name: "You", initials: "ME" },
        lastModified: s.updated_at,
        createdAt: s.created_at,
        collaborators: s.collaborators ?? 0,
        rows: Array.isArray(s.rows) ? s.rows.length : (s.rows ?? undefined),
        columns: Array.isArray(s.columns)
          ? s.columns.length
          : (s.columns ?? undefined),
        visibility: s.visibility,
        activeEditors: s.activeEditors,
      })),
    [sheets],
  );

  const filtered = useMemo(
    () =>
      tableRows.filter((s) => {
        const matchSearch = s.title
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
        const matchSource = sourceFilter === "all" || s.source === sourceFilter;
        return matchSearch && matchSource;
      }),
    [tableRows, searchQuery, sourceFilter],
  );

  const personalCount = tableRows.filter((s) => s.source === "personal").length;
  const orgCount = tableRows.filter((s) => s.source === "organization").length;

  return (
    <>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search all files..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Source filter pills */}
          {(
            [
              {
                key: "all",
                label: "All files",
                count: tableRows.length,
                icon: undefined,
              },
              {
                key: "personal",
                label: "Personal",
                count: personalCount,
                icon: FolderOpen,
              },
              {
                key: "organization",
                label: "Organizations",
                count: orgCount,
                icon: Building2,
              },
            ] as const
          ).map(({ key, label, count, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setSourceFilter(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                sourceFilter === key
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {Icon && <Icon className="h-3 w-3" />}
              {label}
              <span
                className={`ml-0.5 text-[10px] ${sourceFilter === key ? "opacity-80" : "text-muted-foreground"}`}
              >
                {count}
              </span>
            </button>
          ))}

          <Tabs
            value={viewMode}
            onValueChange={(v) => setViewMode(v as "cards" | "table")}
          >
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
      </div>

      {viewMode === "table" ? (
        <DataTable
          columns={sheetsWithSourceColumns}
          rows={filtered}
          getKey={(s) => s.id}
          action={universalSheetAction}
          emptyText="No files found"
          emptyDescription="Your personal and organization sheets will appear here."
          emptyIcon={<UniversalEmptyIcon />}
        />
      ) : (
        <>
          {filtered.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {filtered.map((sheet, index) => (
                <div
                  key={sheet.id}
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <div className="relative">
                    {sheet.source === "organization" &&
                      sheet.organizationName && (
                        <div className="absolute -top-2 left-3 z-10">
                          <Badge
                            variant="outline"
                            className="text-[10px] gap-1 py-0 px-1.5 h-4 bg-blue-50 border-blue-200 text-blue-700 shadow-sm"
                          >
                            <Building2 className="h-2.5 w-2.5" />
                            {sheet.organizationName}
                          </Badge>
                        </div>
                      )}
                    <SheetCard
                      id={sheet.id}
                      title={sheet.title}
                      lastEdited={sheet.lastModified || ""}
                      isStarred={sheet.is_starred}
                      templateId="default"
                      isOrganization={sheet.source === "organization"}
                      organizationName={sheet.organizationName}
                      folderName={sheet.folderName}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-14 animate-fade-in">
              <p className="text-muted-foreground text-sm">
                No files found matching your search.
              </p>
            </div>
          )}
        </>
      )}
    </>
  );
};

export default FilesList;
