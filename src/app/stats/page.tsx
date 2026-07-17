import { requireUserOrRedirect } from "@/lib/require-user";
import StatsClient from "@/components/StatsClient";

export default async function StatsPage() {
  await requireUserOrRedirect();
  return <StatsClient />;
}
