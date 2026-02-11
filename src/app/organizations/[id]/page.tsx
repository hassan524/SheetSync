'use client'

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SheetsTable from "@/components/tables/SheetsTable";
import MembersTable from "@/components/tables/MembersTable";
import NewSheetModal from "@/components/sheets/NewSheetModal";
import InviteTeamModal from "@/components/modals/InviteTeamModal";
import GridBackground from "@/components/common/GridBackground";
import {
  Building2,
  Users,
  FileSpreadsheet,
  Clock,
  ArrowLeft,
  Plus,
  UserPlus,
  Settings,
  Circle,
  HardDrive,
  Activity,
  TrendingUp,
  Calendar,
  Shield,
  Star,
  BarChart3,
  Zap,
  Globe,
  Lock,
  Eye,
  Edit3,
  Share2,
  Download,
} from "lucide-react";

// Mock data for a single organization
const getOrganizationData = (id: string) => ({
  id,
  name: id === "1" ? "Acme Corporation" : id === "2" ? "TechStart Inc" : "Design Studio",
  description: "A collaborative workspace for managing spreadsheets and data across teams.",
  role: "Admin" as const,
  members: 24,
  activeNow: 8,
  sheets: 156,
  storageUsed: 4.2,
  storageLimit: 10,
  createdAt: "Jan 15, 2024",
  lastActivity: "2 minutes ago",
  plan: "Business",
  weeklyStats: {
    sheetsCreated: 12,
    editsThisWeek: 847,
    collaborations: 34,
  },
  membersList: [
    { id: "1", name: "John Doe", email: "john@acme.com", role: "Admin" as const, status: "online" as const, lastActive: "Now", avatar: "JD" },
    { id: "2", name: "Sarah Wilson", email: "sarah@acme.com", role: "Admin" as const, status: "online" as const, lastActive: "Now", avatar: "SW" },
    { id: "3", name: "Mike Chen", email: "mike@acme.com", role: "Member" as const, status: "online" as const, lastActive: "Now", avatar: "MC" },
    { id: "4", name: "Emily Brown", email: "emily@acme.com", role: "Member" as const, status: "online" as const, lastActive: "Now", avatar: "EB" },
    { id: "5", name: "Alex Turner", email: "alex@acme.com", role: "Member" as const, status: "online" as const, lastActive: "Now", avatar: "AT" },
    { id: "6", name: "Lisa Park", email: "lisa@acme.com", role: "Member" as const, status: "online" as const, lastActive: "Now", avatar: "LP" },
    { id: "7", name: "David Kim", email: "david@acme.com", role: "Member" as const, status: "online" as const, lastActive: "Now", avatar: "DK" },
    { id: "8", name: "Rachel Green", email: "rachel@acme.com", role: "Member" as const, status: "online" as const, lastActive: "Now", avatar: "RG" },
    { id: "9", name: "Tom Harris", email: "tom@acme.com", role: "Viewer" as const, status: "offline" as const, lastActive: "1 hour ago", avatar: "TH" },
    { id: "10", name: "Nina Patel", email: "nina@acme.com", role: "Member" as const, status: "offline" as const, lastActive: "3 hours ago", avatar: "NP" },
  ],
  sheetsList: [
    { id: "1", title: "Q4 Financial Report", owner: { name: "John Doe", initials: "JD" }, visibility: "team" as const, lastModified: "2 hours ago", lastModifiedBy: "John Doe", collaborators: 5, activeEditors: 2, isStarred: true, size: "2.4 MB" },
    { id: "2", title: "Marketing Campaign Data", owner: { name: "Sarah Wilson", initials: "SW" }, visibility: "team" as const, lastModified: "5 hours ago", lastModifiedBy: "Sarah Wilson", collaborators: 3, activeEditors: 1, isStarred: false, size: "1.8 MB" },
    { id: "3", title: "Employee Directory", owner: { name: "Mike Chen", initials: "MC" }, visibility: "private" as const, lastModified: "1 day ago", lastModifiedBy: "Mike Chen", collaborators: 8, activeEditors: 0, isStarred: true, size: "3.2 MB" },
    { id: "4", title: "Sales Pipeline 2024", owner: { name: "Emily Brown", initials: "EB" }, visibility: "team" as const, lastModified: "2 days ago", lastModifiedBy: "Emily Brown", collaborators: 4, activeEditors: 3, isStarred: false, size: "1.5 MB" },
    { id: "5", title: "Product Roadmap", owner: { name: "Alex Turner", initials: "AT" }, visibility: "public" as const, lastModified: "3 days ago", lastModifiedBy: "Alex Turner", collaborators: 6, activeEditors: 0, isStarred: false, size: "890 KB" },
    { id: "6", title: "Budget Planning", owner: { name: "John Doe", initials: "JD" }, visibility: "private" as const, lastModified: "1 week ago", lastModifiedBy: "John Doe", collaborators: 2, activeEditors: 0, isStarred: false, size: "1.1 MB" },
  ],
  recentActivity: [
    { user: "John Doe", action: "edited", target: "Q4 Financial Report", time: "2 minutes ago", avatar: "JD" },
    { user: "Sarah Wilson", action: "created", target: "New Marketing Sheet", time: "1 hour ago", avatar: "SW" },
    { user: "Mike Chen", action: "shared", target: "Employee Directory", time: "3 hours ago", avatar: "MC" },
    { user: "Emily Brown", action: "commented on", target: "Sales Pipeline 2024", time: "5 hours ago", avatar: "EB" },
    { user: "Alex Turner", action: "updated", target: "Product Roadmap", time: "6 hours ago", avatar: "AT" },
    { user: "Lisa Park", action: "downloaded", target: "Budget Report Q3", time: "Yesterday", avatar: "LP" },
  ],
  quickStats: [
    { label: "Views Today", value: "1,247", icon: Eye, change: "+12%" },
    { label: "Edits Today", value: "89", icon: Edit3, change: "+5%" },
    { label: "Shares", value: "23", icon: Share2, change: "+18%" },
    { label: "Downloads", value: "156", icon: Download, change: "+8%" },
  ],
});

const roleVariants = {
  Admin: "default" as const,
  Member: "secondary" as const,
  Viewer: "outline" as const,
};

const OrganizationDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useRouter();
  const [isNewSheetOpen, setIsNewSheetOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const org = getOrganizationData(id || "1");
  const onlineMembers = org.membersList.filter(m => m.status === "online");
  const offlineMembers = org.membersList.filter(m => m.status === "offline");

  return (
    <DashboardLayout breadcrumbItems={["Organizations", org.name]}>
      <div className="space-y-6 animate-fade-in">
        {/* Hero Header Section */}
        <div className="relative overflow-hidden rounded-2xl border bg-card">
          <GridBackground variant="default" className="opacity-30" />
          <div className="relative p-6 md:p-8">
            {/* Top Row - Back & Actions */}
            <div className="flex items-center justify-between mb-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate.push("/organizations")}
                className="gap-2 hover:bg-background/50"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back to Organizations</span>
              </Button>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsInviteOpen(true)} className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  <span className="hidden sm:inline">Invite</span>
                </Button>
                <Button size="sm" onClick={() => setIsNewSheetOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Create Sheet</span>
                </Button>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Organization Info */}
            <div className="flex flex-col lg:flex-row lg:items-start gap-6">
              {/* Left - Main Info */}
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
                    <Building2 className="h-8 w-8 md:h-10 md:w-10 text-primary-foreground" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="text-2xl md:text-3xl font-bold">{org.name}</h1>
                      <Badge variant={roleVariants[org.role]} className="gap-1">
                        <Shield className="h-3 w-3" />
                        {org.role}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground max-w-xl">{org.description}</p>
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      <Badge variant="outline" className="bg-background/50 gap-1">
                        <Zap className="h-3 w-3 text-primary" />
                        {org.plan} Plan
                      </Badge>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        Created {org.createdAt}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right - Quick Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-3 lg:max-w-md">
                {org.quickStats.map((stat, i) => (
                  <div key={i} className="bg-background/60 backdrop-blur-sm rounded-xl p-3 border">
                    <div className="flex items-center gap-2 mb-1">
                      <stat.icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{stat.label}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-bold">{stat.value}</span>
                      <span className="text-xs text-emerald-600">{stat.change}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="relative overflow-hidden">
            <GridBackground variant="dots" className="opacity-20" />
            <CardContent className="relative pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Members</p>
                  <p className="text-3xl font-bold mt-1">{org.members}</p>
                  <p className="text-xs text-emerald-600 flex items-center gap-1 mt-1">
                    <TrendingUp className="h-3 w-3" />+12% this month
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <GridBackground variant="dots" className="opacity-20" />
            <CardContent className="relative pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Now</p>
                  <p className="text-3xl font-bold mt-1 text-emerald-600">{org.activeNow}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <Circle className="h-2 w-2 fill-emerald-500 text-emerald-500 animate-pulse" />
                    Live collaborating
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Activity className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <GridBackground variant="dots" className="opacity-20" />
            <CardContent className="relative pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Sheets</p>
                  <p className="text-3xl font-bold mt-1">{org.sheets}</p>
                  <p className="text-xs text-emerald-600 flex items-center gap-1 mt-1">
                    <TrendingUp className="h-3 w-3" />+8 this week
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <FileSpreadsheet className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <GridBackground variant="dots" className="opacity-20" />
            <CardContent className="relative pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Storage</p>
                  <p className="text-3xl font-bold mt-1">{org.storageUsed} GB</p>
                  <Progress value={(org.storageUsed / org.storageLimit) * 100} className="h-1.5 mt-2 w-20" />
                </div>
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <HardDrive className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Members Section */}
        <Card className="relative overflow-hidden">
          <GridBackground variant="default" className="opacity-10" />
          <CardHeader className="relative pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Activity className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    Currently Active
                    <Badge variant="secondary" className="ml-1 bg-emerald-500/10 text-emerald-600 gap-1">
                      <Circle className="h-2 w-2 fill-emerald-500 animate-pulse" />
                      {onlineMembers.length} online
                    </Badge>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">Team members working right now</p>
                </div>
              </div>
              <span className="text-xs text-muted-foreground hidden sm:block">
                <Clock className="h-3 w-3 inline mr-1" />
                Last activity: {org.lastActivity}
              </span>
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {onlineMembers.map((member) => (
                <div
                  key={member.id}
                  className="group flex items-center gap-3 p-3 rounded-xl bg-background border hover:border-primary/30 hover:shadow-sm transition-all duration-200 cursor-pointer"
                >
                  <div className="relative shrink-0">
                    <Avatar className="h-10 w-10 ring-2 ring-emerald-500/20">
                      <AvatarFallback className="text-sm bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-medium">
                        {member.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-card" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{member.name}</p>
                    <p className="text-xs text-muted-foreground">{member.role}</p>
                  </div>
                </div>
              ))}
            </div>
            {offlineMembers.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-muted-foreground mb-3">
                  {offlineMembers.length} members offline
                </p>
                <div className="flex flex-wrap gap-2">
                  {offlineMembers.slice(0, 5).map((member) => (
                    <div key={member.id} className="flex items-center gap-2 px-2 py-1 rounded-lg bg-muted/50">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-[10px] bg-muted text-muted-foreground">
                          {member.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-muted-foreground">{member.name}</span>
                    </div>
                  ))}
                  {offlineMembers.length > 5 && (
                    <div className="flex items-center px-2 py-1 rounded-lg bg-muted/50">
                      <span className="text-xs text-muted-foreground">+{offlineMembers.length - 5} more</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left - Tabs Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="sheets" className="space-y-4">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="sheets" className="gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  Sheets ({org.sheetsList.length})
                </TabsTrigger>
                <TabsTrigger value="members" className="gap-2">
                  <Users className="h-4 w-4" />
                  Members ({org.membersList.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="sheets" className="space-y-4">
                <SheetsTable sheets={org.sheetsList} />
              </TabsContent>

              <TabsContent value="members" className="space-y-4">
                <MembersTable members={org.membersList} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Right - Sidebar */}
          <div className="space-y-4">
            {/* Activity Feed */}
            <Card className="relative overflow-hidden">
              <GridBackground variant="dots" className="opacity-10" />
              <CardHeader className="relative pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="relative space-y-1">
                {org.recentActivity.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {activity.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">
                        <span className="font-medium">{activity.user}</span>{" "}
                        <span className="text-muted-foreground">{activity.action}</span>{" "}
                        <span className="font-medium truncate">{activity.target}</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Weekly Summary */}
            <Card className="relative overflow-hidden">
              <GridBackground variant="default" className="opacity-10" />
              <CardHeader className="relative pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  This Week
                </CardTitle>
              </CardHeader>
              <CardContent className="relative space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Sheets Created</span>
                  <span className="font-semibold">{org.weeklyStats.sheetsCreated}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Edits</span>
                  <span className="font-semibold">{org.weeklyStats.editsThisWeek}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Collaborations</span>
                  <span className="font-semibold">{org.weeklyStats.collaborations}</span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" className="justify-start gap-2" onClick={() => setIsNewSheetOpen(true)}>
                  <Plus className="h-4 w-4" />
                  New Sheet
                </Button>
                <Button variant="outline" size="sm" className="justify-start gap-2" onClick={() => setIsInviteOpen(true)}>
                  <UserPlus className="h-4 w-4" />
                  Invite
                </Button>
                <Button variant="outline" size="sm" className="justify-start gap-2">
                  <Star className="h-4 w-4" />
                  Starred
                </Button>
                <Button variant="outline" size="sm" className="justify-start gap-2">
                  <Settings className="h-4 w-4" />
                  Settings
                </Button>
              </CardContent>
            </Card>

            {/* Organization Info Footer */}
            <Card className="bg-muted/30">
              <CardContent className="pt-4 space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Visibility:</span>
                  <span className="font-medium">Private</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Access:</span>
                  <span className="font-medium">Invite Only</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Created:</span>
                  <span className="font-medium">{org.createdAt}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <NewSheetModal open={isNewSheetOpen} onOpenChange={setIsNewSheetOpen} />
      <InviteTeamModal open={isInviteOpen} onOpenChange={setIsInviteOpen} />
    </DashboardLayout>
  );
};

export default OrganizationDetailPage;