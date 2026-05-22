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
        if (!("Notification" in window)) {
          console.log("Notifications not supported in this browser");
          return;
        }

        // Ask permission only if not already granted or denied
        if (Notification.permission === "default") {
          const permission = await Notification.requestPermission();
          if (permission !== "granted") {
            console.log("Notification permission:", permission);
            return;
          }
        } else if (Notification.permission !== "granted") {
          console.log("Notifications already denied by user");
          return;
        }

        // Get messaging instance (null if not supported)
        const messaging = await getFirebaseMessaging();
        if (!messaging) {
          console.log("Firebase messaging not supported");
          return;
        }

        // Get FCM token
        const token = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_VAPID_KEY!,
        });

        if (!token) {
          console.log("Failed to get FCM token");
          return;
        }

        console.log("FCM token obtained, saving to backend");

        // Save token to backend
        const response = await fetch("/api/save-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, token }),
        });

        if (!response.ok) {
          console.error("Failed to save token:", response.status);
        }

        // Foreground notifications
        onMessage(messaging, (payload) => {
          console.log("Foreground notification received:", payload);

          const notifTitle = payload.notification?.title || "SheetSync";
          const notifBody =
            payload.notification?.body || "You have a new notification.";
          const notifUrl = payload.data?.url || "/";

          const notification = new Notification(notifTitle, {
            body: notifBody,
            icon: "/icon-192.png",
            badge: "/icon-192.png",
            tag: "sheetsync-foreground",
            data: { url: notifUrl },
          });

          // Handle notification click
          notification.onclick = () => {
            window.focus();
            window.location.href = notifUrl;
          };
        });

        console.log("Push notifications initialized successfully");
      } catch (err) {
        console.error("Push notification init error:", err);
      }
    };

    init();
  }, [userId]);
}

