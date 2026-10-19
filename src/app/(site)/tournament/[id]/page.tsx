import { SurfaceMatch } from "@/components/surface/pages/match";

export default async function TournamentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SurfaceMatch id={id} />;
}
