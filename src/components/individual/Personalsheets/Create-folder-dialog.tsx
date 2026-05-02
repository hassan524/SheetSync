"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Folder } from "lucide-react";
import { useRouter } from "next/navigation";

import { logActivity } from "@/lib/querys/activity/activity";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (name: string) => Promise<void> | void;
}

const CreateFolderDialog = ({ open, onOpenChange, onConfirm }: Props) => {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();


  const handleCreate = async () => {
    if (!name.trim()) return;

    try {
      setLoading(true);

      await onConfirm(name);

      await logActivity({
        action: "created folder",
        target: name,
        organizationId: null,
      });
      router.refresh()
      setName("");
      onOpenChange(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[380px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Folder className="h-5 w-5 text-primary" />
            New Folder
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Label htmlFor="folderName" className="text-sm">
            Folder name
          </Label>

          <Input
            id="folderName"
            placeholder="e.g. Project Alpha"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            autoFocus
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>

          <Button onClick={handleCreate} disabled={!name.trim() || loading}>
            {loading ? "Creating..." : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateFolderDialog;