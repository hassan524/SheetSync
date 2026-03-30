import { Button } from "@/components/ui/button";
import { Play, RotateCcw, Clock } from "lucide-react";
import { toast } from "sonner";

type HistoryItem = {
    id: string;
    user: string;
    color: string;
    action: string;
    detail: string;
    timestamp: string;
};

interface HistoryPanelProps {
    isDark: boolean;
    history: HistoryItem[];
    setShowPlayback: (show: boolean) => void;
}

export default function HistoryPanel({
    isDark, history, setShowPlayback,
}: HistoryPanelProps) {
    return (
        <div className="flex flex-col h-full">
            {/* Header actions */}
            <div className={`flex items-center justify-between px-4 py-2.5 border-b shrink-0 ${isDark ? "border-gray-800 bg-gray-900/40" : "border-gray-100 bg-gray-50/60"}`}>
                <span className={`text-[11px] ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                    <Clock className="h-3 w-3 inline mr-1 opacity-60" />
                    {history.length} changes today
                </span>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[11px] px-2.5 gap-1.5 text-primary hover:text-primary hover:bg-primary/8 rounded-lg font-medium"
                    onClick={() => setShowPlayback(true)}
                >
                    <Play className="h-2.5 w-2.5 fill-current" /> Playback
                </Button>
            </div>

            {/* Scrollable timeline */}
            <div className="flex-1 overflow-y-auto min-h-0">
                <div className="p-3">
                    {history.map((item, i) => (
                        <div key={item.id} className="flex gap-3 group">
                            {/* Timeline spine */}
                            <div className="flex flex-col items-center shrink-0">
                                <div
                                    className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 ring-2 ring-offset-2 transition-transform group-hover:scale-105"
                                    style={{
                                        backgroundColor: item.color,
                                        ringColor: isDark ? "#1f2937" : "#ffffff",
                                    }}
                                >
                                    {item.user === "You" ? "Y" : item.user.split(" ").map(n => n[0]).join("")}
                                </div>
                                {i < history.length - 1 && (
                                    <div className={`w-px flex-1 my-1 min-h-[20px] ${isDark ? "bg-gray-800" : "bg-gray-100"}`} />
                                )}
                            </div>

                            {/* Content */}
                            <div className={`flex-1 min-w-0 pb-4 ${i === history.length - 1 ? "pb-2" : ""}`}>
                                <div className={`rounded-xl border p-2.5 transition-all group-hover:shadow-sm ${isDark ? "border-gray-700/50 bg-gray-900/50 group-hover:border-gray-600" : "border-gray-100 bg-white group-hover:border-gray-200 group-hover:shadow-sm"}`}>
                                    <div className="flex items-start justify-between gap-2 mb-1">
                                        <span className={`text-[11px] font-semibold ${isDark ? "text-gray-200" : "text-gray-800"}`}>{item.user}</span>
                                        <span className={`text-[10px] shrink-0 ${isDark ? "text-gray-600" : "text-gray-400"}`}>{item.timestamp}</span>
                                    </div>
                                    <p className={`text-[12px] font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>{item.action}</p>
                                    <p className={`text-[11px] mt-0.5 ${isDark ? "text-gray-500" : "text-gray-400"}`}>{item.detail}</p>
                                    <button
                                        className={`mt-2 text-[10px] flex items-center gap-1 font-medium transition-colors opacity-0 group-hover:opacity-100 ${isDark ? "text-primary/70 hover:text-primary" : "text-primary/60 hover:text-primary"}`}
                                        onClick={() => toast.info("Restore to this version — coming soon")}
                                    >
                                        <RotateCcw className="h-2.5 w-2.5" /> Restore this version
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Bottom spacer */}
                    <div className="h-2" />
                </div>
            </div>
        </div>
    );
}