import { requireUserOrRedirect } from "@/lib/require-user";
import ViewerFrame from "@/components/ViewerFrame";

// Auth gate only. The client resolves the id from the URL against the local
// store, which is what lets offline-created reviewers open offline and lets
// the service worker serve any cached viewer page as a shell for any id.
export default async function Viewer() {
  await requireUserOrRedirect();
  return <ViewerFrame />;
}
