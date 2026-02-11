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
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  MoreHorizontal, 
  Building2, 
  Users, 
  FileSpreadsheet, 
  Clock,
  Circle
} from "lucide-react";

interface Organization {
  id: string;
  name: string;
  role: "Admin" | "Member" | "Viewer";
  members: number;
  activeNow: number;
  sheets: number;
  storageUsed: number;
  storageLimit: number;
  lastModified: string;
  createdAt: string;
}

interface OrganizationsTableProps {
  organizations: Organization[];
}

const roleVariants = {
  Admin: "default" as const,
  Member: "secondary" as const,
  Viewer: "outline" as const,
};

const OrganizationsTable = ({ organizations }: OrganizationsTableProps) => {
  return (
    <div className="border rounded-lg overflow-hidden animate-fade-in">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30">
            <TableHead className="w-[250px]">Organization</TableHead>
            <TableHead>Your Role</TableHead>
            <TableHead className="text-center">Members</TableHead>
            <TableHead className="text-center">Active Now</TableHead>
            <TableHead className="text-center">Sheets</TableHead>
            <TableHead>Storage</TableHead>
            <TableHead>Last Modified</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {organizations.map((org, index) => (
            <TableRow
              key={org.id}
              className="animate-slide-up"
              style={{ animationDelay: `${index * 30}ms` }}
            >
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{org.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Created {org.createdAt}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={roleVariants[org.role]}>{org.role}</Badge>
              </TableCell>
              <TableCell className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{org.members}</span>
                </div>
              </TableCell>
              <TableCell className="text-center">
                <div className="flex items-center justify-center gap-1.5">
                  <Circle className="h-2 w-2 fill-emerald-500 text-emerald-500" />
                  <span className="text-sm font-medium text-emerald-600">
                    {org.activeNow}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{org.sheets}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="w-32">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">
                      {org.storageUsed} GB / {org.storageLimit} GB
                    </span>
                  </div>
                  <Progress
                    value={(org.storageUsed / org.storageLimit) * 100}
                    className="h-1.5"
                  />
                </div>
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {org.lastModified}
                </span>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>View Details</DropdownMenuItem>
                    <DropdownMenuItem>View Sheets</DropdownMenuItem>
                    <DropdownMenuItem>Manage Members</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>Settings</DropdownMenuItem>
                    {org.role !== "Admin" && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          Leave Organization
                        </DropdownMenuItem>
                      </>
                    )}
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

export default OrganizationsTable;
