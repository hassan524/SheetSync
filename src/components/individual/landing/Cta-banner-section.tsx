"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";

interface CtaBannerSectionProps {
  onDemoOpen: () => void;
  onGetStarted: () => void;
}

const CtaBannerSection = ({
  onDemoOpen,
  onGetStarted,
}: CtaBannerSectionProps) => {
  return (
    <section className="py-32 sm:py-48 bg-white">
      <div className="max-w-5xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-green-600 text-white px-10 sm:px-20 py-20 sm:py-28 rounded-3xl text-center flex flex-col items-center gap-10 shadow-2xl overflow-hidden relative">
          {/* Background decorative elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-48 -mt-48"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -ml-48 -mb-48"></div>
          
          <div className="relative z-10 space-y-6 max-w-2xl">
            <h2 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight">
              Ready to Collaborate?
            </h2>
            <p className="text-lg sm:text-2xl opacity-90 leading-relaxed">
              Start building better spreadsheets with your team. No credit card required, free forever.
            </p>
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row gap-4">
            <Button
              onClick={onGetStarted}
              className="bg-white text-blue-600 px-10 py-4 text-lg font-bold hover:bg-gray-100 h-auto shadow-lg hover:shadow-xl transition-all"
            >
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              onClick={onDemoOpen}
              className="text-white hover:bg-white/20 px-10 py-4 text-lg font-bold h-auto border-2 border-white/50 transition-all"
            >
              <Play className="mr-2 h-5 w-5" fill="white" />
              Watch Demo
            </Button>
          </div>

          <p className="relative z-10 text-white/80 text-base">
            ✓ No credit card • ✓ Free forever • ✓ Takes 60 seconds
          </p>
        </div>
      </div>
    </section>
  );
};

export default CtaBannerSection;

