import DashboardLayout from "@/components/layout/Dashboard-layout";

export default function OrganizationsLoading() {
  return (
    <DashboardLayout breadcrumbItems={["SheetSync", "Organizations"]}>
      <div className="max-w-7xl mx-auto space-y-10 animate-pulse">
        <div className="flex items-center gap-5">
          <div className="h-11 w-11 rounded-xl bg-muted" />
          <div className="space-y-2">
            <div className="h-5 w-36 bg-muted rounded-lg" />
            <div className="h-3 w-56 bg-muted rounded-lg" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 rounded-xl border border-border bg-card" />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 rounded-xl border border-border bg-card" />
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
