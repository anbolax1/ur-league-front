import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getNewsItem } from "@/lib/queries";
import { SurfaceNewsItem } from "@/components/surface/pages/news";
import { newsExcerpt } from "@/components/surface/news-text";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const n = await getNewsItem(id);
  if (!n) return { title: "Новость не найдена — Лига Ultimate Royale" };
  return { title: `${n.title} — Лига Ultimate Royale`, description: newsExcerpt(n.body, 160) || undefined };
}

export default async function NewsItemPage({ params }: Props) {
  const { id } = await params;
  const n = await getNewsItem(id);
  if (!n) notFound();
  return <SurfaceNewsItem n={n} />;
}
