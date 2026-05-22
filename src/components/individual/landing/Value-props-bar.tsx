"use client";

import { valueProps } from "@/data/landing";

const ValuePropsBar = () => {
  return (
    <section className="py-16 bg-blue-50 border-y border-blue-100">
      <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          {valueProps.map(({ icon: Icon, label, desc, color }, i) => (
            <div
              key={label}
              className={`scroll-reveal reveal-delay-${i + 1} flex flex-col items-center gap-3`}
            >
              <div className="h-14 w-14 rounded-2xl bg-white border-2 border-blue-100 shadow-sm flex items-center justify-center hover:scale-110 transition-transform">
                <Icon className={`h-6 w-6 ${color}`} />
              </div>
              <p className="text-base font-bold text-gray-900">{label}</p>
              <p className="text-sm text-gray-600">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ValuePropsBar;

