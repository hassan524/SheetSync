import DashboardLayout from "@/components/layout/Dashboard-layout";
import StatsCard from "@/components/common/Stats-card";
import DashboardPanel from "@/components/common/Dashboard-panel";
import { FileSpreadsheet, Users, Building2, Star } from "lucide-react";
import QuickActions from "@/components/individual/dashboard/Quick-actions";
import DashboardWelcome from "@/components/individual/dashboard/Dashboard-welcome";
import TemplatePicker from "@/components/individual/dashboard/Template-picker";
import RecentSheets from "@/components/individual/dashboard/Recent-sheets";
import { getDashboardStats } from "@/lib/querys/individual/dashboard/getDashboardStats";

const Index = async () => {
  const stats = await getDashboardStats();

  return (
    <DashboardLayout breadcrumbItems={["SheetSync", "Dashboard"]}>
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">

        {/* Welcome */}
        <DashboardWelcome />

        {/* Stats */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[11px] font-semibold tracking-wide uppercase text-muted-foreground">
              Workspace overview
            </span>
            <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatsCard
              title="Total Sheets"
              value={String(stats.totalSheets)}
              icon={<FileSpreadsheet className="h-5 w-5 text-primary" />}
              description="All your spreadsheets"
            />
            <StatsCard
              title="Collaborators"
              value={String(stats.activeCollaborators)}
              icon={<Users className="h-5 w-5 text-primary" />}
              description="Working with you"
            />
            <StatsCard
              title="Organizations"
              value={String(stats.organizationsCount)}
              icon={<Building2 className="h-5 w-5 text-primary" />}
              description="Teams you're in"
            />
            <StatsCard
              title="Starred"
              value={String(stats.starredSheets)}
              icon={<Star className="h-5 w-5 text-primary" />}
              description="Pinned sheets"
            />
          </div>
        </section>

        {/* Templates — above recent sheets, just like original */}
        <TemplatePicker />

        {/* Recent Sheets + Activity Panel — equal-height side-by-side */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
          <div className="lg:col-span-2 flex flex-col">
            <RecentSheets />
          </div>
          <div className="flex flex-col">
            <DashboardPanel />
          </div>
        </div>

        {/* Quick Actions */}
        <QuickActions />

        {/* Pro tip */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 sm:px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
            <FileSpreadsheet className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">
              Pro tip: Use templates to get started faster
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              SheetSync offers pre-built templates for budgets, CRM, project management, and more. Browse them under{" "}
              <span className="text-primary font-medium">Tools → Templates</span> in the sidebar.
            </p>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default Index;
