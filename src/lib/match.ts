/* Расчёты по матчу для пульта, главной и страницы матча: стороны A/B, заходы и счёт по раундам,
   подписи стадий и превью карт. */

import { knocksLabel } from "@/lib/format";
import type { Heat, MatchStage, MatchState, Participant, RoundBonusTask, Tournament } from "@/lib/types";

/** Превью карты по коду (картинки лежат в /public/maps). */
export function mapImage(code?: string | null): string {
  return code ? `/maps/${code}.jpg` : "";
}

/** Стороны матча по порядку: A заходит в раунде первой. */
export function matchSides(st: MatchState): [Participant | null, Participant | null] {
  const parts = [...(st.tournament.participants ?? [])].sort((a, b) => a.seed - b.seed);
  return [parts[0] ?? null, parts[1] ?? null];
}

/** Заход стороны в раунде: карта, которую выбрала игра. */
export function heatOf(st: MatchState, round: number, participantId?: string | null): Heat | undefined {
  if (!participantId) return undefined;
  return (st.heats ?? []).find((h) => h.roundNumber === round && h.participantId === participantId);
}

/** Карты заходов раунда: «Эрангель · Мирамар», одна - если обе стороны играли на ней; пусто - не отмечены. */
export function roundMapsLabel(st: MatchState, round: number, sides: [Participant | null, Participant | null]): string {
  const names = sides.map((p) => heatOf(st, round, p?.id)?.map ?? "");
  if (!names[0] && !names[1]) return "";
  if (names[0] === names[1]) return names[0];
  return names.map((n) => n || "—").join(" · ");
}

/** Карта для превью раунда - первого захода, у которого она отмечена. */
export function roundMapCode(st: MatchState, round: number, sides: [Participant | null, Participant | null]): string {
  for (const p of sides) {
    const code = heatOf(st, round, p?.id)?.mapCode;
    if (code) return code;
  }
  return "";
}

/** Место в матче PUBG: «3-е место», первое - чикен. */
export function placeLabel(place?: number | null): string {
  if (!place) return "";
  return place === 1 ? "1-е место, чикен" : `${place}-е место`;
}

/** Места заходов раунда по сторонам: «места 1 · 6»; пусто - не записаны. */
export function roundPlacesLabel(st: MatchState, round: number, sides: [Participant | null, Participant | null]): string {
  const places = sides.map((p) => heatOf(st, round, p?.id)?.place ?? null);
  if (places.every((x) => !x)) return "";
  return `места ${places.map((x) => x || "—").join(" · ")}`;
}

/** Карты заходов из списка матчей «Эрангель 3 · Мирамар 1»: чаще сыгранная первой. */
export function heatMapsSummary(maps: string[]): string {
  const count = new Map<string, number>();
  for (const m of maps) if (m) count.set(m, (count.get(m) ?? 0) + 1);
  return [...count.entries()]
    .sort((x, y) => y[1] - x[1] || x[0].localeCompare(y[0], "ru"))
    .map(([m, n]) => `${m} ${n}`)
    .join(" · ");
}

export function roundScore(st: MatchState, round: number, participantId?: string | null): number {
  if (!participantId) return 0;
  return st.scores
    .filter((s) => s.roundNumber === round && s.participantId === participantId)
    .reduce((sum, s) => sum + s.points, 0);
}

export function totalScore(st: MatchState, participantId?: string | null): number {
  if (!participantId) return 0;
  return st.scores.filter((s) => s.participantId === participantId).reduce((sum, s) => sum + s.points, 0);
}

/** Велся ли счёт: у матчей, перенесённых из таблицы, известен только победитель. */
export function hasScore(st: MatchState): boolean {
  return st.tasks.length > 0 || st.scores.some((s) => s.points !== 0);
}

export function manualPoints(st: MatchState, round: number, participantId: string): number {
  return st.manual.find((s) => s.roundNumber === round && s.participantId === participantId)?.points ?? 0;
}

export function roundKnocks(st: MatchState, round: number, participantId: string): number {
  return (st.knocks ?? []).find((k) => k.roundNumber === round && k.participantId === participantId)?.knocks ?? 0;
}

/** Очки за чужое задание - столько же даёт сервер (ContractCrossPoints). */
export const CROSS_POINTS = 1;

/** Очки за килл - столько же даёт сервер (KnockPoints). */
export const KNOCK_POINTS = 3;

export interface RoundBreakdown {
  tasks: number;
  cross: number;
  knocks: number; // штук, по KNOCK_POINTS очков
  manual: number; // без очков за киллы
  legendary: number;
}

/** Из чего сложились очки стороны в раунде: свои задания, задания соперника, киллы, ручные и легендарки. */
export function roundBreakdown(st: MatchState, round: number, participantId: string): RoundBreakdown {
  const knocks = roundKnocks(st, round, participantId);
  const manual = manualPoints(st, round, participantId) - knocks * KNOCK_POINTS;
  const out: RoundBreakdown = { tasks: 0, cross: 0, knocks, manual, legendary: 0 };
  for (const t of st.tasks) {
    if (t.roundNumber !== round || t.completedBy !== participantId) continue;
    if (t.participantId === participantId) out.tasks += t.points;
    else out.cross += CROSS_POINTS;
  }
  for (const l of st.legendary) {
    if (l.roundNumber === round && l.participantId === participantId) out.legendary += l.points ?? 0;
  }
  return out;
}

/** Разбивка очков раунда словами для страницы матча: «задания +4 · 2 килла +6». */
export function breakdownParts(b: RoundBreakdown): string[] {
  return [
    b.tasks ? `задания +${b.tasks}` : "",
    b.cross ? `задания соперника +${b.cross}` : "",
    b.knocks ? `${knocksLabel(b.knocks)} +${b.knocks * KNOCK_POINTS}` : "",
    b.manual ? `ручные ${b.manual > 0 ? "+" : ""}${b.manual}` : "",
    b.legendary ? `легендарка +${b.legendary}` : "",
  ].filter(Boolean);
}

export function stageLabel(stage: MatchStage, round: number, total: number): string {
  switch (stage) {
    case "scheduled":
      return "Запланирован";
    case "ready":
      return "Матч готов";
    case "round":
      return total > 1 ? `Раунд ${round} из ${total}` : "Раунд идёт";
    case "finished":
      return "Матч завершён";
  }
}

export function isShowMatch(t: Pick<Tournament, "format">): boolean {
  return t.format === "show";
}

/** «2 раунда», «3 раунда», «1 раунд». */
export function roundsLabel(n: number): string {
  return n === 1 ? "1 раунд" : `${n} раунда`;
}

/** Задание для показа: у задания на карту описание уже начинается с локации. */
export function taskTitle(t: RoundBonusTask): string {
  return t.name || t.text;
}

export function taskDescription(t: RoundBonusTask): string {
  return t.name ? t.text : "";
}

export function taskKindLabel(t: RoundBonusTask): string {
  if (t.category === "protocol") return "Протокол";
  return t.mapCode ? "На карту" : "Задание";
}
