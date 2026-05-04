import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  description?: string;
  className?: string;
}

const StatsCard = ({
  title,
  value,
  change,
  changeLabel = "vs last month",
  icon,
  description,
  className,
}: StatsCardProps) => {
  const getTrendIcon = () => {
    if (change === undefined || change === 0) return <Minus className="h-3 w-3" />;
    return change > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />;
  };

  const getTrendColor = () => {
    if (change === undefined || change === 0) return "text-muted-foreground";
    return change > 0 ? "text-emerald-600" : "text-red-500";
  };

  return (
    <div
      className={cn(
        "bg-card border border-border rounded-xl p-4 sm:p-5 transition-all duration-300 hover:shadow-sm hover:border-primary/20 animate-fade-in",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-0.5 min-w-0">
          <p className="text-xs sm:text-sm text-muted-foreground font-medium leading-tight">{title}</p>
          <p className="text-xl sm:text-2xl font-bold tracking-tight">{value}</p>
          {description && (
            <p className="text-[11px] text-muted-foreground leading-tight hidden sm:block">{description}</p>
          )}
        </div>
        {icon && (
          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            {icon}
          </div>
        )}
      </div>

      {change !== undefined && (
        <div className="flex items-center gap-1 mt-3 pt-3 border-t border-border text-xs">
          <span className={cn("flex items-center gap-0.5 font-medium", getTrendColor())}>
            {getTrendIcon()}
            {Math.abs(change)}%
          </span>
          <span className="text-muted-foreground">{changeLabel}</span>
        </div>
      )}
    </div>
  );
};

export default StatsCard;
