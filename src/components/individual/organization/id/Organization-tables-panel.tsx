"use client";

import { Avatar, AvatarFallback }                  from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/common/Data-table";
import { DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import {
  FileSpreadsheet, Users, FileText, Star, Download,
  Trash2, Share2, Mail, UserMinus, UserCog, Edit3,
  FolderOpen, UserRound,
} from "lucide-react";
import type { Organization, Sheet, Member } from "@/types";

const VIS = {
  team:    { label: "Team",    dot: "bg-blue-400"   },
  private: { label: "Private", dot: "bg-orange-400" },
  public:  { label: "Public",  dot: "bg-green-400"  },
} as const;

const ROLE_STYLE: Record<string, string> = {
  owner:  "text-amber-700 bg-amber-50 border border-amber-200",
  admin:  "text-purple-700 bg-purple-50 border border-purple-200",
  editor: "text-blue-700 bg-blue-50 border border-blue-200",
  viewer: "text-slate-600 bg-slate-50 border border-slate-200",
};

/* ── Empty state ─────────────────────────────────────────────────── */
function EmptyState({ icon: Icon, title, description }: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-52 gap-3 text-center px-6">
      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
    </div>
  );
}

/* ── Sheet columns ───────────────────────────────────────────────── */
const sheetColumns = [
  {
    key: "title",
    header: "Name",
    render: (s: Sheet) => (
      <div className="flex items-center gap-3">
        <div className="h-7 w-7 rounded-lg border bg-card flex items-center justify-center shadow-sm shrink-0">
          <FileText className="h-3.5 w-3.5 text-primary/60" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium truncate max-w-[180px] block">
              {s.title}
            </span>
            {s.is_starred && (
              <Star className="h-3 w-3 text-amber-400 fill-amber-400 shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            {s.size && (
              <span className="text-[11px] text-muted-foreground">{s.size} MB</span>
            )}
            {(s.activeEditors ?? 0) > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-green-600">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
                {s.activeEditors} editing
              </span>
            )}
          </div>
        </div>
      </div>
    ),
  },
  {
    key: "owner",
    header: "Owner",
    width: "140px",
    render: (s: Sheet) => (
      <div className="flex items-center gap-2">
        <Avatar className="h-6 w-6 shrink-0">
          <AvatarFallback className="text-[9px] font-semibold bg-primary/10 text-primary">
            {s.owner.initials}
          </AvatarFallback>
        </Avatar>
        <span className="text-xs text-muted-foreground truncate">
          {s.owner.name.split(" ")[0]}
        </span>
      </div>
    ),
  },
  {
    key: "visibility",
    header: "Access",
    width: "100px",
    render: (s: Sheet) => {
      const v = VIS[s.visibility ?? "team"];
      return (
        <div className="flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full shrink-0 ${v.dot}`} />
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {v.label}
          </span>
        </div>
      );
    },
  },
  {
    key: "collaborators",
    header: "Collaborators",
    width: "160px",
    render: (s: Sheet) => {
      const count = s.collaborators ?? 0;
      return (
        <div className="flex items-center gap-2">
          <div className="flex shrink-0">
            {Array.from({ length: Math.min(count, 4) }).map((_, i) => (
              <div
                key={i}
                className="h-5 w-5 rounded-full bg-muted border-2 border-background"
                style={{ marginLeft: i ? -6 : 0 }}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {count} {count === 1 ? "person" : "people"}
          </span>
        </div>
      );
    },
  },
  {
    key: "last_modified_by",
    header: "Last modified",
    width: "160px",
    render: (s: Sheet) => (
      <div>
        <p className="text-xs text-muted-foreground whitespace-nowrap">
          {s.lastModified ?? new Date(s.updated_at).toLocaleDateString()}
        </p>
        <p className="text-[11px] text-muted-foreground/50 mt-0.5">
          by {(s.lastModifiedBy ?? s.last_modified_by ?? "Unknown").split(" ")[0]}
        </p>
      </div>
    ),
  },
];

const sheetAction = {
  render: (s: Sheet) => (
    <>
      <DropdownMenuItem className="text-xs gap-2">
        <Edit3 className="h-3.5 w-3.5" />Open & Edit
      </DropdownMenuItem>
      <DropdownMenuItem className="text-xs gap-2">
        <Share2 className="h-3.5 w-3.5" />Share
      </DropdownMenuItem>
      <DropdownMenuItem className="text-xs gap-2">
        <Download className="h-3.5 w-3.5" />Download
      </DropdownMenuItem>
      <DropdownMenuItem className="text-xs gap-2">
        <Star className="h-3.5 w-3.5" />
        {s.is_starred ? "Unstar" : "Star"}
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem className="text-xs gap-2 text-red-600 focus:text-red-600">
        <Trash2 className="h-3.5 w-3.5" />Delete
      </DropdownMenuItem>
    </>
  ),
};

/* ── Member columns ──────────────────────────────────────────────── */
const memberColumns = [
  {
    key: "profiles",
    header: "Member",
    width: "200px",
    render: (m: Member) => (
      <div className="flex items-center gap-2.5">
        <div className="relative shrink-0">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="text-[10px] font-bold text-primary bg-primary/10">
              {m.avatar ?? m.profiles.name?.charAt(0).toUpperCase() ?? "?"}
            </AvatarFallback>
          </Avatar>
          {m.status === "online" && (
            <span className="absolute -bottom-px -right-px h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-background" />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{m.profiles.name ?? "Unknown"}</p>
          <p className="text-[11px] text-muted-foreground truncate">{m.profiles.email}</p>
        </div>
      </div>
    ),
  },
  {
    key: "role",
    header: "Role",
    width: "110px",
    render: (m: Member) => (
      <span
        className={`text-[11px] font-medium px-2 py-0.5 rounded-full capitalize whitespace-nowrap ${
          ROLE_STYLE[m.role ?? "viewer"]
        }`}
      >
        {m.role ?? "viewer"}
      </span>
    ),
  },
  {
    key: "status",
    header: "Status",
    width: "110px",
    render: (m: Member) => (
      <div className="flex items-center gap-1.5">
        <span
          className={`h-1.5 w-1.5 rounded-full shrink-0 ${
            m.status === "online" ? "bg-green-500" : "bg-slate-300"
          }`}
        />
        <span className="text-xs text-muted-foreground capitalize whitespace-nowrap">
          {m.status ?? "offline"}
        </span>
      </div>
    ),
  },
  {
    key: "email",
    header: "Email",
    render: (m: Member) => (
      <span className="text-xs text-muted-foreground">{m.profiles.email}</span>
    ),
  },
  {
    key: "lastActive",
    header: "Last active",
    width: "130px",
    render: (m: Member) => (
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {m.lastActive ?? "—"}
      </span>
    ),
  },
];

const memberAction = {
  render: (_m: Member) => (
    <>
      <DropdownMenuItem className="text-xs gap-2">
        <Mail className="h-3.5 w-3.5" />Send email
      </DropdownMenuItem>
      <DropdownMenuItem className="text-xs gap-2">
        <UserCog className="h-3.5 w-3.5" />Change role
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem className="text-xs gap-2 text-red-600 focus:text-red-600">
        <UserMinus className="h-3.5 w-3.5" />Remove
      </DropdownMenuItem>
    </>
  ),
};

/* ── Component ───────────────────────────────────────────────────── */
export function OrgTablesPanel({ org }: { org: Organization }) {
  const sheets  = org.sheets  ?? [];
  const members = org.members ?? [];

  return (
    <Tabs defaultValue="sheets">
      <TabsList className="h-8 mb-3">
        <TabsTrigger value="sheets" className="text-xs h-7 gap-1.5">
          <FileSpreadsheet className="h-3.5 w-3.5" />
          Sheets
          <span className="text-muted-foreground ml-0.5">({sheets.length})</span>
        </TabsTrigger>
        <TabsTrigger value="members" className="text-xs h-7 gap-1.5">
          <Users className="h-3.5 w-3.5" />
          Members
          <span className="text-muted-foreground ml-0.5">({members.length})</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="sheets" className="mt-0">
        {sheets.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title="No sheets yet"
            description="Sheets created in this organization will appear here."
          />
        ) : (
          <DataTable
            columns={sheetColumns}
            rows={sheets}
            getKey={(s) => s.id}
            action={sheetAction}
          />
        )}
      </TabsContent>

      <TabsContent value="members" className="mt-0">
        {members.length === 0 ? (
          <EmptyState
            icon={UserRound}
            title="No members yet"
            description="Invite people to collaborate in this organization."
          />
        ) : (
          <DataTable
            columns={memberColumns}
            rows={members}
            getKey={(m) => m.id}
            action={memberAction}
          />
        )}
      </TabsContent>
    </Tabs>
  );
}