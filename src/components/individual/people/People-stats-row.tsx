"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { UserPlus, Users, Wifi, Coffee, Building2, Info } from "lucide-react";
import ShareDialog from "@/components/individual/sheet/dialogs/Share-dialog";
import type { PersonData } from "@/lib/querys/people/people";

interface PeopleStatsRowProps {
  people: PersonData[];
  organizations: { id: string; name: string }[];
}

const PeopleStatsRow: React.FC<PeopleStatsRowProps> = ({
  people,
  organizations,
}) => {
  const [inviteOpen, setInviteOpen] = useState(false);

  const onlineCount = people.filter((p) => p.status === "online").length;
  const awayCount = people.filter((p) => p.status === "away").length;

  return (
    <>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">People</h1>
            <p className="text-sm text-muted-foreground">
              View and manage collaborators across your organizations
            </p>
          </div>
        </div>
        <Button
          size="sm"
          className="shrink-0"
          onClick={() => setInviteOpen(true)}
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Invite People
        </Button>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3 mb-6">
        <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
        <p className="text-xs text-muted-foreground">
          People lists all collaborators who share at least one organization or spreadsheet with you. Invite new members by clicking the button above — they&apos;ll receive an email with access instructions.
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs font-medium text-muted-foreground">Total People</p>
          </div>
          <p className="text-2xl font-bold">{people.length}</p>
          <p className="text-[11px] text-muted-foreground mt-1">Across all orgs</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Wifi className="h-4 w-4 text-emerald-500" />
            <p className="text-xs font-medium text-muted-foreground">Online Now</p>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold">{onlineCount}</p>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium border border-emerald-200">
              Active
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Currently active</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Coffee className="h-4 w-4 text-amber-500" />
            <p className="text-xs font-medium text-muted-foreground">Away</p>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold">{awayCount}</p>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-medium border border-amber-200">
              Away
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Temporarily inactive</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs font-medium text-muted-foreground">Organizations</p>
          </div>
          <p className="text-2xl font-bold">{organizations.length}</p>
          <p className="text-[11px] text-muted-foreground mt-1">Shared workspaces</p>
        </div>
      </div>

      <ShareDialog
        showShareDialog={inviteOpen}
        setShowShareDialog={setInviteOpen}
        organizations={organizations}
      />
    </>
  );
};

export default PeopleStatsRow;
