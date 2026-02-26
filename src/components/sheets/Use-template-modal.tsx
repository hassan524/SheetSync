import { useState } from "react";
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
import { ComponentType } from "react";

interface Template {
  id: string;
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  color: string;
  features: string[];
}

interface UseTemplateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: Template | null;
}

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
  {
    id: "marketing",
    name: "Marketing Dept",
    folders: [],
  },
];

const PERSONAL_FOLDERS = [
  { id: "personal-my-sheets", name: "My Sheets" },
  { id: "personal-archive", name: "Archive" },
];

const TEMPLATE_COPY: Record<string, { tagline: string; body: string }> = {
  "f628aed8-bca7-4f51-b687-6db9f932be34": {
    tagline: "A clean slate, your way.",
    body: "Start from scratch with a fully unlocked spreadsheet. No clutter, no pre-filled data — just rows, columns, and every formula you need to build something great.",
  },
  "2a197048-b791-490e-aaff-9b00785b2b27": {
    tagline: "Know where your money goes.",
    body: "Track income, expenses, and savings with a structured layout that does the math for you. Monthly breakdowns, smart categories, and savings goals — all in one place.",
  },
  "c9fb4014-cccf-4394-9c3f-5eb16c00cc47": {
    tagline: "Ship on time, every time.",
    body: "Plan milestones, assign tasks, and stay on top of every deadline. Gantt-style timelines and smart alerts keep your whole team aligned — from kickoff to delivery.",
  },
  "e73711d5-aab0-4281-bc8f-486ad6c6aaac": {
    tagline: "Squash bugs before they ship.",
    body: "Log issues, set priorities, and track test coverage across your product. Built for QA teams who need clarity fast — open, blocked, and resolved at a glance.",
  },
};

// Per-template accent colors for the header bubbles
const ACCENT: Record<
  string,
  { from: string; bubble1: string; bubble2: string; iconRing: string }
> = {
  "f628aed8-bca7-4f51-b687-6db9f932be34": {
    from: "from-slate-50 to-slate-100/60",
    bubble1: "#94a3b8",
    bubble2: "#cbd5e1",
    iconRing: "bg-slate-100 border-slate-200",
  },
  "2a197048-b791-490e-aaff-9b00785b2b27": {
    from: "from-emerald-50 to-green-50/60",
    bubble1: "#6ee7b7",
    bubble2: "#34d399",
    iconRing: "bg-emerald-50 border-emerald-100",
  },
  "c9fb4014-cccf-4394-9c3f-5eb16c00cc47": {
    from: "from-blue-50 to-sky-50/60",
    bubble1: "#93c5fd",
    bubble2: "#60a5fa",
    iconRing: "bg-blue-50 border-blue-100",
  },
  "e73711d5-aab0-4281-bc8f-486ad6c6aaac": {
    from: "from-violet-50 to-purple-50/60",
    bubble1: "#c4b5fd",
    bubble2: "#a78bfa",
    iconRing: "bg-violet-50 border-violet-100",
  },
};

const UseTemplateModal = ({
  open,
  onOpenChange,
  template,
}: UseTemplateModalProps) => {
  const [sheetName, setSheetName] = useState(template?.title || "");
  const [saveToOrg, setSaveToOrg] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState("");
  const [selectedFolder, setSelectedFolder] = useState("personal-my-sheets");

  const Icon = template?.icon;
  const copy = template ? TEMPLATE_COPY[template.id] : null;
  const accent = template
    ? (ACCENT[template.id] ?? ACCENT["2a197048-b791-490e-aaff-9b00785b2b27"])
    : ACCENT["2a197048-b791-490e-aaff-9b00785b2b27"];
  const currentOrg = ORGANIZATIONS.find((o) => o.id === selectedOrg);
  const activeFolders = saveToOrg
    ? currentOrg?.folders || []
    : PERSONAL_FOLDERS;

  const handleToggleOrg = (checked: boolean) => {
    setSaveToOrg(checked);
    setSelectedOrg("");
    setSelectedFolder(checked ? "" : "personal-my-sheets");
  };

  const handleOrgChange = (value: string) => {
    setSelectedOrg(value);
    setSelectedFolder("");
  };

  const handleCreate = () => {
    console.log({
      sheetName,
      destination: saveToOrg ? "organization" : "personal",
      organization: saveToOrg ? selectedOrg : null,
      folder: selectedFolder,
      templateId: template?.id,
    });
    onOpenChange(false);
  };

  const canCreate =
    !!sheetName.trim() && (!saveToOrg || (!!selectedOrg && !!selectedFolder));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px] p-0 gap-0 overflow-hidden rounded-2xl border border-zinc-200/80 shadow-xl shadow-black/[0.08] [&>button]:hidden">
        {/* ── Header ── */}
        <div
          className={`relative h-[152px] overflow-hidden flex-shrink-0 bg-gradient-to-br ${accent.from}`}
        >
          {/* Mesh dots pattern */}
          <svg
            className="absolute inset-0 w-full h-full opacity-[0.07]"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern
                id="dots"
                x="0"
                y="0"
                width="16"
                height="16"
                patternUnits="userSpaceOnUse"
              >
                <circle cx="2" cy="2" r="1.2" fill="#000" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dots)" />
          </svg>

          {/* Bubble 1 — large soft orb */}
          <div
            className="absolute rounded-full blur-[64px]"
            style={{
              width: 200,
              height: 200,
              background: accent.bubble1,
              opacity: 0.45,
              top: -70,
              left: -30,
            }}
          />
          {/* Bubble 2 — smaller, right */}
          <div
            className="absolute rounded-full blur-[48px]"
            style={{
              width: 140,
              height: 140,
              background: accent.bubble2,
              opacity: 0.28,
              top: -20,
              right: 0,
            }}
          />
          {/* Bubble 3 — tiny white shimmer */}
          <div
            className="absolute rounded-full blur-[28px]"
            style={{
              width: 70,
              height: 70,
              background: "#ffffff",
              opacity: 0.6,
              bottom: 12,
              right: 80,
            }}
          />

          {/* Close */}
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-3.5 right-3.5 h-7 w-7 rounded-full bg-black/5 hover:bg-black/10 border border-black/[0.06] flex items-center justify-center transition-colors z-10"
          >
            <X className="h-3.5 w-3.5 text-zinc-500" />
          </button>

          {/* Content */}
          <div className="absolute inset-0 flex flex-col justify-end px-6 pb-5 z-10">
            <div className="flex items-center gap-2.5 mb-2">
              {Icon && (
                <div
                  className={`h-7 w-7 rounded-lg border ${accent.iconRing} flex items-center justify-center flex-shrink-0 shadow-sm`}
                >
                  <Icon className="h-3.5 w-3.5 text-zinc-600" />
                </div>
              )}
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
                {template?.title}
              </span>
            </div>
            <p className="text-[19px] font-bold leading-tight tracking-tight text-zinc-800">
              {copy?.tagline}
            </p>
          </div>
        </div>

        {/* ── Body ── */}
        <div
          className="px-6 py-5 space-y-5 overflow-y-auto bg-white"
          style={{ maxHeight: "calc(580px - 152px - 64px)" }}
        >
          {/* Description */}
          <p className="text-[13.5px] text-zinc-500 leading-relaxed">
            {copy?.body}
          </p>

          {/* Features */}
          {template?.features && template.features.length > 0 && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              {template.features.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-[13px] text-zinc-600"
                >
                  <span className="h-4 w-4 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
                    <Check className="h-2.5 w-2.5 text-emerald-500" />
                  </span>
                  {f}
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-zinc-100" />

          {/* Sheet name */}
          <div className="space-y-1.5">
            <Label
              htmlFor="sheet-name"
              className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-zinc-400"
            >
              Sheet name
            </Label>
            <Input
              id="sheet-name"
              placeholder={`My ${template?.title}`}
              value={sheetName}
              onChange={(e) => setSheetName(e.target.value)}
              className="h-9 text-sm border-zinc-200 focus-visible:ring-emerald-500/30"
            />
          </div>

          {/* Save to */}
          <div className="space-y-3">
            <Label className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-zinc-400">
              Save to
            </Label>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {saveToOrg ? (
                  <Building2 className="h-3.5 w-3.5 text-zinc-400" />
                ) : (
                  <User className="h-3.5 w-3.5 text-zinc-400" />
                )}
                <span className="text-sm font-medium text-zinc-700">
                  {saveToOrg ? "Organization" : "Personal"}
                </span>
                <span className="text-xs text-zinc-400">
                  {saveToOrg ? "— shared with team" : "— only you"}
                </span>
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
                    <SelectItem key={org.id} value={org.id} className="text-sm">
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {(!saveToOrg || selectedOrg) && (
              <div className="space-y-2">
                {activeFolders.length > 0 ? (
                  <Select
                    value={selectedFolder}
                    onValueChange={setSelectedFolder}
                  >
                    <SelectTrigger className="h-9 text-sm border-zinc-200">
                      <SelectValue placeholder="Select folder…" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeFolders.map((f) => (
                        <SelectItem key={f.id} value={f.id} className="text-sm">
                          <span className="flex items-center gap-2">
                            <Folder className="h-3.5 w-3.5 text-zinc-400" />
                            {f.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-xs text-zinc-400">
                    No folders in this organization.
                  </p>
                )}
                <button
                  type="button"
                  className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
                >
                  <FolderPlus className="h-3.5 w-3.5" />
                  New folder
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-zinc-100 bg-white flex-shrink-0">
          <p className="text-xs text-zinc-400 truncate">
            {saveToOrg && currentOrg
              ? `Saving to ${currentOrg.name}`
              : "Saving to Personal Sheets"}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 text-sm px-3 border-zinc-200 text-zinc-600 hover:bg-zinc-50"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleCreate}
              disabled={!canCreate}
              className="h-8 text-sm px-4 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
            >
              Create Sheet
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UseTemplateModal;
