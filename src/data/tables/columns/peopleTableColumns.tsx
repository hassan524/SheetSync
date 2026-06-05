"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Mail,
  Clock,
  Circle,
  FileSpreadsheet,
  Building2,
  ShieldCheck,
  ChevronRight,
  Shield,
} from "lucide-react";
import type { PersonData } from "@/lib/querys/people/people";

/* ---------------- TYPES ---------------- */

type Role = "Owner" | "Admin" | "Editor" | "Viewer";

/* ---------------- STYLE MAPS ---------------- */

const statusColors: Record<string, string> = {
  online: "fill-emerald-500 text-emerald-500",
  away: "fill-amber-500 text-amber-500",
  offline: "fill-gray-400 text-gray-400",
};

const ROLE_STYLE: Record<Role, string> = {
  Admin: "text-purple-700 bg-purple-50 border border-purple-200",
  Editor: "text-blue-700 bg-blue-50 border border-blue-200",
  Viewer: "text-slate-600 bg-slate-50 border border-slate-200",
  Owner: "text-amber-700 bg-amber-50 border border-amber-200",
};

/* ---------------- COLUMNS ---------------- */

export const peopleColumns = [
  {
    key: "user",
    header: "Member",
    width: "280px",
    render: (person: PersonData) => (
      <div className="flex items-center gap-3">
        <div className="relative">
          <Avatar className="h-8 w-8">
            <AvatarImage src={person.avatar} />
            <AvatarFallback className="text-[11px] bg-accent text-accent-foreground font-semibold">
              {person.initials}
            </AvatarFallback>
          </Avatar>

          <div
            className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background ${
              person.status === "online"
                ? "bg-emerald-500"
                : person.status === "away"
                  ? "bg-amber-500"
                  : "bg-gray-300"
            }`}
          />
        </div>

        <div className="min-w-0">
          <span className="text-sm font-semibold truncate max-w-[190px] block">
            {person.name}
          </span>
          <span className="text-[11px] text-muted-foreground flex items-center gap-1 max-w-[210px]">
            <Mail className="h-3 w-3 shrink-0" />
            <span className="truncate">{person.email}</span>
          </span>
        </div>
      </div>
    ),
  },

  {
    key: "organizations",
    header: "Organizations",
    width: "260px",
    render: (person: PersonData) => {
      const orgs = person.organizations ?? [];

      if (orgs.length === 0) {
        return (
          <span className="text-xs text-muted-foreground">
            No organizations
          </span>
        );
      }

      return (
        <div className="flex flex-wrap gap-1.5">
          {orgs.slice(0, 2).map((org, idx) => (
            <div key={idx} className="flex min-w-0 items-center gap-1.5">
              <div className="flex min-w-0 items-center gap-1 rounded-md border border-border bg-muted/40 px-2 py-1 text-[11px] text-foreground">
                <Building2 className="h-3 w-3 shrink-0" />
                <span className="truncate max-w-[120px]">{org}</span>
              </div>
            </div>
          ))}

          {orgs.length > 2 && (
            <span className="rounded-md border border-border bg-background px-2 py-1 text-[11px] text-muted-foreground">
              +{orgs.length - 2} more
            </span>
          )}
        </div>
      );
    },
  },

  {
    key: "role",
    header: "Role",
    width: "110px",
    render: (person: PersonData) => (
      <span
        className={`inline-flex rounded-md px-2 py-1 text-[11px] font-medium ${
          ROLE_STYLE[person.role as Role] ?? ROLE_STYLE.Viewer
        }`}
      >
        {person.role}
      </span>
    ),
  },

  {
    key: "status",
    header: "Status",
    width: "100px",
    render: (person: PersonData) => (
      <div className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1">
        <Circle className={`h-2 w-2 ${statusColors[person.status]}`} />
        <span className="text-[11px] font-medium capitalize">{person.status}</span>
      </div>
    ),
  },

  {
    key: "lastActive",
    header: "Last Active",
    width: "120px",
    render: (person: PersonData) => (
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Clock className="h-3 w-3 shrink-0" />
        <span>{person.lastActive ?? "—"}</span>
      </div>
    ),
  },

  {
    key: "sheetsAccess",
    header: "Sheets",
    width: "80px",
    render: (person: PersonData) => (
      <div className="flex items-center gap-1.5">
        <FileSpreadsheet className="h-3 w-3 text-muted-foreground" />
        <span className="text-xs font-medium tabular-nums">
          {person.sheetsAccess}
        </span>
      </div>
    ),
  },
];

/* ---------------- ACTION MENU ---------------- */

function PeopleActionMenu({
  person,
  onRoleChange,
}: {
  person: PersonData;
  onRoleChange: (personId: string, newRole: Role) => void;
}) {
  return (
    <>
      <DropdownMenuItem
        className="text-xs gap-2 cursor-pointer"
        onClick={() => {
          navigator.clipboard.writeText(person.email);
        }}
      >
        <Mail className="h-3.5 w-3.5" /> Copy Email
      </DropdownMenuItem>

      <DropdownMenuItem
        className="text-xs gap-2 cursor-pointer"
        onClick={() => {
          window.location.href = `mailto:${person.email}`;
        }}
      >
        <Mail className="h-3.5 w-3.5" /> Send Email
      </DropdownMenuItem>

      <DropdownMenuSub>
        <DropdownMenuSubTrigger className="text-xs gap-2 cursor-pointer">
          <ShieldCheck className="h-3.5 w-3.5" />
          Change Role
          <ChevronRight className="h-3 w-3 ml-auto" />
        </DropdownMenuSubTrigger>

        <DropdownMenuSubContent className="w-40">
          {(["Owner", "Admin", "Editor", "Viewer"] as Role[]).map((role) => (
            <DropdownMenuItem
              key={role}
              className={`text-xs gap-2 cursor-pointer ${
                person.role === role ? "font-semibold" : ""
              }`}
              onClick={() => onRoleChange(person.id, role)}
            >
              <Shield className="h-3 w-3" />
              {role}
              {person.role === role && (
                <span className="ml-auto text-[10px] text-muted-foreground">
                  current
                </span>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    </>
  );
}

/* ---------------- EXPORTS ---------------- */

export function createPeopleAction(
  onRoleChange: (personId: string, newRole: Role) => void,
) {
  return {
    render: (person: PersonData) => (
      <PeopleActionMenu person={person} onRoleChange={onRoleChange} />
    ),
  };
}

