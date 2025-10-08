'use client'

import Navigation from "@/components/Navigation";
import HeroSection from "@/components/HeroSection";
import WhyTeamsSection from "@/components/WhyTeamsSection";
import AboutSection from "@/components/AboutSection";
import FAQSection from "@/components/FAQSection";
import Footer from "@/components/Footer";
import MbFeaturesSection from "@/components/MbFeaturesSection";
import FeaturesSection from "@/components/FeaturesSection";

export default function Home() {
  return (
    <div className="bg-white">
      <Navigation />
      <HeroSection />
      <WhyTeamsSection />

      <div className="hidden lg:block">
        <FeaturesSection />
      </div>

      <div className="block lg:hidden">
        <MbFeaturesSection />
      </div>

      <AboutSection />
      <FAQSection />
      <Footer />
    </div>
  );
}
