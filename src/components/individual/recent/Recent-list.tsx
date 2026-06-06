"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SheetsTable } from "@/components/sheets";
import { Search, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";

interface RecentListProps {
  recentSheets: any[];
}

const RecentList: React.FC<RecentListProps> = ({ recentSheets: initialSheets }) => {
  const router = useRouter();
  const [sheets, setSheets] = useState(initialSheets);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setSheets(initialSheets);
  }, [initialSheets]);

  const filteredSheets = useMemo(
    () =>
      (sheets ?? []).filter((sheet) =>
        sheet.title.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [sheets, searchQuery],
  );

  const handleDeleted = (id: string) => {
    setSheets((prev) => prev.filter((s) => s.id !== id));
    router.refresh();
  };

  const handleRenamed = (id: string, title: string) => {
    setSheets((prev) => prev.map((s) => s.id === id ? { ...s, title } : s));
    router.refresh();
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-5 animate-slide-up">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search recent sheets..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          {searchQuery && (
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={() => setSearchQuery("")}
              title="Clear search"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      <SheetsTable
        sheets={filteredSheets}
        onDeleted={handleDeleted}
        onRenamed={handleRenamed}
        emptyText="No recent sheets"
        emptyDescription="Open or edit a sheet to see it here."
      />
    </>
  );
};

export default RecentList;
