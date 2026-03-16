"use client";

import { FolderItem, SheetItem } from "@/data/sheets";
import { Button } from "@/components/ui/button";
import {
  Folder,
  FolderOpen,
  FolderPlus,
  FolderX,
  ChevronRight,
} from "lucide-react";

interface Props {
  folders: FolderItem[];
  currentFolder: string | null;
  onSelectFolder: (id: string) => void;
  onCreateFolder: () => void;
}

const FoldersList = ({
  folders,
  currentFolder,
  onSelectFolder,
  onCreateFolder,
}: Props) => {
  if (folders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 rounded-xl border-2 border-dashed border-border bg-muted/10">
        <div className="h-12 w-12 rounded-xl bg-muted/40 flex items-center justify-center mb-3">
          <FolderX className="h-6 w-6 text-muted-foreground/50" />
        </div>
        <p className="font-medium text-sm">No folders yet</p>
        <p className="text-xs text-muted-foreground mt-1 mb-4 text-center max-w-xs">
          Create a folder to organize your sheets.
        </p>
        <Button size="sm" variant="outline" onClick={onCreateFolder}>
          <FolderPlus className="h-3.5 w-3.5 mr-1.5" />
          Create Folder
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {folders.map((folder, index) => {
        const isActive = currentFolder === folder.id;
        const sheetCount = folder.sheets.filter(
          (s) => s.folder === folder.id,
        ).length;

        return (
          <button
            key={folder.id}
            onClick={() => onSelectFolder(folder.id)}
            className={`group flex items-center gap-3 p-3.5 rounded-lg border text-left transition-all duration-200 animate-scale-in ${
              isActive
                ? "border-primary/40 bg-primary/5 shadow-sm ring-1 ring-primary/20"
                : "border-border bg-card hover:border-primary/30 hover:shadow-sm"
            }`}
            style={{ animationDelay: `${index * 40}ms` }}
          >
            <div
              className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                isActive
                  ? "bg-primary/15"
                  : "bg-primary/10 group-hover:bg-primary/15"
              }`}
            >
              {isActive ? (
                <FolderOpen className="h-5 w-5 text-primary" />
              ) : (
                <Folder className="h-5 w-5 text-primary" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p
                className={`font-medium text-sm truncate ${isActive ? "text-primary" : ""}`}
              >
                {folder.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {sheetCount} sheets · {folder.lastEdited}
              </p>
            </div>
            <ChevronRight
              className={`h-4 w-4 flex-shrink-0 transition-all duration-200 ${
                isActive
                  ? "text-primary opacity-100"
                  : "text-muted-foreground opacity-0 group-hover:opacity-100"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
};

export default FoldersList;
