"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/common/Data-table";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import {
  FileSpreadsheet,
  Users,
  Mail,
  Calendar,
  Clock,
  Activity,
} from "lucide-react";
import type { Organization, Member } from "@/types";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { timeAgo } from "@/lib/utils";
import { SheetsTable } from "@/components/sheets";

// ── Visibility styles ─────────────────────────────
const ROLE_STYLE: Record<string, string> = {
  owner: "text-amber-700 bg-amber-50 border border-amber-200",
  admin: "text-purple-700 bg-purple-50 border border-purple-200",
  editor: "text-blue-700 bg-blue-50 border border-blue-200",
  viewer: "text-slate-600 bg-slate-50 border border-slate-200",
};

function NoMembersIcon() {
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
      <circle cx="42" cy="22" r="10" className="text-muted/40" />
    </svg>
  );
}

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
        <SheetsTable
          sheets={sheets}
          onDeleted={() => router.refresh()}
          onRenamed={() => router.refresh()}
          emptyText="No sheets yet"
          emptyDescription="Spreadsheets created in this organization will appear here."
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
