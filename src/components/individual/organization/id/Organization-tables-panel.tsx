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

// ── Visibility styles ─────────────────────────────
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

// ── SHEET COLUMNS ────────────────────────────────
const sheetColumns = [
  {
    key: "title",
    header: "Name",
    render: (s: Sheet) => (
      <div className="flex items-center gap-3">
        <div className="h-7 w-7 rounded-lg border bg-card flex items-center justify-center">
          <FileText className="h-3.5 w-3.5 text-primary/60" />
        </div>

        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium text-primary hover:underline cursor-pointer transition-colors">
              {s.title}
            </span>
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
    render: (s: Sheet) => (
      <div className="flex items-center gap-2">
        <Avatar className="h-6 w-6">
          {s.owner.avatar && <AvatarImage src={s.owner.avatar} />}
          <AvatarFallback>{s.owner.initials}</AvatarFallback>
        </Avatar>
        <span className="text-xs">{s.owner.name.split(" ")[0]}</span>
      </div>
    ),
  },
  {
    key: "visibility",
    header: "Access",
    render: (s: Sheet) => {
      const v = VIS[s.visibility ?? "team"];
      return (
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${v.dot}`} />
          <span className="text-xs">{v.label}</span>
        </div>
      );
    },
  },
  {
    key: "rows",
    header: "Rows",
    render: (s: Sheet) => <span>{s.rows ?? 0}</span>,
  },
  {
    key: "columns",
    header: "Cols",
    render: (s: Sheet) => <span>{s.columns ?? 0}</span>,
  },
  {
    key: "last_modified",
    header: "Updated",
    render: (s: Sheet) => (
      <div>
        <p className="text-xs">{s.updated_at ? timeAgo(s.updated_at) : "—"}</p>
      </div>
    ),
  },
];

// ── MEMBER COLUMNS ────────────────────────────────
const memberColumns = [
  {
    key: "profiles",
    header: "Member",
    render: (m: Member) => (
      <div className="flex items-center gap-2">
        <Avatar className="h-7 w-7">
          {m.avatar?.startsWith("http") && <AvatarImage src={m.avatar} />}
          <AvatarFallback>{m.profiles.name?.charAt(0)}</AvatarFallback>
        </Avatar>

        <div>
          <p className="text-sm">{m.profiles.name}</p>
          <p className="text-xs text-muted-foreground">{m.profiles.email}</p>
        </div>
      </div>
    ),
  },
  {
    key: "role",
    header: "Role",
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
    render: (m: Member) => <span className="text-xs">{m.status}</span>,
  },
];

// ── ACTION FACTORIES (IMPORTANT FIX) ──────────────
const createSheetAction = (router: ReturnType<typeof useRouter>) => ({
  render: (s: Sheet) => (
    <>
      <DropdownMenuItem onClick={() => router.push(`/sheet/${s.id}`)}>
        <Edit3 className="h-3.5 w-3.5" /> Open
      </DropdownMenuItem>

      <DropdownMenuItem onClick={() => toast.info("Share")}>
        <Share2 className="h-3.5 w-3.5" /> Share
      </DropdownMenuItem>

      <DropdownMenuItem
        onClick={async () => {
          await updateSheetStarred(s.id, !s.is_starred);
          toast.success("Updated");
        }}
      >
        {s.is_starred ? <StarOff /> : <Star />} Star
      </DropdownMenuItem>

      <DropdownMenuSeparator />

      <DropdownMenuItem className="text-red-500">
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

  const sheetAction = createSheetAction(router);
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
          columns={sheetColumns}
          rows={sheets}
          getKey={(s) => s.id}
          action={sheetAction}
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
