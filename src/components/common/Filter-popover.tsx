import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Filter, RotateCcw } from "lucide-react";

interface FilterOption {
  id: string;
  label: string;
  checked: boolean;
}

interface FilterPopoverProps {
  title?: string;
  filters?: {
    visibility?: boolean;
    starred?: boolean;
    shared?: boolean;
  };
  onApply?: (filters: Record<string, boolean>) => void;
}

const FilterPopover = ({
  title = "Filters",
  filters = { visibility: true, starred: true, shared: true },
  onApply,
}: FilterPopoverProps) => {
  const [open, setOpen] = useState(false);
  const [showPrivate, setShowPrivate] = useState(true);
  const [showTeam, setShowTeam] = useState(true);
  const [showPublic, setShowPublic] = useState(true);
  const [onlyStarred, setOnlyStarred] = useState(false);
  const [onlyShared, setOnlyShared] = useState(false);

  const handleReset = () => {
    setShowPrivate(true);
    setShowTeam(true);
    setShowPublic(true);
    setOnlyStarred(false);
    setOnlyShared(false);
  };

  const handleApply = () => {
    onApply?.({
      showPrivate,
      showTeam,
      showPublic,
      onlyStarred,
      onlyShared,
    });
    setOpen(false);
  };

  const hasActiveFilters =
    onlyStarred || onlyShared || !showPrivate || !showTeam || !showPublic;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Filter className="h-4 w-4" />
          {hasActiveFilters && (
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b">
          <h4 className="font-medium text-sm">{title}</h4>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={handleReset}
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Reset
          </Button>
        </div>

        <div className="p-3 space-y-4">
          {filters.visibility && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase">
                Visibility
              </Label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="private"
                    checked={showPrivate}
                    onCheckedChange={(checked) => setShowPrivate(!!checked)}
                  />
                  <Label htmlFor="private" className="text-sm font-normal">
                    Private
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="team"
                    checked={showTeam}
                    onCheckedChange={(checked) => setShowTeam(!!checked)}
                  />
                  <Label htmlFor="team" className="text-sm font-normal">
                    Team
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="public"
                    checked={showPublic}
                    onCheckedChange={(checked) => setShowPublic(!!checked)}
                  />
                  <Label htmlFor="public" className="text-sm font-normal">
                    Public
                  </Label>
                </div>
              </div>
            </div>
          )}

          {filters.starred && (
            <div className="flex items-center justify-between">
              <Label htmlFor="starred" className="text-sm">
                Only starred
              </Label>
              <Switch
                id="starred"
                checked={onlyStarred}
                onCheckedChange={setOnlyStarred}
              />
            </div>
          )}

          {filters.shared && (
            <div className="flex items-center justify-between">
              <Label htmlFor="shared" className="text-sm">
                Only shared
              </Label>
              <Switch
                id="shared"
                checked={onlyShared}
                onCheckedChange={setOnlyShared}
              />
            </div>
          )}
        </div>

        <div className="p-3 border-t">
          <Button className="w-full" size="sm" onClick={handleApply}>
            Apply Filters
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default FilterPopover;
