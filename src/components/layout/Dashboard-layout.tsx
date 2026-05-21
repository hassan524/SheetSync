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
  mobileActions?: ReactNode;
}

const DashboardLayout = ({
  children,
  breadcrumbItems,
  mobileActions,
}: DashboardLayoutProps) => {
  const pageTitle = breadcrumbItems[breadcrumbItems.length - 1] || "SheetSync";

  return (
    <ProtectedRoute>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar />
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* Top Bar */}
            <header className="h-14 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-40 flex items-center px-3 sm:px-4 gap-3">
              {/* Left: sidebar trigger */}
              <div className="flex items-center gap-2 min-w-0 shrink-0">
                <SidebarTrigger className="h-8 w-8 flex-shrink-0" />
              </div>

              {/* Mobile: show page title only */}
              <div className="flex-1 min-w-0 md:hidden">
                <h1 className="text-sm font-semibold truncate">{pageTitle}</h1>
              </div>

              {/* Desktop: show breadcrumb centered */}
              <div className="hidden md:flex flex-1 min-w-0 overflow-hidden items-center justify-center">
                <Breadcrumb items={breadcrumbItems} />
              </div>

              {/* Settings */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <SettingsDialog />
              </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
              <div className="px-4 sm:px-6 lg:px-8 py-6 md:py-8">
                {children}
              </div>
            </main>

            {/* Mobile Bottom Action Bar */}
            {mobileActions && (
              <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border px-4 py-2.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 overflow-x-auto hide-scrollbar">
                  {mobileActions}
                </div>
              </div>
            )}
          </div>
        </div>
      </SidebarProvider>
    </ProtectedRoute>
  );
};

export default DashboardLayout;

