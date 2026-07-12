"use client";

import { useEffect, useState } from "react";

// App-wide banner: appears only when the browser reports it's offline.
export default function OfflineBanner() {
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const sync = () => setOffline(!navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);
  if (!offline) return null;
  return <div className="offline-banner">Offline — showing your saved reviewers</div>;
}
