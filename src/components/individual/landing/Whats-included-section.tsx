"use client";

import { Rocket, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { includedFeatures } from "@/data/landing";

const WhatsIncludedSection = () => {
  return (
    <section
      id="pricing"
      className="py-24 sm:py-32 bg-white px-5 sm:px-6 lg:px-8"
    >
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12 scroll-reveal">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">
            No paywalls. No tiers.
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
            Everything Included, Free to Start
          </h2>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">
            Every feature is available from day one. No locked capabilities, no
            upgrade prompts.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-gradient-to-b from-gray-50/60 to-white p-6 sm:p-8 mb-8 scroll-reveal">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {includedFeatures.map(({ icon: Icon, label, color }, i) => (
              <div
                key={label}
                className={`group flex items-center gap-3 bg-white rounded-xl border border-gray-100 px-3.5 py-3.5 shadow-sm hover:border-primary/30 hover:shadow-md transition-all duration-300 scroll-reveal reveal-delay-${(i % 8) + 1}`}
              >
                <div className="h-8 w-8 rounded-lg bg-primary/5 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10 group-hover:scale-110 transition-all duration-300">
                  <Icon className={`h-4 w-4 ${color}`} />
                </div>
                <span className="text-sm font-medium text-gray-800">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center scroll-reveal">
          <Button className="btn-primary text-white px-10 py-4.5 text-base font-semibold h-auto rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl transition-all duration-300 group">
            <Rocket className="mr-2 h-5 w-5 group-hover:rotate-12 transition-transform" />{" "}
            Create Your Free Account
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </Button>
          <p className="text-sm text-gray-400 mt-3">
            No credit card required · Cancel anytime
          </p>
        </div>
      </div>
    </section>
  );
};

export default WhatsIncludedSection;