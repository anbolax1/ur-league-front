import { SurfaceTeam } from "@/components/surface/pages/team";

export default async function TeamPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  return <SurfaceTeam teamKey={key} />;
}
