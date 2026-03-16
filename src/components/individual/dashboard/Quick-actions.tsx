"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, Users, Building2, FileSpreadsheet } from "lucide-react";
import NewSheetModal from "@/components/sheets/New-sheet-modal";
import InviteTeamModal from "@/components/modals/Invite-team-modal";
import CreateOrganizationDialog from "../organization/Create-organization-dialog";
import { getAllFolders } from "@/lib/querys/folder/folders";
import { getAllOrganizations } from "@/lib/querys/organization/organization";

export default function QuickActions() {
  const router = useRouter();

  const [newSheetOpen, setNewSheetOpen] = useState(false);
  const [inviteTeamOpen, setInviteTeamOpen] = useState(false);
  const [createOrgOpen, setCreateOrgOpen] = useState(false);

  const [folders, setFolders] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [loadingOrgs, setLoadingOrgs] = useState(false);

  // Fetch folders
  useEffect(() => {
    const fetchFolders = async () => {
      try {
        setLoadingFolders(true);
        const data = await getAllFolders();
        setFolders(data || []);
      } catch (error) {
        console.error("Failed to fetch folders:", error);
      } finally {
        setLoadingFolders(false);
      }
    };
    fetchFolders();
  }, []);

  // Fetch organizations
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        setLoadingOrgs(true);
        const orgs = await getAllOrganizations();
        setOrganizations(orgs || []);
      } catch (error) {
        console.error("Failed to fetch organizations:", error);
      } finally {
        setLoadingOrgs(false);
      }
    };
    fetchOrganizations();
  }, []);

  return (
    <>
      <section className="animate-fade-in">
        <div className="bg-muted/30 rounded-xl p-6 border">
          <h3 className="font-semibold mb-4">Quick Actions</h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">

            <Button
              variant="outline"
              className="h-auto py-4 flex-col gap-2"
              onClick={() => setInviteTeamOpen(true)}
              disabled={loadingOrgs || organizations.length === 0} // disable if no orgs loaded
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

      {/* Pass organizations to InviteTeamModal */}
      <InviteTeamModal
        open={inviteTeamOpen}
        onOpenChange={setInviteTeamOpen}
        organizations={organizations} // <-- new prop
      />

      <CreateOrganizationDialog
        open={createOrgOpen}
        onOpenChange={setCreateOrgOpen}
      />
    </>
  );
}