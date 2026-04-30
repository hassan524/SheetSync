"use client";
import React from "react";
import { useAuth } from "@/context/AuthContext";

const DashboardWelcome = () => {

  const { user } = useAuth();

  return (
    <section className="animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Welcome back, {user?.name}</h1>
          <p className="text-muted-foreground mt-1">
            Here&apos;s what&apos;s happening with your spreadsheets today
          </p>
        </div>
      </div>

    </section>
  );
};

export default DashboardWelcome;
