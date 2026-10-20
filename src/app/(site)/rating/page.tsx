import { SurfaceRating } from "@/components/surface/pages/rating";

export const metadata = {
  title: "Рейтинг — Лига Ultimate Royale",
  description: "Сезонная таблица лидеров 1×1 и 2×2 лиги Ultimate Royale.",
};

export default function RatingPage() {
  return <SurfaceRating />;
}
