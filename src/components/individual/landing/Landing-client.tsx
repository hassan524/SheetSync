"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase/client";
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
  const router = useRouter();
  const { user, loading, loginWithGoogle } = useAuth();
  const [demoOpen, setDemoOpen] = useState(false);
  useScrollReveal(!loading && !user);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [loading, router, user]);

  const handleGetStarted = async () => {
    if (user) {
      router.push("/dashboard");
      return;
    }
    const error = await loginWithGoogle();
    if (error) return;
    const session = await supabase.auth.getSession();
    if (session.data.session?.user) router.push("/dashboard");
  };

  if (loading || user) return null;

  return (
    <div className="bg-white overflow-x-hidden">
      <Navigation />
      <DemoModal open={demoOpen} onClose={() => setDemoOpen(false)} />
      <HeroSection
        onDemoOpen={() => setDemoOpen(true)}
        onGetStarted={handleGetStarted}
      />
      <ValuePropsBar />
      <FeaturesSection onDemoOpen={() => setDemoOpen(true)} />
      <HowItWorksSection onGetStarted={handleGetStarted} />
      <WhatsIncludedSection />
      <FeatureTilesSection />
      <CtaBannerSection
        onDemoOpen={() => setDemoOpen(true)}
        onGetStarted={handleGetStarted}
      />
      <FaqSection />
      <FooterSection />
    </div>
  );
};

export default LandingClient;

