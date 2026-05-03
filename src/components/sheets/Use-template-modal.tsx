"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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
import { Switch } from "@/components/ui/switch";
import { Building2, User, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { SHEET_TEMPLATES } from "@/constants/Sheet-templates";
import { createSheet } from "@/lib/querys/sheets/sheets";
import { logActivity } from "@/lib/querys/activity/activity";
import { toast } from "sonner";

export interface UseTemplateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId: string;
  folders?: any[];
  organizations?: any[];
}

const UseTemplateModal = ({
  open,
  onOpenChange,
  templateId,
  folders,
  organizations,
}: UseTemplateModalProps) => {
  const [sheetName, setSheetName] = useState("");
  const [saveToOrg, setSaveToOrg] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<string>("");
  const [selectedFolder, setSelectedFolder] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const template = SHEET_TEMPLATES.find((t) => t.id === templateId);
  const Icon = template?.icon;
  const copy = template?.copy;
  const accent = template?.accent;

  useEffect(() => {
    if (template) setSheetName(template.title);
  }, [template]);

  const handleToggleOrg = (checked: boolean) => {
    setSaveToOrg(checked);
    setSelectedOrg("");
    setSelectedFolder("");
  };

  const handleCreateSheet = async () => {
    if (!template || !sheetName.trim()) return;

    try {
      setLoading(true);

      const createdSheet = await createSheet({
        name: sheetName.trim(),
        templateId: template.id,
        organizationId: saveToOrg ? selectedOrg || undefined : undefined,
        folder_id: !saveToOrg ? selectedFolder || undefined : undefined,
      });

      const isOrg = saveToOrg && selectedOrg;

      await logActivity({
        sheetId: createdSheet.id,
        organizationId: isOrg ? selectedOrg : null,
        action: "created sheet",
        target: isOrg ? `${createdSheet.name} (Org)` : createdSheet.name,
      });

      toast.success(`Sheet "${sheetName}" created`);
      router.refresh();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to create sheet");
    } finally {
      setLoading(false);
    }
  };

  const canCreate = !!sheetName.trim() && (saveToOrg ? !!selectedOrg : true);

  if (!template) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px] p-0 overflow-hidden rounded-2xl border border-zinc-200/80 shadow-xl [&>button]:hidden">
        {/* HEADER */}
        <div
          className={`relative h-[152px] overflow-hidden bg-gradient-to-br ${accent?.from}`}
        >
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-3.5 right-3.5 h-7 w-7 rounded-full bg-black/5 hover:bg-black/10 border flex items-center justify-center"
          >
            <X className="h-3.5 w-3.5 text-zinc-500" />
          </button>

          <div className="absolute inset-0 flex flex-col justify-end px-6 pb-5">
            <div className="flex items-center gap-2.5 mb-2">
              {Icon && (
                <div className="h-7 w-7 rounded-lg border flex items-center justify-center">
                  <Icon className="h-3.5 w-3.5 text-zinc-600" />
                </div>
              )}
              <span className="text-[10.5px] font-semibold uppercase text-zinc-400">
                {template.title}
              </span>
            </div>
            <p className="text-[19px] font-bold">{copy?.tagline}</p>
          </div>
        </div>

        {/* BODY */}
        <div className="px-6 py-5 space-y-5 bg-white">
          <p className="text-[13.5px] text-zinc-500">{copy?.body}</p>

          {/* NAME */}
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400">Sheet name</Label>
            <Input
              value={sheetName}
              onChange={(e) => setSheetName(e.target.value)}
            />
          </div>

          {/* SAVE TO */}
          <div className="space-y-3">
            <Label className="text-xs text-zinc-400">Save to</Label>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {saveToOrg ? (
                  <Building2 className="h-4 w-4 text-zinc-400" />
                ) : (
                  <User className="h-4 w-4 text-zinc-400" />
                )}
                <span className="text-sm">
                  {saveToOrg ? "Organization" : "Personal"}
                </span>
              </div>

              <Switch checked={saveToOrg} onCheckedChange={handleToggleOrg} />
            </div>

            {/* ORGANIZATION */}
            {saveToOrg && (
              <Select value={selectedOrg} onValueChange={setSelectedOrg}>
                <SelectTrigger>
                  <SelectValue placeholder="Select organization..." />
                </SelectTrigger>
                <SelectContent>
                  {organizations?.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* PERSONAL FOLDER */}
            {!saveToOrg && (
              <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                <SelectTrigger>
                  <SelectValue placeholder="Select folder..." />
                </SelectTrigger>
                <SelectContent>
                  {folders?.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex justify-end gap-2 p-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>

          <Button onClick={handleCreateSheet} disabled={!canCreate || loading}>
            {loading ? "Creating..." : "Create"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UseTemplateModal;
