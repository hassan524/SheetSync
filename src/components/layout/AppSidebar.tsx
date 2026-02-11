"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  FileSpreadsheet,
  Building2,
  Users,
  Upload,
  LayoutTemplate,
  Settings,
  Plus,
  ChevronDown,
  Star,
  Clock,
  Folder,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import SettingsDialog from "@/components/header/SettingsDialog";
import JoinOrgModal from "@/components/modals/JoinOrgModal";

const mainNavItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Personal Sheets", url: "/sheets", icon: FileSpreadsheet },
  { title: "Organizations", url: "/organizations", icon: Building2 },
  { title: "People", url: "/people", icon: Users },
];

const quickAccessItems = [
  { title: "Recent", url: "/recent", icon: Clock },
  { title: "Starred", url: "/starred", icon: Star },
  { title: "All Files", url: "/files", icon: Folder },
];

const toolsItems = [
  { title: "Import", url: "/import", icon: Upload },
  { title: "Templates", url: "/templates", icon: LayoutTemplate },
];

const organizations = [
  { name: "Acme Corp", role: "Admin", members: 24 },
  { name: "Design Team", role: "Member", members: 8 },
  { name: "Marketing", role: "Viewer", members: 15 },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const [orgsOpen, setOrgsOpen] = useState(true);
  const [joinOrgOpen, setJoinOrgOpen] = useState(false);

  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  const getLinkClasses = (path: string) =>
    `flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 ${isActive(path)
      ? "bg-primary text-primary-foreground"
      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
    }`;

  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
            <FileSpreadsheet className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="animate-fade-in">
              <h1 className="font-semibold text-foreground">SheetSync</h1>
              <p className="text-xs text-muted-foreground">
                Spreadsheet Manager
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        {/* New Sheet Button */}
        <div className="px-2 mb-4">
          <Button className="w-full justify-start gap-2" size="sm">
            <Plus className="h-4 w-4" />
            {!collapsed && "New Sheet"}
          </Button>
        </div>

        {/* Main Navigation */}
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-xs text-muted-foreground uppercase tracking-wider px-3 mb-2">
              Main
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url} className={getLinkClasses(item.url)}>
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Quick Access */}
        <SidebarGroup className="mt-4">
          {!collapsed && (
            <SidebarGroupLabel className="text-xs text-muted-foreground uppercase tracking-wider px-3 mb-2">
              Quick Access
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {quickAccessItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url} className={getLinkClasses(item.url)}>
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* My Organizations */}
        {!collapsed && (
          <Collapsible
            open={orgsOpen}
            onOpenChange={setOrgsOpen}
            className="mt-4"
          >
            <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 text-xs text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors">
              <span>My Organizations</span>
              <ChevronDown
                className={`h-3 w-3 transition-transform duration-200 ${orgsOpen ? "rotate-180" : ""
                  }`}
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="animate-accordion-down">
              <div className="space-y-1 mt-1">
                {organizations.map((org) => (
                  <button
                    key={org.name}
                    className="flex items-center justify-between w-full px-3 py-2 rounded-md text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded bg-accent flex items-center justify-center">
                        <Building2 className="h-3 w-3 text-accent-foreground" />
                      </div>
                      <span className="truncate">{org.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                      {org.role}
                    </span>
                  </button>
                ))}
                <button
                  onClick={() => setJoinOrgOpen(true)}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm text-primary hover:bg-sidebar-accent transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Join Organization</span>
                </button>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Tools */}
        <SidebarGroup className="mt-4">
          {!collapsed && (
            <SidebarGroupLabel className="text-xs text-muted-foreground uppercase tracking-wider px-3 mb-2">
              Tools
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {toolsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url} className={getLinkClasses(item.url)}>
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src="" />
            <AvatarFallback className="bg-accent text-accent-foreground text-xs">
              JD
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0 animate-fade-in">
              <p className="text-sm font-medium truncate">John Doe</p>
              <p className="text-xs text-muted-foreground truncate">john@example.com</p>
            </div>
          )}
          {!collapsed && <SettingsDialog />}
        </div>
      </SidebarFooter>

      <JoinOrgModal open={joinOrgOpen} onOpenChange={setJoinOrgOpen} />
    </Sidebar>
  );
}
