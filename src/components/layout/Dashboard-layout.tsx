"use client";

import { ReactNode, useMemo } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./App-sidebar";
import Breadcrumb from "./Bread-crumb";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { usePathname } from "next/navigation";
import NotificationPopover from "@/components/header/Notification-popover";
import HelpPopover from "@/components/header/Help-popover";
import SettingsDialog from "@/components/header/Settings-dialog";
import ProtectedRoute from "../Protected-route";

interface DashboardLayoutProps {
  children: ReactNode;
  breadcrumbItems: string[];
}

const DashboardLayout = ({
  children,
  breadcrumbItems,
}: DashboardLayoutProps) => {
  const pathname = usePathname();

  // Contextual search placeholder based on current route
  const searchPlaceholder = useMemo(() => {
    if (pathname === "/sheets") return "Search sheets...";
    if (pathname === "/organizations") return "Search organizations...";
    if (pathname === "/people") return "Search people...";
    if (pathname === "/templates") return "Search templates...";
    if (pathname === "/recent") return "Search recent files...";
    if (pathname === "/starred") return "Search starred files...";
    if (pathname === "/files") return "Search all files...";
    return "Search sheets, people, organizations...";
  }, [pathname]);

  return (
    <ProtectedRoute>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            {/* Top Bar */}
            <header className="h-14 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-40 flex items-center justify-between px-4">
              <div className="flex items-center gap-2">
                <SidebarTrigger className="h-8 w-8" />
                <div className="hidden md:flex items-center gap-2 ml-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder={searchPlaceholder}
                      className="pl-9 w-80 h-9 bg-muted/50 border-0 focus-visible:ring-1"
                    />
                  </div>
                </div>
              </div>

              {/* Center - Breadcrumb */}
              <div className="absolute left-1/2 -translate-x-1/2">
                <Breadcrumb items={breadcrumbItems} />
              </div>

              {/* Right Side */}
              <div className="flex items-center gap-1">
                <HelpPopover />
                <NotificationPopover />
                <SettingsDialog />
              </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-6 overflow-auto">{children}</main>
          </div>
        </div>
      </SidebarProvider>
    </ProtectedRoute>
  );
};

export default DashboardLayout;
