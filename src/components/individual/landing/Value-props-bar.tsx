"use client";

import { valueProps } from "@/data/landing";

const ValuePropsBar = () => {
  return (
    <section className="relative border-y border-gray-100 bg-gradient-to-r from-gray-50/80 via-white to-gray-50/80 py-6 px-5 sm:px-6 lg:px-8 overflow-hidden">
      {/* Subtle animated shimmer */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(13,124,95,0.03) 25%, transparent 50%, rgba(13,124,95,0.03) 75%, transparent 100%)",
          backgroundSize: "200% 100%",
          animation: "shimmer 8s ease-in-out infinite",
        }}
      />
      <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-5 relative z-10">
        {valueProps.map(({ icon: Icon, label, desc, color }, i) => (
          <div
            key={label}
            className="group flex items-center gap-3.5 flex-1 min-w-[180px] justify-center py-1 hover:scale-[1.02] transition-transform duration-300"
          >
            <div className="h-10 w-10 rounded-xl bg-white border border-gray-100 shadow-sm flex items-center justify-center flex-shrink-0 group-hover:shadow-md group-hover:border-primary/20 transition-all duration-300">
              <Icon className={`h-4.5 w-4.5 ${color}`} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800">{label}</p>
              <p className="text-xs text-gray-400">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ValuePropsBar;