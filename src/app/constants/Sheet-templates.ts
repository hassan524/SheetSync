import { FileSpreadsheet, Calculator, Calendar, BarChart3 } from "lucide-react";

export const SHEET_TEMPLATES = [
  {
    id: "f628aed8-bca7-4f51-b687-6db9f932be34",
    title: "Blank Sheet",
    description: "Start fresh with a clean spreadsheet",
    icon: FileSpreadsheet,
    color: "bg-slate-500",
    features: [
      "100+ columns",
      "10,000+ rows",
      "All formulas",
      "Custom styling",
    ],
  },
  {
    id: "2a197048-b791-490e-aaff-9b00785b2b27",
    title: "Finance Tracker",
    description: "Track income, expenses, and savings",
    icon: Calculator,
    color: "bg-emerald-500",
    features: ["Auto-sum", "Monthly breakdown", "Categories", "Savings goals"],
  },
  {
    id: "c9fb4014-cccf-4394-9c3f-5eb16c00cc47",
    title: "Project Tracker",
    description: "Plan project milestones",
    icon: Calendar,
    color: "bg-blue-500",
    features: ["Gantt", "Milestones", "Assignments", "Alerts"],
  },
  {
    id: "e73711d5-aab0-4281-bc8f-486ad6c6aaac",
    title: "QA Tracker",
    description: "Track testing and bugs",
    icon: BarChart3,
    color: "bg-purple-500",
    features: ["Bugs", "Status", "Priority", "Reports"],
  },
];
