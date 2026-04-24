import { useState } from "react";
import DashboardLayout from "@/components/layout/Dashboard-layout";
import SheetsTable from "@/components/tables/Sheets-table";
import SheetCard from "@/components/sheets/Sheet-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, Search, Grid3X3, List, Filter } from "lucide-react";

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
  title: s.title,
  lastEdited: s.lastModified,
  isStarred: s.isStarred,
  sharedWith: s.collaborators,
}));

const StarredPage = () => {
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <DashboardLayout breadcrumbItems={["SheetSync", "Starred"]}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-warning/20 flex items-center justify-center">
              <Star className="h-5 w-5 text-warning fill-warning" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold animate-fade-in">
                Starred
              </h1>
              <p className="text-muted-foreground animate-fade-in">
                {starredSheets.length} sheets marked as important
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
              placeholder="Search starred sheets..."
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
          <SheetsTable sheets={starredSheets} />
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

export default StarredPage;
