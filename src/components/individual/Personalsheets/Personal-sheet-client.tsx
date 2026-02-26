"use client";

import { useState, useMemo } from "react";
import { usePathname } from "next/navigation";

import { FolderItem } from "@/data/sheets";
import DashboardLayout from "@/components/layout/Dashboard-layout";
import NewSheetModal from "@/components/sheets/New-sheet-modal";
import FilterPopover from "@/components/common/Filter-popover";
import FoldersList from "./Folders-list";
import SheetsGrid from "./Sheets-grid";
import CreateFolderDialog from "./Create-folder-dialog";

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

import { Plus, Search, Grid3X3, List, FolderPlus } from "lucide-react";
import { toast } from "sonner";

import { createFolder } from "@/lib/querys/folder/folders";

interface Props {
  initialFolders: FolderItem[];
}

const SheetsPageClient = ({ initialFolders }: Props) => {
  const pathname = usePathname();

  // -------- Extract organizationId safely --------
  const organizationId = useMemo(() => {
    const match = pathname.match(/^\/organizations\/([^/]+)/);
    return match ? match[1] : null;
  }, [pathname]);

  // -------- State --------
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [newSheetOpen, setNewSheetOpen] = useState(false);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [sortBy, setSortBy] = useState("recent");

  const [folders, setFolders] = useState(initialFolders);
  const [currentFolder, setCurrentFolder] = useState<string | null>(
    initialFolders[0]?.id || null,
  );

  const [filterSettings, setFilterSettings] = useState({
    showPrivate: true,
    showTeam: true,
    showPublic: true,
    onlyStarred: false,
    onlyShared: false,
  });

  // -------- Derived Data (Optimized with useMemo) --------
  const currentFolderData = useMemo(
    () => folders.find((f) => f.id === currentFolder),
    [folders, currentFolder],
  );

  const sheetsInView = currentFolderData?.sheets || [];

  const filteredSheets = useMemo(() => {
    return sheetsInView.filter((sheet) => {
      const matchesSearch = sheet.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      const matchesVisibility =
        (sheet.visibility === "private" && filterSettings.showPrivate) ||
        (sheet.visibility === "team" && filterSettings.showTeam) ||
        (sheet.visibility === "public" && filterSettings.showPublic);

      const matchesStarred = !filterSettings.onlyStarred || sheet.isStarred;

      const matchesShared =
        !filterSettings.onlyShared ||
        (sheet.sharedWith && sheet.sharedWith > 0);

      return (
        matchesSearch && matchesVisibility && matchesStarred && matchesShared
      );
    });
  }, [sheetsInView, searchQuery, filterSettings]);

  const sortedSheets = useMemo(() => {
    const sorted = [...filteredSheets];

    if (sortBy === "name") {
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    }

    return sorted;
  }, [filteredSheets, sortBy]);

  const filteredFolders = useMemo(() => {
    return folders.filter((f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [folders, searchQuery]);

  const totalSheets = useMemo(() => {
    return folders.reduce((acc, f) => acc + (f.sheets?.length || 0), 0);
  }, [folders]);

  // -------- Actions --------
  const handleCreateFolder = async (name: string) => {
    try {
      const newFolderData = organizationId
        ? await createFolder(name, organizationId)
        : await createFolder(name); // no orgId passed

      const newFolder: FolderItem = {
        ...newFolderData,
        type: "folder",
        itemCount: 0,
        sheets: [],
        lastEdited: "Just now",
      };

      setFolders((prev) => [...prev, newFolder]);
      setCurrentFolder(newFolder.id);
      setNewFolderOpen(false);

      toast.success(`Folder "${name}" created`);
    } catch (err: any) {
      toast.error(err.message || "Error creating folder");
    }
  };

  const breadcrumbItems = useMemo(() => {
    if (!currentFolder) return ["SheetSync", "Personal Sheets"];

    return ["SheetSync", "Personal Sheets", currentFolderData?.name || ""];
  }, [currentFolder, currentFolderData]);

  // -------- UI --------
  return (
    <DashboardLayout breadcrumbItems={breadcrumbItems}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Personal Sheets</h1>
            <p className="text-muted-foreground">
              {folders.length} folders · {totalSheets} sheets
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setNewFolderOpen(true)}>
              <FolderPlus className="h-4 w-4 mr-2" />
              New Folder
            </Button>

            <Button onClick={() => setNewSheetOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Sheet
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search sheets & folders..."
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
                <TabsTrigger value="grid">
                  <Grid3X3 className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="table">
                  <List className="h-4 w-4" />
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Folders */}
        <div className="mb-8">
          <h2 className="text-sm font-medium text-muted-foreground mb-3">
            Folders
          </h2>

          <FoldersList
            folders={filteredFolders}
            currentFolder={currentFolder}
            onSelectFolder={(id) => {
              setCurrentFolder(id);
              setSearchQuery("");
            }}
            onCreateFolder={() => setNewFolderOpen(true)}
          />
        </div>

        {/* Sheets */}
        {currentFolder && (
          <SheetsGrid
            sheets={sortedSheets}
            viewMode={viewMode}
            searchQuery={searchQuery}
            folderName={currentFolderData?.name || ""}
            onNewSheet={() => setNewSheetOpen(true)}
          />
        )}
      </div>

      <NewSheetModal
        open={newSheetOpen}
        onOpenChange={setNewSheetOpen}
        ShowSaveTo={false}
      />

      <CreateFolderDialog
        open={newFolderOpen}
        onOpenChange={setNewFolderOpen}
        onConfirm={handleCreateFolder}
      />
    </DashboardLayout>
  );
};

export default SheetsPageClient;
