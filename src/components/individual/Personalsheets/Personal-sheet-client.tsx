"use client";

import { useState, useMemo, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { FolderWithSheets } from "@/types";
import { mapFolders } from "@/lib/mappers/folder.mapper";

import DashboardLayout from "@/components/layout/Dashboard-layout";
import NewSheetModal from "@/components/sheets/New-sheet-modal";
import FoldersList from "./Folders-list";
import SheetsGrid from "./Sheets-grid";
import CreateFolderDialog from "./Create-folder-dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  Plus,
  Search,
  Grid3X3,
  List,
  FolderPlus,
  Star,
  X,
  FileSpreadsheet,
  Clock4,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
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
    mapFolders(initialFolders),
  );
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [onlyStarred, setOnlyStarred] = useState(false);
  const [newSheetOpen, setNewSheetOpen] = useState(false);
  const [newFolderOpen, setNewFolderOpen] = useState(false);

  useEffect(() => {
    const folderFromUrl = searchParams.get("folder");
    if (folderFromUrl) setCurrentFolder(folderFromUrl);
    else if (folders.length > 0) setCurrentFolder(folders[0].id);
  }, [folders, searchParams]);

  const handleFolderChange = (id: string) => {
    setCurrentFolder(id);
    router.replace(`${pathname}?folder=${id}`);
    setSearchQuery("");
    setOnlyStarred(false);
  };

  const currentFolderData = useMemo(
    () => folders.find((f) => f.id === currentFolder),
    [folders, currentFolder],
  );

  const allSheets = currentFolderData?.sheets || [];

  const filteredSheets = useMemo(() => {
    return allSheets.filter((sheet) => {
      const matchSearch = sheet.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchStar = !onlyStarred || sheet.is_starred;
      return matchSearch && matchStar;
    });
  }, [allSheets, searchQuery, onlyStarred]);

  const totalSheets = useMemo(
    () => folders.reduce((acc, f) => acc + f.sheets.length, 0),
    [folders],
  );

  const starredCount = useMemo(
    () => allSheets.filter((s) => s.is_starred).length,
    [allSheets],
  );
  const recentCount = useMemo(() => {
    const threeDaysAgo = Date.now() - 1000 * 60 * 60 * 72;
    return allSheets.filter(
      (s) => s.updated_at && new Date(s.updated_at).getTime() > threeDaysAgo,
    ).length;
  }, [allSheets]);

  const handleCreateFolder = async (name: string) => {
    try {
      const data = organizationId
        ? await createFolder(name, organizationId)
        : await createFolder(name);
      const newFolder: FolderWithSheets = { ...data, sheets: [] };
      setFolders((prev) => [...prev, newFolder]);
      setCurrentFolder(newFolder.id);
      setNewFolderOpen(false);
      toast.success(`"${name}" created`);
    } catch {
      toast.error("Failed to create folder");
    }
  };

  const handleSheetCreated = (sheet: any, folderId: string) => {
    setFolders((prev) =>
      prev.map((f) =>
        f.id === folderId ? { ...f, sheets: [...f.sheets, sheet] } : f,
      ),
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
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-0.5">
              <h1 className="text-2xl font-semibold tracking-tight">Personal Sheets</h1>
              <p className="text-sm text-muted-foreground">
                Manage and organize all your personal spreadsheets
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              onClick={() => setNewFolderOpen(true)}
              variant="outline"
              size="sm"
              className="h-9 px-3 gap-1.5 hidden sm:flex"
            >
              <FolderPlus className="h-4 w-4" />
              New Folder
            </Button>
            <Button
              onClick={() => setNewSheetOpen(true)}
              size="sm"
              className="h-9 px-3 gap-1.5"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New Sheet</span>
              <span className="sm:hidden">New</span>
            </Button>
          </div>
        </div>

        {/* Info Banner */}
        <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3">
          <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <p className="text-xs text-muted-foreground">
            Personal sheets are organized into folders. Select a folder below to view and edit its sheets. You can star sheets to mark them as important and find them quickly later.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              label: "Total Sheets",
              value: allSheets.length,
              icon: FileSpreadsheet,
              toggle: false,
              description: "In selected folder",
            },
            {
              label: "Starred",
              value: starredCount,
              icon: Star,
              toggle: true,
              description: "Click to filter",
            },
            {
              label: "Recent",
              value: recentCount,
              icon: Clock4,
              toggle: false,
              description: "Last 72 hours",
            },
          ].map(({ label, value, icon: Icon, toggle, description }) => {
            const isActive = toggle && onlyStarred;
            return (
              <button
                key={label}
                onClick={toggle ? () => setOnlyStarred((v) => !v) : undefined}
                disabled={!toggle}
                className={cn(
                  "flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 rounded-xl border px-3 py-3 transition-all text-left",
                  isActive
                    ? "bg-primary/[0.07] border-primary/40"
                    : toggle
                      ? "bg-card border-border hover:border-primary/30 hover:bg-muted/20 cursor-pointer"
                      : "bg-card border-border cursor-default",
                )}
              >
                <div
                  className={cn(
                    "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                    isActive ? "bg-primary/15" : "bg-muted",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4",
                      isActive ? "text-primary" : "text-muted-foreground",
                    )}
                  />
                </div>
                <div className="min-w-0">
                  <p
                    className={cn(
                      "text-lg font-bold leading-none",
                      isActive ? "text-primary" : "",
                    )}
                  >
                    {value}
                  </p>
                  <p className="text-xs font-medium text-foreground mt-0.5">{label}</p>
                  <p className="text-[10px] text-muted-foreground hidden sm:block">{description}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Folders Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">Folders</h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {folders.length} folder{folders.length !== 1 ? "s" : ""} · select one to view sheets
              </p>
            </div>
            <button
              onClick={() => setNewFolderOpen(true)}
              className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
            >
              <FolderPlus className="h-3.5 w-3.5" />
              New folder
            </button>
          </div>

          <FoldersList
            folders={folders}
            currentFolder={currentFolder}
            onSelectFolder={handleFolderChange}
            onCreateFolder={() => setNewFolderOpen(true)}
          />
        </div>

        {/* Sheets Section */}
        {currentFolder && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Search sheets…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-7 h-9 text-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
                <TabsList className="h-9 p-0.5">
                  <TabsTrigger value="grid" className="h-8 w-9 p-0">
                    <Grid3X3 className="h-3.5 w-3.5" />
                  </TabsTrigger>
                  <TabsTrigger value="table" className="h-8 w-9 p-0">
                    <List className="h-3.5 w-3.5" />
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <SheetsGrid
              sheets={filteredSheets}
              viewMode={viewMode}
              searchQuery={searchQuery}
              folderName={currentFolderData?.name || ""}
              onNewSheet={() => setNewSheetOpen(true)}
            />
          </div>
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
