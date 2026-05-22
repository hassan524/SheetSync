"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/common/Data-table";
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  FileSpreadsheet,
  Users,
  FileText,
  Star,
  StarOff,
  Trash2,
  Share2,
  Mail,
  Calendar,
  Clock,
  Activity,
} from "lucide-react";
import type { Organization, Sheet, Member } from "@/types";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateSheetStarred } from "@/lib/querys/sheet/sheet";
import { getInitials, timeAgo } from "@/lib/utils";
import {
  sheetsWithSourceColumns,
  universalSheetAction,
  type UniversalSheetRow,
} from "@/data/tables/universalSheetColumns";

// ── Visibility styles ─────────────────────────────
const ROLE_STYLE: Record<string, string> = {
  owner: "text-amber-700 bg-amber-50 border border-amber-200",
  admin: "text-purple-700 bg-purple-50 border border-purple-200",
  editor: "text-blue-700 bg-blue-50 border border-blue-200",
  viewer: "text-slate-600 bg-slate-50 border border-slate-200",
};

// ── Empty Icons ───────────────────────────────────
export function NoSheetsIcon() {
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
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
    </svg>
  );
}

function NoMembersIcon() {
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
      <circle cx="42" cy="22" r="10" className="text-muted/40" />
    </svg>
  );
}

// ── SHEET COLUMNS — same 5 standard columns ──────
import Link from "next/link";

const sheetColumns = [
  {
    key: "title",
    header: "Name",
    width: "240px",
    render: (s: Sheet) => (
      <div className="flex items-center gap-3">
        <div className="h-7 w-7 rounded-lg border bg-card flex items-center justify-center">
          <FileText className="h-3.5 w-3.5 text-primary/60" />
        </div>

        <div>
          <div className="flex items-center gap-1.5">
            <Link
              href={`/sheet/${s.id}`}
              className="text-sm font-medium text-foreground hover:text-primary hover:underline transition-colors truncate max-w-[160px] block"
              onClick={(e) => e.stopPropagation()}
            >
              {s.title}
            </Link>
            {s.is_starred && (
              <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
            )}
          </div>

          {(s.activeEditors ?? 0) > 0 && (
            <span className="text-[10px] text-green-600">
              {s.activeEditors} editing
            </span>
          )}
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
        <Avatar className="h-6 w-6">
          {s.owner?.avatar && <AvatarImage src={s.owner.avatar} />}
          <AvatarFallback className="text-[9px] font-semibold bg-primary/10 text-primary">
            {s.owner?.initials ?? "ME"}
          </AvatarFallback>
        </Avatar>
        <span className="text-xs font-medium">
          {s.owner?.name?.split(" ")[0] ?? "You"}
        </span>
      </div>
    ),
  },
  {
    key: "personal",
    header: "Personal",
    width: "90px",
    render: () => <span className="text-xs font-bold text-primary">No</span>,
  },
  {
    key: "created_at",
    header: "Created",
    width: "120px",
    render: (s: Sheet) => (
      <span className="text-xs text-muted-foreground">
        {s.created_at ? timeAgo(s.created_at) : "—"}
      </span>
    ),
  },
  {
    key: "last_modified",
    header: "Last Modified",
    width: "130px",
    render: (s: Sheet) => (
      <p className="text-xs text-muted-foreground">
        {s.updated_at ? timeAgo(s.updated_at) : "—"}
      </p>
    ),
  },
];

// ── MEMBER COLUMNS ────────────────────────────────
const memberColumns = [
  {
    key: "profiles",
    header: "Member",
    width: "220px",
    render: (m: Member) => (
      <div className="flex items-center gap-2">
        <Avatar className="h-7 w-7">
          {m.avatar?.startsWith("http") && <AvatarImage src={m.avatar} />}
          <AvatarFallback>{m.profiles.name?.charAt(0)}</AvatarFallback>
        </Avatar>

        <div>
          <p className="text-sm font-medium">{m.profiles.name}</p>
          <p className="text-xs text-muted-foreground">{m.profiles.email}</p>
        </div>
      </div>
    ),
  },
  {
    key: "role",
    header: "Role",
    width: "100px",
    render: (m: Member) => (
      <span
        className={`text-xs px-2 py-0.5 rounded ${ROLE_STYLE[m.role ?? "viewer"]}`}
      >
        {m.role}
      </span>
    ),
  },
  {
    key: "status",
    header: "Status",
    width: "90px",
    render: (m: Member) => {
      const isOnline = m.status === "online";
      return (
        <div className="flex items-center gap-1.5">
          <span
            className={`h-2 w-2 rounded-full shrink-0 ${
              isOnline ? "bg-emerald-500" : "bg-slate-300"
            }`}
          />
          <span
            className={`text-xs font-medium capitalize ${isOnline ? "text-emerald-600" : "text-muted-foreground"}`}
          >
            {m.status}
          </span>
        </div>
      );
    },
  },
  {
    key: "joined_at",
    header: "Joined",
    width: "120px",
    render: (m: Member) => (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Calendar className="h-3 w-3 shrink-0" />
        <span>{m.joined_at ? timeAgo(m.joined_at) : "—"}</span>
      </div>
    ),
  },
  {
    key: "totalChanges",
    header: "Changes",
    width: "100px",
    render: (m: Member) => {
      const count = m.totalChanges ?? 0;
      return (
        <div className="flex items-center gap-1.5">
          <Activity className="h-3 w-3 text-primary/50 shrink-0" />
          <span
            className={`text-xs font-semibold ${count > 0 ? "text-foreground" : "text-muted-foreground"}`}
          >
            {count > 0 ? count.toLocaleString() : "—"}
          </span>
        </div>
      );
    },
  },
  {
    key: "lastActive",
    header: "Last Active",
    width: "120px",
    render: (m: Member) => (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Clock className="h-3 w-3 shrink-0" />
        <span>
          {m.lastActive && m.lastActive !== "Never" ? m.lastActive : "—"}
        </span>
      </div>
    ),
  },
];

// ── ACTION FACTORIES (IMPORTANT FIX) ──────────────
const createSheetAction = (router: ReturnType<typeof useRouter>) => ({
  render: (s: Sheet) => (
    <>
      <DropdownMenuItem
        className="text-xs gap-2"
        onClick={() => {
          const url = `${window.location.origin}/sheet/${s.id}`;
          navigator.clipboard
            .writeText(url)
            .then(() => toast.success("Link copied"));
        }}
      >
        <Share2 className="h-3.5 w-3.5" /> Copy Link
      </DropdownMenuItem>

      <DropdownMenuItem
        className="text-xs gap-2"
        onClick={async () => {
          await updateSheetStarred(s.id, !s.is_starred);
          toast.success(s.is_starred ? "Unstarred" : "Starred");
          router.refresh();
        }}
      >
        {s.is_starred ? (
          <StarOff className="h-3.5 w-3.5" />
        ) : (
          <Star className="h-3.5 w-3.5" />
        )}{" "}
        {s.is_starred ? "Unstar" : "Star"}
      </DropdownMenuItem>

      <DropdownMenuSeparator />

      <DropdownMenuItem className="text-xs gap-2 text-red-500 focus:text-red-500">
        <Trash2 className="h-3.5 w-3.5" /> Delete
      </DropdownMenuItem>
    </>
  ),
});

const createMemberAction = () => ({
  render: (m: Member) => (
    <>
      <DropdownMenuItem
        onClick={() => {
          navigator.clipboard.writeText(m.profiles.email ?? "");
          toast.success("Copied");
        }}
      >
        <Mail className="h-3.5 w-3.5" /> Copy Email
      </DropdownMenuItem>
    </>
  ),
});

// ── MAIN COMPONENT ────────────────────────────────
export function OrgTablesPanel({ org }: { org: Organization }) {
  const router = useRouter();

  const sheets = org.sheets ?? [];
  const members = org.members ?? [];
  const sheetRows: UniversalSheetRow[] = sheets.map((sheet) => ({
    id: sheet.id,
    title: sheet.title,
    is_starred: sheet.is_starred,
    source: "organization",
    organizationName: org.name,
    organizationId: org.id,
    owner: sheet.owner,
    collaborators: members.length,
    members: members.map((member) => ({
      id: member.id,
      name: member.profiles.name,
      email: member.profiles.email,
      avatar: member.profiles.avatar_url,
      initials: getInitials(
        member.profiles.name ?? member.profiles.email ?? "Member",
      ),
      status: member.status,
    })),
    lastModified: sheet.updated_at,
    createdAt: sheet.created_at,
    rows: sheet.rows,
    columns: sheet.columns,
    templateId: sheet.template_id,
    visibility: "team",
    activeEditors: sheet.activeEditors,
  }));

  const memberAction = createMemberAction();

  return (
    <Tabs defaultValue="sheets">
      <TabsList>
        <TabsTrigger value="sheets">
          <FileSpreadsheet className="h-3.5 w-3.5" />
          Sheets ({sheets.length})
        </TabsTrigger>

        <TabsTrigger value="members">
          <Users className="h-3.5 w-3.5" />
          Members ({members.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="sheets">
        <DataTable
          columns={sheetsWithSourceColumns}
          rows={sheetRows}
          getKey={(s) => s.id}
          action={universalSheetAction}
          onRowClick={(s) => router.push(`/sheet/${s.id}`)}
          emptyText="No sheets"
          emptyIcon={<NoSheetsIcon />}
        />
      </TabsContent>

      <TabsContent value="members">
        <DataTable
          columns={memberColumns}
          rows={members}
          getKey={(m) => m.id}
          action={memberAction}
          emptyText="No members"
          emptyIcon={<NoMembersIcon />}
        />
      </TabsContent>
    </Tabs>
  );
}

