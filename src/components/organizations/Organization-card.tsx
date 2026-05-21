"use client";

import { useRouter } from "next/navigation";
import {
  Building2,
  Users,
  FileSpreadsheet,
  Shield,
  ChevronRight,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Role } from "@/types";

const roleColors: Record<Role, string> = {
  owner: "bg-primary/10 text-primary border-primary/20",
  admin: "bg-accent text-accent-foreground border-accent",
  editor: "bg-secondary text-secondary-foreground border-secondary",
  viewer: "bg-muted text-muted-foreground border-muted",
};

interface OrganizationCardProps {
  id: string;
  name: string;
  role: Role;
  membersCount?: number;
  sheetsCount?: number;
  activeNow?: number;
  recentMembers?: { initials: string }[];
}

const OrganizationCard: React.FC<OrganizationCardProps> = ({
  id,
  name,
  role,
  membersCount = 0,
  sheetsCount = 0,
  activeNow = 0,
  recentMembers = [],
}) => {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/organizations/${id}`);
  };

  return (
    <div
      onClick={handleClick}
      className="group p-3 sm:p-4 rounded-lg border border-border bg-card transition-all duration-200 hover:shadow-md hover:border-primary/20 cursor-pointer animate-scale-in"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3 sm:mb-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg bg-primary/10 border border-primary/15 flex items-center justify-center shrink-0">
            <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h3
              className="expandable-truncate text-sm sm:text-base font-semibold"
              title={name}
              tabIndex={0}
            >
              {name}
            </h3>
            <Badge
              variant="outline"
              className={`text-[10px] sm:text-xs mt-1 h-5 px-1.5 ${roleColors[role]}`}
            >
              <Shield className="h-3 w-3 mr-1" />
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </Badge>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] sm:text-xs text-muted-foreground min-w-0">
          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <Users className="h-3.5 w-3.5" />
            {membersCount} members
            {activeNow > 0 && (
              <span className="flex items-center gap-1 ml-1 text-emerald-600 font-medium whitespace-nowrap">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                {activeNow} online
              </span>
            )}
          </span>
          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <FileSpreadsheet className="h-3.5 w-3.5" />
            {sheetsCount} sheets
          </span>
        </div>

        {recentMembers.length > 0 && (
          <div className="flex -space-x-2">
            {recentMembers.slice(0, 3).map((member, i) => (
              <Avatar key={i} className="h-7 w-7 border-2 border-card">
                <AvatarFallback className="text-xs bg-muted text-muted-foreground">
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

