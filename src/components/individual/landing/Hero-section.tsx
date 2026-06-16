"use client";

import { Rocket, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeroSectionProps {
  onDemoOpen: () => void;
  onGetStarted: () => void;
}

function MeshGradientBG() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/80 via-emerald-50/40 to-white" />
      <div
        className="absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(0, 167, 64, 0.09) 3px, transparent 5px), linear-gradient(to bottom, rgba(0, 115, 23, 0.07) 2px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />
      <div
        className="absolute -top-[30%] -left-[10%] w-[70%] h-[70%] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(13,124,95,0.08) 0%, transparent 70%)" }}
      />
      <div
        className="absolute -top-[20%] -right-[15%] w-[60%] h-[60%] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%)" }}
      />
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse 100% 80% at 50% 30%, transparent 50%, white 90%)" }}
      />
    </div>
  );
}

const TRUST_ITEMS = [
  "No credit card needed",
  "Free plan, forever",
  "Setup in 30 seconds",
];

const HeroSection = ({ onDemoOpen, onGetStarted }: HeroSectionProps) => {
  return (
    <section className="relative overflow-hidden bg-white" style={{ paddingTop: "80px", paddingBottom: "64px" }}>
      <MeshGradientBG />

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-40px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeScale {
          from { opacity: 0; transform: scale(0.97) translateY(20px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }

        .h-line1  { animation: slideInLeft 0.75s cubic-bezier(0.22,1,0.36,1) 0.05s both; }
        .h-line2  { animation: fadeUp 0.7s ease-out 0.28s both; }
        .h-sub    { animation: fadeUp 0.7s ease-out 0.42s both; }
        .h-cta    { animation: fadeUp 0.7s ease-out 0.56s both; }
        .h-trust  { animation: fadeUp 0.7s ease-out 0.68s both; }
        .h-video  { animation: fadeScale 0.9s ease-out 0.72s both; }

        @media (prefers-reduced-motion: reduce) {
          .h-line1, .h-line2, .h-sub, .h-cta, .h-trust, .h-video {
            animation: none; opacity: 1; transform: none;
          }
        }
      `}</style>

      <div className="relative z-10 mx-auto w-full" style={{ maxWidth: "1200px", padding: "0 16px" }}>

        {/* ── Hero copy — left on mobile, center on desktop ─────────────── */}
        <div
          className="mx-auto text-left md:text-center"
          style={{ maxWidth: "860px", marginBottom: "52px" }}
        >
          {/* Line 1 — green, slides in from left */}
          <div className="h-line1">
            <span
              className="block font-bold"
              style={{
                fontSize: "clamp(2.15rem, 7vw, 4.75rem)",
                lineHeight: 1.1,
                letterSpacing: "-0.022em",
                color: "#0d7c5f",
              }}
            >
              Effortless spreadsheets
            </span>
          </div>

          {/* Line 2 — dark, fades up */}
          <div className="h-line2" style={{ marginBottom: "20px" }}>
            <span
              className="block font-bold text-gray-900"
              style={{
                fontSize: "clamp(2.15rem, 7vw, 4.75rem)",
                lineHeight: 1.1,
                letterSpacing: "-0.022em",
              }}
            >
              packed with powerful features
            </span>
          </div>

          {/* Subheading */}
          <p
            className="h-sub text-gray-500 font-normal md:mx-auto"
            style={{
              fontSize: "clamp(1rem, 2.2vw, 1.2rem)",
              lineHeight: 1.7,
              maxWidth: "540px",
              marginBottom: "36px",
            }}
          >
            Live co-editing, 100+ formulas, smart templates, and full
            import/export — one workspace ready the moment you open it.
          </p>

          {/* CTA */}
          <div className="h-cta cursor-pointer flex justify-start md:justify-center" style={{ marginBottom: "28px" }}>
            <Button
              onClick={onGetStarted}
              className="text-white font-semibold rounded-2xl transition-all duration-300 group"
              style={{
                background: "#0d7c5f",
                padding: "16px 36px",
                fontSize: "16px",
                height: "auto",
                width: "100%",
                maxWidth: "320px",
                boxShadow: "0 6px 24px rgba(13,124,95,0.28)",
              }}
            >
              <Rocket
                className="group-hover:rotate-12 transition-transform"
                style={{ marginRight: "10px", width: "20px", height: "20px" }}
              />
              Get Started Free
              <ArrowRight
                className="group-hover:translate-x-0.5 transition-transform"
                style={{ marginLeft: "10px", width: "16px", height: "16px" }}
              />
            </Button>
          </div>

          {/* Trust pills — 2-col on mobile, row on desktop */}
          <div className="h-trust">
            <div
              className="sm:flex sm:flex-row sm:flex-wrap sm:gap-x-8 sm:gap-y-2 sm:justify-start justify-items-center"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px 12px",
              }}
            >
              {/* {TRUST_ITEMS.map((t) => (
                <span
                  key={t}
                  className="flex items-center justify-start md:justify-center gap-2"
                  style={{ color: "#6b7280", fontSize: "13px" }}
                >
                  <span
                    style={{
                      width: "18px", height: "18px", flexShrink: 0,
                      borderRadius: "50%",
                      background: "rgba(13,124,95,0.1)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <Check style={{ width: "10px", height: "10px", color: "#0d7c5f" }} />
                  </span>
                  {t}
                </span>
              ))} */}
            </div>
          </div>
        </div>

        {/* ── Video — simple, big, no browser chrome ──────────────────────── */}
        <div className="h-video cursor-pointer relative mx-auto" style={{ maxWidth: "1200px" }}>
          {/* Soft glow */}
          <div
            style={{
              position: "absolute",
              inset: "-40px",
              zIndex: -1,
              borderRadius: "48px",
              opacity: 0.4,
              filter: "blur(72px)",
              background: "linear-gradient(135deg, rgba(13,124,95,0.22) 0%, rgba(16,185,129,0.15) 60%, rgba(20,184,166,0.08) 100%)",
            }}
          />

          <div
            style={{
              borderRadius: "16px",
              overflow: "hidden",
              boxShadow: "0 20px 60px rgba(0,0,0,0.12), 0 0 0 1px rgba(13,124,95,0.18)",
              background: "#000",
              aspectRatio: "16/9",
              width: "100%",
            }}
          >
            <video
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              controls
              controlsList="nodownload noremoteplayback"
              disablePictureInPicture
              poster="/video-poster.png"
            >
              <source src="/demo-video.mp4" type="video/mp4" />
            </video>
          </div>
        </div>

      </div>
    </section>
  );
};

export default HeroSection;