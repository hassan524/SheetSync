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
import { Settings, LogOut, Bell } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const SettingsDialog = () => {
  const [open, setOpen] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const { logout } = useAuth();
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px] p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-5 pb-4">
          <DialogTitle className="text-base">Settings</DialogTitle>
        </DialogHeader>

        <div className="px-5 pb-2">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                JD
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                John Doe
              </p>
              <p className="text-xs text-muted-foreground truncate">
                john@example.com
              </p>
            </div>
          </div>
        </div>

        <Separator />

        <div className="px-5 py-4 space-y-4">
          <div className="space-y-1.5">
            <Label
              htmlFor="displayName"
              className="text-xs text-muted-foreground"
            >
              Display Name
            </Label>
            <Input
              id="displayName"
              defaultValue="John Doe"
              className="h-9 text-sm"
            />
          </div>
        </div>

        <Separator />

        <div className="px-5 py-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Notifications
            </span>
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-sm">Email notifications</Label>
            <Switch
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-sm">Push notifications</Label>
            <Switch
              checked={pushNotifications}
              onCheckedChange={setPushNotifications}
            />
          </div>
        </div>

        <Separator />

        <div className="p-5 pt-4 space-y-2">
          <Button
            className="w-full h-9 text-sm"
            onClick={() => {
              toast.success("Settings saved");
              setOpen(false);
            }}
          >
            Save Changes
          </Button>
          <Button
            variant="outline"
            className="w-full h-9 text-sm text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Log Out
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;
