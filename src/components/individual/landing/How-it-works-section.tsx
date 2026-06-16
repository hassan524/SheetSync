"use client";

import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Rocket, ArrowRight, LayoutTemplate, Users, FileDown } from "lucide-react";

interface HowItWorksSectionProps {
  onGetStarted: () => void;
}

const steps = [
  {
    step: 1,
    icon: LayoutTemplate,
    title: "Pick a Template",
    description:
      "Choose from ready-made templates like budgets, invoices, and project plans — or start from a blank sheet.",
  },
  {
    step: 2,
    icon: Users,
    title: "Invite & Edit Together",
    description:
      "Share a link with your team and collaborate in real time. See live cursors, use formulas, and merge cells together.",
  },
  {
    step: 3,
    icon: FileDown,
    title: "Export as PDF",
    description:
      "When you're done, export a pixel-perfect PDF in one click. Layouts, merged cells, and charts all transfer faithfully.",
  },
];

function StepCard({
  step,
  index,
  total,
}: {
  step: (typeof steps)[0];
  index: number;
  total: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const Icon = step.icon;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative flex flex-col items-center" ref={ref}>
      {/* Connecting line */}
      {index < total - 1 && (
        <div className="hidden md:block absolute top-8 left-[calc(50%+40px)] w-[calc(100%-80px)] h-px">
          <div
            className="h-full bg-gradient-to-r from-primary/30 to-primary/10 transition-all duration-1000 ease-out"
            style={{
              transform: isVisible ? "scaleX(1)" : "scaleX(0)",
              transformOrigin: "left",
              transitionDelay: "400ms",
            }}
          />
        </div>
      )}

      {/* Step circle */}
      <div
        className={`relative z-10 h-16 w-16 rounded-2xl flex items-center justify-center mb-6 transition-all duration-600 ease-out ${
          isVisible ? "opacity-100 scale-100" : "opacity-0 scale-75"
        }`}
        style={{
          background: "linear-gradient(135deg, #0d7c5f, #10b981)",
          transitionDelay: `${index * 150}ms`,
        }}
      >
        <Icon className="h-7 w-7 text-white" />
      </div>

      {/* Step number */}
      <span
        className={`text-xs font-bold text-primary/40 uppercase tracking-[0.2em] mb-2 transition-all duration-600 ease-out ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
        }`}
        style={{ transitionDelay: `${index * 150 + 100}ms` }}
      >
        Step {step.step}
      </span>

      {/* Title */}
      <h3
        className={`text-xl font-semibold text-gray-900 mb-2 text-center transition-all duration-600 ease-out ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
        }`}
        style={{ transitionDelay: `${index * 150 + 200}ms` }}
      >
        {step.title}
      </h3>

      {/* Description */}
      <p
        className={`text-sm text-gray-500 text-center leading-relaxed max-w-[260px] transition-all duration-600 ease-out ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
        }`}
        style={{ transitionDelay: `${index * 150 + 300}ms` }}
      >
        {step.description}
      </p>
    </div>
  );
}

const HowItWorksSection = ({ onGetStarted }: HowItWorksSectionProps) => {
  return (
    <section
      id="how-it-works"
      className="relative py-24 bg-gray-50/60 border-y border-gray-100 px-5 sm:px-6 lg:px-8 overflow-hidden"
    >
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">
            Simple by design
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-gray-900 mb-4 tracking-tight">
            How SheetSync Works
          </h2>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">
            From template to exported PDF in three simple steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-6 mb-14">
          {steps.map((step, i) => (
            <StepCard key={step.step} step={step} index={i} total={steps.length} />
          ))}
        </div>

        <div className="text-center">
          <Button
            onClick={onGetStarted}
            className="btn-primary text-white px-8 py-4 text-base font-semibold h-auto rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl transition-all duration-300 group"
          >
            <Rocket className="mr-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
            Get Started Free
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;