import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Globe, Copy } from "lucide-react";
import { toast } from "sonner";

interface ShareDialogProps {
    showShareDialog: boolean;
    setShowShareDialog: (show: boolean) => void;
    sheetId: string;
    isDark: boolean;
}

export default function ShareDialog({
    showShareDialog, setShowShareDialog, sheetId, isDark,
}: ShareDialogProps) {
     return (  // ← you're missing this
        // your JSX here
    
   <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Share sheet</DialogTitle>
              <DialogDescription>Invite collaborators or share a link</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input placeholder="Enter email address" className="text-sm" />
                <Select defaultValue="editor">
                  <SelectTrigger className="w-28 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Viewer</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="owner">Owner</SelectItem>
                  </SelectContent>
                </Select>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 text-sm" onClick={() => toast.success("Invite sent!")}>Invite</Button>
              </div>
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
            </div>
          </DialogContent>
        </Dialog>
     )
}