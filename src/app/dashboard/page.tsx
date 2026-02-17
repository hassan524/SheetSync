import DashboardLayout from "@/components/layout/Dashboard-layout";
import StatsCard from "@/components/common/Stats-card";
import ActivityFeed from "@/components/common/Activity-feed";
import {
  FileSpreadsheet,
  Users,
  Building2,
  TrendingUp,
  Activity,
} from "lucide-react";
import QuickActions from "@/components/individual/dashboard/Quick-actions";
import DashboardWelcome from "@/components/individual/dashboard/Dashboard-welcome";
import TemplatePicker from "@/components/individual/dashboard/Template-picker";
import RecentSheets from "@/components/individual/dashboard/Recent-sheets";

const Index = () => {
  return (
    <DashboardLayout breadcrumbItems={["SheetSync", "Dashboard"]}>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Welcome Section */}
        <DashboardWelcome />

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

        {/* Template picker section  */}
        <TemplatePicker />

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Sheets */}
          <RecentSheets />

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
        <QuickActions />
      </div>
    </DashboardLayout>
  );
};

export default Index;
