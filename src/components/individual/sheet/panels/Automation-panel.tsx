"use client";

import { useState } from "react";
import { Archive, Bell, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AutomationActionType, AutomationConditionOperator, AutomationRule, ColumnDef } from "@/types";
import type { ComponentType } from "react";

interface AutomationPanelProps {
  isDark: boolean;
  selectedCell: { row: number; col: string } | null;
  columns: ColumnDef[];
  rules: AutomationRule[];
  onChangeRules: (rules: AutomationRule[]) => void;
  onRun?: () => void;
}

const DEFAULT_RULES = [
  {
    id: "archive-done",
    label: "Archive completed rows",
    description: "When a status-like column becomes Done, Completed, or Finished, set it to Archived.",
    enabled: true,
  },
  {
    id: "reminder-due",
    label: "Mark overdue reminders",
    description: "When a due-date column is in the past, mark the row so the reminder does not repeat.",
    enabled: true,
  },
];

export default function AutomationPanel({
  isDark,
  selectedCell,
  onRun,
}: AutomationPanelProps) {
  const [rules, setRules] = useState(DEFAULT_RULES);

  return (
    <div
      className={`h-full flex flex-col overflow-hidden ${
        isDark ? "bg-slate-950 text-slate-100" : "bg-white text-slate-900"
      }`}
    >
      <div className="px-4 py-3 border-b">
        <p className="text-[11px] text-muted-foreground">
          Enabled rules run after row edits. Select a cell to run checks for that row now.
        </p>
      </div>

      <div className="space-y-3 p-4 overflow-y-auto">
        {rules.map((rule) => {
          const Icon = rule.id === "archive-done" ? Archive : Bell;

          return (
            <div key={rule.id} className="rounded-lg border border-border p-3 bg-background">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Icon className="h-3.5 w-3.5 text-amber-500" />
                    {rule.label}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1">
                    {rule.description}
                  </div>
                </div>
                <Button
                  variant={rule.enabled ? "secondary" : "outline"}
                  size="sm"
                  onClick={() =>
                    setRules((prev) =>
                      prev.map((item) =>
                        item.id === rule.id ? { ...item, enabled: !item.enabled } : item,
                      ),
                    )
                  }
                >
                  {rule.enabled ? "Enabled" : "Disabled"}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t px-4 py-3 flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Clock className="h-3 w-3" />
          {selectedCell ? "Ready for selected row." : "Select a row first."}
        </div>
        <Button size="sm" onClick={onRun} disabled={!selectedCell || !onRun}>
          Run now
        </Button>
      </div>
    </div>
  );
}
