"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SheetCard from "@/components/sheets/Sheet-card";
import { DataTable } from "@/components/common/Data-table";
import {
  recentColumns,
  recentAction,
  NoRecentSheetsIcon,
} from "@/data/tables/personalSheets/recentTableColumns";
import { Search, Filter, Grid3X3, List } from "lucide-react";

interface RecentListProps {
  recentSheets: any[];
}

const RecentList: React.FC<RecentListProps> = ({ recentSheets }) => {
  const [viewMode, setViewMode] = useState<"cards" | "table">("table");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSheets = useMemo(() => {
    return recentSheets.filter((sheet) => {
      return sheet.title.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [recentSheets, searchQuery]);

  return (
    <>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6 animate-slide-up">
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
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              setSearchQuery("");
            }}
            title="Reset filters"
          >
            <Filter className="h-4 w-4" />
          </Button>

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
          columns={recentColumns}
          rows={filteredSheets}
          getKey={(sheet) => sheet.id}
          action={recentAction}
          emptyText="No recent sheets"
          emptyDescription="Open or create a new sheet to see it here."
          emptyIcon={<NoRecentSheetsIcon />}
        />
      ) : (
        <>
          {filteredSheets.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredSheets.map((sheet, index) => (
                <div
                  key={sheet.id}
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <SheetCard
                    id={sheet.id}
                    title={sheet.title}
                    lastEdited={sheet.lastEdited}
                    isStarred={sheet.isStarred}
                    rows={sheet.rowsCount}
                    cols={sheet.colsCount}
                    templateId={sheet.templateId || "default"}
                    fileSizeKb={100}
                    isOrganization={sheet.isOrganization}
                    organizationName={sheet.organization?.name}
                    folderName={sheet.folder?.name}
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
