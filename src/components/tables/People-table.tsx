import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Mail, Shield, Clock } from "lucide-react";

interface Person {
  id: string;
  name: string;
  email: string;
  initials: string;
  avatar?: string;
  role: "Admin" | "Editor" | "Viewer";
  status: "online" | "away" | "offline";
  lastActive: string;
  sheetsAccess: number;
  organizations: string[];
}

interface PeopleTableProps {
  people: Person[];
}

const statusColors = {
  online: "bg-emerald-500",
  away: "bg-amber-500",
  offline: "bg-gray-400",
};

const roleVariants = {
  Admin: "default" as const,
  Editor: "secondary" as const,
  Viewer: "outline" as const,
};

const PeopleTable = ({ people }: PeopleTableProps) => {
  return (
    <div className="border rounded-lg overflow-hidden animate-fade-in">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30">
            <TableHead className="w-[280px]">User</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Active</TableHead>
            <TableHead className="text-center">Sheets Access</TableHead>
            <TableHead>Organizations</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {people.map((person, index) => (
            <TableRow
              key={person.id}
              className="animate-slide-up"
              style={{ animationDelay: `${index * 30}ms` }}
            >
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={person.avatar} />
                      <AvatarFallback className="text-xs bg-accent">
                        {person.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background ${statusColors[person.status]}`}
                    />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{person.name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {person.email}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={roleVariants[person.role]} className="gap-1">
                  <Shield className="h-3 w-3" />
                  {person.role}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div
                    className={`h-2 w-2 rounded-full ${statusColors[person.status]}`}
                  />
                  <span className="text-sm capitalize">{person.status}</span>
                </div>
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {person.lastActive}
                </span>
              </TableCell>
              <TableCell className="text-center">
                <span className="text-sm font-medium">
                  {person.sheetsAccess}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {person.organizations.slice(0, 2).map((org) => (
                    <Badge key={org} variant="outline" className="text-xs">
                      {org}
                    </Badge>
                  ))}
                  {person.organizations.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{person.organizations.length - 2}
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>View Profile</DropdownMenuItem>
                    <DropdownMenuItem>Send Message</DropdownMenuItem>
                    <DropdownMenuItem>Change Role</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive">
                      Remove Access
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default PeopleTable;
