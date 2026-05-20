"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Building2,
  FileSpreadsheet,
  FolderPlus,
  Upload,
  Users,
} from "lucide-react";

const GUIDE_COUNT_KEY = "sheetsync-dashboard-guide-count";
const GUIDE_MAX_SHOWS = 2;

const steps = [
  {
    icon: FolderPlus,
    title: "Start with folders",
    text: "Keep personal sheets grouped by project, client, class, or anything else you work on.",
  },
  {
    icon: FileSpreadsheet,
    title: "Create or import sheets",
    text: "Use a blank sheet, pick a template, or import CSV and Excel files when you already have data.",
  },
  {
    icon: Building2,
    title: "Use organizations for teams",
    text: "Organizations are shared spaces. Invite people once, then create sheets everyone can work on.",
  },
  {
    icon: Users,
    title: "Collaborate in the sheet",
    text: "Open a sheet to edit, format, import data, share organization sheets, and keep changes saved.",
  },
  {
    icon: Upload,
    title: "Recent keeps things handy",
    text: "Imported sheets can stay outside folders at first. They still show in Recent so you can organize them later.",
  },
];

export default function FirstLoginGuide() {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const count = Number(localStorage.getItem(GUIDE_COUNT_KEY) || "0");
    if (count >= GUIDE_MAX_SHOWS) return;
    const timer = setTimeout(() => setOpen(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const current = steps[index];
  const Icon = current.icon;
  const progress = useMemo(
    () => Math.round(((index + 1) / steps.length) * 100),
    [index],
  );

  const close = () => {
    const count = Number(localStorage.getItem(GUIDE_COUNT_KEY) || "0");
    localStorage.setItem(
      GUIDE_COUNT_KEY,
      String(Math.min(count + 1, GUIDE_MAX_SHOWS)),
    );
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : close())}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-[460px] overflow-hidden p-0 rounded-xl">
        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-lg">Welcome to SheetSync</DialogTitle>
              <DialogDescription className="text-xs mt-1">
                A quick tour so the dashboard makes sense.
              </DialogDescription>
            </div>
          </div>

          <div className="mt-6 rounded-xl border bg-muted/30 p-4 min-h-[132px]">
            <div className="flex items-center gap-2 mb-3">
              <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center">
                {index + 1}
              </span>
              <h3 className="text-sm font-semibold">{current.title}</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {current.text}
            </p>
          </div>

          <div className="mt-4 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              {steps.map((step, stepIndex) => (
                <button
                  key={step.title}
                  type="button"
                  aria-label={`Show step ${stepIndex + 1}`}
                  onClick={() => setIndex(stepIndex)}
                  className={`h-2 rounded-full transition-all ${
                    stepIndex === index ? "w-5 bg-primary" : "w-2 bg-muted"
                  }`}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={close}>
                Skip
              </Button>
              <Button
                onClick={() => {
                  if (index === steps.length - 1) close();
                  else setIndex((currentIndex) => currentIndex + 1);
                }}
              >
                {index === steps.length - 1 ? "Done" : "Next"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
