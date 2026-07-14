import Link from "next/link";
import { db } from "@/db";
import { reviewers } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { requireUserOrRedirect } from "@/lib/require-user";
import { getUserTheme } from "@/lib/user-theme";
import { signOutAction } from "@/app/actions";
import ThemePicker from "@/components/ThemePicker";
import DataTools from "@/components/DataTools";
import StorageSection from "@/components/StorageSection";

export default async function SettingsPage() {
  const user = await requireUserOrRedirect();
  const theme = await getUserTheme();
  const rows = await db
    .select({ id: reviewers.id, title: reviewers.title, sizeBytes: reviewers.sizeBytes })
    .from(reviewers)
    .where(eq(reviewers.userId, user.id))
    .orderBy(desc(reviewers.sizeBytes));

  return (
    <div className="app settings">
      <header className="set-head">
        <Link href="/" className="set-back">← Desk</Link>
        <h1>Settings</h1>
      </header>

      <section className="set-sec">
        <h2>Appearance</h2>
        <p className="set-sub">Pick a look for Repaso. It syncs to your account, on every device.</p>
        <ThemePicker current={theme} />
      </section>

      <section className="set-sec">
        <h2>Offline storage</h2>
        <p className="set-sub">Repaso keeps a copy of every reviewer on this device so they open with no internet. These are device copies only: clearing them never touches your cloud copies.</p>
        <StorageSection reviewers={rows} />
      </section>

      <section className="set-sec">
        <h2>Your data</h2>
        <p className="set-sub">Download a backup of everything, or restore from one.</p>
        <DataTools />
      </section>

      <section className="set-sec">
        <h2>Account</h2>
        <p className="set-sub">Signed in as <b>{user.email}</b>.</p>
        <form action={signOutAction}><button type="submit" className="set-btn danger">Log out</button></form>
      </section>
    </div>
  );
}
