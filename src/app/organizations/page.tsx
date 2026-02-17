"use client";

import { useState } from "react";
import DashboardLayout from "@/components/layout/Dashboard-layout";
import OrganizationCard from "@/components/organizations/Organization-card";
import OrganizationsTable from "@/components/tables/Organizations-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Building2, Grid3X3, List, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const organizations = [
  {
    name: "Acme Corporation",
    role: "Admin" as const,
    members: 24,
    sheets: 47,
    recentMembers: [
      { name: "Alice", initials: "AL" },
      { name: "Bob", initials: "BM" },
      { name: "Charlie", initials: "CD" },
      { name: "Diana", initials: "DE" },
    ],
  },
  {
    name: "Design Team",
    role: "Member" as const,
    members: 8,
    sheets: 15,
    recentMembers: [
      { name: "Eve", initials: "EF" },
      { name: "Frank", initials: "FG" },
    ],
  },
  {
    name: "Marketing Department",
    role: "Viewer" as const,
    members: 15,
    sheets: 28,
    recentMembers: [
      { name: "Grace", initials: "GH" },
      { name: "Henry", initials: "HI" },
      { name: "Ivy", initials: "IJ" },
    ],
  },
  {
    name: "Engineering",
    role: "Member" as const,
    members: 32,
    sheets: 89,
    recentMembers: [
      { name: "Jack", initials: "JK" },
      { name: "Kate", initials: "KL" },
      { name: "Leo", initials: "LM" },
      { name: "Maya", initials: "MN" },
      { name: "Noah", initials: "NO" },
    ],
  },
  {
    name: "Human Resources",
    role: "Viewer" as const,
    members: 6,
    sheets: 12,
    recentMembers: [{ name: "Olivia", initials: "OP" }],
  },
];

const tableData = organizations.map((org, index) => ({
  id: `org-${index}`,
  name: org.name,
  role: org.role,
  members: org.members,
  activeNow: Math.floor(org.members * 0.3),
  sheets: org.sheets,
  storageUsed: Math.random() * 4 + 1,
  storageLimit: 10,
  lastModified: [
    "2 hours ago",
    "Yesterday",
    "3 days ago",
    "1 week ago",
    "2 weeks ago",
  ][index],
  createdAt: ["Jan 2023", "Mar 2023", "Jun 2023", "Aug 2023", "Nov 2023"][
    index
  ],
}));

const OrganizationsPage = () => {
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [createOrgOpen, setCreateOrgOpen] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [orgDescription, setOrgDescription] = useState("");

  const handleCreateOrg = () => {
    console.log({ orgName, orgDescription });
    setCreateOrgOpen(false);
    setOrgName("");
    setOrgDescription("");
  };

  return (
    <DashboardLayout breadcrumbItems={["SheetSync", "Organizations"]}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-semibold animate-fade-in">
              Organizations
            </h1>
            <p className="text-muted-foreground animate-fade-in">
              Manage and collaborate with your teams
            </p>
          </div>
          <div className="flex gap-2 animate-fade-in">
            <Button variant="outline">
              <Users className="h-4 w-4 mr-2" />
              Join Organization
            </Button>
            <Button onClick={() => setCreateOrgOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Organization
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-card border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Total Organizations</p>
            <p className="text-2xl font-semibold">{organizations.length}</p>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Total Members</p>
            <p className="text-2xl font-semibold">
              {organizations.reduce((a, b) => a + b.members, 0)}
            </p>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Total Sheets</p>
            <p className="text-2xl font-semibold">
              {organizations.reduce((a, b) => a + b.sheets, 0)}
            </p>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Admin Access</p>
            <p className="text-2xl font-semibold">
              {organizations.filter((o) => o.role === "Admin").length}
            </p>
          </div>
        </div>

        {/* Search & View Toggle */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6 animate-slide-up">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search organizations..."
              className="pl-9"
            />
          </div>
          <Tabs
            value={viewMode}
            onValueChange={(v) => setViewMode(v as "grid" | "table")}
          >
            <TabsList className="h-9">
              <TabsTrigger value="grid" className="px-3">
                <Grid3X3 className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="table" className="px-3">
                <List className="h-4 w-4" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Organizations Grid/Table */}
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {organizations.map((org, index) => (
              <div key={org.name} style={{ animationDelay: `${index * 50}ms` }}>
                <OrganizationCard {...org} />
              </div>
            ))}
          </div>
        ) : (
          <OrganizationsTable organizations={tableData} />
        )}
      </div>

      {/* Create Organization Modal */}
      <Dialog open={createOrgOpen} onOpenChange={setCreateOrgOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <DialogTitle>Create Organization</DialogTitle>
                <DialogDescription>
                  Create a new organization to collaborate with your team
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="org-name">Organization Name</Label>
              <Input
                id="org-name"
                placeholder="e.g., Engineering Team"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="org-description">Description (optional)</Label>
              <Textarea
                id="org-description"
                placeholder="What is this organization for?"
                value={orgDescription}
                onChange={(e) => setOrgDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <h4 className="text-sm font-medium">What happens next?</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• You'll be the admin of this organization</li>
                <li>• Invite team members via email</li>
                <li>• Create shared sheets for collaboration</li>
                <li>• Manage roles and permissions</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOrgOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateOrg} disabled={!orgName.trim()}>
              Create Organization
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default OrganizationsPage;
