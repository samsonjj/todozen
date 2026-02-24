"use client";

import { useEffect } from "react";
import { checkAndFireLocalNotifications } from "@/lib/services/notification-scheduler";

const CHECK_INTERVAL_MS = 60_000; // 1 minute

export function SWRegistrar() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("SW registered:", reg.scope);
        })
        .catch((err) => {
          console.error("SW registration failed:", err);
        });
    }

    // Periodic local notification check while app is open
    const interval = setInterval(() => {
      checkAndFireLocalNotifications().catch(console.error);
    }, CHECK_INTERVAL_MS);

    // Also check immediately on mount
    checkAndFireLocalNotifications().catch(console.error);

    return () => clearInterval(interval);
  }, []);

  return null;
}
