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
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-start gap-3 min-w-0">
          <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-0.5 truncate">
            <h1 className="text-lg sm:text-xl font-semibold tracking-tight truncate">
              People
            </h1>
            <p className="text-[11px] sm:text-xs text-muted-foreground truncate">
              View and manage collaborators across your organizations
            </p>
          </div>
        </div>
        <Button
          size="sm"
          className="shrink-0 hidden md:inline-flex h-9 gap-1.5"
          onClick={() => setInviteOpen(true)}
        >
          <UserPlus className="h-4 w-4" />
          <span className="hidden sm:inline">Invite People</span>
        </Button>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3 mb-6">
        <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
        <p className="text-xs text-muted-foreground">
          People lists all collaborators who share at least one organization or
          spreadsheet with you. Invite new members by clicking the button above
          — they&apos;ll receive an email with access instructions.
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="flex items-center gap-3 bg-card border border-border rounded-xl px-3 py-3">
          <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <p className="text-lg font-bold leading-none">{people.length}</p>
            <p className="text-xs font-medium text-foreground mt-0.5 truncate">
              Total People
            </p>
            <p className="text-[10px] text-muted-foreground hidden sm:block truncate">
              Across all orgs
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-card border border-border rounded-xl px-3 py-3">
          <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-emerald-50 dark:bg-emerald-950 border border-emerald-100 dark:border-emerald-900 flex items-center justify-center shrink-0">
            <Wifi className="h-4 w-4 text-emerald-600 dark:text-emerald-500" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-lg font-bold leading-none">{onlineCount}</p>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-medium border border-emerald-200 dark:border-emerald-800">
                Active
              </span>
            </div>
            <p className="text-xs font-medium text-foreground mt-0.5 truncate">
              Online Now
            </p>
            <p className="text-[10px] text-muted-foreground hidden sm:block truncate">
              Currently active
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-card border border-border rounded-xl px-3 py-3">
          <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-100 dark:border-amber-900 flex items-center justify-center shrink-0">
            <Coffee className="h-4 w-4 text-amber-600 dark:text-amber-500" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-lg font-bold leading-none">{awayCount}</p>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 font-medium border border-amber-200 dark:border-amber-800">
                Away
              </span>
            </div>
            <p className="text-xs font-medium text-foreground mt-0.5 truncate">
              Away
            </p>
            <p className="text-[10px] text-muted-foreground hidden sm:block truncate">
              Temporarily inactive
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-card border border-border rounded-xl px-3 py-3">
          <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <p className="text-lg font-bold leading-none">
              {organizations.length}
            </p>
            <p className="text-xs font-medium text-foreground mt-0.5 truncate">
              Organizations
            </p>
            <p className="text-[10px] text-muted-foreground hidden sm:block truncate">
              Shared workspaces
            </p>
          </div>
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

