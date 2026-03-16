import { FileSpreadsheet, Calculator, Calendar, BarChart3 } from "lucide-react";

export const SHEET_TEMPLATES = [
  {
    id: "f628aed8-bca7-4f51-b687-6db9f932be34",
    title: "Blank Sheet",
    description: "Start fresh with a clean spreadsheet",
    icon: FileSpreadsheet,
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
    icon: Calculator,
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
    description: "Plan project milestones",
    icon: Calendar,
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
    icon: BarChart3,
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
];