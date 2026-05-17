"use client";

import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  Users,
  Code2,
  X,
  Clock,
  BarChart3,
  Keyboard,
  Paintbrush,
} from "lucide-react";
import CommentsPanel from "./panels/Comments-panel";
import CollaboratorsPanel from "./panels/Collaborators-panel";
import DeveloperPanel from "./panels/Developers-panel";
import TimeTravelPanel from "./panels/TimeTravel-panel";
import ChartsPanel from "./panels/Charts-panel"; // ← new
import KeyboardShortcutsPanel from "./panels/Keyboard-shortcuts-panel";
import ConditionalFormattingPanel from "./panels/Conditional-formatting-panel";
import type { OrgMember } from "@/lib/querys/organization/get-sheet-members";
import type {
  TimeTravelState,
  TimeTravelActions,
} from "@/hooks/use-time-travel";
import type { SheetChart, ChartPanelTab } from "@/hooks/sheets/use-charts";
import type { ConditionalFormatRule, SheetRow, ColumnDef } from "@/types/index";

// ─────────────────────────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────────────────────────

export type RightPanelType =
  | "comments"
  | "collaborators"
  | "developer"
  | "timetravel"
  | "charts"
  | "shortcuts"
  | "conditional"
  | null;

interface RightPanelProps {
  rightPanel: Exclude<RightPanelType, null>;
  isDark: boolean;
  setRightPanel: (panel: RightPanelType) => void;

  // Comments
  comments: any;
  activeCommentCell: string | null;
  newCommentText: string;
  replyText: Record<string, string>;
  setNewCommentText: (text: string) => void;
  handleAddComment: (cellKey: string) => void;
  handleReply: (cellKey: string, commentId: string) => void;
  handleResolveComment: (cellKey: string, commentId: string) => void;
  setReplyText: React.Dispatch<React.SetStateAction<Record<string, string>>>;

  // Collaborators
  liveTracking: boolean;
  isOrganizationSheet: boolean;
  setLiveTracking: (value: boolean) => void;
  setShowShareDialog: (value: boolean) => void;

  // Developer
  sheetId: string;
  rows: SheetRow[];
  columns: ColumnDef[];
  totalComments: number;
  historyCount?: number;

  // Members
  members: OrgMember[];

  // Time Travel
  timeTravelState?: TimeTravelState;
  timeTravelActions?: TimeTravelActions;

  // Charts
  activeChart?: SheetChart | null;
  chartPanelTab?: ChartPanelTab;
  setChartPanelTab?: (t: ChartPanelTab) => void;
  onUpdateChart?: (patch: Partial<SheetChart>) => void;
  onRemoveChart?: () => void;

  selectedCell?: { row: number; col: string } | null;
  conditionalRules?: ConditionalFormatRule[];
  onSaveConditionalRule?: (rule: ConditionalFormatRule) => void;
  onDeleteConditionalRule?: (ruleId: string) => void;
}

// ─────────────────────────────────────────────────────────────
//  PANEL META
// ─────────────────────────────────────────────────────────────

const PANEL_META: Record<
  Exclude<RightPanelType, null>,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
  }
> = {
  comments: { label: "Comments", icon: MessageSquare, color: "text-amber-500" },
  collaborators: {
    label: "Collaborators",
    icon: Users,
    color: "text-emerald-500",
  },
  developer: { label: "Developer", icon: Code2, color: "text-sky-500" },
  timetravel: { label: "Time Travel", icon: Clock, color: "text-violet-500" },
  charts: { label: "Charts", icon: BarChart3, color: "text-sky-400" },
  shortcuts: { label: "Shortcuts", icon: Keyboard, color: "text-indigo-500" },
  conditional: {
    label: "Conditional Formatting",
    icon: Paintbrush,
    color: "text-emerald-500",
  },
};

// ─────────────────────────────────────────────────────────────
//  COMPONENT
// ─────────────────────────────────────────────────────────────

export default function RightPanel({
  rightPanel,
  isDark,
  setRightPanel,
  comments,
  activeCommentCell,
  newCommentText,
  replyText,
  setNewCommentText,
  handleAddComment,
  handleReply,
  handleResolveComment,
  setReplyText,
  liveTracking,
  isOrganizationSheet,
  setLiveTracking,
  setShowShareDialog,
  sheetId,
  rows,
  columns,
  totalComments,
  historyCount = 0,
  members,
  timeTravelState,
  timeTravelActions,
  activeChart,
  chartPanelTab = "data",
  setChartPanelTab,
  onUpdateChart,
  onRemoveChart,
  selectedCell,
  conditionalRules = [],
  onSaveConditionalRule,
  onDeleteConditionalRule,
}: RightPanelProps) {
  const meta = PANEL_META[rightPanel] ?? PANEL_META.developer;
  const Icon = meta.icon;
  const d = isDark;

  return (
    <div
      className={`w-80 border-l flex flex-col h-full overflow-hidden shrink-0 ${
        d ? "bg-gray-950 border-gray-800" : "bg-white border-gray-100"
      }`}
    >
      {/* ── Panel header ── */}
      <div
        className={`h-10 flex items-center justify-between px-4 border-b shrink-0 ${
          d ? "border-gray-800 bg-gray-950" : "border-gray-100 bg-white"
        }`}
      >
        <div className="flex items-center gap-2">
          <Icon className={`h-3.5 w-3.5 ${meta.color}`} />
          <span
            className={`text-[12px] font-semibold ${d ? "text-gray-200" : "text-gray-800"}`}
          >
            {rightPanel === "charts" && activeChart
              ? activeChart.title || "Chart Editor"
              : meta.label}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className={`h-6 w-6 rounded-md ${d ? "hover:bg-gray-800" : "hover:bg-gray-100"}`}
          onClick={() => setRightPanel(null)}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* ── Panel body ── */}
      <div className="flex-1 overflow-hidden min-h-0">
        {rightPanel === "comments" && (
          <CommentsPanel
            isDark={d}
            comments={comments}
            activeCommentCell={activeCommentCell}
            newCommentText={newCommentText}
            replyText={replyText}
            setNewCommentText={setNewCommentText}
            handleAddComment={handleAddComment}
            handleReply={handleReply}
            handleResolveComment={handleResolveComment}
            setReplyText={setReplyText}
          />
        )}

        {rightPanel === "collaborators" && (
          <CollaboratorsPanel
            isDark={d}
            liveTracking={liveTracking}
            isOrganizationSheet={isOrganizationSheet}
            setLiveTracking={setLiveTracking}
            setShowShareDialog={setShowShareDialog}
            members={members}
          />
        )}

        {rightPanel === "developer" && (
          <DeveloperPanel
            isDark={d}
            sheetId={sheetId}
            rows={rows}
            columns={columns}
            totalComments={totalComments}
            historyCount={historyCount}
          />
        )}

        {rightPanel === "timetravel" &&
          timeTravelState &&
          timeTravelActions && (
            <TimeTravelPanel
              state={timeTravelState}
              actions={timeTravelActions}
              isDark={isDark}
              orgMembers={members} // ← add this
            />
          )}

        {/* ── CHARTS PANEL ── fully wired ── */}
        {rightPanel === "charts" && (
          <ChartsPanel
            isDark={d}
            activeChart={activeChart ?? null}
            panelTab={chartPanelTab}
            setPanelTab={setChartPanelTab ?? (() => {})}
            rows={rows}
            columns={columns}
            onUpdateChart={onUpdateChart ?? (() => {})}
            onRemoveChart={onRemoveChart ?? (() => {})}
          />
        )}
        {rightPanel === "shortcuts" && <KeyboardShortcutsPanel isDark={d} />}
        {rightPanel === "conditional" && (
          <ConditionalFormattingPanel
            isDark={d}
            columns={columns}
            selectedCell={selectedCell ?? null}
            rules={conditionalRules}
            onSaveRule={onSaveConditionalRule ?? (() => {})}
            onDeleteRule={onDeleteConditionalRule ?? (() => {})}
          />
        )}
      </div>
    </div>
  );
}
