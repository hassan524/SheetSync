"use client";

import React from "react";
import { ArrowRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import SheetCard from "@/components/sheets/Sheet-card";
import { useRouter } from "next/navigation";

const RecentSheets = () => {
  const router = useRouter();

  const recentSheets = [
    {
      title: "Q4 Financial Report",
      lastEdited: "2 hours ago",
      isStarred: true,
      sharedWith: 5,
    },
    {
      title: "Marketing Budget 2024",
      lastEdited: "Yesterday",
      isStarred: false,
      sharedWith: 3,
    },
    { title: "Team Roster", lastEdited: "3 days ago", isStarred: true },
    { title: "Product Roadmap", lastEdited: "1 week ago", sharedWith: 12 },
  ];
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {recentSheets.map((sheet, index) => (
          <div key={sheet.title} style={{ animationDelay: `${index * 50}ms` }}>
            <SheetCard {...sheet} />
          </div>
        ))}
      </div>
    </section>
  );
};

export default RecentSheets;
