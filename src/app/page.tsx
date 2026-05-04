'use client';
import React, { useState, useEffect } from "react";

function useScrollReveal() {
  useEffect(() => {
    const selectors = [
      ".scroll-reveal",
      ".scroll-reveal-scale",
      ".scroll-reveal-left",
      ".scroll-reveal-right",
    ].join(",");

    const elements = document.querySelectorAll(selectors);
    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import {
  Users,
  Rocket,
  Play,
  Table,
  CheckCircle2,
  ArrowRight,
  Zap,
  Shield,
  X,
  FileSpreadsheet,
  FunctionSquare,
  LayoutTemplate,
  Upload,
  Building2,
  History,
  Download,
  Lock,
  Globe,
  Layers,
  GitBranch,
  Star,
  SlidersHorizontal,
  FolderOpen,
  UserPlus,
} from "lucide-react";
import { faqs } from "@/data/faqs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// ─── App features with inline video player ────────────────────────────────────
const appFeatures = [
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
      "Error detection & hints",
    ],
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
      "Choose from professionally designed spreadsheet templates for budgets, CRM, project tracking, inventory management, and more. One click to create and customize.",
    bullets: [
      "Budget & expense tracking",
      "CRM & sales pipeline",
      "Project & task management",
      "Inventory & stock control",
    ],
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
  },
];

// ─── How it works steps ───────────────────────────────────────────────────────
const steps = [
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
const includedFeatures = [
  { icon: FileSpreadsheet, label: "Unlimited spreadsheets", color: "text-primary" },
  { icon: Users, label: "Real-time collaboration", color: "text-blue-600" },
  { icon: FunctionSquare, label: "100+ built-in formulas", color: "text-orange-600" },
  { icon: LayoutTemplate, label: "50+ ready-made templates", color: "text-primary" },
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
  { icon: SlidersHorizontal, label: "Custom sheet settings", color: "text-slate-600" },
  { icon: Zap, label: "Fast, instant sync", color: "text-orange-500" },
];

// ─── Feature tiles ────────────────────────────────────────────────────────────
const featureTiles = [
  { icon: Lock, title: "Secure by default", desc: "Row-level security, encrypted at rest", color: "text-blue-600" },
  { icon: Globe, title: "Works anywhere", desc: "Fully browser-based, no install needed", color: "text-primary" },
  { icon: Layers, title: "Folder organization", desc: "Group sheets into folders your way", color: "text-orange-600" },
  { icon: Star, title: "Star & pin sheets", desc: "Quick access to your most-used sheets", color: "text-yellow-600" },
  { icon: GitBranch, title: "Version control", desc: "Every edit is saved, nothing is lost", color: "text-indigo-600" },
  { icon: Download, title: "Offline export", desc: "Download as PDF, CSV, or Excel anytime", color: "text-teal-600" },
  { icon: Shield, title: "Role-based access", desc: "Viewer, editor, and admin roles", color: "text-pink-600" },
  { icon: Building2, title: "Multi-org support", desc: "Belong to multiple orgs at once", color: "text-purple-600" },
];

// ─── Demo Modal ───────────────────────────────────────────────────────────────
function DemoModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-3xl bg-black rounded-2xl overflow-hidden shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="aspect-video w-full bg-gray-900">
          <iframe
            className="w-full h-full"
            src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0"
            title="SheetSync Demo"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        <div className="bg-gray-900 px-5 py-3 flex items-center justify-between">
          <div>
            <p className="text-white text-sm font-semibold">SheetSync — Product Demo</p>
            <p className="text-gray-400 text-xs">Collaboration · Formulas · Templates · Organizations</p>
          </div>
          <Button onClick={onClose} variant="ghost" size="sm" className="text-gray-400 hover:text-white">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Inline Video Player ──────────────────────────────────────────────────────
function FeatureVideo({
  title,
  gradientFrom,
  gradientTo,
  icon: Icon,
  onPlay,
}: {
  title: string;
  gradientFrom: string;
  gradientTo: string;
  icon: React.ElementType;
  color: string;
  onPlay: () => void;
}) {
  return (
    <button
      onClick={onPlay}
      className="group relative w-full rounded-2xl overflow-hidden shadow-xl border border-white/10 focus:outline-none"
      style={{ aspectRatio: "16/10" }}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradientFrom} ${gradientTo}`} />
      <div className="absolute inset-0 opacity-[0.07] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMC41Ii8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')]" />
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/15">
        <div className="h-full w-2/5 bg-white/50 rounded-full" />
      </div>
      <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
        <span className="text-white/75 text-xs font-medium truncate">{title}</span>
        <span className="text-white/50 text-[11px] ml-2 shrink-0">2:30</span>
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-5">
        <div className="h-14 w-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
          <Icon className="h-7 w-7 text-white/80" />
        </div>
        <div className="h-14 w-14 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center group-hover:bg-white/30 group-hover:scale-110 transition-all duration-200 shadow-xl">
          <Play className="h-6 w-6 text-white ml-0.5" fill="white" />
        </div>
      </div>
      <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-black/30 backdrop-blur-sm rounded-full px-2.5 py-1">
        <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
        <span className="text-white text-[10px] font-medium">Live demo</span>
      </div>
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Home() {
  const [demoOpen, setDemoOpen] = useState(false);
  useScrollReveal();

  return (
    <div className="bg-white">
      <Navigation />
      <DemoModal open={demoOpen} onClose={() => setDemoOpen(false)} />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="hero-gradient pt-28 pb-20 sm:pt-36 sm:pb-28 px-5 sm:px-6 lg:px-8">
        <div className="max-w-5xl w-full flex flex-col gap-7 mx-auto text-center">
          <div className="animate-fade-in-up">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary rounded-full px-4 py-1.5 text-sm font-medium mx-auto">
              <Zap className="h-3.5 w-3.5 flex-shrink-0" />
              Real-time collaboration for modern teams
            </div>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[68px] font-bold text-gray-900 leading-[1.1] tracking-tight animate-fade-in-up delay-100">
            Spreadsheets built for{" "}
            <span className="text-primary">real teams</span>,{" "}
            in real time
          </h1>

          <p className="text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed animate-fade-in-up delay-200">
            SheetSync is a cloud spreadsheet platform with live collaboration,
            100+ formulas, ready-made templates, team organizations, and full
            import/export — all in one workspace.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm text-gray-400 animate-fade-in-up delay-300">
            {["No credit card required", "Free forever plan", "Ready in 60 seconds"].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                {t}
              </span>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center animate-fade-in-up delay-400">
            <Button className="btn-primary text-white px-8 py-4 text-base font-semibold h-auto w-full sm:w-auto">
              <Rocket className="mr-2 h-5 w-5" />
              Start Free — It&apos;s Free
            </Button>
            <Button
              variant="outline"
              onClick={() => setDemoOpen(true)}
              className="px-8 py-4 text-base font-semibold border-2 border-gray-200 text-gray-700 hover:border-primary hover:text-primary h-auto w-full sm:w-auto transition-colors"
            >
              <Play className="mr-2 h-5 w-5" />
              Watch Demo
            </Button>
          </div>

          <p className="text-sm text-gray-400 animate-fade-in-up delay-500">
            Trusted by <span className="font-semibold text-gray-600">10,000+</span> users worldwide
          </p>
        </div>
      </section>

      {/* ── Stats bar ────────────────────────────────────────────────────── */}
      <section className="py-14 bg-gray-50 border-y border-gray-100">
        <div className="max-w-5xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {[
              { value: "10K+", label: "Active Users" },
              { value: "500K+", label: "Sheets Created" },
              { value: "99.9%", label: "Uptime" },
              { value: "50+", label: "Templates" },
            ].map(({ value, label }, i) => (
              <div key={label} className={`scroll-reveal reveal-delay-${i + 1}`}>
                <p className="text-3xl sm:text-4xl font-bold text-gray-900">{value}</p>
                <p className="text-sm text-gray-500 mt-1.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 sm:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="text-center mb-20 scroll-reveal">
            <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">
              Built-in capabilities
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-5">
              Everything Your Team Needs
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              From live collaboration to powerful formulas — every tool built right in, no plugins needed.
            </p>
          </div>

          <div className="flex flex-col gap-24 sm:gap-32">
            {appFeatures.map((feat, index) => {
              const Icon = feat.icon;
              const isReverse = index % 2 !== 0;
              return (
                <div
                  key={feat.title}
                  className={`flex flex-col ${isReverse ? "lg:flex-row-reverse" : "lg:flex-row"} gap-10 lg:gap-20 items-center`}
                >
                  <div className={`w-full lg:w-1/2 space-y-6 ${isReverse ? "scroll-reveal-right" : "scroll-reveal-left"}`}>
                    <div className="flex items-center gap-3">
                      <div className={`${feat.bg} p-3 rounded-xl`}>
                        <Icon className={`h-7 w-7 ${feat.color}`} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">{feat.subtitle}</p>
                        <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-0.5">{feat.title}</h3>
                      </div>
                    </div>
                    <p className="text-base sm:text-lg text-gray-600 leading-relaxed">{feat.description}</p>
                    <ul className="space-y-3">
                      {feat.bullets.map((b) => (
                        <li key={b} className="flex items-center gap-3 text-gray-700">
                          <div className={`h-5 w-5 rounded-full ${feat.bg} flex items-center justify-center flex-shrink-0`}>
                            <CheckCircle2 className={`h-3.5 w-3.5 ${feat.color}`} />
                          </div>
                          <span className="text-sm sm:text-base">{b}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      onClick={() => setDemoOpen(true)}
                      variant="outline"
                      className={`border-2 font-semibold gap-2 ${feat.color} hover:opacity-80`}
                    >
                      <Play className="h-4 w-4" fill="currentColor" />
                      See it in action
                    </Button>
                  </div>

                  <div className={`w-full lg:w-1/2 ${isReverse ? "scroll-reveal-left" : "scroll-reveal-right"}`}>
                    <FeatureVideo
                      title={feat.title}
                      gradientFrom={feat.gradientFrom}
                      gradientTo={feat.gradientTo}
                      icon={Icon}
                      color={feat.color}
                      onPlay={() => setDemoOpen(true)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 sm:py-32 bg-gray-50 border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="text-center mb-16 scroll-reveal">
            <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">
              Simple by design
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-5">
              How SheetSync Works
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              From zero to collaborating with your team in under two minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-14 relative">
            <div className="hidden md:block absolute top-10 left-[calc(33%+1rem)] right-[calc(33%+1rem)] h-px bg-gradient-to-r from-gray-200 via-primary/40 to-gray-200" />
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.step} className={`relative flex flex-col items-center text-center gap-5 scroll-reveal reveal-delay-${i + 1}`}>
                  <div className="relative">
                    <div className={`h-20 w-20 rounded-2xl ${step.color} flex items-center justify-center shadow-sm border border-white`}>
                      <Icon className="h-9 w-9" />
                    </div>
                    <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-gray-900 text-white text-[10px] font-bold flex items-center justify-center">
                      {step.step}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed max-w-xs mx-auto">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center mt-14">
            <Button className="btn-primary text-white px-8 py-3.5 text-base font-semibold h-auto">
              <Rocket className="mr-2 h-5 w-5" />
              Get Started Free
            </Button>
          </div>
        </div>
      </section>

      {/* ── What's included ──────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 sm:py-32 bg-white">
        <div className="max-w-5xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="text-center mb-14 scroll-reveal">
            <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">
              No paywalls. No tiers.
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-5">
              Everything Included, Free to Start
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Every feature is available from day one. No locked capabilities, no upgrade prompts — just a full-featured spreadsheet platform ready to use.
            </p>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-gray-50 p-6 sm:p-10 mb-8 scroll-reveal-scale">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {includedFeatures.map(({ icon: Icon, label, color }, i) => (
                <div
                  key={label}
                  className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 px-4 py-3 shadow-sm"
                >
                  <div className="h-8 w-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                    <Icon className={`h-4 w-4 ${color}`} />
                  </div>
                  <span className="text-sm font-medium text-gray-800">{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center">
            <Button className="btn-primary text-white px-10 py-4 text-base font-semibold h-auto">
              <Rocket className="mr-2 h-5 w-5" />
              Create Your Free Account
            </Button>
            <p className="text-sm text-gray-400 mt-4">No credit card required · Cancel anytime</p>
          </div>
        </div>
      </section>

      {/* ── Feature tiles grid ────────────────────────────────────────────── */}
      <section className="py-24 sm:py-32 bg-gray-50 border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="text-center mb-14 scroll-reveal">
            <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">
              Built for the long run
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-5">
              A Complete Spreadsheet Platform
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Every feature you'd expect — and several you wouldn't.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {featureTiles.map(({ icon: Icon, title, desc, color }, i) => (
              <div
                key={title}
                className={`group rounded-2xl border border-gray-100 bg-white hover:border-gray-200 hover:shadow-md transition-all duration-200 p-5 flex gap-4 items-start scroll-reveal reveal-delay-${(i % 4) + 1}`}
              >
                <div className="h-10 w-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────────────────────────────── */}
      <section className="py-24 sm:py-32 bg-white">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-primary via-green-600 to-teal-700 text-white px-8 sm:px-14 py-14 sm:py-16 rounded-3xl text-center flex flex-col items-center gap-6 shadow-2xl shadow-primary/20 scroll-reveal-scale">
            <div className="h-16 w-16 rounded-2xl bg-white/10 flex items-center justify-center">
              <Rocket className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-3">Ready to get started?</h2>
              <p className="text-base sm:text-lg opacity-85 max-w-xl">
                Create your free account and have your team collaborating on spreadsheets in under a minute.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button className="bg-white text-primary px-8 py-3.5 text-base font-semibold hover:bg-gray-100 h-auto">
                Get Started Free
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <Button
                variant="ghost"
                onClick={() => setDemoOpen(true)}
                className="text-white hover:bg-white/10 px-8 py-3.5 text-base font-semibold h-auto border border-white/30"
              >
                <Play className="mr-2 h-5 w-5" />
                Watch Demo
              </Button>
            </div>
            <p className="text-white/60 text-sm">No credit card required · Free forever plan</p>
          </div>
        </div>
      </section>

      {/* ── FAQs ─────────────────────────────────────────────────────────── */}
      <section id="contact" className="py-24 sm:py-32 bg-gray-50 border-t border-gray-100">
        <div className="max-w-3xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="text-center mb-14 scroll-reveal">
            <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">
              Got questions?
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-5">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 sm:px-6 py-2 scroll-reveal-scale">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="border-b border-gray-100 last:border-0"
                >
                  <AccordionTrigger className="text-left py-4 hover:text-primary transition-colors">
                    <span className="text-sm sm:text-base font-medium text-gray-900 pr-4">
                      {faq.question}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-500 pb-4 pt-1 text-sm leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          <p className="text-sm text-gray-400 text-center mt-8">
            Still have questions?{" "}
            <a href="mailto:support@sheetsync.app" className="text-primary font-medium hover:underline">
              Contact our support team
            </a>
          </p>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="bg-gray-950 text-white py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-10">
            <div className="col-span-2">
              <div className="flex items-center mb-4">
                <Table className="h-7 w-7 text-primary mr-2" />
                <span className="text-xl font-bold">SheetSync</span>
              </div>
              <p className="text-gray-400 text-sm mb-6 max-w-xs leading-relaxed">
                Cloud spreadsheets built for real-time collaboration. Formulas, templates, organizations — all in one beautiful workspace.
              </p>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <span className="text-xs text-gray-500">Bank-level data encryption</span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-gray-400 mb-5 uppercase tracking-widest">Product</h4>
              <ul className="space-y-3">
                {["Features", "Templates", "Import / Export", "Organizations", "Activity Log"].map((l) => (
                  <li key={l}>
                    <a href="#" className="text-gray-500 hover:text-white transition-colors text-sm">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-gray-400 mb-5 uppercase tracking-widest">Company</h4>
              <ul className="space-y-3">
                {["About", "Blog", "Changelog", "Contact", "Status"].map((l) => (
                  <li key={l}>
                    <a href="#" className="text-gray-500 hover:text-white transition-colors text-sm">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-14 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-gray-600 text-sm">
              © {new Date().getFullYear()} SheetSync. All rights reserved.
            </p>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
              {["Privacy Policy", "Terms of Service", "Security"].map((l) => (
                <a key={l} href="#" className="text-gray-600 hover:text-white text-xs transition-colors">
                  {l}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
