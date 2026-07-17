import { requireUserOrRedirect } from "@/lib/require-user";
import DeskClient from "@/components/DeskClient";

// Auth gate only: the desk renders from the device's local store and
// background-syncs with the cloud (see src/lib/sync.ts).
export default async function Library() {
  const user = await requireUserOrRedirect();
  return <DeskClient email={user.email} />;
}
