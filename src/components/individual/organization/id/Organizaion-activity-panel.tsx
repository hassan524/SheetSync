// OrgActivityPanel.tsx
"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  BarChart3,
  Edit3,
  FileSpreadsheet,
  Plus,
  Trash2,
  UserPlus,
  Clock,
  Eye,
  Share2,
  Activity,
  FileText,
  Download,
  MessageSquare,
  Building2,
  Mail,
} from "lucide-react";
import { getOrgActivity } from "@/lib/querys/activity/activity";

// ─── Helpers ───────────────────────────────────────────────────────

function getInitials(name?: string): string {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?";
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getActionMeta(action: string = "") {
  const a = action.toLowerCase();

  if (a.includes("create"))
    return {
      icon: Plus,
      color: "bg-primary/15 text-primary",
      ring: "ring-1 ring-primary/30",
    };
  if (a.includes("edit") || a.includes("update") || a.includes("add"))
    return {
      icon: Edit3,
      color: "bg-primary/10 text-primary",
      ring: "ring-1 ring-primary/20",
    };
  if (a.includes("view") || a.includes("open"))
    return {
      icon: Eye,
      color: "bg-primary/10 text-primary",
      ring: "ring-1 ring-primary/20",
    };
  if (a.includes("share"))
    return {
      icon: Share2,
      color: "bg-primary/10 text-primary",
      ring: "ring-1 ring-primary/20",
    };
  if (a.includes("invite") || a.includes("join"))
    return {
      icon: UserPlus,
      color: "bg-primary/15 text-primary",
      ring: "ring-1 ring-primary/30",
    };
  if (a.includes("download"))
    return {
      icon: Download,
      color: "bg-primary/10 text-primary",
      ring: "ring-1 ring-primary/20",
    };
  if (a.includes("delete") || a.includes("remove"))
    return {
      icon: Trash2,
      color: "bg-destructive/10 text-destructive",
      ring: "ring-1 ring-destructive/20",
    };
  if (a.includes("comment"))
    return {
      icon: MessageSquare,
      color: "bg-primary/10 text-primary",
      ring: "ring-1 ring-primary/20",
    };

  return {
    icon: Clock,
    color: "bg-muted text-muted-foreground",
    ring: "",
  };
}

function formatAction(
  action: string = "",
  target: string,
  subtitle: string,
  userName: string,
) {
  const a = action.toLowerCase();

  if (a.includes("created sheet") || a.includes("create sheet")) {
    return {
      line1: `${userName} created "${target !== "Unknown Sheet" ? target : "Untitled Sheet"}"`,
      line2: null,
      context: subtitle,
    };
  }
  if (a.includes("add") && a.includes("column")) {
    return {
      line1: `${userName} added a column in "${target !== "Unknown Sheet" ? target : "a sheet"}"`,
      line2: null,
      context: subtitle,
    };
  }
  if (a.includes("edit") || a.includes("update")) {
    return {
      line1: `${userName} edited "${target !== "Unknown Sheet" ? target : "a sheet"}"`,
      line2: null,
      context: subtitle,
    };
  }
  if (a.includes("view") || a.includes("open")) {
    return {
      line1: `${userName} viewed "${target !== "Unknown Sheet" ? target : "a sheet"}"`,
      line2: null,
      context: subtitle,
    };
  }
  if (a.includes("share")) {
    return {
      line1: `${userName} shared "${target !== "Unknown Sheet" ? target : "a sheet"}"`,
      line2: null,
      context: subtitle,
    };
  }
  if (a.includes("invited to organization") || a.includes("join")) {
    return {
      line1: `${userName} joined the organization`,
      line2: null,
      context: subtitle,
    };
  }
  if (a.includes("download")) {
    return {
      line1: `${userName} downloaded "${target !== "Unknown Sheet" ? target : "a sheet"}"`,
      line2: null,
      context: subtitle,
    };
  }
  if (a.includes("delete") || a.includes("remove")) {
    return {
      line1: `${userName} deleted "${target !== "Unknown Sheet" ? target : "a sheet"}"`,
      line2: null,
      context: subtitle,
    };
  }
  if (a.includes("comment")) {
    return {
      line1: `${userName} left a comment on "${target !== "Unknown Sheet" ? target : "a sheet"}"`,
      line2: null,
      context: subtitle,
    };
  }

  return {
    line1: `${userName} ${action} — ${target}`,
    line2: null,
    context: subtitle,
  };
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / (1000 * 60));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatFullTime(date: string) {
  return new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// ─── Empty state ───────────────────────────────────────────────────

function NoActivityIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 56 56" fill="none">
      <rect
        x="6"
        y="30"
        width="8"
        height="18"
        rx="2"
        fill="currentColor"
        className="text-muted/40"
      />
      <rect
        x="18"
        y="20"
        width="8"
        height="28"
        rx="2"
        fill="currentColor"
        className="text-muted/50"
      />
      <rect
        x="30"
        y="24"
        width="8"
        height="24"
        rx="2"
        fill="currentColor"
        className="text-muted/40"
      />
      <rect
        x="42"
        y="14"
        width="8"
        height="34"
        rx="2"
        fill="currentColor"
        className="text-muted/30"
      />
      <line
        x1="4"
        y1="50"
        x2="52"
        y2="50"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        className="text-border"
      />
      <circle cx="42" cy="14" r="8" fill="hsl(var(--background))" />
      <circle
        cx="42"
        cy="14"
        r="8"
        stroke="currentColor"
        strokeWidth="1.5"
        className="text-border"
      />
      <line
        x1="39"
        y1="14"
        x2="45"
        y2="14"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        className="text-muted-foreground/50"
      />
      <line
        x1="42"
        y1="11"
        x2="42"
        y2="17"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        className="text-muted-foreground/50"
      />
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
  profiles?: { id: string; name: string; avatar_url?: string } | null;
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
    return () => {
      cancelled = true;
    };
  }, [org.id]);

  return (
    <div
      className="rounded-3xl border border-border bg-card overflow-hidden flex flex-col h-[400px] md:h-[65vh]"
    >
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
      <div className="flex-1 overflow-y-auto px-2 pb-2 hide-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <div className="h-5 w-5 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
            <p className="text-[11px] text-muted-foreground">Loading...</p>
          </div>
        ) : activity.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 p-8 text-center">
            <div className="text-muted-foreground/60">
              <NoActivityIcon />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">
                No activity yet
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed max-w-[140px] mx-auto">
                Actions in this organization will appear here.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-1 mt-1">
            {activity.map((a, index) => {
              const userName = a.profiles?.name?.split(" ")[0] || "Unknown";
              const displayTarget =
                a.sheets?.title || a.target || "Unknown Sheet";
              const { icon: Icon, color, ring } = getActionMeta(a.action);
              const { line1, line2, context } = formatAction(
                a.action,
                displayTarget,
                "Organization Activity",
                userName,
              );
              const isFirst = index === 0;

              return (
                <div
                  key={a.id}
                  className={`
                    relative flex items-start gap-2.5 px-3 py-2.5 rounded-2xl
                    hover:bg-muted/50 transition-colors duration-150 overflow-hidden
                    ${isFirst ? "bg-primary/[0.03] ring-1 ring-primary/10" : ""}
                  `}
                >
                  {/* ICON */}
                  <div
                    className={`h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${color} ${ring}`}
                  >
                    <Icon className="h-3 w-3" />
                  </div>

                  {/* TEXT */}
                  <div className="flex-1 min-w-0">
                    {/* Main message */}
                    <p className="text-[11px] font-medium leading-snug text-foreground">
                      {line1}
                    </p>

                    {/* Context row */}
                    <div className="flex items-center gap-1 mt-1">
                      <Avatar className="h-3.5 w-3.5 shrink-0">
                        {a.profiles?.avatar_url && (
                          <AvatarImage src={a.profiles.avatar_url} />
                        )}
                        <AvatarFallback className="text-[7px] font-bold bg-primary/10 text-primary">
                          {getInitials(userName)}
                        </AvatarFallback>
                      </Avatar>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {userName}
                      </p>
                      <span className="text-[10px] text-muted-foreground/40 mx-0.5">
                        •
                      </span>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {context}
                      </p>
                    </div>

                    {/* Full timestamp (second time display) */}
                    <div className="flex items-center gap-1 mt-0.5">
                      <Clock className="h-2.5 w-2.5 text-muted-foreground/60 flex-shrink-0" />
                      <p className="text-[10px] text-muted-foreground/60">
                        {formatFullTime(a.created_at)}
                      </p>
                    </div>
                  </div>

                  {/* RELATIVE TIME + BADGE */}
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
        )}
      </div>

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
