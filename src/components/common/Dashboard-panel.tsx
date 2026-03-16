"use client";

import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Check,
  X,
  Eye,
  Edit3,
  UserCheck,
  Building2,
  MessageSquare,
  Share2,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(date: Date) {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

// ─── ACTIVITY FEED ────────────────────────────────────────────────────────────

const ACTIVITIES = [
  {
    id: "1",
    initials: "HA",
    name: "Hassan Ali",
    action: "accepted your invite",
    sub: "Acme Corp",
    icon: UserCheck,
    isNew: true,
    time: new Date(Date.now() - 2 * 60 * 1000),
  },
  {
    id: "2",
    initials: "SK",
    name: "Sara Khan",
    action: "opened",
    sub: "Q4 Revenue Model",
    icon: Eye,
    isNew: true,
    time: new Date(Date.now() - 7 * 60 * 1000),
  },
  {
    id: "3",
    initials: "JW",
    name: "James Wright",
    action: "edited",
    sub: "Budget Tracker",
    icon: Edit3,
    isNew: true,
    time: new Date(Date.now() - 18 * 60 * 1000),
  },
  {
    id: "4",
    initials: "PS",
    name: "Priya Sharma",
    action: "commented on",
    sub: "Marketing KPIs",
    icon: MessageSquare,
    isNew: false,
    time: new Date(Date.now() - 34 * 60 * 1000),
  },
  {
    id: "5",
    initials: "LM",
    name: "Leon Mueller",
    action: "joined",
    sub: "Design Studio",
    icon: Building2,
    isNew: false,
    time: new Date(Date.now() - 55 * 60 * 1000),
  },
  {
    id: "6",
    initials: "AN",
    name: "Aisha Noor",
    action: "shared",
    sub: "Investor Deck",
    icon: Share2,
    isNew: false,
    time: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: "7",
    initials: "TE",
    name: "Tom Erikson",
    action: "exported",
    sub: "HR Headcount",
    icon: Download,
    isNew: false,
    time: new Date(Date.now() - 5 * 60 * 60 * 1000),
  },
];

function ActivityFeedCard() {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? ACTIVITIES : ACTIVITIES.slice(0, 4);

  return (
    <div className="rounded-xl border border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
        <span className="text-sm font-semibold">Activity</span>
        <span className="text-[11px] text-muted-foreground">
          {ACTIVITIES.filter((a) => a.isNew).length} new
        </span>
      </div>

      {/* Rows */}
      <div className="divide-y divide-border/40">
        {visible.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.id} className="flex items-center gap-3 px-4 py-3">
              {/* Avatar with new dot */}
              <div className="relative shrink-0">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-[10px] font-bold bg-primary/15 text-primary">
                    {item.initials}
                  </AvatarFallback>
                </Avatar>
                {item.isNew && (
                  <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary border-2 border-card" />
                )}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="text-[13px] leading-snug text-foreground truncate">
                  <span className="font-semibold">{item.name}</span>
                </p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {item.action} ·{" "}
                  <span className="text-foreground/70">{item.sub}</span>
                </p>
              </div>

              {/* Right: icon + time */}
              <div className="flex flex-col items-end gap-1 shrink-0">
                <Icon className="h-3.5 w-3.5 text-primary/60" />
                <span className="text-[11px] text-muted-foreground tabular-nums">
                  {timeAgo(item.time)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Show more */}
      {!showAll && ACTIVITIES.length > 4 && (
        <div className="px-4 py-2 border-t border-border/40">
          <button
            onClick={() => setShowAll(true)}
            className="text-[11px] text-primary hover:underline"
          >
            Show {ACTIVITIES.length - 4} more
          </button>
        </div>
      )}
    </div>
  );
}

// ─── ACCESS REQUESTS ──────────────────────────────────────────────────────────

const INITIAL_REQUESTS = [
  {
    id: "r1",
    initials: "FZ",
    name: "Fatima Zahra",
    email: "fatima@venture.io",
    sheet: "Sales Pipeline Q1",
    type: "edit",
    time: new Date(Date.now() - 8 * 60 * 1000),
  },
  {
    id: "r2",
    initials: "DP",
    name: "David Park",
    email: "david@techstart.co",
    sheet: "Investor Deck Data",
    type: "view",
    time: new Date(Date.now() - 45 * 60 * 1000),
  },
  {
    id: "r3",
    initials: "ML",
    name: "Mei Lin",
    email: "mei@globalops.com",
    sheet: "HR Headcount 2025",
    type: "view",
    time: new Date(Date.now() - 3 * 60 * 60 * 1000),
  },
];

function AccessRequestsCard() {
  const [requests, setRequests] = useState(INITIAL_REQUESTS);
  const [fading, setFading] = useState<string | null>(null);

  function action(id: string) {
    setFading(id);
    setTimeout(
      () => setRequests((prev) => prev.filter((r) => r.id !== id)),
      350,
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
        <span className="text-sm font-semibold">Requests</span>
        {requests.length > 0 && (
          <span className="text-[11px] bg-primary/10 text-primary font-semibold px-2 py-0.5 rounded-full">
            {requests.length}
          </span>
        )}
      </div>

      {/* Rows */}
      <div className="divide-y divide-border/40">
        {requests.length === 0 ? (
          <p className="text-[12px] text-muted-foreground text-center py-6">
            No pending requests 🎉
          </p>
        ) : (
          requests.map((req) => (
            <div
              key={req.id}
              className={cn(
                "flex items-center gap-3 px-4 py-3 transition-all duration-300",
                fading === req.id && "opacity-0 scale-95",
              )}
            >
              {/* Avatar */}
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="text-[10px] font-bold bg-primary/15 text-primary">
                  {req.initials}
                </AvatarFallback>
              </Avatar>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-foreground leading-snug truncate">
                  {req.name}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {req.type === "edit" ? "Edit" : "View"} ·{" "}
                  <span className="text-foreground/70">{req.sheet}</span>
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {timeAgo(req.time)} ago
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => action(req.id)}
                  className="flex items-center justify-center h-7 w-7 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                  title="Approve"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => action(req.id)}
                  className="flex items-center justify-center h-7 w-7 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  title="Deny"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Combined export (drop-in for the section) ────────────────────────────────

export default function DashboardPanel() {
  return (
    <div className="space-y-4">
      <ActivityFeedCard />
      <AccessRequestsCard />
    </div>
  );
}
