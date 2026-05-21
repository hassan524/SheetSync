"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
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
import { Search, RotateCcw, Grid3X3, List } from "lucide-react";
import { getInitials } from "@/lib/utils";

interface RecentListProps {
  recentSheets: any[];
}

const RecentList: React.FC<RecentListProps> = ({ recentSheets }) => {
  const [viewMode, setViewMode] = useState<"cards" | "table">("table");
  const [searchQuery, setSearchQuery] = useState("");

  const tableRows: UniversalSheetRow[] = useMemo(
    () =>
      (recentSheets ?? []).map((s: any) => ({
        id: s.id,
        title: s.title,
        is_starred: s.isStarred ?? s.is_starred,
        source:
          s.isOrganization || s.organization_id ? "organization" : "personal",
        organizationName: s.organization?.name ?? s.organizationName ?? null,
        organizationId: s.organization?.id ?? s.organization_id ?? null,
        folderName: s.folder?.name ?? s.folderName ?? null,
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
        collaborators: s.collaborators ?? 0,
        rows: s.rowsCount ?? s.rows,
        columns: s.colsCount ?? s.columns,
        visibility: s.visibility,
        activeEditors: s.activeEditors,
      })),
    [recentSheets],
  );

  const filteredSheets = useMemo(
    () =>
      tableRows.filter((sheet) =>
        sheet.title.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [tableRows, searchQuery],
  );

  return (
    <>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-5 animate-slide-up">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search recent sheets..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          {searchQuery && (
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={() => setSearchQuery("")}
              title="Clear search"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          )}

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
          rows={filteredSheets}
          getKey={(sheet) => sheet.id}
          action={universalSheetAction}
          emptyText="No recent sheets"
          emptyDescription="Open or edit a sheet to see it here."
          emptyIcon={<UniversalEmptyIcon />}
        />
      ) : (
        <>
          {filteredSheets.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {filteredSheets.map((sheet, index) => (
                <div
                  key={sheet.id}
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <SheetCard
                    id={sheet.id}
                    title={sheet.title}
                    lastEdited={sheet.lastModified || ""}
                    isStarred={sheet.is_starred}
                    rows={sheet.rows}
                    cols={sheet.columns}
                    templateId="default"
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
                No recent sheets found matching your search.
              </p>
            </div>
          )}
        </>
      )}
    </>
  );
};

export default RecentList;

