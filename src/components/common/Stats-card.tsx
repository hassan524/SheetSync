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
    if (change === undefined || change === 0)
      return <Minus className="h-3 w-3" />;
    return change > 0 ? (
      <TrendingUp className="h-3 w-3" />
    ) : (
      <TrendingDown className="h-3 w-3" />
    );
  };

  const getTrendColor = () => {
    if (change === undefined || change === 0) return "text-muted-foreground";
    return change > 0 ? "text-emerald-600" : "text-red-500";
  };

  return (
    <div
      className={cn(
        "bg-card border border-border rounded-xl p-3 sm:p-4 transition-all duration-300 hover:shadow-sm hover:border-primary/20 animate-fade-in",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        {icon && (
          <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-lg font-bold leading-none">{value}</p>
          <p className="text-xs font-medium text-foreground mt-0.5 truncate">
            {title}
          </p>
          {description && (
            <p className="text-[10px] text-muted-foreground hidden sm:block truncate">
              {description}
            </p>
          )}
        </div>
      </div>

      {change !== undefined && (
        <div className="flex items-center gap-1 mt-3 pt-3 border-t border-border text-xs">
          <span
            className={cn(
              "flex items-center gap-0.5 font-medium",
              getTrendColor(),
            )}
          >
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

