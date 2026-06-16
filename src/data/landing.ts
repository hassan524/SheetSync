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
    title: "Real-Time Collaboration",
    subtitle: "Work together, live",
    description:
      "See live cursors, edits, and presence from teammates as they happen. Multiple users can work on the same sheet simultaneously — changes sync instantly with zero conflicts or page refreshes.",
    bullets: [
      "Live cursor presence per user",
      "Instant cell-level sync",
      "Comment threads on cells",
      "Version history per edit",
    ],
    image: "/hero-collaboration.png",
  },
  {
    icon: FunctionSquare,
    color: "text-orange-600",
    bg: "bg-orange-50",
    gradientFrom: "from-orange-500",
    gradientTo: "to-red-600",
    title: "Formulas & Functions",
    subtitle: "Powerful calculations",
    description:
      "Use 100+ built-in spreadsheet formulas — SUM, AVERAGE, IF, VLOOKUP, COUNTIF, and more. Type = in any cell to trigger autocomplete. Formulas update automatically when source data changes.",
    bullets: [
      "100+ built-in functions",
      "Formula autocomplete",
      "Cross-sheet references",
    ],
    image: "/feature-formulas.png",
  },
  {
    icon: LayoutTemplate,
    color: "text-primary",
    bg: "bg-green-50",
    gradientFrom: "from-green-600",
    gradientTo: "to-teal-700",
    title: "Ready-to-Use Templates",
    subtitle: "Start in seconds",
    description:
      "Choose from professionally designed spreadsheet templates for budgets, project tracking, QA testing, CRM, inventory, and more. One click to create and customize.",
    bullets: [
      "Budget & expense tracking",
      "QA testing & bug tracking",
      "Project management",
      "CRM & sales pipeline",
      "Inventory & stock control",
    ],
    image: "/feature-templates.png",
  },
  {
    icon: Building2,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    gradientFrom: "from-indigo-500",
    gradientTo: "to-purple-700",
    title: "Organizations & Teams",
    subtitle: "Built for teams",
    description:
      "Create organizations, invite members, and collaborate on shared sheets. Control exactly who can view, edit, or manage each sheet with role-based permissions across your entire organization.",
    bullets: [
      "Create & manage orgs",
      "Invite members by email",
      "Role-based permissions",
      "Shared sheet library",
    ],
    image: "/feature-organizations.png",
  },
  {
    icon: Upload,
    color: "text-teal-600",
    bg: "bg-teal-50",
    gradientFrom: "from-teal-500",
    gradientTo: "to-cyan-700",
    title: "Import & Export",
    subtitle: "Bring your data in",
    description:
      "Import existing spreadsheets from Excel (.xlsx, .xls) or CSV files and pick up right where you left off. Export back to Excel, CSV, or PDF at any time — your data, your format.",
    bullets: [
      "Excel .xlsx / .xls import",
      "CSV file support",
      "Export to PDF",
      "Preserve formatting",
    ],
    image: "/feature-import.png",
  },
  {
    icon: History,
    color: "text-pink-600",
    bg: "bg-pink-50",
    gradientFrom: "from-pink-500",
    gradientTo: "to-rose-700",
    title: "Activity & History",
    subtitle: "Nothing gets lost",
    description:
      "Every edit, comment, and share event is logged in a detailed activity feed. Review your sheet's full history, see exactly who did what and when, and restore previous states.",
    bullets: [
      "Full per-sheet edit log",
      "Live activity feed",
      "Comment history",
      "Restore previous state",
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
    label: "50+ ready-made templates",
    color: "text-primary",
  },
  { icon: Building2, label: "Team organizations", color: "text-indigo-600" },
  { icon: Upload, label: "Excel & CSV import", color: "text-teal-600" },
  { icon: Download, label: "PDF & CSV export", color: "text-pink-600" },
  { icon: History, label: "Full activity history", color: "text-rose-600" },
  { icon: FolderOpen, label: "Folder organization", color: "text-amber-600" },
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
