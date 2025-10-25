import { useState } from "react";
import { Plus, Grid3x3, List, ChevronDown } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import SheetsHeader from "@/components/SheetsHeader";
import AppSidebar from "@/components/AppSidebar";
import SheetListItem from "@/components/SheetListItem";
import SheetGridCard from "@/components/SheetGridCard";
import EmptyState from "@/components/EmptyState";
import OrganizationDialog from "@/components/OrganizationDialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const SpreadsheetPreview = () => (
  <div className="w-full h-full bg-background p-1.5">
    <div className="grid grid-cols-4 gap-px bg-border h-full rounded-sm overflow-hidden">
      {Array.from({ length: 16 }).map((_, i) => (
        <div key={i} className="bg-card flex items-center justify-center">
          {i < 4 && <div className="w-full h-1.5 bg-muted/40 rounded-sm" />}
        </div>
      ))}
    </div>
  </div>
);

const mockSheets = [
  { id: "1", name: "Project tracking", owner: "me", lastOpened: "3:51 PM", time: Date.now() - 1 * 60 * 60 * 1000, category: "personal" },
  { id: "2", name: "Monthly budget", owner: "me", lastOpened: "2:21 PM", time: Date.now() - 2 * 60 * 60 * 1000, category: "personal" },
  { id: "3", name: "Q4 Financial Report", owner: "me", lastOpened: "2:20 PM", time: Date.now() - 2.1 * 60 * 60 * 1000, category: "personal" },
  { id: "4", name: "Untitled spreadsheet", owner: "me", lastOpened: "1:56 PM", time: Date.now() - 3 * 60 * 60 * 1000, category: "personal" },
  { id: "5", name: "To-do list", owner: "me", lastOpened: "Yesterday 5:42 PM", time: Date.now() - 1 * 24 * 60 * 60 * 1000, category: "personal" },
  { id: "6", name: "Annual Budget 2024", owner: "me", lastOpened: "Dec 10", time: Date.now() - 2 * 24 * 60 * 60 * 1000, category: "personal" },
  { id: "7", name: "Project Timeline", owner: "Sarah Johnson", lastOpened: "2h ago", time: Date.now() - 2 * 60 * 60 * 1000, category: "shared" },
  { id: "8", name: "Team Budget", owner: "Mike Chen", lastOpened: "Yesterday", time: Date.now() - 1 * 24 * 60 * 60 * 1000, category: "shared" },
];

export default function SheetsPage() {
  const [view, setView] = useState<"grid" | "list">("list");
  const [ownerFilter, setOwnerFilter] = useState("anyone");
  const [sortBy, setSortBy] = useState("opened");
  const [selectedView, setSelectedView] = useState("personal");
  const [sheets, setSheets] = useState(mockSheets);
  const [organizations, setOrganizations] = useState<Array<{ id: string; name: string }>>([]);
  const [showOrgDialog, setShowOrgDialog] = useState(false);
  const [deleteSheetId, setDeleteSheetId] = useState<string | null>(null);

  const isOrgView = selectedView !== "personal" && selectedView !== "shared" && selectedView !== "organizations";
  const currentOrg = organizations.find(org => org.id === selectedView);

  const getPageTitle = () => {
    if (selectedView === "personal") return "Personal Sheets";
    if (selectedView === "shared") return "Shared with me";
    if (selectedView === "organizations") return "Organizations";
    return currentOrg?.name || "Sheets";
  };

  const filteredSheets = sheets
    .filter((sheet) => {
      if (selectedView === "personal") return sheet.category === "personal";
      if (selectedView === "shared") return sheet.category === "shared";
      if (isOrgView) return sheet.category === selectedView;
      return false;
    })
    .filter((sheet) => {
      if (ownerFilter === "anyone") return true;
      if (ownerFilter === "me") return sheet.owner === "me";
      if (ownerFilter === "others") return sheet.owner !== "me";
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "opened") return b.time - a.time;
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return 0;
    });

  const todaySheets = filteredSheets.filter(s => 
    s.lastOpened.includes("PM") || s.lastOpened.includes("AM")
  );
  
  const yesterdaySheets = filteredSheets.filter(s => 
    s.lastOpened.toLowerCase().includes("yesterday")
  );
  
  const earlierSheets = filteredSheets.filter(s => 
    !s.lastOpened.includes("PM") && 
    !s.lastOpened.includes("AM") && 
    !s.lastOpened.toLowerCase().includes("yesterday")
  );

  const handleCreateSheet = () => {
    const newSheet = {
      id: String(Date.now()),
      name: "Untitled spreadsheet",
      owner: "me",
      lastOpened: "Just now",
      time: Date.now(),
      category: isOrgView ? selectedView : selectedView === "shared" ? "shared" : "personal",
    };
    setSheets([newSheet, ...sheets]);
  };

  const handleSaveOrganization = (name: string) => {
    const newOrg = {
      id: String(Date.now()),
      name,
    };
    setOrganizations([...organizations, newOrg]);
    setSelectedView(newOrg.id);
  };

  const handleDeleteSheet = (id: string) => {
    setSheets(sheets.filter(s => s.id !== id));
    setDeleteSheetId(null);
  };

  const handleViewChange = (view: string) => {
    setSelectedView(view);
    setOwnerFilter("anyone");
  };

  const showContent = selectedView !== "organizations" || isOrgView;

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <AppSidebar
          organizations={organizations}
          selectedView={selectedView}
          onSelectView={handleViewChange}
          onCreateOrganization={() => setShowOrgDialog(true)}
        />

        <div className="flex-1 flex flex-col h-screen">
          <SheetsHeader userName="Alex Chen" userEmail="alex@sheetsync.com" />

          <div className="flex-1 flex flex-col px-8 py-4">
            {!showContent ? (
              <div className="flex-1 flex items-center justify-center">
                <EmptyState
                  title="No organizations yet"
                  description="Create your first organization to start collaborating with your team"
                  actionLabel="Create Organization"
                  onAction={() => setShowOrgDialog(true)}
                />
              </div>
            ) : filteredSheets.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <EmptyState
                  title="No sheets yet"
                  description="Get started by creating your first spreadsheet"
                  actionLabel="Create Sheet"
                  onAction={handleCreateSheet}
                />
              </div>
            ) : (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <SidebarTrigger data-testid="button-sidebar-toggle" />
                    <h1 className="text-xl font-medium" data-testid="text-page-title">{getPageTitle()}</h1>
                  </div>
                  <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="gap-1">
                          {ownerFilter === "anyone" && "Owned by anyone"}
                          {ownerFilter === "me" && "Owned by me"}
                          {ownerFilter === "others" && "Not owned by me"}
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setOwnerFilter("anyone")}>
                          Owned by anyone
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setOwnerFilter("me")}>
                          Owned by me
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setOwnerFilter("others")}>
                          Not owned by me
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="gap-1">
                          {sortBy === "opened" && "Last opened by me"}
                          {sortBy === "name" && "Name"}
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setSortBy("opened")}>
                          Last opened by me
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSortBy("name")}>
                          Name
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <div className="flex border rounded-md">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`rounded-r-none ${view === "list" ? "bg-muted" : ""}`}
                        onClick={() => setView("list")}
                        data-testid="button-view-list"
                      >
                        <List className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`rounded-l-none ${view === "grid" ? "bg-muted" : ""}`}
                        onClick={() => setView("grid")}
                        data-testid="button-view-grid"
                      >
                        <Grid3x3 className="h-4 w-4" />
                      </Button>
                    </div>

                    <Button onClick={handleCreateSheet} className="gap-2" data-testid="button-create-sheet">
                      <Plus className="h-4 w-4" />
                      Create
                    </Button>
                  </div>
                </div>

                <div className="flex-1 space-y-6 min-h-0 overflow-y-auto">
                  {todaySheets.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium mb-2" data-testid="section-today">Today</h3>
                      {view === "list" ? (
                        <div className="space-y-0.5">
                          {todaySheets.map((sheet) => (
                            <SheetListItem
                              key={sheet.id}
                              {...sheet}
                              onClick={() => console.log("Open:", sheet.id)}
                              onRename={() => console.log("Rename:", sheet.id)}
                              onShare={() => console.log("Share:", sheet.id)}
                              onDelete={() => setDeleteSheetId(sheet.id)}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                          {todaySheets.map((sheet) => (
                            <SheetGridCard
                              key={sheet.id}
                              {...sheet}
                              preview={<SpreadsheetPreview />}
                              onClick={() => console.log("Open:", sheet.id)}
                              onRename={() => console.log("Rename:", sheet.id)}
                              onShare={() => console.log("Share:", sheet.id)}
                              onDelete={() => setDeleteSheetId(sheet.id)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {yesterdaySheets.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium mb-2" data-testid="section-yesterday">Yesterday</h3>
                      {view === "list" ? (
                        <div className="space-y-0.5">
                          {yesterdaySheets.map((sheet) => (
                            <SheetListItem
                              key={sheet.id}
                              {...sheet}
                              onClick={() => console.log("Open:", sheet.id)}
                              onRename={() => console.log("Rename:", sheet.id)}
                              onShare={() => console.log("Share:", sheet.id)}
                              onDelete={() => setDeleteSheetId(sheet.id)}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                          {yesterdaySheets.map((sheet) => (
                            <SheetGridCard
                              key={sheet.id}
                              {...sheet}
                              preview={<SpreadsheetPreview />}
                              onClick={() => console.log("Open:", sheet.id)}
                              onRename={() => console.log("Rename:", sheet.id)}
                              onShare={() => console.log("Share:", sheet.id)}
                              onDelete={() => setDeleteSheetId(sheet.id)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {earlierSheets.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium mb-2" data-testid="section-earlier">Earlier</h3>
                      {view === "list" ? (
                        <div className="space-y-0.5">
                          {earlierSheets.map((sheet) => (
                            <SheetListItem
                              key={sheet.id}
                              {...sheet}
                              onClick={() => console.log("Open:", sheet.id)}
                              onRename={() => console.log("Rename:", sheet.id)}
                              onShare={() => console.log("Share:", sheet.id)}
                              onDelete={() => setDeleteSheetId(sheet.id)}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                          {earlierSheets.map((sheet) => (
                            <SheetGridCard
                              key={sheet.id}
                              {...sheet}
                              preview={<SpreadsheetPreview />}
                              onClick={() => console.log("Open:", sheet.id)}
                              onRename={() => console.log("Rename:", sheet.id)}
                              onShare={() => console.log("Share:", sheet.id)}
                              onDelete={() => setDeleteSheetId(sheet.id)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <OrganizationDialog
        open={showOrgDialog}
        onOpenChange={setShowOrgDialog}
        onSave={handleSaveOrganization}
        title="Create Organization"
      />

      <AlertDialog open={!!deleteSheetId} onOpenChange={() => setDeleteSheetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Sheet?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the sheet.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteSheetId && handleDeleteSheet(deleteSheetId)} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  );
}
