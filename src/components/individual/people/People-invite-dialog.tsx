"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { UserPlus, Mail, Users } from "lucide-react";
import { timeAgo } from "@/lib/utils";
import type { PendingInvite } from "@/lib/querys/people/people";

interface PeopleInviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizations: { id: string; name: string }[];
  pendingInvites: PendingInvite[];
}

const PeopleInviteDialog = ({
  open,
  onOpenChange,
  organizations,
  pendingInvites,
}: PeopleInviteDialogProps) => {
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("editor");

  const handleInvite = () => {
    console.log({ inviteEmail, inviteRole });
    onOpenChange(false);
    setInviteEmail("");
    setInviteRole("editor");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <UserPlus className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <DialogTitle>Invite People</DialogTitle>
              <DialogDescription>
                Invite team members to collaborate on your sheets
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="invite-email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="invite-email"
                type="email"
                placeholder="colleague@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={inviteRole} onValueChange={setInviteRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin - Full access</SelectItem>
                <SelectItem value="editor">Editor - Can edit sheets</SelectItem>
                <SelectItem value="viewer">Viewer - View only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Add to Organization</Label>
            <Select defaultValue={organizations[0]?.id ?? ""}>
              <SelectTrigger>
                <SelectValue />
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

          {pendingInvites.length > 0 && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Pending Invitations ({pendingInvites.length})
              </h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                {pendingInvites.map((invite) => (
                  <li key={invite.id}>
                    • {invite.email} - Sent {timeAgo(invite.created_at)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleInvite} disabled={!inviteEmail.trim()}>
            Send Invitation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PeopleInviteDialog;

