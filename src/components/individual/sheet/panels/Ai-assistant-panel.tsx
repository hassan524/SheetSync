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
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Assistant Bubble */}
        <div className="flex gap-2.5 items-start">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 to-indigo-500 text-white shadow-md shadow-fuchsia-500/10">
            <Bot className="h-3.5 w-3.5" />
          </span>
          <div className={`max-w-[85%] rounded-2xl rounded-tl-none px-3.5 py-2.5 text-xs leading-relaxed shadow-sm border ${
            isDark ? "border-slate-800 bg-slate-900/60 text-slate-100" : "border-gray-100 bg-gray-50 text-gray-800"
          }`}>
            AI chat for sheet creation, analysis, formulas, and cleanup is coming soon.
          </div>
        </div>

        {/* User Bubble */}
        <div className="flex justify-end gap-2.5 items-start opacity-70">
          <div className={`max-w-[85%] rounded-2xl rounded-tr-none px-3.5 py-2.5 text-xs leading-relaxed shadow-md ${
            isDark ? "bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-indigo-950/20" : "bg-gradient-to-br from-violet-500 to-indigo-500 text-white"
          }`}>
            Create a sales tracker with status, due date, and owner columns.
          </div>
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-800 text-slate-200">
            <User className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>

      {/* Input Bar */}
      <div className={`border-t p-3 ${isDark ? "border-slate-800 bg-slate-950" : "border-gray-100 bg-white"}`}>
        <div className={`flex items-center gap-2 rounded-2xl border px-3 py-2 transition-all ${
          isDark ? "border-slate-800 bg-slate-900/40 focus-within:border-fuchsia-500/50 focus-within:ring-2 focus-within:ring-fuchsia-500/10" : "border-gray-200 bg-gray-50 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10"
        }`}>
          <Lock className="h-3.5 w-3.5 text-muted-foreground" />
          <input
            disabled
            placeholder="AI chat coming soon"
            className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed text-foreground"
          />
          <Button disabled size="icon" className="h-7 w-7 rounded-lg bg-gradient-to-r from-fuchsia-500 to-indigo-500 text-white opacity-50">
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
