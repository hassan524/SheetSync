'use client'

import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OrganizationCard from "@/components/organizations/Organization-card";
import OrganizationsTable from "@/components/tables/Organizations-table";
import { Search, Grid3X3, List } from "lucide-react";
import { OrganizationTableData } from '@/types/organization.types';
import { Organization } from '@/types/organization.types';



interface OrganizationListProps {
  organizations: Organization[];
  tableData: OrganizationTableData[];
}

const OrganizationList: React.FC<OrganizationListProps> = ({
  organizations,
  tableData,
}) => {
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  return (
    <>
      {/* Search & View Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6 animate-slide-up">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search organizations..."
            className="pl-9"
          />
        </div>
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "grid" | "table")}>
          <TabsList className="h-9">
            <TabsTrigger value="grid" className="px-3">
              <Grid3X3 className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="table" className="px-3">
              <List className="h-4 w-4" />
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Organizations Grid/Table */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {organizations.map((org, index) => (
            <div key={org.name} style={{ animationDelay: `${index * 50}ms` }}>
              <OrganizationCard {...org} />
            </div>
          ))}
        </div>
      ) : (
        <OrganizationsTable organizations={tableData} />
      )}
    </>
  );
};

export default OrganizationList;