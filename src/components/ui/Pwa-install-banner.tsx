"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "sheetsync-pwa-dismiss";
const DISMISS_DAYS = 7;

export function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Already installed as PWA
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);
    if (standalone) return;

    // Check dismiss timestamp
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt) {
      const dismissDate = new Date(dismissedAt);
      const daysSince =
        (Date.now() - dismissDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince < DISMISS_DAYS) return;
    }

    // Detect iOS / iPadOS (no beforeinstallprompt support)
    const ua = navigator.userAgent;
    const isIosDevice =
      (/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    setIsIos(isIosDevice);

    if (isIosDevice) {
      // Show banner after a short delay on iOS
      const timer = setTimeout(() => setShowBanner(true), 3000);
      return () => clearTimeout(timer);
    }

    // Chrome/Edge/Samsung — listen for the native install prompt
    let promptReceived = false;
    const handler = (e: Event) => {
      e.preventDefault();
      promptReceived = true;
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShowBanner(true), 2000);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Fallback: if on mobile and no prompt received within 5s, show generic banner
    const isMobile = /Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua) ||
      (window.innerWidth <= 768 && "ontouchstart" in window);

    let fallbackTimer: ReturnType<typeof setTimeout> | undefined;
    if (isMobile) {
      fallbackTimer = setTimeout(() => {
        if (!promptReceived) {
          setShowBanner(true);
        }
      }, 5000);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      if (fallbackTimer) clearTimeout(fallbackTimer);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setShowBanner(false);
    localStorage.setItem(DISMISS_KEY, new Date().toISOString());
  }, []);

  // Don't render anything if already installed
  if (isStandalone) return null;

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="pwa-install-banner"
        >
          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="pwa-install-close"
            aria-label="Dismiss install banner"
          >
            <X size={16} />
          </button>

          {/* Icon */}
          <div className="pwa-install-icon">
            <Smartphone size={24} />
          </div>

          {/* Content */}
          <div className="pwa-install-content">
            <h3 className="pwa-install-title">Install SheetSync</h3>
            {isIos ? (
              <p className="pwa-install-desc">
                Tap <span style={{ fontWeight: 600 }}>Share</span> then{" "}
                <span style={{ fontWeight: 600 }}>
                  &quot;Add to Home Screen&quot;
                </span>
              </p>
            ) : deferredPrompt ? (
              <p className="pwa-install-desc">
                Add to your home screen for quick access — works offline too.
              </p>
            ) : (
              <p className="pwa-install-desc">
                Open browser menu and tap{" "}
                <span style={{ fontWeight: 600 }}>&quot;Add to Home Screen&quot;</span> for quick access.
              </p>
            )}
          </div>

          {/* Install button (only when native prompt available) */}
          {!isIos && deferredPrompt && (
            <button onClick={handleInstall} className="pwa-install-btn">
              <Download size={16} />
              Install
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
