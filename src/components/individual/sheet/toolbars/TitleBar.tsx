"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronRight,
  FileSpreadsheet,
  Star,
  Loader2,
  Globe,
  Upload,
  GitBranch,
  ChevronDown,
  Download,
  Share2,
  Bell,
  Layers,
  Printer,
  Code2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SaveStatus } from "@/types/index";
import type { OrgMember } from "@/lib/querys/organization/get-sheet-members";
import { IconBtn, SheetAvatar, ddStyle, ddItemStyle, getMemberColor } from "@/components/individual/sheet/sheet-ui-helpers";
import { ExportFormat } from "@/lib/querys/export";

interface TitleBarProps {
  title: string;
  starred: boolean;
  saveStatus: SaveStatus;
  isOrgSheet: boolean;
  isDark: boolean;
  importSource: "csv" | "excel" | null;
  forks: { id: string; title: string; forked_at: string | null }[];
  orgMembers: OrgMember[];
  currentUser: { id: string; name: string; email: string; avatar_url: string | null } | null;
  isImportingSheet: boolean;
  totalComments: number;
  onTitleChange: (t: string) => void;
  onStarredToggle: () => void;
  onImportClick: () => void;
  onExport: (format: ExportFormat) => void;
  onShareClick: () => void;
  onNotificationsClick: () => void;
}

const Avatar = SheetAvatar;

export function TitleBar({
  title,
  starred,
  saveStatus,
  isOrgSheet,
  isDark,
  importSource,
  forks,
  orgMembers,
  currentUser,
  isImportingSheet,
  totalComments,
  onTitleChange,
  onStarredToggle,
  onImportClick,
  onExport,
  onShareClick,
  onNotificationsClick,
}: TitleBarProps) {
  const router = useRouter();
  const selStyle = ddStyle(isDark);

  return (
    <header
      className="sheet-titlebar flex items-center justify-between px-2 shrink-0 border-b"
      style={{ minHeight: "44px" }}
    >
      {/* Left: back + title */}
      <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => router.back()}
              className="sheet-back-btn h-7 w-7 rounded-md flex items-center justify-center transition-all shrink-0"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-[11px]">
            Back to dashboard
          </TooltipContent>
        </Tooltip>
        <ChevronRight className="h-3 w-3 text-gray-300 shrink-0 hidden sm:block" />
        <div className="sheet-app-icon h-6 w-6 rounded-md flex items-center justify-center shrink-0">
          <FileSpreadsheet className="h-3.5 w-3.5 text-primary-foreground" />
        </div>
        <div className="flex items-center gap-1 min-w-0 overflow-hidden">
          <Input
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            className="sheet-title-input h-7 border-0 bg-transparent font-semibold not-italic text-[13px] tracking-tight focus-visible:ring-1 px-1.5 rounded-md w-24 sm:w-44 md:w-56 min-w-0"
          />
          <button
            onClick={onStarredToggle}
            className="shrink-0 p-0.5 rounded transition-transform hover:scale-110"
          >
            <Star
              className={`h-3.5 w-3.5 transition-colors ${starred ? "fill-amber-400 text-amber-400" : "text-gray-300 hover:text-amber-400"}`}
            />
          </button>
          <div className="sheet-save-status hidden">
            {saveStatus === "saving" ? (
              <>
                <Loader2 className="h-2.5 w-2.5 animate-spin text-amber-500" />
                <span className="text-amber-600">Saving…</span>
              </>
            ) : (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span className="text-emerald-600">Saved</span>
              </>
            )}
          </div>
          {isOrgSheet && (
            <div className="sheet-org-badge hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold shrink-0">
              <Globe className="h-2.5 w-2.5" />
              ORG
            </div>
          )}
          {importSource && (
            <div className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-600 text-[10px] font-semibold shrink-0">
              <Upload className="h-2.5 w-2.5" />
              IMPORTED
            </div>
          )}
          {forks.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 text-[10px] font-semibold shrink-0 cursor-pointer transition-colors select-none">
                  <GitBranch className="h-2.5 w-2.5" />
                  {forks.length} Fork{forks.length !== 1 ? "s" : ""}
                  <ChevronDown className="h-2.5 w-2.5 opacity-50" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56" style={ddStyle(isDark)}>
                <DropdownMenuLabel
                  className="text-[10px] uppercase tracking-wider"
                  style={{ color: isDark ? "#4a5568" : "#9ca3af" }}
                >
                  Forked sheets
                </DropdownMenuLabel>
                <DropdownMenuSeparator style={{ background: isDark ? "#1e2330" : "#e8eaed" }} />
                {forks.map((f) => (
                  <DropdownMenuItem
                    key={f.id}
                    onClick={() => router.push(`/sheet/${f.id}`)}
                    className="text-xs flex flex-col items-start gap-0.5"
                    style={ddItemStyle(isDark)}
                  >
                    <div className="flex items-center gap-1.5 w-full">
                      <FileSpreadsheet className="h-3 w-3 opacity-50 shrink-0" />
                      <span className="truncate font-medium">{f.title}</span>
                    </div>
                    {f.forked_at && (
                      <span
                        className="text-[10px] pl-4"
                        style={{ color: isDark ? "#4a5568" : "#9ca3af" }}
                      >
                        {new Date(f.forked_at).toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-0.5 sm:gap-1 shrink-0 ml-1 min-w-0 overflow-visible [&_[data-slot=dropdown-menu-trigger]]:shrink-0 hide-scrollbar">
        {isOrgSheet && (
          <>
            <div className="hidden sm:flex -space-x-2 shrink-0">
              {orgMembers.slice(0, 3).map((c) => (
                <Tooltip key={c.id}>
                  <TooltipTrigger>
                    <Avatar member={c} showOnline />
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs sheet-tooltip">
                    <p className="font-semibold">{c.name}</p>
                    <p className="text-gray-400 text-[10px]">
                      {c.role} · {c.email}
                    </p>
                  </TooltipContent>
                </Tooltip>
              ))}
              {orgMembers.length > 3 && (
                <div
                  className="sheet-avatar h-6 w-6 rounded-full flex items-center justify-center text-[9px] font-bold cursor-pointer border-2 bg-gray-200 text-gray-600 shrink-0"
                  style={{ borderColor: "var(--sheet-titlebar-bg)" }}
                >
                  +{orgMembers.length - 3}
                </div>
              )}
            </div>
            <div className="sheet-vdiv h-5 w-px mx-0.5 hidden sm:block shrink-0" />
            <IconBtn icon={Bell} tooltip="Notifications" badge={totalComments} onClick={onNotificationsClick} />
          </>
        )}
        {!isOrgSheet && currentUser && (
          <Tooltip>
            <TooltipTrigger>
              <Avatar member={currentUser} />
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs sheet-tooltip">
              <p className="font-semibold">{currentUser.name}</p>
              <p className="text-gray-400 text-[10px]">Personal sheet</p>
            </TooltipContent>
          </Tooltip>
        )}

        <button
          className="sheet-btn-secondary flex items-center gap-1 sm:gap-1.5 h-7 px-2 sm:px-2.5 rounded-md text-[11.5px] font-medium transition-all shrink-0 disabled:opacity-60"
          onClick={onImportClick}
          disabled={isImportingSheet}
        >
          {isImportingSheet ? (
            <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
          ) : (
            <Upload className="h-3.5 w-3.5 shrink-0" />
          )}
          <span className="hidden sm:inline">{isImportingSheet ? "Importing" : "Import"}</span>
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="sheet-btn-secondary flex items-center gap-1 sm:gap-1.5 h-7 px-2 sm:px-2.5 rounded-md text-[11.5px] font-medium transition-all shrink-0">
              <Download className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden sm:inline">Export</span>
              <ChevronDown className="h-3 w-3 opacity-50 hidden sm:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44" style={selStyle}>
            <DropdownMenuLabel
              className="text-[10px] uppercase tracking-wider"
              style={{ color: isDark ? "#4a5568" : "#9ca3af" }}
            >
              Export as
            </DropdownMenuLabel>
            <DropdownMenuSeparator style={{ background: isDark ? "#1e2330" : "#e8eaed" }} />
            {(
              [
                ["csv", "CSV (.csv)", FileSpreadsheet],
                ["xlsx", "Excel (.xlsx)", Layers],
                ["pdf", "PDF (.pdf)", Printer],
                ["json", "JSON (.json)", Code2],
              ] as const
            ).map(([fmt, label, Icon]) => (
              <DropdownMenuItem
                key={fmt}
                onClick={() => onExport(fmt)}
                className="text-xs"
                style={ddItemStyle(isDark)}
              >
                <Icon className="h-3 w-3" />
                {label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {isOrgSheet && (
          <button
            className="sheet-btn-primary flex items-center gap-1 sm:gap-1.5 h-7 px-2 sm:px-3 rounded-md text-[11.5px] font-semibold transition-all shrink-0"
            onClick={onShareClick}
          >
            <Share2 className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden sm:inline">Share</span>
          </button>
        )}
      </div>
    </header>
  );
}
