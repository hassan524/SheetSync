"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { SheetsTable } from "@/components/sheets";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";

interface StarredListProps {
  starredSheets: any[];
}

const StarredList: React.FC<StarredListProps> = ({
  starredSheets: initialSheets,
}) => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [sheets, setSheets] = useState(initialSheets);

  useEffect(() => {
    setSheets(initialSheets);
  }, [initialSheets]);

  const filtered = useMemo(
    () =>
      (sheets ?? []).filter((s) =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase()),
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search starred sheets..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <SheetsTable
        sheets={filtered}
        onDeleted={handleDeleted}
        onRenamed={handleRenamed}
        emptyText="No starred sheets"
        emptyDescription="Star a sheet from the editor or context menu to pin it here."
      />
    </>
  );
};

export default StarredList;
