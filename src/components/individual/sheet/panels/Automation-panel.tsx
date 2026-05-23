"use client";

import { useMemo, useState } from "react";
import { Archive, Bell, CheckCircle2, Clock, Pin, Plus, Trash2, Zap } from "lucide-react";
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

const OPERATORS: Array<{ value: AutomationConditionOperator; label: string }> = [
  { value: "always", label: "Always" },
  { value: "equals", label: "Equals" },
  { value: "not_equals", label: "Does not equal" },
  { value: "contains", label: "Contains" },
  { value: "empty", label: "Is empty" },
  { value: "not_empty", label: "Is not empty" },
  { value: "gt", label: "Greater than" },
  { value: "gte", label: "Greater or equal" },
  { value: "lt", label: "Less than" },
  { value: "lte", label: "Less or equal" },
  { value: "date_before_today", label: "Date is overdue" },
  { value: "date_in_next_days", label: "Date within days" },
];

const ACTIONS: Array<{ value: AutomationActionType; label: string; icon: ComponentType<{ className?: string }> }> = [
  { value: "notify", label: "Send notification", icon: Bell },
  { value: "update_cell", label: "Update cell", icon: CheckCircle2 },
  { value: "archive_row", label: "Archive row", icon: Archive },
  { value: "pin_row", label: "Pin row", icon: Pin },
];

const buildRule = (columnKey: string): AutomationRule => ({
  id: `automation_${Date.now()}_${Math.random().toString(36).slice(2)}`,
  name: "New automation",
  enabled: true,
  condition: { columnKey, operator: "equals", value: "" },
  actions: [
    {
      id: `action_${Date.now()}`,
      type: "notify",
      message: "Automation matched",
    },
  ],
});

export default function AutomationPanel({
  isDark,
  selectedCell,
  columns,
  rules,
  onChangeRules,
  onRun,
}: AutomationPanelProps) {
  const firstColumnKey = columns[0]?.key ?? "";
  const [draft, setDraft] = useState<AutomationRule>(() => buildRule(selectedCell?.col ?? firstColumnKey));
  const [editingId, setEditingId] = useState<string | null>(null);
  const selectedColumnName = columns.find((column) => column.key === selectedCell?.col)?.name;

  const editingRule = useMemo(
    () => rules.find((rule) => rule.id === editingId) ?? null,
    [editingId, rules],
  );
  const activeDraft = editingRule ?? draft;

  const setActiveDraft = (next: AutomationRule) => {
    if (editingRule) {
      onChangeRules(rules.map((rule) => (rule.id === editingRule.id ? next : rule)));
    } else {
      setDraft(next);
    }
  };

  const saveDraft = () => {
    if (!activeDraft.name.trim()) return;
    if (!activeDraft.condition.columnKey && activeDraft.condition.operator !== "always") return;
    if (editingRule) {
      setEditingId(null);
      return;
    }
    onChangeRules([activeDraft, ...rules]);
    setDraft(buildRule(selectedCell?.col ?? firstColumnKey));
  };

  const selectClass = `h-9 w-full rounded-md border px-2 text-xs outline-none ${
    isDark ? "border-gray-800 bg-gray-950 text-gray-100" : "border-border bg-background text-foreground"
  }`;
  const panelBg = isDark ? "bg-slate-950 text-slate-100" : "bg-white text-slate-900";

  return (
    <div className={`h-full flex flex-col overflow-hidden ${panelBg}`}>
      <div className="px-4 py-3 border-b">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Zap className="h-3.5 w-3.5 text-amber-500" />
          Automation rules
        </div>
        <p className="text-[11px] mt-2 text-muted-foreground">
          Build sheet rules that react to row changes, update data, and notify the user.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="rounded-lg border border-border bg-background p-3 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold">{editingRule ? "Edit automation" : "Create automation"}</div>
              <div className="text-[11px] text-muted-foreground">
                {selectedColumnName ? `Selected column: ${selectedColumnName}` : "Choose a trigger column below."}
              </div>
            </div>
            {editingRule ? (
              <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                New
              </Button>
            ) : null}
          </div>

          <Input
            value={activeDraft.name}
            onChange={(event) => setActiveDraft({ ...activeDraft, name: event.target.value })}
            placeholder="Rule name"
            className="h-9 text-xs"
          />

          <div className="grid grid-cols-2 gap-2">
            <select
              value={activeDraft.condition.columnKey}
              onChange={(event) =>
                setActiveDraft({
                  ...activeDraft,
                  condition: { ...activeDraft.condition, columnKey: event.target.value },
                })
              }
              className={selectClass}
              disabled={activeDraft.condition.operator === "always"}
            >
              {columns.map((column) => (
                <option key={column.key} value={column.key}>
                  {column.name}
                </option>
              ))}
            </select>
            <select
              value={activeDraft.condition.operator}
              onChange={(event) =>
                setActiveDraft({
                  ...activeDraft,
                  condition: {
                    ...activeDraft.condition,
                    operator: event.target.value as AutomationConditionOperator,
                    columnKey: event.target.value === "always" ? "" : activeDraft.condition.columnKey || firstColumnKey,
                  },
                })
              }
              className={selectClass}
            >
              {OPERATORS.map((operator) => (
                <option key={operator.value} value={operator.value}>
                  {operator.label}
                </option>
              ))}
            </select>
          </div>

          {!["always", "empty", "not_empty", "date_before_today"].includes(activeDraft.condition.operator) ? (
            <Input
              value={activeDraft.condition.value ?? ""}
              onChange={(event) =>
                setActiveDraft({
                  ...activeDraft,
                  condition: { ...activeDraft.condition, value: event.target.value },
                })
              }
              placeholder={activeDraft.condition.operator === "date_in_next_days" ? "Days, for example 3" : "Compare value"}
              className="h-9 text-xs"
            />
          ) : null}

          <div className="space-y-2">
            <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Actions</div>
            {activeDraft.actions.map((action) => {
              const ActionIcon = ACTIONS.find((item) => item.value === action.type)?.icon ?? Bell;
              return (
                <div key={action.id} className="rounded-md border border-border p-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <ActionIcon className="h-3.5 w-3.5 text-primary" />
                    <select
                      value={action.type}
                      onChange={(event) =>
                        setActiveDraft({
                          ...activeDraft,
                          actions: activeDraft.actions.map((item) =>
                            item.id === action.id
                              ? { ...item, type: event.target.value as AutomationActionType }
                              : item,
                          ),
                        })
                      }
                      className={selectClass}
                    >
                      {ACTIONS.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 shrink-0"
                      onClick={() =>
                        setActiveDraft({
                          ...activeDraft,
                          actions: activeDraft.actions.filter((item) => item.id !== action.id),
                        })
                      }
                      disabled={activeDraft.actions.length === 1}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  {action.type === "update_cell" ? (
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={action.columnKey ?? firstColumnKey}
                        onChange={(event) =>
                          setActiveDraft({
                            ...activeDraft,
                            actions: activeDraft.actions.map((item) =>
                              item.id === action.id ? { ...item, columnKey: event.target.value } : item,
                            ),
                          })
                        }
                        className={selectClass}
                      >
                        {columns.map((column) => (
                          <option key={column.key} value={column.key}>
                            {column.name}
                          </option>
                        ))}
                      </select>
                      <Input
                        value={action.value ?? ""}
                        onChange={(event) =>
                          setActiveDraft({
                            ...activeDraft,
                            actions: activeDraft.actions.map((item) =>
                              item.id === action.id ? { ...item, value: event.target.value } : item,
                            ),
                          })
                        }
                        placeholder="New value"
                        className="h-9 text-xs"
                      />
                    </div>
                  ) : null}

                  {action.type === "notify" ? (
                    <Input
                      value={action.message ?? ""}
                      onChange={(event) =>
                        setActiveDraft({
                          ...activeDraft,
                          actions: activeDraft.actions.map((item) =>
                            item.id === action.id ? { ...item, message: event.target.value } : item,
                          ),
                        })
                      }
                      placeholder="Notification message"
                      className="h-9 text-xs"
                    />
                  ) : null}
                </div>
              );
            })}
            <Button
              size="sm"
              variant="outline"
              className="w-full gap-2"
              onClick={() =>
                setActiveDraft({
                  ...activeDraft,
                  actions: [
                    ...activeDraft.actions,
                    { id: `action_${Date.now()}_${Math.random().toString(36).slice(2)}`, type: "notify", message: "Automation matched" },
                  ],
                })
              }
            >
              <Plus className="h-3.5 w-3.5" />
              Add action
            </Button>
          </div>

          <Button size="sm" className="w-full" onClick={saveDraft} disabled={activeDraft.actions.length === 0}>
            {editingRule ? "Done editing" : "Add automation"}
          </Button>
        </div>

        <div className="space-y-2">
          {rules.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
              No automations yet.
            </div>
          ) : (
            rules.map((rule) => (
              <div key={rule.id} className="rounded-lg border border-border bg-background p-3">
                <div className="flex items-start justify-between gap-3">
                  <button type="button" className="min-w-0 text-left" onClick={() => setEditingId(rule.id)}>
                    <div className="truncate text-sm font-semibold">{rule.name}</div>
                    <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {rule.condition.operator === "always"
                        ? "Runs on every row edit"
                        : `${columns.find((column) => column.key === rule.condition.columnKey)?.name ?? "Column"} ${rule.condition.operator.replaceAll("_", " ")}`}
                    </div>
                    <div className="mt-2 text-[11px] text-muted-foreground">
                      {rule.actions.length} action{rule.actions.length === 1 ? "" : "s"}
                    </div>
                  </button>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant={rule.enabled ? "secondary" : "outline"}
                      onClick={() => onChangeRules(rules.map((item) => (item.id === rule.id ? { ...item, enabled: !item.enabled } : item)))}
                    >
                      {rule.enabled ? "Enabled" : "Paused"}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => onChangeRules(rules.filter((item) => item.id !== rule.id))}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="border-t px-4 py-3 flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
        <div>{selectedCell ? "Run rules against the selected row." : "Select a cell to test rules."}</div>
        <Button size="sm" onClick={onRun} disabled={!selectedCell || rules.length === 0}>
          Run now
        </Button>
      </div>
    </div>
  );
}
