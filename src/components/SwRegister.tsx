"use client";

import { useEffect } from "react";

// Dev builds skip the SW: HMR + a caching worker is a debugging trap.
export default function SwRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  return null;
}
