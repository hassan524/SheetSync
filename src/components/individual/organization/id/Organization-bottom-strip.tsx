import { TrendingUp, Crown, Calendar, Lock, Users, FileSpreadsheet, PenLine, UserCheck } from "lucide-react";
import { Organization } from "@/types";

export function OrgBottomStrip({ org }: { org: Organization }) {
  const stats = org.weeklyStats;

  const createdAt = new Date(org.created_at).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });

  const createdDaysAgo = Math.floor(
    (Date.now() - new Date(org.created_at).getTime()) / (1000 * 60 * 60 * 24)
  );

  const ageLabel =
    createdDaysAgo === 0 ? "Today" :
    createdDaysAgo === 1 ? "Yesterday" :
    createdDaysAgo < 30  ? `${createdDaysAgo} days ago` :
    createdDaysAgo < 365 ? `${Math.floor(createdDaysAgo / 30)} months ago` :
                           `${Math.floor(createdDaysAgo / 365)} yr ago`;

  const owner   = org.members?.find(m => m.role === "owner");
  const admins  = org.members?.filter(m => m.role === "admin").length  ?? 0;
  const editors = org.members?.filter(m => m.role === "editor").length ?? 0;
  const viewers = org.members?.filter(m => m.role === "viewer").length ?? 0;
  const total   = org.members?.length ?? 0;

  const weekStats = [
    {
      icon: FileSpreadsheet,
      label: "New sheets",
      sublabel: "Created this week",
      value: stats?.sheetsCreated ?? 0,
      color: "text-blue-600",
      iconBg: "bg-blue-50 border-blue-100",
      iconColor: "text-blue-500",
    },
    {
      icon: PenLine,
      label: "Edits made",
      sublabel: "Across all sheets",
      value: stats?.editsThisWeek ?? 0,
      color: "text-violet-600",
      iconBg: "bg-violet-50 border-violet-100",
      iconColor: "text-violet-500",
    },
    {
      icon: UserCheck,
      label: "Contributors",
      sublabel: "Active members",
      value: org.members?.filter(m => m.status === "online").length ?? 0,
      color: "text-emerald-600",
      iconBg: "bg-emerald-50 border-emerald-100",
      iconColor: "text-emerald-500",
    },
  ];

  const roleRows = [
    { label: "Admin",  count: admins,  color: "bg-purple-500" },
    { label: "Editor", count: editors, color: "bg-blue-500"   },
    { label: "Viewer", count: viewers, color: "bg-slate-400"  },
  ].filter(r => r.count > 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

      {/* ── Weekly Activity ── */}
      <div className="border rounded-xl bg-card px-5 py-4 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-xs font-semibold">This week</p>
          </div>
          <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            Last 7 days
          </span>
        </div>

        <div className="grid grid-cols-3 divide-x">
          {weekStats.map((s, i) => (
            <div
              key={i}
              className={`flex flex-col gap-2 ${i > 0 ? "pl-4" : ""} ${i < 2 ? "pr-4" : ""}`}
            >
              <div className={`h-7 w-7 rounded-lg border ${s.iconBg} flex items-center justify-center`}>
                <s.icon className={`h-3.5 w-3.5 ${s.iconColor}`} />
              </div>
              <div>
                <p className={`text-2xl font-bold tracking-tight ${s.color}`}>
                  {s.value.toLocaleString()}
                </p>
                <p className="text-xs font-medium text-foreground leading-tight mt-0.5">
                  {s.label}
                </p>
                <p className="text-[11px] text-muted-foreground leading-tight">
                  {s.sublabel}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Organization Info ── */}
      <div className="border rounded-xl bg-card px-5 py-4 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-xs font-semibold">Organization info</p>
          </div>
          <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {total} {total === 1 ? "member" : "members"}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col gap-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Owner
            </p>
            <div className="flex items-center gap-1.5">
              <div className="h-6 w-6 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
                <Crown className="h-3 w-3 text-amber-500" />
              </div>
              <span className="text-xs font-medium truncate">
                {owner?.profiles?.name?.split(" ")[0] ?? "—"}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Created
            </p>
            <div className="flex items-center gap-1.5">
              <div className="h-6 w-6 rounded-full border flex items-center justify-center shrink-0">
                <Calendar className="h-3 w-3 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium leading-tight truncate">{createdAt}</p>
                <p className="text-[10px] text-muted-foreground">{ageLabel}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Access
            </p>
            <div className="flex items-center gap-1.5">
              <div className="h-6 w-6 rounded-full border flex items-center justify-center shrink-0">
                <Lock className="h-3 w-3 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs font-medium leading-tight">Invite only</p>
                <p className="text-[10px] text-muted-foreground">Private org</p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t pt-3 flex flex-col gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Role breakdown
          </p>
          {roleRows.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              {roleRows.map((r) => (
                <div key={r.label} className="flex items-center gap-2.5">
                  <span className="text-[11px] text-muted-foreground w-10 shrink-0">{r.label}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full ${r.color} transition-all duration-500`}
                      style={{ width: total ? `${(r.count / total) * 100}%` : "0%" }}
                    />
                  </div>
                  <span className="text-[11px] font-medium text-foreground w-3 text-right shrink-0">
                    {r.count}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-muted-foreground">No role data yet.</p>
          )}
        </div>
      </div>

    </div>
  );
}