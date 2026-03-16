"use client";

import { useState } from "react";
import DashboardLayout from "@/components/layout/Dashboard-layout";
import SheetsTable from "@/components/tables/Sheets-table";
import SheetCard from "@/components/sheets/Sheet-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Search, Grid3X3, List, Filter } from "lucide-react";

const recentSheets = [
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
    id: "2",
    title: "Marketing Budget 2024",
    owner: { name: "Sarah Johnson", initials: "SJ" },
    visibility: "team" as const,
    lastModified: "4 hours ago",
    lastModifiedBy: "Sarah Johnson",
    collaborators: 3,
    activeEditors: 0,
    isStarred: false,
    size: "856 KB",
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
    id: "4",
    title: "Product Roadmap",
    owner: { name: "Emily Davis", initials: "ED" },
    visibility: "team" as const,
    lastModified: "2 days ago",
    lastModifiedBy: "You",
    collaborators: 12,
    activeEditors: 3,
    isStarred: false,
    size: "2.1 MB",
  },
  {
    id: "5",
    title: "Expense Tracker",
    owner: { name: "You", initials: "JD" },
    visibility: "private" as const,
    lastModified: "3 days ago",
    lastModifiedBy: "You",
    collaborators: 0,
    activeEditors: 0,
    isStarred: false,
    size: "156 KB",
  },
];

const cardData = recentSheets.map((s) => ({
  title: s.title,
  lastEdited: s.lastModified,
  isStarred: s.isStarred,
  sharedWith: s.collaborators,
}));

const RecentPage = () => {
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <DashboardLayout breadcrumbItems={["SheetSync", "Recent"]}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold animate-fade-in">Recent</h1>
              <p className="text-muted-foreground animate-fade-in">
                Sheets you've recently opened or edited
              </p>
            </div>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6 animate-slide-up">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search recent sheets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
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
        </div>

        {/* Content */}
        {viewMode === "table" ? (
          <SheetsTable sheets={recentSheets} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {cardData.map((sheet, index) => (
              <div
                key={sheet.title}
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <SheetCard {...sheet} />
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default RecentPage;
