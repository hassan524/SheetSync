"use client";

import React, { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SheetCard from "@/components/sheets/Sheet-card";
import { DataTable } from "@/components/common/Data-table";
import {
  starredColumns,
  StarredAction,
  NoStarredSheetsIcon,
} from "@/data/tables/columns/starredTableColumns";
import type { UniversalSheetRow } from "@/data/tables/universalSheetColumns";
import { Search, Grid3X3, List } from "lucide-react";
import { getInitials } from "@/lib/utils";

interface StarredListProps {
  starredSheets: any[];
}

const StarredList: React.FC<StarredListProps> = ({
  starredSheets: initial,
}) => {
  const [viewMode, setViewMode] = useState<"cards" | "table">("table");
  const [searchQuery, setSearchQuery] = useState("");
  const [sheets, setSheets] = useState(initial);

  const tableRows: UniversalSheetRow[] = useMemo(
    () =>
      sheets.map((s: any) => ({
        id: s.id,
        title: s.title,
        is_starred: true,
        source:
          s.isOrganization || s.organization_id
            ? ("organization" as const)
            : ("personal" as const),
        organizationName: s.organization?.name ?? null,
        owner: s.owner ?? { name: "You", initials: "ME" },
        members: (s.organization?.members ?? s.organizationMembers ?? []).map(
          (member: any) => ({
            id: member.id,
            name: member.name,
            email: member.email,
            avatar: member.avatar,
            initials: getInitials(member.name ?? member.email ?? "Member"),
            status: member.status,
          }),
        ),
        lastModified: s.lastEdited ?? s.updated_at,
        createdAt: s.createdAt ?? s.created_at,
        rows: s.rowsCount ?? s.rows,
        columns: s.colsCount ?? s.columns,
        folderName: s.folder?.name ?? null,
        templateId: s.templateId,
      })),
    [sheets],
  );

  const filtered = useMemo(
    () =>
      tableRows.filter((s) =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [tableRows, searchQuery],
  );

  const handleUnstar = (id: string) => {
    setSheets((prev) => prev.filter((s) => s.id !== id));
  };

  const action = StarredAction({ onUnstar: handleUnstar });

  return (
    <>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search starred sheets..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
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

      {viewMode === "table" ? (
        <DataTable
          columns={starredColumns}
          rows={filtered}
          getKey={(s) => s.id}
          action={action}
          emptyText="No starred sheets"
          emptyDescription="Star a sheet from the editor or context menu to pin it here."
          emptyIcon={<NoStarredSheetsIcon />}
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
                  <SheetCard
                    id={sheet.id}
                    title={sheet.title}
                    lastEdited={sheet.lastModified ?? ""}
                    isStarred={true}
                    rows={sheet.rows}
                    cols={sheet.columns}
                    templateId={sheet.templateId || "default"}
                    isOrganization={sheet.source === "organization"}
                    organizationName={sheet.organizationName}
                    folderName={sheet.folderName}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 animate-fade-in">
              <p className="text-muted-foreground">
                No starred sheets found matching your search.
              </p>
            </div>
          )}
        </>
      )}
    </>
  );
};

export default StarredList;

