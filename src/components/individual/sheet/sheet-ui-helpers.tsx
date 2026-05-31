"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Image from "next/image";

// ── Dropdown style helpers ──────────────────────────────────────────────────
export const ddStyle = (dark: boolean) => ({
  background: dark ? "#131620" : "#ffffff",
  border: `1px solid ${dark ? "#1e2330" : "#e8eaed"}`,
  color: dark ? "#e2e8f0" : "#1a1d23",
});

export const ddItemStyle = (dark: boolean) => ({
  color: dark ? "#e2e8f0" : "#1a1d23",
});

// ── Member helpers ──────────────────────────────────────────────────────────
export const MEMBER_COLORS = [
  "#0d7c5f",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#6366f1",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#8b5cf6",
  "#06b6d4",
];

export const getMemberColor = (id: string) =>
  MEMBER_COLORS[
    Math.abs([...id].reduce((h, c) => c.charCodeAt(0) + ((h << 5) - h), 0)) %
      MEMBER_COLORS.length
  ];

export const getMemberInitials = (name: string) => {
  const p = name.trim().split(" ");
  return p.length === 1
    ? p[0][0].toUpperCase()
    : (p[0][0] + p[p.length - 1][0]).toUpperCase();
};

// ── CommentDot ──────────────────────────────────────────────────────────────
export function CommentDot({ count }: { count: number }) {
  return (
    <div
      className="sheet-comment-dot absolute top-0 right-0 z-10"
      style={{
        width: 0,
        height: 0,
        borderLeft: "8px solid transparent",
        borderTop: "8px solid #f59e0b",
      }}
    >
      {count > 1 && (
        <span
          className="absolute -top-4 -right-0.5 text-[7px] text-white font-bold leading-none"
          style={{ textShadow: "0 1px 2px rgba(0,0,0,.4)" }}
        >
          {count}
        </span>
      )}
    </div>
  );
}

// ── CollabCursor ─────────────────────────────────────────────────────────────
export function CollabCursor({ name, color }: { name: string; color: string }) {
  return (
    <div className="sheet-collab-cursor absolute -top-5 left-0 z-50 pointer-events-none flex items-center gap-1 opacity-0 group-hover/cell:opacity-100 transition-opacity">
      <div
        className="w-0.5 h-5 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span
        className="text-[10px] font-semibold text-white px-1.5 py-0.5 rounded whitespace-nowrap"
        style={{ backgroundColor: color, boxShadow: `0 1px 4px ${color}55` }}
      >
        {name.split(" ")[0]}
      </span>
    </div>
  );
}

// ── IconBtn ──────────────────────────────────────────────────────────────────
export function IconBtn({
  icon: Icon,
  tooltip,
  onClick,
  active,
  disabled,
  shortcut,
  danger = false,
  badge,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tooltip: string;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  shortcut?: string;
  danger?: boolean;
  badge?: number;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          disabled={disabled}
          className={`sheet-icon-btn relative flex items-center justify-center h-7 w-7 rounded-md transition-all duration-100 flex-shrink-0 ${active ? "sheet-icon-btn--active" : ""} ${danger ? "sheet-icon-btn--danger" : ""} ${disabled ? "opacity-35 cursor-not-allowed" : "cursor-pointer"}`}
        >
          <Icon className="h-3.5 w-3.5" />
          {badge != null && badge > 0 && (
            <span
              className="sheet-badge absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full text-[8px] font-bold flex items-center justify-center text-white"
              style={{ backgroundColor: danger ? "#ef4444" : "var(--primary)" }}
            >
              {badge > 9 ? "9+" : badge}
            </span>
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        className="sheet-tooltip text-[11px] flex items-center gap-2"
      >
        {tooltip}
        {shortcut && <kbd className="sheet-kbd">{shortcut}</kbd>}
      </TooltipContent>
    </Tooltip>
  );
}

// ── ToolSep ──────────────────────────────────────────────────────────────────
export function ToolSep() {
  return (
    <div className="sheet-tool-sep mx-1 h-5 w-px self-center flex-shrink-0" />
  );
}

// ── Avatar ───────────────────────────────────────────────────────────────────
export function SheetAvatar({
  member,
  showOnline = false,
}: {
  member: {
    id: string;
    name: string;
    avatar_url: string | null;
    email?: string;
    role?: string;
  };
  showOnline?: boolean;
}) {
  const color = getMemberColor(member.id);
  return (
    <div
      className="sheet-avatar h-6 w-6 rounded-full relative border-2 flex-shrink-0 overflow-hidden"
      style={{ borderColor: color }}
      title={member.name}
    >
      {member.avatar_url ? (
        <Image
          src={member.avatar_url}
          alt={member.name}
          width={24}
          height={24}
          unoptimized
          referrerPolicy="no-referrer"
          className="absolute inset-0 h-full w-full rounded-full object-cover"
        />
      ) : (
        <div
          className="absolute inset-0 h-full w-full rounded-full flex items-center justify-center text-[9px] font-bold text-white"
          style={{ backgroundColor: color }}
        >
          {getMemberInitials(member.name)}
        </div>
      )}
      {showOnline && (
        <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 bg-emerald-500 rounded-full border border-white" />
      )}
    </div>
  );
}

