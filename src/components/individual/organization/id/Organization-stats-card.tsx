import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress }               from "@/components/ui/progress";
import { Users, Activity, FileSpreadsheet, HardDrive } from "lucide-react";
import { Organization } from "@/types";

export function OrgStatCards({ org }: { org: Organization }) {
  const members = org.members ?? [];
  const online  = members.filter(m => m.status === "online");
  const pct     = org.storageUsed && org.storageLimit
    ? Math.round((org.storageUsed / org.storageLimit) * 100)
    : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

      <div className="border rounded-xl p-3.5 bg-card flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-blue-500 flex items-center justify-center shrink-0">
          <Users className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground">Members</p>
          <p className="text-xl font-bold leading-tight">{members.length}</p>
          <p className="text-[10px] text-green-600">↑ +12% month</p>
        </div>
      </div>

      <div className="border rounded-xl p-3.5 bg-card flex items-center gap-3">
        <div className="relative h-8 w-8 rounded-lg bg-green-500 flex items-center justify-center shrink-0">
          <Activity className="h-4 w-4 text-white" />
          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-green-300 animate-pulse ring-1 ring-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-muted-foreground">Active now</p>
          <p className="text-xl font-bold leading-tight text-green-600">{org.activeNow ?? 0}</p>
          <div className="flex mt-0.5">
            {online.slice(0, 5).map((m, i) => (
              <Avatar key={m.id} className="h-4 w-4 ring-1 ring-background" style={{ marginLeft: i ? -5 : 0 }}>
                <AvatarFallback className="text-[7px] font-bold bg-primary/10 text-primary">
                  {m.avatar?.[0]}
                </AvatarFallback>
              </Avatar>
            ))}
            {online.length > 5 && (
              <span className="text-[10px] text-muted-foreground ml-1 self-center">+{online.length - 5}</span>
            )}
          </div>
        </div>
      </div>

      <div className="border rounded-xl p-3.5 bg-card flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-violet-500 flex items-center justify-center shrink-0">
          <FileSpreadsheet className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground">Sheets</p>
          <p className="text-xl font-bold leading-tight">{org.sheets?.length ?? org.sheets.length}</p>
          <p className="text-[10px] text-green-600">↑ +8 this week</p>
        </div>
      </div>

      <div className="border rounded-xl p-3.5 bg-card flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-orange-500 flex items-center justify-center shrink-0">
          <HardDrive className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-muted-foreground">Storage</p>
          <p className="text-xl font-bold leading-tight">
            {org.storageUsed ?? 0}
            <span className="text-xs font-normal text-muted-foreground"> / {org.storageLimit ?? 0}GB</span>
          </p>
          <Progress value={pct} className="h-1 mt-1" />
        </div>
      </div>

    </div>
  );
}