import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Keyboard } from "lucide-react";

interface KeyboardShortcutsModalProps {
    showKeyboardShortcuts: boolean;
    setShowKeyboardShortcuts: (show: boolean) => void;
}

  const shortcutGroups = [
    { group: "Navigation", items: [["↑↓←→", "Move between cells"], ["Tab", "Next cell"], ["Enter", "Confirm & move down"], ["Esc", "Cancel edit"]] },
    { group: "Edit", items: [["Ctrl+Z", "Undo"], ["Ctrl+Y", "Redo"], ["Ctrl+C", "Copy"], ["Ctrl+X", "Cut"], ["Ctrl+V", "Paste"], ["Delete", "Clear cell"]] },
    { group: "Format", items: [["Ctrl+B", "Bold"], ["Ctrl+I", "Italic"], ["Ctrl+U", "Underline"]] },
    { group: "View", items: [["Ctrl+F", "Search"], ["Ctrl+/", "Keyboard shortcuts"], ["Ctrl+Shift+F", "Filters"]] },
  ];

export default function KeyboardShortcutsDialog({
    showKeyboardShortcuts, setShowKeyboardShortcuts,
}: KeyboardShortcutsModalProps) {
    return (  // ← you're missing this
        // your JSX here
    <Dialog open={showKeyboardShortcuts} onOpenChange={setShowKeyboardShortcuts}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Keyboard className="h-4 w-4 text-primary" /> Keyboard Shortcuts</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-6">
              {shortcutGroups.map((group) => (
                <div key={group.group}>
                  <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">{group.group}</h3>
                  <div className="space-y-2">
                    {group.items.map(([key, desc]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{desc}</span>
                        <kbd className="text-[11px] font-mono bg-gray-100 border border-gray-200 px-2 py-0.5 rounded text-gray-700">{key}</kbd>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
    );  

}