"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
const NewSheetModal = dynamic(
  () => import("@/components/sheets/New-sheet-modal"),
);
const ShareDialog = dynamic(
  () => import("@/components/individual/sheet/dialogs/Share-dialog"),
);
import { Plus, UserPlus, Shield, Zap, Upload } from "lucide-react";
import type { Organization } from "@/types";
import {
  getPersonalSheetOptions,
  importPersonalSheetToOrganization,
} from "@/lib/querys/sheets/sheets";
import { logActivity } from "@/lib/querys/activity/activity";
import { toast } from "sonner";

interface OrgHeaderProps {
  org: Organization;
}

export function OrgHeader({ org }: OrgHeaderProps) {
  const router = useRouter();
  const [newSheetOpen, setNewSheetOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [personalSheets, setPersonalSheets] = useState<
    { id: string; title: string; updated_at: string | null }[]
  >([]);
  const [selectedSheetId, setSelectedSheetId] = useState("");
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (!importOpen) return;
    getPersonalSheetOptions()
      .then((sheets) => {
        setPersonalSheets(sheets);
        setSelectedSheetId((prev) => prev || sheets[0]?.id || "");
      })
      .catch(() => toast.error("Failed to load personal sheets"));
  }, [importOpen]);

  const handleImportPersonalSheet = async () => {
    if (!selectedSheetId) {
      toast.error("Select a personal sheet first.");
      return;
    }

    try {
      setImporting(true);
      const created = await importPersonalSheetToOrganization({
        sourceSheetId: selectedSheetId,
        organizationId: org.id,
      });
      const sourceTitle =
        personalSheets.find((sheet) => sheet.id === selectedSheetId)?.title ??
        created.title ??
        "Personal sheet";
      await logActivity({
        sheetId: created.id,
        organizationId: org.id,
        action: "imported personal sheet",
        target: sourceTitle,
      });
      toast.success("Personal sheet imported into organization");
      setImportOpen(false);
      router.push(`/sheet/${created.id}?org=true`);
      router.refresh();
    } catch (error: any) {
      toast.error(error?.message ?? "Failed to import personal sheet");
    } finally {
      setImporting(false);
    }
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-6">
        {/* ─── Left: Org Info ─── */}
        <div className="space-y-0.5 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="expandable-truncate text-lg sm:text-xl font-semibold tracking-tight max-w-full" title={org.name} tabIndex={0}>
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
            <p className="expandable-truncate text-[11px] sm:text-xs text-muted-foreground" title={org.description} tabIndex={0}>
              {org.description}
            </p>
          )}
        </div>

        {/* ─── Right: Actions ─── */}
        <div className="flex items-center gap-2 shrink-0 overflow-x-auto styled-scrollbar pb-1 sm:pb-0">
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-1.5"
            onClick={() => setInviteOpen(true)}
          >
            <UserPlus className="h-4 w-4" />
            <span className="hidden sm:inline text-xs">Invite</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-1.5"
            onClick={() => setImportOpen(true)}
          >
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline text-xs">Import</span>
          </Button>

          <Button
            size="sm"
            className="h-9 gap-1.5"
            onClick={() => setNewSheetOpen(true)}
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline text-xs">New Sheet</span>
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

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Import Personal Sheet</DialogTitle>
            <DialogDescription>
              Copy one of your personal sheets into {org.name}.
            </DialogDescription>
          </DialogHeader>

          <label className="block space-y-2">
            <span className="text-xs font-medium">Personal sheet</span>
            <select
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/25"
              value={selectedSheetId}
              onChange={(event) => setSelectedSheetId(event.target.value)}
              disabled={importing || personalSheets.length === 0}
            >
              {personalSheets.length === 0 ? (
                <option value="">No personal sheets found</option>
              ) : (
                personalSheets.map((sheet) => (
                  <option key={sheet.id} value={sheet.id}>
                    {sheet.title}
                  </option>
                ))
              )}
            </select>
          </label>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setImportOpen(false)}
              disabled={importing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleImportPersonalSheet}
              disabled={importing || !selectedSheetId}
            >
              {importing ? "Importing..." : "Import"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

