import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { BarChart3 } from "lucide-react";
import { Organization } from "@/types";

function NoActivityIcon() {
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
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

export function OrgActivityPanel({ org }: { org: Organization }) {
  const activity = org.recentActivity ?? [];

  return (
    <div
      className="border rounded-xl bg-card overflow-hidden flex flex-col"
      style={{ minHeight: "65vh", maxHeight: "65vh" }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b shrink-0">
        <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
        <p className="text-xs font-semibold">Recent activity</p>
        <span className="ml-auto text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
          {activity.length} events
        </span>
      </div>

      {/* Body */}
      {activity.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
          <div className="text-muted-foreground/60">
            <NoActivityIcon />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">No activity yet</p>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-[160px] mx-auto">
              Actions taken in this organization will show up here.
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-y-auto flex-1 divide-y">
          {activity.map((a, i) => (
            <div
              key={i}
              className="flex items-start gap-3 px-4 py-3 hover:bg-muted/10 transition-colors"
            >
              <Avatar className="h-7 w-7 shrink-0 mt-px">
                <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
                  {a.avatar}
                </AvatarFallback>
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
      )}
    </div>
  );
}