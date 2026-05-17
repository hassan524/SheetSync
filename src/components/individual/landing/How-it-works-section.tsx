"use client";

import { Button } from "@/components/ui/button";
import { Rocket } from "lucide-react";
import { steps } from "@/data/landing";

const HowItWorksSection = () => {
  return (
    <section
      id="how-it-works"
      className="py-24 sm:py-32 bg-gray-50 border-y border-gray-100"
    >
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
              <div
                key={step.step}
                className={`relative flex flex-col items-center text-center gap-5 scroll-reveal reveal-delay-${i + 1}`}
              >
                <div className="relative">
                  <div
                    className={`h-20 w-20 rounded-2xl ${step.color} flex items-center justify-center shadow-sm border border-white`}
                  >
                    <Icon className="h-9 w-9" />
                  </div>
                  <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-gray-900 text-white text-[10px] font-bold flex items-center justify-center">
                    {step.step}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed max-w-xs mx-auto">
                    {step.description}
                  </p>
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
  );
};

export default HowItWorksSection;
