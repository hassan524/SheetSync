export function PageHeaderSkeleton() {
  return (
    <div className="flex items-center gap-3 animate-pulse">
      <div className="h-11 w-11 rounded-xl bg-muted" />
      <div className="space-y-2">
        <div className="h-5 w-40 rounded bg-muted" />
        <div className="h-3 w-64 rounded bg-muted" />
      </div>
    </div>
  );
}
