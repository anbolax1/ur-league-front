import { SurfacePatches } from "@/components/surface/pages/patches";

export const metadata = {
  title: "Нашивки — Лига Ultimate Royale",
  description: "Нашивки сезона: за что даются, насколько редкие и кто их носит.",
};

export default async function PatchesPage({ searchParams }: { searchParams: Promise<{ season?: string }> }) {
  const { season } = await searchParams;
  return <SurfacePatches season={season} />;
}
