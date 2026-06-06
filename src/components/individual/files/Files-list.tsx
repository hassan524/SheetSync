"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { SheetsTable } from "@/components/sheets";
import { Search, Building2, User } from "lucide-react";
import { useRouter } from "next/navigation";

interface FilesListProps {
  sheets: any[];
}

const FilesList: React.FC<FilesListProps> = ({ sheets: initialSheets }) => {
  const router = useRouter();
  const [sheets, setSheets] = useState(initialSheets);
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<
    "all" | "personal" | "organization"
  >("all");

  useEffect(() => {
    setSheets(initialSheets);
  }, [initialSheets]);

  const filtered = useMemo(
    () =>
      (sheets ?? []).filter((s) => {
        const matchSearch = s.title
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
        const isOrg = s.isOrganization || s.organization_id;
        const source = isOrg ? "organization" : "personal";
        const matchSource = sourceFilter === "all" || source === sourceFilter;
        return matchSearch && matchSource;
      }),
    [sheets, searchQuery, sourceFilter],
  );

  const personalCount = useMemo(
    () => (sheets ?? []).filter((s) => !(s.isOrganization || s.organization_id)).length,
    [sheets]
  );
  const orgCount = useMemo(
    () => (sheets ?? []).filter((s) => s.isOrganization || s.organization_id).length,
    [sheets]
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search all files..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Source filter pills */}
          {(
            [
              {
                key: "all",
                label: "All files",
                count: sheets.length,
                icon: undefined,
              },
              {
                key: "personal",
                label: "Private",
                count: personalCount,
                icon: User,
              },
              {
                key: "organization",
                label: "Organizations",
                count: orgCount,
                icon: Building2,
              },
            ] as const
          ).map(({ key, label, count, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setSourceFilter(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                sourceFilter === key
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {Icon && <Icon className="h-3 w-3" />}
              {label}
              <span
                className={`ml-0.5 text-[10px] ${sourceFilter === key ? "opacity-80" : "text-muted-foreground"}`}
              >
                {count}
              </span>
            </button>
          ))}
        </div>
      </div>

      <SheetsTable
        sheets={filtered}
        onDeleted={handleDeleted}
        onRenamed={handleRenamed}
        emptyText="No files found"
        emptyDescription="Your personal and organization sheets will appear here."
      />
    </>
  );
};

export default FilesList;
