"use client";

import { useEffect, useState } from "react";
import { Clock, Eye, Edit3, Share2, UserPlus } from "lucide-react";
import { getActivity } from "@/lib/querys/activity/activity";

// ─────────────────────────────────────────────
// ICON MAPPER
// ─────────────────────────────────────────────

function getIcon(action: string) {
  if (action.includes("edit")) return Edit3;
  if (action.includes("view") || action.includes("open")) return Eye;
  if (action.includes("share")) return Share2;
  if (action.includes("invite") || action.includes("join")) return UserPlus;
  return Clock;
}

// ─────────────────────────────────────────────
// TIME AGO
// ─────────────────────────────────────────────

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();

  const mins = Math.floor(diff / (1000 * 60));
  if (mins < 60) return `${mins}m`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;

  return `${Math.floor(hours / 24)}d`;
}

// ─────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────

export default function ActivityPanel() {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getActivity();
        setActivities(data);
      } catch (err) {
        console.error("Activity error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, []);

  return (
    <div className="rounded-xl border border-border bg-card h-[420px] flex flex-col">

      {/* HEADER */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
        <span className="text-sm font-semibold">Recent Activity</span>
        <span className="text-[11px] text-muted-foreground">
          {activities.length} events
        </span>
      </div>

      {/* BODY */}
      <div className="flex-1 overflow-y-auto divide-y divide-border/40">

        {loading ? (
          <p className="text-xs text-muted-foreground text-center py-6">
            Loading activity...
          </p>
        ) : activities.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-10">
            No activity yet
          </p>
        ) : (
          activities.map((a) => {
            const Icon = getIcon(a.action);

            return (
              <div key={a.id} className="flex items-center gap-3 px-4 py-3">

                {/* ICON */}
                <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>

                {/* TEXT */}
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium truncate">
                    {a.user?.name || "Someone"}
                    <span className="text-muted-foreground font-normal">
                      {" "}
                      {a.action}
                    </span>
                  </p>

                  <p className="text-[11px] text-muted-foreground truncate">
                    {a.sheet?.title || a.target || "Unknown sheet"}
                  </p>
                </div>

                {/* TIME */}
                <span className="text-[11px] text-muted-foreground tabular-nums">
                  {timeAgo(a.time)}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}