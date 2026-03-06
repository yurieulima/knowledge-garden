"use client";

import { useEffect } from "react";

interface FormHotkeysProps {
  formId: string;
}

export function FormHotkeys({ formId }: FormHotkeysProps) {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const isMac = navigator.platform.toLowerCase().includes("mac");
      const meta = isMac ? event.metaKey : event.ctrlKey;
      if (!meta) return;

      if (event.key === "s" || event.key === "Enter") {
        event.preventDefault();
        const form = document.getElementById(formId) as HTMLFormElement | null;
        if (form) {
          form.requestSubmit();
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("keydown", handler);
    };
  }, [formId]);

  return null;
}

