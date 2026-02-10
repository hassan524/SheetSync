'use client'

import { useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import SheetCard from "@/components/sheets/SheetCard";
import TemplateCard from "@/components/sheets/TemplateCard";
import NewSheetModal from "@/components/sheets/NewSheetModal";
import UseTemplateModal from "@/components/sheets/UseTemplateModal";
import InviteTeamModal from "@/components/modals/InviteTeamModal";
import CreateOrgModal from "@/components/modals/CreateOrgModal";
import StatsCard from "@/components/common/StatsCard";
import ActivityFeed from "@/components/common/ActivityFeed";
import { Button } from "@/components/ui/button";
import {
  FileSpreadsheet,
  Calculator,
  BarChart3,
  Calendar,
  ArrowRight,
  Plus,
  Users,
  Building2,
  Clock,
  TrendingUp,
  Activity,
} from "lucide-react";

const templates = [
  {
    id: "budget",
    title: "Budget Tracker",
    description: "Track income, expenses, and savings with automated calculations",
    icon: <Calculator className="h-5 w-5 text-primary-foreground" />,
    color: "bg-primary",
    features: ["Auto-sum formulas", "Monthly breakdown", "Expense categories", "Savings goals"],
  },
  {
    id: "timeline",
    title: "Project Timeline",
    description: "Plan and visualize project milestones and deadlines",
    icon: <Calendar className="h-5 w-5 text-primary-foreground" />,
    color: "bg-primary",
    features: ["Gantt view", "Milestone tracking", "Team assignments", "Due date alerts"],
  },
  {
    id: "sales",
    title: "Sales Dashboard",
    description: "Monitor sales performance with charts and KPIs",
    icon: <BarChart3 className="h-5 w-5 text-primary-foreground" />,
    color: "bg-primary",
    features: ["Real-time charts", "KPI widgets", "Pipeline tracking", "Revenue forecast"],
  },
  {
    id: "blank",
    title: "Blank Sheet",
    description: "Start fresh with a clean spreadsheet",
    icon: <FileSpreadsheet className="h-5 w-5 text-primary-foreground" />,
    color: "bg-primary",
    features: ["100+ columns", "10,000+ rows", "All formulas", "Custom styling"],
  },
];

const recentSheets = [
  { title: "Q4 Financial Report", lastEdited: "2 hours ago", isStarred: true, sharedWith: 5 },
  { title: "Marketing Budget 2024", lastEdited: "Yesterday", isStarred: false, sharedWith: 3 },
  { title: "Team Roster", lastEdited: "3 days ago", isStarred: true },
  { title: "Product Roadmap", lastEdited: "1 week ago", sharedWith: 12 },
];

const Index = () => {
  const navigate = useRouter();
  const [newSheetOpen, setNewSheetOpen] = useState(false);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [inviteTeamOpen, setInviteTeamOpen] = useState(false);
  const [createOrgOpen, setCreateOrgOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<typeof templates[0] | null>(null);

  const handleTemplateClick = (template: typeof templates[0]) => {
    setSelectedTemplate(template);
    setTemplateModalOpen(true);
  };

  return (
    <DashboardLayout breadcrumbItems={["SheetSync", "Dashboard"]}>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Welcome Section */}
        <section className="animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-semibold">Welcome back, John</h1>
              <p className="text-muted-foreground mt-1">
                Here's what's happening with your spreadsheets today
              </p>
            </div>
            <Button onClick={() => setNewSheetOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Sheet
            </Button>
          </div>
        </section>

        {/* Stats Section */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Sheets"
            value="47"
            change={12}
            icon={<FileSpreadsheet className="h-5 w-5 text-primary" />}
          />
          <StatsCard
            title="Active Collaborators"
            value="24"
            change={8}
            icon={<Users className="h-5 w-5 text-primary" />}
          />
          <StatsCard
            title="Organizations"
            value="5"
            change={0}
            icon={<Building2 className="h-5 w-5 text-primary" />}
          />
          <StatsCard
            title="Hours Saved"
            value="128"
            change={23}
            changeLabel="this month"
            icon={<TrendingUp className="h-5 w-5 text-primary" />}
          />
        </section>

        {/* Templates Section */}
        <section className="animate-fade-in">
          <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold">Start with a template</h2>
                <p className="text-sm text-muted-foreground">
                  Get started quickly with pre-built spreadsheet templates
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-primary"
                onClick={() => navigate.push("/templates")}
              >
                View all templates
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {templates.map((template, index) => (
              <div 
                key={template.id} 
                className={`stagger-${index + 1}`}
                onClick={() => handleTemplateClick(template)}
              >
                <TemplateCard {...template} />
              </div>
            ))}
          </div>
        </section>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Sheets */}
          <section className="lg:col-span-2 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold">Recent Sheets</h2>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-primary"
                onClick={() => navigate.push("/recent")}
              >
                View all
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {recentSheets.map((sheet, index) => (
                <div key={sheet.title} style={{ animationDelay: `${index * 50}ms` }}>
                  <SheetCard {...sheet} />
                </div>
              ))}
            </div>
          </section>

          {/* Activity Feed */}
          <section className="animate-fade-in">
            <div className="bg-card rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-semibold">Activity</h3>
              </div>
              <ActivityFeed />
            </div>
          </section>
        </div>

        {/* Quick Actions */}
        <section className="animate-fade-in">
          <div className="bg-muted/30 rounded-xl p-6 border">
            <h3 className="font-semibold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Button 
                variant="outline" 
                className="h-auto py-4 flex-col gap-2"
                onClick={() => setNewSheetOpen(true)}
              >
                <Plus className="h-5 w-5" />
                <span className="text-sm">New Sheet</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-4 flex-col gap-2"
                onClick={() => setInviteTeamOpen(true)}
              >
                <Users className="h-5 w-5" />
                <span className="text-sm">Invite Team</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-4 flex-col gap-2"
                onClick={() => setCreateOrgOpen(true)}
              >
                <Building2 className="h-5 w-5" />
                <span className="text-sm">New Org</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-4 flex-col gap-2"
                onClick={() => navigate.push("/import")}
              >
                <FileSpreadsheet className="h-5 w-5" />
                <span className="text-sm">Import</span>
              </Button>
            </div>
          </div>
        </section>
      </div>

      {/* Modals */}
      <NewSheetModal open={newSheetOpen} onOpenChange={setNewSheetOpen} />
      <UseTemplateModal
        open={templateModalOpen}
        onOpenChange={setTemplateModalOpen}
        template={selectedTemplate}
      />
      <InviteTeamModal open={inviteTeamOpen} onOpenChange={setInviteTeamOpen} />
      <CreateOrgModal open={createOrgOpen} onOpenChange={setCreateOrgOpen} />
    </DashboardLayout>
  );
};

export default Index;
