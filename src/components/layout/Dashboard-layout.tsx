"use client";

import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./App-sidebar";
import Breadcrumb from "./Bread-crumb";
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
  return (
    <ProtectedRoute>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar />
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* Top Bar */}
            <header className="h-14 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-40 grid grid-cols-[auto_1fr_auto] items-center px-3 sm:px-4 gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <SidebarTrigger className="h-8 w-8 flex-shrink-0" />
              </div>
              <div className="min-w-0 overflow-hidden flex items-center justify-center">
                <Breadcrumb items={breadcrumbItems} />
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <SettingsDialog />
              </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
              <div className="px-4 sm:px-6 lg:px-8 py-8 md:py-12">
                {children}
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </ProtectedRoute>
  );
};

export default DashboardLayout;
