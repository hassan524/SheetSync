import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import TemplateCard from "@/components/sheets/TemplateCard";
import UseTemplateModal from "@/components/sheets/UseTemplateModal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  FileSpreadsheet,
  Calculator,
  BarChart3,
  Calendar,
  Users,
  Package,
  DollarSign,
  CheckSquare,
  Search,
  Sparkles,
} from "lucide-react";

const allTemplates = [
  {
    id: "budget",
    title: "Budget Tracker",
    description: "Track income, expenses, and savings with automated calculations",
    icon: <Calculator className="h-5 w-5 text-primary-foreground" />,
    color: "bg-primary",
    category: "Finance",
    features: ["Auto-sum formulas", "Monthly breakdown", "Expense categories", "Savings goals"],
  },
  {
    id: "timeline",
    title: "Project Timeline",
    description: "Plan and visualize project milestones and deadlines",
    icon: <Calendar className="h-5 w-5 text-primary-foreground" />,
    color: "bg-primary",
    category: "Project Management",
    features: ["Gantt view", "Milestone tracking", "Team assignments", "Due date alerts"],
  },
  {
    id: "sales",
    title: "Sales Dashboard",
    description: "Monitor sales performance with charts and KPIs",
    icon: <BarChart3 className="h-5 w-5 text-primary-foreground" />,
    color: "bg-primary",
    category: "Sales",
    features: ["Real-time charts", "KPI widgets", "Pipeline tracking", "Revenue forecast"],
  },
  {
    id: "blank",
    title: "Blank Sheet",
    description: "Start fresh with a clean spreadsheet",
    icon: <FileSpreadsheet className="h-5 w-5 text-primary-foreground" />,
    color: "bg-primary",
    category: "General",
    features: ["100+ columns", "10,000+ rows", "All formulas", "Custom styling"],
  },
  {
    id: "team",
    title: "Team Directory",
    description: "Organize team contacts and roles in one place",
    icon: <Users className="h-5 w-5 text-primary-foreground" />,
    color: "bg-primary",
    category: "HR",
    features: ["Contact management", "Role assignments", "Department grouping", "Quick search"],
  },
  {
    id: "inventory",
    title: "Inventory Manager",
    description: "Track stock levels, orders, and suppliers",
    icon: <Package className="h-5 w-5 text-primary-foreground" />,
    color: "bg-primary",
    category: "Operations",
    features: ["Stock alerts", "Supplier tracking", "Order history", "Barcode support"],
  },
  {
    id: "invoice",
    title: "Invoice Template",
    description: "Create professional invoices with automatic totals",
    icon: <DollarSign className="h-5 w-5 text-primary-foreground" />,
    color: "bg-primary",
    category: "Finance",
    features: ["Auto calculations", "Tax support", "Client details", "PDF export"],
  },
  {
    id: "tasks",
    title: "Task Tracker",
    description: "Manage tasks, deadlines, and team assignments",
    icon: <CheckSquare className="h-5 w-5 text-primary-foreground" />,
    color: "bg-primary",
    category: "Project Management",
    features: ["Priority levels", "Due dates", "Assignees", "Progress tracking"],
  },
];

const categories = ["All", "Finance", "Project Management", "Sales", "HR", "Operations", "General"];

const TemplatesPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<typeof allTemplates[0] | null>(null);

  const filteredTemplates = allTemplates.filter((template) => {
    const matchesSearch = template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleTemplateClick = (template: typeof allTemplates[0]) => {
    setSelectedTemplate(template);
    setTemplateModalOpen(true);
  };

  return (
    <DashboardLayout breadcrumbItems={["SheetSync", "Templates"]}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold animate-fade-in">Templates</h1>
              <p className="text-muted-foreground animate-fade-in">
                Start quickly with pre-built spreadsheet templates
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-card border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Total Templates</p>
            <p className="text-2xl font-semibold">{allTemplates.length}</p>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Categories</p>
            <p className="text-2xl font-semibold">{categories.length - 1}</p>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Most Popular</p>
            <p className="text-sm font-medium">Budget Tracker</p>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">New This Month</p>
            <p className="text-2xl font-semibold">2</p>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6 animate-slide-up">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search templates..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredTemplates.map((template, index) => (
            <div 
              key={template.id} 
              style={{ animationDelay: `${index * 50}ms` }}
              onClick={() => handleTemplateClick(template)}
            >
              <TemplateCard {...template} />
            </div>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-12 animate-fade-in">
            <p className="text-muted-foreground">No templates found matching your criteria.</p>
          </div>
        )}

        {/* Popular Templates Section */}
        <div className="mt-12 p-6 bg-muted/30 rounded-xl border animate-fade-in">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Why Use Templates?
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-1">Save Time</h4>
              <p className="text-muted-foreground">
                Pre-built formulas and layouts mean you can start working immediately.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-1">Best Practices</h4>
              <p className="text-muted-foreground">
                Templates are designed following industry standards and best practices.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-1">Fully Customizable</h4>
              <p className="text-muted-foreground">
                Every template can be customized to fit your specific needs.
              </p>
            </div>
          </div>
        </div>
      </div>

      <UseTemplateModal
        open={templateModalOpen}
        onOpenChange={setTemplateModalOpen}
        template={selectedTemplate}
      />
    </DashboardLayout>
  );
};

export default TemplatesPage;
