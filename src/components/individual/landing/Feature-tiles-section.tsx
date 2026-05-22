"use client";

import { featureTiles } from "@/data/landing";

const FeatureTilesSection = () => {
  return (
    <section className="py-28 sm:py-40 bg-gray-50">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="text-center mb-20 scroll-reveal">
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-widest mb-3">
            Complete platform
          </p>
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            Everything Included
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            No plugins, no add-ons. Everything is built in and ready to use
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featureTiles.map(({ icon: Icon, title, desc, color }, i) => (
            <div
              key={title}
              className={`group rounded-2xl border border-gray-200 bg-white hover:border-blue-200 hover:shadow-xl transition-all duration-300 p-8 flex flex-col gap-4 scroll-reveal reveal-delay-${(i % 4) + 1}`}
            >
              <div className="h-12 w-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Icon className={`h-6 w-6 ${color}`} />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900 mb-2">{title}</p>
                <p className="text-base text-gray-600 leading-relaxed">
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

