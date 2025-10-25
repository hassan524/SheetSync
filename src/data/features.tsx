import { Users, Briefcase, BarChart3 } from "lucide-react";

export const features = [
  {
    icon: <Users className="h-8 w-8" />,
    title: "Remote Teams",
    description:
      "Work together, wherever you are. Real-time sync and mobile-friendly design keep your team aligned.",
    gradient: "from-purple-50 to-indigo-50",
    iconColor: "text-purple-600",
  },
  {
    icon: <Briefcase className="h-8 w-8" />,
    title: "Startups & Indie Hackers",
    description:
      "Quick to launch, zero setup, and no complicated onboarding — just build and go.",
    gradient: "from-green-50 to-emerald-50",
    iconColor: "text-green-600",
  },
  {
    icon: <BarChart3 className="h-8 w-8" />,
    title: "Data Enthusiasts",
    description:
      "Clean UX and all the essential tools for anyone who works with numbers daily.",
    gradient: "from-yellow-50 to-orange-50",
    iconColor: "text-yellow-600",
  },
];
