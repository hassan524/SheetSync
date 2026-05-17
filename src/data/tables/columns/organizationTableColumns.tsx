"use client";

import { Badge } from "@/components/ui/badge";
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Building2,
  Users,
  FileSpreadsheet,
  Clock,
  Circle,
  LogOut,
  Settings,
  ExternalLink,
  UserPlus,
} from "lucide-react";
import { OrganizationTableData, Role } from "@/types";
import { useRouter } from "next/navigation";
import Link from "next/link";

const roleVariants: Record<Role, "default" | "secondary" | "outline"> = {
  owner: "default",
  admin: "default",
  editor: "secondary",
  viewer: "outline",
};

export const organizationColumns = [
  {
    key: "name",
    header: "Organization",
    render: (org: OrganizationTableData) => (
      <div className="flex items-center gap-3">
        <div className="h-7 w-7 rounded-lg border bg-card flex items-center justify-center shadow-sm shrink-0">
          <Building2 className="h-3.5 w-3.5 text-primary/60" />
        </div>
        <div className="min-w-0">
          <Link
            href={`/organizations/${org.id}`}
            className="text-sm font-medium truncate max-w-[200px] block text-foreground hover:text-primary hover:underline transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            {org.name}
          </Link>
          <span className="text-[11px] text-muted-foreground">
            Created {org.createdAt}
          </span>
        </div>
      </div>
    ),
  },
  {
    key: "role",
    header: "Your Role",
    width: "120px",
    render: (org: OrganizationTableData) => (
      <Badge variant={roleVariants[org.role]} className="text-[11px]">
        {org.role}
      </Badge>
    ),
  },
  {
    key: "members",
    header: "Members",
    width: "110px",
    render: (org: OrganizationTableData) => (
      <div className="flex items-center gap-1.5">
        <Users className="h-3 w-3 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">
          {org.members} {org.members === 1 ? "member" : "members"}
        </span>
      </div>
    ),
  },
  {
    key: "activeNow",
    header: "Active Now",
    width: "110px",
    render: (org: OrganizationTableData) => (
      <div className="flex items-center gap-1.5">
        <Circle className="h-2 w-2 fill-emerald-500 text-emerald-500" />
        <span className="text-xs font-medium text-emerald-600">
          {org.activeNow} online
        </span>
      </div>
    ),
  },
  {
    key: "sheets",
    header: "Sheets",
    width: "90px",
    render: (org: OrganizationTableData) => (
      <div className="flex items-center gap-1.5">
        <FileSpreadsheet className="h-3 w-3 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{org.sheets}</span>
      </div>
    ),
  },
  {
    key: "created",
    header: "Created",
    width: "120px",
    render: (org: OrganizationTableData) => (
      <span className="text-xs text-muted-foreground">
        {org.createdAt ?? "—"}
      </span>
    ),
  },
  {
    key: "lastModified",
    header: "Last Modified",
    width: "130px",
    render: (org: OrganizationTableData) => (
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Clock className="h-3 w-3" />
        <span>{org.lastModified}</span>
      </div>
    ),
  },
];

export function OrganizationActionMenu({
  org,
}: {
  org: OrganizationTableData;
}) {
  const router = useRouter();

  return (
    <>
      <DropdownMenuItem
        className="text-xs gap-2"
        onClick={() => router.push(`/organizations/${org.id}`)}
      >
        <ExternalLink className="h-3.5 w-3.5" /> Open Dashboard
      </DropdownMenuItem>
      <DropdownMenuItem
        className="text-xs gap-2"
        onClick={() => router.push(`/organizations/${org.id}?tab=sheets`)}
      >
        <FileSpreadsheet className="h-3.5 w-3.5" /> View Sheets
      </DropdownMenuItem>
      <DropdownMenuItem
        className="text-xs gap-2"
        onClick={() => router.push(`/organizations/${org.id}?tab=members`)}
      >
        <Users className="h-3.5 w-3.5" /> Manage Members
      </DropdownMenuItem>
      {(org.role === "admin" || org.role === "owner") && (
        <DropdownMenuItem className="text-xs gap-2">
          <UserPlus className="h-3.5 w-3.5" /> Invite People
        </DropdownMenuItem>
      )}
      <DropdownMenuSeparator />
      <DropdownMenuItem
        className="text-xs gap-2"
        onClick={() => router.push(`/organizations/${org.id}?tab=settings`)}
      >
        <Settings className="h-3.5 w-3.5" /> Settings
      </DropdownMenuItem>
      {org.role !== "admin" && org.role !== "owner" && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-xs gap-2 text-red-600 focus:text-red-600">
            <LogOut className="h-3.5 w-3.5" /> Leave Organization
          </DropdownMenuItem>
        </>
      )}
    </>
  );
}

export const organizationAction = {
  render: (org: OrganizationTableData) => <OrganizationActionMenu org={org} />,
};

export function NoOrganizationsIcon() {
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
      <rect
        x="18"
        y="20"
        width="16"
        height="14"
        rx="3"
        fill="currentColor"
        className="text-muted/40"
      />
      <rect
        x="38"
        y="20"
        width="16"
        height="14"
        rx="3"
        fill="currentColor"
        className="text-muted/40"
      />
      <rect
        x="28"
        y="38"
        width="16"
        height="14"
        rx="3"
        fill="currentColor"
        className="text-muted/40"
      />
      <line
        x1="26"
        y1="27"
        x2="38"
        y2="27"
        stroke="currentColor"
        strokeWidth="1"
        className="text-border/60"
      />
      <line
        x1="36"
        y1="27"
        x2="36"
        y2="38"
        stroke="currentColor"
        strokeWidth="1"
        className="text-border/60"
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
