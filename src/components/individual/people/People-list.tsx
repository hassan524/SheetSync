"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PersonCard from "@/components/people/Person-card";
import { DataTable } from "@/components/common/Data-table";
import {
  peopleColumns,
  peopleAction,
} from "@/data/tables/columns/peopleTableColumns";
import { Search, Filter, Grid3X3, List, UserX } from "lucide-react";
import type { PersonData } from "@/lib/querys/people/people";

interface PeopleListProps {
  people: PersonData[];
  organizations: { id: string; name: string }[];
}

const PeopleList: React.FC<PeopleListProps> = ({
  people,
  organizations,
}) => {
  const [viewMode, setViewMode] = useState<"cards" | "table">("table");
  const [searchQuery, setSearchQuery] = useState("");
  const [orgFilter, setOrgFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all-status");

  const filteredPeople = useMemo(() => {
    return people.filter((person) => {
      const matchesSearch =
        person.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        person.email.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesOrg =
        orgFilter === "all" ||
        person.organizations.some((org) =>
          org.toLowerCase().includes(orgFilter.toLowerCase())
        );

      const matchesStatus =
        statusFilter === "all-status" || person.status === statusFilter;

      return matchesSearch && matchesOrg && matchesStatus;
    });
  }, [people, searchQuery, orgFilter, statusFilter]);

  const uniqueOrgs = useMemo(() => {
    const seen = new Set<string>();
    return organizations.filter((org) => {
      if (seen.has(org.name)) return false;
      seen.add(org.name);
      return true;
    });
  }, [organizations]);

  return (
    <>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6 animate-slide-up overflow-hidden">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search people..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Organization Filter */}
          <Select value={orgFilter} onValueChange={setOrgFilter}>
            <SelectTrigger className="w-36 sm:w-40">
              <SelectValue placeholder="All Organizations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Organizations</SelectItem>
              {uniqueOrgs.map((org) => (
                <SelectItem key={org.id} value={org.name.toLowerCase()}>
                  {org.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-28 sm:w-32">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-status">All Status</SelectItem>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="away">Away</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
            </SelectContent>
          </Select>

          {/* Reset Filters */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              setOrgFilter("all");
              setStatusFilter("all-status");
              setSearchQuery("");
            }}
            title="Reset filters"
            className="shrink-0"
          >
            <Filter className="h-4 w-4" />
          </Button>

          {/* View Toggle */}
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

      {/* Table View */}
      {viewMode === "table" ? (
        <DataTable
          columns={peopleColumns}
          rows={filteredPeople}
          getKey={(person) => person.id}
          action={peopleAction}
          emptyText="No people found"
          emptyDescription="Invite team members to collaborate on your sheets."
          emptyIcon={<UserX className="h-10 w-10 text-muted-foreground" />}
        />
      ) : (
        /* Cards View */
        <>
          {filteredPeople.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPeople.map((person, index) => (
                <div
                  key={person.email}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <PersonCard {...person} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 animate-fade-in">
              <p className="text-muted-foreground">
                No people found matching your filters.
              </p>
            </div>
          )}
        </>
      )}
    </>
  );
};

export default PeopleList;
