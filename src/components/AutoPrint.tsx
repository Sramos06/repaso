"use client";

import { useEffect } from "react";

// Opens the print dialog once the sheet has painted (small delay lets fonts settle).
export default function AutoPrint() {
  useEffect(() => {
    const t = setTimeout(() => window.print(), 300);
    return () => clearTimeout(t);
  }, []);
  return null;
}
