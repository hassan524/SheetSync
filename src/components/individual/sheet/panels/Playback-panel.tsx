import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { History, Play, Pause, SkipBack, SkipForward, ChevronRight, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import type { HistoryEntry } from "@/lib/querys/sheet/firebase-realtime";

interface PlaybackModalProps {
    showPlayback: boolean;
    setShowPlayback: (show: boolean) => void;
    playbackIndex: number;
    setPlaybackIndex: React.Dispatch<React.SetStateAction<number>>;
    isPlaying: boolean;
    setIsPlaying: (playing: boolean) => void;
    history: HistoryEntry[];
}

export default function PlaybackModal({
    showPlayback, setShowPlayback, playbackIndex,
    setPlaybackIndex, isPlaying, setIsPlaying, history
}: PlaybackModalProps) {
    const total = history.length;
    const safeIndex = total === 0 ? 0 : Math.min(Math.max(playbackIndex, 0), total - 1);
    const current = history[safeIndex];
    const progress = total === 0 ? 0 : Math.round(((safeIndex + 1) / total) * 100);

    const getInitials = (name: string) => {
        if (!name) return "?";
        if (name === "You") return "Y";
        return name.split(" ").filter(Boolean).map((n: string) => n[0]).join("").toUpperCase();
    };

    const stop = () => setIsPlaying(false);

    return (
        <Dialog open={showPlayback} onOpenChange={(open) => {
            if (!open) { stop(); setShowPlayback(false); }
        }}>
            <DialogContent className="max-w-md w-full">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-sm">
                        <History className="h-4 w-4 text-primary" /> History Playback
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                        Step through every change made to this sheet
                    </DialogDescription>
                </DialogHeader>

                {total === 0 ? (
                    <div className="text-center py-10 text-sm text-gray-400">No history yet</div>
                ) : (
                    <div className="space-y-4 pt-1">

                        {/* Progress bar */}
                        <div className="space-y-1">
                            <div className="relative h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="absolute left-0 top-0 h-full bg-primary rounded-full transition-all duration-200"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <div className="flex justify-between text-[10px] text-gray-400">
                                <span>Start</span>
                                <span>{safeIndex + 1} of {total}</span>
                                <span>End</span>
                            </div>
                        </div>

                        {/* Current entry card */}
                        <div className="bg-gray-50 rounded-xl p-4 min-h-[100px] flex flex-col justify-center border border-gray-100">
                            {current ? (
                                <>
                                    <div className="flex items-center gap-2 mb-2">
                                        <div
                                            className="h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                                            style={{ backgroundColor: current.userColor ?? "#6b7280" }}
                                        >
                                            {getInitials(current.userName ?? "")}
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-[12px] font-semibold text-gray-800 leading-tight">
                                                {current.userName ?? "Unknown"}
                                            </span>
                                            <span className="text-[10px] text-gray-400">{current.createdAt ?? ""}</span>
                                        </div>
                                    </div>
                                    <p className="text-[12px] font-medium text-gray-700 capitalize">
                                        {String(current.action ?? "").replace(/_/g, " ")}
                                    </p>
                                    <p className="text-[11px] text-gray-500 mt-0.5 break-words">
                                        {current.detail ?? ""}
                                    </p>
                                </>
                            ) : (
                                <p className="text-sm text-gray-400 text-center">No entry</p>
                            )}
                        </div>

                        {/* Controls */}
                        <div className="flex items-center justify-center gap-2">
                            <Button
                                variant="outline" size="icon"
                                className="h-8 w-8 rounded-full"
                                disabled={safeIndex === 0}
                                onClick={() => { stop(); setPlaybackIndex(0); }}
                            >
                                <SkipBack className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                                variant="outline" size="icon"
                                className="h-8 w-8 rounded-full"
                                disabled={safeIndex === 0}
                                onClick={() => { stop(); setPlaybackIndex((i) => Math.max(0, i - 1)); }}
                            >
                                <ArrowLeft className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                                size="icon"
                                className="h-10 w-10 rounded-full bg-primary hover:bg-primary/90 transition-all active:scale-95"
                                onClick={() => setIsPlaying(!isPlaying)}
                            >
                                {isPlaying
                                    ? <Pause className="h-4 w-4 text-white" />
                                    : <Play className="h-4 w-4 text-white" />}
                            </Button>
                            <Button
                                variant="outline" size="icon"
                                className="h-8 w-8 rounded-full"
                                disabled={safeIndex === total - 1}
                                onClick={() => { stop(); setPlaybackIndex((i) => Math.min(total - 1, i + 1)); }}
                            >
                                <ChevronRight className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                                variant="outline" size="icon"
                                className="h-8 w-8 rounded-full"
                                disabled={safeIndex === total - 1}
                                onClick={() => { stop(); setPlaybackIndex(total - 1); }}
                            >
                                <SkipForward className="h-3.5 w-3.5" />
                            </Button>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                            <span className="text-[11px] text-gray-400">
                                Change {safeIndex + 1} of {total}
                            </span>
                            <Button
                                variant="ghost" size="sm"
                                className="h-7 text-xs text-primary hover:text-primary/80"
                                onClick={() => {
                                    stop();
                                    setShowPlayback(false);
                                    toast.info("Restore to this version — coming soon");
                                }}
                            >
                                Restore this version
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}