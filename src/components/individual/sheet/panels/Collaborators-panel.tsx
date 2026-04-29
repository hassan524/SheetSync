import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Radio, Plus, MoreHorizontal, Wifi, WifiOff, Clock } from "lucide-react";
import { toast } from "sonner";
import type { OrgMember } from "@/lib/querys/organization/get-sheet-members";

// Deterministic color for a user based on their ID
const MEMBER_COLORS = [
    "#0d7c5f", "#f59e0b", "#10b981", "#ef4444",
    "#6366f1", "#ec4899", "#14b8a6", "#f97316",
    "#8b5cf6", "#06b6d4",
];

function getMemberColor(id: string): string {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return MEMBER_COLORS[Math.abs(hash) % MEMBER_COLORS.length];
}

function getInitials(name: string): string {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface CollaboratorsPanelProps {
    isDark: boolean;
    liveTracking: boolean;
    isOrganizationSheet: boolean;
    setLiveTracking: (value: boolean) => void;
    setShowShareDialog: (value: boolean) => void;
    members: OrgMember[];
}

export default function CollaboratorsPanel({
    isDark, liveTracking, isOrganizationSheet,
    setLiveTracking, setShowShareDialog,
    members,
}: CollaboratorsPanelProps) {
    const memberCount = members.length;

    return (
        <div className="flex flex-col h-full">
            {/* Live status bar */}
            <div className={`flex items-center justify-between px-4 py-2.5 border-b shrink-0 ${isDark ? "border-gray-800 bg-gray-900/40" : "border-gray-100 bg-gray-50/60"}`}>
                <div className="flex items-center gap-3 text-[11px]">
                    <span className={`flex items-center gap-1.5 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        {memberCount} member{memberCount !== 1 ? "s" : ""}
                    </span>
                </div>
                <span className={`text-[11px] ${isDark ? "text-gray-600" : "text-gray-400"}`}>
                    {memberCount} total
                </span>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto min-h-0">
                <div className="p-3 space-y-3">

                    {/* Live tracking toggle card */}
                    <div className={`rounded-xl border p-3 ${isDark ? "border-gray-700/60 bg-gray-900/60" : "border-gray-200 bg-white shadow-sm"}`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${liveTracking ? "bg-emerald-500/15" : isDark ? "bg-gray-800" : "bg-gray-100"}`}>
                                    {liveTracking
                                        ? <Wifi className="h-3.5 w-3.5 text-emerald-500" />
                                        : <WifiOff className={`h-3.5 w-3.5 ${isDark ? "text-gray-500" : "text-gray-400"}`} />
                                    }
                                </div>
                                <div>
                                    <div className="flex items-center gap-1.5">
                                        <span className={`text-[12px] font-semibold ${isDark ? "text-gray-200" : "text-gray-800"}`}>Live Tracking</span>
                                        {!isOrganizationSheet && (
                                            <Badge variant="outline" className="text-[9px] px-1 h-4 border-primary/30 text-primary">ORG</Badge>
                                        )}
                                    </div>
                                    <p className={`text-[10px] mt-0.5 ${isDark ? "text-gray-600" : "text-gray-400"}`}>
                                        {liveTracking ? "Showing live cursors" : "Enable to see collaborators"}
                                    </p>
                                </div>
                            </div>
                            <button
                                className={`w-10 h-5 rounded-full transition-all relative shrink-0 ${
                                    liveTracking ? "bg-emerald-500" : isDark ? "bg-gray-700" : "bg-gray-200"
                                } ${!isOrganizationSheet ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                                onClick={() => isOrganizationSheet && setLiveTracking(!liveTracking)}
                                disabled={!isOrganizationSheet}
                            >
                                <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${liveTracking ? "translate-x-5" : "translate-x-0.5"}`} />
                            </button>
                        </div>
                        {!isOrganizationSheet && (
                            <p className={`text-[11px] mt-2.5 leading-relaxed ${isDark ? "text-gray-600" : "text-gray-400"}`}>
                                Real-time collaboration is available on Organization sheets.
                            </p>
                        )}
                    </div>

                    {/* Section label */}
                    <div className={`text-[10px] font-semibold uppercase tracking-widest px-0.5 ${isDark ? "text-gray-600" : "text-gray-400"}`}>
                        Members
                    </div>

                    {/* Members list */}
                    <div className="space-y-1.5">
                        {members.length === 0 ? (
                            <div className={`text-center py-6 text-xs ${isDark ? "text-gray-600" : "text-gray-400"}`}>
                                No members yet. Invite people to collaborate.
                            </div>
                        ) : (
                            members.map((c) => {
                                const color = getMemberColor(c.id);
                                return (
                                    <div
                                        key={c.id}
                                        className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all group ${
                                            isDark
                                                ? "border-gray-700/50 bg-gray-900/40 hover:border-gray-600 hover:bg-gray-900/80"
                                                : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm"
                                        }`}
                                    >
                                        {/* Avatar */}
                                        <div className="relative shrink-0">
                                            {c.avatar_url ? (
                                                <img
                                                    src={c.avatar_url}
                                                    alt={c.name}
                                                    className="h-8 w-8 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div
                                                    className="h-8 w-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white"
                                                    style={{ backgroundColor: color }}
                                                >
                                                    {getInitials(c.name)}
                                                </div>
                                            )}
                                            <div className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 ${isDark ? "border-gray-950" : "border-white"} bg-emerald-400`} />
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <span className={`text-[12px] font-semibold truncate ${isDark ? "text-gray-200" : "text-gray-800"}`}>{c.name}</span>
                                                <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-medium shrink-0 capitalize ${
                                                    c.role === "owner" ? "bg-primary/10 text-primary"
                                                    : c.role === "admin" ? "bg-purple-50 text-purple-600"
                                                    : c.role === "editor" ? isDark ? "bg-blue-900/40 text-blue-400" : "bg-blue-50 text-blue-600"
                                                    : isDark ? "bg-gray-800 text-gray-400" : "bg-gray-100 text-gray-500"
                                                }`}>{c.role}</span>
                                            </div>
                                            <p className={`text-[10px] mt-0.5 truncate ${isDark ? "text-gray-600" : "text-gray-400"}`}>
                                                {c.email}
                                            </p>
                                        </div>

                                        {/* Actions */}
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className={`h-6 w-6 rounded-md opacity-0 group-hover:opacity-100 transition-opacity ${isDark ? "hover:bg-gray-800" : "hover:bg-gray-100"}`}
                                                >
                                                    <MoreHorizontal className="h-3.5 w-3.5" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-36">
                                                <DropdownMenuItem className="text-xs">Change role</DropdownMenuItem>
                                                <DropdownMenuItem className="text-xs text-red-500">Remove</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Invite button */}
                    <Button
                        className="w-full h-8 text-xs rounded-xl gap-1.5 font-medium"
                        onClick={() => setShowShareDialog(true)}
                    >
                        <Plus className="h-3.5 w-3.5" /> Invite people
                    </Button>

                    <div className="h-2" />
                </div>
            </div>
        </div>
    );
}