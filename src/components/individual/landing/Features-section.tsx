"use client";

import { useRef, useState, useEffect } from "react";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { appFeatures } from "@/data/landing";
import Image from "next/image";

interface FeaturesSectionProps {
  onDemoOpen: () => void;
}

/* ── Single feature row with scroll-triggered image reveal ────────────── */
function FeatureRow({
  feat,
  index,
  onDemoOpen,
}: {
  feat: (typeof appFeatures)[0];
  index: number;
  onDemoOpen: () => void;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const Icon = feat.icon;
  const isReverse = index % 2 !== 0;

  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={rowRef}
      className={`flex flex-col ${
        isReverse ? "lg:flex-row-reverse" : "lg:flex-row"
      } gap-10 lg:gap-16 items-center`}
    >
      {/* Text side */}
      <div
        className={`w-full lg:w-1/2 space-y-5 transition-all duration-700 ease-out ${
          isVisible
            ? "opacity-100 translate-x-0"
            : isReverse
            ? "opacity-0 translate-x-8"
            : "opacity-0 -translate-x-8"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`${feat.bg} p-2.5 rounded-xl`}>
            <Icon className={`h-6 w-6 ${feat.color}`} />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
              {feat.subtitle}
            </p>
            <h3 className="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight">
              {feat.title}
            </h3>
          </div>
        </div>
        <p className="text-base text-gray-500 leading-relaxed">
          {feat.description}
        </p>
        <ul className="space-y-2.5">
          {feat.bullets.map((b, i) => (
            <li
              key={b}
              className={`flex items-center gap-3 text-sm text-gray-700 transition-all duration-500 ease-out ${
                isVisible
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 translate-x-4"
              }`}
              style={{ transitionDelay: `${400 + i * 80}ms` }}
            >
              <div
                className={`h-4 w-4 rounded-full ${feat.bg} flex items-center justify-center flex-shrink-0`}
              >
                <CheckCircle2 className={`h-3 w-3 ${feat.color}`} />
              </div>
              {b}
            </li>
          ))}
        </ul>
        <Button
          onClick={onDemoOpen}
          variant="outline"
          className={`border-2 font-semibold gap-2 ${feat.color} hover:opacity-80 group`}
        >
          Learn more
          <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
        </Button>
      </div>

      {/* Image side — elevated card with gradient header */}
      <div
        className={`w-full lg:w-1/2 transition-all duration-700 ease-out ${
          isVisible
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 translate-y-8 scale-[0.97]"
        }`}
        style={{ transitionDelay: "200ms" }}
      >
        <div className="group relative w-full rounded-2xl overflow-hidden shadow-xl border border-gray-100/80 hover:shadow-2xl transition-all duration-500 bg-gray-50">
          {/* Gradient header bar */}
          <div
            className={`flex items-center gap-3 px-5 py-3 bg-gradient-to-r ${feat.gradientFrom} ${feat.gradientTo}`}
          >
            <div className="h-8 w-8 rounded-lg bg-white/15 border border-white/20 flex items-center justify-center">
              <Icon className="h-4 w-4 text-white/90" />
            </div>
            <span className="text-white/90 text-sm font-semibold truncate">
              {feat.title}
            </span>
            <div className="ml-auto flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-white/60 text-[11px] font-medium">
                Live
              </span>
            </div>
          </div>

          {/* Image */}
          <div
            className="relative w-full bg-gray-50"
            style={{ aspectRatio: "16/10" }}
          >
            <Image
              src={feat.image}
              alt={`${feat.title} — SheetSync feature`}
              fill
              className="object-cover object-top group-hover:scale-[1.02] transition-transform duration-700 ease-out"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            {/* Subtle overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </div>
        </div>
      </div>
    </div>
  );
}

const FeaturesSection = ({ onDemoOpen }: FeaturesSectionProps) => {
  return (
    <section
      id="features"
      className="py-24 sm:py-32 bg-white px-5 sm:px-6 lg:px-8"
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16 scroll-reveal">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">
            Built-in capabilities
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-gray-900 mb-4 tracking-tight">
            Everything Your Team Needs
          </h2>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">
            From live collaboration to powerful formulas — every tool built
            right in, no plugins needed.
          </p>
        </div>

        <div className="flex flex-col gap-24 sm:gap-32">
          {appFeatures.map((feat, index) => (
            <FeatureRow
              key={feat.title}
              feat={feat}
              index={index}
              onDemoOpen={onDemoOpen}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;