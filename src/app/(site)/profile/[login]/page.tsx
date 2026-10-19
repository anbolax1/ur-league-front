import { SurfaceProfile } from "@/components/surface/pages/profile";

export default async function PlayerProfilePage({ params }: { params: Promise<{ login: string }> }) {
  const { login } = await params;
  return <SurfaceProfile login={login} />;
}
