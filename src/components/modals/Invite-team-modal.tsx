'use client';

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Users, Mail, UserPlus, X } from "lucide-react";
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
  organizations: Organization[];

  // optional callback to refresh members 
  onInvited?: () => void;
}

const BUBBLES = [
  { size: 100, top: "-20%", left: "-6%", opacity: 0.12, dur: "9s", delay: "0s" },
  { size: 65, top: "-12%", left: "75%", opacity: 0.10, dur: "11s", delay: "1.4s" },
  { size: 40, top: "50%", left: "86%", opacity: 0.09, dur: "8s", delay: "0.6s" },
  { size: 26, top: "72%", left: "-3%", opacity: 0.13, dur: "7s", delay: "2s" },
  { size: 50, top: "82%", left: "60%", opacity: 0.08, dur: "13s", delay: "0.3s" },
  { size: 18, top: "32%", left: "91%", opacity: 0.14, dur: "6s", delay: "1s" },
  { size: 32, top: "18%", left: "-1%", opacity: 0.08, dur: "10s", delay: "3s" },
];

const ROLES_DESC: Record<string, string> = {
  admin: "Full access & manage members",
  editor: "Can edit and leave comments",
  viewer: "Read-only access to sheets",
};

const InviteTeamModal = ({
  open,
  onOpenChange,
  organizations,
  onInvited,
}: InviteTeamModalProps) => {

  const [email, setEmail] = useState("");
  const [role, setRole] = useState("editor");
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [invitedEmails, setInvitedEmails] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [emailError, setEmailError] = useState(false);

  const isValidEmail = (val: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  useEffect(() => {
    if (organizations.length > 0) {
      setOrganization(organizations[0]);
    }
  }, [organizations, open]);

  const handleAddEmail = () => {
    const trimmed = email.trim();
    if (!trimmed) return;
    if (!isValidEmail(trimmed)) {
      setEmailError(true);
      return;
    }
    if (!invitedEmails.includes(trimmed)) {
      setInvitedEmails((prev) => [...prev, trimmed]);
      setEmail("");
      setEmailError(false);
    }
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    setInvitedEmails((prev) => prev.filter((e) => e !== emailToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddEmail();
    }
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
          if (r.status === "sent") {
            toast.success(`Email sent successfully to ${r.email}`);
          }

          if (r.status === "skipped" || r.status === "failed") {
            toast.error(r.error);
          }
        });
      }

      setInvitedEmails([]);
      setEmail("");
      setRole("editor");
      onOpenChange(false);

      if (onInvited) onInvited();

    } catch (err: any) {
      const message =
        err?.response?.data?.error ||
        err?.message ||
        "Failed to send invitation";

      toast.error(message);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes itm-bubble-float {
          from { transform: translateY(0px) scale(1); }
          to   { transform: translateY(-14px) scale(1.04); }
        }
        .itm-bubble {
          position: absolute;
          border-radius: 50%;
          border: 1.5px solid rgba(255,255,255,0.22);
          background: radial-gradient(
            circle at 32% 32%,
            rgba(255,255,255,0.28) 0%,
            rgba(100,200,120,0.10) 45%,
            transparent 100%
          );
          pointer-events: none;
          animation: itm-bubble-float var(--dur) ease-in-out var(--delay) infinite alternate;
        }
        .itm-bubble::after {
          content: '';
          position: absolute;
          width: 26%; height: 26%;
          top: 15%; left: 15%;
          border-radius: 50%;
          background: rgba(255,255,255,0.5);
          filter: blur(3px);
        }
        @keyframes itm-tag-in {
          from { opacity: 0; transform: scale(0.78); }
          to   { opacity: 1; transform: scale(1); }
        }
        .itm-tag-in {
          animation: itm-tag-in 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden gap-0">

          {/* ── HEADER with green gradient + bubbles ── */}
          <div
            className="relative px-6 pt-7 pb-6 overflow-hidden"
            style={{
              background: "linear-gradient(130deg, #24573a 0%, #378f4d 52%, #42a85e 100%)",
            }}
          >
            {/* subtle radial glow */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "radial-gradient(ellipse 55% 70% at 90% 30%, rgba(255,255,255,0.07) 0%, transparent 70%)",
              }}
            />

            {/* Floating bubbles */}
            {BUBBLES.map((b, i) => (
              <div
                key={i}
                className="itm-bubble"
                style={{
                  width: b.size,
                  height: b.size,
                  top: b.top,
                  left: b.left,
                  opacity: b.opacity,
                  ["--dur" as any]: b.dur,
                  ["--delay" as any]: b.delay,
                }}
              />
            ))}

            {/* Icon + Title — relative so it sits above bubbles */}
            <DialogHeader className="relative z-10">
              <div className="flex items-center gap-3 mb-1">
                <div
                  className="h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: "rgba(255,255,255,0.14)",
                    border: "1px solid rgba(255,255,255,0.22)",
                  }}
                >
                  <Users className="h-5 w-5" style={{ color: "rgba(255,255,255,0.9)" }} />
                </div>
                <div>
                  <DialogTitle className="text-white text-[17px] leading-tight">
                    Invite Team Members
                  </DialogTitle>
                  <DialogDescription style={{ color: "rgba(255,255,255,0.58)", marginTop: 3 }}>
                    Add people and control what they can access.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>

          {/* ── BODY ── */}
          <div className="px-6 pt-5 pb-2 space-y-5">

            {/* Email input */}
            <div className="space-y-2">
              <Label htmlFor="invite-emails" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Email Addresses
              </Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="invite-emails"
                    type="email"
                    placeholder="colleague@company.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setEmailError(false); }}
                    onKeyDown={handleKeyDown}
                    className={`pl-9${emailError ? " border-red-400 focus-visible:ring-red-300" : ""}`}
                    disabled={sending}
                  />
                </div>
                <Button variant="secondary" onClick={handleAddEmail} disabled={sending || !email.trim()}>
                  <UserPlus className="h-4 w-4" />
                </Button>
              </div>

              {emailError && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                  Please enter a valid email address
                </p>
              )}
              {invitedEmails.length > 0 ? (
                <div className="flex flex-wrap gap-2 mt-2">
                  {invitedEmails.map((e) => (
                    <Badge key={e} variant="secondary" className="gap-1 itm-tag-in"
                      style={{ background: "#e6f4ea", border: "1px solid #b8d9bf", color: "#265c33" }}>
                      {e}
                      <button
                        onClick={() => handleRemoveEmail(e)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              ) : (
                !emailError && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Press <kbd className="px-1.5 py-0.5 text-[11px] font-mono rounded border bg-muted">Enter</kbd> or click + to add multiple recipients
                  </p>
                )
              )}
            </div>

            {/* Role and organization select */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Role
                </Label>
                <Select value={role} onValueChange={setRole} disabled={sending}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">{ROLES_DESC[role]}</p>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Organization
                </Label>
                <Select
                  value={organization?.id || ""}
                  onValueChange={(orgId) => {
                    const org = organizations.find((o) => o.id === orgId) || null;
                    setOrganization(org);
                  }}
                  disabled={sending}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Organization" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Info box */}
            <div
              className="rounded-lg p-4 space-y-2"
              style={{ background: "#f4f9f5", border: "1px solid #d4eada" }}
            >
              <h4 className="text-sm font-semibold" style={{ color: "#2d6b3c" }}>
                Invitation Details
              </h4>
              <ul className="space-y-1.5">
                {[
                  "Invitees will receive an email with a secure join link",
                  "They'll have access to sheets based on their assigned role",
                  "You can update or revoke permissions at any time",
                ].map((txt, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span
                      className="mt-0.5 flex-shrink-0 flex items-center justify-center rounded"
                      style={{ width: 15, height: 15, background: "#d0ecda" }}
                    >
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#2d7a3f" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                    <span className="text-xs" style={{ color: "#4a7055" }}>{txt}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* ── FOOTER ── */}
          <DialogFooter className="px-6 py-4 flex items-center justify-between gap-2 border-t">
            <span className="text-xs text-muted-foreground">
              {invitedEmails.length === 0
                ? "No recipients added yet"
                : `${invitedEmails.length} recipient${invitedEmails.length > 1 ? "s" : ""} ready`}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
                Cancel
              </Button>
              <Button
                onClick={handleInvite}
                disabled={invitedEmails.length === 0 || !organization || sending}
              >
                {sending ? "Sending…" : `Send${invitedEmails.length > 0 ? ` (${invitedEmails.length})` : ""} Invitation`}
              </Button>
            </div>
          </DialogFooter>

        </DialogContent>
      </Dialog>
    </>
  );
};

export default InviteTeamModal;