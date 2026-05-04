"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { Menu, X, Table, ChevronDown } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase/client";

const navLinks = [
  { label: "Features", id: "features" },
  { label: "Why Teams", id: "why-teams" },
  { label: "Pricing", id: "pricing" },
  { label: "About", id: "about" },
];

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const { user, loginWithGoogle } = useAuth();

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setMobileMenuOpen(false);
  };

  const handleGetStarted = async () => {
    if (user) {
      router.push("/dashboard");
      return;
    }
    const error = await loginWithGoogle();
    if (error) {
      alert("Login failed: " + error.message);
      return;
    }
    const session = await supabase.auth.getSession();
    if (session.data.session?.user) {
      router.push("/dashboard");
    }
  };

  return (
    <nav className="bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <Table className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold text-gray-900">SheetSync</span>
          </div>

          {/* Desktop nav links */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map(({ label, id }) => (
              <button
                key={id}
                onClick={() => scrollToSection(id)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-primary rounded-lg hover:bg-primary/5 transition-colors"
              >
                {label}
              </button>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center gap-3">
            {user && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/dashboard")}
                className="text-gray-600"
              >
                Go to Dashboard
              </Button>
            )}
            <Button onClick={handleGetStarted} size="sm" className="px-5">
              {user ? "Dashboard" : "Get Started"}
            </Button>
          </div>

          {/* Mobile menu toggle */}
          <div className="lg:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-700 hover:text-primary h-9 w-9 p-0"
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
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-100 bg-white">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map(({ label, id }) => (
              <button
                key={id}
                onClick={() => scrollToSection(id)}
                className="block w-full text-left px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
              >
                {label}
              </button>
            ))}
            <div className="pt-3 pb-1 border-t border-gray-100 mt-2">
              <Button
                className="w-full"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleGetStarted();
                }}
              >
                {user ? "Go to Dashboard" : "Get Started Free"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
