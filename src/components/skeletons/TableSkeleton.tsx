export function TableSkeleton({ rows = 8, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="border rounded-xl overflow-hidden" style={{ minHeight: "65vh" }}>
      {/* Header */}
      <div className="border-b bg-muted/30 px-4 py-3 flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="h-3 rounded bg-muted animate-pulse" style={{ width: i === 0 ? "25%" : `${10 + Math.floor(60 / columns)}%` }} />
        ))}
      </div>
      {/* Rows */}
      <div className="divide-y">
        {Array.from({ length: rows }).map((_, ri) => (
          <div key={ri} className="px-4 py-3.5 flex items-center gap-4" style={{ animationDelay: `${ri * 40}ms` }}>
            {/* First column with icon */}
            <div className="flex items-center gap-3 flex-1" style={{ maxWidth: "30%" }}>
              <div className="h-7 w-7 rounded-lg bg-muted animate-pulse shrink-0" />
              <div className="h-3 rounded bg-muted animate-pulse w-full max-w-[160px]" />
            </div>
            {/* Other columns */}
            {Array.from({ length: columns - 1 }).map((_, ci) => (
              <div key={ci} className="flex-1" style={{ maxWidth: `${70 / (columns - 1)}%` }}>
                <div className="h-3 rounded bg-muted animate-pulse" style={{ width: `${50 + (ci * 10) % 40}%` }} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

