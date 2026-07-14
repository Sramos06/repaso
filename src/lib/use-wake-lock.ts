"use client";

import { useEffect } from "react";

// Keep the screen awake while studying (Shawn's pick: automatic, no UI).
// Feature-detected and silent: unsupported browsers just behave as before.
// The browser auto-releases on tab switch / manual lock; we re-acquire when
// the page becomes visible again.
export function useWakeLock(active: boolean): void {
  useEffect(() => {
    if (!active || !("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let stopped = false;

    async function acquire() {
      try {
        lock = await navigator.wakeLock.request("screen");
      } catch {
        /* low battery / permission — reading works fine without it */
      }
    }
    function onVisible() {
      if (!stopped && document.visibilityState === "visible") acquire();
    }

    acquire();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stopped = true;
      document.removeEventListener("visibilitychange", onVisible);
      lock?.release().catch(() => {});
    };
  }, [active]);
}
