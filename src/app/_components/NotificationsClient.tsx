"use client";

import { useEffect } from "react";

export function NotificationsClient() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) return;

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

        // Try to infer language from cookie or browser
        let lang: "en" | "pt" = "en";
        if (typeof document !== "undefined") {
          const match = document.cookie.match(/(?:^|;\s*)kg_lang=([^;]+)/);
          if (match && (match[1] === "en" || match[1] === "pt")) {
            lang = match[1] as "en" | "pt";
          } else if (navigator.language.toLowerCase().startsWith("pt")) {
            lang = "pt";
          }
        }

        const title = "Knowledge Garden";
        const bodyEn =
          dueCount === 1
            ? "You have 1 note to revisit today."
            : `You have ${dueCount} notes to revisit today.`;
        const bodyPt =
          dueCount === 1
            ? "Você tem 1 nota para revisitar hoje."
            : `Você tem ${dueCount} notas para revisitar hoje.`;

        new Notification(title, {
          body: lang === "pt" ? bodyPt : bodyEn,
        });

        window.localStorage.setItem("kg_lastDueNotification", todayKey);
      } catch {
        // ignore network/other errors
      }
    };

    const ensurePermissionAndCheck = async () => {
      if (Notification.permission === "default") {
        try {
          const result = await Notification.requestPermission();
          if (result !== "granted") return;
        } catch {
          return;
        }
      }
      await checkDueNotes();
    };

    // initial check shortly after load
    const initialTimeout = window.setTimeout(ensurePermissionAndCheck, 5000);
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

