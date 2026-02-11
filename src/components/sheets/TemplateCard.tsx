import { Plus } from "lucide-react";

interface TemplateCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const TemplateCard = ({ title, description, icon, color }: TemplateCardProps) => {
  return (
    <button
      className={`group relative p-4 rounded-xl border border-border bg-card text-left transition-all duration-300 hover:shadow-elevated hover:border-primary/30 hover:-translate-y-1 animate-slide-up`}
    >
      <div
        className={`h-10 w-10 rounded-lg flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-110 ${color}`}
      >
        {icon}
      </div>
      <h4 className="font-medium text-sm mb-1">{title}</h4>
      <p className="text-xs text-muted-foreground line-clamp-2">{description}</p>
      <div className="absolute top-3 right-3 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <Plus className="h-3 w-3 text-primary" />
      </div>
    </button>
  );
};

export default TemplateCard;
