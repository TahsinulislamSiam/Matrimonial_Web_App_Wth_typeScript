"use client";

import { useEffect } from "react";

export function RegisterServiceWorker() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* offline support is best-effort */
      });
    };
    window.addEventListener("load", register);
    return () => window.removeEventListener("load", register);
  }, []);
  return null;
}

export function OnlineStatus() {
  return null;
}
