import { TemplateInterface } from "@/types/template"
import {
  Target,
  CheckSquare,
  Users,
} from "lucide-react"

export const Templates: TemplateInterface[] = [
  { title: "Project Tracker", description: "Track tasks & milestones", icon: Target, bgColor: "bg-blue-100" },
  { title: "To-Do List", description: "Track tasks and deadlines", icon: CheckSquare, bgColor: "bg-yellow-100" },
  { title: "Team Directory", description: "Contact information", icon: Users, bgColor: "bg-purple-100" },
]