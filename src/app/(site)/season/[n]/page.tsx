import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSeasonRecap } from "@/lib/queries";
import { SurfaceSeason } from "@/components/surface/pages/season";

type Props = { params: Promise<{ n: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { n } = await params;
  return {
    title: `Сезон ${n} в цифрах — Лига Ultimate Royale`,
    description: `Итоги ${n} сезона по ARC Raiders: таблица, гонка за первое место, решающий матч, карты, задания и ноки.`,
  };
}

export default async function SeasonPage({ params }: Props) {
  const { n } = await params;
  if (!/^\d{1,3}$/.test(n)) notFound();
  const recap = await getSeasonRecap(n);
  if (!recap) notFound();
  return <SurfaceSeason recap={recap} no={n} />;
}
