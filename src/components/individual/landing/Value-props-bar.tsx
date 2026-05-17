"use client";

import { valueProps } from "@/data/landing";

const ValuePropsBar = () => {
  return (
    <section className="py-14 bg-gray-50 border-y border-gray-100">
      <div className="max-w-5xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
          {valueProps.map(({ icon: Icon, label, desc, color }, i) => (
            <div
              key={label}
              className={`scroll-reveal reveal-delay-${i + 1} flex flex-col items-center gap-2`}
            >
              <div className="h-11 w-11 rounded-xl bg-white border border-gray-100 shadow-sm flex items-center justify-center">
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <p className="text-sm font-semibold text-gray-800">{label}</p>
              <p className="text-xs text-gray-400">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ValuePropsBar;
