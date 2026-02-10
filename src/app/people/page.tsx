'use client'

import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PersonCard from "@/components/people/PersonCard";
import PeopleTable from "@/components/tables/PeopleTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { UserPlus, Search, Filter, Grid3X3, List, Mail, Users } from "lucide-react";

const people = [
  {
    name: "Sarah Johnson",
    email: "sarah.johnson@acme.com",
    organizations: ["Acme Corporation", "Design Team"],
    status: "online" as const,
  },
  {
    name: "Michael Chen",
    email: "m.chen@acme.com",
    organizations: ["Acme Corporation"],
    status: "away" as const,
  },
  {
    name: "Emily Davis",
    email: "emily.d@acme.com",
    organizations: ["Marketing Department", "Design Team"],
    status: "online" as const,
  },
  {
    name: "James Wilson",
    email: "j.wilson@acme.com",
    organizations: ["Acme Corporation"],
    status: "offline" as const,
  },
  {
    name: "Olivia Martinez",
    email: "olivia.m@acme.com",
    organizations: ["Engineering", "Design Team"],
    status: "online" as const,
  },
  {
    name: "William Brown",
    email: "w.brown@acme.com",
    organizations: ["Human Resources"],
    status: "offline" as const,
  },
  {
    name: "Sophia Lee",
    email: "sophia.lee@acme.com",
    organizations: ["Marketing Department"],
    status: "away" as const,
  },
  {
    name: "Benjamin Taylor",
    email: "b.taylor@acme.com",
    organizations: ["Engineering", "Acme Corporation"],
    status: "online" as const,
  },
];

const tableData = people.map((person, index) => ({
  id: `person-${index}`,
  name: person.name,
  email: person.email,
  initials: person.name.split(" ").map(n => n[0]).join(""),
  role: (["Admin", "Editor", "Viewer"] as const)[index % 3],
  status: person.status,
  lastActive: ["Just now", "5 min ago", "1 hour ago", "3 hours ago", "Yesterday", "2 days ago", "1 week ago", "Just now"][index],
  sheetsAccess: Math.floor(Math.random() * 20) + 5,
  organizations: person.organizations,
}));

const PeoplePage = () => {
  const [viewMode, setViewMode] = useState<"cards" | "table">("table");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("editor");
  const [searchQuery, setSearchQuery] = useState("");
  const [orgFilter, setOrgFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all-status");

  const handleInvite = () => {
    console.log({ inviteEmail, inviteRole });
    setInviteOpen(false);
    setInviteEmail("");
    setInviteRole("editor");
  };

  // Filter people based on search, org, and status
  const filteredPeople = people.filter((person) => {
    const matchesSearch = 
      person.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      person.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesOrg = orgFilter === "all" || 
      person.organizations.some((org) => 
        org.toLowerCase().includes(orgFilter.toLowerCase())
      );
    
    const matchesStatus = statusFilter === "all-status" || person.status === statusFilter;
    
    return matchesSearch && matchesOrg && matchesStatus;
  });

  const filteredTableData = tableData.filter((person) => {
    const matchesSearch = 
      person.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      person.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesOrg = orgFilter === "all" || 
      person.organizations.some((org) => 
        org.toLowerCase().includes(orgFilter.toLowerCase())
      );
    
    const matchesStatus = statusFilter === "all-status" || person.status === statusFilter;
    
    return matchesSearch && matchesOrg && matchesStatus;
  });

  const onlineCount = filteredPeople.filter(p => p.status === "online").length;
  const awayCount = filteredPeople.filter(p => p.status === "away").length;

  return (
    <DashboardLayout breadcrumbItems={["SheetSync", "People"]}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-semibold animate-fade-in">People</h1>
            <p className="text-muted-foreground animate-fade-in">
              View and manage collaborators across your organizations
            </p>
          </div>
          <Button className="animate-fade-in" onClick={() => setInviteOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Invite People
          </Button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-card border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Total People</p>
            <p className="text-2xl font-semibold">{filteredPeople.length}</p>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Online Now</p>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              <p className="text-2xl font-semibold">{onlineCount}</p>
            </div>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Away</p>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-amber-500" />
              <p className="text-2xl font-semibold">{awayCount}</p>
            </div>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Pending Invites</p>
            <p className="text-2xl font-semibold">3</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6 animate-slide-up">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search people..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <Select value={orgFilter} onValueChange={setOrgFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Organizations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Organizations</SelectItem>
                <SelectItem value="acme">Acme Corporation</SelectItem>
                <SelectItem value="design">Design Team</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="engineering">Engineering</SelectItem>
                <SelectItem value="human">Human Resources</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-status">All Status</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="away">Away</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              size="icon"
              onClick={() => {
                setOrgFilter("all");
                setStatusFilter("all-status");
                setSearchQuery("");
              }}
              title="Reset filters"
            >
              <Filter className="h-4 w-4" />
            </Button>

            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "cards" | "table")}>
              <TabsList className="h-9">
                <TabsTrigger value="table" className="px-3">
                  <List className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="cards" className="px-3">
                  <Grid3X3 className="h-4 w-4" />
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* People List/Table */}
        {viewMode === "table" ? (
          <PeopleTable people={filteredTableData} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPeople.map((person, index) => (
              <div key={person.email} style={{ animationDelay: `${index * 50}ms` }}>
                <PersonCard {...person} />
              </div>
            ))}
          </div>
        )}

        {filteredPeople.length === 0 && (
          <div className="text-center py-12 animate-fade-in">
            <p className="text-muted-foreground">No people found matching your filters.</p>
          </div>
        )}
      </div>

      {/* Invite Modal */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
                <UserPlus className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <DialogTitle>Invite People</DialogTitle>
                <DialogDescription>
                  Invite team members to collaborate on your sheets
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin - Full access</SelectItem>
                  <SelectItem value="editor">Editor - Can edit sheets</SelectItem>
                  <SelectItem value="viewer">Viewer - View only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Add to Organization</Label>
              <Select defaultValue="acme">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="acme">Acme Corporation</SelectItem>
                  <SelectItem value="design">Design Team</SelectItem>
                  <SelectItem value="marketing">Marketing Department</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Pending Invitations (3)
              </h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• john.doe@example.com - Sent 2 days ago</li>
                <li>• jane.smith@example.com - Sent 1 week ago</li>
                <li>• alex.wong@example.com - Sent 3 days ago</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleInvite} disabled={!inviteEmail.trim()}>
              Send Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default PeoplePage;
