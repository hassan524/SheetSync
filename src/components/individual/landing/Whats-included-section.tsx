"use client";

import { Button } from "@/components/ui/button";
import { includedFeatures } from "@/data/landing";

const WhatsIncludedSection = () => {
  return (
    <section id="pricing" className="py-28 sm:py-40 bg-gray-50">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="text-center mb-20 scroll-reveal">
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-widest mb-3">
            Free forever
          </p>
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            No Paywalls. Everything Included.
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Every feature is available from day one. No locked capabilities, no tier upgrades.
          </p>
        </div>

        <div className="rounded-3xl border-2 border-gray-200 bg-white p-8 sm:p-12 mb-12 scroll-reveal-scale shadow-lg">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {includedFeatures.map(({ icon: Icon, label, color }) => (
              <div
                key={label}
                className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3 hover:bg-blue-50 transition-colors"
              >
                <Icon className={`h-5 w-5 flex-shrink-0 ${color}`} />
                <span className="text-xs sm:text-sm font-semibold text-gray-700">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center">
          <Button className="btn-primary text-white px-12 py-5 text-lg font-bold h-auto hover:shadow-lg transition-shadow">
            Create Free Account
          </Button>
          <p className="text-base text-gray-600 mt-6">
            No credit card required • Upgrade anytime • Cancel anytime
          </p>
        </div>
      </div>
    </section>
  );
};

export default WhatsIncludedSection;

