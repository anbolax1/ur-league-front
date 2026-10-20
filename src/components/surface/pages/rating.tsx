import { getLeaderboard, getSeasons, getTeamLeaderboard } from "@/lib/queries";
import { RatingBoard } from "@/components/surface/rating-board";
import "./rating.css";

/** Рейтинг: по умолчанию - активный сезон. */
export async function SurfaceRating() {
  const [seasons, solo, duo, trio] = await Promise.all([getSeasons(), getLeaderboard("1x1"), getTeamLeaderboard("2x2"), getTeamLeaderboard("3x3")]);
  return <RatingBoard seasons={seasons} initialSolo={solo} initialTeams={{ "2x2": duo, "3x3": trio }} />;
}
