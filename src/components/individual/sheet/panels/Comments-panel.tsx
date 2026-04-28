"use client";

import { Button } from "@/components/ui/button";
import { Send, Check, MessageSquare } from "lucide-react";
import { useState } from "react";

type Comment = {
    id: string;
    cellKey: string;
    author: string;
    avatar: string;
    color: string;
    text: string;
    timestamp: string;
    resolved: boolean;
    thread: { author: string; color: string; text: string; timestamp: string }[];
};

interface CommentsPanelProps {
    isDark: boolean;
    comments: Record<string, Comment[]>;
    activeCommentCell: string | null;
    newCommentText: string;
    replyText: Record<string, string>;
    setNewCommentText: (text: string) => void;
    handleAddComment: (cellKey: string) => void;
    handleReply: (cellKey: string, commentId: string) => void;
    handleResolveComment: (cellKey: string, commentId: string) => void;
    setReplyText: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export default function CommentsPanel({
    isDark, comments, activeCommentCell, newCommentText,
    replyText, setNewCommentText, handleAddComment,
    handleReply, handleResolveComment, setReplyText,
}: CommentsPanelProps) {
    const [replyingTo, setReplyingTo] = useState<string | null>(null);

    const totalComments = Object.values(comments).reduce((a, b) => a + b.length, 0);

    return (
        <div className="flex flex-col h-full">
            <style>{`
                .cp-scroll::-webkit-scrollbar { display: none; }
                .cp-scroll { scrollbar-width: none; }
            `}</style>

            {/* Scrollable thread list */}
            <div className="cp-scroll flex-1 overflow-y-auto min-h-0">

                {/* Empty state */}
                {totalComments === 0 && (
                    <div className="flex flex-col items-center justify-center h-full gap-2 pb-16">
                        <MessageSquare className={`h-7 w-7 ${isDark ? "text-gray-800" : "text-gray-200"}`} />
                        <p className={`text-[12px] font-medium ${isDark ? "text-gray-600" : "text-gray-400"}`}>No comments yet</p>
                        <p className={`text-[11px] ${isDark ? "text-gray-700" : "text-gray-400"}`}>
                            Select a cell and type below
                        </p>
                    </div>
                )}

                {/* Thread list */}
                {totalComments > 0 && (
                    <div className="px-4 pt-3 pb-4">
                        {/* Count */}
                        <p className={`text-[11px] font-semibold mb-3 ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                            {totalComments} comment{totalComments !== 1 ? "s" : ""}
                        </p>

                        {Object.entries(comments).map(([cellKey, cellComments]) =>
                            cellComments.map((comment) => (
                                <div
                                    key={comment.id}
                                    className={`py-3.5 border-b last:border-0 ${isDark ? "border-gray-800/60" : "border-gray-100"} ${comment.resolved ? "opacity-40" : ""}`}
                                >
                                    {/* Author */}
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <div
                                            className="h-6 w-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                                            style={{ backgroundColor: comment.color }}
                                        >
                                            {comment.author.split(" ").map(n => n[0]).join("")}
                                        </div>
                                        <span className={`text-[12px] font-semibold ${isDark ? "text-gray-200" : "text-gray-800"}`}>
                                            {comment.author}
                                        </span>
                                        <span className={`text-[10px] ${isDark ? "text-gray-600" : "text-gray-400"}`}>
                                            {comment.timestamp}
                                        </span>
                                        <span className={`ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0 ${isDark ? "bg-gray-800 text-primary" : "bg-primary/8 text-primary border border-primary/15"
                                            }`}>
                                            {`Row ${parseInt(cellKey) + 1} · ${cellKey.substring(cellKey.indexOf("-") + 1)}`}
                                        </span>
                                    </div>

                                    {/* Body */}
                                    <p className={`text-[12.5px] leading-relaxed ml-8 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                                        {comment.text}
                                    </p>

                                    {/* Actions */}
                                    <div className="flex items-center gap-3 ml-8 mt-2">
                                        {!comment.resolved ? (
                                            <>
                                                <button
                                                    className={`text-[11px] font-medium transition-colors ${isDark ? "text-gray-600 hover:text-gray-300" : "text-gray-400 hover:text-gray-700"}`}
                                                    onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                                                >
                                                    Reply
                                                </button>
                                                <button
                                                    className={`text-[11px] font-medium flex items-center gap-1 transition-colors ${isDark ? "text-gray-600 hover:text-primary" : "text-gray-400 hover:text-primary"}`}
                                                    onClick={() => handleResolveComment(cellKey, comment.id)}
                                                >
                                                    <Check className="h-2.5 w-2.5" /> Resolve
                                                </button>
                                            </>
                                        ) : (
                                            <span className={`text-[11px] flex items-center gap-1 ${isDark ? "text-primary/50" : "text-primary/60"}`}>
                                                <Check className="h-2.5 w-2.5" /> Resolved
                                            </span>
                                        )}
                                    </div>

                                    {/* Replies */}
                                    {comment.thread.length > 0 && (
                                        <div className={`ml-8 mt-3 pl-3 border-l-2 space-y-3 ${isDark ? "border-gray-800" : "border-gray-100"}`}>
                                            {comment.thread.map((reply, i) => (
                                                <div key={i}>
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <div
                                                            className="h-4 w-4 rounded-full flex items-center justify-center text-[7px] font-bold text-white shrink-0"
                                                            style={{ backgroundColor: reply.color }}
                                                        >
                                                            {reply.author.split(" ").map(n => n[0]).join("")}
                                                        </div>
                                                        <span className={`text-[11px] font-semibold ${isDark ? "text-gray-300" : "text-gray-700"}`}>{reply.author}</span>
                                                        <span className={`text-[10px] ${isDark ? "text-gray-600" : "text-gray-400"}`}>{reply.timestamp}</span>
                                                    </div>
                                                    <p className={`text-[12px] leading-relaxed ml-6 ${isDark ? "text-gray-400" : "text-gray-600"}`}>{reply.text}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Inline reply */}
                                    {replyingTo === comment.id && (
                                        <div className={`ml-8 mt-3 pl-3 border-l-2 ${isDark ? "border-gray-700" : "border-gray-200"}`}>
                                            <div className="flex gap-2 items-center">
                                                <input
                                                    autoFocus
                                                    value={replyText[comment.id] || ""}
                                                    onChange={(e) => setReplyText(prev => ({ ...prev, [comment.id]: e.target.value }))}
                                                    placeholder="Reply..."
                                                    className={`flex-1 text-[12px] bg-transparent outline-none placeholder:text-gray-400 border-b pb-1 transition-colors ${isDark ? "text-gray-200 border-gray-700 focus:border-primary" : "text-gray-700 border-gray-200 focus:border-primary"
                                                        }`}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") { handleReply(cellKey, comment.id); setReplyingTo(null); }
                                                        if (e.key === "Escape") setReplyingTo(null);
                                                    }}
                                                />
                                                <button
                                                    className="text-primary hover:text-primary/70 transition-colors shrink-0"
                                                    onClick={() => { handleReply(cellKey, comment.id); setReplyingTo(null); }}
                                                >
                                                    <Send className="h-3 w-3" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* ── BOTTOM INPUT BAR ── */}
            <div className={`shrink-0 border-t px-3 py-2.5 ${isDark ? "border-gray-800 bg-gray-950" : "border-gray-100 bg-white"}`}>
                {activeCommentCell && (
                    <p className={`text-[10px] mb-1.5 ${isDark ? "text-gray-600" : "text-gray-400"}`}>
                        Cell{" "}
                        <span className="font-mono font-semibold text-primary">
                            {activeCommentCell.replace("-", String.fromCharCode(65))}
                        </span>
                    </p>
                )}
                <div className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 transition-colors ${isDark
                    ? "border-gray-700 bg-gray-900 focus-within:border-primary/50"
                    : "border-gray-200 bg-gray-50 focus-within:border-primary/40"
                    }`}>
                    <input
                        value={newCommentText}
                        onChange={(e) => setNewCommentText(e.target.value)}
                        placeholder={activeCommentCell ? "Add a comment..." : "Select a cell first"}
                        disabled={!activeCommentCell}
                        className={`flex-1 text-[12px] bg-transparent outline-none placeholder:text-gray-400 ${isDark ? "text-gray-200" : "text-gray-700"
                            }`}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && activeCommentCell && newCommentText.trim()) {
                                handleAddComment(activeCommentCell);
                            }
                        }}
                    />
                    <button
                        disabled={!newCommentText.trim() || !activeCommentCell}
                        className="text-primary disabled:text-gray-300 hover:text-primary/70 transition-colors shrink-0 disabled:cursor-not-allowed"
                        onClick={() => activeCommentCell && handleAddComment(activeCommentCell)}
                    >
                        <Send className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );
}