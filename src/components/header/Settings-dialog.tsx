"use client";

import { useState, useEffect } from "react";
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
  CreditCard,
  Check,
  Sun,
  Moon,
  Monitor,
  Loader2,
  ExternalLink,
  Zap,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "profile", label: "Profile", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "privacy", label: "Privacy", icon: Shield },
  { id: "billing", label: "Billing", icon: CreditCard },
] as const;

type TabId = (typeof tabs)[number]["id"];

// ── Sub-components (defined outside to avoid recreation on render) ──

interface ThemeCardProps {
  value: "system" | "light" | "dark";
  label: string;
  Icon: any;
  theme: "system" | "light" | "dark";
  applyTheme: (t: "system" | "light" | "dark") => void;
}

function ThemeCard({ value, label, Icon, theme, applyTheme }: ThemeCardProps) {
  return (
    <button
      onClick={() => applyTheme(value)}
      className={cn(
        "relative flex flex-col items-center gap-2 rounded-xl border-2 px-4 py-3.5 text-sm font-medium transition-all",
        theme === value
          ? "border-primary bg-primary/5 text-primary"
          : "border-border text-muted-foreground hover:border-border/80 hover:bg-muted/30",
      )}
    >
      {theme === value && (
        <span className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
          <Check className="h-2.5 w-2.5 text-primary-foreground" />
        </span>
      )}
      <Icon className="h-5 w-5" />
      {label}
    </button>
  );
}

interface ToggleRowProps {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}

function ToggleRow({
  label,
  description,
  checked,
  onCheckedChange,
}: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-0.5">
      <div className="min-w-0">
        <Label className="text-sm font-medium">{label}</Label>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="shrink-0"
      />
    </div>
  );
}

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
  const [reducedMotion, setReducedMotion] = useState(false);
  const [profileVisibility, setProfileVisibility] = useState(true);
  const [activityStatus, setActivityStatus] = useState(true);
  const [dataSharing, setDataSharing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const { user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem("theme") as
      | "system"
      | "light"
      | "dark"
      | null;
    if (stored) setTheme(stored);
  }, [open]);

  const applyTheme = (t: "system" | "light" | "dark") => {
    setTheme(t);
    localStorage.setItem("theme", t);
    const root = document.documentElement;
    if (t === "dark") {
      root.classList.add("dark");
    } else if (t === "light") {
      root.classList.remove("dark");
    } else {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      prefersDark ? root.classList.add("dark") : root.classList.remove("dark");
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

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
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

      <DialogContent className="sm:max-w-[700px] md:max-w-[820px] p-0 gap-0 overflow-hidden max-h-[92vh]">
        <DialogHeader className="px-5 pt-5 pb-3 border-b">
          <DialogTitle className="text-base font-semibold">
            Settings
          </DialogTitle>
        </DialogHeader>

        <div
          className="flex flex-col sm:flex-row flex-1 overflow-hidden"
          style={{ maxHeight: "calc(92vh - 110px)" }}
        >
          {/* Sidebar */}
          <nav className="sm:w-52 shrink-0 border-b sm:border-b-0 sm:border-r border-border bg-muted/20">
            <div className="flex sm:flex-col p-2.5 gap-0.5 overflow-x-auto sm:overflow-x-visible">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap w-full text-left",
                    activeTab === tab.id
                      ? "bg-background shadow-sm text-foreground border border-border/60"
                      : "text-muted-foreground hover:bg-background/60 hover:text-foreground",
                  )}
                >
                  <tab.icon className="h-4 w-4 shrink-0" />
                  {tab.label}
                  {tab.id === "billing" && (
                    <Badge className="ml-auto text-[9px] h-4 px-1.5 bg-primary/10 text-primary border-0 font-medium">
                      Free
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          </nav>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* ── Profile ── */}
            {activeTab === "profile" && (
              <div className="space-y-5">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/40 border border-border">
                  <div className="relative">
                    <Avatar className="h-14 w-14 ring-2 ring-primary/20">
                      <AvatarImage src={user?.avatar_url || ""} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-base font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="absolute -bottom-0.5 -right-0.5 h-4 w-4 bg-green-500 rounded-full border-2 border-background" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {displayName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user?.email || "No email"}
                    </p>
                    <Badge
                      variant="outline"
                      className="mt-1.5 text-[10px] h-4 px-1.5 font-medium text-primary border-primary/30 bg-primary/5"
                    >
                      Free plan
                    </Badge>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs shrink-0"
                    onClick={() => toast.info("Photo upload coming soon")}
                  >
                    Change photo
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="displayName"
                      className="text-xs font-medium"
                    >
                      Display Name
                    </Label>
                    <Input
                      id="displayName"
                      defaultValue={displayName}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-medium">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      defaultValue={user?.email || ""}
                      disabled
                      className="h-9 text-sm bg-muted/50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="timezone" className="text-xs font-medium">
                      Timezone
                    </Label>
                    <Input
                      id="timezone"
                      defaultValue="UTC-5 (Eastern Time)"
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="language" className="text-xs font-medium">
                      Language
                    </Label>
                    <Input
                      id="language"
                      defaultValue="English (US)"
                      className="h-9 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="bio" className="text-xs font-medium">
                    Bio
                  </Label>
                  <textarea
                    id="bio"
                    rows={2}
                    placeholder="Tell your team a little about yourself…"
                    className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Visible to people in your organizations.
                  </p>
                </div>
              </div>
            )}

            {/* ── Notifications ── */}
            {activeTab === "notifications" && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-semibold mb-0.5">Delivery</h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    Choose how you receive notifications.
                  </p>
                  <div className="space-y-3.5">
                    <ToggleRow
                      label="Email notifications"
                      description="Receive updates and summaries via email"
                      checked={emailNotifications}
                      onCheckedChange={setEmailNotifications}
                    />
                    <ToggleRow
                      label="Push notifications"
                      description="Browser-level push alerts in real time"
                      checked={pushNotifications}
                      onCheckedChange={setPushNotifications}
                    />
                  </div>
                </div>
                <Separator />
                <div>
                  <h3 className="text-sm font-semibold mb-0.5">Activity</h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    Fine-tune what triggers a notification.
                  </p>
                  <div className="space-y-3.5">
                    <ToggleRow
                      label="Sheet edits"
                      description="When collaborators edit shared sheets"
                      checked={sheetUpdates}
                      onCheckedChange={setSheetUpdates}
                    />
                    <ToggleRow
                      label="Mentions & comments"
                      description="When someone @mentions you or replies"
                      checked={mentionAlerts}
                      onCheckedChange={setMentionAlerts}
                    />
                    <ToggleRow
                      label="Weekly digest"
                      description="Summary of your activity every Monday"
                      checked={weeklyDigest}
                      onCheckedChange={setWeeklyDigest}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ── Appearance ── */}
            {activeTab === "appearance" && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-semibold mb-0.5">Theme</h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    Select your preferred color scheme.
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <ThemeCard
                      value="light"
                      label="Light"
                      Icon={Sun}
                      theme={theme}
                      applyTheme={applyTheme}
                    />
                    <ThemeCard
                      value="dark"
                      label="Dark"
                      Icon={Moon}
                      theme={theme}
                      applyTheme={applyTheme}
                    />
                    <ThemeCard
                      value="system"
                      label="System"
                      Icon={Monitor}
                      theme={theme}
                      applyTheme={applyTheme}
                    />
                  </div>
                </div>
                <Separator />
                <div>
                  <h3 className="text-sm font-semibold mb-0.5">Interface</h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    Adjust spacing and motion preferences.
                  </p>
                  <div className="space-y-3.5">
                    <ToggleRow
                      label="Compact mode"
                      description="Reduce row height and spacing throughout the UI"
                      checked={compactMode}
                      onCheckedChange={setCompactMode}
                    />
                    <ToggleRow
                      label="Reduce motion"
                      description="Disable animations and transitions"
                      checked={reducedMotion}
                      onCheckedChange={setReducedMotion}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ── Privacy ── */}
            {activeTab === "privacy" && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-semibold mb-0.5">Visibility</h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    Control who can see your information.
                  </p>
                  <div className="space-y-3.5">
                    <ToggleRow
                      label="Profile visible to team"
                      description="Let org members see your name and photo"
                      checked={profileVisibility}
                      onCheckedChange={setProfileVisibility}
                    />
                    <ToggleRow
                      label="Show online status"
                      description="Display an active indicator when you're working"
                      checked={activityStatus}
                      onCheckedChange={setActivityStatus}
                    />
                    <ToggleRow
                      label="Contribute anonymous usage data"
                      description="Help us improve SheetSync with anonymized stats"
                      checked={dataSharing}
                      onCheckedChange={setDataSharing}
                    />
                  </div>
                </div>
                <Separator />
                <div>
                  <h3 className="text-sm font-semibold mb-1 text-destructive">
                    Danger zone
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    These actions are permanent and cannot be undone.
                  </p>
                  <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 space-y-3">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium">Export all data</p>
                        <p className="text-xs text-muted-foreground">
                          Download a zip archive of all your sheets and data.
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs shrink-0"
                        onClick={() => toast.info("Data export coming soon")}
                      >
                        Export
                      </Button>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-destructive">
                          Delete account
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Permanently delete your account and all data.
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs text-destructive border-destructive/30 hover:bg-destructive/10 shrink-0"
                        onClick={() =>
                          toast.error("Contact support to delete your account")
                        }
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Billing ── */}
            {activeTab === "billing" && (
              <div className="space-y-5">
                {/* Plan card */}
                <div className="rounded-xl border bg-gradient-to-br from-card to-primary/5 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold">Free Plan</p>
                        <Badge className="text-[9px] h-4 px-1.5 bg-muted text-muted-foreground border border-border font-medium">
                          Current
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Great for personal use and small projects.
                      </p>
                    </div>
                    <p className="text-lg font-bold text-foreground shrink-0">
                      $0{" "}
                      <span className="text-xs font-normal text-muted-foreground">
                        /mo
                      </span>
                    </p>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {[
                      "Up to 10 sheets",
                      "100 rows per sheet",
                      "CSV & JSON export",
                      "Community support",
                    ].map((feature) => (
                      <div
                        key={feature}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground"
                      >
                        <Check className="h-3 w-3 text-primary shrink-0" />
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Upgrade card */}
                <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="flex items-start justify-between gap-3 relative">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Zap className="h-4 w-4 text-primary" />
                        <p className="text-sm font-semibold">Pro Plan</p>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">
                        Everything you need for serious work.
                      </p>
                      <div className="space-y-1">
                        {[
                          "Unlimited sheets & rows",
                          "Excel, PDF & JSON export",
                          "Real-time collaboration",
                          "Priority support",
                          "Custom domains",
                        ].map((feature) => (
                          <div
                            key={feature}
                            className="flex items-center gap-1.5 text-xs text-foreground"
                          >
                            <Check className="h-3 w-3 text-primary shrink-0" />
                            {feature}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold">$12</p>
                      <p className="text-[10px] text-muted-foreground">/mo</p>
                    </div>
                  </div>
                  <Button
                    className="mt-4 w-full h-9 text-sm font-semibold gap-2"
                    onClick={() => toast.info("Upgrade flow coming soon")}
                  >
                    <Zap className="h-4 w-4" />
                    Upgrade to Pro
                  </Button>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground py-1">
                  <span>Billing is managed securely via Stripe</span>
                  <button
                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                    onClick={() => toast.info("Billing portal coming soon")}
                  >
                    Manage <ExternalLink className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t bg-muted/20 px-5 py-3 flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2 justify-between">
          <Button
            variant="outline"
            className="h-9 text-sm text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20 gap-2"
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
          <Button
            className="h-9 text-sm gap-2"
            onClick={handleSave}
            disabled={saving}
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;
