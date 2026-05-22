"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Download, RefreshCw, X } from "lucide-react";

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
  const [isInstalling, setIsInstalling] = useState(false);
  const [updateReady, setUpdateReady] = useState<ServiceWorkerRegistration | null>(
    null,
  );

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let cancelled = false;

    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");
        if (cancelled) return;

        if (registration.waiting) {
          setUpdateReady(registration);
          setShowBanner(true);
        }

        registration.addEventListener("updatefound", () => {
          const worker = registration.installing;
          if (!worker) return;

          worker.addEventListener("statechange", () => {
            if (
              worker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              setUpdateReady(registration);
              setShowBanner(true);
            }
          });
        });
      } catch {
        // Browsers only allow service workers on HTTPS or localhost.
      }
    };

    registerServiceWorker();

    const reloadOnControllerChange = () => window.location.reload();
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      reloadOnControllerChange,
      { once: true },
    );

    return () => {
      cancelled = true;
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        reloadOnControllerChange,
      );
    };
  }, []);

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

    const handler = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setTimeout(() => setShowBanner(true), 600);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  useEffect(() => {
    const handleInstalled = () => {
      setIsStandalone(true);
      setShowBanner(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("appinstalled", handleInstalled);
    return () => window.removeEventListener("appinstalled", handleInstalled);
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    setIsInstalling(true);
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") setShowBanner(false);
      setDeferredPrompt(null);
    } finally {
      setIsInstalling(false);
    }
  }, [deferredPrompt]);

  const handleUpdate = useCallback(() => {
    updateReady?.waiting?.postMessage({ type: "SKIP_WAITING" });
    setShowBanner(false);
  }, [updateReady]);

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
          className="fixed top-0 left-0 right-0 z-50 hidden sm:flex sm:flex-col gap-1 p-3 bg-white border-b border-gray-200 shadow-sm md:hidden"
        >
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>

          <div className="flex items-start gap-2 pr-8">
            <div className="flex-shrink-0 mt-0.5">
              <Image src="/icon-192.png" alt="" width={24} height={24} priority />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">
                {updateReady ? "Update available" : "Install SheetSync"}
              </p>
              <p className="text-xs text-gray-600 mt-0.5">
                {updateReady
                  ? "Tap update to get the latest version"
                  : isIos
                    ? 'Tap Share then "Add to Home Screen"'
                    : deferredPrompt
                      ? "Add to your home screen"
                      : 'Tap menu then "Add to Home Screen"'}
              </p>
            </div>
          </div>

          <div className="flex gap-2 px-0.5">
            {updateReady ? (
              <button
                onClick={handleUpdate}
                className="flex-1 px-3 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
              >
                Update
              </button>
            ) : deferredPrompt ? (
              <button
                onClick={handleInstall}
                disabled={isInstalling}
                className="flex-1 px-3 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded transition-colors"
              >
                {isInstalling ? "Installing..." : "Install"}
              </button>
            ) : null}
            <button
              onClick={handleDismiss}
              className="px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded transition-colors"
            >
              Not now
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

