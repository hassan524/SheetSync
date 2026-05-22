"use client";

import { Button } from "@/components/ui/button";
import { Zap, Play, ArrowRight, CheckCircle2 } from "lucide-react";

interface HeroSectionProps {
  onDemoOpen: () => void;
  onGetStarted: () => void;
}

const HeroSection = ({ onDemoOpen, onGetStarted }: HeroSectionProps) => {
  return (
    <section className="relative pt-20 pb-24 lg:pb-32 px-5 sm:px-6 lg:px-8 bg-gradient-to-b from-white via-blue-50/30 to-white overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-1/4 w-96 h-96 bg-blue-100/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-green-100/20 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-6xl w-full mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text Content */}
          <div className="flex flex-col gap-8">
            <div className="space-y-8 animate-fade-in-up">
              <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-full px-4 py-2 text-sm font-medium w-fit">
                <Zap className="h-4 w-4" />
                Real-time collaboration
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight tracking-tight">
                Spreadsheets made for{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-green-600 to-blue-600">
                  teams
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-gray-600 leading-relaxed max-w-lg">
                Work together in real-time. Build spreadsheets with 100+ formulas, beautiful templates, and powerful collaboration. Simple to use, powerful when needed.
              </p>

              <div className="flex flex-wrap gap-4 pt-2">
                {["Real-time", "100+ Functions", "Free Forever"].map((t) => (
                  <span key={t} className="flex items-center gap-2 text-gray-700 text-sm font-medium">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                    {t}
                  </span>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button
                  onClick={onGetStarted}
                  className="btn-primary text-white px-10 py-6 text-lg font-semibold h-auto group hover:gap-3 transition-all shadow-lg hover:shadow-xl"
                >
                  Start Free
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button
                  variant="outline"
                  onClick={onDemoOpen}
                  className="px-10 py-6 text-lg font-semibold border-2 border-gray-300 text-gray-700 hover:border-blue-600 hover:text-blue-600 h-auto transition-colors"
                >
                  <Play className="mr-2 h-5 w-5" />
                  See Demo
                </Button>
              </div>

              <p className="text-sm text-gray-500">
                ✓ No credit card • ✓ Free forever • ✓ 2-minute setup
              </p>
            </div>
          </div>

          {/* Right: Space for user to add image */}
          <div className="hidden lg:block relative h-[600px]">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl border-2 border-gray-200 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <p className="text-lg font-semibold mb-2">Your spreadsheet screenshot here</p>
                <p className="text-sm">Add your image to this space</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

