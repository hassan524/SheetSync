import DashboardLayout from "@/components/layout/Dashboard-layout";

export default function DashboardLoading() {
  return (
    <DashboardLayout breadcrumbItems={["SheetSync", "Dashboard"]}>
      <div className="max-w-7xl mx-auto space-y-8 animate-pulse">
        {/* Welcome skeleton */}
        <div className="space-y-2">
          <div className="h-6 w-48 bg-muted rounded-lg" />
          <div className="h-4 w-72 bg-muted rounded-lg" />
        </div>
        {/* Stats skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 rounded-xl border border-border bg-card" />
          ))}
        </div>
        {/* Content skeleton */}
        <div className="h-48 rounded-xl border border-border bg-card" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 h-64 rounded-xl border border-border bg-card" />
          <div className="h-64 rounded-xl border border-border bg-card" />
        </div>
      </div>
    </DashboardLayout>
  );
}

