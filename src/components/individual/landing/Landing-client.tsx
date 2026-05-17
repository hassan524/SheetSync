"use client";

import { useState } from "react";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import Navigation from "@/components/Navigation";
import DemoModal from "./Demo-modal";
import HeroSection from "./Hero-section";
import ValuePropsBar from "./Value-props-bar";
import FeaturesSection from "./Features-section";
import HowItWorksSection from "./How-it-works-section";
import WhatsIncludedSection from "./Whats-included-section";
import FeatureTilesSection from "./Feature-tiles-section";
import CtaBannerSection from "./Cta-banner-section";
import FaqSection from "./Faq-section";
import FooterSection from "./Footer-section";

const LandingClient = () => {
  const [demoOpen, setDemoOpen] = useState(false);
  useScrollReveal();

  return (
    <div className="bg-white">
      <Navigation />
      <DemoModal open={demoOpen} onClose={() => setDemoOpen(false)} />
      <HeroSection onDemoOpen={() => setDemoOpen(true)} />
      <ValuePropsBar />
      <FeaturesSection onDemoOpen={() => setDemoOpen(true)} />
      <HowItWorksSection />
      <WhatsIncludedSection />
      <FeatureTilesSection />
      <CtaBannerSection onDemoOpen={() => setDemoOpen(true)} />
      <FaqSection />
      <FooterSection />
    </div>
  );
};

export default LandingClient;
