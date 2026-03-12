'use client'

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Building2 } from "lucide-react";
import { createOrganization } from '@/lib/querys/organization/organization';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface CreateOrganizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (organization: any) => void; 
}

const CreateOrganizationDialog: React.FC<CreateOrganizationDialogProps> = ({
  open,
  onOpenChange,
  onCreated,
}) => {

  const [orgName, setOrgName] = useState("");
  const [orgDescription, setOrgDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleCreateOrg = async () => {
    if (!orgName.trim()) return;

    try {
      setLoading(true);

      const newOrg = await createOrganization(orgName.trim());

      if (onCreated) onCreated(newOrg);

      toast.success(`Organization "${newOrg.name}" created successfully`);

      // Reset form
      setOrgName("");
      setOrgDescription("");
      onOpenChange(false);

      // to show organization in the UI instantly
      router.refresh()

    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to create organization");
    } finally {
      setLoading(false);
    }
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
              <DialogTitle>Create Organization</DialogTitle>
              <DialogDescription>
                Create a new organization to collaborate with your team
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="org-name">Organization Name</Label>
            <Input
              id="org-name"
              placeholder="e.g., Engineering Team"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="org-description">Description (optional)</Label>
            <Textarea
              id="org-description"
              placeholder="What is this organization for?"
              value={orgDescription}
              onChange={(e) => setOrgDescription(e.target.value)}
              rows={3}
              disabled={loading}
            />
          </div>

          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <h4 className="text-sm font-medium">What happens next?</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• You'll be the admin of this organization</li>
              <li>• Invite team members via email</li>
              <li>• Create shared sheets for collaboration</li>
              <li>• Manage roles and permissions</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateOrg}
            disabled={!orgName.trim() || loading}
          >
            {loading ? "Creating..." : "Create Organization"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateOrganizationDialog;