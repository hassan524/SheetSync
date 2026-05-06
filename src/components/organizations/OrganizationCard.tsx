import {
  Building2,
  Users,
  FileSpreadsheet,
  Shield,
  ChevronRight,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface OrganizationCardProps {
  name: string;
  role: "Admin" | "Member" | "Viewer";
  members: number;
  sheets: number;
  recentMembers?: { name: string; initials: string }[];
}

const roleColors = {
  Admin: "bg-primary/10 text-primary border-primary/20",
  Member: "bg-accent text-accent-foreground border-accent",
  Viewer: "bg-muted text-muted-foreground border-muted",
};

const OrganizationCard = ({
  name,
  role,
  members,
  sheets,
  recentMembers = [],
}: OrganizationCardProps) => {
  return (
    <div className="group p-4 rounded-xl border border-border bg-card transition-all duration-300 hover:shadow-elevated hover:border-primary/20 cursor-pointer animate-scale-in">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">{name}</h3>
            <Badge
              variant="outline"
              className={`text-xs mt-1 ${roleColors[role]}`}
            >
              <Shield className="h-3 w-3 mr-1" />
              {role}
            </Badge>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            {members} members
          </span>
          <span className="flex items-center gap-1.5">
            <FileSpreadsheet className="h-4 w-4" />
            {sheets} sheets
          </span>
        </div>

        {recentMembers.length > 0 && (
          <div className="flex -space-x-2">
            {recentMembers.slice(0, 3).map((member, i) => (
              <Avatar key={i} className="h-7 w-7 border-2 border-card">
                <AvatarFallback className="text-xs bg-accent text-accent-foreground">
                  {member.initials}
                </AvatarFallback>
              </Avatar>
            ))}
            {recentMembers.length > 3 && (
              <div className="h-7 w-7 rounded-full bg-muted border-2 border-card flex items-center justify-center text-xs text-muted-foreground">
                +{recentMembers.length - 3}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrganizationCard;
