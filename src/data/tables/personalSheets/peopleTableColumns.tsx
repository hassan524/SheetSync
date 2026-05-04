import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Mail,
  Shield,
  Clock,
  Circle,
  FileSpreadsheet,
  Building2,
  Eye,
  MessageSquare,
  ShieldCheck,
  UserMinus,
} from "lucide-react";
import type { PersonData } from "@/lib/querys/people/people";

const statusColors: Record<string, string> = {
  online: "fill-emerald-500 text-emerald-500",
  away: "fill-amber-500 text-amber-500",
  offline: "fill-gray-400 text-gray-400",
};

const roleVariants: Record<string, "default" | "secondary" | "outline"> = {
  Admin: "default",
  Editor: "secondary",
  Viewer: "outline",
};

export const peopleColumns = [
  {
    key: "user",
    header: "User",
    render: (person: PersonData) => (
      <div className="flex items-center gap-3">
        <div className="relative">
          <Avatar className="h-8 w-8">
            <AvatarImage src={person.avatar} />
            <AvatarFallback className="text-[11px] bg-accent text-accent-foreground">
              {person.initials}
            </AvatarFallback>
          </Avatar>
          <div
            className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background ${
              person.status === "online"
                ? "bg-emerald-500"
                : person.status === "away"
                  ? "bg-amber-500"
                  : "bg-gray-400"
            }`}
          />
        </div>
        <div className="min-w-0">
          <span className="text-sm font-medium truncate max-w-[200px] block">
            {person.name}
          </span>
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Mail className="h-3 w-3" />
            {person.email}
          </span>
        </div>
      </div>
    ),
  },
  {
    key: "role",
    header: "Role",
    width: "110px",
    render: (person: PersonData) => (
      <Badge variant={roleVariants[person.role]} className="text-[11px] gap-1">
        <Shield className="h-3 w-3" />
        {person.role}
      </Badge>
    ),
  },
  {
    key: "status",
    header: "Status",
    width: "110px",
    render: (person: PersonData) => (
      <div className="flex items-center gap-1.5">
        <Circle
          className={`h-2 w-2 ${statusColors[person.status]}`}
        />
        <span className="text-xs capitalize">{person.status}</span>
      </div>
    ),
  },
  {
    key: "lastActive",
    header: "Last Active",
    width: "130px",
    render: (person: PersonData) => (
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Clock className="h-3 w-3" />
        <span>{person.lastActive}</span>
      </div>
    ),
  },
  {
    key: "sheetsAccess",
    header: "Sheets Access",
    width: "110px",
    render: (person: PersonData) => (
      <div className="flex items-center gap-1.5">
        <FileSpreadsheet className="h-3 w-3 text-muted-foreground" />
        <span className="text-xs font-medium">{person.sheetsAccess}</span>
      </div>
    ),
  },
  {
    key: "organizations",
    header: "Organizations",
    width: "200px",
    render: (person: PersonData) => (
      <div className="flex flex-wrap gap-1">
        {person.organizations.slice(0, 2).map((org) => (
          <Badge key={org} variant="outline" className="text-[11px] gap-1">
            <Building2 className="h-3 w-3" />
            {org}
          </Badge>
        ))}
        {person.organizations.length > 2 && (
          <Badge variant="outline" className="text-[11px]">
            +{person.organizations.length - 2}
          </Badge>
        )}
      </div>
    ),
  },
];

export const peopleAction = {
  render: (person: PersonData) => (
    <>
      <DropdownMenuItem className="text-xs gap-2">
        <Eye className="h-3.5 w-3.5" /> View Profile
      </DropdownMenuItem>
      <DropdownMenuItem className="text-xs gap-2">
        <MessageSquare className="h-3.5 w-3.5" /> Send Message
      </DropdownMenuItem>
      <DropdownMenuItem className="text-xs gap-2">
        <ShieldCheck className="h-3.5 w-3.5" /> Change Role
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem className="text-xs gap-2 text-red-600 focus:text-red-600">
        <UserMinus className="h-3.5 w-3.5" /> Remove Access
      </DropdownMenuItem>
    </>
  ),
};

export function NoPeopleIcon() {
  return (
    <svg
      width="72"
      height="72"
      viewBox="0 0 72 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="10"
        y="8"
        width="52"
        height="56"
        rx="7"
        fill="currentColor"
        className="text-muted/30"
      />
      <rect
        x="10"
        y="8"
        width="52"
        height="56"
        rx="7"
        stroke="currentColor"
        strokeWidth="1.5"
        className="text-border"
      />
      {/* Person silhouette */}
      <circle
        cx="36"
        cy="28"
        r="7"
        fill="currentColor"
        className="text-muted/50"
      />
      <path
        d="M24 46c0-6.627 5.373-12 12-12s12 5.373 12 12"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="currentColor"
        className="text-muted/40"
      />
      <circle cx="54" cy="54" r="11" fill="hsl(var(--background))" />
      <circle
        cx="54"
        cy="54"
        r="11"
        stroke="currentColor"
        strokeWidth="1.5"
        className="text-border"
      />
      <line
        x1="50"
        y1="54"
        x2="58"
        y2="54"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        className="text-muted-foreground/60"
      />
      <line
        x1="54"
        y1="50"
        x2="54"
        y2="58"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        className="text-muted-foreground/60"
      />
    </svg>
  );
}
