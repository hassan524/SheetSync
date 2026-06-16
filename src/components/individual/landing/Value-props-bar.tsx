"use client";

import { useEffect, useRef, useState } from "react";
import { valueProps } from "@/data/landing";

const ValuePropsBar = () => {
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [visible, setVisible] = useState<boolean[]>(
    new Array(valueProps.length).fill(false)
  );

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    itemRefs.current.forEach((el, i) => {
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            // stagger each item by its index
            setTimeout(() => {
              setVisible((prev) => {
                const next = [...prev];
                next[i] = true;
                return next;
              });
            }, i * 80);
            obs.disconnect();
          }
        },
        { threshold: 0.2 }
      );
      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0%, 100% { background-position: 200% center; }
          50% { background-position: 0% center; }
        }
        @keyframes zoom-in {
          from { opacity: 0; transform: scale(0.82) translateY(10px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
        .vp-item {
          opacity: 0;
          transform: scale(0.82) translateY(10px);
          transition: none;
        }
        .vp-item.is-visible {
          animation: zoom-in 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        /* Mobile: diagonal accent line between left and right columns */
        @media (max-width: 639px) {
          .vp-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0;
            position: relative;
          }
          /* Vertical center divider */
          .vp-grid::before {
            content: '';
            position: absolute;
            left: 50%;
            top: 8%;
            height: 84%;
            width: 1px;
            background: linear-gradient(
              to bottom,
              transparent,
              rgba(13,124,95,0.18) 20%,
              rgba(13,124,95,0.30) 50%,
              rgba(13,124,95,0.18) 80%,
              transparent
            );
            transform: translateX(-50%);
            pointer-events: none;
            z-index: 5;
          }
          /* Horizontal row dividers */
          .vp-cell:nth-child(n+3) {
            border-top: 1px solid rgba(13,124,95,0.08);
          }
          .vp-cell {
            padding: 18px 10px;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            gap: 10px;
          }
          /* Left column cells get a subtle warm tint */
          .vp-cell:nth-child(odd) {
            background: rgba(13,124,95,0.015);
          }
        }

        /* Desktop: unchanged horizontal layout */
        @media (min-width: 640px) {
          .vp-grid {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            justify-content: space-between;
            gap: 20px;
          }
          .vp-cell {
            display: flex;
            align-items: center;
            gap: 16px;
            flex: 1;
            min-width: 180px;
            justify-content: center;
            padding: 4px 0;
          }
        }
      `}</style>

      <section className="relative border-y border-gray-100 bg-gradient-to-r from-gray-50/80 via-white to-gray-50/80 py-6 sm:px-6 lg:px-8 overflow-hidden">
        {/* Shimmer overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(13,124,95,0.03) 25%, transparent 50%, rgba(13,124,95,0.03) 75%, transparent 100%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 8s ease-in-out infinite",
          }}
        />

        <div className="max-w-5xl mx-auto relative z-10">
          <div className="vp-grid">
            {valueProps.map(({ icon: Icon, label, desc, color }, i) => (
              <div
                key={label}
                ref={(el) => { itemRefs.current[i] = el; }}
                className={`vp-cell vp-item group cursor-pointer hover:scale-[1.02] transition-transform duration-300${
                  visible[i] ? " is-visible" : ""
                }`}
              >
                {/* Icon bubble */}
                <div className="h-10 w-10 rounded-xl bg-white border border-gray-100 shadow-sm flex items-center justify-center flex-shrink-0 group-hover:shadow-md group-hover:border-primary/20 transition-all duration-300">
                  <Icon className={`h-4.5 w-4.5 ${color}`} />
                </div>

                {/* Text */}
                <div className="sm:text-left text-center">
                  <p className="text-sm font-bold text-gray-800">{label}</p>
                  <p className="text-xs text-gray-400">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default ValuePropsBar;