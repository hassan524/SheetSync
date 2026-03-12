import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { BarChart3 }              from "lucide-react";
import { OrgDetail } from "@/app/organizations/[id]/page";

export function OrgActivityPanel({ org }: { org: OrgDetail }) {
  const activity = org.recentActivity ?? [];

  return (
    <div className="border rounded-xl bg-card overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b">
        <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
        <p className="text-xs font-semibold">Recent activity</p>
        <span className="ml-auto text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
          {activity.length} events
        </span>
      </div>
      <div className="divide-y">
        {activity.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-8">No recent activity.</p>
        )}
        {activity.map((a, i) => (
          <div key={i} className="flex items-start gap-3 px-4 py-3 hover:bg-muted/10 transition-colors">
            <Avatar className="h-7 w-7 shrink-0 mt-px">
              <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">{a.avatar}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-xs leading-snug">
                <span className="font-semibold">{a.user.split(" ")[0]}</span>{" "}
                <span className="text-muted-foreground">{a.action}</span>{" "}
                <span className="font-medium">{a.target}</span>
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">{a.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}