"use client";

import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Settings,
  LogOut,
  Bell,
  User,
  Palette,
  Shield,
  Globe,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "profile", label: "Profile", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "privacy", label: "Privacy", icon: Shield },
] as const;

type TabId = (typeof tabs)[number]["id"];

const SettingsDialog = () => {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("profile");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [sheetUpdates, setSheetUpdates] = useState(true);
  const [mentionAlerts, setMentionAlerts] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);
  const [theme, setTheme] = useState<"system" | "light" | "dark">("system");
  const [compactMode, setCompactMode] = useState(false);
  const [profileVisibility, setProfileVisibility] = useState(true);
  const [activityStatus, setActivityStatus] = useState(true);

  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      setTimeout(() => {
        router.push("/");
      }, 253);
    } catch (error: any) {
      toast.error("Logout failed: " + error.message || error);
    }
  };

  const handleSave = () => {
    toast.success("Settings saved");
    setOpen(false);
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
      <DialogContent className="sm:max-w-[700px] md:max-w-[800px] p-0 gap-0 overflow-hidden max-h-[90vh]">
        <DialogHeader className="p-5 pb-0">
          <DialogTitle className="text-lg font-semibold">Settings</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col sm:flex-row flex-1 overflow-hidden">
          {/* Sidebar tabs */}
          <nav className="sm:w-48 shrink-0 border-b sm:border-b-0 sm:border-r border-border overflow-x-auto sm:overflow-x-visible">
            <div className="flex sm:flex-col p-2 gap-0.5">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
                    activeTab === tab.id
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <tab.icon className="h-4 w-4 shrink-0" />
                  {tab.label}
                </button>
              ))}
            </div>
          </nav>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5 min-h-[350px]">
            {/* ── Profile ── */}
            {activeTab === "profile" && (
              <div className="space-y-5">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 border border-border">
                  <Avatar className="h-14 w-14">
                    <AvatarImage src={user?.avatar_url || ""} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-base font-medium">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email || ""}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="displayName" className="text-xs text-muted-foreground">
                      Display Name
                    </Label>
                    <Input id="displayName" defaultValue={displayName} className="h-9 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs text-muted-foreground">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      defaultValue={user?.email || ""}
                      disabled
                      className="h-9 text-sm bg-muted/50"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Email is managed by your authentication provider.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ── Notifications ── */}
            {activeTab === "notifications" && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-medium mb-1">Delivery</h3>
                  <p className="text-xs text-muted-foreground mb-3">Choose how you receive notifications.</p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm">Email notifications</Label>
                        <p className="text-xs text-muted-foreground">Receive updates via email</p>
                      </div>
                      <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm">Push notifications</Label>
                        <p className="text-xs text-muted-foreground">Browser push alerts</p>
                      </div>
                      <Switch checked={pushNotifications} onCheckedChange={setPushNotifications} />
                    </div>
                  </div>
                </div>
                <Separator />
                <div>
                  <h3 className="text-sm font-medium mb-1">Activity</h3>
                  <p className="text-xs text-muted-foreground mb-3">Fine-tune what triggers a notification.</p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm">Sheet updates</Label>
                        <p className="text-xs text-muted-foreground">When collaborators edit shared sheets</p>
                      </div>
                      <Switch checked={sheetUpdates} onCheckedChange={setSheetUpdates} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm">Mentions & comments</Label>
                        <p className="text-xs text-muted-foreground">When someone mentions you</p>
                      </div>
                      <Switch checked={mentionAlerts} onCheckedChange={setMentionAlerts} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm">Weekly digest</Label>
                        <p className="text-xs text-muted-foreground">Summary of activity every Monday</p>
                      </div>
                      <Switch checked={weeklyDigest} onCheckedChange={setWeeklyDigest} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Appearance ── */}
            {activeTab === "appearance" && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-medium mb-1">Theme</h3>
                  <p className="text-xs text-muted-foreground mb-3">Select your preferred color scheme.</p>
                  <div className="grid grid-cols-3 gap-2">
                    {(["system", "light", "dark"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setTheme(t)}
                        className={cn(
                          "rounded-lg border px-3 py-2.5 text-sm font-medium capitalize transition-colors",
                          theme === t
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:border-primary/40"
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm">Compact mode</Label>
                      <p className="text-xs text-muted-foreground">Reduce spacing in the interface</p>
                    </div>
                    <Switch checked={compactMode} onCheckedChange={setCompactMode} />
                  </div>
                </div>
              </div>
            )}

            {/* ── Privacy ── */}
            {activeTab === "privacy" && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-medium mb-1">Visibility</h3>
                  <p className="text-xs text-muted-foreground mb-3">Control who can see your information.</p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm">Profile visible to team</Label>
                        <p className="text-xs text-muted-foreground">Let org members see your profile</p>
                      </div>
                      <Switch checked={profileVisibility} onCheckedChange={setProfileVisibility} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm">Show activity status</Label>
                        <p className="text-xs text-muted-foreground">Display online / away indicator</p>
                      </div>
                      <Switch checked={activityStatus} onCheckedChange={setActivityStatus} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <Separator />

        <div className="p-4 flex flex-col-reverse sm:flex-row items-center gap-2 justify-between">
          <Button
            variant="outline"
            className="w-full sm:w-auto h-9 text-sm text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Log Out
          </Button>
          <Button className="w-full sm:w-auto h-9 text-sm" onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;
