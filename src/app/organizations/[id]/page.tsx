import DashboardLayout   from "@/components/layout/Dashboard-layout";
import { OrgHeader } from "@/components/individual/organization/id/Organization-header";
import { OrgStatCards } from "@/components/individual/organization/id/Organization-stats-card";
import { OrgTablesPanel } from "@/components/individual/organization/id/Organization-tables-panel";
import { OrgActivityPanel } from "@/components/individual/organization/id/Organizaion-activity-panel";
import { OrgBottomStrip } from "@/components/individual/organization/id/Organization-bottom-strip";
import type { Organization } from "@/types/organization.types";

// ── Simple extended type — just add what the UI needs ─────────────
export type OrgDetail = Organization & {
  description?:    string;
  plan?:           string;
  activeNow?:      number;
  storageUsed?:    number;
  storageLimit?:   number;
  weeklyStats?: {
    sheetsCreated:  number;
    editsThisWeek:  number;
    collaborations: number;
  };
  recentActivity?: {
    user:   string;
    action: string;
    target: string;
    time:   string;
    avatar: string;
  }[];
  membersList?: {
    id:         string;
    name:       string;
    email:      string;
    role:       string;
    status:     "online" | "offline";
    lastActive: string;
    avatar:     string;
  }[];
  sheetsList?: {
    id:             string;
    title:          string;
    owner:          { name: string; initials: string };
    visibility:     "team" | "private" | "public";
    lastModified:   string;
    lastModifiedBy: string;
    collaborators:  number;
    activeEditors:  number;
    isStarred:      boolean;
    size:           string;
  }[];
};

// ── Dummy data ────────────────────────────────────────────────────
const DUMMY_ORG: OrgDetail = {
  id:          "1",
  name:        "Acme Corporation",
  role:        "admin",
  created_at:  "2024-01-15",
  sheets:      [],
  members:     [],
  description: "A collaborative workspace for managing spreadsheets and data across teams.",
  plan:        "Business",
  activeNow:   8,
  storageUsed:  4.2,
  storageLimit: 10,
  weeklyStats: { sheetsCreated: 12, editsThisWeek: 847, collaborations: 34 },

  membersList: [
    { id:"1",  name:"John Doe",     email:"john@acme.com",   role:"Admin",  status:"online",  lastActive:"Just now",    avatar:"JD" },
    { id:"2",  name:"Sarah Wilson", email:"sarah@acme.com",  role:"Admin",  status:"online",  lastActive:"2 min ago",   avatar:"SW" },
    { id:"3",  name:"Mike Chen",    email:"mike@acme.com",   role:"Member", status:"online",  lastActive:"5 min ago",   avatar:"MC" },
    { id:"4",  name:"Emily Brown",  email:"emily@acme.com",  role:"Member", status:"online",  lastActive:"12 min ago",  avatar:"EB" },
    { id:"5",  name:"Alex Turner",  email:"alex@acme.com",   role:"Member", status:"online",  lastActive:"18 min ago",  avatar:"AT" },
    { id:"6",  name:"Lisa Park",    email:"lisa@acme.com",   role:"Member", status:"online",  lastActive:"31 min ago",  avatar:"LP" },
    { id:"7",  name:"David Kim",    email:"david@acme.com",  role:"Member", status:"online",  lastActive:"45 min ago",  avatar:"DK" },
    { id:"8",  name:"Rachel Green", email:"rachel@acme.com", role:"Member", status:"online",  lastActive:"1 hr ago",    avatar:"RG" },
    { id:"9",  name:"Tom Harris",   email:"tom@acme.com",    role:"Viewer", status:"offline", lastActive:"1 hour ago",  avatar:"TH" },
    { id:"10", name:"Nina Patel",   email:"nina@acme.com",   role:"Member", status:"offline", lastActive:"3 hours ago", avatar:"NP" },
  ],

  sheetsList: [
    { id:"1", title:"Q4 Financial Report",     owner:{name:"John Doe",     initials:"JD"}, visibility:"team",    lastModified:"2 hours ago", lastModifiedBy:"John Doe",     collaborators:5, activeEditors:2, isStarred:true,  size:"2.4 MB" },
    { id:"2", title:"Marketing Campaign Data", owner:{name:"Sarah Wilson", initials:"SW"}, visibility:"team",    lastModified:"5 hours ago", lastModifiedBy:"Sarah Wilson", collaborators:3, activeEditors:1, isStarred:false, size:"1.8 MB" },
    { id:"3", title:"Employee Directory",      owner:{name:"Mike Chen",    initials:"MC"}, visibility:"private", lastModified:"1 day ago",   lastModifiedBy:"Mike Chen",    collaborators:8, activeEditors:0, isStarred:true,  size:"3.2 MB" },
    { id:"4", title:"Sales Pipeline 2024",     owner:{name:"Emily Brown",  initials:"EB"}, visibility:"team",    lastModified:"2 days ago",  lastModifiedBy:"Emily Brown",  collaborators:4, activeEditors:3, isStarred:false, size:"1.5 MB" },
    { id:"5", title:"Product Roadmap",         owner:{name:"Alex Turner",  initials:"AT"}, visibility:"public",  lastModified:"3 days ago",  lastModifiedBy:"Alex Turner",  collaborators:6, activeEditors:0, isStarred:false, size:"890 KB" },
    { id:"6", title:"Budget Planning",         owner:{name:"John Doe",     initials:"JD"}, visibility:"private", lastModified:"1 week ago",  lastModifiedBy:"John Doe",     collaborators:2, activeEditors:0, isStarred:false, size:"1.1 MB" },
  ],

  recentActivity: [
    { user:"John Doe",     action:"edited",       target:"Q4 Financial Report", time:"2 min ago", avatar:"JD" },
    { user:"Sarah Wilson", action:"created",      target:"New Marketing Sheet", time:"1 hr ago",  avatar:"SW" },
    { user:"Mike Chen",    action:"shared",       target:"Employee Directory",  time:"3 hr ago",  avatar:"MC" },
    { user:"Emily Brown",  action:"commented on", target:"Sales Pipeline 2024", time:"5 hr ago",  avatar:"EB" },
    { user:"Alex Turner",  action:"updated",      target:"Product Roadmap",     time:"6 hr ago",  avatar:"AT" },
    { user:"Lisa Park",    action:"downloaded",   target:"Budget Report Q3",    time:"Yesterday", avatar:"LP" },
  ],
};

export default function OrganizationDetailPage() {
  const org = DUMMY_ORG;

  return (
    <DashboardLayout breadcrumbItems={["Organizations", org.name]}>
      <div className="w-full px-4 md:px-6 py-5 space-y-5">
        <OrgHeader        org={org} />
        <OrgStatCards     org={org} />
        <div className="flex flex-col xl:flex-row gap-4 items-start">
          <div className="w-full xl:flex-1 min-w-0">
            <OrgTablesPanel org={org} />
          </div>
          <div className="w-full xl:w-72 shrink-0 xl:pt-11">
            <OrgActivityPanel org={org} />
          </div>
        </div>
        <OrgBottomStrip org={org} />
      </div>
    </DashboardLayout>
  );
}