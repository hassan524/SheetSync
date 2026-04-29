"use client";

import { Send, Check, MessageSquare, Reply, CheckCircle2 } from "lucide-react";
import { useState } from "react";

// ── Types ──────────────────────────────────────────────────────
interface ReplyItem {
    author: string;
    color: string;
    text: string;
    timestamp: string;
    createdAt?: string;
}

interface SheetComment {
    id: string;
    sheetId: string;
    cellKey: string;
    userId: string;
    author: string;
    authorColor: string;
    text: string;
    resolved: boolean;
    parentId: string | null;
    createdAt: string;
    thread?: ReplyItem[]; // injected by groupedCommentsForPanel
}

// ── Time helper ────────────────────────────────────────────────
function timeAgo(ts: string | number | undefined | null): string {
    if (!ts) return "just now";
    const date = typeof ts === "number" ? new Date(ts) : new Date(ts);
    if (isNaN(date.getTime())) return "just now";
    const diffMs = Date.now() - date.getTime();
    const secs = Math.floor(diffMs / 1000);
    if (secs < 60) return `${Math.max(0, secs)}s ago`;
    const mins = Math.floor(secs / 60);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days === 1) return "yesterday";
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;
    return `${Math.floor(months / 12)}y ago`;
}

// ── Avatar ─────────────────────────────────────────────────────
function Avatar({
    name,
    color,
    size = "md",
}: {
    name: string;
    color: string;
    size?: "sm" | "md";
}) {
    const initials = (name ?? "?")
        .split(" ")
        .filter(Boolean)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    const sz = size === "sm" ? "h-5 w-5 text-[8px]" : "h-6 w-6 text-[9px]";
    return (
        <div
            className={`${sz} rounded-full flex items-center justify-center font-bold text-white shrink-0`}
            style={{ backgroundColor: color ?? "#6b7280" }}
        >
            {initials}
        </div>
    );
}

// ── Cell key → readable label ──────────────────────────────────
// "2-status" → "status · 3"
function formatCellLabel(key: string): string {
    if (!key) return "";
    const parts = key.split("-");
    const rowNum = parseInt(parts[0] ?? "0") + 1;
    const colKey = parts.slice(1).join("-");
    return `${colKey} · ${rowNum}`;
}

// ── Props ──────────────────────────────────────────────────────
interface CommentsPanelProps {
    isDark: boolean;
    /** Full map: cellKey → root comments (each with .thread injected) */
    comments: Record<string, SheetComment[]>;
    activeCommentCell: string | null;
    newCommentText: string;
    replyText: Record<string, string>;
    setNewCommentText: (text: string) => void;
    handleAddComment: (cellKey: string) => void;
    handleReply: (cellKey: string, commentId: string) => void;
    handleResolveComment: (cellKey: string, commentId: string) => void;
    setReplyText: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

// ── Main ───────────────────────────────────────────────────────
export default function CommentsPanel({
    isDark,
    comments,
    activeCommentCell,
    newCommentText,
    replyText,
    setNewCommentText,
    handleAddComment,
    handleReply,
    handleResolveComment,
    setReplyText,
}: CommentsPanelProps) {
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<"cell" | "all">("cell");

    const t = (light: string, dark: string) => (isDark ? dark : light);

    // ── Which comments to show ─────────────────────────────────
    // "cell" mode: only the active cell's comments
    // "all"  mode: every cell
    const entriesToShow =
        viewMode === "cell" && activeCommentCell
            ? ([[activeCommentCell, comments[activeCommentCell] ?? []]] as [string, SheetComment[]][])
            : (Object.entries(comments) as [string, SheetComment[]][]);

    // Root comments only — replies live inside comment.thread
    const rootComments: (SheetComment & { cellKey: string })[] =
        entriesToShow.flatMap(([cellKey, list]) =>
            list
                .filter((c) => !c.parentId)
                .map((c) => ({ ...c, cellKey }))
        );

    const unresolved = rootComments.filter((c) => !c.resolved);
    const resolved = rootComments.filter((c) => c.resolved);
    const sorted = [...unresolved, ...resolved];

    // Badge counts
    const totalAllOpen = Object.values(comments)
        .flat()
        .filter((c) => !c.parentId && !c.resolved).length;

    const cellOpenCount = activeCommentCell
        ? (comments[activeCommentCell] ?? []).filter(
            (c) => !c.parentId && !c.resolved
        ).length
        : 0;

    return (
        <div className="flex flex-col h-full">
            {/* ── "This cell" / "All" tabs ── */}
            <div
                className={`flex items-center gap-1 px-3 py-2 border-b shrink-0 ${t(
                    "border-gray-100",
                    "border-gray-800"
                )}`}
            >
                <button
                    onClick={() => setViewMode("cell")}
                    disabled={!activeCommentCell}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed ${viewMode === "cell"
                        ? t("bg-primary/10 text-primary", "bg-primary/20 text-primary/90")
                        : t("text-gray-500 hover:bg-gray-100", "text-gray-500 hover:bg-gray-800")
                        }`}
                >
                    This cell
                    {cellOpenCount > 0 && (
                        <span
                            className={`h-4 min-w-[16px] px-1 rounded-full text-[9px] font-bold flex items-center justify-center ${viewMode === "cell"
                                ? "bg-primary text-white"
                                : t("bg-gray-200 text-gray-600", "bg-gray-700 text-gray-400")
                                }`}
                        >
                            {cellOpenCount}
                        </span>
                    )}
                </button>

                <button
                    onClick={() => setViewMode("all")}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${viewMode === "all"
                        ? t("bg-primary/10 text-primary", "bg-primary/20 text-primary/90")
                        : t("text-gray-500 hover:bg-gray-100", "text-gray-500 hover:bg-gray-800")
                        }`}
                >
                    All
                    {totalAllOpen > 0 && (
                        <span
                            className={`h-4 min-w-[16px] px-1 rounded-full text-[9px] font-bold flex items-center justify-center ${viewMode === "all"
                                ? "bg-primary text-white"
                                : t("bg-gray-200 text-gray-600", "bg-gray-700 text-gray-400")
                                }`}
                        >
                            {totalAllOpen}
                        </span>
                    )}
                </button>

                {/* Active cell chip */}
                {activeCommentCell && (
                    <span
                        className={`ml-auto text-[9.5px] font-mono px-1.5 py-0.5 rounded ${t(
                            "bg-gray-100 text-gray-400",
                            "bg-gray-800 text-gray-500"
                        )}`}
                    >
                        {formatCellLabel(activeCommentCell)}
                    </span>
                )}
            </div>

            {/* ── Comment list ── */}
            <div
                className="flex-1 overflow-y-auto min-h-0"
                style={{ scrollbarWidth: "thin" }}
            >
                {sorted.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-2 pb-16 px-6 text-center">
                        <MessageSquare
                            className={`h-7 w-7 ${t("text-gray-200", "text-gray-700")}`}
                        />
                        <p className={`text-[12px] font-medium ${t("text-gray-500", "text-gray-400")}`}>
                            {viewMode === "cell" && activeCommentCell
                                ? "No comments on this cell"
                                : "No comments yet"}
                        </p>
                        {viewMode === "cell" && (
                            <p className={`text-[11px] ${t("text-gray-400", "text-gray-600")}`}>
                                Type below to add one
                            </p>
                        )}
                    </div>
                ) : (
                    <div>
                        {sorted.map((comment) => {
                            const replies: ReplyItem[] = (comment as any).thread ?? [];

                            return (
                                <div
                                    key={comment.id}
                                    className={`px-3 py-3 border-b transition-colors ${comment.resolved ? "opacity-40" : ""
                                        } ${t(
                                            "border-gray-100 hover:bg-gray-50/50",
                                            "border-gray-800/60 hover:bg-gray-900/40"
                                        )}`}
                                >
                                    {/* Cell label — only in "all" view */}
                                    {viewMode === "all" && (
                                        <span
                                            className={`inline-flex items-center gap-1 text-[9.5px] font-mono font-semibold mb-2 px-1.5 py-0.5 rounded ${t(
                                                "bg-gray-100 text-gray-400",
                                                "bg-gray-800 text-gray-500"
                                            )}`}
                                        >
                                            {formatCellLabel(comment.cellKey)}
                                            {comment.resolved && (
                                                <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500" />
                                            )}
                                        </span>
                                    )}

                                    {/* Root comment */}
                                    <div className="flex items-start gap-2.5">
                                        <Avatar
                                            name={comment.author ?? "?"}
                                            color={comment.authorColor ?? "#6b7280"}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5 mb-0.5">
                                                <span
                                                    className={`text-[12px] font-semibold ${t(
                                                        "text-gray-800",
                                                        "text-gray-200"
                                                    )}`}
                                                >
                                                    {comment.author ?? "Unknown"}
                                                </span>
                                                <span
                                                    className={`text-[10px] ${t(
                                                        "text-gray-400",
                                                        "text-gray-600"
                                                    )}`}
                                                >
                                                    {timeAgo(comment.createdAt)}
                                                </span>
                                            </div>

                                            <p
                                                className={`text-[12.5px] leading-relaxed ${t(
                                                    "text-gray-700",
                                                    "text-gray-300"
                                                )}`}
                                            >
                                                {comment.text}
                                            </p>

                                            {/* Actions */}
                                            {!comment.resolved && (
                                                <div className="flex items-center gap-2 mt-1.5">
                                                    <button
                                                        className={`text-[11px] font-medium flex items-center gap-1 transition-colors ${t(
                                                            "text-gray-400 hover:text-gray-700",
                                                            "text-gray-600 hover:text-gray-300"
                                                        )}`}
                                                        onClick={() =>
                                                            setReplyingTo(
                                                                replyingTo === comment.id ? null : comment.id
                                                            )
                                                        }
                                                    >
                                                        <Reply className="h-3 w-3" />
                                                        Reply
                                                        {replies.length > 0 && (
                                                            <span className="text-primary">{replies.length}</span>
                                                        )}
                                                    </button>

                                                    {/* Tick-only resolve button */}
                                                    <button
                                                        title="Mark as resolved"
                                                        className={`flex items-center justify-center h-5 w-5 rounded-full transition-colors ${t(
                                                            "text-gray-300 hover:text-emerald-500 hover:bg-emerald-50",
                                                            "text-gray-700 hover:text-emerald-400 hover:bg-emerald-900/30"
                                                        )}`}
                                                        onClick={() =>
                                                            handleResolveComment(comment.cellKey, comment.id)
                                                        }
                                                    >
                                                        <Check className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* ── Replies — Reddit-style left border ── */}
                                    {replies.length > 0 && (
                                        <div
                                            className={`mt-2.5 ml-[34px] pl-3 border-l-2 space-y-2.5 ${t(
                                                "border-gray-200",
                                                "border-gray-700"
                                            )}`}
                                        >
                                            {replies.map((reply, i) => (
                                                <div key={i} className="flex items-start gap-2">
                                                    <Avatar
                                                        name={reply.author ?? "?"}
                                                        color={reply.color ?? "#6b7280"}
                                                        size="sm"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-1.5 mb-0.5">
                                                            <span
                                                                className={`text-[11px] font-semibold ${t(
                                                                    "text-gray-700",
                                                                    "text-gray-300"
                                                                )}`}
                                                            >
                                                                {reply.author ?? "Unknown"}
                                                            </span>
                                                            <span
                                                                className={`text-[10px] ${t(
                                                                    "text-gray-400",
                                                                    "text-gray-600"
                                                                )}`}
                                                            >
                                                                {reply.createdAt
                                                                    ? timeAgo(reply.createdAt)
                                                                    : reply.timestamp}
                                                            </span>
                                                        </div>
                                                        <p
                                                            className={`text-[11.5px] leading-relaxed ${t(
                                                                "text-gray-600",
                                                                "text-gray-400"
                                                            )}`}
                                                        >
                                                            {reply.text}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* ── Reply input — Reddit-style left border ── */}
                                    {replyingTo === comment.id && (
                                        <div
                                            className={`mt-2.5 ml-[34px] pl-3 border-l-2 ${t(
                                                "border-primary/40",
                                                "border-primary/30"
                                            )}`}
                                        >
                                            <div
                                                className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 ${t(
                                                    "bg-gray-50 border border-gray-200 focus-within:border-primary/50",
                                                    "bg-gray-900 border border-gray-700 focus-within:border-primary/40"
                                                )}`}
                                            >
                                                <input
                                                    autoFocus
                                                    value={replyText[comment.id] || ""}
                                                    onChange={(e) =>
                                                        setReplyText((prev) => ({
                                                            ...prev,
                                                            [comment.id]: e.target.value,
                                                        }))
                                                    }
                                                    placeholder="Reply…"
                                                    className={`flex-1 text-[12px] bg-transparent outline-none placeholder:text-gray-400 ${t(
                                                        "text-gray-700",
                                                        "text-gray-200"
                                                    )}`}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter" && replyText[comment.id]?.trim()) {
                                                            handleReply(comment.cellKey, comment.id);
                                                            setReplyingTo(null);
                                                        }
                                                        if (e.key === "Escape") setReplyingTo(null);
                                                    }}
                                                />
                                                <button
                                                    disabled={!replyText[comment.id]?.trim()}
                                                    className="text-primary hover:opacity-70 disabled:opacity-30 transition-opacity shrink-0"
                                                    onClick={() => {
                                                        if (replyText[comment.id]?.trim()) {
                                                            handleReply(comment.cellKey, comment.id);
                                                            setReplyingTo(null);
                                                        }
                                                    }}
                                                >
                                                    <Send className="h-3 w-3" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── Bottom input ── */}
            <div
                className={`shrink-0 border-t px-3 py-3 ${t(
                    "border-gray-100 bg-white",
                    "border-gray-800 bg-gray-950"
                )}`}
            >
                {activeCommentCell ? (
                    <p
                        className={`text-[10px] font-medium mb-2 flex items-center gap-1.5 ${t(
                            "text-gray-400",
                            "text-gray-500"
                        )}`}
                    >
                        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                        {formatCellLabel(activeCommentCell)}
                    </p>
                ) : (
                    <p className={`text-[10px] mb-2 ${t("text-gray-400", "text-gray-600")}`}>
                        Select a cell to comment
                    </p>
                )}
                <div
                    className={`flex items-center gap-2 rounded-xl px-3 py-2 transition-colors ${t(
                        "border border-gray-200 bg-gray-50 focus-within:border-primary/50 focus-within:bg-white",
                        "border border-gray-700 bg-gray-900 focus-within:border-primary/40"
                    )}`}
                >
                    <input
                        value={newCommentText}
                        onChange={(e) => setNewCommentText(e.target.value)}
                        placeholder={
                            activeCommentCell ? "Add a comment…" : "Select a cell first"
                        }
                        disabled={!activeCommentCell}
                        className={`flex-1 text-[12px] bg-transparent outline-none placeholder:text-gray-400 disabled:cursor-not-allowed ${t(
                            "text-gray-700",
                            "text-gray-200"
                        )}`}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && activeCommentCell && newCommentText.trim()) {
                                handleAddComment(activeCommentCell);
                            }
                        }}
                    />
                    <button
                        disabled={!newCommentText.trim() || !activeCommentCell}
                        className="h-6 w-6 rounded-lg bg-primary flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-85 transition-all shrink-0 active:scale-95"
                        onClick={() =>
                            activeCommentCell && handleAddComment(activeCommentCell)
                        }
                    >
                        <Send className="h-3 w-3 text-white" />
                    </button>
                </div>
            </div>
        </div>
    );
}