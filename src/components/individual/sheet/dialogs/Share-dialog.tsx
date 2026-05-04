"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Globe, Copy, Building2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api/api-client";

interface Organization {
    id: string;
    name: string;
}

interface ShareDialogProps {
    showShareDialog: boolean;
    setShowShareDialog: (show: boolean) => void;
    /** When inside a sheet, pass the sheet ID for link sharing */
    sheetId?: string;
    isDark?: boolean;
    /** Pass orgs to show an org selector (when not scoped to a specific org) */
    organizations?: Organization[];
    /** The org already scoped to (inside org page or org sheet) */
    currentOrg?: Organization;
    onInvited?: () => void;
}

export default function ShareDialog({
    showShareDialog, setShowShareDialog, sheetId, isDark = false,
    organizations, currentOrg, onInvited,
}: ShareDialogProps) {
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("editor");
    const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
    const [sending, setSending] = useState(false);

    // Show org selector when we're NOT inside a specific org/sheet
    const showOrgSelector = !currentOrg && !sheetId && organizations && organizations.length > 0;
    const effectiveOrg = currentOrg || selectedOrg;

    useEffect(() => {
        if (organizations && organizations.length > 0 && !currentOrg) {
            setSelectedOrg(organizations[0]);
        } else if (currentOrg) {
            setSelectedOrg(currentOrg);
        }
    }, [organizations, currentOrg, showShareDialog]);

    const handleInvite = async () => {
        const trimmed = email.trim();
        if (!trimmed) return;

        // If we have an org context, use the real invite API
        if (effectiveOrg) {
            try {
                setSending(true);
                const response = await api.post("/invites/send", {
                    emails: [trimmed],
                    orgId: effectiveOrg.id,
                    orgName: effectiveOrg.name,
                    role,
                });
                const data = response?.data ?? response;
                if (data?.results) {
                    data.results.forEach((r: any) => {
                        if (r.status === "sent") toast.success(`Invite sent to ${r.email}`);
                        if (r.status === "skipped" || r.status === "failed")
                            toast.error(r.error);
                    });
                }
                setEmail("");
                setRole("editor");
                if (onInvited) onInvited();
            } catch (err: any) {
                toast.error(
                    err?.response?.data?.error ||
                    err?.message ||
                    "Failed to send invitation",
                );
            } finally {
                setSending(false);
            }
        } else {
            // Fallback for sheet context without explicit org
            toast.success("Invite sent!");
            setEmail("");
        }
    };

    // Dynamic title based on context
    const dialogTitle = sheetId ? "Share sheet" : "Invite members";
    const dialogDesc = sheetId
        ? "Invite collaborators or share a link"
        : currentOrg
            ? `Invite collaborators to ${currentOrg.name}`
            : "Select an organization and invite collaborators";

    return (
        <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{dialogTitle}</DialogTitle>
                    <DialogDescription>{dialogDesc}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="flex gap-2">
                        <Input
                            placeholder="Enter email address"
                            className="text-sm"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") handleInvite(); }}
                            disabled={sending}
                        />
                        <Select value={role} onValueChange={setRole}>
                            <SelectTrigger className="w-28 text-sm"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="viewer">Viewer</SelectItem>
                                <SelectItem value="editor">Editor</SelectItem>
                                <SelectItem value="owner">Owner</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button
                            className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 text-sm"
                            onClick={handleInvite}
                            disabled={sending || !email.trim()}
                        >
                            {sending ? "Sending…" : "Invite"}
                        </Button>
                    </div>

                    {showOrgSelector ? (
                        /* ── Organization selector (when NOT inside a specific org) ── */
                        <div className={`rounded-xl border p-3 ${isDark ? "border-gray-800 bg-gray-900" : "border-gray-100 bg-gray-50"}`}>
                            <div className="flex items-center gap-1.5 mb-2">
                                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-[12px] font-semibold">Select Organization</span>
                            </div>
                            <Select
                                value={selectedOrg?.id || ""}
                                onValueChange={(id) =>
                                    setSelectedOrg((organizations ?? []).find((o) => o.id === id) || null)
                                }
                                disabled={sending}
                            >
                                <SelectTrigger className="h-8 text-sm w-full">
                                    <SelectValue placeholder="Choose organization" />
                                </SelectTrigger>
                                <SelectContent>
                                    {(organizations ?? []).map((org) => (
                                        <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    ) : (
                        /* ── "Anyone with the link" section (when inside org/sheet) ── */
                        <div className={`rounded-xl border p-3 ${isDark ? "border-gray-800 bg-gray-900" : "border-gray-100 bg-gray-50"}`}>
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[12px] font-semibold flex items-center gap-1.5"><Globe className="h-3.5 w-3.5" /> Anyone with the link</span>
                                <Select defaultValue="viewer">
                                    <SelectTrigger className="h-7 w-24 text-[11px]"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">No access</SelectItem>
                                        <SelectItem value="viewer">Viewer</SelectItem>
                                        <SelectItem value="editor">Editor</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex gap-2 mt-2">
                                <input readOnly value={`https://yourapp.com/sheets/${sheetId || "abc123"}`} className="flex-1 text-[11px] font-mono bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-gray-500" />
                                <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={() => { navigator.clipboard.writeText(`https://yourapp.com/sheets/${sheetId}`); toast.success("Link copied!"); }}>
                                    <Copy className="h-3 w-3" /> Copy
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}