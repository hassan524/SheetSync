import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  X,
  Users,
  Activity,
  Shield,
  Lock,
  Circle,
  ChevronLeft,
  Eye,
  Clock,
  Zap,
  TrendingUp,
} from "lucide-react";

interface SheetRightPanelProps {
  open: boolean;
  onClose: () => void;
  onOpen: () => void;
  isOrganizationSheet: boolean;
  activityLog: { cell: string; value: string; time: string }[];
  cellActivity: Record<string, number>;
  heatmapEnabled: boolean;
  onToggleHeatmap: () => void;
  onLockRow: (rowIdx: number) => void;
  onLockColumn: (colKey: string) => void;
  onLockCell: (rowIdx: number, colKey: string) => void;
  columns: { key: string; name: string }[];
  rowCount: number;
  lockedRows: number[];
  lockedColumns: string[];
  lockedCells: { rowIdx: number; colKey: string }[];
}

const mockUsers = [
  {
    name: "Alice Thompson",
    initials: "AT",
    color: "hsl(152, 45%, 28%)",
    cell: "B3",
    status: "Editing",
  },
  {
    name: "Robert Williams",
    initials: "RW",
    color: "hsl(200, 60%, 45%)",
    cell: "D7",
    status: "Viewing",
  },
  {
    name: "Sarah Chen",
    initials: "SC",
    color: "hsl(280, 50%, 45%)",
    cell: "A1",
    status: "Editing",
  },
  {
    name: "James Park",
    initials: "JP",
    color: "hsl(30, 70%, 50%)",
    cell: null,
    status: "Idle",
  },
];

const SheetRightPanel = ({
  open,
  onClose,
  onOpen,
  isOrganizationSheet,
  activityLog,
  cellActivity,
  heatmapEnabled,
  onToggleHeatmap,
  onLockRow,
  onLockColumn,
  onLockCell,
  columns,
  rowCount,
  lockedRows,
  lockedColumns,
  lockedCells,
}: SheetRightPanelProps) => {
  const [lockRowInput, setLockRowInput] = useState("");
  const [lockColInput, setLockColInput] = useState("");
  const [lockCellRow, setLockCellRow] = useState("");
  const [lockCellCol, setLockCellCol] = useState("");

  const topCells = Object.entries(cellActivity)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const totalEdits = Object.values(cellActivity).reduce((a, b) => a + b, 0);
  const onlineUsers = mockUsers.filter((u) => u.status !== "Idle");

  return (
    <>
      {/* Pull tab - visible when panel is closed */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ delay: 0.3 }}
            onClick={onOpen}
            className="fixed right-0 top-1/2 -translate-y-1/2 z-40 bg-primary text-primary-foreground rounded-l-lg px-1.5 py-6 shadow-elevated hover:px-2.5 transition-all group"
          >
            <div className="flex flex-col items-center gap-2">
              <ChevronLeft className="h-3.5 w-3.5 group-hover:animate-pulse" />
              <div className="flex flex-col gap-1">
                {onlineUsers.slice(0, 3).map((u, i) => (
                  <div
                    key={i}
                    className="h-5 w-5 rounded-full border-2 border-primary-foreground text-[8px] font-bold flex items-center justify-center"
                    style={{ backgroundColor: u.color }}
                  >
                    {u.initials[0]}
                  </div>
                ))}
              </div>
              <ChevronLeft className="h-3.5 w-3.5 group-hover:animate-pulse" />
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: "100%", opacity: 0.8 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0.8 }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="w-[320px] border-l border-border bg-card flex flex-col h-full shrink-0 shadow-float"
          >
            {/* Panel Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-1.5">
                  {onlineUsers.slice(0, 3).map((u, i) => (
                    <div
                      key={i}
                      className="h-6 w-6 rounded-full border-2 border-card text-[9px] font-semibold flex items-center justify-center text-white"
                      style={{ backgroundColor: u.color }}
                    >
                      {u.initials}
                    </div>
                  ))}
                </div>
                <span className="text-xs text-muted-foreground font-medium">
                  {onlineUsers.length} online
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                onClick={onClose}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>

            <Tabs
              defaultValue="collaboration"
              className="flex-1 flex flex-col min-h-0"
            >
              <TabsList className="mx-3 mt-2 bg-muted/50 h-8">
                <TabsTrigger
                  value="collaboration"
                  className="text-[11px] gap-1 h-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <Users className="h-3 w-3" /> Team
                </TabsTrigger>
                <TabsTrigger
                  value="activity"
                  className="text-[11px] gap-1 h-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <Activity className="h-3 w-3" /> Activity
                </TabsTrigger>
                {isOrganizationSheet && (
                  <TabsTrigger
                    value="permissions"
                    className="text-[11px] gap-1 h-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    <Shield className="h-3 w-3" /> Perms
                  </TabsTrigger>
                )}
              </TabsList>

              <ScrollArea className="flex-1">
                {/* Collaboration */}
                <TabsContent
                  value="collaboration"
                  className="p-3 space-y-3 mt-0"
                >
                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-muted/40 rounded-lg p-2.5">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Eye className="h-3 w-3 text-primary" />
                        <span className="text-[10px] text-muted-foreground font-medium">
                          Viewers
                        </span>
                      </div>
                      <p className="text-lg font-semibold text-foreground">
                        {mockUsers.filter((u) => u.status === "Viewing").length}
                      </p>
                    </div>
                    <div className="bg-muted/40 rounded-lg p-2.5">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Zap className="h-3 w-3 text-warning" />
                        <span className="text-[10px] text-muted-foreground font-medium">
                          Editing
                        </span>
                      </div>
                      <p className="text-lg font-semibold text-foreground">
                        {mockUsers.filter((u) => u.status === "Editing").length}
                      </p>
                    </div>
                  </div>

                  {/* Active Users */}
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Active Members
                    </p>
                    <div className="space-y-1.5">
                      {mockUsers.map((u) => (
                        <div
                          key={u.name}
                          className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                        >
                          <div className="relative">
                            <div
                              className="h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                              style={{ backgroundColor: u.color }}
                            >
                              {u.initials}
                            </div>
                            <Circle
                              className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 ${
                                u.status === "Idle"
                                  ? "fill-muted-foreground/30 text-muted-foreground/30"
                                  : "fill-success text-success"
                              }`}
                              strokeWidth={3}
                              stroke="hsl(var(--card))"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate text-foreground">
                              {u.name}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {u.cell
                                ? `Cell ${u.cell} · ${u.status}`
                                : u.status}
                            </p>
                          </div>
                          {u.status === "Editing" && (
                            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                {/* Activity */}
                <TabsContent value="activity" className="p-3 space-y-3 mt-0">
                  {/* Stats Bar */}
                  <div className="flex items-center gap-3 bg-muted/40 rounded-lg p-2.5">
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="h-3 w-3 text-primary" />
                      <span className="text-xs font-semibold">
                        {totalEdits}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        edits
                      </span>
                    </div>
                    <div className="flex-1" />
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-muted-foreground">
                        Heatmap
                      </span>
                      <Switch
                        checked={heatmapEnabled}
                        onCheckedChange={onToggleHeatmap}
                        className="scale-75"
                      />
                    </div>
                  </div>

                  {topCells.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        Hot Cells
                      </p>
                      <div className="space-y-1">
                        {topCells.map(([cell, count]) => {
                          const max = topCells[0]?.[1] || 1;
                          const pct = (count / max) * 100;
                          return (
                            <div
                              key={cell}
                              className="relative flex items-center justify-between text-xs px-2.5 py-1.5 rounded-md overflow-hidden"
                            >
                              <div
                                className="absolute inset-0 bg-primary/8 rounded-md"
                                style={{ width: `${pct}%` }}
                              />
                              <span className="font-mono text-foreground relative z-10">
                                {cell}
                              </span>
                              <Badge
                                variant="secondary"
                                className="text-[9px] h-4 relative z-10 bg-primary/10 text-primary border-0"
                              >
                                {count}
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      <Clock className="h-3 w-3 inline mr-1" />
                      Recent Changes
                    </p>
                    <div className="space-y-0.5">
                      {activityLog
                        .slice(-12)
                        .reverse()
                        .map((entry, i) => (
                          <div
                            key={i}
                            className="text-[11px] px-2.5 py-1.5 rounded-md hover:bg-muted/30 transition-colors flex justify-between gap-2"
                          >
                            <span className="truncate">
                              <span className="font-mono text-primary font-medium">
                                {entry.cell}
                              </span>{" "}
                              <span className="text-muted-foreground">→</span>{" "}
                              {entry.value || "∅"}
                            </span>
                            <span className="text-muted-foreground shrink-0 text-[10px]">
                              {entry.time}
                            </span>
                          </div>
                        ))}
                      {activityLog.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-6">
                          No edits yet
                        </p>
                      )}
                    </div>
                  </div>
                </TabsContent>

                {/* Permissions */}
                {isOrganizationSheet && (
                  <TabsContent
                    value="permissions"
                    className="p-3 space-y-4 mt-0"
                  >
                    {/* Lock Row */}
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        Lock Row
                      </p>
                      <div className="flex gap-1.5">
                        <input
                          type="number"
                          min={1}
                          max={rowCount}
                          placeholder="Row #"
                          value={lockRowInput}
                          onChange={(e) => setLockRowInput(e.target.value)}
                          className="flex h-7 w-full rounded-md border border-input bg-background px-2 text-xs"
                        />
                        <Button
                          size="sm"
                          className="h-7 text-[10px] px-2 bg-primary hover:bg-primary/90"
                          onClick={() => {
                            if (lockRowInput) {
                              onLockRow(Number(lockRowInput) - 1);
                              setLockRowInput("");
                            }
                          }}
                        >
                          <Lock className="h-3 w-3" />
                        </Button>
                      </div>
                      {lockedRows.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {lockedRows.map((r) => (
                            <Badge
                              key={r}
                              variant="secondary"
                              className="text-[9px] cursor-pointer h-5 bg-destructive/10 text-destructive hover:bg-destructive/20"
                              onClick={() => onLockRow(r)}
                            >
                              Row {r + 1} ×
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    {/* Lock Column */}
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        Lock Column
                      </p>
                      <div className="flex gap-1.5">
                        <select
                          value={lockColInput}
                          onChange={(e) => setLockColInput(e.target.value)}
                          className="flex h-7 w-full rounded-md border border-input bg-background px-2 text-xs"
                        >
                          <option value="">Select column</option>
                          {columns.map((c) => (
                            <option key={c.key} value={c.key}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                        <Button
                          size="sm"
                          className="h-7 text-[10px] px-2 bg-primary hover:bg-primary/90"
                          onClick={() => {
                            if (lockColInput) {
                              onLockColumn(lockColInput);
                              setLockColInput("");
                            }
                          }}
                        >
                          <Lock className="h-3 w-3" />
                        </Button>
                      </div>
                      {lockedColumns.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {lockedColumns.map((c) => (
                            <Badge
                              key={c}
                              variant="secondary"
                              className="text-[9px] cursor-pointer h-5 bg-destructive/10 text-destructive hover:bg-destructive/20"
                              onClick={() => onLockColumn(c)}
                            >
                              {columns.find((col) => col.key === c)?.name || c}{" "}
                              ×
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    {/* Lock Cell */}
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        Lock Cell
                      </p>
                      <div className="flex gap-1.5">
                        <input
                          type="number"
                          min={1}
                          placeholder="Row"
                          value={lockCellRow}
                          onChange={(e) => setLockCellRow(e.target.value)}
                          className="flex h-7 w-20 rounded-md border border-input bg-background px-2 text-xs"
                        />
                        <select
                          value={lockCellCol}
                          onChange={(e) => setLockCellCol(e.target.value)}
                          className="flex h-7 flex-1 rounded-md border border-input bg-background px-2 text-xs"
                        >
                          <option value="">Col</option>
                          {columns.map((c) => (
                            <option key={c.key} value={c.key}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                        <Button
                          size="sm"
                          className="h-7 text-[10px] px-2 bg-primary hover:bg-primary/90"
                          onClick={() => {
                            if (lockCellRow && lockCellCol) {
                              onLockCell(Number(lockCellRow) - 1, lockCellCol);
                              setLockCellRow("");
                              setLockCellCol("");
                            }
                          }}
                        >
                          <Lock className="h-3 w-3" />
                        </Button>
                      </div>
                      {lockedCells.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {lockedCells.map((lc, i) => (
                            <Badge
                              key={i}
                              variant="secondary"
                              className="text-[9px] cursor-pointer h-5 bg-destructive/10 text-destructive hover:bg-destructive/20"
                              onClick={() => onLockCell(lc.rowIdx, lc.colKey)}
                            >
                              R{lc.rowIdx + 1}:
                              {columns.find((c) => c.key === lc.colKey)?.name ||
                                lc.colKey}{" "}
                              ×
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </TabsContent>
                )}
              </ScrollArea>
            </Tabs>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SheetRightPanel;
