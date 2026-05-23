"use client"

import { useState } from "react";
import { Zap, Clock, Archive, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AutomationPanelProps {
  isDark: boolean;
  selectedCell: { row: number; col: string } | null;
  onRun?: () => void;
}

const DEFAULT_RULES = [
  {
    id: "archive-due",
    label: "Archive overdue rows",
    description: "If a row status becomes overdue or the due date passes, move it to archive.",
    enabled: true,
  },
  {
    id: "reminder-due",
    label: "Send due date reminders",
    description: "Notify stakeholders when a row's due date is approaching.",
    enabled: false,
  },
];

export default function AutomationPanel({ isDark, selectedCell, onRun }: AutomationPanelProps) {
  const [rules, setRules] = useState(DEFAULT_RULES);

  return (
    <div className={`h-full flex flex-col overflow-hidden ${isDark ? "bg-slate-950 text-slate-100" : "bg-white text-slate-900"}`}>
      <div className="px-4 py-3 border-b">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Zap className="h-3.5 w-3.5 text-amber-500" />
          Automation rules
        </div>
        <p className="text-[11px] mt-2 text-muted-foreground">
          Automations are UI-only for now. Select a row or column, then preview the rule.
        </p>
      </div>

      <div className="space-y-3 p-4 overflow-y-auto">
        {rules.map((rule) => (
          <div key={rule.id} className="rounded-xl border border-border p-3 bg-background">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold">{rule.label}</div>
                <div className="text-[11px] text-muted-foreground mt-1">{rule.description}</div>
              </div>
              <Button
                variant={rule.enabled ? "secondary" : "outline"}
                size="sm"
                onClick={() => setRules((prev) => prev.map((item) => item.id === rule.id ? { ...item, enabled: !item.enabled } : item))}
              >
                {rule.enabled ? "Enabled" : "Disabled"}
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t px-4 py-3 flex items-center justify-between text-[11px] text-muted-foreground">
        <div>{selectedCell ? "Selected row has automation context." : "Select a cell to scope rules."}</div>
        {onRun ? (
          <Button size="sm" onClick={onRun} disabled={!selectedCell}>
            Run now
          </Button>
        ) : (
          <Button size="sm" variant="ghost" disabled>
            Coming soon
          </Button>
        )}
      </div>
    </div>
  );
}
