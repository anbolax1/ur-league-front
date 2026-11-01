/* Жетоны игроков: подписи общие для профиля, пульта и кабинета. */

import type { TokenKind } from "@/lib/types";

export const TOKEN_KINDS: TokenKind[] = ["double", "priority", "reset"];

export const TOKEN_LABEL: Record<TokenKind, string> = {
  double: "Двойной рейтинг",
  priority: "Без очереди",
  reset: "Сброс рейтинга",
};

/** Что делает жетон - одной фразой для профиля игрока. */
export const TOKEN_HINT: Record<TokenKind, string> = {
  double: "ставится на матч до старта: победа даёт вдвое больше MMR, поражение снимает вдвое больше",
  priority: "до конца игрового дня заявка стоит в пуле выше остальных",
  reset: "MMR 1×1 в сезоне снова становится стартовым; по одному жетону на каждый сезон выдаётся всем сам",
};

/** «+3 жетона», «−1 жетон». */
export function tokensWord(n: number): string {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return "жетонов";
  if (b === 1) return "жетон";
  if (b > 1 && b < 5) return "жетона";
  return "жетонов";
}
