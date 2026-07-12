"use client";

import { useEffect, useState } from "react";

export default function ShareFrame({ token }: { token: string }) {
  const [html, setHtml] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/share/${token}`)
      .then((res) => { if (!res.ok) throw new Error("gone"); return res.json(); })
      .then((data) => { if (cancelled) return; setHtml(data.htmlContent); setStatus("ready"); })
      .catch(() => { if (!cancelled) setStatus("error"); });
    return () => { cancelled = true; };
  }, [token]);

  return (
    <div className="focus">
      <div className="vdoc">
        {status === "loading" ? (
          <div className="docpage"><p>Opening…</p></div>
        ) : status === "error" ? (
          <div className="docpage"><h1>Link turned off</h1><p>This shared reviewer isn&rsquo;t available anymore.</p></div>
        ) : (
          // Same sandbox as the private viewer — allow-scripts only, no same-origin.
          <iframe className="reviewer-frame" sandbox="allow-scripts" referrerPolicy="no-referrer" srcDoc={html ?? ""} title="Shared reviewer" />
        )}
      </div>
      <a className="pill share-badge" href="/" target="_blank" rel="noopener">Kept on Repa<em>so</em> ✦</a>
    </div>
  );
}
