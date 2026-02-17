import { Calculator, BarChart3, Calendar, FileSpreadsheet } from "lucide-react";

export const templates = [
  {
    id: "budget",
    title: "Budget Tracker",
    description:
      "Track income, expenses, and savings with automated calculations",
    icon: <Calculator className="h-5 w-5 text-primary-foreground" />,
    color: "bg-primary",
    features: [
      "Auto-sum formulas",
      "Monthly breakdown",
      "Expense categories",
      "Savings goals",
    ],
  },
  {
    id: "timeline",
    title: "Project Timeline",
    description: "Plan and visualize project milestones and deadlines",
    icon: <Calendar className="h-5 w-5 text-primary-foreground" />,
    color: "bg-primary",
    features: [
      "Gantt view",
      "Milestone tracking",
      "Team assignments",
      "Due date alerts",
    ],
  },
  {
    id: "inventory",
    title: "Inventory Tracker",
    description:
      "Track products, assets, and stock levels with automatic calculations",
    icon: <BarChart3 className="h-5 w-5 text-primary-foreground" />,
    color: "bg-primary",
    features: [
      "Quantity & price tracking",
      "Low stock alerts",
      "Total value calculations",
      "Category management",
    ],
  },
  {
    id: "blank",
    title: "Blank Sheet",
    description: "Start fresh with a clean spreadsheet",
    icon: <FileSpreadsheet className="h-5 w-5 text-primary-foreground" />,
    color: "bg-primary",
    features: [
      "100+ columns",
      "10,000+ rows",
      "All formulas",
      "Custom styling",
    ],
  },
];
