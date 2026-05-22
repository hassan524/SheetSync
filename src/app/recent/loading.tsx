import DashboardLayout from "@/components/layout/Dashboard-layout";

export default function RecentLoading() {
  return (
    <DashboardLayout breadcrumbItems={["SheetSync", "Recent"]}>
      <div className="max-w-7xl mx-auto space-y-8 animate-pulse">
        <div className="flex items-center gap-5">
          <div className="h-11 w-11 rounded-xl bg-muted" />
          <div className="space-y-2">
            <div className="h-5 w-24 bg-muted rounded-lg" />
            <div className="h-3 w-48 bg-muted rounded-lg" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl border border-border bg-card" />
          ))}
        </div>
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-12 rounded-lg border border-border bg-card" />
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}

