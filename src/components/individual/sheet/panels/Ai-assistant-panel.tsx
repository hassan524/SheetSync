"use client"

import { Sparkles, FileText, Search, Columns, CircleDashed } from "lucide-react";

interface AiAssistantPanelProps {
  isDark: boolean;
}

const SUGGESTIONS = [
  { icon: FileText, label: "Create sheet from prompt" },
  { icon: Search, label: "Analyze data" },
  { icon: Columns, label: "Suggest columns" },
  { icon: CircleDashed, label: "Find duplicates" },
  { icon: Sparkles, label: "Summarize table" },
  { icon: FileText, label: "Generate formulas" },
];

export default function AiAssistantPanel({ isDark }: AiAssistantPanelProps) {
  return (
    <div className={`h-full flex flex-col overflow-hidden ${isDark ? "bg-slate-950 text-slate-100" : "bg-white text-slate-900"}`}>
      <div className="px-4 py-3 border-b">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-fuchsia-500" />
          AI assistant
        </div>
        <p className="text-[11px] mt-2 text-muted-foreground">
          Coming soon: use prompts to create sheets, analyze values, generate formulas, and more.
        </p>
      </div>

      <div className="p-4 space-y-3 overflow-y-auto">
        {SUGGESTIONS.map((suggestion) => {
          const Icon = suggestion.icon;
          return (
            <button key={suggestion.label} className="w-full flex items-center gap-3 rounded-xl border border-border p-3 text-left transition hover:border-primary/40 hover:bg-primary/5" disabled>
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-4 w-4" />
              </span>
              <div>
                <div className="text-sm font-medium">{suggestion.label}</div>
                <div className="text-[11px] text-muted-foreground">UI preview only</div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="border-t px-4 py-3 text-[11px] text-muted-foreground">
        AI features are placeholders right now; backend integration can be added later.
      </div>
    </div>
  );
}
