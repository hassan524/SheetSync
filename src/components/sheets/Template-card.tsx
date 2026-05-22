import { Clock, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { ICON_MAP } from "@/constants/Sheet-templates";

interface TemplateCardProps {
  id: string;
  title: string;
  description: string;
  iconName: string; // ← string now
  color: string;
  features: string[];
  disabled?: boolean;
}

const TemplateCard = ({
  title,
  description,
  iconName,
  color,
  disabled = false,
}: TemplateCardProps) => {
  const Icon = ICON_MAP[iconName]; // ← resolve here

  return (
    <button
      type="button"
      disabled={disabled}
      aria-disabled={disabled}
      className={cn(
        "w-full group relative p-4 rounded-xl border border-border bg-card text-left transition-all duration-300 animate-slide-up",
        disabled
          ? "cursor-not-allowed opacity-70"
          : "cursor-pointer hover:shadow-elevated hover:border-primary/30 hover:-translate-y-1",
      )}
    >
      <div
        className={cn(
          "h-10 w-10 flex-shrink-0 rounded-lg flex items-center justify-center mb-3 transition-transform duration-300",
          !disabled && "group-hover:scale-110",
          color,
        )}
      >
        {Icon && <Icon className="h-5 w-5 text-white" />}
      </div>
      <h4 className="font-medium text-sm mb-1">{title}</h4>
      <p className="text-xs text-muted-foreground line-clamp-2">
        {description}
      </p>
      {disabled ? (
        <div className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full border border-border bg-background px-2 py-1 text-[10px] font-medium text-muted-foreground">
          <Clock className="h-3 w-3" />
          Coming soon
        </div>
      ) : (
        <div className="absolute top-3 right-3 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Plus className="h-3 w-3 text-primary" />
        </div>
      )}
    </button>
  );
};

export default TemplateCard;

