"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Building2,
  Users,
  FileSpreadsheet,
  ShieldCheck,
  Info,
} from "lucide-react";
import CreateOrganizationDialog from "./Create-organization-dialog";
import { Organization } from "@/types";

interface StatsRowProps {
  organizations: Organization[];
}

const StatsRow: React.FC<StatsRowProps> = ({ organizations }) => {
  const [createOrgOpen, setCreateOrgOpen] = useState(false);

  const totalMembers = useMemo(
    () =>
      organizations.reduce((sum, org) => sum + (org.members?.length ?? 0), 0),
    [organizations],
  );
  const totalSheets = useMemo(
    () =>
      organizations.reduce((sum, org) => sum + (org.sheets?.length ?? 0), 0),
    [organizations],
  );
  const adminCount = useMemo(
    () =>
      organizations.filter(
        (org) => org.role === "admin" || org.role === "owner",
      ).length,
    [organizations],
  );

  const stats = [
    {
      label: "Organizations",
      value: organizations.length,
      icon: Building2,
      description: "Teams you belong to",
    },
    {
      label: "Total Members",
      value: totalMembers,
      icon: Users,
      description: "Across all orgs",
    },
    {
      label: "Total Sheets",
      value: totalSheets,
      icon: FileSpreadsheet,
      description: "Org spreadsheets",
    },
    {
      label: "Admin Access",
      value: adminCount,
      icon: ShieldCheck,
      description: "Orgs you manage",
    },
  ];

  return (
    <>
      {/* Page Header */}
      <div className="flex items-start justify-between pt-1 mb-6 gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-0.5 min-w-0">
            <h1 className="text-lg sm:text-xl font-semibold tracking-tight truncate">
              Organizations
            </h1>
            <p className="text-[11px] sm:text-xs text-muted-foreground truncate">
              Manage and collaborate with your teams
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            onClick={() => setCreateOrgOpen(true)}
            size="sm"
            className="h-9 px-3 text-sm gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Organization</span>
            <span className="sm:hidden">New</span>
          </Button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3 mb-6">
        <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
        <p className="text-xs text-muted-foreground">
          Organizations let you collaborate with teams on shared spreadsheets.
          Create a new organization, invite members, and control access with
          role-based permissions — all in one place.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {stats.map(({ label, value, icon: Icon, description }) => (
          <div
            key={label}
            className="flex flex-col gap-2 rounded-xl border border-border bg-card px-4 py-3"
          >
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-xs font-medium text-muted-foreground">
                {label}
              </p>
            </div>
            <div>
              <p className="text-2xl font-bold leading-none">{value}</p>
              <p className="text-[11px] text-muted-foreground mt-1">
                {description}
              </p>
            </div>
          </div>
        ))}
      </div>

      <CreateOrganizationDialog
        open={createOrgOpen}
        onOpenChange={setCreateOrgOpen}
      />
    </>
  );
};

export default StatsRow;
