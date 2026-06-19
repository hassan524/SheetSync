"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SheetsTable } from "@/components/sheets";

interface SharedWithMeListProps {
  sheets: any[];
}

const SharedWithMeList: React.FC<SharedWithMeListProps> = ({
  sheets: initialSheets,
}) => {
  const router = useRouter();
  const [sheets, setSheets] = useState(initialSheets);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setSheets(initialSheets);
  }, [initialSheets]);

  const filtered = useMemo(
    () =>
      (sheets ?? []).filter((sheet) =>
        sheet.title.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [sheets, searchQuery],
  );

  const handleDeleted = (id: string) => {
    setSheets((prev) => prev.filter((sheet) => sheet.id !== id));
    router.refresh();
  };

  const handleRenamed = (id: string, title: string) => {
    setSheets((prev) =>
      prev.map((sheet) => (sheet.id === id ? { ...sheet, title } : sheet)),
    );
    router.refresh();
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search shared sheets..."
            className="pl-9"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </div>
      </div>

      <SheetsTable
        sheets={filtered}
        onDeleted={handleDeleted}
        onRenamed={handleRenamed}
        emptyText="No shared sheets"
        emptyDescription="Sheets shared directly with you will appear here."
        hidePrivate
      />
    </>
  );
};

export default SharedWithMeList;
