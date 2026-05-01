"use client";

import { useEffect, useState } from "react";
import {
  Clock,
  Eye,
  Edit3,
  Share2,
  UserPlus,
  Activity,
  FileText,
  Plus,
  Download,
  Trash2,
  MessageSquare,
  Building2,
  Mail,
  AlertCircle,
} from "lucide-react";

import { getMyActivity } from "@/lib/querys/activity/activity";
import { getMyInvitesActivity } from "@/lib/querys/organization/organization";

function getActionMeta(action: string = "") {
  const a = action.toLowerCase();

  if (a.includes("create")) return {
    icon: Plus,
    color: "bg-primary/15 text-primary",
    ring: "ring-1 ring-primary/30",
  };
  if (a.includes("edit") || a.includes("update") || a.includes("add")) return {
    icon: Edit3,
    color: "bg-primary/10 text-primary",
    ring: "ring-1 ring-primary/20",
  };
  if (a.includes("view") || a.includes("open")) return {
    icon: Eye,
    color: "bg-primary/10 text-primary",
    ring: "ring-1 ring-primary/20",
  };
  if (a.includes("share")) return {
    icon: Share2,
    color: "bg-primary/10 text-primary",
    ring: "ring-1 ring-primary/20",
  };
  if (a.includes("invite") || a.includes("join")) return {
    icon: UserPlus,
    color: "bg-primary/15 text-primary",
    ring: "ring-1 ring-primary/30",
  };
  if (a.includes("download")) return {
    icon: Download,
    color: "bg-primary/10 text-primary",
    ring: "ring-1 ring-primary/20",
  };
  if (a.includes("delete") || a.includes("remove")) return {
    icon: Trash2,
    color: "bg-destructive/10 text-destructive",
    ring: "ring-1 ring-destructive/20",
  };
  if (a.includes("comment")) return {
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

function formatAction(action: string = "", target: string, subtitle: string) {
  const a = action.toLowerCase();

  if (a.includes("created sheet") || a.includes("create sheet")) {
    return {
      line1: `You created "${target !== "Unknown Sheet" ? target : "Untitled Sheet"}"`,
      line2: null,
      context: subtitle,
    };
  }
  if (a.includes("add") && a.includes("column")) {
    return {
      line1: `You added a column in "${target !== "Unknown Sheet" ? target : "a sheet"}"`,
      line2: null,
      context: subtitle,
    };
  }
  if (a.includes("edit") || a.includes("update")) {
    return {
      line1: `You edited "${target !== "Unknown Sheet" ? target : "a sheet"}"`,
      line2: null,
      context: subtitle,
    };
  }
  if (a.includes("view") || a.includes("open")) {
    return {
      line1: `You viewed "${target !== "Unknown Sheet" ? target : "a sheet"}"`,
      line2: null,
      context: subtitle,
    };
  }
  if (a.includes("share")) {
    return {
      line1: `You shared "${target !== "Unknown Sheet" ? target : "a sheet"}"`,
      line2: null,
      context: subtitle,
    };
  }
  if (a.includes("invited to organization")) {
    return {
      line1: `You were invited to join "${target}"`,
      line2: "Check your email to accept. Don't forget to check your spam folder too!",
      context: "Organization invite",
    };
  }
  if (a.includes("download")) {
    return {
      line1: `You downloaded "${target !== "Unknown Sheet" ? target : "a sheet"}"`,
      line2: null,
      context: subtitle,
    };
  }
  if (a.includes("delete") || a.includes("remove")) {
    return {
      line1: `You deleted "${target !== "Unknown Sheet" ? target : "a sheet"}"`,
      line2: null,
      context: subtitle,
    };
  }
  if (a.includes("comment")) {
    return {
      line1: `You left a comment on "${target !== "Unknown Sheet" ? target : "a sheet"}"`,
      line2: null,
      context: subtitle,
    };
  }

  return {
    line1: `${action} — ${target}`,
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

export default function ActivityPanel() {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [activityData, inviteData] = await Promise.all([
          getMyActivity(),
          getMyInvitesActivity(),
        ]);

        const formattedActivity = (activityData || []).map((a: any) => ({
          id: a.id,
          action: a.action,
          target: a.sheets?.title || a.target || "Unknown Sheet",
          subtitle: a.organizations?.name
            ? `${a.organizations.name} · Org`
            : "Personal",
          created_at: a.created_at,
          type: "activity",
        }));

        const formattedInvites = (inviteData || []).map((i: any) => ({
          id: i.id,
          action: "invited to organization",
          target: i.organizations?.name || "Unknown Org",
          subtitle: "Organization invite",
          created_at: i.created_at,
          type: "invite",
        }));

        const merged = [...formattedInvites, ...formattedActivity].sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        setActivities(merged);
      } catch (err: any) {
        console.error("Activity load error:", err?.message || err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <div className="rounded-xl border border-border bg-card h-full min-h-[420px] flex flex-col overflow-hidden">

      {/* HEADER */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary/10 ring-1 ring-primary/20 flex items-center justify-center">
              <Activity className="h-3.5 w-3.5 text-primary" />
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
              {activities.length}
            </span>
          </div>
        </div>

        <div className="mt-3 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      {/* BODY */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">

        {/* LOADING */}
        {loading && (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <div className="h-5 w-5 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
            <p className="text-[11px] text-muted-foreground">Loading...</p>
          </div>
        )}

        {/* EMPTY */}
        {!loading && activities.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 gap-2">
            <div className="h-10 w-10 rounded-lg bg-primary/10 ring-1 ring-primary/20 flex items-center justify-center">
              <Activity className="h-4 w-4 text-primary" />
            </div>
            <p className="text-xs font-semibold">No activity yet</p>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Your edits, views, and invites will show up here
            </p>
          </div>
        )}

        {/* LIST */}
        {!loading && activities.length > 0 && (
          <div className="flex flex-col gap-1">
            {activities.map((a, index) => {
              const { icon: Icon, color, ring } = getActionMeta(a.action);
              const { line1, line2, context } = formatAction(
                a.action,
                a.target,
                a.subtitle
              );
              const isFirst = index === 0;

              return (
                <div
                  key={a.id}
                  className={`
                    relative flex items-start gap-2.5 px-3 py-2.5 rounded-lg
                    hover:bg-muted/50 transition-colors duration-150
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

                    {/* Extra hint line (e.g. invite spam reminder) */}
                    {line2 && (
                      <div className="flex items-start gap-1 mt-1">
                        <Mail className="h-2.5 w-2.5 text-primary flex-shrink-0 mt-px" />
                        <p className="text-[10px] text-muted-foreground leading-relaxed">
                          {line2}
                        </p>
                      </div>
                    )}

                    {/* Context row */}
                    <div className="flex items-center gap-1 mt-1">
                      {a.type === "invite" ? (
                        <Building2 className="h-2.5 w-2.5 text-muted-foreground flex-shrink-0" />
                      ) : (
                        <FileText className="h-2.5 w-2.5 text-muted-foreground flex-shrink-0" />
                      )}
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

      {/* FOOTER */}
      {!loading && activities.length > 0 && (
        <div className="px-4 py-2.5">
          <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-2.5" />
          <p className="text-[10px] text-muted-foreground text-center">
            Last{" "}
            <span className="text-primary font-medium">
              {activities.length}
            </span>{" "}
            events
          </p>
        </div>
      )}

    </div>
  );
}