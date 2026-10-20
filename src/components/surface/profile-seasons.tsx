"use client";

import * as React from "react";
import Link from "next/link";
import { seasonStats } from "@/lib/mmr-stats";
import { mapImage } from "@/lib/match";
import { fmtAverage, pluralKnocks } from "@/lib/format";
import type { KnockStats, MapStat, MmrPoint, MmrStats, OpponentStat, PatchCode, PlayerPatch, PlayerProfile, Season, SeasonAnalytics } from "@/lib/types";
import { ProfileChart, type ChartSegment } from "@/components/surface/profile-chart";
import { ProfilePatches } from "@/components/surface/profile-patches";
import { firstProfileSeason } from "@/components/surface/profile-season";
import { fullDate, heatsWord, matchesWord } from "@/components/surface/fmt";

/** Вкладка «все сезоны»: id сезона таким не бывает. */
const ALL = "*";

const norm = (s: string) => s.toLowerCase().replace(/ё/g, "е").trim();

/** Сводка по картам, соперникам и киллам за несколько сезонов: одинаковые записи складываются. */
export function mergeAnalytics(list: SeasonAnalytics[]): SeasonAnalytics {
  const maps = new Map<string, MapStat>();
  const opps = new Map<string, OpponentStat>();
  const knocks: KnockStats = { heats: 0, knocks: 0, best: 0 };
  for (const a of list) {
    if (a.knocks) {
      knocks.heats += a.knocks.heats;
      knocks.knocks += a.knocks.knocks;
      // сезоны идут по порядку: при равенстве рекордом остаётся первый
      if (a.knocks.best > knocks.best) {
        knocks.best = a.knocks.best;
        knocks.bestMatch = a.knocks.bestMatch;
        knocks.bestOpponent = a.knocks.bestOpponent;
        knocks.bestMap = a.knocks.bestMap;
      }
    }
    for (const m of a.maps) {
      const k = norm(m.map);
      const cur = maps.get(k);
      if (!cur) maps.set(k, { ...m });
      else {
        // среднее место - по всем заходам с местом
        const placed = cur.placed + m.placed;
        cur.avgPlace = placed ? (cur.avgPlace * cur.placed + m.avgPlace * m.placed) / placed : 0;
        cur.placed = placed;
        cur.heats += m.heats;
        cur.knocks += m.knocks;
        cur.chickens += m.chickens;
      }
    }
    for (const o of a.opponents) {
      const k = o.login || o.teamKey || norm(o.name);
      const cur = opps.get(k);
      if (!cur) opps.set(k, { ...o });
      else {
        cur.games += o.games;
        cur.wins += o.wins;
        cur.losses += o.losses;
      }
    }
  }
  return {
    maps: [...maps.values()].sort((x, y) => y.heats - x.heats),
    opponents: [...opps.values()].sort((x, y) => y.games - x.games),
    knocks,
  };
}

/** Киллы игрока по сыгранным заходам. */
function Knocks({ k, all }: { k: KnockStats; all: boolean }) {
  return (
    <div className="pf-knocks">
      <h3 className="sf-h-mid">киллы</h3>
      <dl className="sf-stats">
        <div>
          <dt>Киллов</dt>
          <dd>{k.knocks}</dd>
          <dd className="pf-sub">{all ? "за все сезоны" : "за сезон"}</dd>
        </div>
        <div>
          <dt>В среднем за заход</dt>
          <dd>{fmtAverage(k.knocks, k.heats)}</dd>
          <dd className="pf-sub">
            {k.heats} {heatsWord(k.heats)}
          </dd>
        </div>
        <div>
          <dt>Рекорд за заход</dt>
          <dd>{k.best}</dd>
          <dd className="pf-sub">
            {k.bestMatch ? (
              <Link href={`/tournament/${k.bestMatch}`}>
                {k.bestMap ? `${k.bestMap}, ` : ""}против {k.bestOpponent}
              </Link>
            ) : (
              "киллов пока не было"
            )}
          </dd>
        </div>
      </dl>
    </div>
  );
}

interface Tab {
  id: string;
  label: string;
}

/** Рейтинг игрока по сезонам: вкладки сезонов, сводка, график MMR, карты и соперники. */
export function ProfileSeasons({
  profile,
  seasons,
  maps,
}: {
  profile: PlayerProfile;
  seasons: Season[];
  maps: Array<{ code: string; name: string }>;
}) {
  const { mmr1x1, timeline1x1, analytics1x1, mmrSolo } = profile;

  // Сезоны в порядке матчей: у каждого свой отрезок графика.
  const groups = React.useMemo(() => {
    const m = new Map<string, MmrPoint[]>();
    for (const p of timeline1x1) {
      const key = p.season ?? "";
      m.set(key, [...(m.get(key) ?? []), p]);
    }
    return m;
  }, [timeline1x1]);

  const active = seasons.find((s) => s.status === "active");
  const withMatches = seasons.filter((s) => groups.has(s.id)).sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  const offSeason = groups.has("");
  const tabs: Tab[] = [
    ...withMatches.map((s) => ({ id: s.id, label: s.id === active?.id ? `${s.name} · идёт` : s.name })),
    ...(offSeason ? [{ id: "", label: "Вне сезонов" }] : []),
  ];
  if (tabs.length > 1) tabs.push({ id: ALL, label: "Все сезоны" });

  const [sel, setSel] = React.useState(() => firstProfileSeason(timeline1x1, seasons)?.id ?? tabs[0]?.id ?? ALL);

  const seasonOf = (key: string) => seasons.find((s) => s.id === key);
  const labelOf = (key: string) => seasonOf(key)?.name ?? "Вне сезонов";
  const startOf = (key: string) => seasonOf(key)?.startMmr ?? 1000;

  let segments: ChartSegment[];
  let stats: MmrStats;
  let analytics: SeasonAnalytics | undefined;
  let current: boolean;
  if (sel === ALL) {
    const keys = [...groups.keys()].sort((a, b) => (groups.get(a)![0]?.date ?? "").localeCompare(groups.get(b)![0]?.date ?? ""));
    segments = keys.map((k) => ({ label: labelOf(k), start: startOf(k), points: groups.get(k)! }));
    const all = keys.flatMap((k) => groups.get(k)!);
    stats = { ...seasonStats(all, 1000), currentMmr: mmrSolo, place: mmr1x1.place };
    analytics = mergeAnalytics(keys.map((k) => analytics1x1?.[k]).filter((a): a is SeasonAnalytics => !!a));
    current = true;
  } else {
    const points = groups.get(sel) ?? [];
    const start = startOf(sel);
    segments = [{ label: labelOf(sel), start, points }];
    current = seasonOf(sel)?.status === "active";
    const base = seasonStats(points, start);
    stats = current ? { ...base, currentMmr: mmr1x1.currentMmr, place: mmr1x1.place } : base;
    analytics = analytics1x1?.[sel];
  }

  const mapInfo = (name: string) => maps.find((m) => norm(m.name) === norm(name));
  const mapName = (name: string) => mapInfo(name)?.name ?? name;

  // Нашивки - за сезон; во «всех сезонах» - коллекция: высшая ступень и в скольких сезонах получена.
  const patchSeasons = profile.patches1x1 ?? {};
  let patchItems: PlayerPatch[] = [];
  let patchPlayers = 0;
  let held: Partial<Record<PatchCode, number>> | undefined;
  if (sel === ALL) {
    const merged = new Map<PatchCode, PlayerPatch>();
    held = {};
    for (const s of [...seasons].sort((a, b) => a.startedAt.localeCompare(b.startedAt))) {
      for (const it of patchSeasons[s.id]?.items ?? []) {
        if (it.provisional) continue;
        held[it.code] = (held[it.code] ?? 0) + 1;
        const cur = merged.get(it.code);
        if (!cur || it.tier >= cur.tier) merged.set(it.code, it);
      }
    }
    patchItems = [...merged.values()];
    patchPlayers = patchSeasons[active?.id ?? ""]?.players ?? 0;
  } else {
    patchItems = patchSeasons[sel]?.items ?? [];
    patchPlayers = patchSeasons[sel]?.players ?? 0;
  }
  // лучшая карта - где больше киллов за заход, при равных - где больше заходов
  const bestMap = [...(analytics?.maps ?? [])]
    .filter((m) => m.knocks > 0)
    .sort((a, b) => b.knocks / b.heats - a.knocks / a.heats || b.heats - a.heats)[0];
  const cardSeason = sel === ALL ? active : seasonOf(sel);

  const streak =
    stats.currentStreakLen > 0 && stats.currentStreakKind
      ? { v: stats.currentStreakLen, s: stats.currentStreakKind === "win" ? "побед подряд" : "поражений подряд" }
      : { v: 0, s: "нет серии" };

  return (
    <div className="pf-seasons">
      <div className="sf-sec-head pf-head">
        <div>
          <p className="sf-eyebrow">Рейтинг 1×1 · MMR начинается заново каждый сезон</p>
          <h2 className="sf-h-mid">рейтинг по сезонам</h2>
        </div>
        {tabs.length > 1 && (
          <div className="sf-seg pf-tabs" role="tablist" aria-label="Сезон">
            {tabs.map((t) => (
              <button key={t.id || "off"} type="button" role="tab" aria-selected={sel === t.id} onClick={() => setSel(t.id)}>
                {t.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <dl className="sf-stats">
        <div>
          <dt>{current ? "MMR сейчас" : "MMR в конце"}</dt>
          <dd>{stats.currentMmr}</dd>
          <dd className="pf-sub">{current ? (stats.place > 0 ? `#${stats.place} в таблице` : "вне рейтинга") : "итог сезона"}</dd>
        </div>
        <div>
          <dt>Пик MMR</dt>
          <dd>{stats.peakMmr}</dd>
          <dd className="pf-sub">{sel === ALL ? "за все сезоны" : "максимум сезона"}</dd>
        </div>
        <div>
          <dt>Винрейт</dt>
          <dd>
            {stats.winrate}
            <small>%</small>
          </dd>
          <dd className="pf-sub">
            {stats.wins}–{stats.losses}
          </dd>
        </div>
        <div>
          <dt>Матчей</dt>
          <dd>{stats.games}</dd>
          <dd className="pf-sub">{stats.firstMatch ? `с ${fullDate(stats.firstMatch)}` : "—"}</dd>
        </div>
        <div>
          <dt>{current ? "Серия сейчас" : "Лучшая серия"}</dt>
          <dd>{current ? streak.v || "—" : stats.bestWinStreak}</dd>
          <dd className="pf-sub">{current ? streak.s : `побед подряд · худшая ${stats.bestLossStreak}`}</dd>
        </div>
      </dl>

      <ChartLegend corrections={segments.some((s) => s.points.some((p) => p.correction))} />
      <ProfileChart key={sel} segments={segments} />

      {analytics?.knocks?.heats ? <Knocks k={analytics.knocks} all={sel === ALL} /> : null}

      {sel !== "" && (
        <ProfilePatches
          user={{ name: profile.user.displayName || profile.user.login, login: profile.user.login, avatarUrl: profile.user.avatarUrl || undefined }}
          season={cardSeason}
          seasonLabel={sel === ALL ? "Все сезоны" : labelOf(sel)}
          items={patchItems}
          players={patchPlayers}
          active={current}
          seasonsHeld={held}
          stats={{
            mmr: stats.currentMmr,
            place: current ? stats.place : 0,
            wins: stats.wins,
            losses: stats.losses,
            peak: stats.peakMmr,
            bestStreak: stats.bestWinStreak,
            games: stats.games,
            knocks: analytics?.knocks?.knocks ?? 0,
            bestMap: bestMap ? mapName(bestMap.map) : "",
          }}
          mapName={mapName}
        />
      )}

      <MapsAndRivals mapStats={analytics?.maps ?? []} opponents={analytics?.opponents ?? []} maps={maps} />
    </div>
  );
}

/** Легенда графика MMR. */
export function ChartLegend({ corrections }: { corrections: boolean }) {
  return (
    <div className="pf-legend" aria-hidden>
      <span>
        <i className="w" /> победа
      </span>
      <span>
        <i className="l" /> поражение
      </span>
      {corrections && (
        <span>
          <i className="c" /> сверка рейтинга
        </span>
      )}
      <span>
        <i className="st" /> старт сезона
      </span>
      <span className="pf-legend-hint">наведи на точку — детали матча</span>
    </div>
  );
}

/** Карты и соперники: заходы, киллы и места на каждой карте, победы и поражения против каждого соперника. */
export function MapsAndRivals({
  mapStats,
  opponents,
  maps,
}: {
  mapStats: MapStat[];
  opponents: OpponentStat[];
  maps: Array<{ code: string; name: string }>;
}) {
  const mapInfo = (name: string) => maps.find((m) => norm(m.name) === norm(name));
  return (
    <div className="sf-prof-cols">
      <div>
        <h3 className="sf-h-mid">карты</h3>
        {mapStats.length ? (
          <ul className="sf-maps-list">
            {mapStats.map((m) => {
              const info = mapInfo(m.map);
              return (
                <li key={m.map}>
                  {info ? (
                    // eslint-disable-next-line @next/next/no-img-element -- превью карты
                    <img src={mapImage(info.code)} alt="" loading="lazy" />
                  ) : (
                    <span className="pf-noimg" aria-hidden />
                  )}
                  <div>
                    <b>{info?.name ?? m.map}</b>
                    <small>
                      {m.heats} {heatsWord(m.heats)} · {m.knocks} {pluralKnocks(m.knocks)}
                      {m.placed ? ` · место ${fmtAverage(m.avgPlace * m.placed, m.placed)}` : ""}
                      {m.chickens ? ` · чикенов ${m.chickens}` : ""}
                    </small>
                  </div>
                  <span className="sc">
                    {fmtAverage(m.knocks, m.heats)}
                    <small>за заход</small>
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="sf-note">Нет данных по картам.</p>
        )}
        <p className="pf-hint">У каждого захода своя карта. Справа - киллов за заход, место - среднее по экрану итогов.</p>
      </div>
      <div>
        <h3 className="sf-h-mid">соперники</h3>
        {opponents.length ? (
          <ul className="sf-hist">
            {opponents.map((o, i) => {
              const href = o.login ? `/profile/${o.login}` : o.teamKey ? `/teams/${encodeURIComponent(o.teamKey)}` : "";
              const body = (
                <>
                  <span className={`sf-res ${o.wins >= o.losses ? "w" : "l"}`}>
                    {o.wins}–{o.losses}
                  </span>
                  <span>
                    <b>{o.name || "—"}</b>
                    <small>
                      {o.games} {matchesWord(o.games)}
                    </small>
                  </span>
                  <span />
                </>
              );
              return <li key={(o.login || o.teamKey || o.name) + i}>{href ? <Link href={href}>{body}</Link> : <div>{body}</div>}</li>;
            })}
          </ul>
        ) : (
          <p className="sf-note">Соперники появятся после первых матчей.</p>
        )}
      </div>
    </div>
  );
}
