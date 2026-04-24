"use client";

import { Copy, KeyRound, Webhook, BarChart3, Zap, CheckCircle2, Circle, Check } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

const DUMMY_HISTORY_COUNT = 6;

interface DeveloperPanelProps {
    isDark: boolean;
    sheetId: string;
    rows: any[];
    columns: any[];
    totalComments: number;
}

// ── JSON Token renderer ────────────────────────
function JsonValue({ value }: { value: any }) {
    if (typeof value === "string") {
        return <span style={{ color: "#a3c98c" }}>"{value}"</span>;
    }
    if (typeof value === "number") {
        return <span style={{ color: "#79b8ff" }}>{value}</span>;
    }
    if (typeof value === "boolean") {
        return <span style={{ color: "#f97583" }}>{String(value)}</span>;
    }
    if (value === null) {
        return <span style={{ color: "#f97583" }}>null</span>;
    }
    return <span style={{ color: "#e6edf3" }}>{String(value)}</span>;
}

function JsonBlock({ data }: { data: Record<string, any> }) {
    const entries = Object.entries(data);
    return (
        <div
            className="rounded-xl overflow-hidden text-[11px] font-mono leading-relaxed"
            style={{ background: "#30302E" }}
        >
            {/* Toolbar */}
            <div
                className="flex items-center justify-between px-3 py-2 border-b"
                style={{ borderColor: "rgba(255,255,255,0.06)" }}
            >
                <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#ff5f57" }} />
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#febc2e" }} />
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#28c840" }} />
                </div>
                <span style={{ color: "rgba(255,255,255,0.2)", fontSize: "10px" }}>response · 200 OK</span>
                <span style={{ color: "rgba(255,255,255,0.15)", fontSize: "10px" }}>application/json</span>
            </div>
            {/* Code */}
            <div className="px-4 py-3">
                <span style={{ color: "rgba(255,255,255,0.3)" }}>{"{"}</span>
                {entries.map(([key, val], i) => (
                    <div key={key} className="pl-4">
                        <span style={{ color: "#79b8ff" }}>"{key}"</span>
                        <span style={{ color: "rgba(255,255,255,0.3)" }}>: </span>
                        <JsonValue value={val} />
                        {i < entries.length - 1 && <span style={{ color: "rgba(255,255,255,0.3)" }}>,</span>}
                    </div>
                ))}
                <span style={{ color: "rgba(255,255,255,0.3)" }}>{"}"}</span>
            </div>
        </div>
    );
}

function CodeLine({ method, path }: { method: string; path: string }) {
    return (
        <div
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[11px] font-mono"
            style={{ background: "#30302E" }}
        >
            <span
                className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                style={{ background: "rgba(var(--primary-rgb, 13,124,95), 0.25)", color: "var(--primary, #0d7c5f)" }}
            >
                {method}
            </span>
            <span style={{ color: "rgba(255,255,255,0.5)" }}>{path}</span>
        </div>
    );
}

// ── Section wrapper ────────────────────────────
function Section({ icon: Icon, title, isDark, children }: {
    icon: any; title: string; isDark: boolean; children: React.ReactNode;
}) {
    return (
        <div className={`rounded-xl border overflow-hidden ${isDark ? "border-gray-700/50 bg-gray-900/40" : "border-gray-200 bg-white"}`}>
            <div className={`px-3 py-2 border-b flex items-center gap-2 ${isDark ? "border-gray-700/50 bg-gray-800/40" : "border-gray-100 bg-gray-50"}`}>
                <Icon className="h-3.5 w-3.5 text-primary" />
                <span className={`text-[11px] font-semibold ${isDark ? "text-gray-300" : "text-gray-600"}`}>{title}</span>
            </div>
            {children}
        </div>
    );
}

export default function DeveloperPanel({
    isDark, sheetId, rows, columns, totalComments,
}: DeveloperPanelProps) {
    const [copied, setCopied] = useState(false);

    const copy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success("Copied!");
        setTimeout(() => setCopied(false), 2000);
    };

    const id = sheetId || "sheet_abc123def456";

    const responseData = {
        id,
        title: "My Sheet",
        rows: rows.length,
        columns: columns.length,
        comments: totalComments,
        starred: false,
        status: "ok",
    };

    const automations = [
        { label: "Auto-sort on edit", enabled: false },
        { label: "Slack notify on new row", enabled: true },
        { label: "Email digest daily", enabled: false },
    ];

    const webhookEvents = [
        { event: "on_row_created", desc: "Fires when a row is added" },
        { event: "on_row_updated", desc: "Fires when a cell is edited" },
        { event: "on_row_deleted", desc: "Fires when rows are removed" },
        { event: "on_cell_edited", desc: "Fires on any cell change" },
    ];

    return (
        <div className="flex flex-col h-full">
            <style>{`
                .dev-scroll::-webkit-scrollbar { display: none; }
                .dev-scroll { scrollbar-width: none; }
            `}</style>

            <div className="dev-scroll flex-1 overflow-y-auto min-h-0">
                <div className="p-3 space-y-3">

                    {/* ── Stats ── */}
                    <Section icon={BarChart3} title="Sheet stats" isDark={isDark}>
                        <div className="grid grid-cols-4 divide-x divide-gray-100 dark:divide-gray-800">
                            {[
                                { v: rows.length, l: "Rows" },
                                { v: columns.length, l: "Cols" },
                                { v: totalComments, l: "Comments" },
                                { v: DUMMY_HISTORY_COUNT, l: "Edits" },
                            ].map(s => (
                                <div key={s.l} className="flex flex-col items-center py-3">
                                    <span className="text-[18px] font-bold text-primary leading-none">{s.v}</span>
                                    <span className={`text-[10px] mt-0.5 ${isDark ? "text-gray-600" : "text-gray-400"}`}>{s.l}</span>
                                </div>
                            ))}
                        </div>
                    </Section>

                    {/* ── API ── */}
                    <Section icon={KeyRound} title="API access" isDark={isDark}>
                        <div className="p-3 space-y-3">
                            {/* Sheet ID */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className={`text-[10px] font-semibold uppercase tracking-wider ${isDark ? "text-gray-500" : "text-gray-400"}`}>Sheet ID</span>
                                    <button
                                        className={`text-[10px] flex items-center gap-1 transition-colors font-medium ${copied ? "text-primary" : isDark ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-600"}`}
                                        onClick={() => copy(id)}
                                    >
                                        {copied ? <><Check className="h-2.5 w-2.5" /> Copied</> : <><Copy className="h-2.5 w-2.5" /> Copy</>}
                                    </button>
                                </div>
                                <div
                                    className="px-3 py-2 rounded-xl font-mono text-[11px] truncate"
                                    style={{ background: "#30302E", color: "rgba(255,255,255,0.55)" }}
                                >
                                    <span style={{ color: "#a3c98c" }}>{id}</span>
                                </div>
                            </div>

                            {/* Endpoint */}
                            <div>
                                <span className={`text-[10px] font-semibold uppercase tracking-wider block mb-1.5 ${isDark ? "text-gray-500" : "text-gray-400"}`}>Endpoint</span>
                                <CodeLine method="GET" path={`/api/sheets/${id}`} />
                            </div>

                            {/* Response */}
                            <div>
                                <span className={`text-[10px] font-semibold uppercase tracking-wider block mb-1.5 ${isDark ? "text-gray-500" : "text-gray-400"}`}>Response</span>
                                <JsonBlock data={responseData} />
                            </div>
                        </div>
                    </Section>

                    {/* ── Webhooks ── */}
                    <Section icon={Webhook} title="Webhooks" isDark={isDark}>
                        <div className={`divide-y ${isDark ? "divide-gray-800/60" : "divide-gray-100"}`}>
                            {webhookEvents.map(({ event, desc }) => (
                                <div
                                    key={event}
                                    className={`flex items-start justify-between px-3 py-2.5 gap-3 transition-colors ${isDark ? "hover:bg-gray-800/30" : "hover:bg-gray-50"}`}
                                >
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-1.5 mb-0.5">
                                            <span className="h-1.5 w-1.5 rounded-full bg-primary/50 shrink-0" />
                                            <span className={`text-[11px] font-mono font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>{event}</span>
                                        </div>
                                        <p className={`text-[10px] pl-3 ${isDark ? "text-gray-600" : "text-gray-400"}`}>{desc}</p>
                                    </div>
                                    <button
                                        className={`text-[10px] font-medium shrink-0 mt-0.5 transition-colors ${isDark ? "text-gray-600 hover:text-primary" : "text-gray-400 hover:text-primary"}`}
                                        onClick={() => toast.info("Webhook config — coming soon")}
                                    >
                                        Set up →
                                    </button>
                                </div>
                            ))}
                        </div>
                    </Section>

                    {/* ── Automations ── */}
                    <Section icon={Zap} title="Automations" isDark={isDark}>
                        <div className="p-2 space-y-0.5">
                            {automations.map((rule) => (
                                <div
                                    key={rule.label}
                                    className={`flex items-center justify-between px-2 py-2.5 rounded-lg transition-colors ${isDark ? "hover:bg-gray-800/40" : "hover:bg-gray-50"}`}
                                >
                                    <div className="flex items-center gap-2">
                                        {rule.enabled
                                            ? <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                                            : <Circle className={`h-3.5 w-3.5 shrink-0 ${isDark ? "text-gray-700" : "text-gray-300"}`} />
                                        }
                                        <span className={`text-[11px] ${isDark ? "text-gray-300" : "text-gray-600"} ${!rule.enabled ? "opacity-50" : ""}`}>
                                            {rule.label}
                                        </span>
                                    </div>
                                    <button
                                        className={`w-8 h-4 rounded-full relative transition-colors ${rule.enabled ? "bg-primary/25" : isDark ? "bg-gray-700" : "bg-gray-200"}`}
                                        onClick={() => toast.info("Automations — coming soon")}
                                    >
                                        <div className={`absolute top-0.5 h-3 w-3 rounded-full transition-transform shadow-sm ${
                                            rule.enabled ? "translate-x-4 bg-primary" : `translate-x-0.5 ${isDark ? "bg-gray-500" : "bg-white"}`
                                        }`} />
                                    </button>
                                </div>
                            ))}
                            <button
                                className={`w-full mt-1 py-2 rounded-lg border border-dashed text-[11px] transition-colors ${
                                    isDark
                                        ? "border-gray-700 text-gray-600 hover:border-primary/40 hover:text-primary"
                                        : "border-gray-200 text-gray-400 hover:border-primary/30 hover:text-primary"
                                }`}
                                onClick={() => toast.info("Automation builder — coming soon")}
                            >
                                + Add automation
                            </button>
                        </div>
                    </Section>

                    <div className="h-2" />
                </div>
            </div>
        </div>
    );
}