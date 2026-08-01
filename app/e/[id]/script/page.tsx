import ScriptEditor from "@/components/ScriptEditor";

export default async function ScriptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ScriptEditor id={id} />;
}
