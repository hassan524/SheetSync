import { Globe, Lock, Calendar, TrendingUp } from "lucide-react";
import { OrgDetail } from "@/app/organizations/[id]/page";

export function OrgBottomStrip({ org }: { org: OrgDetail }) {
  const stats     = org.weeklyStats;
  const createdAt = new Date(org.created_at).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

      <div className="border rounded-xl bg-card px-5 py-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
          <p className="text-xs font-semibold">This week</p>
        </div>
        {stats ? (
          <div className="flex items-stretch divide-x">
            {[
              { label: "Sheets created", value: String(stats.sheetsCreated),           color: "text-blue-600"   },
              { label: "Total edits",    value: stats.editsThisWeek.toLocaleString(),   color: "text-violet-600" },
              { label: "Collaborations", value: String(stats.collaborations),           color: "text-green-600"  },
            ].map((s, i) => (
              <div key={i} className={`flex-1 text-center ${i > 0 ? "pl-4" : ""} ${i < 2 ? "pr-4" : ""}`}>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">{s.label}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No stats available.</p>
        )}
      </div>

      <div className="border rounded-xl bg-card px-5 py-4">
        <p className="text-xs font-semibold mb-4">Organization info</p>
        <div className="flex items-center justify-between">
          {[
            { Icon: Globe,    label: "Visibility", value: "Private"     },
            { Icon: Lock,     label: "Access",     value: "Invite only" },
            { Icon: Calendar, label: "Created",    value: createdAt     },
          ].map(({ Icon, label, value }, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg border flex items-center justify-center shrink-0">
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs font-medium leading-tight">{value}</p>
                <p className="text-[11px] text-muted-foreground">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}