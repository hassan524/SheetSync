import { Button } from "@/components/ui/button";
import { MessageSquare, History, Users, Code2, X, Clock } from "lucide-react";
import CommentsPanel from "./panels/Comments-panel";

import CollaboratorsPanel from "./panels/Collaborators-panel";
import DeveloperPanel from "./panels/Developers-panel";
import TimeTravelPanel from "./panels/TimeTravel-panel";
import type { HistoryEntry } from "@/lib/querys/sheet/firebase-realtime";
import type { OrgMember } from "@/lib/querys/organization/get-sheet-members";
import type {
  TimeTravelState,
  TimeTravelActions,
} from "@/hooks/use-time-travel";

type RightPanelType = "comments" | "collaborators" | "developer" | "timetravel";

interface RightPanelProps {
  rightPanel: RightPanelType;
  isDark: boolean;
  setRightPanel: (panel: RightPanelType | null) => void;
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
  rows: any[];
  columns: any[];
  totalComments: number;
  // Members
  members: OrgMember[];
  // Time Travel
  timeTravelState?: TimeTravelState;
  timeTravelActions?: TimeTravelActions;
}

const PANEL_TITLES = {
  comments: { label: "Comments", icon: MessageSquare, color: "text-amber-500" },

  collaborators: {
    label: "Collaborators",
    icon: Users,
    color: "text-emerald-500",
  },
  developer: { label: "Developer", icon: Code2, color: "text-sky-500" },
  timetravel: { label: "Time Travel", icon: Clock, color: "text-violet-500" },
};

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
  members,
  timeTravelState,
  timeTravelActions,
}: RightPanelProps) {
  const meta = PANEL_TITLES[rightPanel] ?? PANEL_TITLES.timetravel;
  const Icon = meta.icon;

  return (
    <div
      className={`w-80 border-l flex flex-col h-full overflow-hidden shrink-0 ${isDark ? "bg-gray-950 border-gray-800" : "bg-white border-gray-100"}`}
    >
      {/* Panel header — fixed, never scrolls */}
      <div
        className={`h-10 flex items-center justify-between px-4 border-b shrink-0 ${isDark ? "border-gray-800 bg-gray-950" : "border-gray-100 bg-white"}`}
      >
        <div className="flex items-center gap-2">
          <Icon className={`h-3.5 w-3.5 ${meta.color}`} />
          <span
            className={`text-[12px] font-semibold ${isDark ? "text-gray-200" : "text-gray-800"}`}
          >
            {meta.label}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className={`h-6 w-6 rounded-md ${isDark ? "hover:bg-gray-800" : "hover:bg-gray-100"}`}
          onClick={() => setRightPanel(null)}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Panel body — flex-1 so it fills remaining height, overflow-hidden so child handles scroll */}
      <div className="flex-1 overflow-hidden min-h-0">
        {rightPanel === "comments" && (
          <CommentsPanel
            isDark={isDark}
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
            isDark={isDark}
            liveTracking={liveTracking}
            isOrganizationSheet={isOrganizationSheet}
            setLiveTracking={setLiveTracking}
            setShowShareDialog={setShowShareDialog}
            members={members}
          />
        )}
        {rightPanel === "developer" && (
          <DeveloperPanel
            isDark={isDark}
            sheetId={sheetId}
            rows={rows}
            columns={columns}
            totalComments={totalComments}
          />
        )}
        {rightPanel === "timetravel" &&
          timeTravelState &&
          timeTravelActions && (
            <TimeTravelPanel
              state={timeTravelState}
              actions={timeTravelActions}
              isDark={isDark}
              onClose={() => setRightPanel(null)}
            />
          )}
      </div>
    </div>
  );
}
