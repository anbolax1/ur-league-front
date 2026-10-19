import { SurfaceClaim } from "@/components/surface/pages/auth";

export const metadata = { title: "Активация аккаунта — Лига Ultimate Royale" };

export default async function ClaimPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <SurfaceClaim token={token} />;
}
