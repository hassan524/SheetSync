"use client";

import { Avatar, AvatarFallback }                  from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/common/Data-table";
import { DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import {
  FileSpreadsheet, Users, FileText, Star, Download,
  Trash2, Share2, Mail, UserMinus, UserCog, Edit3,
} from "lucide-react";
import { OrgDetail } from "@/app/organizations/[id]/page";

// pull the array item types straight from OrgDetail
type SheetRow  = NonNullable<OrgDetail["sheetsList"]>[number];
type MemberRow = NonNullable<OrgDetail["membersList"]>[number];

const VIS = {
  team:    { label: "Team",    dot: "bg-blue-400"   },
  private: { label: "Private", dot: "bg-orange-400" },
  public:  { label: "Public",  dot: "bg-green-400"  },
} as const;

const ROLE_STYLE: Record<string, string> = {
  Admin:  "text-purple-700 bg-purple-50 border border-purple-200",
  Member: "text-blue-700 bg-blue-50 border border-blue-200",
  Viewer: "text-slate-600 bg-slate-50 border border-slate-200",
};

// ── Sheet columns ─────────────────────────────────────────────────
const sheetColumns = [
  {
    key: "name",
    header: "Name",
    render: (s: SheetRow) => (
      <div className="flex items-center gap-3">
        <div className="h-7 w-7 rounded-lg border bg-card flex items-center justify-center shadow-sm shrink-0">
          <FileText className="h-3.5 w-3.5 text-primary/60" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium truncate max-w-[180px] block">{s.title}</span>
            {s.isStarred && <Star className="h-3 w-3 text-amber-400 fill-amber-400 shrink-0" />}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[11px] text-muted-foreground">{s.size}</span>
            {s.activeEditors > 0 && (
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
    key: "owner", header: "Owner", width: "140px",
    render: (s: SheetRow) => (
      <div className="flex items-center gap-2">
        <Avatar className="h-6 w-6 shrink-0">
          <AvatarFallback className="text-[9px] font-semibold bg-primary/10 text-primary">
            {s.owner.initials}
          </AvatarFallback>
        </Avatar>
        <span className="text-xs text-muted-foreground truncate">{s.owner.name.split(" ")[0]}</span>
      </div>
    ),
  },
  {
    key: "access", header: "Access", width: "100px",
    render: (s: SheetRow) => {
      const v = VIS[s.visibility] ?? VIS.team;
      return (
        <div className="flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full shrink-0 ${v.dot}`} />
          <span className="text-xs text-muted-foreground whitespace-nowrap">{v.label}</span>
        </div>
      );
    },
  },
  {
    key: "collaborators", header: "Collaborators", width: "160px",
    render: (s: SheetRow) => (
      <div className="flex items-center gap-2">
        <div className="flex shrink-0">
          {Array.from({ length: Math.min(s.collaborators, 4) }).map((_, i) => (
            <div key={i} className="h-5 w-5 rounded-full bg-muted border-2 border-background" style={{ marginLeft: i ? -6 : 0 }} />
          ))}
        </div>
        <span className="text-xs text-muted-foreground whitespace-nowrap">{s.collaborators} people</span>
      </div>
    ),
  },
  {
    key: "modified", header: "Last modified", width: "160px",
    render: (s: SheetRow) => (
      <div>
        <p className="text-xs text-muted-foreground whitespace-nowrap">{s.lastModified}</p>
        <p className="text-[11px] text-muted-foreground/50 mt-0.5">by {s.lastModifiedBy.split(" ")[0]}</p>
      </div>
    ),
  },
];

const sheetAction = {
  render: (s: SheetRow) => (
    <>
      <DropdownMenuItem className="text-xs gap-2"><Edit3 className="h-3.5 w-3.5" />Open & Edit</DropdownMenuItem>
      <DropdownMenuItem className="text-xs gap-2"><Share2 className="h-3.5 w-3.5" />Share</DropdownMenuItem>
      <DropdownMenuItem className="text-xs gap-2"><Download className="h-3.5 w-3.5" />Download</DropdownMenuItem>
      <DropdownMenuItem className="text-xs gap-2"><Star className="h-3.5 w-3.5" />{s.isStarred ? "Unstar" : "Star"}</DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem className="text-xs gap-2 text-red-600 focus:text-red-600"><Trash2 className="h-3.5 w-3.5" />Delete</DropdownMenuItem>
    </>
  ),
};

// ── Member columns ────────────────────────────────────────────────
const memberColumns = [
  {
    key: "member", header: "Member", width: "200px",
    render: (m: MemberRow) => (
      <div className="flex items-center gap-2.5">
        <div className="relative shrink-0">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="text-[10px] font-bold text-primary bg-primary/10">{m.avatar}</AvatarFallback>
          </Avatar>
          {m.status === "online" && (
            <span className="absolute -bottom-px -right-px h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-background" />
          )}
        </div>
        <span className="text-sm font-medium whitespace-nowrap">{m.name}</span>
      </div>
    ),
  },
  {
    key: "role", header: "Role", width: "110px",
    render: (m: MemberRow) => (
      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${ROLE_STYLE[m.role] ?? "text-slate-600 bg-slate-50 border border-slate-200"}`}>
        {m.role}
      </span>
    ),
  },
  {
    key: "status", header: "Status", width: "110px",
    render: (m: MemberRow) => (
      <div className="flex items-center gap-1.5">
        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${m.status === "online" ? "bg-green-500" : "bg-slate-300"}`} />
        <span className="text-xs text-muted-foreground capitalize whitespace-nowrap">{m.status}</span>
      </div>
    ),
  },
  {
    key: "email", header: "Email",
    render: (m: MemberRow) => (
      <span className="text-xs text-muted-foreground">{m.email}</span>
    ),
  },
  {
    key: "lastActive", header: "Last active", width: "130px",
    render: (m: MemberRow) => (
      <span className="text-xs text-muted-foreground whitespace-nowrap">{m.lastActive}</span>
    ),
  },
];

const memberAction = {
  render: (_m: MemberRow) => (
    <>
      <DropdownMenuItem className="text-xs gap-2"><Mail className="h-3.5 w-3.5" />Send email</DropdownMenuItem>
      <DropdownMenuItem className="text-xs gap-2"><UserCog className="h-3.5 w-3.5" />Change role</DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem className="text-xs gap-2 text-red-600 focus:text-red-600"><UserMinus className="h-3.5 w-3.5" />Remove</DropdownMenuItem>
    </>
  ),
};

// ── Component ─────────────────────────────────────────────────────
export function OrgTablesPanel({ org }: { org: OrgDetail }) {
  const sheets  = org.sheetsList  ?? [];
  const members = org.membersList ?? [];

  return (
    <Tabs defaultValue="sheets">
      <TabsList className="h-8 mb-3">
        <TabsTrigger value="sheets" className="text-xs h-7 gap-1.5">
          <FileSpreadsheet className="h-3.5 w-3.5" />
          Sheets <span className="text-muted-foreground ml-0.5">({sheets.length})</span>
        </TabsTrigger>
        <TabsTrigger value="members" className="text-xs h-7 gap-1.5">
          <Users className="h-3.5 w-3.5" />
          Members <span className="text-muted-foreground ml-0.5">({members.length})</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="sheets" className="mt-0">
        <DataTable columns={sheetColumns} rows={sheets} getKey={s => s.id} action={sheetAction} emptyText="No sheets yet." />
      </TabsContent>
      <TabsContent value="members" className="mt-0">
        <DataTable columns={memberColumns} rows={members} getKey={m => m.id} action={memberAction} emptyText="No members yet." />
      </TabsContent>
    </Tabs>
  );
}