"use client";

import { useRef } from "react";
import { FolderWithSheets } from "@/types";
import { Button } from "@/components/ui/button";
import { Folder, FolderOpen, FolderPlus, FolderX, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  folders: FolderWithSheets[];
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
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!folders?.length) {
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
    <div className="relative overflow-hidden rounded-xl border border-border bg-card p-2">
      <div
        ref={scrollRef}
        className="flex gap-2.5 overflow-x-auto touch-pan-x pb-1"
        style={{
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "thin",
        }}
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
                minWidth: "clamp(148px, 40vw, 170px)",
                flexShrink: 0,
                // ── THE gradient: card white on left, primary ~20% on right ──
                background: isActive
                  ? `linear-gradient(to right, hsl(var(--card)) 55%, hsl(var(--primary) / 0.16) 100%)`
                  : `linear-gradient(to right, hsl(var(--card)) 65%, hsl(var(--muted) / 0.45) 100%)`,
              }}
              className={cn(
                "group relative text-left rounded-xl border transition-all duration-200 focus:outline-none",
                isActive
                  ? "border-primary/35 shadow-sm"
                  : "border-border hover:border-primary/20",
              )}
            >
              <div className="p-3.5 flex flex-col gap-2.5">
                {/* icon + count */}
                <div className="flex items-center justify-between">
                  <div
                    className={cn(
                      "h-8 w-8 rounded-lg flex items-center justify-center transition-colors",
                      isActive
                        ? "bg-primary/15"
                        : "bg-muted/60 group-hover:bg-primary/10",
                    )}
                  >
                    {isActive ? (
                      <FolderOpen className="h-4 w-4 text-primary" />
                    ) : (
                      <Folder className="h-4 w-4 text-muted-foreground group-hover:text-primary/70 transition-colors" />
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-medium px-1.5 py-0.5 rounded-md",
                      isActive
                        ? "bg-primary/15 text-primary"
                        : "bg-muted/80 text-muted-foreground",
                    )}
                  >
                    {count}
                  </span>
                </div>

                {/* name + subtitle */}
                <div className="min-w-0">
                  <p
                    className={cn(
                      "text-[13px] font-medium truncate capitalize",
                      isActive ? "text-primary" : "text-foreground",
                    )}
                  >
                    {folder.name}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 truncate capitalize">
                    {count === 0
                      ? "Empty"
                      : `${count} sheet${count !== 1 ? "s" : ""}`}
                  </p>
                </div>
              </div>
            </button>
          );
        })}

        {/* New Folder */}
        <button
          onClick={onCreateFolder}
          style={{
            scrollSnapAlign: "start",
            minWidth: "clamp(95px, 25vw, 115px)",
            flexShrink: 0,
          }}
          className="group flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border hover:border-primary/35 hover:bg-primary/[0.03] transition-all duration-200 py-3.5 px-3"
        >
          <div className="h-8 w-8 rounded-lg bg-muted/60 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
            <Plus className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <span className="text-[11px] text-muted-foreground group-hover:text-primary transition-colors capitalize">
            New folder
          </span>
        </button>
      </div>
    </div>
  );
};

export default FoldersList;
