"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getDeskRows } from "@/lib/local-reviewers";

// The PWA "Continue studying" shortcut: jump to the most recently opened
// reviewer from the device's own record, online or not.
export default function ContinueClient() {
  const router = useRouter();
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const rows = await getDeskRows();
      if (cancelled) return;
      const recent = rows
        .filter((r) => r.lastOpenedAt && r.archivedAt === null)
        .sort((a, b) => (a.lastOpenedAt! < b.lastOpenedAt! ? 1 : -1))[0];
      router.replace(recent ? `/viewer/${recent.id}` : "/");
    })();
    return () => { cancelled = true; };
  }, [router]);
  return <p className="empty">Finding where you left off…</p>;
}
