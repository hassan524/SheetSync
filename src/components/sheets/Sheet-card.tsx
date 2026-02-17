import {
  FileSpreadsheet,
  MoreHorizontal,
  Star,
  Clock,
  Users,
  Folder,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import GridBackground from "@/components/common/Grid-background";

interface SheetCardProps {
  title: string;
  lastEdited: string;
  isStarred?: boolean;
  sharedWith?: number;
  thumbnail?: string;
  variant?: "default" | "dots" | "lines" | "cells";
  folder?: string;
}
const SheetCard = ({
  title,
  lastEdited,
  isStarred = false,
  sharedWith,
  thumbnail,
  variant,
  folder,
}: SheetCardProps) => {
  // Generate a consistent variant based on title hash
  const getVariant = (): "default" | "dots" | "lines" | "cells" => {
    if (variant) return variant;
    const variants: ("default" | "dots" | "lines" | "cells")[] = [
      "default",
      "dots",
      "lines",
      "cells",
    ];
    const hash = title
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return variants[hash % variants.length];
  };

  return (
    <div className="group relative bg-card border border-border rounded-lg overflow-hidden transition-all duration-300 hover:shadow-elevated hover:border-primary/20 animate-scale-in">
      {/* Thumbnail with SVG Background */}
      <div className="aspect-[4/3] bg-gradient-to-br from-muted to-secondary relative overflow-hidden">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <>
            <GridBackground variant={getVariant()} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="grid grid-cols-4 gap-px w-3/4 opacity-20">
                {Array.from({ length: 16 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-[2/1] bg-primary/30 rounded-sm"
                  />
                ))}
              </div>
            </div>
          </>
        )}

        {/* Hover Actions */}
        <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/5 transition-colors duration-200" />
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Button
            variant="secondary"
            size="icon"
            className="h-7 w-7 bg-background/90 backdrop-blur-sm hover:bg-background"
          >
            <Star
              className={`h-3.5 w-3.5 ${
                isStarred ? "fill-warning text-warning" : ""
              }`}
            />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            {folder && (
              <p className="text-[11px] text-muted-foreground/70 flex items-center gap-1 mb-0.5">
                <Folder className="h-2.5 w-2.5" />
                {folder}
              </p>
            )}
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-primary flex-shrink-0" />
              <h3 className="font-medium text-sm truncate">{title}</h3>
            </div>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {lastEdited}
              </span>
              {sharedWith && sharedWith > 0 && (
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {sharedWith}
                </span>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem>Open</DropdownMenuItem>
              <DropdownMenuItem>Share</DropdownMenuItem>
              <DropdownMenuItem>Duplicate</DropdownMenuItem>
              <DropdownMenuItem>Move to folder</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Rename</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};

export default SheetCard;
