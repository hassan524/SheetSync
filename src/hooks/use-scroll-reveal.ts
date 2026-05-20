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

    const elements = Array.from(document.querySelectorAll(selectors));
    if (!elements.length) return;

    const reveal = (element: Element) => {
      element.classList.add("revealed");
    };

    if (!("IntersectionObserver" in window)) {
      elements.forEach(reveal);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            reveal(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.01, rootMargin: "0px 0px 120px 0px" },
    );

    elements.forEach((element) => {
      const rect = element.getBoundingClientRect();
      if (rect.top < window.innerHeight + 120) {
        reveal(element);
        return;
      }

      observer.observe(element);
    });

    const safetyTimer = window.setTimeout(() => {
      elements.forEach(reveal);
      observer.disconnect();
    }, 1800);

    return () => {
      window.clearTimeout(safetyTimer);
      observer.disconnect();
    };
  }, []);
}
