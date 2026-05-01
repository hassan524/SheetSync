"use client";

import { useEffect, useState } from "react";
import {
  Clock,
  Eye,
  Edit3,
  Share2,
  UserPlus,
  Activity,
} from "lucide-react";
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
    <div className="rounded-xl border border-border bg-card h-full min-h-[420px] flex flex-col overflow-hidden">

      {/* HEADER */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
        <span className="text-sm font-semibold">Recent Activity</span>
        <span className="text-[11px] text-muted-foreground">
          {activities.length} events
        </span>
      </div>

      {/* BODY */}
      <div className="flex-1 overflow-y-auto">

        {/* LOADING */}
        {loading && (
          <p className="text-xs text-muted-foreground text-center py-6">
            Loading activity...
          </p>
        )}

        {/* EMPTY STATE */}
        {!loading && activities.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">

            <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mb-3">
              <Activity className="h-5 w-5 text-muted-foreground" />
            </div>

            <p className="text-sm font-medium text-foreground">
              No activity yet
            </p>

            <p className="text-[11px] text-muted-foreground mt-1">
              Actions like edits, views and shares will appear here
            </p>
          </div>
        )}

        {/* LIST */}
        {!loading && activities.length > 0 && (
          <div className="divide-y divide-border/40">
            {activities.map((a) => {
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
                      {a.sheet?.title || a.target || "Unknown"}
                    </p>
                  </div>

                  {/* TIME */}
                  <span className="text-[11px] text-muted-foreground tabular-nums">
                    {timeAgo(a.time)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}