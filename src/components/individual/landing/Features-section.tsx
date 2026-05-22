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
    <section id="features" className="py-28 sm:py-40 bg-white">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="text-center mb-24 scroll-reveal">
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-widest mb-3">
            Powerful features
          </p>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Built for Real Collaboration
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Everything you need to work together, from formulas to templates to real-time sync
          </p>
        </div>

        <div className="flex flex-col gap-32">
          {appFeatures.map((feat, index) => {
            const Icon = feat.icon;
            const isReverse = index % 2 !== 0;
            return (
              <div
                key={feat.title}
                className={`flex flex-col ${isReverse ? "lg:flex-row-reverse" : "lg:flex-row"} gap-16 items-center`}
              >
                <div
                  className={`w-full lg:w-1/2 space-y-8 ${isReverse ? "scroll-reveal-right" : "scroll-reveal-left"}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`${feat.bg} p-4 rounded-2xl`}>
                      <Icon className={`h-8 w-8 ${feat.color}`} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                        {feat.subtitle}
                      </p>
                      <h3 className="text-3xl sm:text-4xl font-bold text-gray-900">
                        {feat.title}
                      </h3>
                    </div>
                  </div>
                  <p className="text-lg text-gray-600 leading-relaxed">
                    {feat.description}
                  </p>
                  <ul className="space-y-4">
                    {feat.bullets.map((b) => (
                      <li
                        key={b}
                        className="flex items-center gap-4 text-gray-700"
                      >
                        <div
                          className={`h-6 w-6 rounded-full ${feat.bg} flex items-center justify-center flex-shrink-0`}
                        >
                          <CheckCircle2
                            className={`h-4 w-4 ${feat.color}`}
                          />
                        </div>
                        <span className="text-base font-medium">{b}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    onClick={onDemoOpen}
                    className={`gap-2 text-base px-6 py-3 h-auto border-2 ${feat.color} bg-transparent hover:opacity-80 transition-all`}
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

