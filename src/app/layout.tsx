import type { Metadata } from "next";
import { Fraunces, Karla, Caveat } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-display", axes: ["opsz"] });
const karla = Karla({ subsets: ["latin"], variable: "--font-body" });
const caveat = Caveat({ subsets: ["latin"], variable: "--font-accent" });

export const metadata: Metadata = {
  title: "Repaso",
  description: "Your reviewers, kept safe.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${karla.variable} ${caveat.variable}`}>
      {/* suppressHydrationWarning: browser extensions (Grammarly) inject body attributes pre-hydration */}
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
