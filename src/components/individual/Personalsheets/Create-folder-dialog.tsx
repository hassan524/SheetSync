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
import { FolderPlus } from "lucide-react";
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
      router.refresh();
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
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-[400px] p-0 overflow-hidden rounded-xl">
        <div className="p-5 sm:p-6">
          <DialogHeader className="mb-5">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <FolderPlus className="h-4.5 w-4.5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold">
                  New Folder
                </DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Organize your sheets into folders
                </p>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-1.5">
            <Label
              htmlFor="folderName"
              className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
            >
              Folder name
            </Label>
            <Input
              id="folderName"
              placeholder="e.g. Project Alpha"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              autoFocus
              className="h-10"
            />
          </div>

          <DialogFooter className="mt-6 gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="flex-1 sm:flex-none"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!name.trim() || loading}
              className="flex-1 sm:flex-none"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                  Creating…
                </span>
              ) : (
                "Create Folder"
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateFolderDialog;
