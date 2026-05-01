"use client";

import React, { useEffect, useState } from "react";
import { ArrowRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import SheetCard from "@/components/sheets/Sheet-card";
import { useRouter } from "next/navigation";
import { getRecentSheets } from "@/lib/querys/sheets/sheets";

const RecentSheets = () => {
  const router = useRouter();

  const [recentSheets, setRecentSheets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {

        const data = await getRecentSheets();
        console.log("Recent sheets:", data);

        const formatted = data.map((sheet: any) => ({
          id: sheet.id,
          title: sheet.title,

          lastEdited: formatTimeAgo(sheet.lastEdited),

          rows: sheet.rowsCount,
          cols: sheet.colsCount,

          fileSizeKb: 120,

          templateId: sheet.templateId,

          isStarred: false, // optional

          // ✅ org vs personal
          isOrganization: sheet.isOrganization,
          organizationName: sheet.organization?.name,
          membersCount: sheet.organization?.membersCount,

          folderName: sheet.folder?.name,
        }));

        setRecentSheets(formatted);
      } catch (err) {
        console.error("Failed to load recent sheets:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatTimeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();

    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;

    return new Date(date).toLocaleDateString();
  };

  return (
    <section className="lg:col-span-2 animate-fade-in">
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

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {recentSheets.map((sheet, index) => (
            <div key={sheet.id} style={{ animationDelay: `${index * 50}ms` }}>
              <SheetCard {...sheet} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default RecentSheets;