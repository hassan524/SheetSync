"use client";

import { Button } from "@/components/ui/button";
import { Rocket } from "lucide-react";
import { includedFeatures } from "@/data/landing";

const WhatsIncludedSection = () => {
  return (
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
            Every feature is available from day one. No locked capabilities, no
            upgrade prompts — just a full-featured spreadsheet platform ready to
            use.
          </p>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-gray-50 p-6 sm:p-10 mb-8 scroll-reveal-scale">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {includedFeatures.map(({ icon: Icon, label, color }) => (
              <div
                key={label}
                className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 px-4 py-3 shadow-sm"
              >
                <div className="h-8 w-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                  <Icon className={`h-4 w-4 ${color}`} />
                </div>
                <span className="text-sm font-medium text-gray-800">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center">
          <Button className="btn-primary text-white px-10 py-4 text-base font-semibold h-auto">
            <Rocket className="mr-2 h-5 w-5" />
            Create Your Free Account
          </Button>
          <p className="text-sm text-gray-400 mt-4">
            No credit card required · Cancel anytime
          </p>
        </div>
      </div>
    </section>
  );
};

export default WhatsIncludedSection;
