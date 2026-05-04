// components/sheets/SheetCardSkeleton.tsx

export function SheetCardSkeleton() {
    return (
        <div className="flex flex-col gap-0">

            {/* Preview */}
            <div className="relative rounded-xl overflow-hidden border border-border bg-muted h-[140px] sm:h-[150px]">

                {/* Grid lines texture */}
                <div
                    className="absolute inset-0 opacity-60"
                    style={{
                        backgroundImage: `
              repeating-linear-gradient(0deg, hsl(var(--border)) 0px, transparent 0.5px, transparent 26px, hsl(var(--border)) 26.5px),
              repeating-linear-gradient(90deg, hsl(var(--border)) 0px, transparent 0.5px, transparent 40px, hsl(var(--border)) 40.5px)
            `,
                    }}
                />

                {/* Header row tint */}
                <div className="absolute top-0 left-0 right-0 h-[26px] bg-border/40" />

                {/* Shimmer sweep */}
                <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-background/30 to-transparent bg-[length:600px_100%]" />

                {/* Badges */}
                <div className="absolute top-2 left-2 h-4 w-14 rounded-md bg-background/90 border border-border/50 animate-pulse" />
                <div className="absolute bottom-2 left-2 h-3.5 w-20 rounded-md bg-background/90 border border-border/50 animate-pulse" />
                <div className="absolute bottom-2 right-2 h-3.5 w-10 rounded-md bg-background/90 border border-border/50 animate-pulse" />
            </div>

            {/* Info */}
            <div className="mt-2.5 space-y-2 px-0.5">

                {/* Title */}
                <div className="h-3.5 w-[70%] rounded bg-muted animate-pulse" />

                {/* Meta row */}
                <div className="flex items-center gap-1.5">
                    <div className="h-2.5 w-10 rounded bg-muted animate-pulse" />
                    <div className="h-2.5 w-1 rounded-full bg-muted animate-pulse" />
                    <div className="h-2.5 w-9 rounded bg-muted animate-pulse" />
                    <div className="h-2.5 w-1 rounded-full bg-muted animate-pulse" />
                    <div className="h-2.5 w-12 rounded bg-muted animate-pulse" />
                </div>

                {/* Org / folder + fill bar */}
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                        <div className="h-2.5 w-2.5 rounded-full bg-muted animate-pulse" />
                        <div className="h-2.5 w-20 rounded bg-muted animate-pulse" />
                    </div>
                    <div className="w-12 h-0.5 rounded-full bg-border flex-shrink-0" />
                </div>

            </div>
        </div>
    );
}