import type { Metadata } from "next";
import { Fraunces, Karla, Caveat } from "next/font/google";
import SwRegister from "@/components/SwRegister";
import OfflineBanner from "@/components/OfflineBanner";
import { getUserTheme } from "@/lib/user-theme";
import "./globals.css";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-display", axes: ["opsz"] });
const karla = Karla({ subsets: ["latin"], variable: "--font-body" });
const caveat = Caveat({ subsets: ["latin"], variable: "--font-accent" });

export const metadata: Metadata = {
  title: "Repaso",
  description: "Your reviewers, kept safe.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Stamp the saved theme server-side so first paint is already correct —
  // no dark-mode flash, even on a brand-new device. Signed-out pages get warm.
  const theme = await getUserTheme();
  return (
    <html lang="en" data-theme={theme} className={`${fraunces.variable} ${karla.variable} ${caveat.variable}`}>
      {/* suppressHydrationWarning: browser extensions (Grammarly) inject body attributes pre-hydration */}
      <body suppressHydrationWarning>
        <SwRegister />
        <OfflineBanner />
        {children}
      </body>
    </html>
  );
}
