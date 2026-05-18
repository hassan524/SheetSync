import DashboardLayout from "@/components/layout/Dashboard-layout";

export default function SheetsLoading() {
  return (
    <DashboardLayout breadcrumbItems={["SheetSync", "Personal Sheets"]}>
      <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-6 w-40 bg-muted rounded-lg" />
            <div className="h-3 w-64 bg-muted rounded-lg" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl border border-border bg-card" />
          ))}
        </div>
        <div className="h-20 rounded-xl border border-border bg-card" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-36 rounded-xl border border-border bg-card" />
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
