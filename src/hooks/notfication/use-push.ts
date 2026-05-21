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
        // Check if notifications are supported
        if (!("Notification" in window)) return;

        // Ask permission
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;

        // Get messaging instance (null if not supported)
        const messaging = await getFirebaseMessaging();
        if (!messaging) return;

        // Get FCM token
        const token = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_VAPID_KEY!,
        });

        if (!token) return;

        // Save token to backend
        await fetch("/api/save-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, token }),
        });

        // Foreground notifications
        onMessage(messaging, (payload) => {
          console.log("Foreground notification:", payload);

          const notifTitle = payload.notification?.title || "SheetSync";
          const notifBody =
            payload.notification?.body || "You have a new notification.";
          const notifUrl = payload.data?.url || "/";

          new Notification(notifTitle, {
            body: notifBody,
            icon: "/icon-192.png",
            badge: "/icon-192.png",
            tag: "sheetsync-foreground",
            data: { url: notifUrl },
          });
        });
      } catch (err) {
        console.error("Push notification init error:", err);
      }
    };

    init();
  }, [userId]);
}

