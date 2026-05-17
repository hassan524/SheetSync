"use client";

import { useEffect } from "react";

export function useScrollReveal() {
  useEffect(() => {
    const selectors = [
      ".scroll-reveal",
      ".scroll-reveal-scale",
      ".scroll-reveal-left",
      ".scroll-reveal-right",
    ].join(",");

    const elements = document.querySelectorAll(selectors);
    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}
