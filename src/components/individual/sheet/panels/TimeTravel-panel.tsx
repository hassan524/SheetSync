"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  GitBranch,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Camera,
  Clock,
  Trash2,
  Pencil,
  Check,
  X,
  Eye,
  RefreshCw,
  GripHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import type {
  TimeTravelState,
  TimeTravelActions,
  TimelineEntry,
} from "@/hooks/use-time-travel";
import type { SheetSnapshot } from "@/lib/querys/sheet/snapshots";
import type { OrgMember } from "@/lib/querys/organization/get-sheet-members";

// ─── Helpers ────────────────────────────────────────────────

function fmtTime(iso: string): string {
  try {
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "Just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ─── User Avatar ─────────────────────────────────────────────

function UserAvatar({
  userId,
  userName,
  userColor,
  members,
  size = 22,
}: {
  userId: string;
  userName: string;
  userColor: string;
  members: OrgMember[];
  size?: number;
}) {
  const member = members.find((m) => m.id === userId);
  const avatarUrl = member?.avatar_url ?? null;
  const [imgFailed, setImgFailed] = useState(false);
  const initials = getInitials(userName || "?");

  if (avatarUrl && !imgFailed) {
    return (
      <Image
        src={avatarUrl}
        alt={userName}
        title={userName}
        width={size}
        height={size}
        unoptimized
        className="rounded-full object-cover shrink-0"
        style={{ width: size, height: size, minWidth: size }}
        onError={() => setImgFailed(true)}
      />
    );
  }

  return (
    <div
      title={userName}
      className="rounded-full flex items-center justify-center shrink-0 font-bold"
      style={{
        width: size,
        height: size,
        minWidth: size,
        background: userColor || "#6366f1",
        fontSize: Math.round(size * 0.38),
        color: "#fff",
      }}
    >
      {initials}
    </div>
  );
}

// ─── Action label ─────────────────────────────────────────────

function ActionLabel({
  entry,
  isDark,
}: {
  entry: TimelineEntry;
  isDark: boolean;
}) {
  const d = isDark;

  if (entry.kind === "snapshot") {
    return (
      <span
        className={`text-[11px] font-semibold ${d ? "text-gray-200" : "text-gray-800"}`}
      >
        Saved snapshot
      </span>
    );
  }

  const detail: string = (entry as any).detail ?? "";
  const action: string = (entry as any).action ?? "";

  // cell_edit: "Edited B3 (Column): "old" → "new""
  if (action === "cell_edit") {
    const match = detail.match(
      /^Edited (\S+) \(([^)]+)\): "([^"]*)" → "([^"]*)"/,
    );
    if (match) {
      const [, cell, col, oldV, newV] = match;
      return (
        <div>
          <span
            className={`text-[10.5px] ${d ? "text-gray-300" : "text-gray-700"}`}
          >
            Edited{" "}
            <span
              className={`font-mono font-bold text-[10px] px-1 py-0.5 rounded ${d ? "bg-gray-800 text-primary" : "bg-primary/8 text-primary"}`}
            >
              {cell}
            </span>
            <span
              className={`ml-1 text-[10px] ${d ? "text-gray-500" : "text-gray-400"}`}
            >
              {col}
            </span>
          </span>
          {(oldV || newV) && (
            <div className="flex items-center gap-1 mt-0.5">
              <span
                className={`text-[10px] line-through ${d ? "text-gray-600" : "text-gray-400"}`}
              >
                {oldV || "empty"}
              </span>
              <span
                className={`text-[9px] ${d ? "text-gray-600" : "text-gray-400"}`}
              >
                →
              </span>
              <span
                className={`text-[10px] font-medium ${d ? "text-emerald-400" : "text-emerald-600"}`}
              >
                {newV || "empty"}
              </span>
            </div>
          )}
        </div>
      );
    }
  }

  if (action === "column_rename") {
    const match = detail.match(/^Renamed column "([^"]+)" → "([^"]+)"/);
    if (match) {
      const [, oldName, newName] = match;
      return (
        <span
          className={`text-[10.5px] ${d ? "text-gray-300" : "text-gray-700"}`}
        >
          Renamed col{" "}
          <span
            className={`line-through ${d ? "text-gray-600" : "text-gray-400"}`}
          >
            {oldName}
          </span>
          {" → "}
          <span className="font-semibold">{newName}</span>
        </span>
      );
    }
  }

  const iconMap: Record<string, string> = {
    row_add: "Added row",
    row_delete: "Deleted row(s)",
    col_add: "Added column",
    col_delete: "Deleted column",
    formula_set: "Set formula",
    formula_remove: "Removed formula",
    format_change: "Changed format",
  };

  return (
    <span className={`text-[10.5px] ${d ? "text-gray-300" : "text-gray-700"}`}>
      {iconMap[action] ?? detail}
    </span>
  );
}

// ─── Fork Dialog ─────────────────────────────────────────────

function ForkDialog({
  snapshot,
  isDark,
  onConfirm,
  onCancel,
}: {
  snapshot: SheetSnapshot;
  isDark: boolean;
  onConfirm: (name: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(`${snapshot.label ?? "Snapshot"} (fork)`);
  const inputRef = useRef<HTMLInputElement>(null);
  const d = isDark;

  useEffect(() => {
    inputRef.current?.select();
  }, []);

  const submit = () => {
    if (!name.trim()) {
      toast.error("Please enter a name");
      return;
    }
    onConfirm(name.trim());
  };

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: d ? "rgba(0,0,0,0.75)" : "rgba(0,0,0,0.4)" }}
    >
      <div
        className={`w-full max-w-[260px] rounded-2xl border shadow-2xl p-4 space-y-3
        ${d ? "bg-gray-950 border-gray-700" : "bg-white border-gray-200"}`}
      >
        <div className="flex items-center gap-2.5">
          <div
            className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${d ? "bg-emerald-900/40" : "bg-emerald-50"}`}
          >
            <GitBranch className="h-3.5 w-3.5 text-emerald-500" />
          </div>
          <div>
            <p
              className={`text-[12px] font-bold ${d ? "text-gray-100" : "text-gray-900"}`}
            >
              Fork snapshot
            </p>
            <p
              className={`text-[10px] ${d ? "text-gray-500" : "text-gray-400"}`}
            >
              Creates a new independent sheet
            </p>
          </div>
        </div>

        <div
          className={`rounded-lg px-2.5 py-2 text-[10px] ${d ? "bg-gray-900 border border-gray-800" : "bg-gray-50 border border-gray-100"}`}
        >
          <p
            className={`font-semibold truncate ${d ? "text-gray-300" : "text-gray-700"}`}
          >
            {snapshot.label ?? "Auto-save"}
          </p>
          <p className={`mt-0.5 ${d ? "text-gray-600" : "text-gray-400"}`}>
            {fmtTime(snapshot.created_at)} · {snapshot.rows_data.length}r ·{" "}
            {snapshot.columns_data.length}c
          </p>
        </div>

        <div className="space-y-1">
          <label
            className={`text-[10px] font-semibold uppercase tracking-wider ${d ? "text-gray-500" : "text-gray-400"}`}
          >
            New sheet name
          </label>
          <input
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
              if (e.key === "Escape") onCancel();
            }}
            className={`w-full h-8 px-2.5 text-[11px] rounded-lg border outline-none focus:border-emerald-500 transition-colors
              ${d ? "bg-gray-900 border-gray-700 text-gray-100" : "bg-white border-gray-200 text-gray-900"}`}
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className={`flex-1 h-8 rounded-lg text-[11px] font-medium border transition-colors
              ${d ? "border-gray-700 text-gray-400 hover:bg-gray-900" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}
          >
            Cancel
          </button>
          <button
            onClick={submit}
            className="flex-1 h-8 rounded-lg text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors flex items-center justify-center gap-1.5"
          >
            <GitBranch className="h-3 w-3" /> Fork
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Snapshot Card ────────────────────────────────────────────

function SnapshotCard({
  snap,
  isDark,
  onBranch,
  onRename,
  onDelete,
  alreadyForked,
}: {
  snap: SheetSnapshot;
  isDark: boolean;
  onBranch: () => void;
  onRename: (l: string) => void;
  onDelete: () => void;
  alreadyForked?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(snap.label ?? "");
  const inputRef = useRef<HTMLInputElement>(null);
  const d = isDark;

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);
  const commit = () => {
    if (label.trim()) onRename(label.trim());
    setEditing(false);
  };

  return (
    <div
      className={`rounded-xl border p-2.5 transition-all
      ${d ? "border-gray-700/50 bg-gray-900/40 hover:border-gray-600/70" : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm"}`}
    >
      {editing ? (
        <div className="flex items-center gap-1 mb-2">
          <input
            ref={inputRef}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") setEditing(false);
            }}
            className={`flex-1 text-[11px] px-2 py-1 rounded-lg border outline-none
              ${d ? "bg-gray-900 border-gray-700 text-gray-200" : "bg-gray-50 border-gray-200 text-gray-800"}`}
          />
          <button
            onClick={commit}
            className={`p-1 rounded ${d ? "hover:bg-gray-800" : "hover:bg-gray-100"}`}
          >
            <Check className="h-3 w-3 text-emerald-500" />
          </button>
          <button
            onClick={() => setEditing(false)}
            className={`p-1 rounded ${d ? "hover:bg-gray-800" : "hover:bg-gray-100"}`}
          >
            <X className="h-3 w-3 text-gray-400" />
          </button>
        </div>
      ) : (
        <div className="flex items-start justify-between gap-1.5 mb-2">
          <div className="flex-1 min-w-0">
            <p
              className={`text-[11px] font-semibold truncate ${d ? "text-gray-200" : "text-gray-800"}`}
            >
              {snap.label ?? "Auto-save"}
            </p>
            <p
              className={`text-[9.5px] mt-0.5 ${d ? "text-gray-600" : "text-gray-400"}`}
            >
              {fmtTime(snap.created_at)} · {snap.rows_data.length}r ·{" "}
              {snap.columns_data.length}c
              {snap.creator_name ? ` · by ${snap.creator_name}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              onClick={() => {
                setEditing(true);
                setLabel(snap.label ?? "");
              }}
              className={`h-6 w-6 rounded flex items-center justify-center transition-colors
                ${d ? "hover:bg-gray-800 text-gray-600 hover:text-gray-300" : "hover:bg-gray-100 text-gray-400 hover:text-gray-600"}`}
            >
              <Pencil className="h-2.5 w-2.5" />
            </button>
            <button
              onClick={onDelete}
              className={`h-6 w-6 rounded flex items-center justify-center transition-colors
                ${d ? "hover:bg-red-900/30 text-gray-600 hover:text-red-400" : "hover:bg-red-50 text-gray-400 hover:text-red-500"}`}
            >
              <Trash2 className="h-2.5 w-2.5" />
            </button>
          </div>
        </div>
      )}

      <button
        onClick={onBranch}
        className={`w-full flex items-center justify-center gap-1.5 h-7 rounded-lg text-[11px] font-semibold transition-colors
          ${
            alreadyForked
              ? d
                ? "bg-emerald-900/30 text-emerald-400 border border-emerald-800/60 hover:bg-emerald-900/50"
                : "bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100"
              : d
                ? "bg-primary/15 text-primary border border-primary/20 hover:bg-primary/25"
                : "bg-primary/8 text-primary border border-primary/15 hover:bg-primary/15"
          }`}
      >
        <GitBranch className="h-3 w-3" />
        {alreadyForked ? "Fork again" : "Fork into new sheet"}
      </button>
    </div>
  );
}

// ─── Save Bar ─────────────────────────────────────────────────

function SaveBar({
  onSave,
  isDark,
}: {
  onSave: (l: string) => void;
  isDark: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const d = isDark;

  if (!open)
    return (
      <button
        onClick={() => setOpen(true)}
        className={`w-full flex items-center justify-center gap-2 h-8 rounded-xl text-[11px] font-semibold transition-colors
          ${d ? "bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700" : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200"}`}
      >
        <Camera className="h-3.5 w-3.5" />
        Save snapshot now
      </button>
    );

  return (
    <div
      className={`rounded-xl border p-2.5 space-y-2 ${d ? "border-primary/20 bg-primary/5" : "border-primary/15 bg-primary/5"}`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-widest text-primary">
        Name this snapshot
      </p>
      <input
        autoFocus
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            onSave(
              label.trim() || `Snapshot ${new Date().toLocaleTimeString()}`,
            );
            setLabel("");
            setOpen(false);
          }
          if (e.key === "Escape") setOpen(false);
        }}
        placeholder="e.g. Before cleanup…"
        className={`w-full h-7 px-2.5 text-[11px] rounded-lg border outline-none focus:border-primary transition-colors
          ${d ? "bg-gray-900 border-gray-700 text-gray-200" : "bg-white border-gray-200 text-gray-800"}`}
      />
      <div className="flex gap-2">
        <button
          onClick={() => {
            onSave(
              label.trim() || `Snapshot ${new Date().toLocaleTimeString()}`,
            );
            setLabel("");
            setOpen(false);
          }}
          className="flex-1 h-7 rounded-lg text-[11px] font-semibold text-white bg-primary hover:bg-primary/90 transition-colors"
        >
          Save
        </button>
        <button
          onClick={() => setOpen(false)}
          className={`flex-1 h-7 rounded-lg text-[11px] border ${d ? "border-gray-700 text-gray-400" : "border-gray-200 text-gray-500"}`}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Main Panel ───────────────────────────────────────────────

interface TimeTravelPanelProps {
  state: TimeTravelState;
  actions: TimeTravelActions;
  isDark: boolean;
  orgMembers?: OrgMember[];
  onClose?: () => void;
}

const MIN_TOP_HEIGHT = 130;
const MIN_BOTTOM_HEIGHT = 90;

export default function TimeTravelPanel({
  state,
  actions,
  isDark,
  orgMembers = [],
}: TimeTravelPanelProps) {
  const {
    snapshots,
    forkedSnapshotIds,
    timeline,
    playIndex,
    isPlaying,
    previewRows,
    isLoadingSnapshots,
    pendingForkSnapshot,
  } = state;

  const [tab, setTab] = useState<"timeline" | "snapshots">("timeline");
  const timelineRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const d = isDark;

  // ── Draggable divider ──
  const [topHeight, setTopHeight] = useState(230);
  const dragRef = useRef<{ startY: number; startH: number } | null>(null);

  const onDividerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      dragRef.current = { startY: e.clientY, startH: topHeight };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    [topHeight],
  );

  const onDividerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current || !panelRef.current) return;
    const panelH = panelRef.current.getBoundingClientRect().height;
    const dy = e.clientY - dragRef.current.startY;
    const next = Math.max(
      MIN_TOP_HEIGHT,
      Math.min(panelH - MIN_BOTTOM_HEIGHT - 20, dragRef.current.startH + dy),
    );
    setTopHeight(next);
  }, []);

  const onDividerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  const currentEntry = timeline[playIndex] ?? null;

  useEffect(() => {
    if (tab !== "timeline") return;
    const el = timelineRef.current?.querySelector(
      `[data-index="${playIndex}"]`,
    );
    el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [playIndex, tab]);

  // Fork → remove snapshot immediately
  const handleConfirmBranch = useCallback(
    async (name: string) => {
      const snap = pendingForkSnapshot;
      await actions.confirmBranch(name);
      if (snap) await actions.removeSnapshot(snap.id);
    },
    [actions, pendingForkSnapshot],
  );

  return (
    <div
      ref={panelRef}
      className="flex flex-col h-full relative overflow-hidden"
    >
      {/* Fork dialog */}
      {pendingForkSnapshot && (
        <ForkDialog
          snapshot={pendingForkSnapshot}
          isDark={d}
          onConfirm={handleConfirmBranch}
          onCancel={actions.cancelBranch}
        />
      )}

      {/* Preview banner */}
      {previewRows && (
        <div
          className={`flex items-center gap-2 px-3 py-1.5 shrink-0 border-b
          ${d ? "border-gray-800 bg-amber-900/20" : "border-amber-100 bg-amber-50"}`}
        >
          <Eye
            className={`h-3 w-3 shrink-0 ${d ? "text-amber-400" : "text-amber-600"}`}
          />
          <p
            className={`text-[10.5px] font-medium flex-1 ${d ? "text-amber-300" : "text-amber-700"}`}
          >
            Previewing — grid is read-only
          </p>
          <button
            onClick={actions.exitPreview}
            className={`text-[10px] font-semibold px-2 py-0.5 rounded border transition-colors
              ${d ? "border-amber-700 text-amber-400 hover:bg-amber-900/40" : "border-amber-300 text-amber-700 hover:bg-amber-100"}`}
          >
            Exit
          </button>
        </div>
      )}

      {/* ══ TOP: controls (resizable) ══ */}
      <div
        className="shrink-0 overflow-hidden flex flex-col"
        style={{ height: topHeight }}
      >
        {/* Stats strip */}
        <div
          className={`flex items-center gap-3 px-3 py-2 shrink-0 border-b
          ${d ? "border-gray-800 bg-gray-900/30" : "border-gray-100 bg-gray-50/60"}`}
        >
          <span
            className={`flex items-center gap-1 text-[10.5px] font-medium ${d ? "text-gray-500" : "text-gray-400"}`}
          >
            <Clock className="h-3 w-3" />
            {timeline.length} events
          </span>
          <span
            className={`flex items-center gap-1 text-[10.5px] font-medium ${d ? "text-gray-500" : "text-gray-400"}`}
          >
            <Camera className="h-3 w-3" />
            {snapshots.length} snapshots
          </span>
        </div>

        <div className="flex-1 overflow-hidden px-3 pt-2.5 pb-1 flex flex-col gap-2.5 min-h-0">
          {/* Scrubber */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span
                className={`text-[10px] font-mono ${d ? "text-gray-600" : "text-gray-400"}`}
              >
                {playIndex + 1} / {Math.max(1, timeline.length)}
              </span>
              {currentEntry && (
                <span
                  className={`text-[10px] truncate max-w-[140px] text-right ${d ? "text-gray-600" : "text-gray-400"}`}
                >
                  {(
                    (currentEntry as any).detail ??
                    (currentEntry as any).label ??
                    ""
                  ).slice(0, 28)}
                </span>
              )}
            </div>

            <div
              className={`relative w-full h-2 rounded-full cursor-pointer ${d ? "bg-gray-800" : "bg-gray-200"}`}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const pct = (e.clientX - rect.left) / rect.width;
                actions.seekTo(Math.round(pct * (timeline.length - 1)));
              }}
            >
              <div
                className="absolute left-0 top-0 h-full rounded-full bg-primary transition-all duration-150"
                style={{
                  width:
                    timeline.length > 1
                      ? `${(playIndex / (timeline.length - 1)) * 100}%`
                      : "0%",
                }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full bg-primary border-2 border-white shadow transition-all"
                style={{
                  left:
                    timeline.length > 1
                      ? `calc(${(playIndex / (timeline.length - 1)) * 100}% - 7px)`
                      : "-7px",
                }}
              />
              {timeline.map((entry, i) => {
                if (entry.kind !== "snapshot") return null;
                const pct =
                  timeline.length > 1 ? (i / (timeline.length - 1)) * 100 : 0;
                return (
                  <div
                    key={entry.id}
                    className={`absolute top-1/2 -translate-y-1/2 h-2 w-2 rounded-full border z-10 hover:scale-150 transition-transform cursor-pointer
                      ${d ? "bg-gray-300 border-gray-900" : "bg-gray-500 border-white"}`}
                    style={{ left: `calc(${pct}% - 4px)` }}
                    title={(entry as any).label ?? "Snapshot"}
                    onClick={(e) => {
                      e.stopPropagation();
                      actions.seekTo(i);
                    }}
                  />
                );
              })}
            </div>
          </div>

          {/* Play controls */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => actions.seekTo(playIndex - 1)}
              disabled={playIndex === 0}
              className={`h-7 w-7 rounded-lg flex items-center justify-center transition-all disabled:opacity-30 border
                ${d ? "border-gray-700 hover:bg-gray-800" : "border-gray-200 hover:bg-gray-50"}`}
            >
              <SkipBack
                className={`h-3.5 w-3.5 ${d ? "text-gray-400" : "text-gray-500"}`}
              />
            </button>

            <button
              onClick={isPlaying ? actions.pause : actions.play}
              disabled={timeline.length === 0}
              className={`flex-1 h-7 rounded-lg flex items-center justify-center gap-1.5 font-semibold text-[11px] text-white transition-all disabled:opacity-30
                ${isPlaying ? "bg-red-500 hover:bg-red-600" : "bg-primary hover:bg-primary/90"}`}
            >
              {isPlaying ? (
                <>
                  <Pause className="h-3.5 w-3.5" /> Pause
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5" /> Play
                </>
              )}
            </button>

            <button
              onClick={() => actions.seekTo(playIndex + 1)}
              disabled={playIndex >= timeline.length - 1}
              className={`h-7 w-7 rounded-lg flex items-center justify-center transition-all disabled:opacity-30 border
                ${d ? "border-gray-700 hover:bg-gray-800" : "border-gray-200 hover:bg-gray-50"}`}
            >
              <SkipForward
                className={`h-3.5 w-3.5 ${d ? "text-gray-400" : "text-gray-500"}`}
              />
            </button>

            <div
              className={`flex items-center gap-0.5 rounded-lg p-0.5 ${d ? "bg-gray-800" : "bg-gray-100"}`}
            >
              {([0.5, 1, 2] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => actions.setSpeed(s)}
                  className={`h-6 px-2 rounded-md text-[10px] font-bold transition-all
                    ${
                      state.speed === s
                        ? d
                          ? "bg-gray-700 text-gray-200"
                          : "bg-white text-gray-800 shadow-sm"
                        : d
                          ? "text-gray-500"
                          : "text-gray-400"
                    }`}
                >
                  {s}×
                </button>
              ))}
            </div>
          </div>

          {/* Fork current snapshot */}
          {currentEntry?.kind === "snapshot" && (
            <button
              onClick={() =>
                actions.branchFromSnapshot(currentEntry as SheetSnapshot)
              }
              className={`w-full flex items-center justify-center gap-1.5 h-7 rounded-lg text-[11px] font-semibold border transition-colors
                ${
                  forkedSnapshotIds.has(currentEntry.id)
                    ? d
                      ? "border-emerald-800 text-emerald-400 bg-emerald-900/20 hover:bg-emerald-900/40"
                      : "border-emerald-200 text-emerald-600 bg-emerald-50 hover:bg-emerald-100"
                    : d
                      ? "border-primary/30 text-primary hover:bg-primary/10"
                      : "border-primary/20 text-primary hover:bg-primary/5"
                }`}
            >
              <GitBranch className="h-3.5 w-3.5" />
              {forkedSnapshotIds.has(currentEntry.id)
                ? "Fork again from here"
                : "Fork from this point"}
            </button>
          )}
        </div>
      </div>

      {/* ══ DRAGGABLE DIVIDER ══ */}
      <div
        className={`relative shrink-0 flex items-center justify-center cursor-row-resize select-none group z-10
          ${d ? "border-y border-gray-800 hover:border-primary/30" : "border-y border-gray-100 hover:border-primary/20"}`}
        style={{
          height: 18,
          background: d ? "#0f1117" : "#f9fafb",
          touchAction: "none",
        }}
        onPointerDown={onDividerDown}
        onPointerMove={onDividerMove}
        onPointerUp={onDividerUp}
        onPointerCancel={onDividerUp}
        title="Drag to resize"
      >
        <GripHorizontal
          className={`h-3.5 w-3.5 transition-colors ${d ? "text-gray-700 group-hover:text-primary/50" : "text-gray-300 group-hover:text-primary/40"}`}
        />
        <span
          className={`absolute right-2.5 text-[9px] font-medium opacity-0 group-hover:opacity-100 transition-opacity ${d ? "text-gray-600" : "text-gray-400"}`}
        >
          drag to resize
        </span>
      </div>

      {/* ══ BOTTOM: tabs + list ══ */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        <div
          className={`flex items-center gap-1 px-3 h-9 shrink-0 border-b ${d ? "border-gray-800" : "border-gray-100"}`}
        >
          {(["timeline", "snapshots"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex items-center gap-1.5 h-6 px-3 rounded-lg text-[11px] font-semibold capitalize transition-all
                ${
                  tab === t
                    ? "bg-primary/10 text-primary"
                    : d
                      ? "text-gray-500 hover:text-gray-300 hover:bg-gray-800/50"
                      : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                }`}
            >
              {t === "timeline" ? (
                <Clock className="h-3 w-3" />
              ) : (
                <Camera className="h-3 w-3" />
              )}
              {t === "timeline" ? "Timeline" : "Snapshots"}
              {t === "snapshots" && snapshots.length > 0 && (
                <span className="h-4 min-w-[16px] px-1 rounded-full text-[9px] font-bold flex items-center justify-center text-white bg-primary">
                  {snapshots.length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          {/* ─ TIMELINE ─ */}
          {tab === "timeline" && (
            <div ref={timelineRef}>
              {timeline.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 px-4 text-center gap-2">
                  <div
                    className={`h-10 w-10 rounded-xl flex items-center justify-center ${d ? "bg-gray-800" : "bg-gray-100"}`}
                  >
                    <Clock
                      className={`h-5 w-5 ${d ? "text-gray-600" : "text-gray-400"}`}
                    />
                  </div>
                  <p
                    className={`text-[11px] font-semibold ${d ? "text-gray-400" : "text-gray-600"}`}
                  >
                    No activity yet
                  </p>
                  <p
                    className={`text-[10px] ${d ? "text-gray-600" : "text-gray-400"}`}
                  >
                    Events appear as you edit
                  </p>
                </div>
              )}

              {timeline.slice(0, playIndex + 1).map((entry, i) => {
                const isActive = i === playIndex;
                const isSnap = entry.kind === "snapshot";

                const userId: string = (entry as any).userId ?? "local";
                const userName: string = isSnap
                  ? ((entry as any).creator_name ?? "You")
                  : ((entry as any).userName ?? "You");
                const userColor: string = (entry as any).userColor ?? "#6366f1";
                const timeStr: string = isSnap
                  ? fmtTime((entry as any).created_at)
                  : ((entry as any).createdAt ?? "");

                return (
                  <div
                    key={entry.kind === "event" ? entry.id : `snap-${entry.id}`}
                    data-index={i}
                    onClick={() => actions.seekTo(i)}
                    className={`group relative flex gap-2.5 px-3 py-2.5 cursor-pointer transition-all border-l-2
                      ${
                        isActive
                          ? `border-l-primary ${d ? "bg-primary/5" : "bg-primary/4"}`
                          : `border-l-transparent ${d ? "hover:bg-gray-900/60" : "hover:bg-gray-50"}`
                      }`}
                  >
                    {/* PFP with optional snapshot badge */}
                    <div className="relative shrink-0 mt-0.5">
                      <UserAvatar
                        userId={userId}
                        userName={userName}
                        userColor={userColor}
                        members={orgMembers}
                        size={24}
                      />
                      {isSnap && (
                        <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-primary flex items-center justify-center ring-1 ring-white/20">
                          <Camera className="h-1.5 w-1.5 text-white" />
                        </span>
                      )}
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0 pr-10">
                      {/* Name + time */}
                      <p
                        className={`text-[10px] font-semibold mb-0.5 truncate ${d ? "text-gray-400" : "text-gray-500"}`}
                      >
                        {userName}
                        {timeStr && (
                          <span
                            className={`ml-1.5 font-normal ${d ? "text-gray-600" : "text-gray-400"}`}
                          >
                            · {timeStr}
                          </span>
                        )}
                      </p>
                      {/* Action */}
                      <ActionLabel entry={entry} isDark={d} />
                    </div>

                    {/* Hover fork button (snapshots only) */}
                    {isSnap && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          actions.branchFromSnapshot(entry as SheetSnapshot);
                        }}
                        className={`absolute right-2.5 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1
                          h-5 px-1.5 rounded text-[9.5px] font-semibold border transition-colors
                          ${
                            d
                              ? "text-emerald-400 bg-emerald-900/30 border-emerald-800 hover:bg-emerald-900/50"
                              : "text-emerald-600 bg-emerald-50 border-emerald-200 hover:bg-emerald-100"
                          }`}
                      >
                        <GitBranch className="h-2 w-2" /> Fork
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ─ SNAPSHOTS ─ */}
          {tab === "snapshots" && (
            <div className="p-3 space-y-2.5 pb-6">
              <SaveBar onSave={actions.saveSnapshot} isDark={d} />

              {isLoadingSnapshots && (
                <div className="flex items-center justify-center py-6">
                  <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                </div>
              )}

              {!isLoadingSnapshots && snapshots.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
                  <div
                    className={`h-10 w-10 rounded-xl flex items-center justify-center ${d ? "bg-gray-800" : "bg-gray-100"}`}
                  >
                    <Camera
                      className={`h-5 w-5 ${d ? "text-gray-600" : "text-gray-400"}`}
                    />
                  </div>
                  <p
                    className={`text-[11px] font-semibold ${d ? "text-gray-400" : "text-gray-600"}`}
                  >
                    No snapshots yet
                  </p>
                  <p
                    className={`text-[10px] leading-relaxed max-w-[180px] ${d ? "text-gray-600" : "text-gray-400"}`}
                  >
                    Save a snapshot, then fork it to branch into a new sheet.
                  </p>
                </div>
              )}

              {snapshots.map((snap) => (
                <SnapshotCard
                  key={snap.id}
                  snap={snap}
                  isDark={d}
                  alreadyForked={forkedSnapshotIds.has(snap.id)}
                  onBranch={() => actions.branchFromSnapshot(snap)}
                  onRename={(label) => actions.renameSnapshot(snap.id, label)}
                  onDelete={() => actions.removeSnapshot(snap.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

