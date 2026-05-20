"use client";

import { useRef, useState } from "react";
import { FolderWithSheets } from "@/types";
import { Button } from "@/components/ui/button";
import { FolderX, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

interface Props {
  folders: FolderWithSheets[];
  currentFolder: string | null;
  onSelectFolder: (id: string) => void;
  onCreateFolder: () => void;
  onDeleteFolder?: (id: string) => void;
}

const FoldersList = ({
  folders,
  currentFolder,
  onSelectFolder,
  onCreateFolder,
  onDeleteFolder,
}: Props) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [deletingFolder, setDeletingFolder] = useState<FolderWithSheets | null>(null);

  if (!folders?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-10 rounded-lg bg-muted/10">
        <FolderX className="h-6 w-6 text-muted-foreground/50 mb-3" />
        <p className="font-medium text-sm">No Folders Yet</p>
        <p className="text-xs text-muted-foreground mt-1 mb-4 text-center max-w-xs">
          Create a folder to organize your sheets.
        </p>
        <Button size="sm" variant="outline" onClick={onCreateFolder}>
          Create Folder
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="relative overflow-hidden">
        <div
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto hide-scrollbar pb-1"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {folders.map((folder) => {
            const isActive = currentFolder === folder.id;
            const count = folder.sheets?.length ?? 0;

            return (
              <button
                key={folder.id}
                onClick={() => onSelectFolder(folder.id)}
                style={{
                  scrollSnapAlign: "start",
                  minWidth: "clamp(136px, 38vw, 168px)",
                  flexShrink: 0,
                }}
                className={cn(
                  "group relative text-left rounded-lg transition-colors duration-150 px-3 py-2.5 overflow-hidden",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "bg-muted/35 hover:bg-muted/60 text-foreground",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p
                      className={cn(
                        "expandable-truncate text-[13px] font-semibold leading-tight capitalize",
                        isActive ? "text-primary" : "text-foreground",
                      )}
                      title={folder.name}
                      tabIndex={0}
                    >
                      {folder.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {count === 0
                        ? "Empty Folder"
                        : `${count} Sheet${count !== 1 ? "s" : ""}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full tabular-nums",
                        isActive
                          ? "bg-background/80 text-primary"
                          : "bg-background text-muted-foreground",
                      )}
                    >
                      {count}
                    </span>
                    {onDeleteFolder && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingFolder(folder);
                        }}
                        className="h-6 w-6 rounded-md flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 text-muted-foreground transition-all"
                        aria-label={`Delete ${folder.name}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              </button>
            );
          })}

          <button
            onClick={onCreateFolder}
            style={{
              scrollSnapAlign: "start",
              minWidth: "110px",
              flexShrink: 0,
            }}
            className="flex items-center justify-center rounded-lg bg-muted/35 hover:bg-muted/60 px-3 py-2.5 transition-colors"
          >
            <span className="text-[11px] text-muted-foreground font-medium">
              Create Folder
            </span>
          </button>
        </div>
      </div>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deletingFolder}
        onOpenChange={(open) => !open && setDeletingFolder(null)}
      >
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base">
              Delete folder?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              <span className="font-medium text-foreground">
                &quot;{deletingFolder?.name}&quot;
              </span>{" "}
              and all sheets inside it will be permanently deleted. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-8 text-xs">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="h-8 text-xs bg-red-600 hover:bg-red-700 text-white"
              onClick={() => {
                if (deletingFolder) {
                  onDeleteFolder?.(deletingFolder.id);
                  setDeletingFolder(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default FoldersList;
