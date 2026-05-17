"use client";

import { featureTiles } from "@/data/landing";

const FeatureTilesSection = () => {
  return (
    <section className="py-24 sm:py-32 bg-gray-50 border-y border-gray-100">
      <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="text-center mb-14 scroll-reveal">
          <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">
            Built for the long run
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-5">
            A Complete Spreadsheet Platform
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Every feature you'd expect — and several you wouldn't.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {featureTiles.map(({ icon: Icon, title, desc, color }, i) => (
            <div
              key={title}
              className={`group rounded-2xl border border-gray-100 bg-white hover:border-gray-200 hover:shadow-md transition-all duration-200 p-5 flex gap-4 items-start scroll-reveal reveal-delay-${(i % 4) + 1}`}
            >
              <div className="h-10 w-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{title}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                  {desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureTilesSection;
