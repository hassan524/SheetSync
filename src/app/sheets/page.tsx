'use client'

import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import SheetCard from "@/components/sheets/SheetCard";
import NewSheetModal from "@/components/sheets/NewSheetModal";
import SheetsTable from "@/components/tables/SheetsTable";
import FilterPopover from "@/components/common/FilterPopover";
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
import { Plus, Search, Grid3X3, List } from "lucide-react";

const allSheets = [
  { 
    id: "1",
    title: "Q4 Financial Report", 
    lastEdited: "2 hours ago", 
    isStarred: true, 
    sharedWith: 5,
    owner: { name: "You", initials: "JD" },
    visibility: "private" as const,
    lastModifiedBy: "You",
    collaborators: 5,
    activeEditors: 2,
    size: "1.2 MB",
  },
  { 
    id: "2",
    title: "Marketing Budget 2024", 
    lastEdited: "Yesterday", 
    isStarred: false, 
    sharedWith: 3,
    owner: { name: "You", initials: "JD" },
    visibility: "team" as const,
    lastModifiedBy: "Sarah Johnson",
    collaborators: 3,
    activeEditors: 0,
    size: "856 KB",
  },
  { 
    id: "3",
    title: "Team Roster", 
    lastEdited: "3 days ago", 
    isStarred: true,
    owner: { name: "You", initials: "JD" },
    visibility: "team" as const,
    lastModifiedBy: "Michael Chen",
    collaborators: 8,
    activeEditors: 1,
    size: "324 KB",
  },
  { 
    id: "4",
    title: "Product Roadmap", 
    lastEdited: "1 week ago", 
    sharedWith: 12,
    owner: { name: "Emily Davis", initials: "ED" },
    visibility: "team" as const,
    lastModifiedBy: "You",
    collaborators: 12,
    activeEditors: 3,
    isStarred: false,
    size: "2.1 MB",
  },
  { 
    id: "5",
    title: "Expense Tracker", 
    lastEdited: "2 weeks ago",
    owner: { name: "You", initials: "JD" },
    visibility: "private" as const,
    lastModifiedBy: "You",
    collaborators: 0,
    activeEditors: 0,
    isStarred: false,
    size: "156 KB",
  },
  { 
    id: "6",
    title: "Customer List", 
    lastEdited: "3 weeks ago", 
    sharedWith: 2,
    owner: { name: "You", initials: "JD" },
    visibility: "team" as const,
    lastModifiedBy: "James Wilson",
    collaborators: 2,
    activeEditors: 0,
    isStarred: false,
    size: "445 KB",
  },
  { 
    id: "7",
    title: "Inventory Management", 
    lastEdited: "1 month ago", 
    isStarred: true,
    owner: { name: "You", initials: "JD" },
    visibility: "private" as const,
    lastModifiedBy: "You",
    collaborators: 0,
    activeEditors: 0,
    size: "1.8 MB",
  },
  { 
    id: "8",
    title: "Employee Schedule", 
    lastEdited: "1 month ago", 
    sharedWith: 8,
    owner: { name: "Olivia Martinez", initials: "OM" },
    visibility: "team" as const,
    lastModifiedBy: "Olivia Martinez",
    collaborators: 8,
    activeEditors: 1,
    isStarred: false,
    size: "567 KB",
  },
];

const tableData = allSheets.map(s => ({
  id: s.id,
  title: s.title,
  owner: s.owner,
  visibility: s.visibility,
  lastModified: s.lastEdited,
  lastModifiedBy: s.lastModifiedBy,
  collaborators: s.collaborators,
  activeEditors: s.activeEditors,
  isStarred: s.isStarred,
  size: s.size,
}));

const SheetsPage = () => {
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [newSheetOpen, setNewSheetOpen] = useState(false);
  const [sortBy, setSortBy] = useState("recent");
  const [filterSettings, setFilterSettings] = useState({
    showPrivate: true,
    showTeam: true,
    showPublic: true,
    onlyStarred: false,
    onlyShared: false,
  });

  const filteredSheets = allSheets.filter((sheet) => {
    const matchesSearch = sheet.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesVisibility = 
      (sheet.visibility === "private" && filterSettings.showPrivate) ||
      (sheet.visibility === "team" && filterSettings.showTeam) ||
      (filterSettings.showPublic ?? true);
    const matchesStarred = !filterSettings.onlyStarred || sheet.isStarred;
    const matchesShared = !filterSettings.onlyShared || (sheet.sharedWith && sheet.sharedWith > 0);
    
    return matchesSearch && matchesVisibility && matchesStarred && matchesShared;
  });

  const sortedSheets = [...filteredSheets].sort((a, b) => {
    if (sortBy === "name") return a.title.localeCompare(b.title);
    return 0; // 'recent' maintains original order
  });

  const filteredTableData = tableData.filter((sheet) => {
    const matchesSearch = sheet.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesVisibility = 
      (sheet.visibility === "private" && filterSettings.showPrivate) ||
      (sheet.visibility === "team" && filterSettings.showTeam) ||
      (filterSettings.showPublic ?? true);
    const matchesStarred = !filterSettings.onlyStarred || sheet.isStarred;
    const matchesShared = !filterSettings.onlyShared || sheet.collaborators > 0;
    
    return matchesSearch && matchesVisibility && matchesStarred && matchesShared;
  });

  return (
    <DashboardLayout breadcrumbItems={["SheetSync", "Personal Sheets"]}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-semibold animate-fade-in">Personal Sheets</h1>
            <p className="text-muted-foreground animate-fade-in">
              {sortedSheets.length} sheets in your personal workspace
            </p>
          </div>
          <Button className="animate-fade-in" onClick={() => setNewSheetOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Sheet
          </Button>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6 animate-slide-up">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search sheets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-2">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="created">Date Created</SelectItem>
              </SelectContent>
            </Select>

            <FilterPopover 
              title="Filter Sheets"
              onApply={(filters) => setFilterSettings(filters as typeof filterSettings)}
            />

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
        </div>

        {/* Sheets Grid/Table */}
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sortedSheets.map((sheet, index) => (
              <div key={sheet.title} style={{ animationDelay: `${index * 30}ms` }}>
                <SheetCard 
                  title={sheet.title}
                  lastEdited={sheet.lastEdited}
                  isStarred={sheet.isStarred}
                  sharedWith={sheet.sharedWith}
                />
              </div>
            ))}
          </div>
        ) : (
          <SheetsTable sheets={filteredTableData} />
        )}

        {sortedSheets.length === 0 && (
          <div className="text-center py-12 animate-fade-in">
            <p className="text-muted-foreground">No sheets found matching your search.</p>
          </div>
        )}
      </div>

      <NewSheetModal open={newSheetOpen} onOpenChange={setNewSheetOpen} />
    </DashboardLayout>
  );
};

export default SheetsPage;
