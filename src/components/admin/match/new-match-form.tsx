"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, ApiError, errorText } from "@/lib/api";
import { initials } from "@/lib/format";
import { isTeamMode, modeLabel, roundsLabel, teamSize } from "@/lib/match";
import { Panel } from "@/components/ui/card";
import { DateTimePicker, toMskInput } from "@/components/admin/date-time-picker";
import { PlayerPicker } from "@/components/admin/match/player-picker";
import {
  MAX_PRIZE,
  PreviewImage,
  PreviewPicker,
  putShowPreview,
  useChosenPreview,
} from "@/components/admin/match/show-preview";
import type { Belt, MatchFormat, MatchPlayer, MatchState, Registration, TournamentMode, User } from "@/lib/types";
import { holderName } from "@/components/surface/belt-lib";


/** Кто станет стороной A (заходит в раунде первой), как решит сервер: меньше MMR, при равном - меньше матчей
    в прошлых сезонах; при полном равенстве сервер бросит жребий, здесь стороны остаются в порядке выбора. */
function orderSides(a: MatchPlayer, b: MatchPlayer): { sides: [MatchPlayer, MatchPlayer]; why: "mmr" | "games" | "coin" } {
  if (a.mmr !== b.mmr) return { sides: a.mmr < b.mmr ? [a, b] : [b, a], why: "mmr" };
  if (a.prevGames !== b.prevGames) return { sides: a.prevGames < b.prevGames ? [a, b] : [b, a], why: "games" };
  return { sides: [a, b], why: "coin" };
}

/** Подсказки у карточек сторон: почему A заходит первой. */
const SIDE_HINTS = {
  mmr: ["заходит первым: меньше MMR", "больше MMR"],
  games: ["MMR равный, меньше матчей в прошлых сезонах", "больше матчей в прошлых сезонах"],
  coin: ["MMR и опыт равны — стороны решит жребий", "MMR и опыт равны — стороны решит жребий"],
} as const;

/** Что новый матч сделает с поясом лиги - подсказка организатору до создания матча. */
function beltNote(belt: Belt | null, a: MatchPlayer, b: MatchPlayer, show: boolean): string {
  if (!belt?.reigns.length) return "";
  const ids = [a.id, b.id];
  const holder = belt.holder && ids.includes(belt.holder.userId) ? belt.holder : null;
  if (show) return holder ? "Шоу-матч пояс лиги не разыгрывает" : "";
  if (holder) {
    const other = holder.userId === a.id ? b : a;
    return `Матч за пояс лиги: победит ${other.displayName || other.login} — заберёт пояс, ничья оставит его у ${holderName(holder)}`;
  }
  const leaders = belt.leaders ?? [];
  if (!belt.holder && (!leaders.length || leaders.some((l) => ids.includes(l.userId)))) return "Матч разыграет ничейный пояс лиги: победитель заберёт его";
  return "";
}

function SideCard({
  title,
  hint,
  player,
  tone,
  applicant,
  beltBadge,
  onClear,
  children,
}: {
  title: string;
  hint: string;
  player: MatchPlayer | null;
  tone: "primary" | "cyan";
  applicant: boolean;
  /** Игрок держит пояс лиги. */
  beltBadge?: string;
  onClear: () => void;
  children: React.ReactNode;
}) {
  const avatar =
    tone === "primary"
      ? "bg-[image:var(--grad-warm)] text-[#150800]"
      : "bg-[var(--accent)] text-[#06232a]";
  return (
    <Panel className="min-w-0 flex-1 space-y-3 overflow-visible p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 className="font-display text-lg uppercase">{title}</h3>
        <span className="text-xs text-muted">{hint}</span>
      </div>
      {player ? (
        <div className="flex flex-wrap items-center gap-4">
          <span
            className={`flex h-14 w-14 flex-none items-center justify-center font-display text-lg ${avatar} [clip-path:polygon(14%_0,100%_0,86%_100%,0_100%)]`}
          >
            {initials(player.displayName || player.login)}
          </span>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="truncate font-display text-xl uppercase">{player.displayName || player.login}</div>
            <div className="text-sm text-muted">
              MMR {player.mmr} · {player.isNew ? "новичок сезона" : `${player.wins}–${player.losses} в сезоне`}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {applicant && <span className="badge badge-org"><span>Из заявки</span></span>}
              {player.isPlaceholder && <span className="badge badge-official"><span>Без входа</span></span>}
              {beltBadge && <span className="badge badge-champ"><span>{beltBadge}</span></span>}
            </div>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClear}>
            <span>Сменить</span>
          </button>
        </div>
      ) : (
        children
      )}
    </Panel>
  );
}

interface TeamDraft {
  members: MatchPlayer[];
  name: string;
}

const NO_TEAMS: [TeamDraft, TeamDraft] = [
  { members: [], name: "" },
  { members: [], name: "" },
];

const MAX_TEAM_NAME = 32; // как ник в игре

const rosterName = (t: TeamDraft) => t.members.map((p) => p.displayName || p.login).join(" & ");

/** Состав стороны 2×2 или 3×3: название и игроки; пока мест хватает - поиск следующего игрока. */
function TeamCard({
  title,
  tone,
  size,
  team,
  applicants,
  onName,
  onRemove,
  children,
}: {
  title: string;
  tone: "primary" | "cyan";
  size: number;
  team: TeamDraft;
  applicants: Set<string>;
  onName: (name: string) => void;
  onRemove: (id: string) => void;
  children: React.ReactNode;
}) {
  const avatar = tone === "primary" ? "bg-[image:var(--grad-warm)] text-[#150800]" : "bg-[var(--accent)] text-[#06232a]";
  return (
    <Panel className="min-w-0 flex-1 space-y-3 overflow-visible p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 className="font-display text-lg uppercase">{title}</h3>
        <span className="text-xs text-muted">
          игроков {team.members.length} из {size}
        </span>
      </div>
      <label className="block space-y-1.5">
        <span className="field-label">Название команды</span>
        <input
          className="input"
          maxLength={MAX_TEAM_NAME}
          placeholder={rosterName(team) || "Пусто — ники игроков через «&»"}
          value={team.name}
          onChange={(e) => onName(e.target.value)}
        />
      </label>
      {team.members.length > 0 && (
        <ul className="space-y-2">
          {team.members.map((p) => (
            <li key={p.id} className="flex items-center gap-3">
              <span
                className={`flex h-10 w-10 flex-none items-center justify-center font-display ${avatar} [clip-path:polygon(14%_0,100%_0,86%_100%,0_100%)]`}
              >
                {initials(p.displayName || p.login)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate font-display uppercase">{p.displayName || p.login}</div>
                <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
                  <span>MMR 1×1 {p.mmr}</span>
                  {applicants.has(p.id) && <span className="badge badge-org"><span>Из заявки</span></span>}
                  {p.isPlaceholder && <span className="badge badge-official"><span>Без входа</span></span>}
                </div>
              </div>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => onRemove(p.id)}>
                <span>Убрать</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {team.members.length < size && children}
    </Panel>
  );
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Завтра в 20:00 по МСК - в формате DateTimePicker. */
function defaultShowTime(): string {
  const tomorrow = toMskInput(new Date(Date.now() + DAY_MS).toISOString());
  return `${tomorrow.slice(0, 10)}T20:00`;
}

/** Новый матч: стороны, раунды и ×2 - и сразу в пульт; шоу-матч - в расписание на дату. */
export function NewMatchForm({ liveMatchId = "", belt = null }: { liveMatchId?: string; belt?: Belt | null }) {
  const router = useRouter();
  const [format, setFormat] = React.useState<MatchFormat>(liveMatchId ? "show" : "match");
  const [startsAt, setStartsAt] = React.useState(defaultShowTime);
  const [players, setPlayers] = React.useState<MatchPlayer[]>([]);
  const [pool, setPool] = React.useState<Registration[]>([]);
  const [mode, setMode] = React.useState<TournamentMode>("1x1");
  const [first, setFirst] = React.useState<MatchPlayer | null>(null);
  const [second, setSecond] = React.useState<MatchPlayer | null>(null);
  const [teams, setTeams] = React.useState<[TeamDraft, TeamDraft]>(NO_TEAMS);
  const [mult, setMult] = React.useState(1);
  const [rounds, setRounds] = React.useState<2 | 3>(2);
  const [prize, setPrize] = React.useState("");
  const [preview, choosePreview] = useChosenPreview();
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState("");
  const [liveId, setLiveId] = React.useState("");
  // Шоу-матч создан, а превью не загрузилось: повторное создание дало бы второй такой же матч.
  const [createdId, setCreatedId] = React.useState("");

  React.useEffect(() => {
    api.get<MatchPlayer[]>("/match-players").then(setPlayers).catch(() => setErr("Не удалось загрузить игроков."));
    api.get<Registration[]>("/registrations/pool").then(setPool).catch(() => setPool([]));
  }, []);

  const applicants = React.useMemo(() => new Set(pool.map((r) => r.userId)), [pool]);
  const order = first && second ? orderSides(first, second) : null;
  const [sideA, sideB] = order ? order.sides : [first, second];
  const hints = SIDE_HINTS[order?.why ?? "mmr"];

  const team = isTeamMode(mode);
  const size = teamSize(mode);
  const chosen = React.useMemo(() => new Set(teams.flatMap((t) => t.members.map((p) => p.id))), [teams]);
  const teamsReady = teams.every((t) => t.members.length === size);
  const ready = team ? teamsReady : !!sideA && !!sideB;

  const setTeam = (i: number, f: (t: TeamDraft) => TeamDraft) => setTeams((ts) => [i === 0 ? f(ts[0]) : ts[0], i === 1 ? f(ts[1]) : ts[1]]);
  const addMember = (i: number, p: MatchPlayer) =>
    setTeam(i, (t) => (t.members.length < size && !t.members.some((x) => x.id === p.id) ? { ...t, members: [...t.members, p] } : t));
  const pickMode = (m: TournamentMode) => {
    setMode(m);
    setTeams((ts) => [
      { ...ts[0], members: ts[0].members.slice(0, teamSize(m)) },
      { ...ts[1], members: ts[1].members.slice(0, teamSize(m)) },
    ]);
  };

  const put = (p: MatchPlayer) => {
    if (team) {
      const i = teams.findIndex((t) => t.members.length < size);
      if (i >= 0) addMember(i, p);
    } else if (!first) setFirst(p);
    else if (!second) setSecond(p);
  };

  const createPlayer = async (nick: string, slot: "first" | "second" | 0 | 1) => {
    setBusy(true);
    setErr("");
    try {
      const u = await api.post<User>("/players/placeholder", { nickname: nick });
      const existing = players.find((p) => p.id === u.id);
      const p: MatchPlayer = existing ?? {
        id: u.id,
        login: u.login,
        displayName: u.displayName,
        mmr: players.find((x) => x.isNew)?.mmr ?? 1000,
        wins: 0,
        losses: 0,
        isNew: true,
        isPlaceholder: true,
        prevGames: 0,
      };
      if (!existing) setPlayers((xs) => [...xs, p]);
      if (slot === "first") setFirst(p);
      else if (slot === "second") setSecond(p);
      else addMember(slot, p);
    } catch (e) {
      setErr(errorText(e, "Не удалось создать игрока."));
    } finally {
      setBusy(false);
    }
  };

  const show = format === "show";
  const roundCount = show ? 3 : rounds;
  const create = async () => {
    if (!ready) return;
    if (show && !startsAt) {
      setErr("Укажите дату и время шоу-матча.");
      return;
    }
    setBusy(true);
    setErr("");
    setLiveId("");
    try {
      const st = await api.post<MatchState>("/matches", {
        mode,
        ratingMultiplier: mult,
        format,
        rounds: roundCount,
        startsAt: show ? `${startsAt}:00+03:00` : undefined,
        prize: show ? prize.trim() : undefined,
        sides: team
          ? teams.map((t) => ({ members: t.members.map((p) => p.id), name: t.name.trim() }))
          : [{ userId: sideA?.id }, { userId: sideB?.id }],
      });
      if (show && preview) {
        try {
          await putShowPreview(st.tournament.id, preview.src);
        } catch (e) {
          setCreatedId(st.tournament.id);
          setErr(`Шоу-матч создан, но превью не загрузилось (${errorText(e)}). Загрузите его в пульте матча.`);
          setBusy(false);
          return;
        }
      }
      router.push(`/admin/matches/${st.tournament.id}`);
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        try {
          const j = JSON.parse(e.body) as { matchId?: string };
          if (j.matchId) setLiveId(j.matchId);
        } catch {
          /* тело без id - покажем только текст */
        }
      }
      setErr(errorText(e, "Не удалось создать матч."));
      setBusy(false);
    }
  };

  const freePool = pool.filter((r) => (team ? !chosen.has(r.userId) : r.userId !== first?.id && r.userId !== second?.id));
  const slotsFree = team ? !teamsReady : !first || !second;
  const holder = belt?.holder ? players.find((p) => p.id === belt.holder?.userId) : undefined;
  const holderBadge = belt?.holder ? `Носитель пояса${belt.defenses ? ` · ★${belt.defenses}` : ""}` : "";
  const badgeFor = (p: MatchPlayer | null) => (p && p.id === belt?.holder?.userId ? holderBadge : undefined);
  const note = !team && sideA && sideB ? beltNote(belt, sideA, sideB, show) : "";

  return (
    <div className="space-y-4">
      <Panel className="flex flex-wrap items-end gap-x-8 gap-y-4 p-5">
        <div className="space-y-1.5">
          <span className="field-label">Формат</span>
          <div className="seg">
            <button
              type="button"
              className={`seg-btn ${liveMatchId ? "opacity-50" : ""}`}
              aria-pressed={!show}
              disabled={!!liveMatchId}
              title={liveMatchId ? "Сначала завершите текущий матч" : "Матч начнётся сразу"}
              onClick={() => setFormat("match")}
            >
              <span>Матч</span>
            </button>
            <button type="button" className="seg-btn" aria-pressed={show} onClick={() => setFormat("show")}>
              <span>Шоу-матч</span>
            </button>
          </div>
        </div>
        {show && (
          <div className="w-60 space-y-1.5">
            <span className="field-label">Начало (МСК)</span>
            <DateTimePicker value={startsAt} onChange={setStartsAt} />
          </div>
        )}
        <div className="space-y-1.5">
          <span className="field-label">Режим</span>
          <div className="seg">
            {(["1x1", "2x2", "3x3"] as const).map((m) => (
              <button key={m} type="button" className="seg-btn" aria-pressed={mode === m} onClick={() => pickMode(m)}>
                <span>{modeLabel(m)}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          <span className="field-label">Раунды</span>
          <div className="seg">
            {([2, 3] as const).map((n) => (
              <button
                key={n}
                type="button"
                className={`seg-btn ${show && n === 2 ? "opacity-50" : ""}`}
                aria-pressed={roundCount === n}
                disabled={show && n === 2}
                title={show ? "У шоу-матча всегда три раунда" : n === 3 ? "Три раунда, как в шоу-матче" : undefined}
                onClick={() => setRounds(n)}
              >
                <span>{n}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          <span className="field-label">Рейтинг</span>
          <div className="seg">
            {[1, 2].map((m) => (
              <button key={m} type="button" className="seg-btn" aria-pressed={mult === m} onClick={() => setMult(m)}>
                <span>×{m}</span>
              </button>
            ))}
          </div>
        </div>
      </Panel>

      {show && (
        <Panel className="grid gap-5 p-5 lg:grid-cols-2">
          <div className="space-y-4">
            <h3 className="font-display text-lg uppercase">Анонс на главной</h3>
            <label className="block space-y-1.5">
              <span className="field-label">Приз</span>
              <input
                className="input"
                maxLength={MAX_PRIZE}
                placeholder="Например: 5000 ₽ и роль в Discord"
                value={prize}
                onChange={(e) => setPrize(e.target.value)}
              />
              <span className="block text-xs text-muted">Необязательно. Покажем крупно в анонсе.</span>
            </label>
            <div className="space-y-1.5">
              <span className="field-label">Превью</span>
              {preview ? (
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm text-muted">{"file" in preview.src ? preview.src.file.name : "Картинка по ссылке"}</span>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => choosePreview(null)}>
                    <span>Выбрать другую</span>
                  </button>
                </div>
              ) : (
                <PreviewPicker onPick={choosePreview} />
              )}
            </div>
          </div>
          {preview ? (
            <PreviewImage src={preview.shown} />
          ) : (
            <div className="flex aspect-video items-center justify-center rounded-md border border-dashed border-[var(--border-strong)] px-4 text-center text-sm text-muted">
              Здесь будет картинка анонса
            </div>
          )}
        </Panel>
      )}

      {team ? (
        <div className="flex flex-col gap-4 lg:flex-row">
          {teams.map((t, i) => (
            <TeamCard
              key={i}
              title={`Состав ${i + 1}`}
              tone={i === 0 ? "primary" : "cyan"}
              size={size}
              team={t}
              applicants={applicants}
              onName={(name) => setTeam(i, (x) => ({ ...x, name }))}
              onRemove={(id) => setTeam(i, (x) => ({ ...x, members: x.members.filter((p) => p.id !== id) }))}
            >
              <PlayerPicker
                inputId={`team-${i}`}
                players={players}
                applicants={applicants}
                hide={chosen}
                busy={busy}
                onPick={(p) => addMember(i, p)}
                onCreate={(nick) => createPlayer(nick, i === 0 ? 0 : 1)}
              />
            </TeamCard>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4 lg:flex-row">
          <SideCard
            title="Игрок A"
            hint={hints[0]}
            player={sideA}
            tone="primary"
            applicant={!!sideA && applicants.has(sideA.id)}
            beltBadge={badgeFor(sideA)}
            onClear={() => (sideA === first ? setFirst(null) : setSecond(null))}
          >
            <PlayerPicker
              inputId="side-a"
              players={players}
              applicants={applicants}
              exclude={second?.id ?? first?.id}
              busy={busy}
              onPick={put}
              onCreate={(nick) => createPlayer(nick, first ? "second" : "first")}
            />
          </SideCard>
          <SideCard
            title="Игрок B"
            hint={hints[1]}
            player={sideB}
            tone="cyan"
            applicant={!!sideB && applicants.has(sideB.id)}
            beltBadge={badgeFor(sideB)}
            onClear={() => (sideB === second ? setSecond(null) : setFirst(null))}
          >
            <PlayerPicker
              inputId="side-b"
              players={players}
              applicants={applicants}
              exclude={first?.id ?? second?.id}
              busy={busy}
              onPick={put}
              onCreate={(nick) => createPlayer(nick, first ? "second" : "first")}
            />
          </SideCard>
        </div>
      )}

      {!show && !team && belt && holder && (!first || !second) && first?.id !== holder.id && second?.id !== holder.id && (
        <Panel className="flex flex-wrap items-center gap-2 p-4">
          <span className="field-label mr-1">Пояс</span>
          <button type="button" className="chip transition hover:brightness-125" onClick={() => put(holder)}>
            <span>Носитель: {holder.displayName || holder.login}</span>
            <span className="font-normal text-muted">
              ржавчина {belt.rust} из {belt.rustLimit}
            </span>
          </button>
          <span className="text-xs text-muted">нажмите — носитель встанет в свободный слот</span>
        </Panel>
      )}

      {freePool.length > 0 && slotsFree && (
        <Panel className="flex flex-wrap items-center gap-2 p-4">
          <span className="field-label mr-1">Заявки</span>
          {freePool.map((r) => {
            const p = players.find((x) => x.id === r.userId);
            if (!p) return null;
            return (
              <button key={r.id} type="button" className="chip transition hover:brightness-125" onClick={() => put(p)}>
                <span>{r.userDisplayName || r.userLogin}</span>
                {r.note && <span className="font-normal text-muted">{r.note}</span>}
              </button>
            );
          })}
          <span className="text-xs text-muted">нажмите — игрок встанет в свободный слот</span>
        </Panel>
      )}

      <Panel glow className="flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="min-w-0 space-y-1">
          <div className="font-display text-xl uppercase">
            {team
              ? teamsReady
                ? `${teams[0].name.trim() || rosterName(teams[0])} vs ${teams[1].name.trim() || rosterName(teams[1])}`
                : `Соберите оба состава по ${size} игрока`
              : sideA && sideB
                ? `${sideA.displayName || sideA.login} vs ${sideB.displayName || sideB.login}`
                : "Выберите обоих игроков"}
          </div>
          <div className="text-sm text-muted">
            {show ? "Шоу-матч · " : ""}
            {modeLabel(mode)} · {roundsLabel(roundCount)} · рейтинг ×{mult}
            {show && prize.trim() ? ` · приз: ${prize.trim()}` : ""}
          </div>
          <div className="text-xs text-muted">
            {show
              ? "Появится в расписании; начать его можно из пульта, когда придёт время"
              : team
                ? "Первым заходит состав с меньшим MMR — решится при создании, матч сразу станет текущим"
                : "Название соберётся из ников, матч сразу станет текущим"}
          </div>
          {note && <div className="text-xs text-gold">{note}</div>}
        </div>
        <button type="button" className="btn btn-primary" disabled={!ready || busy || !!createdId} onClick={create}>
          <span>{busy ? "Создаём…" : show ? "Запланировать шоу-матч →" : "Создать и перейти в пульт →"}</span>
        </button>
      </Panel>

      {err && (
        <p className="text-sm text-danger">
          {err}{" "}
          {liveId && (
            <Link href={`/admin/matches/${liveId}`} className="text-accent underline">
              Открыть текущий матч
            </Link>
          )}
          {createdId && (
            <Link href={`/admin/matches/${createdId}`} className="text-accent underline">
              Открыть пульт шоу-матча
            </Link>
          )}
        </p>
      )}
    </div>
  );
}
