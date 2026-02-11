'use client'

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Bell, FileSpreadsheet, Users, Building2, Check } from "lucide-react";
import { useState } from "react";

import { useRouter } from "next/navigation";

interface Notification {
  id: string;
  type: "sheet" | "team" | "org";
  title: string;
  description: string;
  time: string;
  read: boolean;
}

const initialNotifications: Notification[] = [
  {
    id: "1",
    type: "sheet",
    title: "Sheet shared with you",
    description: "Sarah Johnson shared 'Q4 Report' with you",
    time: "5 min ago",
    read: false,
  },
  {
    id: "2",
    type: "team",
    title: "New team member",
    description: "Michael Chen joined Design Team",
    time: "1 hour ago",
    read: false,
  },
  {
    id: "3",
    type: "org",
    title: "Organization invite",
    description: "You've been invited to join Marketing Dept",
    time: "2 hours ago",
    read: false,
  },
  {
    id: "4",
    type: "sheet",
    title: "Comment on sheet",
    description: "Emily Davis commented on 'Budget 2024'",
    time: "Yesterday",
    read: true,
  },
];

const typeIcons = {
  sheet: <FileSpreadsheet className="h-4 w-4" />,
  team: <Users className="h-4 w-4" />,
  org: <Building2 className="h-4 w-4" />,
};

const NotificationPopover = () => {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleViewAll = () => {
    setOpen(false);
    // Navigate to a notifications page or show all
    router.push("/");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 h-2 w-2 bg-primary rounded-full" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-semibold">Notifications</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7"
              onClick={markAllAsRead}
            >
              <Check className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No notifications
            </div>
          ) : (
            notifications.map((notification) => (
              <button
                key={notification.id}
                className={`w-full flex items-start gap-3 p-3 hover:bg-muted/50 transition-colors text-left ${
                  !notification.read ? "bg-primary/5" : ""
                }`}
                onClick={() => markAsRead(notification.id)}
              >
                <div
                  className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                    !notification.read ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {typeIcons[notification.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!notification.read ? "font-medium" : ""}`}>
                    {notification.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {notification.description}
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    {notification.time}
                  </p>
                </div>
                {!notification.read && (
                  <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                )}
              </button>
            ))
          )}
        </div>
        <div className="p-2 border-t">
          <Button
            variant="ghost"
            className="w-full text-sm"
            onClick={handleViewAll}
          >
            View all notifications
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationPopover;
