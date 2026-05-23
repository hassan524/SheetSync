"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
      (lf) => !(externalFolders || []).find((f: any) => f.id === lf.id)
    ),
  ];
  const organizationOptions = [
    ...(organizations || []),
    ...localOrganizations.filter(
      (lo) => !(organizations || []).find((org: any) => org.id === lo.id)
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
      await logActivity({ organizationId: null, action: "created folder", target: name });
      const newFolder = { ...data, sheets: [] };
      setLocalFolders((prev) => [...prev, newFolder]);
      setSelectedFolder(newFolder.id);
      toast.success(`Folder "${name}" created`);
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
      toast.success(`"${sheetName}" created`);
      router.refresh();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to create sheet");
    } finally {
      setLoading(false);
    }
  };

  const canCreate = !!sheetName.trim() && (saveToOrg ? !!selectedOrg : hasFolders);

  if (!template) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        {/*
          Key fixes:
          - p-0 removes shadcn's default padding
          - overflow-hidden clips the gradient flush to rounded corners
          - [&>button]:hidden hides shadcn's built-in close button
        */}
        <DialogContent
          showCloseButton={false}
          className="sm:max-w-[400px] w-full !p-0 gap-0 rounded-xl border border-zinc-200 shadow-xl overflow-hidden [&>button]:hidden"
        >
          {/* Inner scroll wrapper */}
          <div className="flex flex-col max-h-[88vh] overflow-y-auto scroll-smooth">

            {/* ── HEADER — bleeds to every edge ── */}
            <div className={`relative shrink-0 h-[96px] bg-gradient-to-br ${accent?.from}`}>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="absolute top-3 right-3 z-10 h-6 w-6 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center transition-colors duration-150"
              >
                <X className="h-3 w-3 text-zinc-700" />
              </button>

              <div className="absolute inset-0 flex flex-col justify-end px-5 pb-4">
                <div className="flex items-center gap-1.5 mb-1">
                  {Icon && (
                    <div className={`h-5 w-5 rounded-md border bg-white/70 flex items-center justify-center ${accent?.iconRing || ""}`}>
                      <Icon className="h-2.5 w-2.5 text-zinc-600" />
                    </div>
                  )}
                  <span className="text-[9px] font-semibold uppercase tracking-widest text-zinc-500">
                    {template.title}
                  </span>
                </div>
                <p className="text-[15px] font-semibold leading-tight text-zinc-800">
                  {template.copy?.tagline}
                </p>
              </div>
            </div>

            {/* ── BODY ── */}
            <div className="px-5 pt-4 pb-4 space-y-4 bg-white">
              <p className="text-xs text-zinc-400 leading-relaxed">
                {template.copy?.body}
              </p>

              {/* Sheet name */}
              <div className="space-y-1">
                <p className="text-[11px] text-zinc-400">Sheet name</p>
                <Input
                  value={sheetName}
                  onChange={(e) => setSheetName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && canCreate && handleCreateSheet()}
                  placeholder={`e.g. My ${template.title}`}
                  className="h-9 text-sm rounded-lg border-zinc-200 bg-zinc-50 placeholder:text-zinc-300 focus:bg-white transition-colors duration-150"
                />
              </div>

              {/* Save to */}
              <div className="space-y-2.5">
                <p className="text-[11px] text-zinc-400">Save to</p>

                <div className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-zinc-100 bg-zinc-50/50">
                  <div className="flex items-center gap-2">
                    {saveToOrg
                      ? <Building2 className="h-3.5 w-3.5 text-zinc-400" />
                      : <User className="h-3.5 w-3.5 text-zinc-400" />
                    }
                    <span className="text-sm text-zinc-600">
                      {saveToOrg ? "Organization" : "Personal"}
                    </span>
                  </div>
                  <Switch checked={saveToOrg} onCheckedChange={handleToggleOrg} />
                </div>

                {/* Org picker */}
                {saveToOrg && (
                  <div className="space-y-2">
                    {hasOrganizations ? (
                      <>
                        <Select value={selectedOrg} onValueChange={setSelectedOrg}>
                          <SelectTrigger className="h-9 rounded-lg border-zinc-200 bg-zinc-50 text-sm">
                            <SelectValue placeholder="Select organization..." />
                          </SelectTrigger>
                          <SelectContent>
                            {organizationOptions.map((org) => (
                              <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <button
                          className="text-xs text-zinc-400 flex items-center gap-1 hover:text-zinc-600 transition-colors duration-150"
                          onClick={() => setCreateOrgOpen(true)}
                        >
                          <Building2 className="h-3 w-3" /> New organization
                        </button>
                      </>
                    ) : (
                      <EmptyState
                        icon={Building2}
                        label="No organizations yet"
                        action="Create one"
                        onAction={() => setCreateOrgOpen(true)}
                      />
                    )}
                  </div>
                )}

                {/* Folder picker */}
                {!saveToOrg && (
                  <div className="space-y-2">
                    {hasFolders ? (
                      <>
                        <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                          <SelectTrigger className="h-9 rounded-lg border-zinc-200 bg-zinc-50 text-sm">
                            <SelectValue placeholder="Select folder..." />
                          </SelectTrigger>
                          <SelectContent>
                            {folders.map((f) => (
                              <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <button
                          className="text-xs text-zinc-400 flex items-center gap-1 hover:text-zinc-600 transition-colors duration-150"
                          onClick={() => setCreateFolderOpen(true)}
                        >
                          <FolderPlus className="h-3 w-3" /> New folder
                        </button>
                      </>
                    ) : (
                      <EmptyState
                        icon={FolderPlus}
                        label="No folders yet"
                        action="Create one"
                        onAction={() => setCreateFolderOpen(true)}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ── FOOTER ── */}
            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-zinc-100 bg-white">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                disabled={loading}
                className="h-8 px-3 rounded-lg text-xs text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 transition-colors duration-150"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleCreateSheet}
                disabled={!canCreate || loading}
                className="h-8 px-4 rounded-lg text-xs font-medium disabled:opacity-40 transition-opacity duration-150"
              >
                {loading ? (
                  <span className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Creating…
                  </span>
                ) : "Create sheet"}
              </Button>
            </div>

          </div>{/* end scroll wrapper */}
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

function EmptyState({
  icon: Icon,
  label,
  action,
  onAction,
}: {
  icon: React.ElementType;
  label: string;
  action: string;
  onAction: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-dashed border-zinc-200 bg-zinc-50/40">
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-zinc-300" />
        <span className="text-xs text-zinc-400">{label}</span>
      </div>
      <button
        onClick={onAction}
        className="text-xs text-zinc-500 hover:text-zinc-800 font-medium transition-colors duration-150"
      >
        {action}
      </button>
    </div>
  );
}

export default UseTemplateModal;