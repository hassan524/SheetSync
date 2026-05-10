"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { toast } from "sonner";
import type { SheetRow, ColumnDef } from "@/types/index";
import type { HistoryEntry } from "@/lib/querys/sheet/firebase-realtime";
import {
  getSnapshots,
  createSnapshot,
  deleteSnapshot,
  updateSnapshotLabel,
  type SheetSnapshot,
} from "@/lib/querys/sheet/snapshots";
import { supabase } from "@/lib/supabase/client";

export type TimelineEntry =
  | ({ kind: "event" } & HistoryEntry)
  | ({ kind: "snapshot" } & SheetSnapshot);

export interface TimeTravelState {
  snapshots: SheetSnapshot[];
  forkedSnapshotIds: Set<string>;
  timeline: TimelineEntry[];
  playIndex: number;
  isPlaying: boolean;
  speed: 0.5 | 1 | 2;
  previewRows: SheetRow[] | null;
  previewColumns: ColumnDef[] | null;
  isOpen: boolean;
  focusedSnapshotId: string | null;
  isLoadingSnapshots: boolean;
  pendingForkSnapshot: SheetSnapshot | null;
  activeCell: { row: number; col: string } | null;
}

export interface TimeTravelActions {
  openPanel: () => void;
  closePanel: () => void;
  seekTo: (index: number) => void;
  play: () => void;
  pause: () => void;
  setSpeed: (s: 0.5 | 1 | 2) => void;
  saveSnapshot: (label?: string) => Promise<void>;
  removeSnapshot: (id: string) => Promise<void>;
  renameSnapshot: (id: string, label: string) => Promise<void>;
  branchFromIndex: (index: number) => Promise<void>;
  branchFromSnapshot: (snapshot: SheetSnapshot) => void;
  confirmBranch: (name: string) => Promise<void>;
  cancelBranch: () => void;
  exitPreview: () => void;
  refreshSnapshots: () => Promise<void>;
  focusSnapshot: (id: string | null) => void;
}

const BASE_INTERVAL_MS = 900;

export function useTimeTravel({
  sheetId,
  currentRows,
  currentColumns,
  historyEntries,
  currentUserId,
  currentUserName,
  organizationId,
  onBranch,
}: {
  sheetId: string;
  currentRows: SheetRow[];
  currentColumns: ColumnDef[];
  historyEntries: HistoryEntry[];
  currentUserId?: string;
  currentUserName?: string;
  organizationId?: string | null;
  onBranch?: (newSheetId: string, label: string) => void;
}): [TimeTravelState, TimeTravelActions] {
  const [snapshots, setSnapshots] = useState<SheetSnapshot[]>([]);
  const [forkedSnapshotIds, setForkedSnapshotIds] = useState<Set<string>>(new Set());
  const [playIndex, setPlayIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeedState] = useState<0.5 | 1 | 2>(1);
  const [previewRows, setPreviewRows] = useState<SheetRow[] | null>(null);
  const [previewColumns, setPreviewColumns] = useState<ColumnDef[] | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [focusedSnapshotId, setFocusedSnapshotId] = useState<string | null>(null);
  const [isLoadingSnapshots, setIsLoadingSnapshots] = useState(false);
  const [pendingForkSnapshot, setPendingForkSnapshot] = useState<SheetSnapshot | null>(null);
  const [activeCell, setActiveCell] = useState<{ row: number; col: string } | null>(null);

  const playTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isPlayingRef = useRef(false);

  const timeline = useMemo<TimelineEntry[]>(() => {
    const events: TimelineEntry[] = historyEntries.map((e) => ({
      kind: "event" as const,
      ...e,
    }));
    const snaps: TimelineEntry[] = snapshots.map((s) => ({
      kind: "snapshot" as const,
      ...s,
    }));
    return [...events, ...snaps].sort((a, b) => {
      const da =
        a.kind === "event"
          ? parseCreatedAt(a.createdAt)
          : new Date(a.created_at).getTime();
      const db =
        b.kind === "event"
          ? parseCreatedAt(b.createdAt)
          : new Date(b.created_at).getTime();
      return da - db;
    });
  }, [historyEntries, snapshots]);

  const refreshSnapshots = useCallback(async () => {
    if (!sheetId) return;
    setIsLoadingSnapshots(true);
    try {
      const data = await getSnapshots(sheetId);
      setSnapshots(data);
    } finally {
      setIsLoadingSnapshots(false);
    }
  }, [sheetId]);

  useEffect(() => {
    if (isOpen) refreshSnapshots();
  }, [isOpen, refreshSnapshots]);

  const buildStateForIndex = useCallback(
    (targetIndex: number) => {
      const rows = currentRows.map((r) => ({ ...r }));
      const cols = currentColumns.map((c) => ({ ...c }));

      for (let i = timeline.length - 1; i > targetIndex; i--) {
        const entry = timeline[i];
        if (entry.kind === "event") {
          if (entry.action === "cell_edit") {
            const match = entry.detail?.match(/^Edited ([A-Z]+)(\d+)/);
            if (match) {
              const colStr = match[1];
              const rowStr = match[2];
              let colIdx = 0;
              for (let c = 0; c < colStr.length; c++) {
                colIdx = colIdx * 26 + (colStr.charCodeAt(c) - 64);
              }
              colIdx -= 1;
              const rowIdx = parseInt(rowStr) - 1;
              if (rows[rowIdx] && cols[colIdx]) {
                const colKey = cols[colIdx].key;
                rows[rowIdx][colKey] = entry.oldValue;
              }
            }
          } else if (entry.action === "row_add") {
            const match = entry.detail?.match(/^Added row (\d+)/);
            if (match) {
              const rowIdx = parseInt(match[1]) - 1;
              if (rowIdx >= 0 && rowIdx < rows.length) {
                rows.splice(rowIdx, 1);
              }
            }
          } else if (entry.action === "col_add") {
            const match = entry.detail?.match(/^Added column "([^"]+)"/);
            if (match) {
              const colName = match[1];
              const colIdx = cols.findIndex((c) => c.name === colName);
              if (colIdx >= 0) cols.splice(colIdx, 1);
            }
          } else if (entry.action === "column_rename") {
            const match = entry.detail?.match(/^Renamed column "([^"]+)"/);
            if (match) {
              const oldName = entry.oldValue;
              const colIdx = cols.findIndex((c) => c.name === entry.newValue);
              if (colIdx >= 0 && oldName) {
                cols[colIdx].name = oldName;
              }
            }
          }
        }
      }
      return { rows, cols };
    },
    [currentRows, currentColumns, timeline],
  );

  const seekTo = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(index, timeline.length - 1));
      setPlayIndex(clamped);
      const entry = timeline[clamped];
      if (!entry) return;

      let cellToHighlight: { row: number; col: string } | null = null;
      if (entry.kind === "event" && entry.action === "cell_edit") {
        const match = entry.detail?.match(/^Edited ([A-Z]+)(\d+)/);
        if (match) {
          const colStr = match[1];
          const rowStr = match[2];
          let colIdx = 0;
          for (let c = 0; c < colStr.length; c++) {
            colIdx = colIdx * 26 + (colStr.charCodeAt(c) - 64);
          }
          colIdx -= 1;
          const rowIdx = parseInt(rowStr) - 1;
          if (currentColumns[colIdx]) {
            cellToHighlight = { row: rowIdx, col: currentColumns[colIdx].key };
          }
        }
      }

      setActiveCell(cellToHighlight);
      const { rows, cols } = buildStateForIndex(clamped);
      setPreviewRows(rows);
      setPreviewColumns(cols);
    },
    [timeline, buildStateForIndex, currentColumns],
  );

  const stopTimer = useCallback(() => {
    if (playTimerRef.current) {
      clearInterval(playTimerRef.current);
      playTimerRef.current = null;
    }
  }, []);

  const play = useCallback(() => {
    if (timeline.length === 0) return;
    isPlayingRef.current = true;
    setIsPlaying(true);
    const interval = Math.round(BASE_INTERVAL_MS / speed);
    playTimerRef.current = setInterval(() => {
      setPlayIndex((prev) => {
        const next = prev + 1;
        if (next >= timeline.length) {
          isPlayingRef.current = false;
          setIsPlaying(false);
          stopTimer();
          setActiveCell(null);
          return prev;
        }
        const entry = timeline[next];
        let cellToHighlight: { row: number; col: string } | null = null;
        if (entry.kind === "event" && entry.action === "cell_edit") {
          const match = entry.detail?.match(/^Edited ([A-Z]+)(\d+)/);
          if (match) {
            const colStr = match[1];
            const rowStr = match[2];
            let colIdx = 0;
            for (let c = 0; c < colStr.length; c++) {
              colIdx = colIdx * 26 + (colStr.charCodeAt(c) - 64);
            }
            colIdx -= 1;
            const rowIdx = parseInt(rowStr) - 1;
            if (currentColumns[colIdx]) {
              cellToHighlight = { row: rowIdx, col: currentColumns[colIdx].key };
            }
          }
        }
        setActiveCell(cellToHighlight);
        const { rows, cols } = buildStateForIndex(next);
        setPreviewRows(rows);
        setPreviewColumns(cols);
        return next;
      });
    }, interval);
  }, [timeline, speed, stopTimer, buildStateForIndex, currentColumns]);

  const pause = useCallback(() => {
    isPlayingRef.current = false;
    setIsPlaying(false);
    stopTimer();
  }, [stopTimer]);

  const setSpeed = useCallback(
    (s: 0.5 | 1 | 2) => {
      setSpeedState(s);
      if (isPlayingRef.current) pause();
    },
    [pause],
  );

  useEffect(() => () => stopTimer(), [stopTimer]);

  const openPanel = useCallback(() => setIsOpen(true), []);
  const closePanel = useCallback(() => {
    pause();
    setIsOpen(false);
    setPreviewRows(null);
    setPreviewColumns(null);
    setPlayIndex(0);
    setActiveCell(null);
  }, [pause]);

  const exitPreview = useCallback(() => {
    setPreviewRows(null);
    setPreviewColumns(null);
  }, []);

  const focusSnapshot = useCallback((id: string | null) => {
    setFocusedSnapshotId(id);
  }, []);

  const saveSnapshot = useCallback(
    async (label?: string) => {
      const snap = await createSnapshot({
        sheetId,
        label: label || `Snapshot — ${new Date().toLocaleTimeString()}`,
        createdBy: currentUserId,
        rows: currentRows,
        columns: currentColumns,
      });
      if (snap) {
        setSnapshots((p) => [snap, ...p]);
        toast.success("Snapshot saved ✓");
      } else {
        toast.error("Failed to save snapshot");
      }
    },
    [sheetId, currentUserId, currentRows, currentColumns],
  );

  const removeSnapshot = useCallback(async (id: string) => {
    await deleteSnapshot(id);
    setSnapshots((p) => p.filter((s) => s.id !== id));
    toast.success("Snapshot removed");
  }, []);

  const renameSnapshot = useCallback(async (id: string, label: string) => {
    await updateSnapshotLabel(id, label);
    setSnapshots((p) => p.map((s) => (s.id === id ? { ...s, label } : s)));
  }, []);

  const _doBranch = useCallback(
    async (
      rows: SheetRow[],
      cols: ColumnDef[],
      name: string,
      sourceSnapshot: SheetSnapshot,
    ) => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData?.user?.id;
      if (!uid) {
        toast.error("Not signed in");
        return;
      }

      const isOrg = !!organizationId;

      const { data: newSheet, error: sheetErr } = await supabase
        .from("sheets")
        .insert({
          title: name,
          owner_id: uid,
          is_personal: !isOrg,
          organization_id: isOrg ? organizationId : null,
          forked_from_sheet_id: sheetId,
          forked_from_snapshot_label: sourceSnapshot.label ?? null,
          forked_at: new Date().toISOString(),
          forked_by_user_id: uid,
          last_opened_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (sheetErr || !newSheet) {
        toast.error(
          "Could not create fork — " + (sheetErr?.message ?? "unknown error"),
        );
        return;
      }

      const newId: string = newSheet.id;

      const colInserts = cols.map((c, i) => ({
        sheet_id: newId,
        column_key: c.key,
        name: c.name,
        type: c.type ?? "text",
        width: c.width ?? 150,
        position: i,
        select_options: c.selectOptions ?? null,
      }));

      const rowInserts = rows.map((r, i) => {
        const { id, ...data } = r;
        return {
          sheet_id: newId,
          row_key: id,
          position: i,
          data,
        };
      });

      const [colResult, rowResult] = await Promise.all([
        supabase.from("columns").insert(colInserts),
        supabase.from("rows").insert(rowInserts),
      ]);

      if (colResult.error) {
        toast.error("Columns failed to save: " + colResult.error.message);
        return;
      }
      if (rowResult.error) {
        toast.error("Rows failed to save: " + rowResult.error.message);
        return;
      }

      toast.success(`Forked → "${name}"`, { duration: 4000 });
      onBranch?.(newId, name);
    },
    [sheetId, organizationId, onBranch],
  );

  const branchFromSnapshot = useCallback((snapshot: SheetSnapshot) => {
    setPendingForkSnapshot(snapshot);
  }, []);

  const confirmBranch = useCallback(
    async (name: string) => {
      if (!pendingForkSnapshot) return;
      const snap = pendingForkSnapshot;
      setPendingForkSnapshot(null);
      await _doBranch(snap.rows_data, snap.columns_data, name.trim(), snap);
      setForkedSnapshotIds((p) => new Set([...p, snap.id]));
    },
    [pendingForkSnapshot, _doBranch],
  );

  const cancelBranch = useCallback(() => {
    setPendingForkSnapshot(null);
  }, []);

  const branchFromIndex = useCallback(
    async (index: number) => {
      const entry = timeline[index];
      if (!entry) return;
      if (entry.kind === "snapshot") {
        branchFromSnapshot(entry as SheetSnapshot);
      } else {
        toast.info("Select a 📸 snapshot to fork from a full saved state");
      }
    },
    [timeline, branchFromSnapshot],
  );

  const state: TimeTravelState = {
    snapshots,
    forkedSnapshotIds,
    timeline,
    playIndex,
    isPlaying,
    speed,
    previewRows,
    previewColumns,
    isOpen,
    focusedSnapshotId,
    isLoadingSnapshots,
    pendingForkSnapshot,
    activeCell,
  };

  const actions: TimeTravelActions = {
    openPanel,
    closePanel,
    seekTo,
    play,
    pause,
    setSpeed,
    saveSnapshot,
    removeSnapshot,
    renameSnapshot,
    branchFromIndex,
    branchFromSnapshot,
    confirmBranch,
    cancelBranch,
    exitPreview,
    refreshSnapshots,
    focusSnapshot,
  };

  return [state, actions];
}

function parseCreatedAt(s: string): number {
  if (!s) return 0;
  try {
    if (s === "Just now") return Date.now();
    if (s === "Yesterday") return Date.now() - 86400000;
    const minMatch = s.match(/^(\d+)m ago$/);
    if (minMatch) return Date.now() - parseInt(minMatch[1]) * 60000;
    const hourMatch = s.match(/^(\d+)h ago$/);
    if (hourMatch) return Date.now() - parseInt(hourMatch[1]) * 3600000;
    const date = new Date(s);
    if (!isNaN(date.getTime())) return date.getTime();
    return 0;
  } catch {
    return 0;
  }
}

function formatRelative(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}