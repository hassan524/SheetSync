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
import { Building2, User, X, FolderPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { SHEET_TEMPLATES } from "@/constants/Sheet-templates";
import { createSheet } from "@/lib/querys/sheets/sheets";
import { createFolder } from "@/lib/querys/folder/folders";
import { logActivity } from "@/lib/querys/activity/activity";
import { toast } from "sonner";
import { ICON_MAP } from "@/constants/Sheet-templates";
import CreateFolderDialog from "@/components/individual/Personalsheets/Create-folder-dialog";
import CreateOrganizationDialog from "@/components/individual/organization/Create-organization-dialog";

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
  folders: externalFolders,
  organizations,
}: UseTemplateModalProps) => {
  const [sheetName, setSheetName] = useState("");
  const [saveToOrg, setSaveToOrg] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<string>("");
  const [selectedFolder, setSelectedFolder] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [createOrgOpen, setCreateOrgOpen] = useState(false);
  const [localFolders, setLocalFolders] = useState<any[]>([]);
  const [localOrganizations, setLocalOrganizations] = useState<any[]>([]);

  const router = useRouter();

  const template = SHEET_TEMPLATES.find((t) => t.id === templateId);
  const Icon = template ? ICON_MAP[template.iconName] : null;
  const accent = template?.accent;

  const folders = [
    ...(externalFolders || []),
    ...localFolders.filter(
      (lf) => !(externalFolders || []).find((f: any) => f.id === lf.id),
    ),
  ];
  const organizationOptions = [
    ...(organizations || []),
    ...localOrganizations.filter(
      (lo) => !(organizations || []).find((org: any) => org.id === lo.id),
    ),
  ];
  const hasFolders = folders.length > 0;
  const hasOrganizations = organizationOptions.length > 0;

  useEffect(() => {
    if (template) setSheetName(template.title);
  }, [template]);

  const handleToggleOrg = (checked: boolean) => {
    setSaveToOrg(checked);
    setSelectedOrg("");
    setSelectedFolder("");
  };

  const handleCreateFolder = async (name: string) => {
    try {
      const data = await createFolder(name);
      await logActivity({
        organizationId: null,
        action: "created folder",
        target: name,
      });
      const newFolder = { ...data, sheets: [] };
      setLocalFolders((prev) => [...prev, newFolder]);
      setSelectedFolder(newFolder.id);
      toast.success(`Folder "${name}" created — now create your sheet`);
    } catch (err: any) {
      toast.error(err.message || "Error creating folder");
    }
  };

  const handleCreateSheet = async () => {
    if (!template || !sheetName.trim()) return;
    if (!saveToOrg && !hasFolders) return;

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

  const canCreate =
    !!sheetName.trim() && (saveToOrg ? !!selectedOrg : hasFolders);

  if (!template) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          showCloseButton={false}
          className="sm:max-w-[460px] p-0 overflow-hidden rounded-2xl border border-zinc-200/80 shadow-xl"
        >
          {/* HEADER — same style as New-sheet-modal */}
          <div
            className={`relative h-[120px] sm:h-[160px] overflow-hidden bg-gradient-to-br ${accent?.from}`}
          >
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="absolute top-3.5 right-3.5 z-30 h-7 w-7 cursor-pointer rounded-full bg-black/5 hover:bg-black/10 border flex items-center justify-center transition-colors"
            >
              <X className="h-3.5 w-3.5 text-zinc-500" />
            </button>

            <div className="absolute inset-0 flex flex-col justify-end px-4 pb-3 sm:px-6 sm:pb-4">
              <div className="flex items-center gap-2 mb-1 sm:mb-2">
                {Icon && (
                  <div className={`h-6 w-6 sm:h-7 sm:w-7 rounded-lg border flex items-center justify-center ${accent?.iconRing || ""}`}>
                    <Icon className="h-3.5 w-3.5 text-zinc-600" />
                  </div>
                )}
                <span className="text-[10px] sm:text-[10.5px] font-semibold uppercase text-zinc-400 tracking-wide">
                  {template.title}
                </span>
              </div>
              <p className="text-[15px] sm:text-[19px] font-bold leading-snug">
                {template.copy?.tagline}
              </p>
            </div>
          </div>

          {/* BODY */}
          <div className="px-6 py-5 space-y-4 bg-white">
            <p className="text-[13px] text-zinc-500 leading-relaxed">
              {template.copy?.body}
            </p>

            {/* NAME */}
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Sheet name</Label>
              <Input
                value={sheetName}
                onChange={(e) => setSheetName(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && canCreate && handleCreateSheet()
                }
                placeholder={`e.g. My ${template.title}`}
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
                <>
                  {hasOrganizations ? (
                    <>
                      <Select value={selectedOrg} onValueChange={setSelectedOrg}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select organization..." />
                        </SelectTrigger>
                        <SelectContent>
                          {organizationOptions.map((org) => (
                            <SelectItem key={org.id} value={org.id}>
                              {org.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <button
                        className="text-xs text-zinc-500 flex items-center gap-1 hover:text-zinc-700 transition-colors"
                        onClick={() => setCreateOrgOpen(true)}
                      >
                        <Building2 className="h-3 w-3" />
                        New organization
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-3 py-4 px-3 rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50">
                      <Building2 className="h-5 w-5 text-zinc-400" />
                      <div className="text-center">
                        <p className="text-sm font-medium text-zinc-700">
                          Create an organization first
                        </p>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          You need an organization to save this as a team sheet
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                        onClick={() => setCreateOrgOpen(true)}
                      >
                        <Building2 className="h-3.5 w-3.5" />
                        Create Organization
                      </Button>
                    </div>
                  )}
                </>
              )}

              {/* PERSONAL FOLDER */}
              {!saveToOrg && (
                <>
                  {hasFolders ? (
                    <>
                      <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select folder..." />
                        </SelectTrigger>
                        <SelectContent>
                          {folders.map((f) => (
                            <SelectItem key={f.id} value={f.id}>
                              {f.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <button
                        className="text-xs text-zinc-500 flex items-center gap-1 hover:text-zinc-700 transition-colors"
                        onClick={() => setCreateFolderOpen(true)}
                      >
                        <FolderPlus className="h-3 w-3" />
                        New folder
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-3 py-4 px-3 rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50">
                      <FolderPlus className="h-5 w-5 text-zinc-400" />
                      <div className="text-center">
                        <p className="text-sm font-medium text-zinc-700">Create a folder first</p>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          You need at least one folder to save your sheet
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                        onClick={() => setCreateFolderOpen(true)}
                      >
                        <FolderPlus className="h-3.5 w-3.5" />
                        Create Folder
                      </Button>
                    </div>
                  )}
                </>
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

      <CreateFolderDialog
        open={createFolderOpen}
        onOpenChange={setCreateFolderOpen}
        onConfirm={handleCreateFolder}
      />

      <CreateOrganizationDialog
        open={createOrgOpen}
        onOpenChange={setCreateOrgOpen}
        onCreated={(org) => {
          setLocalOrganizations((prev) => [...prev, org]);
          setSelectedOrg(org.id);
        }}
      />
    </>
  );
};

export default UseTemplateModal;
