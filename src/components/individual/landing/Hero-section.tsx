"use client";

import { Button } from "@/components/ui/button";
import { Zap, Rocket, Play, CheckCircle2 } from "lucide-react";

interface HeroSectionProps {
  onDemoOpen: () => void;
  onGetStarted: () => void;
}

const HeroSection = ({ onDemoOpen, onGetStarted }: HeroSectionProps) => {
  return (
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
          <span className="text-primary">real teams</span>, in real time
        </h1>

        <p className="text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed animate-fade-in-up delay-200">
          SheetSync is a cloud spreadsheet platform with live collaboration,
          100+ formulas, ready-made templates, team organizations, and full
          import/export — all in one workspace.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm text-gray-400 animate-fade-in-up delay-300">
          {[
            "No credit card required",
            "Free forever plan",
            "Ready in 60 seconds",
          ].map((t) => (
            <span key={t} className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
              {t}
            </span>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center animate-fade-in-up delay-400">
          <Button
            onClick={onGetStarted}
            className="btn-primary text-white px-8 py-4 text-base font-semibold h-auto w-full sm:w-auto"
          >
            <Rocket className="mr-2 h-5 w-5" />
            Start Free — It&apos;s Free
          </Button>
          <Button
            variant="outline"
            onClick={onDemoOpen}
            className="px-8 py-4 text-base font-semibold border-2 border-gray-200 text-gray-700 hover:border-primary hover:text-primary h-auto w-full sm:w-auto transition-colors"
          >
            <Play className="mr-2 h-5 w-5" />
            Watch Demo
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
