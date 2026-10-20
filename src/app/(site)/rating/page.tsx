import { SurfaceRating } from "@/components/surface/pages/rating";

export const metadata = {
  title: "Рейтинг — Лига Ultimate Royale",
  description: "Сезонная таблица лидеров 1×1, 2×2 и 3×3 лиги Ultimate Royale.",
};

export default function RatingPage() {
  return <SurfaceRating />;
}
