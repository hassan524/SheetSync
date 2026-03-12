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
import { Check, Building2, User, FolderPlus, Folder, X } from "lucide-react";
import { SHEET_TEMPLATES } from "@/constants/Sheet-templates";
import { FolderItem } from "@/data/sheets";

interface UseTemplateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId: string; 
  folders: FolderItem[]; 
}

// dummy organization folders
const ORGANIZATIONS = [
  {
    id: "acme",
    name: "Acme Corporation",
    folders: [
      { id: "acme-general", name: "General" },
      { id: "acme-finance", name: "Finance" },
      { id: "acme-hr", name: "Human Resources" },
    ],
  },
  {
    id: "design",
    name: "Design Team",
    folders: [
      { id: "design-assets", name: "Assets" },
      { id: "design-projects", name: "Projects" },
    ],
  },
];

const UseTemplateModal = ({
  open,
  onOpenChange,
  templateId,
  folders,
}: UseTemplateModalProps) => {
  const [sheetName, setSheetName] = useState("");
  const [saveToOrg, setSaveToOrg] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState("");
  const [selectedFolder, setSelectedFolder] = useState("");

  const template = SHEET_TEMPLATES.find((t) => t.id === templateId);
  const Icon = template?.icon;
  const copy = template?.copy;
  const accent = template?.accent;

  useEffect(() => {
    if (template) setSheetName(template.title); // set default sheet name
  }, [template]);

  const currentOrg = ORGANIZATIONS.find((o) => o.id === selectedOrg);
  const activeFolders = saveToOrg ? currentOrg?.folders || [] : folders; // folders to display

  const handleToggleOrg = (checked: boolean) => {
    setSaveToOrg(checked);
    setSelectedOrg("");
    setSelectedFolder("");
  };

  const handleOrgChange = (value: string) => {
    setSelectedOrg(value);
    setSelectedFolder("");
  };

  const handleCreateSheet = () => {
    if (!template) return;
    const sheet = {
      id: crypto.randomUUID(), // unique id
      name: sheetName.trim(),
      templateId: template.id,
      organizationId: saveToOrg ? selectedOrg : null, 
      folderId: selectedFolder,
      createdAt: new Date().toISOString(),
    };
    console.log("Created Sheet:", sheet);
    onOpenChange(false);
  };

  const canCreate =
    !!sheetName.trim() && (!saveToOrg || (!!selectedOrg && !!selectedFolder));

  if (!template) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px] p-0 overflow-hidden rounded-2xl border border-zinc-200/80 shadow-xl shadow-black/[0.08] [&>button]:hidden">
        
        {/* Header */}
        <div className={`relative h-[152px] overflow-hidden flex-shrink-0 bg-gradient-to-br ${accent?.from}`}>
          <svg className="absolute inset-0 w-full h-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="dots" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.2" fill="#000" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dots)" />
          </svg>
          <div className="absolute rounded-full blur-[64px]" style={{ width: 200, height: 200, background: accent?.bubble1, opacity: 0.45, top: -70, left: -30 }} />
          <div className="absolute rounded-full blur-[48px]" style={{ width: 140, height: 140, background: accent?.bubble2, opacity: 0.28, top: -20, right: 0 }} />
          <div className="absolute rounded-full blur-[28px]" style={{ width: 70, height: 70, background: "#ffffff", opacity: 0.6, bottom: 12, right: 80 }} />
          <button onClick={() => onOpenChange(false)} className="absolute top-3.5 right-3.5 h-7 w-7 rounded-full bg-black/5 hover:bg-black/10 border border-black/[0.06] flex items-center justify-center z-10">
            <X className="h-3.5 w-3.5 text-zinc-500" />
          </button>
          <div className="absolute inset-0 flex flex-col justify-end px-6 pb-5 z-10">
            <div className="flex items-center gap-2.5 mb-2">
              {Icon && (
                <div className={`h-7 w-7 rounded-lg border ${accent?.iconRing} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                  <Icon className="h-3.5 w-3.5 text-zinc-600" />
                </div>
              )}
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-zinc-400">{template.title}</span>
            </div>
            <p className="text-[19px] font-bold leading-tight tracking-tight text-zinc-800">{copy?.tagline}</p>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5 overflow-y-auto bg-white" style={{ maxHeight: "calc(580px - 152px - 64px)" }}>
          <p className="text-[13.5px] text-zinc-500 leading-relaxed">{copy?.body}</p>

          {template.features.length > 0 && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              {template.features.map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-[13px] text-zinc-600">
                  <span className="h-4 w-4 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
                    <Check className="h-2.5 w-2.5 text-emerald-500" />
                  </span>
                  {f}
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-zinc-100" />

          {/* Sheet Name Input */}
          <div className="space-y-1.5">
            <Label htmlFor="sheet-name" className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-zinc-400">Sheet name</Label>
            <Input id="sheet-name" placeholder={`My ${template.title}`} value={sheetName} onChange={(e) => setSheetName(e.target.value)} className="h-9 text-sm border-zinc-200 focus-visible:ring-emerald-500/30" />
          </div>

          {/* Save To */}
          <div className="space-y-3">
            <Label className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-zinc-400">Save to</Label>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {saveToOrg ? <Building2 className="h-3.5 w-3.5 text-zinc-400" /> : <User className="h-3.5 w-3.5 text-zinc-400" />}
                <span className="text-sm font-medium text-zinc-700">{saveToOrg ? "Organization" : "Personal"}</span>
                <span className="text-xs text-zinc-400">{saveToOrg ? "— shared with team" : "— only you"}</span>
              </div>
              <Switch checked={saveToOrg} onCheckedChange={handleToggleOrg} />
            </div>

            {saveToOrg && (
              <Select value={selectedOrg} onValueChange={handleOrgChange}>
                <SelectTrigger className="h-9 text-sm border-zinc-200">
                  <SelectValue placeholder="Select organization…" />
                </SelectTrigger>
                <SelectContent>
                  {ORGANIZATIONS.map((org) => (
                    <SelectItem key={org.id} value={org.id} className="text-sm">{org.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {(!saveToOrg || selectedOrg) && (
              <div className="space-y-2">
                {activeFolders.length > 0 ? (
                  <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                    <SelectTrigger className="h-9 text-sm border-zinc-200">
                      <SelectValue placeholder="Select folder…" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeFolders.map((f) => (
                        <SelectItem key={f.id} value={f.id} className="text-sm">
                          <span className="flex items-center gap-2"><Folder className="h-3.5 w-3.5 text-zinc-400" />{f.name}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-xs text-zinc-400">No folders available.</p>
                )}
                <button type="button" className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-600 transition-colors">
                  <FolderPlus className="h-3.5 w-3.5" />New folder
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-zinc-100 bg-white flex-shrink-0">
          <p className="text-xs text-zinc-400 truncate">
            {saveToOrg && currentOrg ? `Saving to ${currentOrg.name}` : "Saving to Personal Sheets"}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="h-8 text-sm px-3 border-zinc-200 text-zinc-600 hover:bg-zinc-50">Cancel</Button>
            <Button size="sm" onClick={handleCreateSheet} disabled={!canCreate} className="h-8 text-sm px-4 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">Create Sheet</Button>
          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
};

export default UseTemplateModal;