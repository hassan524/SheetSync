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

    // Detect iOS (no beforeinstallprompt support)
    const isIosDevice =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIos(isIosDevice);

    if (isIosDevice) {
      // Show banner after a short delay on iOS
      const timer = setTimeout(() => setShowBanner(true), 3000);
      return () => clearTimeout(timer);
    }

    // Chrome/Edge/Samsung — listen for the native install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show banner after a short delay
      setTimeout(() => setShowBanner(true), 2000);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
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
            ) : (
              <p className="pwa-install-desc">
                Add to your home screen for quick access — works offline too.
              </p>
            )}
          </div>

          {/* Install button (non-iOS only) */}
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
