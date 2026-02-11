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
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  MoreHorizontal, 
  FileSpreadsheet, 
  Star, 
  Clock, 
  Users,
  Lock,
  Globe,
  Circle
} from "lucide-react";

interface Sheet {
  id: string;
  title: string;
  owner: {
    name: string;
    initials: string;
    avatar?: string;
  };
  visibility: "private" | "team" | "public";
  lastModified: string;
  lastModifiedBy: string;
  collaborators: number;
  activeEditors: number;
  isStarred: boolean;
  size: string;
}

interface SheetsTableProps {
  sheets: Sheet[];
  onSelect?: (ids: string[]) => void;
}

const visibilityIcons = {
  private: <Lock className="h-3 w-3" />,
  team: <Users className="h-3 w-3" />,
  public: <Globe className="h-3 w-3" />,
};

const visibilityLabels = {
  private: "Private",
  team: "Team",
  public: "Public",
};

const SheetsTable = ({ sheets, onSelect }: SheetsTableProps) => {
  return (
    <div className="border rounded-lg overflow-hidden animate-fade-in">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30">
            <TableHead className="w-[40px]">
              <Checkbox />
            </TableHead>
            <TableHead className="w-[300px]">Name</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>Visibility</TableHead>
            <TableHead>Last Modified</TableHead>
            <TableHead className="text-center">Collaborators</TableHead>
            <TableHead className="text-center">Active</TableHead>
            <TableHead>Size</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sheets.map((sheet, index) => (
            <TableRow
              key={sheet.id}
              className="animate-slide-up group"
              style={{ animationDelay: `${index * 30}ms` }}
            >
              <TableCell>
                <Checkbox />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileSpreadsheet className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{sheet.title}</span>
                    {sheet.isStarred && (
                      <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={sheet.owner.avatar} />
                    <AvatarFallback className="text-xs bg-accent">
                      {sheet.owner.initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{sheet.owner.name}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="gap-1 text-xs">
                  {visibilityIcons[sheet.visibility]}
                  {visibilityLabels[sheet.visibility]}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  <p className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {sheet.lastModified}
                  </p>
                  <p className="text-xs text-muted-foreground/70">
                    by {sheet.lastModifiedBy}
                  </p>
                </div>
              </TableCell>
              <TableCell className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{sheet.collaborators}</span>
                </div>
              </TableCell>
              <TableCell className="text-center">
                {sheet.activeEditors > 0 ? (
                  <div className="flex items-center justify-center gap-1.5">
                    <Circle className="h-2 w-2 fill-emerald-500 text-emerald-500" />
                    <span className="text-sm font-medium text-emerald-600">
                      {sheet.activeEditors}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground">{sheet.size}</span>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Open</DropdownMenuItem>
                    <DropdownMenuItem>Share</DropdownMenuItem>
                    <DropdownMenuItem>Duplicate</DropdownMenuItem>
                    <DropdownMenuItem>Move</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>Rename</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">
                      Delete
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

export default SheetsTable;
