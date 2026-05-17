"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle2, Play } from "lucide-react";
import { appFeatures } from "@/data/landing";
import FeatureVideo from "./Feature-video";

interface FeaturesSectionProps {
  onDemoOpen: () => void;
}

const FeaturesSection = ({ onDemoOpen }: FeaturesSectionProps) => {
  return (
    <section id="features" className="py-24 sm:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="text-center mb-20 scroll-reveal">
          <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">
            Built-in capabilities
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-5">
            Everything Your Team Needs
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            From live collaboration to powerful formulas — every tool built
            right in, no plugins needed.
          </p>
        </div>

        <div className="flex flex-col gap-24 sm:gap-32">
          {appFeatures.map((feat, index) => {
            const Icon = feat.icon;
            const isReverse = index % 2 !== 0;
            return (
              <div
                key={feat.title}
                className={`flex flex-col ${isReverse ? "lg:flex-row-reverse" : "lg:flex-row"} gap-10 lg:gap-20 items-center`}
              >
                <div
                  className={`w-full lg:w-1/2 space-y-6 ${isReverse ? "scroll-reveal-right" : "scroll-reveal-left"}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`${feat.bg} p-3 rounded-xl`}>
                      <Icon className={`h-7 w-7 ${feat.color}`} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                        {feat.subtitle}
                      </p>
                      <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-0.5">
                        {feat.title}
                      </h3>
                    </div>
                  </div>
                  <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                    {feat.description}
                  </p>
                  <ul className="space-y-3">
                    {feat.bullets.map((b) => (
                      <li
                        key={b}
                        className="flex items-center gap-3 text-gray-700"
                      >
                        <div
                          className={`h-5 w-5 rounded-full ${feat.bg} flex items-center justify-center flex-shrink-0`}
                        >
                          <CheckCircle2
                            className={`h-3.5 w-3.5 ${feat.color}`}
                          />
                        </div>
                        <span className="text-sm sm:text-base">{b}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    onClick={onDemoOpen}
                    variant="outline"
                    className={`border-2 font-semibold gap-2 ${feat.color} hover:opacity-80`}
                  >
                    <Play className="h-4 w-4" fill="currentColor" />
                    See it in action
                  </Button>
                </div>

                <div
                  className={`w-full lg:w-1/2 ${isReverse ? "scroll-reveal-left" : "scroll-reveal-right"}`}
                >
                  <FeatureVideo
                    title={feat.title}
                    gradientFrom={feat.gradientFrom}
                    gradientTo={feat.gradientTo}
                    icon={Icon}
                    onPlay={onDemoOpen}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
