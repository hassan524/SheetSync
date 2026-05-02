"use client";

import React, { useEffect, useState } from "react";
import { ArrowRight, Clock, FileSpreadsheet, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import SheetCard from "@/components/sheets/Sheet-card";
import { useRouter } from "next/navigation";
import { getRecentSheets } from "@/lib/querys/sheets/sheets";
import { SheetCardSkeleton } from "@/components/skeletons/SheetCardSkeleton";

const EmptyState = () => {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center h-full py-14 px-6 rounded-xl border border-dashed text-center gap-4">
      <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
        <FileSpreadsheet className="h-8 w-8 text-primary/60" />
      </div>

      <div className="space-y-1">
        <p className="text-base font-semibold">No recent sheets</p>
        <p className="text-sm text-muted-foreground max-w-xs">
          Sheets you open will appear here.
        </p>
      </div>

      {/* <Button size="sm" onClick={() => router.push("/new")} className="gap-1.5">
        <Plus className="h-4 w-4" />
        New Sheet
      </Button> */}
    </div>
  );
};

const RecentSheets = () => {
  const router = useRouter();

  const [recentSheets, setRecentSheets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const formatTimeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;

    return new Date(date).toLocaleDateString();
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getRecentSheets();

        const formatted = data.map((sheet: any) => ({
          id: sheet.id,
          title: sheet.title,
          lastEdited: formatTimeAgo(sheet.lastEdited),
          rows: sheet.rowsCount,
          cols: sheet.colsCount,
          fileSizeKb: 120,
          templateId: sheet.templateId,
          isOrganization: sheet.isOrganization,
          organizationName: sheet.organization?.name,
          membersCount: sheet.organization?.membersCount,
          folderName: sheet.folder?.name,
        }));

        setRecentSheets(formatted);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <section className="lg:col-span-2 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Recent Sheets</h2>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="text-primary"
          onClick={() => router.push("/recent")}
        >
          View all
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      <div className="flex-1">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <SheetCardSkeleton key={i} />
            ))}
          </div>
        ) : recentSheets.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {recentSheets.map((sheet, index) => (
              <div key={sheet.id} style={{ animationDelay: `${index * 50}ms` }}>
                <SheetCard
                  {...sheet}
                  onDeleted={(id) =>
                    setRecentSheets((prev) => prev.filter((s) => s.id !== id))
                  }
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default RecentSheets;