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
  Columns3,
  ListChecks,
  PanelRight,
  Sigma,
  Zap,
  Sparkles,
} from "lucide-react";
import CommentsPanel from "./panels/Comments-panel";
import CollaboratorsPanel from "./panels/Collaborators-panel";
import DeveloperPanel from "./panels/Developers-panel";
import TimeTravelPanel from "./panels/TimeTravel-panel";
import ChartsPanel from "./panels/Charts-panel"; // ← new
// import FormulaPanel from "./panels/Formula-panel";
import AutomationPanel from "./panels/Automation-panel";
import AiAssistantPanel from "./panels/Ai-assistant-panel";
import KeyboardShortcutsPanel from "./panels/Keyboard-shortcuts-panel";
import ConditionalFormattingPanel from "./panels/Conditional-formatting-panel";
import ColumnsPanel from "./panels/Columns-panel";
import SelectOptionsPanel from "./panels/Select-options-panel";
import RowDetailsPanel from "./panels/Row-details-panel";
import DataValidationPanel from "./panels/Data-validation-panel";
import type { OrgMember } from "@/lib/querys/organization/get-sheet-members";
import type {
  TimeTravelState,
  TimeTravelActions,
} from "@/hooks/use-time-travel";
import type { SheetChart, ChartPanelTab } from "@/hooks/sheets/use-charts";
import type { ConditionalFormatRule, SheetRow, ColumnDef, SelectOption } from "@/types/index";

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
  | "columns"
  | "select-options"
  | "row-details"
  | "validation"
  | "formulas"
  | "automation"
  | "aiassistant"
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
  allColumns?: ColumnDef[];

  // Time Travel
  timeTravelState?: TimeTravelState;
  timeTravelActions?: TimeTravelActions;

  // Charts
  activeChart?: SheetChart | null;
  chartPanelTab?: ChartPanelTab;
  setChartPanelTab?: (t: ChartPanelTab) => void;
  onUpdateChart?: (patch: Partial<SheetChart>) => void;
  onRemoveChart?: () => void;

  selectedCell: { row: number; col: string } | null;
  selectionRange?: { start: { row: number; colIndex: number }; end: { row: number; colIndex: number } } | null;
  conditionalRules?: ConditionalFormatRule[];
  onSaveConditionalRule?: (rule: ConditionalFormatRule) => void;
  onDeleteConditionalRule?: (ruleId: string) => void;
  onApplyColumns?: (columns: ColumnDef[]) => void;
  focusedColumnKey?: string | null;
  onApplySelectOptions?: (columnKey: string, options: SelectOption[]) => void;
  selectedRowIndex?: number | null;
  history?: any[];
  onApplyValidation?: (columnKey: string, rules: any) => void;
  onInsertFormula?: (formula: string) => void;
  onUpdateRow?: (rowId: string, updates: Record<string, any>) => void;
  onRunAutomation?: () => void;
  onRangeSelect?: (colKey: string, startRow: number, endRow: number) => void;
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
  columns: {
    label: "Columns",
    icon: Columns3,
    color: "text-blue-500",
  },
  "select-options": {
    label: "Select Options",
    icon: ListChecks,
    color: "text-blue-500",
  },
  "row-details": {
    label: "Row Details",
    icon: PanelRight,
    color: "text-slate-500",
  },
  validation: {
    label: "Validation",
    icon: ListChecks,
    color: "text-emerald-500",
  },
  formulas: { label: "Formula Library", icon: Sigma, color: "text-sky-500" },
  automation: { label: "Automation Rules", icon: Zap, color: "text-amber-500" },
  aiassistant: { label: "AI Assistant", icon: Sparkles, color: "text-fuchsia-500" },
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
  onApplyColumns,
  focusedColumnKey,
  onApplySelectOptions,
  selectedRowIndex,
  history = [],
  onApplyValidation,
  onUpdateRow,
  allColumns = [],
  onRangeSelect,
  onRunAutomation
}: RightPanelProps) {
  const meta = PANEL_META[rightPanel] ?? PANEL_META.developer;
  const Icon = meta.icon;
  const d = isDark;
  const focusedColumn = focusedColumnKey
    ? columns.find((column) => column.key === focusedColumnKey) ?? null
    : null;
  const selectedRow =
    selectedRowIndex !== null && selectedRowIndex !== undefined
      ? rows[selectedRowIndex] ?? null
      : null;

  return (
    <div
      className={`w-80 border-l flex flex-col h-full overflow-hidden shrink-0 ${d ? "bg-gray-950 border-gray-800" : "bg-white border-gray-100"
        }`}
    >
      {/* ── Panel header ── */}
      <div
        className={`h-10 flex items-center justify-between px-4 border-b shrink-0 ${d ? "border-gray-800 bg-gray-950" : "border-gray-100 bg-white"
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
            rows={rows}
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
            setPanelTab={setChartPanelTab ?? (() => { })}
            rows={rows}
            columns={columns}
            onUpdateChart={onUpdateChart ?? (() => { })}
            onRemoveChart={onRemoveChart ?? (() => { })}
          />
        )}
        {/* {rightPanel === "formulas" && (
          <FormulaPanel
            isDark={d}
            selectedCell={selectedCell}
            columns={columns}
            onInsert={(formula) => {
              onInsertFormula?.(formula);
            }}
          />
        )} */}
        {rightPanel === "automation" && <AutomationPanel isDark={d} selectedCell={selectedCell} onRun={onRunAutomation} />}
        {rightPanel === "aiassistant" && <AiAssistantPanel isDark={d} />}
        {rightPanel === "shortcuts" && <KeyboardShortcutsPanel isDark={d} />}
        {rightPanel === "conditional" && (
          <ConditionalFormattingPanel
            isDark={d}
            columns={columns}
            selectedCell={selectedCell ?? null}
            rules={conditionalRules}
            onSaveRule={onSaveConditionalRule ?? (() => { })}
            onDeleteRule={onDeleteConditionalRule ?? (() => { })}
          />
        )}
        {rightPanel === "columns" && (
          <ColumnsPanel
            isDark={d}
            columns={columns}
            onApply={onApplyColumns ?? (() => { })}
            focusedColumnKey={focusedColumnKey}
          />
        )}
        {rightPanel === "select-options" && (
          <SelectOptionsPanel
            isDark={d}
            column={focusedColumn}
            onInsert={(options) => {
              if (!focusedColumn?.key) return;
              onApplySelectOptions?.(focusedColumn.key, options);
            }}
          />
        )}
        {rightPanel === "row-details" && (
          <RowDetailsPanel
            isDark={d}
            row={selectedRow}
            rowIndex={selectedRowIndex ?? null}
            columns={columns}
            comments={selectedRow ? comments[`row:${selectedRow.id}`] ?? [] : []}
            history={history as any}
            onUpdateRow={onUpdateRow}
            isOrganizationSheet={isOrganizationSheet}
          />
        )}
        {rightPanel === "validation" && (
          <DataValidationPanel
            isDark={d}
            column={focusedColumn}
            columns={allColumns}           // ← NEW  (letter conversion)
            totalRows={rows.length}        // ← NEW  (range default)
            onRangeSelect={onRangeSelect}  // ← NEW  (cell highlight)
            onSave={(rules) => {
              if (focusedColumn?.key) onApplyValidation?.(focusedColumn.key, rules);
            }}
          />
        )}
      </div>
    </div>
  );
}

