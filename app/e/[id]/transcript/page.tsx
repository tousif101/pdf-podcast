import TranscriptView from "@/components/TranscriptView";

export default async function TranscriptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TranscriptView id={id} />;
}
