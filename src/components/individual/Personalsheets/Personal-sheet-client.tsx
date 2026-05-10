"use client";

import { useState, useMemo, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";

import { FolderWithSheets } from "@/types";
import { mapFolders } from "@/lib/mappers/folder.mapper";

import DashboardLayout from "@/components/layout/Dashboard-layout";
const NewSheetModal = dynamic(
  () => import("@/components/sheets/New-sheet-modal"),
);
const FoldersList = dynamic(() => import("./Folders-list"));
const SheetsGrid = dynamic(() => import("./Sheets-grid"));
const CreateFolderDialog = dynamic(() => import("./Create-folder-dialog"));

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
  Clock4,
  Info,
  FileSpreadsheet, // ✅ FIXED
} from "lucide-react";

import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { createFolder } from "@/lib/querys/folder/folders";

interface Props {
  initialFolders: any[];
}

function SheetsPageClient({ initialFolders }: Props) {
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

  const [now] = useState(() => Date.now());

  const recentCount = useMemo(() => {
    const threeDaysAgo = now - 1000 * 60 * 60 * 72;
    return allSheets.filter(
      (s) => s.updated_at && new Date(s.updated_at).getTime() > threeDaysAgo,
    ).length;
  }, [allSheets, now]);

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
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5 truncate min-w-0">
            <h1 className="text-lg sm:text-xl font-semibold tracking-tight truncate">
              Personal Sheets
            </h1>
            <p className="text-[11px] sm:text-xs text-muted-foreground truncate">
              Manage and organize all your personal spreadsheets
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* Grid / Table view toggle */}
            <Tabs
              value={viewMode}
              onValueChange={(v) => setViewMode(v as "grid" | "table")}
            >
              <TabsList className="h-9 p-0.5">
                <TabsTrigger value="grid" className="h-8 w-8 p-0">
                  <Grid3X3 className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="table" className="h-8 w-8 p-0">
                  <List className="h-4 w-4" />
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <Button
              onClick={() => setNewFolderOpen(true)}
              variant="outline"
              size="sm"
              className="h-9 gap-1.5"
            >
              <FolderPlus className="h-4 w-4" />
              <span className="hidden sm:inline text-xs">Folder</span>
            </Button>
            <Button
              onClick={() => setNewSheetOpen(true)}
              size="sm"
              className="h-9 gap-1.5"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline text-xs">New Sheet</span>
            </Button>
          </div>
        </div>

        {/* Info */}
        <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3">
          <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
          <p className="text-xs text-muted-foreground">
            Personal sheets are organized into folders...
          </p>
        </div>

        {/* Stats — same card treatment as Recent / Dashboard */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            {
              label: "Total Sheets",
              value: allSheets.length,
              icon: FileSpreadsheet,
              toggle: false,
              description: "In selected folder",
              accent: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
            },
            {
              label: "Starred",
              value: starredCount,
              icon: Star,
              toggle: true,
              description: "Tap to filter starred",
              accent: "bg-amber-500/10 text-amber-600 border-amber-500/20",
            },
            {
              label: "Recent",
              value: recentCount,
              icon: Clock4,
              toggle: false,
              description: "Edited last 72 hours",
              accent: "bg-blue-500/10 text-blue-600 border-blue-500/20",
            },
          ].map(({ label, value, icon: Icon, toggle, description, accent }) => {
            const isActive = toggle && onlyStarred;
            const inner = (
              <>
                <div className={cn("h-8 w-8 sm:h-9 sm:w-9 rounded-lg flex items-center justify-center shrink-0 border", accent)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 text-left">
                  <p className="text-lg font-bold leading-none">{value}</p>
                  <p className="text-xs font-medium text-foreground mt-0.5 truncate">
                    {label}
                  </p>
                  <p className="text-[10px] text-muted-foreground hidden sm:block truncate">
                    {description}
                  </p>
                </div>
              </>
            );
            if (toggle) {
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => setOnlyStarred((v) => !v)}
                  className={`flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-3 text-left transition-all hover:border-primary/25 hover:shadow-sm ${
                    isActive
                      ? "ring-2 ring-amber-400/25 border-amber-400/30 bg-amber-50/30"
                      : ""
                  }`}
                >
                  {inner}
                </button>
              );
            }
            return (
              <div
                key={label}
                className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-3"
              >
                {inner}
              </div>
            );
          })}
        </div>

        {/* Folders */}
        <FoldersList
          folders={folders}
          currentFolder={currentFolder}
          onSelectFolder={handleFolderChange}
          onCreateFolder={() => setNewFolderOpen(true)}
        />

        {/* Sheets */}
        <SheetsGrid
          sheets={filteredSheets}
          viewMode={viewMode}
          searchQuery={searchQuery}
          folderName={currentFolderData?.name || ""}
          onNewSheet={() => setNewSheetOpen(true)}
          onViewModeChange={(v) => setViewMode(v)}
        />
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
}

export default SheetsPageClient;