"use client";

import { useState } from "react";
import DashboardLayout from "@/components/layout/Dashboard-layout";
import SheetCard from "@/components/sheets/Sheet-card";
import NewSheetModal from "@/components/sheets/New-sheet-modal";
import SheetsTable from "@/components/tables/Sheets-table";
import FilterPopover from "@/components/common/Filter-popover";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Search,
  Grid3X3,
  List,
  Folder,
  FolderPlus,
  ChevronRight,
  Home,
  FileSpreadsheet,
} from "lucide-react";
import { toast } from "sonner";

interface FolderItem {
  id: string;
  name: string;
  type: "folder";
  itemCount: number;
  lastEdited: string;
}

interface SheetItem {
  id: string;
  title: string;
  lastEdited: string;
  isStarred: boolean;
  sharedWith?: number;
  owner: { name: string; initials: string; avatar?: string };
  visibility: "private" | "team" | "public";
  lastModifiedBy: string;
  collaborators: number;
  activeEditors: number;
  size: string;
  folder?: string;
}

const initialFolders: FolderItem[] = [
  {
    id: "f1",
    name: "Project Alpha",
    type: "folder",
    itemCount: 3,
    lastEdited: "1 hour ago",
  },
  {
    id: "f2",
    name: "Finance",
    type: "folder",
    itemCount: 5,
    lastEdited: "2 days ago",
  },
  {
    id: "f3",
    name: "Marketing",
    type: "folder",
    itemCount: 2,
    lastEdited: "1 week ago",
  },
];

const allSheets: SheetItem[] = [
  {
    id: "1",
    title: "Q4 Financial Report",
    lastEdited: "2 hours ago",
    isStarred: true,
    sharedWith: 5,
    owner: { name: "You", initials: "JD" },
    visibility: "private",
    lastModifiedBy: "You",
    collaborators: 5,
    activeEditors: 2,
    size: "1.2 MB",
    folder: "f2",
  },
  {
    id: "2",
    title: "Marketing Budget 2024",
    lastEdited: "Yesterday",
    isStarred: false,
    sharedWith: 3,
    owner: { name: "You", initials: "JD" },
    visibility: "team",
    lastModifiedBy: "Sarah Johnson",
    collaborators: 3,
    activeEditors: 0,
    size: "856 KB",
    folder: "f3",
  },
  {
    id: "3",
    title: "Team Roster",
    lastEdited: "3 days ago",
    isStarred: true,
    owner: { name: "You", initials: "JD" },
    visibility: "team",
    lastModifiedBy: "Michael Chen",
    collaborators: 8,
    activeEditors: 1,
    size: "324 KB",
    folder: "f1",
  },
  {
    id: "4",
    title: "Product Roadmap",
    lastEdited: "1 week ago",
    sharedWith: 12,
    owner: { name: "Emily Davis", initials: "ED" },
    visibility: "team",
    lastModifiedBy: "You",
    collaborators: 12,
    activeEditors: 3,
    isStarred: false,
    size: "2.1 MB",
    folder: "f1",
  },
  {
    id: "5",
    title: "Expense Tracker",
    lastEdited: "2 weeks ago",
    owner: { name: "You", initials: "JD" },
    visibility: "private",
    lastModifiedBy: "You",
    collaborators: 0,
    activeEditors: 0,
    isStarred: false,
    size: "156 KB",
    folder: "f2",
  },
  {
    id: "6",
    title: "Customer List",
    lastEdited: "3 weeks ago",
    sharedWith: 2,
    owner: { name: "You", initials: "JD" },
    visibility: "team",
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
    visibility: "private",
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
    visibility: "team",
    lastModifiedBy: "Olivia Martinez",
    collaborators: 8,
    activeEditors: 1,
    isStarred: false,
    size: "567 KB",
    folder: "f1",
  },
];

const SheetsPage = () => {
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [newSheetOpen, setNewSheetOpen] = useState(false);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [folders, setFolders] = useState(initialFolders);
  const [filterSettings, setFilterSettings] = useState({
    showPrivate: true,
    showTeam: true,
    showPublic: true,
    onlyStarred: false,
    onlyShared: false,
  });

  const currentFolderData = folders.find((f) => f.id === currentFolder);

  // Get sheets for current view
  const sheetsInView = allSheets.filter((s) => {
    if (currentFolder) return s.folder === currentFolder;
    return !s.folder; // root level sheets (no folder)
  });

  const filteredSheets = sheetsInView.filter((sheet) => {
    const matchesSearch = sheet.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesVisibility =
      (sheet.visibility === "private" && filterSettings.showPrivate) ||
      (sheet.visibility === "team" && filterSettings.showTeam) ||
      (filterSettings.showPublic ?? true);
    const matchesStarred = !filterSettings.onlyStarred || sheet.isStarred;
    const matchesShared =
      !filterSettings.onlyShared || (sheet.sharedWith && sheet.sharedWith > 0);
    return (
      matchesSearch && matchesVisibility && matchesStarred && matchesShared
    );
  });

  const filteredFolders = currentFolder
    ? []
    : folders.filter((f) =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase()),
      );

  const sortedSheets = [...filteredSheets].sort((a, b) => {
    if (sortBy === "name") return a.title.localeCompare(b.title);
    return 0;
  });

  const tableData = sortedSheets.map((s) => ({
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

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    const newFolder: FolderItem = {
      id: `f${Date.now()}`,
      name: newFolderName.trim(),
      type: "folder",
      itemCount: 0,
      lastEdited: "Just now",
    };
    setFolders((prev) => [...prev, newFolder]);
    setNewFolderName("");
    setNewFolderOpen(false);
    toast.success(`Folder "${newFolder.name}" created`);
  };

  const breadcrumbItems = currentFolder
    ? ["SheetSync", "Personal Sheets", currentFolderData?.name || ""]
    : ["SheetSync", "Personal Sheets"];

  return (
    <DashboardLayout breadcrumbItems={breadcrumbItems}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-semibold animate-fade-in">
              {currentFolder ? currentFolderData?.name : "Personal Sheets"}
            </h1>
            <p className="text-muted-foreground animate-fade-in">
              {currentFolder
                ? `${sortedSheets.length} sheets in this folder`
                : `${folders.length} folders · ${sheetsInView.length} sheets`}
            </p>
          </div>
          <div className="flex items-center gap-2 animate-fade-in">
            {!currentFolder && (
              <Button variant="outline" onClick={() => setNewFolderOpen(true)}>
                <FolderPlus className="h-4 w-4 mr-2" />
                New Folder
              </Button>
            )}
            <Button onClick={() => setNewSheetOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Sheet
            </Button>
          </div>
        </div>

        {/* Folder breadcrumb navigation */}
        {currentFolder && (
          <div className="flex items-center gap-1.5 mb-5 text-sm animate-fade-in">
            <button
              onClick={() => setCurrentFolder(null)}
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Home className="h-3.5 w-3.5" />
              <span>Sheets</span>
            </button>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-medium">{currentFolderData?.name}</span>
          </div>
        )}

        {/* Filters Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6 animate-slide-up">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={
                currentFolder
                  ? "Search in folder..."
                  : "Search sheets & folders..."
              }
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
              onApply={(filters) =>
                setFilterSettings(filters as typeof filterSettings)
              }
            />
            <Tabs
              value={viewMode}
              onValueChange={(v) => setViewMode(v as "grid" | "table")}
            >
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

        {/* Folders Grid (only at root level) */}
        {!currentFolder && filteredFolders.length > 0 && (
          <div className="mb-6 animate-fade-in">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              Folders
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredFolders.map((folder, index) => (
                <button
                  key={folder.id}
                  onClick={() => {
                    setCurrentFolder(folder.id);
                    setSearchQuery("");
                  }}
                  className="group flex items-center gap-3 p-3.5 rounded-lg border border-border bg-card hover:border-primary/30 hover:shadow-sm transition-all duration-200 text-left animate-scale-in"
                  style={{ animationDelay: `${index * 40}ms` }}
                >
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/15 transition-colors">
                    <Folder className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">
                      {folder.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {folder.itemCount} items · {folder.lastEdited}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Sheets section label when at root with folders */}
        {!currentFolder &&
          filteredFolders.length > 0 &&
          sortedSheets.length > 0 && (
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              Sheets
            </h3>
          )}

        {/* Sheets Grid/Table */}
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sortedSheets.map((sheet, index) => (
              <div key={sheet.id} style={{ animationDelay: `${index * 30}ms` }}>
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
          <SheetsTable sheets={tableData} />
        )}

        {sortedSheets.length === 0 && filteredFolders.length === 0 && (
          <div className="text-center py-16 animate-fade-in">
            <div className="h-14 w-14 rounded-xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <FileSpreadsheet className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-medium">
              {searchQuery
                ? "No results found"
                : currentFolder
                  ? "This folder is empty"
                  : "No sheets yet"}
            </p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              {searchQuery
                ? "Try a different search term"
                : "Create a new sheet to get started"}
            </p>
          </div>
        )}
      </div>

      <NewSheetModal open={newSheetOpen} onOpenChange={setNewSheetOpen} />

      {/* Create Folder Dialog */}
      <Dialog open={newFolderOpen} onOpenChange={setNewFolderOpen}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Folder className="h-5 w-5 text-primary" />
              New Folder
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="folderName" className="text-sm">
              Folder name
            </Label>
            <Input
              id="folderName"
              placeholder="e.g. Project Alpha"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewFolderOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateFolder}
              disabled={!newFolderName.trim()}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default SheetsPage;
