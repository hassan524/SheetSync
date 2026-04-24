import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { History, Play, Pause, SkipBack, SkipForward, ChevronRight, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

type HistoryItem = {
    id: string;
    user: string;
    color: string;
    action: string;
    detail: string;
    timestamp: string;
};

interface PlaybackModalProps {
    showPlayback: boolean;
    setShowPlayback: (show: boolean) => void;
    playbackIndex: number;
    setPlaybackIndex: React.Dispatch<React.SetStateAction<number>>;
    isPlaying: boolean;
    setIsPlaying: (playing: boolean) => void;
}

const DUMMY_HISTORY = [
  { id: "h1", user: "Sarah Chen", color: "#0d7c5f", action: "Edited cell B3", detail: "Changed 'Pending' → 'Active'", timestamp: "2 min ago" },
  { id: "h2", user: "Marcus Webb", color: "#f59e0b", action: "Added row", detail: "Row 12 inserted", timestamp: "14 min ago" },
  { id: "h3", user: "You", color: "#0d7c5f", action: "Formatted column D", detail: "Applied currency format", timestamp: "1h ago" },
  { id: "h4", user: "Priya Nair", color: "#10b981", action: "Edited cell F7", detail: "Changed '42' → '89'", timestamp: "2h ago" },
  { id: "h5", user: "You", color: "#0d7c5f", action: "Added column", detail: "'Status' column added", timestamp: "3h ago" },
  { id: "h6", user: "Tom Okafor", color: "#ef4444", action: "Deleted rows", detail: "Rows 3-5 removed", timestamp: "Yesterday" },
];

export default function PlaybackModal({
    showPlayback, setShowPlayback, playbackIndex,
    setPlaybackIndex, isPlaying, setIsPlaying,
}: PlaybackModalProps) {
     return (  // ← you're missing this
        // your JSX here
    
    <Dialog open={showPlayback} onOpenChange={setShowPlayback}>
        <DialogContent className="max-w-lg">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                    <History className="h-4 w-4 text-primary" /> History Playback
                </DialogTitle>
                <DialogDescription>Step through every change made to this sheet</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
                <div className="relative h-1 bg-gray-100 rounded-full">
                    <div className="absolute left-0 top-0 h-1 bg-primary rounded-full transition-all"
                        style={{ width: `${((playbackIndex + 1) / DUMMY_HISTORY.length) * 100}%` }} />
                    <div className="absolute top-1/2 -translate-y-1/2 h-3 w-3 bg-primary rounded-full border-2 border-white shadow transition-all"
                        style={{ left: `${((playbackIndex + 1) / DUMMY_HISTORY.length) * 100}%`, transform: "translate(-50%, -50%)" }} />
                </div>
                <div className="bg-gray-50 rounded-xl p-4 min-h-[80px] flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                            style={{ backgroundColor: DUMMY_HISTORY[playbackIndex].color }}>
                            {DUMMY_HISTORY[playbackIndex].user === "You" ? "Y" : DUMMY_HISTORY[playbackIndex].user.split(" ").map(n => n[0]).join("")}
                        </div>
                        <span className="text-sm font-semibold">{DUMMY_HISTORY[playbackIndex].user}</span>
                        <span className="text-xs text-gray-400">{DUMMY_HISTORY[playbackIndex].timestamp}</span>
                    </div>
                    <p className="text-sm">{DUMMY_HISTORY[playbackIndex].action}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{DUMMY_HISTORY[playbackIndex].detail}</p>
                </div>
                <div className="flex items-center justify-center gap-2">
                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => setPlaybackIndex(0)}>
                        <SkipBack className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => setPlaybackIndex((i) => Math.max(0, i - 1))}>
                        <ArrowLeft className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" className="h-9 w-9 rounded-full bg-primary hover:bg-primary/90" onClick={() => setIsPlaying(!isPlaying)}>
                        {isPlaying ? <Pause className="h-4 w-4 text-primary-foreground" /> : <Play className="h-4 w-4 text-primary-foreground" />}
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => setPlaybackIndex((i) => Math.min(DUMMY_HISTORY.length - 1, i + 1))}>
                        <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => setPlaybackIndex(DUMMY_HISTORY.length - 1)}>
                        <SkipForward className="h-3.5 w-3.5" />
                    </Button>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>{playbackIndex + 1} / {DUMMY_HISTORY.length}</span>
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-primary hover:text-primary/80"
                        onClick={() => { setShowPlayback(false); toast.info("Restore to this version — coming soon"); }}>
                        Restore this version
                    </Button>
                </div>
            </div>
        </DialogContent>
    </Dialog>
     )
}