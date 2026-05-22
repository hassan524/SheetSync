"use client";

import { Button } from "@/components/ui/button";
import { steps } from "@/data/landing";

interface HowItWorksSectionProps {
  onGetStarted: () => void;
}

const HowItWorksSection = ({ onGetStarted }: HowItWorksSectionProps) => {
  return (
    <section
      id="how-it-works"
      className="py-28 sm:py-40 bg-white border-t border-gray-100"
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="text-center mb-24 scroll-reveal">
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-widest mb-3">
            Simple process
          </p>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Get Up and Running Fast
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            From signup to collaboration in just a few minutes
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16 relative">
          <div className="hidden md:block absolute top-20 left-[calc(33%+2rem)] right-[calc(33%+2rem)] h-1 bg-gradient-to-r from-blue-200 via-green-200 to-blue-200" />
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div
                key={step.step}
                className={`relative flex flex-col items-center text-center gap-6 scroll-reveal reveal-delay-${i + 1}`}
              >
                <div className="relative">
                  <div
                    className={`h-24 w-24 rounded-3xl ${step.color} flex items-center justify-center shadow-lg border-4 border-white relative z-10`}
                  >
                    <Icon className="h-12 w-12" />
                  </div>
                  <div className="absolute -top-4 -right-4 h-10 w-10 rounded-full bg-blue-600 text-white text-lg font-bold flex items-center justify-center border-4 border-white shadow-md">
                    {step.step}
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    {step.title}
                  </h3>
                  <p className="text-base text-gray-600 leading-relaxed max-w-xs mx-auto">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-24">
          <Button
            onClick={onGetStarted}
            className="btn-primary text-white px-10 py-4 text-lg font-bold h-auto hover:shadow-lg transition-shadow"
          >
            Get Started Now
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;

