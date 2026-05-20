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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, Lock, Globe, Users } from "lucide-react";

interface CreateOrgModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreateOrgModal = ({ open, onOpenChange }: CreateOrgModalProps) => {
  const [orgName, setOrgName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState("private");

  const handleCreate = () => {
    console.log({ orgName, description, visibility });
    onOpenChange(false);
    setOrgName("");
    setDescription("");
    setVisibility("private");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-[500px] p-4 sm:p-6">
        <DialogHeader>
          <div className="flex items-start gap-3 mb-1">
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-primary flex items-center justify-center">
              <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
            </div>
            <div className="min-w-0 text-left">
              <DialogTitle className="text-sm sm:text-lg">Create Organization</DialogTitle>
              <DialogDescription className="text-[11px] sm:text-sm leading-relaxed">
                Create a new organization to collaborate with your team
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="org-name" className="text-xs sm:text-sm">Organization Name</Label>
            <Input
              id="org-name"
              placeholder="Engineering Team"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="org-description" className="text-xs sm:text-sm">Description (optional)</Label>
            <Textarea
              id="org-description"
              placeholder="Purpose, team, or department"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs sm:text-sm">Visibility</Label>
            <Select value={visibility} onValueChange={setVisibility}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="private">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    <span>Private</span>
                  </div>
                </SelectItem>
                <SelectItem value="internal">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>Internal</span>
                  </div>
                </SelectItem>
                <SelectItem value="public">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    <span>Public</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="bg-muted/50 rounded-lg p-3 sm:p-4 space-y-2">
            <h4 className="text-xs sm:text-sm font-medium">What happens next?</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• You'll be the admin of this organization</li>
              <li>• Invite team members via email</li>
              <li>• Create shared sheets for collaboration</li>
              <li>• Manage roles and permissions</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!orgName.trim()}>
            Create Organization
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateOrgModal;
