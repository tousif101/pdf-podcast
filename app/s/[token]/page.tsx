import type { Metadata } from "next";
import SharedEpisode from "@/components/SharedEpisode";

export const metadata: Metadata = {
  title: "A PDF Podcast episode",
  description: "Listen to this episode, made with PDF Podcast.",
};

export default async function SharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <SharedEpisode token={token} />;
}
