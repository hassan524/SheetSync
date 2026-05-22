import {
  FileSpreadsheet,
  Calculator,
  Calendar,
  BarChart3,
  Users,
  Package,
  Megaphone,
  ClipboardList,
  Target,
  Receipt,
  PenTool,
  PartyPopper,
  GraduationCap,
  type LucideIcon,
} from "lucide-react";

export type SheetTemplate = {
  id: string;
  title: string;
  description: string;
  category: string;
  iconName: string;
  color: string;
  features: string[];
  accent: {
    from: string;
    bubble1: string;
    bubble2: string;
    iconRing: string;
  };
  copy: {
    tagline: string;
    body: string;
  };
};

export const ICON_MAP: Record<string, LucideIcon> = {
  FileSpreadsheet,
  Calculator,
  Calendar,
  BarChart3,
  Users,
  Package,
  Megaphone,
  ClipboardList,
  Target,
  Receipt,
  PenTool,
  PartyPopper,
  GraduationCap,
};

export const SHEET_TEMPLATES: SheetTemplate[] = [
  {
    id: "f628aed8-bca7-4f51-b687-6db9f932be34",
    title: "Blank Sheet",
    description: "Start fresh with a clean spreadsheet",
    category: "General",
    iconName: "FileSpreadsheet",
    color: "bg-slate-700",
    features: ["100+ columns", "10,000+ rows", "All formulas", "Custom styling"],
    accent: {
      from: "from-slate-50 to-slate-100/60",
      bubble1: "#94a3b8",
      bubble2: "#cbd5e1",
      iconRing: "bg-slate-100 border-slate-200",
    },
    copy: {
      tagline: "A clean slate, your way.",
      body: "Start from scratch with a fully unlocked spreadsheet. No clutter, no pre-filled data — just rows, columns, and every formula you need to build something great.",
    },
  },
  {
    id: "2a197048-b791-490e-aaff-9b00785b2b27",
    title: "Finance Tracker",
    description: "Track income, expenses, and savings",
    category: "Finance",
    iconName: "Calculator",
    color: "bg-emerald-700",
    features: ["Auto-sum", "Monthly breakdown", "Categories", "Savings goals"],
    accent: {
      from: "from-emerald-50 to-green-50/60",
      bubble1: "#6ee7b7",
      bubble2: "#34d399",
      iconRing: "bg-emerald-50 border-emerald-100",
    },
    copy: {
      tagline: "Know where your money goes.",
      body: "Track income, expenses, and savings with a structured layout that does the math for you. Monthly breakdowns, smart categories, and savings goals — all in one place.",
    },
  },
  {
    id: "c9fb4014-cccf-4394-9c3f-5eb16c00cc47",
    title: "Project Tracker",
    description: "Plan project milestones and deadlines",
    category: "Project Management",
    iconName: "Calendar",
    color: "bg-blue-700",
    features: ["Gantt", "Milestones", "Assignments", "Alerts"],
    accent: {
      from: "from-blue-50 to-sky-50/60",
      bubble1: "#93c5fd",
      bubble2: "#60a5fa",
      iconRing: "bg-blue-50 border-blue-100",
    },
    copy: {
      tagline: "Ship on time, every time.",
      body: "Plan milestones, assign tasks, and stay on top of every deadline. Gantt-style timelines and smart alerts keep your whole team aligned — from kickoff to delivery.",
    },
  },
  {
    id: "e73711d5-aab0-4281-bc8f-486ad6c6aaac",
    title: "QA Tracker",
    description: "Track testing and bugs",
    category: "Engineering",
    iconName: "BarChart3",
    color: "bg-purple-700",
    features: ["Bugs", "Status", "Priority", "Reports"],
    accent: {
      from: "from-violet-50 to-purple-50/60",
      bubble1: "#c4b5fd",
      bubble2: "#a78bfa",
      iconRing: "bg-violet-50 border-violet-100",
    },
    copy: {
      tagline: "Track testing and quality.",
      body: "Monitor bugs, track priorities, and generate reports effortlessly. Stay on top of testing and ensure quality across your projects.",
    },
  },
  {
    id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    title: "Client CRM",
    description: "Manage leads, deals, and pipeline stages",
    category: "Sales",
    iconName: "Target",
    color: "bg-orange-600",
    features: ["Pipeline view", "Deal tracking", "Contact log", "Revenue forecast"],
    accent: {
      from: "from-orange-50 to-amber-50/60",
      bubble1: "#fdba74",
      bubble2: "#fb923c",
      iconRing: "bg-orange-50 border-orange-100",
    },
    copy: {
      tagline: "Close more deals, faster.",
      body: "Organize your sales pipeline from first contact to closed deal. Track leads, log conversations, and forecast revenue — all without the bloat of a full CRM.",
    },
  },
  {
    id: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    title: "Employee Directory",
    description: "Team roster with roles and departments",
    category: "HR",
    iconName: "Users",
    color: "bg-cyan-700",
    features: ["Departments", "Contact info", "Start dates", "Role tracking"],
    accent: {
      from: "from-cyan-50 to-sky-50/60",
      bubble1: "#67e8f9",
      bubble2: "#22d3ee",
      iconRing: "bg-cyan-50 border-cyan-100",
    },
    copy: {
      tagline: "Your team at a glance.",
      body: "Keep a clean, searchable directory of your entire team. Departments, roles, contact info, and start dates — always up to date and easy to share.",
    },
  },
  {
    id: "c3d4e5f6-a7b8-9012-cdef-123456789012",
    title: "Inventory Manager",
    description: "Stock levels, SKUs, and reorder alerts",
    category: "Operations",
    iconName: "Package",
    color: "bg-amber-700",
    features: ["SKU tracking", "Stock levels", "Reorder points", "Supplier info"],
    accent: {
      from: "from-amber-50 to-yellow-50/60",
      bubble1: "#fcd34d",
      bubble2: "#fbbf24",
      iconRing: "bg-amber-50 border-amber-100",
    },
    copy: {
      tagline: "Never run out of stock.",
      body: "Track every product, monitor stock levels, and set reorder alerts before you run low. A simple inventory system that grows with your business.",
    },
  },
  {
    id: "d4e5f6a7-b8c9-0123-defa-234567890123",
    title: "Marketing Calendar",
    description: "Campaign dates, channels, and budgets",
    category: "Marketing",
    iconName: "Megaphone",
    color: "bg-pink-600",
    features: ["Campaign timeline", "Channel mix", "Budget tracker", "Status tags"],
    accent: {
      from: "from-pink-50 to-rose-50/60",
      bubble1: "#f9a8d4",
      bubble2: "#f472b6",
      iconRing: "bg-pink-50 border-pink-100",
    },
    copy: {
      tagline: "Plan campaigns that convert.",
      body: "Map out your marketing calendar with campaign dates, channels, and budgets. Keep your team aligned on what's launching, when, and where.",
    },
  },
  {
    id: "e5f6a7b8-c9d0-1234-efab-345678901234",
    title: "Meeting Notes",
    description: "Agenda, attendees, and action items",
    category: "General",
    iconName: "ClipboardList",
    color: "bg-teal-700",
    features: ["Agenda builder", "Attendees", "Action items", "Follow-ups"],
    accent: {
      from: "from-teal-50 to-emerald-50/60",
      bubble1: "#5eead4",
      bubble2: "#2dd4bf",
      iconRing: "bg-teal-50 border-teal-100",
    },
    copy: {
      tagline: "Meetings that lead to action.",
      body: "Capture agendas, track attendees, and assign action items — all in one sheet. Never lose track of decisions or follow-ups again.",
    },
  },
  {
    id: "f6a7b8c9-d0e1-2345-fabc-456789012345",
    title: "Sprint Planner",
    description: "Sprints, story points, and velocity",
    category: "Engineering",
    iconName: "BarChart3",
    color: "bg-indigo-700",
    features: ["Sprint boards", "Story points", "Velocity chart", "Backlog"],
    accent: {
      from: "from-indigo-50 to-blue-50/60",
      bubble1: "#a5b4fc",
      bubble2: "#818cf8",
      iconRing: "bg-indigo-50 border-indigo-100",
    },
    copy: {
      tagline: "Plan sprints, ship faster.",
      body: "Organize your sprints with story points, track team velocity, and manage your backlog — a lightweight alternative to heavy project tools.",
    },
  },
  {
    id: "a7b8c9d0-e1f2-3456-abcd-567890123456",
    title: "Expense Report",
    description: "Receipts, categories, and reimbursements",
    category: "Finance",
    iconName: "Receipt",
    color: "bg-lime-700",
    features: ["Receipt log", "Categories", "Approval status", "Total calculator"],
    accent: {
      from: "from-lime-50 to-green-50/60",
      bubble1: "#bef264",
      bubble2: "#a3e635",
      iconRing: "bg-lime-50 border-lime-100",
    },
    copy: {
      tagline: "Expense tracking, simplified.",
      body: "Log receipts, categorize spending, and track reimbursement status. Perfect for freelancers, teams, or anyone who needs clean expense records.",
    },
  },
  {
    id: "b8c9d0e1-f2a3-4567-bcde-678901234567",
    title: "Content Pipeline",
    description: "Content status, publish dates, and owners",
    category: "Marketing",
    iconName: "PenTool",
    color: "bg-rose-600",
    features: ["Content calendar", "Status workflow", "Assignees", "Channel tags"],
    accent: {
      from: "from-rose-50 to-pink-50/60",
      bubble1: "#fda4af",
      bubble2: "#fb7185",
      iconRing: "bg-rose-50 border-rose-100",
    },
    copy: {
      tagline: "From idea to published.",
      body: "Track every piece of content from draft to publish. Assign writers, set deadlines, and manage your editorial workflow without the chaos.",
    },
  },
  {
    id: "c9d0e1f2-a3b4-5678-cdef-789012345678",
    title: "Event Planner",
    description: "Venues, timelines, and guest lists",
    category: "Operations",
    iconName: "PartyPopper",
    color: "bg-fuchsia-600",
    features: ["Guest list", "Venue tracker", "Timeline", "Budget summary"],
    accent: {
      from: "from-fuchsia-50 to-purple-50/60",
      bubble1: "#e879f9",
      bubble2: "#d946ef",
      iconRing: "bg-fuchsia-50 border-fuchsia-100",
    },
    copy: {
      tagline: "Events, perfectly planned.",
      body: "Organize guest lists, compare venues, build timelines, and track your event budget. Everything you need to pull off a flawless event.",
    },
  },
  {
    id: "d0e1f2a3-b4c5-6789-defa-890123456789",
    title: "Student Gradebook",
    description: "Students, assignments, and weighted grades",
    category: "Education",
    iconName: "GraduationCap",
    color: "bg-sky-700",
    features: ["Student roster", "Assignments", "Weighted grades", "GPA calculator"],
    accent: {
      from: "from-sky-50 to-blue-50/60",
      bubble1: "#7dd3fc",
      bubble2: "#38bdf8",
      iconRing: "bg-sky-50 border-sky-100",
    },
    copy: {
      tagline: "Grading made effortless.",
      body: "Manage your class roster, track assignments, and calculate weighted grades automatically. A clean, purpose-built gradebook for educators.",
    },
  },
];
