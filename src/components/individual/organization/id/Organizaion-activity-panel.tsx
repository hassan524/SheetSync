// OrgActivityPanel.tsx
"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  BarChart3,
  Edit3,
  FileSpreadsheet,
  Plus,
  Trash2,
  UserPlus,
  Clock,
} from "lucide-react";
import { getOrgActivity } from "@/lib/querys/activity/activity";

// ─── Helpers ───────────────────────────────────────────────────────

function getInitials(name?: string): string {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?";
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getActionMeta(action: string) {
  const a = action.toLowerCase();
  if (a.includes("created")) return { icon: FileSpreadsheet, bar: "bg-emerald-600" };
  if (a.includes("edit")) return { icon: Edit3, bar: "bg-emerald-700" };
  if (a.includes("delete")) return { icon: Trash2, bar: "bg-destructive" };
  if (a.includes("insert") || a.includes("added")) return { icon: Plus, bar: "bg-emerald-500" };
  if (a.includes("invite") || a.includes("join")) return { icon: UserPlus, bar: "bg-emerald-800" };
  return { icon: Clock, bar: "bg-muted-foreground/40" };
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / (1000 * 60));
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

// ─── Empty state ───────────────────────────────────────────────────

function NoActivityIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 56 56" fill="none">
      <rect x="6" y="30" width="8" height="18" rx="2" fill="currentColor" className="text-muted/40" />
      <rect x="18" y="20" width="8" height="28" rx="2" fill="currentColor" className="text-muted/50" />
      <rect x="30" y="24" width="8" height="24" rx="2" fill="currentColor" className="text-muted/40" />
      <rect x="42" y="14" width="8" height="34" rx="2" fill="currentColor" className="text-muted/30" />
      <line x1="4" y1="50" x2="52" y2="50" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-border" />
      <circle cx="42" cy="14" r="8" fill="hsl(var(--background))" />
      <circle cx="42" cy="14" r="8" stroke="currentColor" strokeWidth="1.5" className="text-border" />
      <line x1="39" y1="14" x2="45" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-muted-foreground/50" />
      <line x1="42" y1="11" x2="42" y2="17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-muted-foreground/50" />
    </svg>
  );
}

// ─── Types ─────────────────────────────────────────────────────────

interface ActivityRow {
  id: string;
  action: string;
  target: string | null;
  created_at: string;
  actor_id: string | null;
  profiles?: { id: string; name: string } | null;
  sheets?: { id: string; title: string } | null;
}

// ─── Panel ─────────────────────────────────────────────────────────

export function OrgActivityPanel({ org }: { org: { id: string } }) {
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await getOrgActivity(org.id);
        if (!cancelled) setActivity(data ?? []);
      } catch (err) {
        console.error("Failed to load org activity:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [org.id]);

  return (
    <div className="rounded-3xl border border-border bg-card overflow-hidden flex flex-col" style={{ minHeight: "65vh", maxHeight: "65vh" }}>

      {/* Header */}
      <div className="px-4 pt-4 pb-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-xl bg-primary/10 ring-1 ring-primary/20 flex items-center justify-center">
              <BarChart3 className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
              Activity
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/60" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium border border-primary/20">
              {loading ? "…" : `${activity.length}`}
            </span>
          </div>
        </div>
        <div className="mt-3 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      {/* Body */}
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2">
          <div className="h-5 w-5 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
          <p className="text-[11px] text-muted-foreground">Loading...</p>
        </div>
      ) : activity.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-center">
          <div className="text-muted-foreground/60">
            <NoActivityIcon />
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground">No activity yet</p>
            <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed max-w-[140px] mx-auto">
              Actions in this organization will appear here.
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-y-auto flex-1 px-2 pb-2">
          <div className="flex flex-col gap-1">
            {activity.map((a, index) => {
              const userName = a.profiles?.name || "Unknown";
              const displayTarget = a.sheets?.title || a.target || "";
              const { icon: Icon, bar } = getActionMeta(a.action);
              const isFirst = index === 0;

              return (
                <div
                  key={a.id}
                  className={`
                    relative flex items-center gap-2.5 px-3 py-2.5 rounded-2xl
                    hover:bg-muted/50 transition-colors duration-150 overflow-hidden
                    ${isFirst ? "bg-primary/[0.03] ring-1 ring-primary/10" : ""}
                  `}
                >
                  {/* left accent bar */}
                  <div className={`absolute left-0 top-2 bottom-2 w-[3px] rounded-full ${bar}`} />

                  {/* avatar */}
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
                      {getInitials(userName)}
                    </AvatarFallback>
                  </Avatar>

                  {/* text */}
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] leading-snug text-foreground truncate">
                      <span className="font-semibold">{userName.split(" ")[0]}</span>{" "}
                      <span className="text-muted-foreground">{a.action}</span>{" "}
                      {displayTarget && (
                        <span className="text-primary font-medium">{displayTarget}</span>
                      )}
                    </p>
                  </div>

                  {/* time */}
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-[10px] text-muted-foreground tabular-nums">
                      {timeAgo(a.created_at)}
                    </span>
                    {isFirst && (
                      <span className="text-[9px] px-1.5 py-px rounded-full bg-primary/15 text-primary font-semibold border border-primary/20 leading-tight">
                        new
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer */}
      {!loading && activity.length > 0 && (
        <div className="px-4 py-2.5 shrink-0">
          <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-2.5" />
          <p className="text-[10px] text-muted-foreground text-center">
            Last{" "}
            <span className="text-primary font-medium">{activity.length}</span>{" "}
            events
          </p>
        </div>
      )}

    </div>
  );
}