"use client";

import { useEffect } from "react";
import { getToken, onMessage } from "firebase/messaging";
import { getFirebaseMessaging } from "@/lib/firebase/firebase";

export function usePush(userId?: string) {
  useEffect(() => {
    if (!userId) return;
    if (typeof window === "undefined") return;

    const init = async () => {
      try {
        if (!("Notification" in window)) return;

        if (!("serviceWorker" in navigator)) return;

        const permission =
          Notification.permission === "default"
            ? await Notification.requestPermission()
            : Notification.permission;
        if (permission !== "granted") return;

        const messaging = await getFirebaseMessaging();
        if (!messaging) return;

        const registration = await navigator.serviceWorker.register(
          "/firebase-messaging-sw.js",
        );

        const token = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_VAPID_KEY!,
          serviceWorkerRegistration: registration,
        });

        if (!token) return;

        await fetch("/api/save-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, token }),
        });

        const unsubscribe = onMessage(messaging, (payload) => {
          const notifTitle = payload.notification?.title || "SheetSync";
          const notifBody =
            payload.notification?.body || "You have a new notification.";
          const notifUrl = payload.data?.url || "/";

          const notification = new Notification(notifTitle, {
            body: notifBody,
            icon: "/icon.png",
            badge: "/icon.png",
            tag: "sheetsync-foreground",
            data: { url: notifUrl },
          });
          notification.onclick = () => {
            window.focus();
            window.location.href = notifUrl;
            notification.close();
          };
        });

        return unsubscribe;
      } catch (err) {
        console.error("Push notification init error:", err);
      }
    };

    let unsubscribe: (() => void) | undefined;
    init().then((cleanup) => {
      unsubscribe = cleanup;
    });
    return () => unsubscribe?.();
  }, [userId]);
}
