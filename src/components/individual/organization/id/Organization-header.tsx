"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import NewSheetModal from "@/components/sheets/New-sheet-modal";
import InviteTeamModal from "@/components/modals/Invite-team-modal";
import {
  Building2,
  ArrowLeft,
  Plus,
  UserPlus,
  Settings,
  Shield,
  Zap,
} from "lucide-react";
import type { Organization } from "@/types";

interface OrgHeaderProps {
  org: Organization;
}

export function OrgHeader({ org }: OrgHeaderProps) {
  const router = useRouter();

  const [newSheetOpen, setNewSheetOpen] = useState(false);
  const [inviteOpen, setInviteOpen]     = useState(false);

  return (
    <>
      {/* ───────────── Top Action Bar ───────────── */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.push("/organizations")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Organizations
        </button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={() => setInviteOpen(true)}
          >
            <UserPlus className="h-3.5 w-3.5" /> Invite
          </Button>

          <Button
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={() => setNewSheetOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" /> New Sheet
          </Button>

          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Settings className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* ───────────── Organization Info ───────────── */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shrink-0">
          <Building2 className="h-5 w-5 text-primary-foreground" />
        </div>

        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-base font-semibold">{org.name}</h1>

            <Badge variant="secondary" className="h-5 px-1.5 text-[11px] gap-1">
              <Shield className="h-2.5 w-2.5" /> {org.role}
            </Badge>

            {org.plan && (
              <Badge variant="outline" className="h-5 px-1.5 text-[11px] gap-1">
                <Zap className="h-2.5 w-2.5 text-yellow-500" /> {org.plan}
              </Badge>
            )}
          </div>

          {org.description && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {org.description}
            </p>
          )}
        </div>
      </div>

      {/* ───────────── Modals ───────────── */}
      <NewSheetModal
        open={newSheetOpen}
        onOpenChange={setNewSheetOpen}
        ShowSaveTo={false}     
        folders={[]}             
        onSheetCreated={() => {}} 
      />

      {/* <InviteTeamModal
        open={inviteOpen}
        onOpenChange={setInviteOpen}
      /> */}
    </>
  );
}