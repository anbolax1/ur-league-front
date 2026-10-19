import { SurfaceNews } from "@/components/surface/pages/news";

export const metadata = {
  title: "Новости — Лига Ultimate Royale",
  description: "Новости лиги по ARC Raiders: сезоны, шоу-матчи и анонсы эфиров.",
};

export default async function NewsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page } = await searchParams;
  return <SurfaceNews page={Math.max(1, Math.floor(Number(page)) || 1)} />;
}
