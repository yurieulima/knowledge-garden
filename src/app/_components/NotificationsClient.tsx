"use client";

import { useEffect } from "react";

export function NotificationsClient() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) return;

    if (Notification.permission === "default") {
      Notification.requestPermission().catch(() => {
        // ignore
      });
    }

    let cancelled = false;

    const checkDueNotes = async () => {
      if (cancelled) return;
      if (Notification.permission !== "granted") return;

      try {
        const res = await fetch("/api/due-notes", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { dueCount?: number };
        const dueCount = data.dueCount ?? 0;
        if (!dueCount) return;

        const todayKey = new Date().toISOString().slice(0, 10);
        const lastShown = window.localStorage.getItem(
          "kg_lastDueNotification",
        );
        if (lastShown === todayKey) return;

        new Notification("Knowledge Garden", {
          body:
            dueCount === 1
              ? "You have 1 note to revisit today."
              : `You have ${dueCount} notes to revisit today.`,
        });

        window.localStorage.setItem("kg_lastDueNotification", todayKey);
      } catch {
        // ignore network/other errors
      }
    };

    // initial check shortly after load
    const initialTimeout = window.setTimeout(checkDueNotes, 5000);
    // periodic checks (every 30 minutes)
    const interval = window.setInterval(checkDueNotes, 30 * 60 * 1000);

    return () => {
      cancelled = true;
      window.clearTimeout(initialTimeout);
      window.clearInterval(interval);
    };
  }, []);

  return null;
}

