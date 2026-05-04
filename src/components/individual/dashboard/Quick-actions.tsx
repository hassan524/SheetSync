"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Building2, FileSpreadsheet, ArrowRight, Zap } from "lucide-react";
import NewSheetModal from "@/components/sheets/New-sheet-modal";
import ShareDialog from "@/components/individual/sheet/dialogs/Share-dialog";
import CreateOrganizationDialog from "../organization/Create-organization-dialog";
import { getAllFolders } from "@/lib/querys/folder/folders";
import { getAllOrganizations } from "@/lib/querys/organization/organization";

const actions = [
  {
    key: "invite",
    icon: Users,
    label: "Invite Team",
    description: "Add members to your org",
    accent: "from-primary/20 via-primary/5 to-transparent",
    iconBg: "bg-primary/15 ring-primary/30",
    iconColor: "text-primary",
    arrowColor: "text-primary/50 group-hover:text-primary",
  },
  {
    key: "org",
    icon: Building2,
    label: "New Organization",
    description: "Create a team workspace",
    accent: "from-primary/15 via-primary/5 to-transparent",
    iconBg: "bg-primary/10 ring-primary/20",
    iconColor: "text-primary",
    arrowColor: "text-primary/50 group-hover:text-primary",
  },
  {
    key: "import",
    icon: FileSpreadsheet,
    label: "Import Sheet",
    description: "Upload a spreadsheet file",
    accent: "from-primary/10 via-primary/5 to-transparent",
    iconBg: "bg-primary/10 ring-primary/20",
    iconColor: "text-primary",
    arrowColor: "text-primary/50 group-hover:text-primary",
  },
];

export default function QuickActions() {
  const router = useRouter();

  const [inviteTeamOpen, setInviteTeamOpen] = useState(false);
  const [createOrgOpen, setCreateOrgOpen] = useState(false);
  const [folders, setFolders] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [loadingOrgs, setLoadingOrgs] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoadingFolders(true);
        const data = await getAllFolders();
        setFolders(data || []);
      } finally {
        setLoadingFolders(false);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setLoadingOrgs(true);
        const orgs = await getAllOrganizations();
        setOrganizations(orgs || []);
      } finally {
        setLoadingOrgs(false);
      }
    })();
  }, []);

  const handleAction = (key: string) => {
    if (key === "invite") setInviteTeamOpen(true);
    if (key === "org") setCreateOrgOpen(true);
    if (key === "import") router.push("/import");
  };

  const isDisabled = (key: string) => {
    if (key === "invite") return loadingOrgs || organizations.length === 0;
    return false;
  };

  return (
    <>
      <section className="animate-fade-in">
        {/* Section label */}
        <div className="flex items-center gap-2 mb-3 px-0.5">
          <div className="h-6 w-6 rounded-md bg-primary/10 ring-1 ring-primary/20 flex items-center justify-center">
            <Zap className="h-3 w-3 text-primary" />
          </div>
          <span className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
            Quick Actions
          </span>
          <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent ml-1" />
        </div>

        {/* Cards — full-width column on xs, 3-col on sm+ */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {actions.map((action) => {
            const Icon = action.icon;
            const disabled = isDisabled(action.key);

            return (
              <button
                key={action.key}
                onClick={() => handleAction(action.key)}
                disabled={disabled}
                className="group relative overflow-hidden flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5 text-left transition-all duration-200 hover:border-primary/30 hover:bg-primary/[0.02] hover:shadow-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-border disabled:hover:bg-card"
              >
                <div className={`pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br ${action.accent}`} />

                <div className={`relative h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ring-1 ${action.iconBg} transition-transform duration-200 group-hover:scale-105`}>
                  <Icon className={`h-4 w-4 ${action.iconColor}`} />
                </div>

                <div className="relative flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-foreground leading-tight">{action.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{action.description}</p>
                </div>

                <ArrowRight className={`relative h-3.5 w-3.5 flex-shrink-0 transition-all duration-200 translate-x-0 group-hover:translate-x-0.5 ${action.arrowColor}`} />
              </button>
            );
          })}
        </div>
      </section>

      <ShareDialog
        showShareDialog={inviteTeamOpen}
        setShowShareDialog={setInviteTeamOpen}
        organizations={organizations}
      />
      <CreateOrganizationDialog
        open={createOrgOpen}
        onOpenChange={setCreateOrgOpen}
      />
    </>
  );
}
