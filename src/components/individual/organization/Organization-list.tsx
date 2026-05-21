"use client";

import React, { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OrganizationCard from "@/components/organizations/Organization-card";
import { DataTable } from "@/components/common/Data-table";
import {
  organizationColumns,
  organizationAction,
  NoOrganizationsIcon,
} from "@/data/tables/columns/organizationTableColumns";
import { Search, Grid3X3, List, X } from "lucide-react";
import { OrganizationTableData, Organization } from "@/types";

interface OrganizationListProps {
  organizations: Organization[];
  tableData: OrganizationTableData[];
}

const OrganizationList: React.FC<OrganizationListProps> = ({
  organizations,
  tableData,
}) => {
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredOrgs = useMemo(
    () =>
      organizations.filter((org) =>
        org.name.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [organizations, searchQuery],
  );

  const filteredTableData = useMemo(
    () =>
      tableData.filter((org) =>
        org.name.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [tableData, searchQuery],
  );

  return (
    <div className="space-y-5">
      {/* ── SECTION HEADING ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-medium">Your Organizations</h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {organizations.length} organization
            {organizations.length !== 1 ? "s" : ""} · select one to manage
          </p>
        </div>
      </div>

      {/* ── TOOLBAR ── */}
      <div className="flex items-center justify-between">
        <div className="relative w-36 sm:w-52">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-7 h-8 text-xs sm:text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        <Tabs
          value={viewMode}
          onValueChange={(v) => setViewMode(v as "grid" | "table")}
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
      </div>

      {/* ── GRID / TABLE ── */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrgs.length > 0 ? (
            filteredOrgs.map((org, index) => (
              <div key={org.name} style={{ animationDelay: `${index * 50}ms` }}>
                <OrganizationCard {...org} />
              </div>
            ))
          ) : (
            <div className="col-span-3 flex flex-col items-center justify-center gap-3 py-16 text-center">
              <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                <Search className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">No organizations found</p>
                <p className="text-xs text-muted-foreground">
                  Try a different search term
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <DataTable
          columns={organizationColumns}
          rows={filteredTableData}
          getKey={(org) => org.id}
          action={organizationAction}
          emptyText="No organizations found"
          emptyDescription="Try a different search term or create a new organization."
          emptyIcon={<NoOrganizationsIcon />}
        />
      )}
    </div>
  );
};

export default OrganizationList;

