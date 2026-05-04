"use client";

import { useRouter } from "next/navigation";
import { RefObject } from "react";

export function useSheetTransition() {
  const router = useRouter();

  const openSheet = (
    id: string,
    templateId: string,
    cardRef: RefObject<HTMLElement | null>,
    isOrganization: boolean = false,
  ) => {
    const el = cardRef.current;

    const url = isOrganization
      ? `/sheet/${id}?template=${templateId}&org=true`
      : `/sheet/${id}?template=${templateId}`;

    if (!el) {
      router.push(url);
      return;
    }

    const overlay = document.createElement("div");
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      background: #ffffff;
      z-index: 9999;
      pointer-events: all;
      opacity: 0;
      transition: opacity 0.18s ease;
    `;

    const bar = document.createElement("div");
    bar.style.cssText = `
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 2px;
      background: transparent;
    `;
    const barFill = document.createElement("div");
    barFill.style.cssText = `
      height: 100%;
      width: 0%;
      background: #16a34a;
      box-shadow: 0 0 10px rgba(22,163,74,0.4);
      transition: width 0.25s ease-out;
    `;
    bar.appendChild(barFill);
    overlay.appendChild(bar);
    document.body.appendChild(overlay);

    requestAnimationFrame(() => {
      overlay.style.opacity = "1";

      setTimeout(() => {
        barFill.style.width = "25%";
      }, 50);

      setTimeout(() => {
        barFill.style.transition = "width 3s cubic-bezier(0.1, 0.02, 0, 1)";
        barFill.style.width = "80%";
      }, 300);

      router.push(url);
    });

    const removeOverlay = () => {
      barFill.style.transition = "width 0.12s ease-out";
      barFill.style.width = "100%";
      setTimeout(() => {
        overlay.style.transition = "opacity 0.2s ease";
        overlay.style.opacity = "0";
        setTimeout(() => overlay.remove(), 200);
      }, 120);
    };

    const fallback = setTimeout(removeOverlay, 6000);

    const handler = () => {
      clearTimeout(fallback);
      window.removeEventListener("__sheet-ready", handler);
      removeOverlay();
    };
    window.addEventListener("__sheet-ready", handler);
  };

  return { openSheet };
}