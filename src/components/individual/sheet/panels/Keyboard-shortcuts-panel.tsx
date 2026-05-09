"use client";

import { Keyboard } from "lucide-react";

interface KeyboardShortcutsPanelProps {
  isDark: boolean;
}

const shortcutGroups = [
  {
    group: "Navigation",
    items: [
      ["Arrow keys", "Move between cells"],
      ["Tab", "Next cell"],
      ["Enter", "Confirm and move down"],
      ["Esc", "Cancel edit"],
    ],
  },
  {
    group: "Edit",
    items: [
      ["Ctrl+Z", "Undo"],
      ["Ctrl+Y", "Redo"],
      ["Ctrl+C", "Copy"],
      ["Ctrl+X", "Cut"],
      ["Ctrl+V", "Paste"],
      ["Delete", "Clear cell"],
    ],
  },
  {
    group: "Format",
    items: [
      ["Ctrl+B", "Bold"],
      ["Ctrl+I", "Italic"],
      ["Ctrl+U", "Underline"],
    ],
  },
  {
    group: "View",
    items: [
      ["Ctrl+F", "Search"],
      ["Ctrl+Shift+F", "Filters"],
    ],
  },
];

export default function KeyboardShortcutsPanel({
  isDark,
}: KeyboardShortcutsPanelProps) {
  return (
    <div
      className={`h-full overflow-y-auto p-4 space-y-5 sheet-scrollbar ${
        isDark ? "text-gray-200" : "text-gray-800"
      }`}
    >
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Keyboard className="h-4 w-4 text-primary" />
        Keyboard Shortcuts
      </div>
      {shortcutGroups.map((group) => (
        <section key={group.group} className="space-y-2">
          <h3
            className={`text-[10px] uppercase tracking-wider ${
              isDark ? "text-gray-500" : "text-gray-400"
            }`}
          >
            {group.group}
          </h3>
          <div className="space-y-1.5">
            {group.items.map(([key, desc]) => (
              <div key={key} className="flex items-center justify-between gap-3">
                <span className="text-xs">{desc}</span>
                <kbd
                  className={`text-[10px] font-mono border px-2 py-0.5 rounded ${
                    isDark
                      ? "bg-gray-900 border-gray-700 text-gray-300"
                      : "bg-gray-100 border-gray-200 text-gray-700"
                  }`}
                >
                  {key}
                </kbd>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
