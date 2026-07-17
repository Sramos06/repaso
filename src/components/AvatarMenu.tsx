"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { signOutAction } from "@/app/actions";

export default function AvatarMenu({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  return (
    <div className="avatar-wrap" ref={wrap}>
      <button type="button" className="avatar" onClick={() => setOpen((o) => !o)} aria-label="Account menu">
        {email.charAt(0).toUpperCase()}
      </button>
      {open && (
        <div className="menu">
          <div className="who"><b>Signed in</b><span>{email}</span></div>
          <Link href="/stats" className="menu-link" onClick={() => setOpen(false)}>📊 Study stats</Link>
          <Link href="/settings" className="menu-link" onClick={() => setOpen(false)}>⚙ Settings</Link>
          <form action={signOutAction}>
            <button type="submit" className="out">Log out</button>
          </form>
        </div>
      )}
    </div>
  );
}
