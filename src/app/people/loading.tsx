import DashboardLayout from "@/components/layout/Dashboard-layout";

export default function PeopleLoading() {
  return (
    <DashboardLayout breadcrumbItems={["SheetSync", "People"]}>
      <div className="max-w-7xl mx-auto space-y-10 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="h-11 w-11 rounded-xl bg-muted" />
            <div className="space-y-2">
              <div className="h-5 w-24 bg-muted rounded-lg" />
              <div className="h-3 w-56 bg-muted rounded-lg" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 rounded-xl border border-border bg-card" />
          ))}
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 rounded-lg border border-border bg-card" />
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}

