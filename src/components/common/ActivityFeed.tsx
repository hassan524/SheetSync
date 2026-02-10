import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  FileSpreadsheet, 
  UserPlus, 
  Edit, 
  Share2, 
  Trash2, 
  MessageSquare,
  Star
} from "lucide-react";

interface ActivityItem {
  id: string;
  user: {
    name: string;
    initials: string;
    avatar?: string;
  };
  action: "created" | "edited" | "shared" | "deleted" | "commented" | "starred" | "joined";
  target: string;
  time: string;
}

const activities: ActivityItem[] = [
  {
    id: "1",
    user: { name: "Sarah Johnson", initials: "SJ" },
    action: "edited",
    target: "Q4 Financial Report",
    time: "2 minutes ago",
  },
  {
    id: "2",
    user: { name: "Michael Chen", initials: "MC" },
    action: "shared",
    target: "Marketing Budget 2024",
    time: "15 minutes ago",
  },
  {
    id: "3",
    user: { name: "Emily Davis", initials: "ED" },
    action: "created",
    target: "Product Launch Timeline",
    time: "1 hour ago",
  },
  {
    id: "4",
    user: { name: "James Wilson", initials: "JW" },
    action: "commented",
    target: "Team Roster",
    time: "2 hours ago",
  },
  {
    id: "5",
    user: { name: "Olivia Martinez", initials: "OM" },
    action: "starred",
    target: "Sales Dashboard",
    time: "3 hours ago",
  },
  {
    id: "6",
    user: { name: "Benjamin Taylor", initials: "BT" },
    action: "joined",
    target: "Engineering Team",
    time: "5 hours ago",
  },
];

const actionIcons = {
  created: <FileSpreadsheet className="h-3 w-3" />,
  edited: <Edit className="h-3 w-3" />,
  shared: <Share2 className="h-3 w-3" />,
  deleted: <Trash2 className="h-3 w-3" />,
  commented: <MessageSquare className="h-3 w-3" />,
  starred: <Star className="h-3 w-3" />,
  joined: <UserPlus className="h-3 w-3" />,
};

const actionText = {
  created: "created",
  edited: "edited",
  shared: "shared",
  deleted: "deleted",
  commented: "commented on",
  starred: "starred",
  joined: "joined",
};

const ActivityFeed = () => {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Recent Activity</h3>
      <div className="space-y-3">
        {activities.map((activity, index) => (
          <div
            key={activity.id}
            className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors animate-slide-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={activity.user.avatar} />
              <AvatarFallback className="text-xs bg-accent">
                {activity.user.initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm">
                <span className="font-medium">{activity.user.name}</span>{" "}
                <span className="text-muted-foreground">{actionText[activity.action]}</span>{" "}
                <span className="font-medium">{activity.target}</span>
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  {actionIcons[activity.action]}
                  {activity.time}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityFeed;
