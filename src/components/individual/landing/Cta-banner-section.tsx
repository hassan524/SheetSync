"use client";

import { Button } from "@/components/ui/button";
import { Rocket, ArrowRight, Play } from "lucide-react";

interface CtaBannerSectionProps {
  onDemoOpen: () => void;
  onGetStarted: () => void;
}

const CtaBannerSection = ({ onDemoOpen, onGetStarted }: CtaBannerSectionProps) => {
  return (
    <section className="py-24 sm:py-32 bg-gray-50/60 border-t border-gray-100 px-5 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm px-8 sm:px-16 py-14 text-center">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Rocket className="h-7 w-7 text-primary" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 tracking-tight">
            Ready to get started?
          </h2>
          <p className="text-base sm:text-lg text-gray-500 max-w-md mx-auto mb-8">
            Create your free account and have your team collaborating on spreadsheets in under a minute.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-5">
            <Button onClick={onGetStarted} className="btn-primary text-white px-8 py-3.5 text-base font-semibold h-auto">
              Get Started Free <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <Button variant="outline" onClick={onDemoOpen} className="px-8 py-3.5 text-base font-semibold border-2 border-gray-200 text-gray-600 hover:border-primary hover:text-primary h-auto transition-colors">
              <Play className="mr-2 h-4 w-4" /> Watch Demo
            </Button>
          </div>
          <p className="text-sm text-gray-400">No credit card required · Free forever plan</p>
        </div>
      </div>
    </section>
  );
};

export default CtaBannerSection;