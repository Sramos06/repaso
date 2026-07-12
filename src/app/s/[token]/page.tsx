import ShareFrame from "@/components/ShareFrame";

export default async function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <ShareFrame token={token} />;
}
