'use client';

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Mail, UserPlus, X, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { api } from "@/lib/api/api-client";

interface Organization {
  id: string;
  name: string;
}

interface InviteTeamModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pass multiple orgs to show a selector. Omit (or pass a single-item array) when context is already clear. */
  organizations?: Organization[];
  /** The org you're already scoped to — used when `organizations` is omitted */
  currentOrg?: Organization;
  onInvited?: () => void;
}

const ROLES_DESC: Record<string, string> = {
  admin: "Full access & manage members",
  editor: "Can edit and leave comments",
  viewer: "Read-only access to sheets",
};

const InviteTeamModal = ({
  open,
  onOpenChange,
  organizations,
  currentOrg,
  onInvited,
}: InviteTeamModalProps) => {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("editor");
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [invitedEmails, setInvitedEmails] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [emailError, setEmailError] = useState(false);

  // Show org selector only when multiple orgs are explicitly passed
  const showOrgSelect = organizations && organizations.length > 1;

  const isValidEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  useEffect(() => {
    if (organizations && organizations.length > 0) {
      setOrganization(organizations[0]);
    } else if (currentOrg) {
      setOrganization(currentOrg);
    }
  }, [organizations, currentOrg, open]);

  const handleAddEmail = () => {
    const trimmed = email.trim();
    if (!trimmed) return;
    if (!isValidEmail(trimmed)) { setEmailError(true); return; }
    if (!invitedEmails.includes(trimmed)) {
      setInvitedEmails((prev) => [...prev, trimmed]);
      setEmail("");
      setEmailError(false);
    }
  };

  const handleRemoveEmail = (e: string) =>
    setInvitedEmails((prev) => prev.filter((x) => x !== e));

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") { e.preventDefault(); handleAddEmail(); }
  };

  const handleInvite = async () => {
    if (!organization || invitedEmails.length === 0) return;
    try {
      setSending(true);
      const response = await api.post("/invites/send", {
        emails: invitedEmails,
        orgId: organization.id,
        orgName: organization.name,
        role,
      });
      const data = response?.data ?? response;
      if (data?.results) {
        data.results.forEach((r: any) => {
          if (r.status === "sent") toast.success(`Invite sent to ${r.email}`);
          if (r.status === "skipped" || r.status === "failed") toast.error(r.error);
        });
      }
      setInvitedEmails([]);
      setEmail("");
      setRole("editor");
      onOpenChange(false);
      if (onInvited) onInvited();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || err?.message || "Failed to send invitation");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes tag-pop {
          from { opacity: 0; transform: scale(0.82) translateY(4px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .tag-pop { animation: tag-pop 0.18s cubic-bezier(0.34,1.56,0.64,1) both; }
      `}</style>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[460px] p-0 overflow-hidden gap-0 rounded-xl border border-border shadow-xl">

          {/* Header */}
          <div className="px-6 pt-6 pb-5 border-b border-border">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Users className="h-4 w-4 text-foreground" />
                </div>
                <div>
                  <DialogTitle className="text-[15px] font-semibold leading-tight">
                    Invite team members
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                    Send email invites and set access roles.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-5">

            {/* Email input */}
            <div className="space-y-1.5">
              <Label htmlFor="invite-email" className="text-xs font-medium text-muted-foreground">
                Email address
              </Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="colleague@company.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setEmailError(false); }}
                    onKeyDown={handleKeyDown}
                    className={`pl-9 h-9 text-sm${emailError ? " border-destructive focus-visible:ring-destructive/30" : ""}`}
                    disabled={sending}
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 px-3 shrink-0"
                  onClick={handleAddEmail}
                  disabled={sending || !email.trim()}
                >
                  <UserPlus className="h-3.5 w-3.5" />
                </Button>
              </div>

              {emailError && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  Enter a valid email address
                </p>
              )}

              {/* Email tags */}
              {invitedEmails.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {invitedEmails.map((e) => (
                    <Badge
                      key={e}
                      variant="secondary"
                      className="tag-pop h-6 pl-2 pr-1 text-xs font-normal gap-1 rounded-md"
                    >
                      {e}
                      <button
                        onClick={() => handleRemoveEmail(e)}
                        className="ml-0.5 rounded hover:text-destructive transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              ) : !emailError ? (
                <p className="text-xs text-muted-foreground">
                  Press{" "}
                  <kbd className="px-1 py-0.5 text-[10px] font-mono rounded border bg-muted">Enter</kbd>{" "}
                  or click + to add multiple
                </p>
              ) : null}
            </div>

            {/* Role + Org (org selector only shown when multiple orgs exist) */}
            <div className={`grid gap-3 ${showOrgSelect ? "grid-cols-2" : "grid-cols-1"}`}>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Role</Label>
                <Select value={role} onValueChange={setRole} disabled={sending}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground leading-tight">{ROLES_DESC[role]}</p>
              </div>

              {showOrgSelect && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Organization</Label>
                  <Select
                    value={organization?.id || ""}
                    onValueChange={(id) =>
                      setOrganization((organizations ?? []).find((o) => o.id === id) || null)
                    }
                    disabled={sending}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Select org" />
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
            </div>

            {/* Info strip */}
            <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 space-y-1.5">
              {[
                "Invitees get a secure join link via email",
                "Access is scoped to their assigned role",
                "Permissions can be changed or revoked anytime",
              ].map((txt, i) => (
                <div key={i} className="flex items-start gap-2">
                  <svg className="mt-0.5 shrink-0" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span className="text-xs text-muted-foreground">{txt}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <DialogFooter className="px-6 py-4 border-t border-border flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">
              {invitedEmails.length === 0
                ? "No recipients yet"
                : `${invitedEmails.length} recipient${invitedEmails.length > 1 ? "s" : ""}`}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={sending}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleInvite}
                disabled={invitedEmails.length === 0 || !organization || sending}
              >
                {sending
                  ? "Sending…"
                  : `Send invite${invitedEmails.length > 1 ? `s (${invitedEmails.length})` : ""}`}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default InviteTeamModal;