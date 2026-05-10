"use client";

import React, { useEffect, useState } from "react";
import { ArrowRight, Clock, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import SheetCard from "@/components/sheets/Sheet-card";
import { useRouter } from "next/navigation";
import { getRecentSheets } from "@/lib/querys/sheets/sheets";
import { SheetCardSkeleton } from "@/components/skeletons/SheetCardSkeleton";

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-12 px-6 rounded-xl border border-dashed text-center gap-3">
    <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
      <FileSpreadsheet className="h-7 w-7 text-primary/60" />
    </div>
    <div className="space-y-1">
      <p className="text-sm font-semibold">No recent sheets</p>
      <p className="text-xs text-muted-foreground">Sheets you open will appear here.</p>
    </div>
  </div>
);

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
    (async () => {
      try {
        const data = await getRecentSheets();
        setRecentSheets(
          data.map((sheet: any) => ({
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
          }))
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <section className="h-full min-h-0 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-base font-semibold">Recent Sheets</h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-primary text-xs h-8 px-2"
          onClick={() => router.push("/recent")}
        >
          View all
          <ArrowRight className="h-3.5 w-3.5 ml-1" />
        </Button>
      </div>

      {/* Content — scroll inside card (parent caps height on dashboard) */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-1 -mr-0.5">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <SheetCardSkeleton key={i} />
            ))}
          </div>
        ) : recentSheets.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
