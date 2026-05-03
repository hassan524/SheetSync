"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Building2,
  Users,
  FileSpreadsheet,
  ShieldCheck,
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
    { label: "Organizations", value: organizations.length, icon: Building2 },
    { label: "Total Members", value: totalMembers, icon: Users },
    { label: "Total Sheets", value: totalSheets, icon: FileSpreadsheet },
    { label: "Admin Access", value: adminCount, icon: ShieldCheck },
  ];

  return (
    <>
      {/* ── HEADER ── */}
      <div className="flex items-start justify-between pt-3 sm:pt-5">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
            Organizations
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Manage and collaborate with your teams
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 mt-1">
          <Button
            onClick={() => setCreateOrgOpen(true)}
            size="sm"
            className="h-8 px-3 text-xs gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">New Organization</span>
            <span className="sm:hidden">New</span>
          </Button>
        </div>
      </div>

      {/* ── STATS ── */}
      {/* mobile: 3-column grid, last item stays same width not full */}
      <div className="grid grid-cols-3 sm:flex sm:flex-row gap-3">
        {stats.map(({ label, value, icon: Icon }, i) => (
          <div
            key={label}
            className={
              // on mobile: 4th card sits in col 1 naturally, but we want it
              // to only span 1 col (same width as others), not stretch full row
              i === 3
                ? "col-span-1 flex items-center gap-2 sm:gap-3 rounded-lg border px-3 py-2.5 bg-card border-border cursor-default sm:w-36"
                : "flex items-center gap-2 sm:gap-3 rounded-lg border px-3 py-2.5 bg-card border-border cursor-default sm:w-36"
            }
          >
            <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg flex items-center justify-center shrink-0 bg-muted">
              <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-sm sm:text-base font-semibold leading-none">
                {value}
              </p>
              <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5 leading-tight truncate">
                {label}
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
