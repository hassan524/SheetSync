"use client";

import { useState } from "react";
import DashboardLayout from "@/components/layout/Dashboard-layout";
import SheetsTable from "@/components/tables/Sheets-table";
import SheetCard from "@/components/sheets/Sheet-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, Search, Grid3X3, List, Info } from "lucide-react";

const starredSheets = [
  {
    id: "1",
    title: "Q4 Financial Report",
    owner: { name: "You", initials: "JD" },
    visibility: "private" as const,
    lastModified: "2 hours ago",
    lastModifiedBy: "You",
    collaborators: 5,
    activeEditors: 2,
    isStarred: true,
    size: "1.2 MB",
  },
  {
    id: "3",
    title: "Team Roster",
    owner: { name: "You", initials: "JD" },
    visibility: "team" as const,
    lastModified: "Yesterday",
    lastModifiedBy: "Michael Chen",
    collaborators: 8,
    activeEditors: 1,
    isStarred: true,
    size: "324 KB",
  },
  {
    id: "6",
    title: "Client Contacts",
    owner: { name: "Emily Davis", initials: "ED" },
    visibility: "team" as const,
    lastModified: "1 week ago",
    lastModifiedBy: "Emily Davis",
    collaborators: 6,
    activeEditors: 0,
    isStarred: true,
    size: "445 KB",
  },
  {
    id: "7",
    title: "Inventory Management",
    owner: { name: "You", initials: "JD" },
    visibility: "private" as const,
    lastModified: "2 weeks ago",
    lastModifiedBy: "You",
    collaborators: 0,
    activeEditors: 0,
    isStarred: true,
    size: "1.8 MB",
  },
];

const cardData = starredSheets.map((s) => ({
  id: s.id,
  title: s.title,
  lastEdited: s.lastModified,
  isStarred: s.isStarred,
  sharedWith: s.collaborators,
  templateId: "f628aed8-bca7-4f51-b687-6db9f932be34",
  fileSizeKb: parseInt(s.size) || 100,
}));

const StarredPage = () => {
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = starredSheets.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <DashboardLayout breadcrumbItems={["SheetSync", "Starred"]}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center flex-shrink-0">
              <Star className="h-5 w-5 text-amber-500 fill-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Starred</h1>
              <p className="text-sm text-muted-foreground">
                Sheets you&apos;ve marked as important — quick access to what matters most
              </p>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3">
          <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <p className="text-xs text-muted-foreground">
            Star any sheet from the sheet view or right-click menu to pin it here. Starred sheets appear across your personal folders and organizations.
          </p>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Starred Total", value: starredSheets.length },
            { label: "Private", value: starredSheets.filter((s) => s.visibility === "private").length },
            { label: "Shared", value: starredSheets.filter((s) => s.visibility === "team").length },
            { label: "Active Editors", value: starredSheets.reduce((a, s) => a + s.activeEditors, 0) },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl border border-border bg-card px-4 py-3">
              <p className="text-lg font-bold">{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Filters Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search starred sheets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Tabs
            value={viewMode}
            onValueChange={(v) => setViewMode(v as "grid" | "table")}
          >
            <TabsList className="h-9">
              <TabsTrigger value="table" className="px-3">
                <List className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="grid" className="px-3">
                <Grid3X3 className="h-4 w-4" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Content */}
        {viewMode === "table" ? (
          <SheetsTable sheets={filtered as any} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {cardData
              .filter((s) =>
                s.title.toLowerCase().includes(searchQuery.toLowerCase()),
              )
              .map((sheet, index) => (
                <div key={sheet.id} style={{ animationDelay: `${index * 30}ms` }}>
                  <SheetCard {...sheet} />
                </div>
              ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StarredPage;
