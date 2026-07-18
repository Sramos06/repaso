import { requireUserOrRedirect } from "@/lib/require-user";
import ContinueClient from "@/components/ContinueClient";

export default async function ContinuePage() {
  await requireUserOrRedirect();
  return <ContinueClient />;
}
