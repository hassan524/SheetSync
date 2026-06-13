"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Globe, Copy, Building2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api/api-client";
import { getCurrentAppOrigin } from "@/lib/app-url";

interface Organization {
  id: string;
  name: string;
}

interface ShareDialogProps {
  showShareDialog: boolean;
  setShowShareDialog: (show: boolean) => void;
  /** When inside a sheet, pass the sheet ID for link sharing */
  sheetId?: string;
  isDark?: boolean;
  /** Pass orgs to show an org selector (when not scoped to a specific org) */
  organizations?: Organization[];
  /** The org already scoped to (inside org page or org sheet) */
  currentOrg?: Organization;
  onInvited?: () => void;
  onShared?: (orgId: string) => void;
}

export default function ShareDialog({
  showShareDialog,
  setShowShareDialog,
  sheetId,
  isDark = false,
  organizations,
  currentOrg,
  onInvited,
  onShared,
}: ShareDialogProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("editor");
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [sending, setSending] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [creatingLink, setCreatingLink] = useState(false);

  const parseEmails = (value: string) =>
    Array.from(
      new Set(
        value
          .split(/[\s,;]+/)
          .map((item) => item.trim().toLowerCase())
          .filter(Boolean),
      ),
    );

  // Show org selector when we're NOT inside a specific org/sheet, or when inside a personal sheet
  const showOrgSelector =
    !sheetId && !currentOrg && organizations && organizations.length > 0;
  const effectiveOrg = currentOrg || selectedOrg;

  useEffect(() => {
    if (organizations && organizations.length > 0 && !currentOrg) {
      setSelectedOrg(organizations[0]);
    } else if (currentOrg) {
      setSelectedOrg(currentOrg);
    }
  }, [organizations, currentOrg, showShareDialog]);

  const handleInvite = async () => {
    const emails = parseEmails(email);
    if (emails.length === 0) return;
    if (!effectiveOrg && !sheetId) {
      toast.error("Select an organization first");
      return;
    }

    // If we have an org context, use the real invite API
    if (effectiveOrg) {
      try {
        setSending(true);
        const response = await api.post("/invites/send", {
          emails,
          orgId: effectiveOrg.id,
          role,
          sheetId,
        });
        const data = response?.data ?? response;
        if (data?.results) {
          data.results.forEach((r: any) => {
            if (r.status === "sent") toast.success(`Invite sent to ${r.email}`);
            if (r.status === "skipped" || r.status === "failed")
              toast.error(r.error);
          });
        }
        setEmail("");
        setRole("editor");
        if (effectiveOrg && onShared) onShared(effectiveOrg.id);
        if (onInvited) onInvited();
      } catch (err: any) {
        toast.error(
          err?.response?.data?.error ||
          err?.message ||
          "Failed to send invitation",
        );
      } finally {
        setSending(false);
      }
    } else if (sheetId) {
      try {
        setSending(true);
        const response = await api.post("/invites/send", {
          emails,
          role,
          sheetId,
        });
        const data = response?.data ?? response;
        if (data?.results) {
          data.results.forEach((r: any) => {
            if (r.status === "sent") toast.success(`Invite sent to ${r.email}`);
            if (r.status === "skipped" || r.status === "failed")
              toast.error(r.error);
          });
        }
        setEmail("");
        if (onInvited) onInvited();
      } catch (err: any) {
        toast.error(
          err?.response?.data?.error ||
          err?.message ||
          "Failed to send invitation",
        );
      } finally {
        setSending(false);
      }
    }
  };

  const createShareLink = async () => {
    if (!sheetId && !effectiveOrg) return "";

    try {
      setCreatingLink(true);
      const response = await api.post("/invites/link", {
        sheetId,
        orgId: effectiveOrg?.id,
        role,
      });
      const data = response?.data ?? response;
      const inviteUrl = data?.inviteUrl ?? "";
      setShareUrl(inviteUrl);
      if (effectiveOrg && onShared) onShared(effectiveOrg.id);
      if (onInvited) onInvited();
      return inviteUrl;
    } catch (err: any) {
      toast.error(
        err?.response?.data?.error ||
        err?.message ||
        "Failed to create share link",
      );
      return "";
    } finally {
      setCreatingLink(false);
    }
  };

  const handleCopyLink = async () => {
    const inviteUrl = shareUrl || (await createShareLink());
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    toast.success("Invite link copied");
  };

  // Dynamic title based on context
  const dialogTitle = sheetId ? "Share sheet" : "Invite members";
  const dialogDesc = sheetId
    ? currentOrg
      ? `Invite collaborators to ${currentOrg.name} or share a link`
      : "Invite collaborators or share a link"
    : currentOrg
      ? `Invite collaborators to ${currentOrg.name} or share an invite link`
      : "Select an organization and invite collaborators";
  const displayShareUrl =
    shareUrl ||
    (sheetId
      ? `${getCurrentAppOrigin()}/sheet/${sheetId}?invited=true...`
      : effectiveOrg
        ? `${getCurrentAppOrigin()}/invite/...`
        : getCurrentAppOrigin());

  return (
    <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDesc}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {!currentOrg && (!organizations || organizations.length === 0) && (
            <div className="text-xs text-amber-600 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
              You must create an organization first from the dashboard to share sheets with team members.
            </div>
          )}
          <div className="flex gap-2">
            <Input
              placeholder="Emails separated by comma or space"
              className="text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleInvite();
              }}
              disabled={sending || (!currentOrg && (!organizations || organizations.length === 0))}
            />
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="w-28 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="viewer">Viewer</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Button
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 text-sm"
              onClick={handleInvite}
              disabled={sending || !email.trim() || !effectiveOrg}
            >
              {sending ? "Sending…" : "Invite"}
            </Button>
          </div>

          {showOrgSelector && (
            /* ── Organization selector (when NOT inside a specific org) ── */
            <div
              className={`rounded-xl border p-3 ${isDark ? "border-gray-800 bg-gray-900" : "border-gray-100 bg-gray-50"}`}
            >
              <div className="flex items-center gap-1.5 mb-2">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[12px] font-semibold">
                  Select Organization
                </span>
              </div>
              <Select
                value={selectedOrg?.id || ""}
                onValueChange={(id) => {
                  setSelectedOrg(
                    (organizations ?? []).find((o) => o.id === id) || null,
                  );
                  setShareUrl("");
                }}
                disabled={sending}
              >
                <SelectTrigger className="h-8 text-sm w-full">
                  <SelectValue placeholder="Choose organization" />
                </SelectTrigger>
                <SelectContent>
                  {(organizations ?? []).map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {(sheetId || effectiveOrg) && (
            /* ── "Anyone with the link" section (when inside org/sheet) ── */
            <div
              className={`rounded-xl border p-3 ${isDark ? "border-gray-800 bg-gray-900" : "border-gray-100 bg-gray-50"}`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[12px] font-semibold flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5" /> Anyone with the link
                </span>
                <Select
                  value={role}
                  onValueChange={(value) => {
                    setRole(value);
                    setShareUrl("");
                  }}
                  disabled={creatingLink}
                >
                  <SelectTrigger className="h-7 w-24 text-[11px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Viewer</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 mt-2">
                <input
                  readOnly
                  value={displayShareUrl}
                  className="flex-1 text-[11px] font-mono bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-gray-500"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1"
                  onClick={handleCopyLink}
                  disabled={creatingLink}
                >
                  <Copy className="h-3 w-3" />
                  {creatingLink ? "Creating..." : shareUrl ? "Copy" : "Create"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
