"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { Menu, X, Table, ChevronRight, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "Features", id: "features" },
  { label: "How it works", id: "how-it-works" },
  { label: "What's included", id: "pricing" },
  { label: "FAQ", id: "contact" },
];

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const router = useRouter();
  const { user, loginWithGoogle } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 80;
      const top = element.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: "smooth" });
    }
    setMobileMenuOpen(false);
  };

  const handleGetStarted = async () => {
    setIsNavigating(true);
    if (user) {
      router.push("/dashboard");
      return;
    }
    const error = await loginWithGoogle();
    if (error) {
      alert("Login failed: " + error.message);
      setIsNavigating(false);
      return;
    }
    const session = await supabase.auth.getSession();
    if (session.data.session?.user) {
      router.push("/dashboard");
    } else {
      setIsNavigating(false);
    }
  };

  return (
    <>
      <nav
        className={cn(
          "sticky top-0 z-50 transition-all duration-200",
          scrolled
            ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100/80"
            : "bg-white border-b border-gray-100",
        )}
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-[60px]">
            {/* Brand */}
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="flex items-center gap-2.5 group"
            >
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                <Table className="h-4.5 w-4.5 text-primary" />
              </div>
              <span className="text-[17px] font-bold text-gray-900 tracking-tight">
                SheetSync
              </span>
            </button>

            {/* Desktop nav links */}
            <div className="hidden lg:flex items-center gap-0.5">
              {navLinks.map(({ label, id }) => (
                <button
                  key={id}
                  onClick={() => scrollToSection(id)}
                  className="px-3.5 py-2 text-[13px] font-medium text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Desktop CTA */}
            <div className="hidden lg:flex items-center gap-2.5">
              <Button
                onClick={handleGetStarted}
                disabled={isNavigating}
                size="sm"
                className="h-8 px-4 text-[13px] font-semibold gap-1.5 bg-primary hover:bg-primary/90"
              >
                {isNavigating
                  ? "Redirecting..."
                  : user
                    ? "Go to App"
                    : "Get Started Free"}
                {!isNavigating && <ChevronRight className="h-3.5 w-3.5" />}
              </Button>
            </div>

            {/* Mobile menu toggle */}
            <div className="lg:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                className="text-gray-700 hover:text-primary h-9 w-9 p-0 rounded-lg"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div
          className={cn(
            "lg:hidden overflow-hidden transition-all duration-200 ease-in-out border-t border-gray-100",
            mobileMenuOpen ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0",
          )}
        >
          <div className="bg-white px-5 pt-3 pb-5 space-y-1">
            {navLinks.map(({ label, id }) => (
              <button
                key={id}
                onClick={() => scrollToSection(id)}
                className="flex w-full items-center justify-between px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-primary hover:bg-primary/5 rounded-xl transition-colors"
              >
                {label}
                <ChevronRight className="h-4 w-4 opacity-40" />
              </button>
            ))}

            <div className="pt-3 space-y-2 border-t border-gray-100 mt-2">
              <Button
                disabled={isNavigating}
                className="w-full gap-2 font-semibold bg-primary hover:bg-primary/90"
                onClick={() => {
                  handleGetStarted();
                }}
              >
                {isNavigating
                  ? "Redirecting..."
                  : user
                    ? "Go to App"
                    : "Get Started Free"}
                {!isNavigating && <ChevronRight className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
