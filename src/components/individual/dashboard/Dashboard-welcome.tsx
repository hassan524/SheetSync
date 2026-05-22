"use client";
import React from "react";
import { useAuth } from "@/context/AuthContext";
import { TrendingUp, Sparkles } from "lucide-react";

const DashboardWelcome = () => {
  const { user } = useAuth();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <section className="animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Left: greeting */}
        <div className="space-y-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {today}
          </p>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight">
            {getGreeting()},{" "}
            <span className="text-primary">
              {user?.name?.split(" ")[0] ?? "there"}
            </span>{" "}
            👋
          </h1>
          <p className="text-sm text-muted-foreground max-w-md">
            Here&apos;s your workspace overview — sheets, collaborators, and recent activity.
          </p>
        </div>

        {/* Right: status pill */}
        <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-xl px-4 py-2.5 shrink-0 w-fit">
          <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <TrendingUp className="h-3.5 w-3.5 text-primary" />
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground leading-tight">Workspace Active</p>
            <p className="text-[11px] text-muted-foreground">All systems running</p>
          </div>
          <Sparkles className="h-3.5 w-3.5 text-primary ml-0.5" />
        </div>
      </div>
    </section>
  );
};

export default DashboardWelcome;

