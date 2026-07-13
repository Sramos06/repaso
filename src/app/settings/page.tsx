import Link from "next/link";
import { requireUserOrRedirect } from "@/lib/require-user";
import { getUserTheme } from "@/lib/user-theme";
import { signOutAction } from "@/app/actions";
import ThemePicker from "@/components/ThemePicker";
import DataTools from "@/components/DataTools";

export default async function SettingsPage() {
  const user = await requireUserOrRedirect();
  const theme = await getUserTheme();

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
