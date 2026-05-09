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
            <Button
              onClick={() => setNewFolderOpen(true)}
              variant="outline"
              size="sm"
              className="h-9 w-9 p-0"
            >
              <FolderPlus className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => setNewSheetOpen(true)}
              size="sm"
              className="h-9 w-9 p-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Info */}
        <div className="flex items-start gap-3 rounded-xl border bg-muted/40 px-4 py-3">
          <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
          <p className="text-xs text-muted-foreground">
            Personal sheets are organized into folders...
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
              <button key={label}>
                <Icon className="h-4 w-4" />
                {value} {label}
              </button>
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