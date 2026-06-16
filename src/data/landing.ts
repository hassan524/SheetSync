import {
  Users,
  FunctionSquare,
  LayoutTemplate,
  Upload,
  Building2,
  History,
  FileSpreadsheet,
  UserPlus,
  Zap,
  Download,
  Lock,
  Globe,
  Layers,
  GitBranch,
  Star,
  SlidersHorizontal,
  FolderOpen,
  Shield,
} from "lucide-react";

// ─── App features with inline images ────────────────────────────────────
export const appFeatures = [
  {
    icon: Users,
    color: "text-blue-600",
    bg: "bg-blue-50",
    gradientFrom: "from-blue-600",
    gradientTo: "to-blue-800",
    title: "Real Time Collaboration",
    subtitle: "Work together live",
    description:
      "Work on the same sheet with your team at the same time. Changes appear instantly so everyone stays in sync without refreshing or dealing with conflicts.",
    bullets: [
      "Multiple users editing together",
      "Instant cell updates",
      "Comments on cells",
      "Edit history tracking",
    ],
    image: "/hero-collaboration.png",
  },
  {
    icon: FunctionSquare,
    color: "text-orange-600",
    bg: "bg-orange-50",
    gradientFrom: "from-orange-500",
    gradientTo: "to-red-600",
    title: "Formulas and Functions",
    subtitle: "Powerful calculations",
    description:
      "Use built in formulas like SUM, AVERAGE, IF, VLOOKUP and more. Just type equals in a cell to start. Everything updates automatically when data changes.",
    bullets: [
      "100 plus built in functions",
      "Formula autocomplete",
      "Cross sheet references",
    ],
    image: "/feature-formulas.png",
  },
  {
    icon: LayoutTemplate,
    color: "text-primary",
    bg: "bg-green-50",
    gradientFrom: "from-green-600",
    gradientTo: "to-teal-700",
    title: "Ready to Use Templates",
    subtitle: "Start in seconds",
    description:
      "Pick from pre built templates for budgets, projects, testing, CRM, inventory and more. Create and customize in one click.",
    bullets: [
      "Budget tracking",
      "QA and bug tracking",
      "Project management",
      "CRM pipeline",
      "Inventory control",
    ],
    image: "/feature-templates.png",
  },
  {
    icon: Building2,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    gradientFrom: "from-indigo-500",
    gradientTo: "to-purple-700",
    title: "Organizations and Teams",
    subtitle: "Built for teams",
    description:
      "Create teams, invite members and manage shared sheets. Control who can view or edit with simple role based permissions.",
    bullets: [
      "Create and manage teams",
      "Invite by email",
      "Role based access",
      "Shared sheets",
    ],
    image: "/feature-organizations.png",
  },
  {
    icon: Upload,
    color: "text-teal-600",
    bg: "bg-teal-50",
    gradientFrom: "from-teal-500",
    gradientTo: "to-cyan-700",
    title: "Import and Export",
    subtitle: "Bring your data in",
    description:
      "Import Excel or CSV files and continue your work. Export anytime to Excel, CSV or PDF while keeping formatting intact.",
    bullets: [
      "Excel import support",
      "CSV files",
      "Export to PDF",
      "Keep formatting",
    ],
    image: "/feature-import.png",
  },
  {
    icon: History,
    color: "text-pink-600",
    bg: "bg-pink-50",
    gradientFrom: "from-pink-500",
    gradientTo: "to-rose-700",
    title: "Activity and History",
    subtitle: "Nothing gets lost",
    description:
      "Track every change, comment and action in one place. See who did what and restore previous versions when needed.",
    bullets: [
      "Full edit history",
      "Activity feed",
      "Comment history",
      "Restore past versions",
    ],
    image: "/hero-dashboard.png",
  },
];

// ─── How it works steps ───────────────────────────────────────────────────────
export const steps = [
  {
    step: "01",
    title: "Create or Import a Sheet",
    description:
      "Start from scratch, pick a template, or import your existing Excel or CSV file. Your sheet is ready in seconds.",
    icon: FileSpreadsheet,
    color: "bg-blue-50 text-blue-600",
  },
  {
    step: "02",
    title: "Invite Your Team",
    description:
      "Create an organization and invite teammates by email. Set view or edit permissions per sheet, per person.",
    icon: UserPlus,
    color: "bg-primary/10 text-primary",
  },
  {
    step: "03",
    title: "Collaborate in Real-Time",
    description:
      "Work together live — see each other's cursors, edits, and comments as they happen. No refreshing, no conflicts.",
    icon: Zap,
    color: "bg-orange-50 text-orange-600",
  },
];

// ─── What's included features ─────────────────────────────────────────────────
export const includedFeatures = [
  {
    icon: FileSpreadsheet,
    label: "Unlimited spreadsheets",
    color: "text-primary",
  },
  { icon: Users, label: "Real-time collaboration", color: "text-blue-600" },
  {
    icon: FunctionSquare,
    label: "100+ built-in formulas",
    color: "text-orange-600",
  },
  {
    icon: LayoutTemplate,
    label: "10+ ready-made templates",
    color: "text-primary",
  },
  { icon: Building2, label: "Team organizations", color: "text-indigo-600" },
  { icon: Upload, label: "Excel & CSV import", color: "text-teal-600" },
  { icon: Download, label: "PDF & CSV export", color: "text-pink-600" },
  { icon: History, label: "Full activity history", color: "text-rose-600" },
  { icon: Star, label: "Star & pin sheets", color: "text-yellow-600" },
  { icon: GitBranch, label: "Version tracking", color: "text-violet-600" },
  { icon: Lock, label: "Role-based permissions", color: "text-gray-600" },
  { icon: Shield, label: "Secure data encryption", color: "text-green-700" },
  { icon: Globe, label: "Works in any browser", color: "text-cyan-600" },
  {
    icon: SlidersHorizontal,
    label: "Custom sheet settings",
    color: "text-slate-600",
  },
  { icon: Zap, label: "Fast, instant sync", color: "text-orange-500" },
];

// ─── Feature tiles ────────────────────────────────────────────────────────────
export const featureTiles = [
  {
    icon: Lock,
    title: "Secure by default",
    desc: "Row-level security, encrypted at rest",
    color: "text-blue-600",
  },
  {
    icon: Globe,
    title: "Works anywhere",
    desc: "Fully browser-based, no install needed",
    color: "text-primary",
  },
  {
    icon: Layers,
    title: "Folder organization",
    desc: "Group sheets into folders your way",
    color: "text-orange-600",
  },
  {
    icon: Star,
    title: "Star & pin sheets",
    desc: "Quick access to your most-used sheets",
    color: "text-yellow-600",
  },
  {
    icon: GitBranch,
    title: "Version control",
    desc: "Every edit is saved, nothing is lost",
    color: "text-indigo-600",
  },
  {
    icon: Download,
    title: "Offline export",
    desc: "Download as PDF, CSV, or Excel anytime",
    color: "text-teal-600",
  },
  {
    icon: Shield,
    title: "Role-based access",
    desc: "Viewer, editor, and admin roles",
    color: "text-pink-600",
  },
  {
    icon: Building2,
    title: "Multi-org support",
    desc: "Belong to multiple orgs at once",
    color: "text-purple-600",
  },
];

// ─── Value props (replaces stats bar) ─────────────────────────────────────────
export const valueProps = [
  {
    icon: Zap,
    label: "Instant real-time sync",
    desc: "Zero lag, zero conflicts",
    color: "text-orange-500",
  },
  {
    icon: Shield,
    label: "Secure by design",
    desc: "Encrypted at rest & in transit",
    color: "text-green-600",
  },
  {
    icon: LayoutTemplate,
    label: "50+ templates ready",
    desc: "Hit the ground running",
    color: "text-primary",
  },
  {
    icon: Globe,
    label: "Works in any browser",
    desc: "No install, no friction",
    color: "text-cyan-600",
  },
];
