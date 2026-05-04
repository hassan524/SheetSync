"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/common/Data-table";
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FileSpreadsheet,
  Users,
  FileText,
  Star,
  StarOff,
  Download,
  Trash2,
  Share2,
  Mail,
  UserMinus,
  UserCog,
  Edit3,
  Shield,
  ChevronRight,
} from "lucide-react";
import type { Organization, Sheet, Member } from "@/types";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateSheetStarred } from "@/lib/querys/sheet/sheet";
import { timeAgo } from "@/lib/utils";

const VIS = {
  team: { label: "Team", dot: "bg-blue-400" },
  private: { label: "Private", dot: "bg-orange-400" },
  public: { label: "Public", dot: "bg-green-400" },
} as const;

const ROLE_STYLE: Record<string, string> = {
  owner: "text-amber-700 bg-amber-50 border border-amber-200",
  admin: "text-purple-700 bg-purple-50 border border-purple-200",
  editor: "text-blue-700 bg-blue-50 border border-blue-200",
  viewer: "text-slate-600 bg-slate-50 border border-slate-200",
};

// ── Empty Icons ───────────────────────────────────────────────────
export function NoSheetsIcon() {
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
      <rect x="10" y="8" width="52" height="56" rx="7" fill="currentColor" className="text-muted/30" />
      <rect x="10" y="8" width="52" height="56" rx="7" stroke="currentColor" strokeWidth="1.5" className="text-border" />
      <rect x="10" y="8" width="52" height="14" rx="7" fill="currentColor" className="text-muted/50" />
      <rect x="10" y="15" width="52" height="7" fill="currentColor" className="text-muted/50" />
      <line x1="30" y1="8" x2="30" y2="64" stroke="currentColor" strokeWidth="1" className="text-border/60" />
      <line x1="50" y1="8" x2="50" y2="64" stroke="currentColor" strokeWidth="1" className="text-border/60" />
      <line x1="10" y1="36" x2="62" y2="36" stroke="currentColor" strokeWidth="1" className="text-border/60" />
      <line x1="10" y1="50" x2="62" y2="50" stroke="currentColor" strokeWidth="1" className="text-border/60" />
      <circle cx="54" cy="54" r="11" fill="hsl(var(--background))" />
      <circle cx="54" cy="54" r="11" stroke="currentColor" strokeWidth="1.5" className="text-border" />
      <line x1="50" y1="54" x2="58" y2="54" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="text-muted-foreground/60" />
      <line x1="54" y1="50" x2="54" y2="58" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="text-muted-foreground/60" />
    </svg>
  );
}

function NoMembersIcon() {
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
      <circle cx="42" cy="22" r="10" fill="currentColor" className="text-muted/40" stroke="currentColor" strokeWidth="1.5" />
      <path d="M22 58c0-10 9-17 20-17s20 7 20 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="currentColor" className="text-muted/40" />
      <circle cx="28" cy="24" r="11" fill="hsl(var(--background))" stroke="currentColor" strokeWidth="1.5" className="text-border" />
      <circle cx="28" cy="24" r="8" fill="currentColor" className="text-muted/50" />
      <path d="M8 60c0-11 9-18 20-18s20 7 20 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="hsl(var(--background))" />
      <circle cx="56" cy="54" r="11" fill="hsl(var(--background))" />
      <circle cx="56" cy="54" r="11" stroke="currentColor" strokeWidth="1.5" className="text-border" />
      <line x1="52" y1="54" x2="60" y2="54" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="text-muted-foreground/60" />
      <line x1="56" y1="50" x2="56" y2="58" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="text-muted-foreground/60" />
    </svg>
  );
}

// ── Sheet columns ─────────────────────────────────────────────────
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
            <span className="text-sm font-medium truncate max-w-[180px] block">{s.title}</span>
            {s.is_starred && <Star className="h-3 w-3 text-amber-400 fill-amber-400 shrink-0" />}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
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
    width: "130px",
    render: (s: Sheet) => (
      <div className="flex items-center gap-2">
        <Avatar className="h-6 w-6 shrink-0">
          {s.owner.avatar && <AvatarImage src={s.owner.avatar} alt={s.owner.name} />}
          <AvatarFallback className="text-[9px] font-semibold bg-primary/10 text-primary">
            {s.owner.initials}
          </AvatarFallback>
        </Avatar>
        <span className="text-xs text-muted-foreground truncate">{s.owner.name.split(" ")[0]}</span>
      </div>
    ),
  },
  {
    key: "visibility",
    header: "Access",
    width: "90px",
    render: (s: Sheet) => {
      const v = VIS[s.visibility ?? "team"];
      return (
        <div className="flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full shrink-0 ${v.dot}`} />
          <span className="text-xs text-muted-foreground whitespace-nowrap">{v.label}</span>
        </div>
      );
    },
  },
  {
    key: "collaborators",
    header: "Members",
    width: "100px",
    render: (s: Sheet) => {
      const count = s.collaborators ?? 0;
      return (
        <div className="flex items-center gap-1.5">
          <div className="flex shrink-0">
            {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
              <div key={i} className="h-5 w-5 rounded-full bg-muted border-2 border-background" style={{ marginLeft: i ? -5 : 0 }} />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">{count}</span>
        </div>
      );
    },
  },
  {
    key: "last_modified",
    header: "Last Modified",
    width: "140px",
    render: (s: Sheet) => (
      <div>
        <p className="text-xs text-muted-foreground whitespace-nowrap">
          {s.lastModified ?? (s.updated_at ? timeAgo(s.updated_at) : "—")}
        </p>
        <p className="text-[11px] text-muted-foreground/50 mt-0.5">
          by {(s.lastModifiedBy ?? s.last_modified_by ?? "Unknown").split(" ")[0]}
        </p>
      </div>
    ),
  },
];

const sheetAction = {
  render: (s: Sheet) => {
    const router = useRouter();
    return (
      <>
        <DropdownMenuItem className="text-xs gap-2" onClick={() => router.push(`/sheet/${s.id}`)}>
          <Edit3 className="h-3.5 w-3.5" /> Open & Edit
        </DropdownMenuItem>
        <DropdownMenuItem className="text-xs gap-2" onClick={() => toast.info("Share — coming soon")}>
          <Share2 className="h-3.5 w-3.5" /> Share
        </DropdownMenuItem>
        <DropdownMenuItem className="text-xs gap-2" onClick={() => toast.info("Download — coming soon")}>
          <Download className="h-3.5 w-3.5" /> Download
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-xs gap-2"
          onClick={async () => {
            try {
              await updateSheetStarred(s.id, !s.is_starred);
              toast.success(s.is_starred ? "Removed from starred" : "Added to starred");
            } catch { toast.error("Failed to update star"); }
          }}
        >
          {s.is_starred ? <><StarOff className="h-3.5 w-3.5" /> Unstar</> : <><Star className="h-3.5 w-3.5" /> Star</>}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-xs gap-2 text-red-600 focus:text-red-600" onClick={() => toast.info("Delete — coming soon")}>
          <Trash2 className="h-3.5 w-3.5" /> Delete
        </DropdownMenuItem>
      </>
    );
  },
};

// ── Member columns ────────────────────────────────────────────────
const memberColumns = [
  {
    key: "profiles",
    header: "Member",
    render: (m: Member) => (
      <div className="flex items-center gap-2.5">
        <div className="relative shrink-0">
          <Avatar className="h-7 w-7">
            {m.avatar?.startsWith("http") && <AvatarImage src={m.avatar} alt={m.profiles.name} />}
            <AvatarFallback className="text-[10px] font-bold text-primary bg-primary/10">
              {m.avatar && !m.avatar.startsWith("http") ? m.avatar : (m.profiles.name?.charAt(0).toUpperCase() ?? "?")}
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
      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full capitalize whitespace-nowrap ${ROLE_STYLE[m.role ?? "viewer"]}`}>
        {m.role ?? "viewer"}
      </span>
    ),
  },
  {
    key: "status",
    header: "Status",
    width: "100px",
    render: (m: Member) => (
      <div className="flex items-center gap-1.5">
        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${m.status === "online" ? "bg-green-500" : "bg-slate-300"}`} />
        <span className="text-xs text-muted-foreground capitalize whitespace-nowrap">{m.status ?? "offline"}</span>
      </div>
    ),
  },
  {
    key: "lastActive",
    header: "Last Active",
    width: "130px",
    render: (m: Member) => (
      <span className="text-xs text-muted-foreground whitespace-nowrap">{m.lastActive ?? "—"}</span>
    ),
  },
];

const memberAction = {
  render: (m: Member) => (
    <>
      <DropdownMenuItem
        className="text-xs gap-2"
        onClick={() => {
          navigator.clipboard.writeText(m.profiles.email ?? "");
          toast.success("Email copied");
        }}
      >
        <Mail className="h-3.5 w-3.5" /> Copy Email
      </DropdownMenuItem>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger className="text-xs gap-2">
          <UserCog className="h-3.5 w-3.5" /> Change Role
          <ChevronRight className="h-3 w-3 ml-auto" />
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          {(["owner", "admin", "editor", "viewer"] as const).map((role) => (
            <DropdownMenuItem
              key={role}
              className={`text-xs gap-2 capitalize ${m.role === role ? "font-semibold" : ""}`}
              onClick={() => {
                toast.success(`Role changed to ${role}`);
              }}
            >
              <Shield className="h-3 w-3" />
              {role}
              {m.role === role && <span className="ml-auto text-[10px] text-muted-foreground">current</span>}
            </DropdownMenuItem>
          ))}
        </DropdownMenuSubContent>
      </DropdownMenuSub>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        className="text-xs gap-2 text-red-600 focus:text-red-600"
        onClick={() => toast.info("Remove member — coming soon")}
      >
        <UserMinus className="h-3.5 w-3.5" /> Remove
      </DropdownMenuItem>
    </>
  ),
};

// ── Component ─────────────────────────────────────────────────────
export function OrgTablesPanel({ org }: { org: Organization }) {
  const sheets = org.sheets ?? [];
  const router = useRouter();
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
        <DataTable
          columns={sheetColumns}
          rows={sheets}
          getKey={(s) => s.id}
          action={sheetAction}
          onRowClick={(s) => router.push(`/sheet/${s.id}`)}
          emptyText="No sheets yet"
          emptyDescription="Sheets created in this organization will appear here."
          emptyIcon={<NoSheetsIcon />}
        />
      </TabsContent>

      <TabsContent value="members" className="mt-0">
        <DataTable
          columns={memberColumns}
          rows={members}
          getKey={(m) => m.id}
          action={memberAction}
          emptyText="No members yet"
          emptyDescription="Invite people to collaborate in this organization."
          emptyIcon={<NoMembersIcon />}
        />
      </TabsContent>
    </Tabs>
  );
}
