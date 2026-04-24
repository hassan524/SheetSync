import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress }               from "@/components/ui/progress";
import { Users, Activity, FileSpreadsheet, HardDrive } from "lucide-react";
import { Organization } from "@/types";

export function OrgStatCards({ org }: { org: Organization }) {
  const members = org.members ?? [];
  const sheets  = org.sheets  ?? [];
  const online  = members.filter(m => m.status === "online");
  const pct     = org.storageUsed && org.storageLimit
    ? Math.round((org.storageUsed / org.storageLimit) * 100)
    : 0;

  const storageColor =
    pct >= 90 ? "text-red-600"    :
    pct >= 70 ? "text-orange-500" :
                "text-green-600";

  const storageBarColor =
    pct >= 90 ? "[&>div]:bg-red-500"    :
    pct >= 70 ? "[&>div]:bg-orange-400" :
                "[&>div]:bg-green-500";

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

      {/* ── Members ───────────────────────────────────────────── */}
      <div className="relative border rounded-xl p-4 bg-card overflow-hidden group hover:shadow-md transition-shadow duration-200">
        {/* bg glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none" />
        <div className="flex items-start justify-between mb-3">
          <div className="h-9 w-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
            <Users className="h-4 w-4 text-blue-500" />
          </div>
          <span className="text-[10px] font-medium text-green-600 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 px-1.5 py-0.5 rounded-full">
            ↑ 12%
          </span>
        </div>
        <p className="text-2xl font-bold tracking-tight">{members.length}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">Total members</p>
        {/* stacked avatars */}
        <div className="flex mt-3">
          {members.slice(0, 6).map((m, i) => (
            <Avatar key={m.id} className="h-5 w-5 ring-2 ring-background" style={{ marginLeft: i ? -6 : 0 }}>
              <AvatarFallback className="text-[8px] font-bold bg-blue-100 text-blue-700">
                {m.profiles.name?.charAt(0) ?? "?"}
              </AvatarFallback>
            </Avatar>
          ))}
          {members.length > 6 && (
            <span className="text-[10px] text-muted-foreground ml-1.5 self-center">
              +{members.length - 6} more
            </span>
          )}
        </div>
      </div>

      {/* ── Active now ────────────────────────────────────────── */}
      <div className="relative border rounded-xl p-4 bg-card overflow-hidden group hover:shadow-md transition-shadow duration-200">
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent pointer-events-none" />
        <div className="flex items-start justify-between mb-3">
          <div className="relative h-9 w-9 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center shrink-0">
            <Activity className="h-4 w-4 text-green-500" />
            <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-green-400 animate-pulse ring-2 ring-background" />
          </div>
          <span className="text-[10px] font-medium text-green-600 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 px-1.5 py-0.5 rounded-full">
            Live
          </span>
        </div>
        <p className="text-2xl font-bold tracking-tight text-green-600">
          {online.length}
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5">Active right now</p>
        <div className="mt-3 flex items-center gap-1.5">
          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-green-500 transition-all duration-500"
              style={{ width: members.length ? `${(online.length / members.length) * 100}%` : "0%" }}
            />
          </div>
          <span className="text-[10px] text-muted-foreground shrink-0">
            {members.length ? Math.round((online.length / members.length) * 100) : 0}%
          </span>
        </div>
      </div>

      {/* ── Sheets ────────────────────────────────────────────── */}
      <div className="relative border rounded-xl p-4 bg-card overflow-hidden group hover:shadow-md transition-shadow duration-200">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent pointer-events-none" />
        <div className="flex items-start justify-between mb-3">
          <div className="h-9 w-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
            <FileSpreadsheet className="h-4 w-4 text-violet-500" />
          </div>
          <span className="text-[10px] font-medium text-violet-600 bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800 px-1.5 py-0.5 rounded-full">
            ↑ 8 this week
          </span>
        </div>
        <p className="text-2xl font-bold tracking-tight">{sheets.length}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">Total sheets</p>
        <div className="mt-3 grid grid-cols-3 gap-1">
          {[...Array(Math.min(sheets.length, 9))].map((_, i) => (
            <div
              key={i}
              className="h-1.5 rounded-full bg-violet-200 dark:bg-violet-900/50"
              style={{ opacity: 1 - i * 0.08 }}
            />
          ))}
          {sheets.length === 0 && (
            <div className="col-span-3 h-1.5 rounded-full bg-muted" />
          )}
        </div>
      </div>

      {/* ── Storage ───────────────────────────────────────────── */}
      <div className="relative border rounded-xl p-4 bg-card overflow-hidden group hover:shadow-md transition-shadow duration-200">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent pointer-events-none" />
        <div className="flex items-start justify-between mb-3">
          <div className="h-9 w-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
            <HardDrive className="h-4 w-4 text-orange-500" />
          </div>
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${
            pct >= 90
              ? "text-red-600 bg-red-50 border-red-200 dark:bg-red-950/40 dark:border-red-800"
              : pct >= 70
              ? "text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-950/40 dark:border-orange-800"
              : "text-green-600 bg-green-50 border-green-200 dark:bg-green-950/40 dark:border-green-800"
          }`}>
            {pct}% used
          </span>
        </div>
        <p className="text-2xl font-bold tracking-tight">
          {(org.storageUsed ?? 0).toFixed(1)}
          <span className="text-sm font-normal text-muted-foreground"> GB</span>
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          of {org.storageLimit ?? 0} GB limit
        </p>
        <div className="mt-3 space-y-1">
          <Progress value={pct} className={`h-1.5 ${storageBarColor}`} />
          <p className={`text-[10px] font-medium ${storageColor}`}>
            {pct >= 90
              ? "Critical — upgrade soon"
              : pct >= 70
              ? "Getting full"
              : `${((org.storageLimit ?? 0) - (org.storageUsed ?? 0)).toFixed(1)} GB free`}
          </p>
        </div>
      </div>

    </div>
  );
}