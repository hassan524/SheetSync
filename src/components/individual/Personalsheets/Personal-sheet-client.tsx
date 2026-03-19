"use client";

import { useState, useMemo, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { FolderWithSheets, Sheet } from "@/types";
import { mapFolders } from "@/lib/mappers/folder.mapper";

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
  initialFolders: any[];
}

const SheetsPageClient = ({ initialFolders }: Props) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const organizationId = useMemo(() => {
    const match = pathname.match(/^\/organizations\/([^/]+)/);
    return match ? match[1] : null;
  }, [pathname]);

  const [folders, setFolders] = useState<FolderWithSheets[]>(
    mapFolders(initialFolders)
  );

  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [sortBy, setSortBy] = useState("recent");

  const [newSheetOpen, setNewSheetOpen] = useState(false);
  const [newFolderOpen, setNewFolderOpen] = useState(false);

  const [filterSettings, setFilterSettings] = useState({
    onlyStarred: false,
  });

  useEffect(() => {
    const folderFromUrl = searchParams.get("folder");

    if (folderFromUrl) {
      setCurrentFolder(folderFromUrl);
    } else if (folders.length > 0) {
      setCurrentFolder(folders[0].id);
    }
  }, [folders, searchParams]);

  const handleFolderChange = (id: string) => {
    setCurrentFolder(id);
    router.replace(`${pathname}?folder=${id}`);
    setSearchQuery("");
  };

  const currentFolderData = useMemo(
    () => folders.find((f) => f.id === currentFolder),
    [folders, currentFolder]
  );

  const sheetsInView = currentFolderData?.sheets || [];

  const filteredSheets = useMemo(() => {
    return sheetsInView.filter((sheet) => {
      const matchSearch = sheet.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      const matchStar =
        !filterSettings.onlyStarred || sheet.is_starred;

      return matchSearch && matchStar;
    });
  }, [sheetsInView, searchQuery, filterSettings]);

  const sortedSheets = useMemo(() => {
    if (sortBy === "name") {
      return [...filteredSheets].sort((a, b) =>
        a.title.localeCompare(b.title)
      );
    }
    return filteredSheets;
  }, [filteredSheets, sortBy]);

  const totalSheets = useMemo(
    () => folders.reduce((acc, f) => acc + f.sheets.length, 0),
    [folders]
  );

  /* ------------------ ACTIONS ------------------ */

  const handleCreateFolder = async (name: string) => {
    try {
      const data = organizationId
        ? await createFolder(name, organizationId)
        : await createFolder(name);

      const newFolder: FolderWithSheets = {
        ...data,
        sheets: [],
      };

      setFolders((prev) => [...prev, newFolder]);
      setCurrentFolder(newFolder.id);
      setNewFolderOpen(false);

      toast.success(`Folder "${name}" created`);
    } catch {
      toast.error("Error creating folder");
    }
  };

  // ✅ FIXED (no fake data)
  const handleSheetCreated = (sheet: any, folderId: string) => {
    setFolders((prev) =>
      prev.map((f) =>
        f.id === folderId
          ? { ...f, sheets: [...f.sheets, sheet] }
          : f
      )
    );
  };

  return (
    <DashboardLayout
      breadcrumbItems={[
        "SheetSync",
        "Personal Sheets",
        currentFolderData?.name || "",
      ]}
    >
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="flex justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Personal Sheets</h1>
            <p className="text-muted-foreground">
              {folders.length} folders · {totalSheets} sheets
            </p>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => setNewFolderOpen(true)} variant="outline">
              <FolderPlus className="h-4 w-4 mr-2" />
              New Folder
            </Button>

            <Button onClick={() => setNewSheetOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Sheet
            </Button>
          </div>
        </div>

        {/* FILTERS */}
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Recent</SelectItem>
              <SelectItem value="name">Name</SelectItem>
            </SelectContent>
          </Select>

          <FilterPopover
            title="Filters"
            onApply={(f) => setFilterSettings(f as any)}
          />

          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
            <TabsList>
              <TabsTrigger value="grid">
                <Grid3X3 className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="table">
                <List className="h-4 w-4" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* FOLDERS */}
        <FoldersList
          folders={folders}
          currentFolder={currentFolder}
          onSelectFolder={handleFolderChange}
          onCreateFolder={() => setNewFolderOpen(true)}
        />

        {/* SHEETS */}
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
        folders={folders}
        currentFolder={currentFolder!}
        onSheetCreated={handleSheetCreated}
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