import DashboardLayout from "@/components/layout/Dashboard-layout";
import StatsCard from "@/components/common/Stats-card";
import DashboardPanel from "@/components/common/Dashboard-panel";
import {
  FileSpreadsheet,
  Users,
  Building2,
  TrendingUp
} from "lucide-react";
import QuickActions from "@/components/individual/dashboard/Quick-actions";
import DashboardWelcome from "@/components/individual/dashboard/Dashboard-welcome";
import TemplatePicker from "@/components/individual/dashboard/Template-picker";
import RecentSheets from "@/components/individual/dashboard/Recent-sheets";
import { getDashboardStats } from "@/lib/querys/individual/dashboard/getDashboardStats";

const Index = async () => {
  const stats = await getDashboardStats();

  return (
    <DashboardLayout breadcrumbItems={["SheetSync", "Dashboard"]}>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Welcome Section */}
        <DashboardWelcome />

        {/* Stats Section */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Sheets"
            value={String(stats.totalSheets)}
            icon={<FileSpreadsheet className="h-5 w-5 text-primary" />}
          />
          <StatsCard
            title="Collaborators"
            value={String(stats.activeCollaborators)}
            icon={<Users className="h-5 w-5 text-primary" />}
          />
          <StatsCard
            title="Organizations"
            value={String(stats.organizationsCount)}
            icon={<Building2 className="h-5 w-5 text-primary" />}
          />
          <StatsCard
            title="Est. Hours Saved"
            value={String(stats.hoursSaved)}
            icon={<TrendingUp className="h-5 w-5 text-primary" />}
          />
        </section>

        {/* Template picker section  */}
        <TemplatePicker />

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Sheets */}
          <RecentSheets />

          {/* Activity Feed */}
          <section className="animate-fade-in">
            <DashboardPanel />
          </section>
        </div>

        {/* Quick Actions */}
        <QuickActions />
      </div>
    </DashboardLayout>
  );
};

export default Index;