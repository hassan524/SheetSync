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
import { Building2, Search, Users, Check } from "lucide-react";

interface JoinOrgModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const availableOrgs = [
  { id: "1", name: "Product Team", members: 12, description: "Product development and roadmap" },
  { id: "2", name: "Sales Division", members: 18, description: "Sales and business development" },
  { id: "3", name: "Customer Success", members: 8, description: "Customer support and success" },
];

const JoinOrgModal = ({ open, onOpenChange }: JoinOrgModalProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState("");

  const filteredOrgs = availableOrgs.filter((org) =>
    org.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleJoin = () => {
    console.log({ selectedOrg, inviteCode });
    onOpenChange(false);
    setSearchQuery("");
    setSelectedOrg(null);
    setInviteCode("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <DialogTitle>Join Organization</DialogTitle>
              <DialogDescription>
                Join an existing organization or use an invite code
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Invite Code Section */}
          <div className="space-y-2">
            <Label htmlFor="invite-code">Have an invite code?</Label>
            <div className="flex gap-2">
              <Input
                id="invite-code"
                placeholder="Enter invite code"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
              />
              <Button variant="secondary" disabled={!inviteCode.trim()}>
                Join
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                or browse organizations
              </span>
            </div>
          </div>

          {/* Search & Browse */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search organizations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {filteredOrgs.map((org) => (
              <button
                key={org.id}
                onClick={() => setSelectedOrg(org.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${
                  selectedOrg === org.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{org.name}</p>
                  <p className="text-xs text-muted-foreground">{org.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {org.members}
                  </span>
                  {selectedOrg === org.id && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </div>
              </button>
            ))}
            {filteredOrgs.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No organizations found
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleJoin} disabled={!selectedOrg}>
            Request to Join
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default JoinOrgModal;
