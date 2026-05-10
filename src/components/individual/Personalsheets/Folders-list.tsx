"use client";

import { useRef } from "react";
import { FolderWithSheets } from "@/types";
import { Button } from "@/components/ui/button";
import { FolderPlus, FolderX, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  folders: FolderWithSheets[];
  currentFolder: string | null;
  onSelectFolder: (id: string) => void;
  onCreateFolder: () => void;
}

const FOLDER_COLORS = [
  { bg: "#34a853", light: "rgba(52,168,83,0.12)", text: "#34a853", border: "rgba(52,168,83,0.3)" },
  { bg: "#4285f4", light: "rgba(66,133,244,0.12)", text: "#4285f4", border: "rgba(66,133,244,0.3)" },
  { bg: "#ea4335", light: "rgba(234,67,53,0.12)", text: "#ea4335", border: "rgba(234,67,53,0.3)" },
  { bg: "#fbbc04", light: "rgba(251,188,4,0.15)", text: "#d69e02", border: "rgba(251,188,4,0.35)" },
  { bg: "#8e24aa", light: "rgba(142,36,170,0.12)", text: "#8e24aa", border: "rgba(142,36,170,0.3)" },
  { bg: "#00897b", light: "rgba(0,137,123,0.12)", text: "#00897b", border: "rgba(0,137,123,0.3)" },
  { bg: "#e91e63", light: "rgba(233,30,99,0.12)", text: "#e91e63", border: "rgba(233,30,99,0.3)" },
  { bg: "#ff6d00", light: "rgba(255,109,0,0.12)", text: "#ff6d00", border: "rgba(255,109,0,0.3)" },
];

function FolderSvg({ color, isOpen }: { color: string; isOpen: boolean }) {
  return (
    <svg width="28" height="24" viewBox="0 0 28 24" fill="none">
      <path
        d="M2 6C2 4.89543 2.89543 4 4 4H10.5858C11.1162 4 11.6249 4.21071 12 4.58579L13.4142 6H24C25.1046 6 26 6.89543 26 8V20C26 21.1046 25.1046 22 24 22H4C2.89543 22 2 21.1046 2 20V6Z"
        fill={color}
        opacity={isOpen ? 0.85 : 1}
      />
      <path
        d="M2 5C2 3.89543 2.89543 3 4 3H9.17157C9.70201 3 10.2107 3.21071 10.5858 3.58579L12.4142 5.41421C12.7893 5.78929 13.298 6 13.8284 6H24C25.1046 6 26 6.89543 26 8V8H2V5Z"
        fill={color}
        opacity={0.9}
      />
      {isOpen && (
        <path
          d="M1 10C1 9.44772 1.44772 9 2 9H26C26.5523 9 27 9.44772 27 10V20C27 21.1046 26.1046 22 25 22H3C1.89543 22 1 21.1046 1 20V10Z"
          fill={color}
          opacity={0.7}
        />
      )}
    </svg>
  );
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
        <FolderX className="h-6 w-6 text-muted-foreground/50 mb-3" />
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
    <div className="relative rounded-xl border border-border bg-card/50 p-2 overflow-hidden">
      <div
        ref={scrollRef}
        className="flex gap-2.5 overflow-x-auto hide-scrollbar pb-1"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {folders.map((folder, index) => {
          const isActive = currentFolder === folder.id;
          const count = folder.sheets?.length ?? 0;
          const palette = FOLDER_COLORS[index % FOLDER_COLORS.length];

          const baseStyle: React.CSSProperties = {
            scrollSnapAlign: "start",
            minWidth: "clamp(140px, 38vw, 164px)",
            flexShrink: 0,
          };

          const activeStyle: React.CSSProperties = isActive
            ? {
              background: `linear-gradient(135deg, ${palette.light} 0%, transparent 70%)`,
              border: `1px solid ${palette.border}`,
            }
            : {};

          return (
            <button
              key={folder.id}
              onClick={() => onSelectFolder(folder.id)}
              style={{ ...baseStyle, ...activeStyle }}
              className={cn(
                "group relative text-left rounded-xl transition-all duration-200 h-[88px] p-3",
                isActive ? "shadow-md" : "hover:shadow-sm border border-border/60"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <FolderSvg color={palette.bg} isOpen={isActive} />
                <span
                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
                  style={{
                    background: isActive ? palette.light : "hsl(var(--muted))",
                    color: isActive ? palette.text : "hsl(var(--muted-foreground))",
                  }}
                >
                  {count}
                </span>
              </div>

              <p
                className="text-[13px] font-medium truncate"
                style={isActive ? { color: palette.text } : undefined}
              >
                {folder.name}
              </p>

              <p className="text-[10px] text-muted-foreground mt-0.5">
                {count === 0 ? "Empty" : `${count} sheet${count !== 1 ? "s" : ""}`}
              </p>
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
          className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border hover:border-primary/40 h-[88px]"
        >
          <Plus className="h-4 w-4 text-muted-foreground" />
          <span className="text-[11px] text-muted-foreground">New folder</span>
        </button>
      </div>
    </div>
  );
};

export default FoldersList;