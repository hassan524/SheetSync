"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, Users, Building2, FileSpreadsheet } from "lucide-react";
import NewSheetModal from "@/components/sheets/New-sheet-modal";
import InviteTeamModal from "@/components/modals/Invite-team-modal";
import CreateOrgModal from "@/components/modals/Create-org-modal";

export default function QuickActions() {
  const router = useRouter();

  const [newSheetOpen, setNewSheetOpen] = useState(false);
  const [inviteTeamOpen, setInviteTeamOpen] = useState(false);
  const [createOrgOpen, setCreateOrgOpen] = useState(false);

  return (
    <>
      <section className="animate-fade-in">
        <div className="bg-muted/30 rounded-xl p-6 border">
          <h3 className="font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="h-auto py-4 flex-col gap-2"
              onClick={() => setNewSheetOpen(true)}
            >
              <Plus className="h-5 w-5" />
              <span className="text-sm">New Sheet</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex-col gap-2"
              onClick={() => setInviteTeamOpen(true)}
            >
              <Users className="h-5 w-5" />
              <span className="text-sm">Invite Team</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex-col gap-2"
              onClick={() => setCreateOrgOpen(true)}
            >
              <Building2 className="h-5 w-5" />
              <span className="text-sm">New Org</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex-col gap-2"
              onClick={() => router.push("/import")}
            >
              <FileSpreadsheet className="h-5 w-5" />
              <span className="text-sm">Import</span>
            </Button>
          </div>
        </div>
      </section>

      {/* Modals */}
      <NewSheetModal open={newSheetOpen} onOpenChange={setNewSheetOpen} />
      <InviteTeamModal open={inviteTeamOpen} onOpenChange={setInviteTeamOpen} />
      <CreateOrgModal open={createOrgOpen} onOpenChange={setCreateOrgOpen} />
    </>
  );
}
