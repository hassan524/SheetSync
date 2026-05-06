"use client";

/**
 * TimeTravelPanel
 * – Replay all edits like a video
 * – Save / rename / delete snapshots
 * – Fork any snapshot into a new sheet (name dialog included)
 */

import { useState, useRef, useEffect } from "react";
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
  Info,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import type {
  TimeTravelState,
  TimeTravelActions,
  TimelineEntry,
} from "@/hooks/use-time-travel";
import type { SheetSnapshot } from "@/lib/querys/sheet/snapshots";

// ─────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────

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

function eventLabel(entry: TimelineEntry): string {
  if (entry.kind === "snapshot") return (entry as any).label ?? "Auto-save";
  return (entry as any).detail ?? (entry as any).action ?? "Edit";
}

function eventTime(entry: TimelineEntry): string {
  if (entry.kind === "snapshot") return fmtTime((entry as any).created_at);
  const raw: string = (entry as any).createdAt ?? "";
  return raw || "";
}

function eventAuthor(entry: TimelineEntry): string {
  if (entry.kind === "snapshot") return (entry as any).creator_name ?? "You";
  return (entry as any).userName ?? "You";
}

// ─────────────────────────────────────────────
//  FORK NAME DIALOG
// ─────────────────────────────────────────────

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
  const defaultName = `${snapshot.label ?? "Snapshot"} (fork)`;
  const [name, setName] = useState(defaultName);
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
    /* Full-panel overlay */
    <div
      className="absolute inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: d ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.35)" }}
    >
      <div
        className={`w-full max-w-xs rounded-2xl border shadow-2xl p-5 space-y-4
                ${d ? "bg-gray-950 border-gray-700" : "bg-white border-gray-200"}`}
      >
        {/* Header */}
        <div className="flex items-start gap-3">
          <div
            className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0
                        ${d ? "bg-primary/15" : "bg-primary/10"}`}
          >
            <GitBranch className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p
              className={`text-[13px] font-bold ${d ? "text-gray-100" : "text-gray-900"}`}
            >
              Fork this snapshot
            </p>
            <p
              className={`text-[11px] mt-0.5 ${d ? "text-gray-500" : "text-gray-400"}`}
            >
              Creates an independent copy of the sheet at this exact moment
            </p>
          </div>
        </div>

        {/* Source info */}
        <div
          className={`rounded-xl px-3 py-2.5 text-[11px] space-y-1
                    ${d ? "bg-gray-900 border border-gray-800" : "bg-gray-50 border border-gray-100"}`}
        >
          <div className="flex items-center gap-1.5">
            <Camera
              className={`h-3 w-3 shrink-0 ${d ? "text-gray-500" : "text-gray-400"}`}
            />
            <span className={d ? "text-gray-300" : "text-gray-700"}>
              {snapshot.label ?? "Auto-save"}
            </span>
          </div>
          <div
            className={`flex items-center gap-1.5 ${d ? "text-gray-600" : "text-gray-400"}`}
          >
            <Clock className="h-3 w-3 shrink-0" />
            {fmtTime(snapshot.created_at)} · {snapshot.rows_data.length} rows ·{" "}
            {snapshot.columns_data.length} cols
          </div>
        </div>

        {/* Name input */}
        <div className="space-y-1.5">
          <label
            className={`text-[10px] font-semibold uppercase tracking-wider
                        ${d ? "text-gray-500" : "text-gray-400"}`}
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
            className={`w-full h-9 px-3 text-[12px] rounded-xl border outline-none
                            focus:border-primary transition-colors
                            ${
                              d
                                ? "bg-gray-900 border-gray-700 text-gray-100"
                                : "bg-white border-gray-200 text-gray-900"
                            }`}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={onCancel}
            className={`flex-1 h-9 rounded-xl text-[12px] font-medium border transition-colors
                            ${
                              d
                                ? "border-gray-700 text-gray-400 hover:bg-gray-900"
                                : "border-gray-200 text-gray-500 hover:bg-gray-50"
                            }`}
          >
            Cancel
          </button>
          <button
            onClick={submit}
            className="flex-1 h-9 rounded-xl text-[12px] font-bold text-white
                            bg-primary hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5"
          >
            <GitBranch className="h-3.5 w-3.5" />
            Fork
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  SNAPSHOT CARD
// ─────────────────────────────────────────────

function SnapshotCard({
  snap,
  isDark,
  onBranch,
  onRename,
  onDelete,
}: {
  snap: SheetSnapshot;
  isDark: boolean;
  onBranch: () => void;
  onRename: (l: string) => void;
  onDelete: () => void;
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
      className={`group rounded-xl border p-3 transition-all
            ${d ? "border-gray-700/50 bg-gray-900/40 hover:border-gray-600" : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm"}`}
    >
      {editing ? (
        <div className="flex items-center gap-1.5 mb-2">
          <input
            ref={inputRef}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") setEditing(false);
            }}
            className={`flex-1 text-xs px-2 py-1 rounded-lg border outline-none
                            ${d ? "bg-gray-900 border-gray-700 text-gray-200" : "bg-gray-50 border-gray-200 text-gray-800"}`}
          />
          <button
            onClick={commit}
            className={`p-1 rounded-md ${d ? "hover:bg-gray-800" : "hover:bg-gray-100"}`}
          >
            <Check className="h-3 w-3 text-primary" />
          </button>
          <button
            onClick={() => setEditing(false)}
            className={`p-1 rounded-md ${d ? "hover:bg-gray-800" : "hover:bg-gray-100"}`}
          >
            <X className="h-3 w-3 text-gray-400" />
          </button>
        </div>
      ) : (
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <div className="flex-1 min-w-0">
            <p
              className={`text-[11px] font-semibold truncate ${d ? "text-gray-200" : "text-gray-800"}`}
            >
              {snap.label ?? "Auto-save"}
            </p>
            <p
              className={`text-[10px] mt-0.5 ${d ? "text-gray-600" : "text-gray-400"}`}
            >
              {fmtTime(snap.created_at)} · {snap.rows_data.length}r ·{" "}
              {snap.columns_data.length}c
              {snap.creator_name ? ` · ${snap.creator_name}` : ""}
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-1.5">
        <button
          onClick={onBranch}
          className="flex-1 flex items-center justify-center gap-1.5 h-7 rounded-lg
                        text-[11px] font-semibold text-white bg-primary hover:bg-primary/90 transition-colors"
        >
          <GitBranch className="h-3 w-3" />
          Fork into new sheet
        </button>
        <button
          onClick={() => {
            setEditing(true);
            setLabel(snap.label ?? "");
          }}
          className={`h-7 w-7 rounded-lg flex items-center justify-center transition-colors
                        ${d ? "hover:bg-gray-800" : "hover:bg-gray-100"}`}
          title="Rename"
        >
          <Pencil
            className={`h-3 w-3 ${d ? "text-gray-500" : "text-gray-400"}`}
          />
        </button>
        <button
          onClick={onDelete}
          className={`h-7 w-7 rounded-lg flex items-center justify-center transition-colors
                        ${d ? "hover:bg-gray-800" : "hover:bg-gray-100"}`}
          title="Delete"
        >
          <Trash2 className="h-3 w-3 text-red-400" />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  SAVE SNAPSHOT BAR
// ─────────────────────────────────────────────

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
        className="w-full flex items-center justify-center gap-2 h-8 rounded-xl
                text-[11px] font-semibold text-white bg-primary hover:bg-primary/90 transition-colors"
      >
        <Camera className="h-3.5 w-3.5" />
        Save snapshot now
      </button>
    );

  return (
    <div
      className={`rounded-xl border p-3 space-y-2
            ${d ? "border-primary/20 bg-primary/5" : "border-primary/20 bg-primary/5"}`}
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
        className={`w-full h-8 px-3 text-[11px] rounded-lg border outline-none
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
          className={`flex-1 h-7 rounded-lg text-[11px] border
                        ${d ? "border-gray-700 text-gray-400" : "border-gray-200 text-gray-500"}`}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  MAIN PANEL
// ─────────────────────────────────────────────

interface TimeTravelPanelProps {
  state: TimeTravelState;
  actions: TimeTravelActions;
  isDark: boolean;
  onClose?: () => void;
}

export default function TimeTravelPanel({
  state,
  actions,
  isDark,
}: TimeTravelPanelProps) {
  const {
    snapshots,
    timeline,
    playIndex,
    isPlaying,
    speed,
    previewRows,
    isLoadingSnapshots,
    pendingForkSnapshot,
  } = state;
  const [tab, setTab] = useState<"timeline" | "snapshots">("timeline");
  const timelineRef = useRef<HTMLDivElement>(null);
  const d = isDark;

  const currentEntry = timeline[playIndex] ?? null;

  // Auto-scroll active timeline item
  useEffect(() => {
    if (tab !== "timeline") return;
    const el = timelineRef.current?.querySelector(
      `[data-index="${playIndex}"]`,
    );
    el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [playIndex, tab]);

  return (
    <div className="flex flex-col h-full relative">
      {/* ── Fork name dialog (portal-like overlay) ── */}
      {pendingForkSnapshot && (
        <ForkDialog
          snapshot={pendingForkSnapshot}
          isDark={d}
          onConfirm={actions.confirmBranch}
          onCancel={actions.cancelBranch}
        />
      )}

      {/* ── Stats row ── */}
      <div
        className={`flex items-center justify-between px-4 py-2.5 border-b shrink-0
                ${d ? "border-gray-800 bg-gray-900/40" : "border-gray-100 bg-gray-50/60"}`}
      >
        <span
          className={`text-[11px] ${d ? "text-gray-500" : "text-gray-400"}`}
        >
          <Clock className="h-3 w-3 inline mr-1 opacity-60" />
          {timeline.length} events · {snapshots.length} snapshots
        </span>
      </div>

      {/* ── Explainer card ── */}
      <div
        className={`mx-3 mt-3 rounded-xl border p-3 shrink-0
                ${d ? "border-gray-700/60 bg-gray-900/60" : "border-gray-100 bg-gray-50"}`}
      >
        <div className="flex items-start gap-2">
          <Info
            className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${d ? "text-gray-500" : "text-gray-400"}`}
          />
          <div>
            <p
              className={`text-[11px] font-semibold mb-1 ${d ? "text-gray-200" : "text-gray-800"}`}
            >
              How Sheet Replay works
            </p>
            <ul
              className={`text-[10px] leading-relaxed space-y-1 ${d ? "text-gray-500" : "text-gray-400"}`}
            >
              <li>
                <strong className={d ? "text-gray-300" : "text-gray-600"}>
                  Replay
                </strong>{" "}
                — play back all edits like a video
              </li>
              <li>
                <strong className={d ? "text-gray-300" : "text-gray-600"}>
                  Snapshot
                </strong>{" "}
                — full copy of the sheet at one moment
              </li>
              <li>
                <strong className={d ? "text-gray-300" : "text-gray-600"}>
                  Fork
                </strong>{" "}
                — creates a new independent sheet from a snapshot
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* ── Preview banner ── */}
      {previewRows && (
        <div
          className={`flex items-center gap-2 px-4 py-2 shrink-0 border-b
                    ${d ? "border-gray-800 bg-gray-900/60" : "border-gray-100 bg-amber-50"}`}
        >
          <Eye
            className={`h-3 w-3 shrink-0 ${d ? "text-gray-400" : "text-amber-600"}`}
          />
          <p
            className={`text-[11px] font-medium flex-1 ${d ? "text-gray-300" : "text-amber-700"}`}
          >
            Previewing snapshot — grid is read-only
          </p>
          <button
            onClick={actions.exitPreview}
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border transition-colors
                            ${d ? "border-gray-700 text-gray-300 hover:bg-gray-800" : "border-amber-200 text-amber-700 hover:bg-amber-100"}`}
          >
            Exit
          </button>
        </div>
      )}

      {/* ── Playback controls ── */}
      <div
        className={`px-4 pt-3 pb-3 shrink-0 space-y-3 border-b
                ${d ? "border-gray-800" : "border-gray-100"}`}
      >
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
                className={`text-[10px] truncate max-w-[150px] text-right ${d ? "text-gray-600" : "text-gray-400"}`}
              >
                {eventLabel(currentEntry).slice(0, 32)}
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
              className="absolute left-0 top-0 h-full rounded-full bg-primary transition-all duration-200"
              style={{
                width:
                  timeline.length > 1
                    ? `${(playIndex / (timeline.length - 1)) * 100}%`
                    : "0%",
              }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full bg-primary border-2 border-white shadow-sm transition-all"
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
                  className={`absolute top-1/2 -translate-y-1/2 h-2 w-2 rounded-full border cursor-pointer z-10 hover:scale-150 transition-transform
                                        ${d ? "bg-gray-400 border-gray-900" : "bg-gray-500 border-white"}`}
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

        {/* Transport */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => actions.seekTo(playIndex - 1)}
            disabled={playIndex === 0}
            className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all disabled:opacity-30 border
                            ${d ? "border-gray-700 hover:bg-gray-800" : "border-gray-200 hover:bg-gray-50"}`}
          >
            <SkipBack
              className={`h-3.5 w-3.5 ${d ? "text-gray-400" : "text-gray-500"}`}
            />
          </button>

          <button
            onClick={isPlaying ? actions.pause : actions.play}
            disabled={timeline.length === 0}
            className={`flex-1 h-8 rounded-lg flex items-center justify-center gap-2
                            font-semibold text-[12px] text-white transition-all disabled:opacity-30
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
            className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all disabled:opacity-30 border
                            ${d ? "border-gray-700 hover:bg-gray-800" : "border-gray-200 hover:bg-gray-50"}`}
          >
            <SkipForward
              className={`h-3.5 w-3.5 ${d ? "text-gray-400" : "text-gray-500"}`}
            />
          </button>

          {/* Speed */}
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

        {/* Fork from current snapshot shortcut */}
        {currentEntry?.kind === "snapshot" && (
          <button
            onClick={() =>
              actions.branchFromSnapshot(currentEntry as SheetSnapshot)
            }
            className={`w-full flex items-center justify-center gap-2 h-8 rounded-lg
                            text-[11px] font-semibold border transition-colors
                            ${d ? "border-primary/30 text-primary hover:bg-primary/10" : "border-primary/20 text-primary hover:bg-primary/5"}`}
          >
            <GitBranch className="h-3.5 w-3.5" />
            Fork from this snapshot
          </button>
        )}
      </div>

      {/* ── Tabs ── */}
      <div
        className={`flex items-center gap-1 px-4 h-10 shrink-0 border-b
                ${d ? "border-gray-800" : "border-gray-100"}`}
      >
        {(["timeline", "snapshots"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex items-center gap-1.5 h-7 px-3 rounded-lg text-[11px] font-semibold capitalize transition-all
                            ${
                              tab === t
                                ? "bg-primary/10 text-primary"
                                : d
                                  ? "text-gray-500 hover:text-gray-300"
                                  : "text-gray-400 hover:text-gray-600"
                            }`}
          >
            {t === "timeline" ? (
              <Clock className="h-3 w-3" />
            ) : (
              <Camera className="h-3 w-3" />
            )}
            {t}
            {t === "snapshots" && snapshots.length > 0 && (
              <span className="h-4 min-w-[16px] px-1 rounded-full text-[9px] font-bold flex items-center justify-center text-white bg-primary">
                {snapshots.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {/* Timeline */}
        {tab === "timeline" && (
          <div ref={timelineRef}>
            {timeline.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-3">
                <div
                  className={`h-12 w-12 rounded-2xl flex items-center justify-center
                                    ${d ? "bg-gray-800" : "bg-gray-100"}`}
                >
                  <Clock
                    className={`h-6 w-6 ${d ? "text-gray-600" : "text-gray-400"}`}
                  />
                </div>
                <div>
                  <p
                    className={`text-[12px] font-semibold ${d ? "text-gray-300" : "text-gray-700"}`}
                  >
                    No activity yet
                  </p>
                  <p
                    className={`text-[10.5px] mt-0.5 ${d ? "text-gray-600" : "text-gray-400"}`}
                  >
                    Events appear here as you edit
                  </p>
                </div>
              </div>
            )}
            {timeline.slice(0, playIndex + 1).map((entry, i) => {
              const isActive = i === playIndex;
              const isSnap = entry.kind === "snapshot";
              return (
                <div
                  key={entry.kind === "event" ? entry.id : `snap-${entry.id}`}
                  data-index={i}
                  onClick={() => actions.seekTo(i)}
                  className={`group relative flex gap-3 px-4 py-2.5 cursor-pointer transition-all border-l-2
                                        ${
                                          isActive
                                            ? `border-l-primary ${d ? "bg-primary/5" : "bg-primary/5"}`
                                            : `border-l-transparent ${d ? "hover:bg-gray-900/60" : "hover:bg-gray-50"}`
                                        }`}
                >
                  <div
                    className={`mt-0.5 h-6 w-6 rounded-full flex items-center justify-center shrink-0
                                        ${
                                          isActive
                                            ? "bg-primary text-white"
                                            : isSnap
                                              ? d
                                                ? "bg-primary/15 text-primary"
                                                : "bg-primary/10 text-primary"
                                              : d
                                                ? "bg-gray-800 text-gray-500"
                                                : "bg-gray-100 text-gray-400"
                                        }`}
                  >
                    {isSnap ? (
                      <Camera className="h-3 w-3" />
                    ) : (
                      <Clock className="h-3 w-3" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-[11px] leading-snug line-clamp-2
                                            ${isSnap ? "font-semibold" : "font-normal"}
                                            ${d ? "text-gray-200" : "text-gray-800"}`}
                    >
                      {eventLabel(entry)}
                    </p>
                    <p
                      className={`text-[9px] mt-0.5 ${d ? "text-gray-600" : "text-gray-400"}`}
                    >
                      {eventAuthor(entry)} · {eventTime(entry)}
                    </p>
                  </div>

                  {isSnap && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        actions.branchFromSnapshot(entry as SheetSnapshot);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 hidden group-hover:flex
                                                items-center gap-1 h-6 px-2 rounded-lg text-[10px] font-semibold
                                                text-primary bg-primary/10 hover:bg-primary/15 transition-colors"
                    >
                      <GitBranch className="h-2.5 w-2.5" />
                      Fork
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Snapshots */}
        {tab === "snapshots" && (
          <div className="p-3 space-y-3">
            <SaveBar onSave={actions.saveSnapshot} isDark={d} />

            {isLoadingSnapshots && (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-5 w-5 animate-spin text-primary" />
              </div>
            )}

            {!isLoadingSnapshots && snapshots.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
                <div
                  className={`h-12 w-12 rounded-2xl flex items-center justify-center
                                    ${d ? "bg-gray-800" : "bg-gray-100"}`}
                >
                  <Camera
                    className={`h-6 w-6 ${d ? "text-gray-600" : "text-gray-400"}`}
                  />
                </div>
                <div>
                  <p
                    className={`text-[12px] font-semibold ${d ? "text-gray-300" : "text-gray-700"}`}
                  >
                    No snapshots yet
                  </p>
                  <p
                    className={`text-[10.5px] mt-0.5 leading-relaxed max-w-[200px]
                                        ${d ? "text-gray-600" : "text-gray-400"}`}
                  >
                    Save a snapshot to capture the full sheet state. Fork it
                    later to branch.
                  </p>
                </div>
              </div>
            )}

            {snapshots.map((snap) => (
              <SnapshotCard
                key={snap.id}
                snap={snap}
                isDark={d}
                onBranch={() => actions.branchFromSnapshot(snap)}
                onRename={(label) => actions.renameSnapshot(snap.id, label)}
                onDelete={() => actions.removeSnapshot(snap.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
