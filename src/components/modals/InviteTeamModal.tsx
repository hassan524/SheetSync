import { useState } from "react";
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

interface InviteTeamModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const InviteTeamModal = ({ open, onOpenChange }: InviteTeamModalProps) => {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("editor");
  const [organization, setOrganization] = useState("acme");
  const [invitedEmails, setInvitedEmails] = useState<string[]>([]);

  const handleAddEmail = () => {
    if (email.trim() && !invitedEmails.includes(email.trim())) {
      setInvitedEmails((prev) => [...prev, email.trim()]);
      setEmail("");
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

  const handleInvite = () => {
    console.log({ invitedEmails, role, organization });
    onOpenChange(false);
    setEmail("");
    setInvitedEmails([]);
    setRole("editor");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <Users className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <DialogTitle>Invite Team Members</DialogTitle>
              <DialogDescription>
                Invite people to collaborate on your sheets
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="invite-emails">Email Addresses</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="invite-emails"
                  type="email"
                  placeholder="colleague@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="pl-9"
                />
              </div>
              <Button variant="secondary" onClick={handleAddEmail}>
                <UserPlus className="h-4 w-4" />
              </Button>
            </div>
            {invitedEmails.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {invitedEmails.map((e) => (
                  <Badge key={e} variant="secondary" className="gap-1">
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
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Organization</Label>
              <Select value={organization} onValueChange={setOrganization}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="acme">Acme Corporation</SelectItem>
                  <SelectItem value="design">Design Team</SelectItem>
                  <SelectItem value="marketing">Marketing Dept</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <h4 className="text-sm font-medium">Invitation Details</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Invitees will receive an email with a join link</li>
              <li>• They'll have access to sheets based on their role</li>
              <li>• You can change permissions anytime</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleInvite} disabled={invitedEmails.length === 0}>
            Send {invitedEmails.length > 0 ? `(${invitedEmails.length})` : ""} Invitation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InviteTeamModal;
