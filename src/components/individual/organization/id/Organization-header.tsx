"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
const NewSheetModal = dynamic(
  () => import("@/components/sheets/New-sheet-modal"),
);
const ShareDialog = dynamic(
  () => import("@/components/individual/sheet/dialogs/Share-dialog"),
);
import { Plus, UserPlus, Settings, Shield, Zap } from "lucide-react";
import type { Organization } from "@/types";

interface OrgHeaderProps {
  org: Organization;
}

export function OrgHeader({ org }: OrgHeaderProps) {
  const router = useRouter();

  const [newSheetOpen, setNewSheetOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between gap-4 mb-6">
        {/* ─── Left: Org Info ─── */}
        <div className="space-y-0.5 truncate min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg sm:text-xl font-semibold tracking-tight truncate">
              {org.name}
            </h1>

            <Badge
              variant="secondary"
              className="h-5 px-1.5 text-[11px] gap-1 shrink-0"
            >
              <Shield className="h-2.5 w-2.5" />
              {org.role}
            </Badge>

            {org.plan && (
              <Badge
                variant="outline"
                className="h-5 px-1.5 text-[11px] gap-1 shrink-0"
              >
                <Zap className="h-2.5 w-2.5 text-yellow-500" />
                {org.plan}
              </Badge>
            )}
          </div>

          {org.description && (
            <p className="text-[11px] sm:text-xs text-muted-foreground truncate">
              {org.description}
            </p>
          )}
        </div>

        {/* ─── Right: Actions ─── */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="h-9 w-9 p-0"
            onClick={() => setInviteOpen(true)}
          >
            <UserPlus className="h-4 w-4" />
          </Button>

          <Button
            size="sm"
            className="h-9 w-9 p-0"
            onClick={() => setNewSheetOpen(true)}
          >
            <Plus className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0 flex items-center justify-center"
          >
            <Settings className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      </div>

      {/* ─── Modals ─── */}
      <NewSheetModal
        open={newSheetOpen}
        onOpenChange={setNewSheetOpen}
        ShowSaveTo={false}
        folders={[]}
        onSheetCreated={() => {}}
      />

      <ShareDialog
        showShareDialog={inviteOpen}
        setShowShareDialog={setInviteOpen}
        currentOrg={{ id: org.id, name: org.name }}
        onInvited={() => {
          /* refresh members if needed */
        }}
      />
    </>
  );
}
