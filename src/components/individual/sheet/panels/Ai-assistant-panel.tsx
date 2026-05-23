"use client";

import { Bot, Lock, Send, User } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AiAssistantPanelProps {
  isDark: boolean;
}

export default function AiAssistantPanel({ isDark }: AiAssistantPanelProps) {
  return (
    <div
      className={`h-full flex flex-col overflow-hidden ${
        isDark ? "bg-slate-950 text-slate-100" : "bg-white text-slate-900"
      }`}
    >
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div className="flex gap-2">
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Bot className="h-3.5 w-3.5" />
          </span>
          <div className="max-w-[85%] rounded-lg border border-border bg-background px-3 py-2 text-xs">
            AI chat for sheet creation, analysis, formulas, and cleanup is coming soon.
          </div>
        </div>

        <div className="flex justify-end gap-2 opacity-60">
          <div className="max-w-[85%] rounded-lg bg-primary/10 px-3 py-2 text-xs text-primary">
            Create a sales tracker with status, due date, and owner columns.
          </div>
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <User className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>

      <div className={`border-t p-3 ${isDark ? "border-gray-800" : "border-border"}`}>
        <div className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 px-3 py-2">
          <Lock className="h-3.5 w-3.5 text-muted-foreground" />
          <input
            disabled
            placeholder="AI chat coming soon"
            className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
          />
          <Button disabled size="icon" className="h-7 w-7">
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
