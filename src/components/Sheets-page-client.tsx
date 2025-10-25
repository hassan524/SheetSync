"use client"

import * as React from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
  SidebarHeader,
} from "@/components/ui/sidebar"
import { FileSpreadsheet, Building2, Table } from "lucide-react"
import { AppHeader } from "./Top-header"
import { PersonalSheetsView } from "./views/Personal-sheets-view"
import { OrganizationsView } from "./views/Organizations-view"
import { cn } from "@/lib/utils"
import AsideDrawer from "./AsideDrawer"
import { useAuth } from "@/context/AuthContext";

type Section = "personal" | "organizations"

interface Sheet {
  id: string
  title: string
  updatedAt: string
  orgId?: string
}

export function SheetsPageClient() {
  const [section, setSection] = React.useState<Section>("personal")
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false)
  const [selectedSheet, setSelectedSheet] = React.useState<Sheet | null>(null)

  const { user } = useAuth();

  const handleSheetClick = (sheet: Sheet) => {
    setSelectedSheet(sheet)
    setIsDrawerOpen(true)
  }

  return (
    <div className="flex w-full min-h-svh text-[#0F172B]">
      {/* Sidebar */}
      <Sidebar collapsible="icon" className="">
        <SidebarHeader className="h-16 px-4 bg-white">
          <div className="flex h-full items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 shadow-sm">
              <Table className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-900 group-data-[collapsible=icon]:hidden">
              SheetSync
            </span>
            <span className="sr-only">Sheetsync</span>
          </div>
        </SidebarHeader>

        <SidebarContent className="bg-white">
          <div className="px-3 py-4">
            <SidebarMenu className="space-y-1">

              {/* Personal Sheets */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setSection("personal")}
                  className={cn(
                    "h-10 px-3 transition-colors rounded-md cursor-pointer",
                    section === "personal"
                      ? "!bg-[#eff1ed] text-gray-900"
                      : "hover:bg-gray-100/50 text-gray-600"
                  )}
                >
                  <FileSpreadsheet
                    className={cn(
                      "h-[18px] w-[18px] shrink-0",
                      section === "personal" ? "text-emerald-800" : "text-gray-500"
                    )}
                  />
                  <span className="text-[15px] font-medium group-data-[collapsible=icon]:hidden">
                    Personal Sheets
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Organizations */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setSection("organizations")}
                  className={cn(
                    "h-10 px-3 transition-colors rounded-md cursor-pointer",
                    section === "organizations"
                      ? "!bg-[#eff1ed] text-gray-900"
                      : "hover:bg-gray-100/50 text-gray-600"
                  )}
                >
                  <Building2
                    className={cn(
                      "h-[18px] w-[18px] shrink-0",
                      section === "organizations" ? "text-emerald-800" : "text-gray-500"
                    )}
                  />
                  <span className="text-[15px] font-medium group-data-[collapsible=icon]:hidden">
                    Organizations
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>

            </SidebarMenu>
          </div>
        </SidebarContent>

        {/* User Profile Footer */}
        <div className="mt-auto border-t border-gray-200 bg-white p-3">
          <div className="flex items-center gap-3 px-2 py-2 hover:bg-gray-50 rounded-lg transition-all duration-200 cursor-pointer group-data-[collapsible=icon]:justify-center">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-purple-600 text-white font-semibold text-sm flex-shrink-0 shadow-sm">
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user?.name || 'User'}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <span className="text-base uppercase">
                  {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.name || 'User'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.email || 'No email'}
              </p>
            </div>
          </div>
        </div>

        <SidebarRail />
      </Sidebar>

      {/* Main Content */}
      <SidebarInset className="flex-1 flex flex-col relative">
        <AppHeader>
          <SidebarTrigger className="md:hidden" />
        </AppHeader>

        <div className="flex flex-1 bg-[#fbfbf9] overflow-hidden relative">
          <main className={cn("flex-1 transition-all duration-300 overflow-y-auto")}>
            {section === "personal" ? (
              <PersonalSheetsView onSheetClick={handleSheetClick} />
            ) : (
              <OrganizationsView onSheetClick={handleSheetClick} />
            )}
          </main>

          {/* Drawer */}
          {isDrawerOpen && (
            <>
              {/* Backdrop for mobile */}
              <div
                className="fixed lg:hidden inset-0 bg-black/50 z-40"
                onClick={() => setIsDrawerOpen(false)}
                style={{ top: 0, left: 0, right: 0, bottom: 0 }}
              />

              {/* Drawer panel */}
              <aside className="fixed lg:relative lg:w-80 lg:border-l lg:bg-white lg:overflow-y-auto lg:flex-shrink-0 lg:z-auto z-50 right-0 top-0 bottom-0 w-full sm:w-96 bg-white overflow-y-auto border-l shadow-lg lg:shadow-none">
                <div className="w-full h-full">
                  <AsideDrawer sheet={selectedSheet} onClose={() => setIsDrawerOpen(false)} />
                </div>
              </aside>
            </>
          )}
        </div>
      </SidebarInset>
    </div>
  )
}