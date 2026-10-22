/* Маппинг доменных значений бэкенда в UI-представление (статус-пиллы,
   отображаемое имя турнира). Держим отдельно от format.ts (тот без зависимостей
   от типов). */

import type { Registration, Role, Tournament } from "@/lib/types";
import { matchName } from "@/lib/format";

/** Шаги записи на матч - одинаковые в обоих дизайнах. */
export const JOIN_STEPS = [
  { n: 1, title: "Аккаунт", text: "Зарегистрируйся по логину и паролю — так заявка свяжется с твоим профилем." },
  { n: 2, title: "Игровой ID в профиле", text: "Игровой ID и ник из PUBG Mobile задаются один раз в профиле — по ним ведущий позовёт тебя в группу, они подставятся в заявку." },
  { n: 3, title: "Удобные даты", text: "Напиши, в какие даты можешь играть. Организатор позовёт тебя на матч." },
];

/** Статусы, которые понимает компонент StatusPill. */
export type PillStatus = "live" | "soon" | "announce" | "done" | "ok" | "no" | "wait";

/** Имя турнира для показа: «Ник vs Ник» из участников (приходят только на деталке
    GET /tournaments/{id}), иначе организаторский title, иначе бренд. На списочном
    эндпоинте /tournaments участников НЕТ → используется title. */
export function tournamentName(t: Pick<Tournament, "title" | "participants">): string {
  if (t.participants && t.participants.length >= 2) return matchName(t.participants);
  return t.title?.trim() || "Лига";
}

/** Статус турнира бэкенда (draft|upcoming|live|finished) → пилл + русская подпись. */
export function tournamentPill(status: string): { status: PillStatus; label: string } {
  switch (status) {
    case "live":
      return { status: "live", label: "В эфире" };
    case "upcoming":
      return { status: "soon", label: "Скоро" };
    case "finished":
      return { status: "done", label: "Завершён" };
    case "draft":
      return { status: "announce", label: "Анонс" };
    default:
      return { status: "announce", label: status || "—" };
  }
}

/** Подходит ли заявка под поисковый запрос (по нику, логину, игровому ID и нику, заметке). */
export function registrationMatches(r: Registration, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [r.userDisplayName, r.userLogin, r.gameId, r.gameNick, r.note]
    .some((f) => (f ?? "").toLowerCase().includes(q));
}

/** Завершён ли турнир (для архива/прошедших). */
export function isFinished(t: Pick<Tournament, "status">): boolean {
  return t.status === "finished";
}

/** Роль пользователя → бейдж (вид + подпись). */
export function roleBadge(
  role: Role | string,
): { kind: "champ" | "glad" | "org" | "boosty" | "official"; label: string } {
  switch (role) {
    case "superadmin":
      return { kind: "org", label: "Организатор" };
    default:
      return { kind: "official", label: "Игрок" };
  }
}
