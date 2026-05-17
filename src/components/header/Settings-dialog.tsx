"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Settings, LogOut, Bell, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const SettingsDialog = () => {
  const [open, setOpen] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [loadingPush, setLoadingPush] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const { user, logout } = useAuth();
  const router = useRouter();

  // Fetch current push preference when dialog opens
  const fetchPushPref = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(
        `/api/push-preference?userId=${encodeURIComponent(user.id)}`,
      );
      const json = await res.json();
      if (json.ok) setPushEnabled(json.push_enabled);
    } catch {
      /* silent */
    }
  }, [user]);

  useEffect(() => {
    if (open) fetchPushPref();
  }, [open, fetchPushPref]);

  // Toggle push notifications
  const handleTogglePush = async (enabled: boolean) => {
    if (!user?.id) return;
    setPushEnabled(enabled);
    setLoadingPush(true);
    try {
      const res = await fetch("/api/push-preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, enabled }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      toast.success(
        enabled ? "Push notifications enabled" : "Push notifications disabled",
      );
    } catch {
      setPushEnabled(!enabled);
      toast.error("Failed to update notification preference");
    } finally {
      setLoadingPush(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      setTimeout(() => router.push("/"), 253);
    } catch (error: any) {
      toast.error("Logout failed: " + (error.message || error));
      setLoggingOut(false);
    }
  };

  const initials = (() => {
    if (!user?.name) return "U";
    const parts = user.name.trim().split(" ");
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return parts[0][0].toUpperCase() + parts[1][0].toUpperCase();
  })();

  const displayName = user?.name
    ? user.name
        .toLowerCase()
        .split(" ")
        .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ")
    : "Unknown User";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[380px] p-0 gap-0 overflow-hidden rounded-2xl">
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle className="text-base font-semibold">
            Settings
          </DialogTitle>
        </DialogHeader>

        {/* ── Profile Card ── */}
        <div className="px-5 pb-4">
          <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-muted/40 border border-border/60">
            <div className="relative">
              <Avatar className="h-11 w-11 ring-2 ring-primary/15">
                <AvatarImage src={user?.avatar_url || ""} />
                <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 bg-green-500 rounded-full border-2 border-background" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">
                {displayName}
              </p>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {user?.email || "No email"}
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* ── Push Notifications Toggle ── */}
        <div className="px-5 py-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Bell className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Notifications
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <Label className="text-sm font-medium">Push notifications</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Receive real-time alerts on your device
              </p>
            </div>
            <Switch
              checked={pushEnabled}
              onCheckedChange={handleTogglePush}
              disabled={loadingPush}
              className="shrink-0"
            />
          </div>
        </div>

        <Separator />

        {/* ── Actions ── */}
        <div className="px-5 py-4 flex flex-col gap-2">
          <Button
            variant="outline"
            className="w-full h-9 text-sm text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20 gap-2 justify-center"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
            {loggingOut ? "Signing out…" : "Sign Out"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;
