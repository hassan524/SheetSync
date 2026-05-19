"use client";

import { Button } from "@/components/ui/button";
import { Rocket, ArrowRight, Play } from "lucide-react";

interface CtaBannerSectionProps {
  onDemoOpen: () => void;
  onGetStarted: () => void;
}

const CtaBannerSection = ({
  onDemoOpen,
  onGetStarted,
}: CtaBannerSectionProps) => {
  return (
    <section className="py-24 sm:py-32 bg-white">
      <div className="max-w-4xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-primary via-green-600 to-teal-700 text-white px-8 sm:px-14 py-14 sm:py-16 rounded-3xl text-center flex flex-col items-center gap-6 shadow-2xl shadow-primary/20 scroll-reveal-scale">
          <div className="h-16 w-16 rounded-2xl bg-white/10 flex items-center justify-center">
            <Rocket className="h-8 w-8 text-white" />
          </div>
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">
              Ready to get started?
            </h2>
            <p className="text-base sm:text-lg opacity-85 max-w-xl">
              Create your free account and have your team collaborating on
              spreadsheets in under a minute.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={onGetStarted}
              className="bg-white text-primary px-8 py-3.5 text-base font-semibold hover:bg-gray-100 h-auto"
            >
              Get Started Free
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <Button
              variant="ghost"
              onClick={onDemoOpen}
              className="text-white hover:bg-white/10 px-8 py-3.5 text-base font-semibold h-auto border border-white/30"
            >
              <Play className="mr-2 h-5 w-5" />
              Watch Demo
            </Button>
          </div>
          <p className="text-white/60 text-sm">
            No credit card required · Free forever plan
          </p>
        </div>
      </div>
    </section>
  );
};

export default CtaBannerSection;
