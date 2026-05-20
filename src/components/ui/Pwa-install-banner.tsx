"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "sheetsync-pwa-dismiss-session";

export function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);
    if (standalone) return;

    if (sessionStorage.getItem(DISMISS_KEY)) return;

    const ua = navigator.userAgent;
    const isIosDevice =
      (/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    setIsIos(isIosDevice);

    if (isIosDevice) {
      const timer = setTimeout(() => setShowBanner(true), 1200);
      return () => clearTimeout(timer);
    }

    let promptReceived = false;
    const handler = (event: Event) => {
      event.preventDefault();
      promptReceived = true;
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setTimeout(() => setShowBanner(true), 600);
    };

    window.addEventListener("beforeinstallprompt", handler);

    const fallbackTimer = setTimeout(() => {
      if (!promptReceived) setShowBanner(true);
    }, 1200);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      clearTimeout(fallbackTimer);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setShowBanner(false);
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setShowBanner(false);
    sessionStorage.setItem(DISMISS_KEY, "true");
  }, []);

  if (isStandalone) return null;

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="pwa-install-banner"
        >
          <button
            onClick={handleDismiss}
            className="pwa-install-close"
            aria-label="Dismiss install banner"
          >
            <X size={16} />
          </button>

          <div className="pwa-install-icon">
            <Image src="/icon-192.png" alt="" width={28} height={28} priority />
          </div>

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
              <p className="pwa-install-desc">Add the app to your device.</p>
            ) : (
              <p className="pwa-install-desc">
                Open browser menu and tap{" "}
                <span style={{ fontWeight: 600 }}>
                  &quot;Add to Home Screen&quot;
                </span>
                .
              </p>
            )}
          </div>

          {!isIos && (
            <button
              onClick={deferredPrompt ? handleInstall : handleDismiss}
              className="pwa-install-btn"
            >
              <Download size={16} />
              {deferredPrompt ? "Install" : "Got it"}
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
