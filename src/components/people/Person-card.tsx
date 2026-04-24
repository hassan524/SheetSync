import { Mail, Building2, MoreHorizontal } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PersonCardProps {
  name: string;
  email: string;
  avatar?: string;
  organizations: string[];
  status: "online" | "offline" | "away";
}

const statusColors = {
  online: "bg-success",
  offline: "bg-muted-foreground",
  away: "bg-warning",
};

const PersonCard = ({
  name,
  email,
  avatar,
  organizations,
  status,
}: PersonCardProps) => {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <div className="group flex items-center gap-4 p-4 rounded-xl border border-border bg-card transition-all duration-300 hover:shadow-elevated hover:border-primary/20 animate-slide-up">
      <div className="relative">
        <Avatar className="h-12 w-12">
          <AvatarImage src={avatar} />
          <AvatarFallback className="bg-accent text-accent-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>
        <span
          className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card ${statusColors[status]}`}
        />
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="font-medium truncate">{name}</h4>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Mail className="h-3 w-3" />
          <span className="truncate">{email}</span>
        </div>
      </div>

      <div className="hidden md:flex items-center gap-2">
        {organizations.slice(0, 2).map((org, i) => (
          <Badge key={i} variant="secondary" className="text-xs">
            <Building2 className="h-3 w-3 mr-1" />
            {org}
          </Badge>
        ))}
        {organizations.length > 2 && (
          <Badge variant="outline" className="text-xs">
            +{organizations.length - 2}
          </Badge>
        )}
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <MoreHorizontal className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default PersonCard;
