import Link from "next/link";
import type { ReactNode } from "react";
import "./season.css";
import type { RecapMatch, SeasonRecap } from "@/lib/types";
import { mapImage } from "@/lib/match";
import { SurfaceMissing } from "@/components/surface/missing";
import { CountUp } from "@/components/surface/motion";
import { SecHead, signed } from "@/components/surface/ui";
import { hhmm } from "@/components/surface/fmt";
import { SeasonProvider, SeasonTable, SeasonYou } from "@/components/surface/season-client";
import { SeasonRace } from "@/components/surface/season-race";
import {
  dLong,
  dShort,
  dayTime,
  elo,
  f1,
  leadDays,
  mapNames,
  nameSize,
  pc,
  pl,
  plural,
  roundMaps,
  sides,
  W_CHICKEN,
  W_DAY,
  W_HEAT,
  W_HEAT_GEN,
  W_KNOCK,
  W_LOSS,
  W_MATCH,
  W_PLAYER,
  W_ROUND,
  W_WIN,
  type Forms,
} from "@/components/surface/season-lib";

const W_TIMES: Forms = ["раз", "раза", "раз"];
const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const WEEKDAYS_IN = ["понедельник", "вторник", "среду", "четверг", "пятницу", "субботу", "воскресенье"];
// Корзины разницы в счёте: самые близкие матчи - отдельно.
const MARGINS: Array<[string, number, number]> = [
  ["0–1", 0, 1],
  ["2–3", 2, 3],
  ["4–5", 4, 5],
  ["6–9", 6, 9],
  ["10–19", 10, 19],
  ["20+", 20, Infinity],
];

type Tone = "sf-night" | "sf-paper";
interface Part {
  id: string;
  nav?: string;
  render: (tone: Tone) => ReactNode;
}

const nameOf = (r: SeasonRecap, i: number) => r.players[i]?.login ?? "?";
const winnerName = (r: SeasonRecap, m: RecapMatch) => nameOf(r, m.p[sides(m)[0]]);
const loserName = (r: SeasonRecap, m: RecapMatch) => nameOf(r, m.p[sides(m)[1]]);

function Sec({ id, tone, eyebrow, title, lead, children }: { id: string; tone: Tone; eyebrow: string; title: string; lead?: ReactNode; children: ReactNode }) {
  return (
    <section className={`sf-sec ${tone} sn-sec`} id={id} aria-labelledby={`${id}-t`}>
      <div className="sf-wrap">
        <SecHead eyebrow={eyebrow} title={title} id={`${id}-t`} action={lead ? <p className="sf-lead sn-lead">{lead}</p> : undefined} />
        {children}
      </div>
    </section>
  );
}

function Hero({ recap, no, nav }: { recap: SeasonRecap; no: string; nav: Array<[string, string]> }) {
  const S = recap.summary;
  const champ = recap.players[0];
  const days = recap.days.length;
  const changes = Math.max(0, recap.leaders.length - 1);
  const leadersN = new Set(recap.leaders.map((l) => l.player)).size;
  const d = recap.matches[recap.decisive];
  const lastDay = recap.days[days - 1]?.date;
  const decidedLast = d && lastDay && new Date(d.at).toLocaleDateString("sv-SE", { timeZone: "Europe/Moscow" }) === lastDay;
  const year = S.last ? new Date(S.last).getFullYear() : "";
  const titles = champ ? champ.tags.filter((t) => /чемпион/i.test(t)) : [];
  return (
    <section className="sf-hero sf-night sn-hero" id="top">
      <div className="sf-hero-bg" style={{ backgroundImage: `url(${mapImage("erangel")})` }} aria-hidden />
      <div className="sf-wrap sf-hero-grid">
        <div>
          <p className="sf-eyebrow">
            Лига Ultimate Royale{S.first && S.last ? ` · ${dLong(S.first)} – ${dLong(S.last)} ${year}` : ""}
          </p>
          <h1>
            <span className="ln">
              <span>сезон {no}</span>
            </span>
            <span className="ln">
              <span>{recap.live ? "в цифрах" : "итоги"}</span>
            </span>
          </h1>
          <p className="sf-lead">
            За <b>{pl(days, W_DAY)}</b> сыграно <b>{pl(S.matches, W_MATCH)}</b> 1×1, в них вышли <b>{pl(S.players, W_PLAYER)}</b>.
            {changes > 0 && (
              <>
                {" "}
                Первое место переходило из рук в руки <b>{pl(changes, W_TIMES)}</b>
                {decidedLast ? ", а судьбу сезона решил последний день." : "."}
              </>
            )}
          </p>
          <nav className="sn-toc" aria-label="Разделы итогов">
            {nav.map(([id, label]) => (
              <a key={id} href={`#${id}`}>
                {label}
              </a>
            ))}
          </nav>
        </div>
        {champ && (
          <article className="sn-champ" aria-label={recap.live ? "Лидер сезона" : "Чемпион сезона"}>
            <div className="sn-champ-top">
              {recap.live ? "Лидер" : "Чемпион"} {recap.season.name.toLowerCase().replace("сезон", "сезона")} · {pl(champ.matches, W_MATCH)}
            </div>
            <div className="sn-champ-name" style={nameSize(champ.login, 68, "100cqw")}>
              {champ.login}
            </div>
            <div className="sn-champ-mmr">
              <CountUp value={champ.mmr} />
              <small>MMR</small>
            </div>
            <dl className="sn-champ-line">
              <div>
                <dt>Победы</dt>
                <dd>{champ.wins}</dd>
              </div>
              <div>
                <dt>Поражения</dt>
                <dd>{champ.losses}</dd>
              </div>
              <div>
                <dt>Серия</dt>
                <dd>{champ.winStreak} подряд</dd>
              </div>
            </dl>
            <div className="sf-stamps">
              {titles.map((t) => (
                <span key={t} className="sf-stamp sn-acc">
                  {t}
                </span>
              ))}
              {d && d.score && d.p[sides(d)[0]] === 0 && <span className="sf-stamp win">финал {d.score[sides(d)[0]]}:{d.score[sides(d)[1]]}</span>}
            </div>
          </article>
        )}
      </div>
      <div className="sf-wrap">
        <dl className="sn-kpis">
          <div>
            <dt>Матчей</dt>
            <dd>
              <CountUp value={S.matches} />
              <small>{S.x2} из них с жетоном ×2</small>
            </dd>
          </div>
          <div>
            <dt>Игроков</dt>
            <dd>
              <CountUp value={S.players} />
              <small>{S.oneMatch} сыграли один матч</small>
            </dd>
          </div>
          <div>
            <dt>Игровых дней</dt>
            <dd>
              <CountUp value={S.gameDays} />
              <small>из {pl(days, W_DAY)} сезона</small>
            </dd>
          </div>
          <div>
            <dt>Смен лидера</dt>
            <dd>
              <CountUp value={changes} />
              <small>{leadersN} разных лидеров</small>
            </dd>
          </div>
          {S.knocks > 0 && (
            <div>
              <dt>Киллов</dt>
              <dd>
                <CountUp value={S.knocks} />
                <small>
                  по {f1(S.knocks / Math.max(1, S.heats))} за заход
                  {S.chickens > 0 ? ` · ${pl(S.chickens, W_CHICKEN)}` : ""}
                </small>
              </dd>
            </div>
          )}
        </dl>
      </div>
    </section>
  );
}

function RaceSection({ recap, tone }: { recap: SeasonRecap; tone: Tone }) {
  const days = [...leadDays(recap).entries()].sort((a, b) => b[1] - a[1]);
  const changes = recap.leaders.length - 1;
  const first = recap.leaders[0], last = recap.leaders[recap.leaders.length - 1];
  return (
    <Sec
      id="race"
      tone={tone}
      eyebrow="Таблица по дням, проигранная как гонка"
      title="гонка за первое место"
      lead={
        changes > 0 ? (
          <>
            Первое место менялось {pl(changes, W_TIMES)}: от {nameOf(recap, first.player)} в первые дни до {nameOf(recap, last.player)} в конце. Дольше всех первым был{" "}
            {nameOf(recap, days[0][0])}: {pl(days[0][1], W_DAY)}.
          </>
        ) : (
          <>Весь сезон первым был {nameOf(recap, first?.player ?? 0)}.</>
        )
      }
    >
      <SeasonRace />
      <div className="sn-lead-days">
        {days.map(([p, n]) => (
          <div key={p}>
            <b>{n}</b>
            <span>
              {nameOf(recap, p)} · {plural(n, W_DAY)} первым
            </span>
          </div>
        ))}
      </div>
    </Sec>
  );
}

function FinalSection({ recap, tone }: { recap: SeasonRecap; tone: Tone }) {
  const m = recap.matches[recap.decisive];
  const [w, l] = sides(m);
  const A = recap.players[m.p[w]], B = recap.players[m.p[l]];
  const chance = elo(m.before[w], m.before[l]);
  const dayIdx = recap.days.findIndex((d) => d.date === new Date(m.at).toLocaleDateString("sv-SE", { timeZone: "Europe/Moscow" }));
  const prevOrder = dayIdx > 0 ? recap.days[dayIdx - 1].order : [];
  const place = (i: number) => (prevOrder.indexOf(i) >= 0 ? prevOrder.indexOf(i) + 1 : 0);
  const names = mapNames(recap);
  const played = m.rounds.filter((r) => r.played);
  // счёт после каждого раунда
  const after = played.reduce<Array<[number, number]>>((acc, r) => [...acc, [(acc.at(-1)?.[0] ?? 0) + r.points[w], (acc.at(-1)?.[1] ?? 0) + r.points[l]]], []);
  const lastM = recap.matches[recap.matches.length - 1];
  return (
    <Sec
      id="final"
      tone={tone}
      eyebrow={`${dLong(m.at)}, ${hhmm(m.at)} · ${pl(played.length || 1, W_ROUND)}${m.mult > 1 ? ` · жетон ×${m.mult}` : ""}`}
      title={recap.live ? "матч, который вывел в лидеры" : "матч, который решил сезон"}
      lead={
        <>
          До матча {place(m.p[l]) === 1 ? "первым" : `${place(m.p[l]) || "–"}-м`} был {B.login} с {m.before[l]} MMR, {A.login} шёл {place(m.p[w]) ? `${place(m.p[w])}-м` : "ниже"}. По Эло у {A.login} было{" "}
          {Math.round(chance * 100)}% на победу.
          {m.mult > 1 ? ` Жетон ×${m.mult} удвоил ставку: ${signed(m.delta[w])} MMR победителю.` : ` Победа принесла ${signed(m.delta[w])} MMR.`}
        </>
      }
    >
      <div className="sn-fin">
        <div>
          <div className="sn-board">
            <div className="sn-board-row">
              {[w, l].map((s, k) => {
                const p = recap.players[m.p[s]];
                const node = (
                  <div key={s} className={`sn-side ${k ? "b" : "a"}`}>
                    <Link className="nm" href={`/profile/${encodeURIComponent(p.login)}`} style={nameSize(p.login, 60, "100cqw")}>
                      {p.login}
                    </Link>
                    <span className="meta">
                      {place(m.p[s]) ? `#${place(m.p[s])} до матча · ` : ""}
                      {m.before[s]}
                    </span>
                    <span className={`mv ${m.delta[s] > 0 ? "sf-up" : "sf-down"}`}>
                      {signed(m.delta[s])} → {m.before[s] + m.delta[s]}
                    </span>
                  </div>
                );
                return k === 0 ? (
                  [
                    node,
                    <div key="score" className="sn-score">
                      {m.score ? (
                        <>
                          <b>{m.score[w]}</b>
                          <span>:</span>
                          <b>{m.score[l]}</b>
                        </>
                      ) : (
                        <b>vs</b>
                      )}
                      <small>счёт матча</small>
                    </div>,
                  ]
                ) : (
                  node
                );
              })}
            </div>
            <div className="sn-odds">
              <div className="sn-odds-lbl">
                <span>
                  {A.login} {Math.round(chance * 100)}%
                </span>
                <span>
                  {Math.round((1 - chance) * 100)}% {B.login}
                </span>
              </div>
              <div className="sn-odds-bar" role="img" aria-label={`Шансы перед матчем: ${A.login} ${Math.round(chance * 100)}%, ${B.login} ${Math.round((1 - chance) * 100)}%`}>
                <i style={{ width: `${chance * 100}%`, background: "var(--sn-c1)" }} />
                <i style={{ flex: 1, background: "var(--sn-fg2)" }} />
              </div>
              <p className="sn-cap">Шансы перед матчем по Эло</p>
            </div>
          </div>
          {played.length > 0 && m.score && (
            <div className="sn-rounds3" style={{ ["--n" as string]: played.length }}>
              {played.map((r, k) => {
                const sa = r.points[w], sb = r.points[l];
                const tot = sa + sb || 1;
                return (
                  <div key={k} className="sn-rtile">
                    <div className="img" style={r.maps[w] || r.maps[l] ? { backgroundImage: `url(${mapImage(r.maps[w] || r.maps[l])})` } : undefined} />
                    <div>
                      <div className="rn">Раунд {k + 1}</div>
                      <div className="mp">{roundMaps(r, names) || "Карты не отмечены"}</div>
                    </div>
                    <div>
                      <div className="rs">
                        {sa}
                        <em> : </em>
                        {sb}
                      </div>
                      <div className="split" aria-hidden>
                        <i style={{ width: `${(sa / tot) * 100}%`, background: "var(--sn-c1)" }} />
                        <i style={{ flex: 1, background: "var(--sf-cream-2)" }} />
                      </div>
                      <div className="rk">
                        киллы {r.knocks[w]}:{r.knocks[l]}
                        {r.places[w] || r.places[l] ? ` · места ${r.places[w] || "–"}:${r.places[l] || "–"}` : ""} · после раунда {after[k][0]}:{after[k][1]}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        {lastM && lastM !== m && <LastMatch recap={recap} m={lastM} />}
      </div>
    </Sec>
  );
}

function LastMatch({ recap, m }: { recap: SeasonRecap; m: RecapMatch }) {
  const [w, l] = sides(m);
  const A = recap.players[m.p[w]];
  const names = mapNames(recap);
  const r1 = m.rounds.find((r) => r.played);
  const lostR1 = m.score && r1 && r1.points[w] < r1.points[l];
  return (
    <aside className="sn-aside" aria-label="Последний матч сезона">
      <p className="sf-eyebrow">
        Последний матч сезона · {dLong(m.at)}, {hhmm(m.at)}
      </p>
      <Link className="vs" href={`/tournament/${m.id}`}>
        {A.login} {m.score ? `${m.score[w]}:${m.score[l]}` : "›"} {loserName(recap, m)}
      </Link>
      {(lostR1 || m.mult > 1) && (
        <p>
          {lostR1 && r1 ? `${A.login} проиграл первый раунд ${r1.points[w]}:${r1.points[l]}, но отыгрался. ` : ""}
          {m.mult > 1 ? `Жетон ×${m.mult}: ${signed(m.delta[w])} MMR.` : ""}
        </p>
      )}
      <p>
        <b>
          {A.losses === 0
            ? `${A.login} ${recap.live ? "пока" : ""} без поражений: ${A.wins}–0 и ${A.rank}-е место с ${A.mmr} MMR.`
            : `${A.login} на ${A.rank}-м месте с ${A.mmr} MMR.`}
        </b>
      </p>
      {m.score && (
        <div className="sf-stamps">
          {m.rounds
            .filter((r) => r.played)
            .map((r, k) => (
              <span key={k} className="sf-stamp">
                {k + 1}. {roundMaps(r, names) || "?"} {r.points[w]}:{r.points[l]}
              </span>
            ))}
        </div>
      )}
    </aside>
  );
}

function UpsetsSection({ recap, tone }: { recap: SeasonRecap; tone: Tone }) {
  const P = recap.players;
  const [favWon, favAll] = recap.favorites;
  const by = <T,>(arr: T[], f: (x: T) => number) => [...arr].sort((a, b) => f(b) - f(a));
  const streak = by(P, (p) => p.winStreak)[0];
  const unbeaten = by(
    P.filter((p) => p.losses === 0 && p.wins >= 3),
    (p) => p.wins,
  );
  const busiest = by(P, (p) => p.matches)[0];
  const lowest = by(P, (p) => -p.low)[0];
  const lowestLed = recap.leaders.some((l) => P[l.player] === lowest);
  const swing = recap.matches[recap.swings[0]];
  const detailed = recap.matches.filter((m) => m.score);
  const big = by(detailed, (m) => m.score![sides(m)[0]])[0];
  const peakNC = by(P.slice(1), (p) => p.peak)[0];
  const ls = by(P, (p) => p.lossStreak)[0]?.lossStreak ?? 0;
  const lsAll = P.filter((p) => p.lossStreak === ls);
  const records: Array<[string, string, string, string?]> = [];
  if (streak) records.push(["Лучшая серия", `${pl(streak.winStreak, W_WIN)}`, streak.login, "подряд, без единого поражения между ними"]);
  if (unbeaten[0])
    records.push([
      "Без поражений",
      `${unbeaten[0].wins}–0`,
      unbeaten[0].login,
      unbeaten.length > 1 ? `Ещё ${unbeaten.slice(1).map((p) => `${p.login} ${p.wins}–0`).join(", ")}` : undefined,
    ]);
  if (busiest) records.push(["Больше всех матчей", String(busiest.matches), busiest.login, `${pl(busiest.wins, W_WIN)} и ${pl(busiest.losses, W_LOSS)}, ${busiest.opponents} разных соперников`]);
  if (lowest)
    records.push(["Самое глубокое дно", String(lowest.low), lowest.login, lowestLed ? `А ведь ${lowest.login} был первым в таблице. Итог - ${lowest.mmr}` : `Итог сезона - ${lowest.mmr}`]);
  if (swing) records.push(["Самый большой куш", signed(Math.max(...swing.delta)), `${winnerName(recap, swing)} › ${loserName(recap, swing)}`, `${dLong(swing.at)}${swing.mult > 1 ? `, жетон ×${swing.mult}` : ""}`]);
  if (big?.score)
    records.push([
      "Самый крупный счёт",
      `${big.score[sides(big)[0]]}:${big.score[sides(big)[1]]}`,
      `${winnerName(recap, big)} › ${loserName(recap, big)}`,
      `${dLong(big.at)}${big.show ? ", шоу-матч" : ""}${big.mult > 1 ? `, жетон ×${big.mult}` : ""}`,
    ]);
  if (peakNC) records.push([`Пик не ${recap.live ? "лидера" : "чемпиона"}`, String(peakNC.peak), peakNC.login, `${dLong(peakNC.peakAt)}; итог ${peakNC.mmr}`]);
  if (ls > 0) records.push(["Серия поражений", `${ls} подряд`, lsAll.map((p) => p.login).join(", "), "Длиннее не было ни у кого"]);
  return (
    <Sec id="upsets" tone={tone} eyebrow="Кого не ждали" title="сенсации и рекорды" lead="Шанс на победу считается по той же формуле Эло, что и рейтинг: по MMR обоих игроков перед матчем.">
      <div className="sn-ups-grid">
        <div>
          <div className="sn-hero-num">
            <CountUp value={pc(favWon, favAll)} />%
          </div>
          <p className="sf-lead sn-lead">
            Столько матчей выиграл фаворит по MMR: {favWon} из {favAll}.{" "}
            {pc(favWon, favAll) < 60 ? "Почти монетка: рейтинг быстро реагирует, и за один вечер можно подняться на десяток мест." : ""}
          </p>
        </div>
        <div>
          <p className="sn-panel-title">
            <span>Самые неожиданные победы</span>
            <span>шанс перед матчем</span>
          </p>
          <ol className="sn-ups">
            {recap.upsets.map((u) => {
              const m = recap.matches[u.match];
              const [w, l] = sides(m);
              return (
                <li key={u.match}>
                  <span className="dt">{dShort(m.at)}</span>
                  <Link className="who" href={`/tournament/${m.id}`}>
                    {nameOf(recap, m.p[w])} <span>{m.before[w]}</span>
                    <em>›</em>
                    {nameOf(recap, m.p[l])} <span>{m.before[l]}</span>
                  </Link>
                  <span className="ch">
                    {Math.round(u.chance * 100)}% на победу
                    <span className="sn-meter">
                      <i style={{ width: `${u.chance * 100}%` }} />
                    </span>
                  </span>
                  <span className="dd">
                    {signed(m.delta[w])}
                    <small>{m.mult > 1 ? `жетон ×${m.mult}` : "MMR"}</small>
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
      <dl className="sn-recs">
        {records.map(([k, v, who, sub]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>
              <span className="v">{v}</span>
              <span className="w">{who}</span>
              {sub && <span className="s">{sub}</span>}
            </dd>
          </div>
        ))}
      </dl>
      {recap.rivals.length > 0 && (
        <>
          <p className="sn-panel-title sn-gap">
            <span>Встречались чаще всех</span>
          </p>
          <div className="sn-rivals">
            {recap.rivals.slice(0, 3).map((r) => {
              const flip = r.winsB > r.winsA;
              const [a, b, wa, wb] = flip ? [r.b, r.a, r.winsB, r.winsA] : [r.a, r.b, r.winsA, r.winsB];
              return (
                <div key={`${r.a}-${r.b}`} className="sn-rival">
                  <div className="pair">
                    {nameOf(recap, a)} и {nameOf(recap, b)}
                  </div>
                  <div className="res">
                    {wa}:{wb}
                  </div>
                  <p className="sn-cap">{wa === wb ? "поровну" : `в пользу ${nameOf(recap, a)}`}</p>
                </div>
              );
            })}
          </div>
        </>
      )}
    </Sec>
  );
}

// Меньше заходов на карте - отметки «больше всего киллов» и «тише всех» были бы случайностью.
const MAP_SOLID_HEATS = 5;

function MapsSection({ recap, tone }: { recap: SeasonRecap; tone: Tone }) {
  const maps = recap.maps.filter((m) => m.heats > 0);
  const per = (m: (typeof maps)[number], v: number) => (m.heats ? v / m.heats : 0);
  const solid = maps.filter((m) => m.heats >= MAP_SOLID_HEATS);
  const mostKn = [...solid].sort((a, b) => per(b, b.knocks) - per(a, a.knocks))[0];
  const quiet = [...solid].sort((a, b) => per(a, a.points) - per(b, b.points))[0];
  const heats = maps.reduce((s, m) => s + m.heats, 0);
  return (
    <Sec
      id="maps"
      tone={tone}
      eyebrow="Что происходит на карте"
      title="карты"
      lead={<>Карту каждого захода выбирает игра, ведущий её отмечает: отмечено {pl(heats, W_HEAT)}.</>}
    >
      <div className="sn-maps-grid">
        {[...maps]
          .sort((a, b) => b.heats - a.heats)
          .map((m) => {
            const st: string[] = [];
            if (m === mostKn) st.push("больше всего киллов");
            if (m === quiet) st.push("тише всех");
            return (
              <article key={m.code} className="sn-mcard">
                <div className="pic" style={{ backgroundImage: `url(${mapImage(m.code)})` }}>
                  <h3>{m.name}</h3>
                  {st.length > 0 && (
                    <div className="sf-stamps">
                      {st.map((s) => (
                        <span key={s} className="sf-stamp">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <dl>
                  <div>
                    <dt>Заходов</dt>
                    <dd>{m.heats}</dd>
                  </div>
                  <div>
                    <dt>Среднее место</dt>
                    <dd>
                      {m.placed ? f1(m.avgPlace) : "—"}
                      {m.chickens > 0 && <small>{pl(m.chickens, W_CHICKEN)}</small>}
                    </dd>
                  </div>
                  <div>
                    <dt>Очков за заход</dt>
                    <dd>{f1(per(m, m.points))}</dd>
                  </div>
                  <div>
                    <dt>Киллов за заход</dt>
                    <dd>{f1(per(m, m.knocks))}</dd>
                  </div>
                  <div className="wide">
                    <dt>Заданий выполнено</dt>
                    <dd>
                      {pc(m.tasksDone, m.tasksOffered)}%
                      <small>
                        {m.tasksDone} из {m.tasksOffered}
                      </small>
                    </dd>
                  </div>
                </dl>
              </article>
            );
          })}
      </div>
      <p className="sn-cap">Очки, киллы, место и задания - у стороны за её заход.</p>
    </Sec>
  );
}

// Корзины мест в заходе: первое место - чикен, отдельным столбцом.
const PLACE_BINS: Array<[string, number, number]> = [
  ["1 · чикен", 1, 1],
  ["2–5", 2, 5],
  ["6–10", 6, 10],
  ["11–16", 11, 16],
];
const MAX_PLACE = 16; // в Ultimate Royale 16 команд
// Меньше заходов с местом - среднее место ещё ничего не говорит.
const PLACE_MIN_HEATS = 3;
const LIST_LEN = 5;

function HeatsSection({ recap, tone }: { recap: SeasonRecap; tone: Tone }) {
  const S = recap.summary;
  const names = mapNames(recap);
  const scored = recap.matches.filter((m) => m.score && m.winner >= 0);
  const margins = MARGINS.map(([label, a, b]) => ({
    label,
    n: scored.filter((m) => {
      const d = Math.abs(m.score![0] - m.score![1]);
      return d >= a && d <= b;
    }).length,
  }));
  const mMax = Math.max(1, ...margins.map((x) => x.n));
  const bins = PLACE_BINS.map(([label, a, b]) => ({ label, n: recap.places.slice(a - 1, b).reduce((s, v) => s + v, 0) }));
  const bMax = Math.max(1, ...bins.map((x) => x.n));
  const placed = bins.reduce((s, x) => s + x.n, 0);
  const kMax = Math.max(1, ...recap.knockers.map((k) => k.knocks));
  const bk = recap.bestKnock;
  const chickens = recap.placers.filter((p) => p.chickens > 0).slice(0, LIST_LEN);
  const cMax = Math.max(1, ...chickens.map((p) => p.chickens));
  const steady = recap.placers
    .filter((p) => p.placed >= PLACE_MIN_HEATS)
    .sort((a, b) => a.avgPlace - b.avgPlace || b.placed - a.placed)
    .slice(0, LIST_LEN);
  return (
    <Sec
      id="heats"
      tone={tone}
      eyebrow="Места, киллы и чикены"
      title="заходы"
      lead={
        <>
          За сезон сыграно {pl(S.heats, W_HEAT)}, в среднем {f1(S.knocks / Math.max(1, S.heats))} килла за заход.
          {S.chickens > 0 ? ` Первое место против всех сквадов взяли ${pl(S.chickens, W_TIMES)}.` : ""}
        </>
      }
    >
      <div className="sn-two">
        <div>
          {placed > 0 && (
            <>
              <p className="sn-panel-title">
                <span>Места в заходах</span>
                <span>по экрану итогов, заходов</span>
              </p>
              <div className="sn-cols" role="img" aria-label={bins.map((x) => `${x.label}: ${x.n}`).join(", ")}>
                {bins.map((x, k) => (
                  <div key={x.label}>
                    <b>{x.n}</b>
                    <i className={k === 0 ? "acc" : undefined} style={{ height: `${(x.n / bMax) * 100}%` }} />
                    <span>{x.label}</span>
                  </div>
                ))}
              </div>
            </>
          )}
          {scored.length > 0 && (
            <>
              <p className={`sn-panel-title ${placed > 0 ? "sn-gap" : ""}`}>
                <span>Насколько близко</span>
                <span>разница в счёте, матчей</span>
              </p>
              <div className="sn-cols" role="img" aria-label={margins.map((x) => `${x.label}: ${x.n}`).join(", ")}>
                {margins.map((x, k) => (
                  <div key={x.label}>
                    <b>{x.n}</b>
                    <i className={k === 0 ? "acc" : undefined} style={{ height: `${(x.n / mMax) * 100}%` }} />
                    <span>{x.label}</span>
                  </div>
                ))}
              </div>
            </>
          )}
          {recap.comebacks.length > 0 && (
            <>
              <p className="sn-panel-title sn-gap">
                <span>Отыгрались после первого раунда</span>
                <span>
                  {recap.comebacks.length} из {pl(scored.length, W_MATCH)}
                </span>
              </p>
              <ul className="sn-cb">
                {[...recap.comebacks]
                  .sort((a, b) => a.round1[0] - a.round1[1] - (b.round1[0] - b.round1[1]))
                  .slice(0, 5)
                  .map((c) => {
                    const m = recap.matches[c.match];
                    const [w, l] = sides(m);
                    return (
                      <li key={c.match}>
                        <Link className="w" href={`/tournament/${m.id}`}>
                          {nameOf(recap, m.p[w])}
                          <span> › {nameOf(recap, m.p[l])}</span>
                        </Link>
                        <span className="sc">
                          1 раунд {c.round1[0]}:{c.round1[1]} → <b>{m.score ? `${m.score[w]}:${m.score[l]}` : ""}</b>
                        </span>
                      </li>
                    );
                  })}
              </ul>
            </>
          )}
        </div>
        <div>
          {recap.knockers.length > 0 && (
            <>
              <p className="sn-panel-title">
                <span>Больше всех киллов</span>
                <span>за сезон</span>
              </p>
              <div className="sn-hbars">
                {recap.knockers.map((k) => (
                  <div key={k.player} className="sn-hbar">
                    <span className="nm">{nameOf(recap, k.player)}</span>
                    <span className="tr">
                      <i style={{ width: `calc((100% - 130px) * ${(k.knocks / kMax).toFixed(3)})` }} />
                      <b>{k.knocks}</b>
                      <span>{f1(k.knocks / Math.max(1, k.heats))} за заход</span>
                    </span>
                  </div>
                ))}
              </div>
              {bk && (
                <p className="sn-cap">
                  Рекорд одного захода: {nameOf(recap, bk.player)} - {pl(bk.knocks, W_KNOCK)} против{" "}
                  {nameOf(recap, recap.matches[bk.match].p.find((p) => p !== bk.player) ?? 0)}
                  {names[bk.map] ? `, ${names[bk.map]}` : ""}, {dLong(recap.matches[bk.match].at)}.
                </p>
              )}
            </>
          )}
          {chickens.length > 0 && (
            <>
              <p className="sn-panel-title sn-gap">
                <span>Больше всех чикенов</span>
                <span>первых мест</span>
              </p>
              <div className="sn-hbars">
                {chickens.map((p) => (
                  <div key={p.player} className="sn-hbar">
                    <span className="nm">{nameOf(recap, p.player)}</span>
                    <span className="tr">
                      <i style={{ width: `calc((100% - 130px) * ${(p.chickens / cMax).toFixed(3)})` }} />
                      <b>{p.chickens}</b>
                      <span>из {pl(p.placed, W_HEAT_GEN)}</span>
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
          {steady.length > 0 && (
            <>
              <p className="sn-panel-title sn-gap">
                <span>Лучшее среднее место</span>
                <span>от {PLACE_MIN_HEATS} заходов</span>
              </p>
              <div className="sn-hbars">
                {steady.map((p) => (
                  <div key={p.player} className="sn-hbar">
                    <span className="nm">{nameOf(recap, p.player)}</span>
                    <span className="tr">
                      <i style={{ width: `calc((100% - 130px) * ${((MAX_PLACE + 1 - p.avgPlace) / MAX_PLACE).toFixed(3)})` }} />
                      <b>{f1(p.avgPlace)}</b>
                      <span>
                        топ-5: {p.top5} из {p.placed}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </Sec>
  );
}

function TasksSection({ recap, tone }: { recap: SeasonRecap; tone: Tone }) {
  const T = recap.tasks;
  const names = mapNames(recap);
  const dMax = Math.max(1, ...T.doers.map((d) => d.done));
  const item = (t: (typeof T.easy)[number]) => (
    <li key={`${t.name}-${t.map}`}>
      <div className="h">
        <b>
          {t.name}
          {t.category === "protocol" ? <span className="sn-cat">протокол</span> : t.map ? <span className="sn-cat">{names[t.map] ?? t.map}</span> : null}
        </b>
        <span className="n">
          {t.done}
          <small>из {t.offered}</small>
        </span>
      </div>
      <p>{t.text}</p>
      <span className="sn-meter">
        <i style={{ width: `${pc(t.done, t.offered)}%` }} />
      </span>
    </li>
  );
  return (
    <Sec
      id="tasks"
      tone={tone}
      eyebrow="Задания, задания на карту и протоколы"
      title="задания"
      lead="В каждом раунде у стороны общее задание, задание на карту захода и протокол на время."
    >
      <div className="sn-tasks-top">
        <div>
          <div className="sn-hero-num">{f1((T.all[0] * 100) / T.all[1])}%</div>
          <p className="sf-lead sn-lead">
            заданий и протоколов выполнено: {T.all[0]} из {T.all[1]}, выданных в сыгранных раундах. Всего в матчах встретилось {T.distinct} разных.
          </p>
        </div>
        <div className="sn-meters">
          {(
            [
              ["Задания на карту", "высадиться в Пекадо и выжить 5 минут", T.mapTasks],
              ["Общие задания", "на любой карте", T.general],
              ["Протоколы", "на время", T.protocols],
            ] as const
          ).map(([name, hint, v]) => (
            <div key={name} className="sn-mrow">
              <span className="t">
                {name}
                <span>
                  {v[0]} из {v[1]} · {hint}
                </span>
              </span>
              <b>{pc(v[0], v[1])}%</b>
              <span className="sn-meter big">
                <i style={{ width: `${pc(v[0], v[1])}%` }} />
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="sn-tlists">
        <div>
          <p className="sn-panel-title">
            <span>Выполняли чаще всего</span>
          </p>
          <ul className="sn-tl">{T.easy.map(item)}</ul>
        </div>
        <div>
          <p className="sn-panel-title">
            <span>Почти не даются</span>
          </p>
          <ul className="sn-tl">{T.hard.map(item)}</ul>
        </div>
        <div>
          <p className="sn-panel-title">
            <span>Лучше всех с заданиями</span>
            <span>выполнено</span>
          </p>
          <div className="sn-hbars">
            {T.doers.map((d) => (
              <div key={d.player} className="sn-hbar">
                <span className="nm">{nameOf(recap, d.player)}</span>
                <span className="tr">
                  <i style={{ width: `calc((100% - 130px) * ${(d.done / dMax).toFixed(3)})` }} />
                  <b>{d.done}</b>
                  <span>
                    из {d.offered} · {pc(d.done, d.offered)}%
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Sec>
  );
}

function CalendarSection({ recap, tone }: { recap: SeasonRecap; tone: Tone }) {
  const days = recap.days;
  const byDate = new Map(days.map((d) => [d.date, d]));
  const cMax = Math.max(1, ...days.map((d) => d.matches));
  const busiest = Math.max(...days.map((d) => d.matches));
  const top = days.filter((d) => d.matches === busiest).map((d) => dLong(dayTime(d.date)));
  const wd = recap.weekday;
  const wdMax = wd.indexOf(Math.max(...wd));
  // недели с понедельника: первая строка начинается с понедельника недели первого дня
  const first = new Date(`${days[0].date}T12:00:00Z`);
  const startMon = new Date(first.getTime() - ((first.getUTCDay() + 6) % 7) * 864e5);
  const lastT = Date.parse(`${days[days.length - 1].date}T12:00:00Z`);
  const weeks: string[][] = [];
  for (let t = startMon.getTime(); t <= lastT; t += 7 * 864e5) weeks.push(Array.from({ length: 7 }, (_, k) => new Date(t + k * 864e5).toISOString().slice(0, 10)));
  const fill = (n: number) => `color-mix(in oklab, var(--sf-amber) ${Math.round(28 + (n / cMax) * 72)}%, var(--sf-night-3))`;
  const cumPts = days.reduce<number[]>((acc, d) => [...acc, (acc.at(-1) ?? 0) + d.new], []);
  const total = cumPts.at(-1) || 1;
  const hours = recap.hours;
  const hMax = Math.max(1, ...hours);
  const hRange = Array.from({ length: 16 }, (_, k) => k + 7);
  return (
    <Sec
      id="calendar"
      tone={tone}
      eyebrow="Когда играли и кто приходил"
      title="календарь"
      lead={
        <>
          Матчи шли {pl(recap.summary.gameDays, W_DAY)} из {days.length}. Больше всего сыграли {top.slice(0, 2).join(" и ")}: по {pl(busiest, W_MATCH)}.
          {wd[6] === 0 ? " По воскресеньям не играли ни разу." : ""} Чаще всего выходили в {WEEKDAYS_IN[wdMax]}.
        </>
      }
    >
      <div className="sn-cal-grid">
        <div>
          <p className="sn-panel-title">
            <span>Матчей в день</span>
            <span>по Москве</span>
          </p>
          <div className="sn-cal">
            <span />
            {WEEKDAYS.map((d) => (
              <span key={d} className="wd">
                {d}
              </span>
            ))}
            {weeks.map((w) => [
              <span key={`w${w[0]}`} className="wk">
                {dShort(dayTime(w[0]))}
              </span>,
              ...w.map((date) => {
                const d = byDate.get(date);
                const n = d?.matches ?? 0;
                return (
                  <span
                    key={date}
                    className={`d ${d ? "" : "off"} ${n ? "has" : ""}`}
                    style={n ? { background: fill(n) } : undefined}
                    title={d ? `${dLong(dayTime(date))}: ${n ? pl(n, W_MATCH) : "матчей не было"}${d.new ? `, новых игроков ${d.new}` : ""}` : undefined}
                  >
                    <span className="n">{Number(date.slice(8))}</span>
                    {n || ""}
                  </span>
                );
              }),
            ])}
          </div>
        </div>
        <div className="sn-minis">
          <div>
            <p className="sn-panel-title">
              <span>По дням недели</span>
              <span>матчей</span>
            </p>
            <div className="sn-cols">
              {wd.map((n, k) => (
                <div key={k}>
                  <b>{n}</b>
                  <i className={k === wdMax ? "acc" : undefined} style={{ height: `${(n / Math.max(1, ...wd)) * 100}%` }} />
                  <span>{WEEKDAYS[k]}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="sn-panel-title">
              <span>Игроков в сезоне</span>
              <span>нарастающим итогом</span>
            </p>
            <div className="sn-cum">
              <svg viewBox={`0 0 ${days.length} 100`} preserveAspectRatio="none" aria-hidden>
                <path d={`M0 100${cumPts.map((v, k) => `V${100 - (v / total) * 100}H${k + 1}`).join("")}V100Z`} className="area" />
                <path d={`M0 100${cumPts.map((v, k) => `V${100 - (v / total) * 100}H${k + 1}`).join("")}`} className="line" />
              </svg>
              <b>{total}</b>
              <div className="ax">
                <span>{dShort(dayTime(days[0].date))}</span>
                <span>{dShort(dayTime(days[days.length - 1].date))}</span>
              </div>
            </div>
          </div>
          {hours.some((h) => h > 0) && (
            <div>
              <p className="sn-panel-title">
                <span>Час начала матча</span>
                <span>по Москве, матчи с точным временем</span>
              </p>
              <div className="sn-cols thin">
                {hRange.map((h) => (
                  <div key={h} title={`${h}:00–${h}:59: ${pl(hours[h], W_MATCH)}`}>
                    <b>{hours[h] === hMax ? hours[h] : ""}</b>
                    <i className={hours[h] === hMax ? "acc" : undefined} style={{ height: `${(hours[h] / hMax) * 100}%` }} />
                    <span>{h % 3 === 1 ? `${h}:00` : ""}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Sec>
  );
}

function HowSection({ recap, tone }: { recap: SeasonRecap; tone: Tone }) {
  const S = recap.summary;
  const sn = recap.season;
  const up = recap.upcoming[0];
  const items = [
    "Цифры - из базы сайта и обновляются после каждого матча сезона.",
    `MMR - Эло с K=${sn.kFactor}, у всех старт ${S.startMmr}. Жетон ×2 удваивает изменение.`,
    "Шанс на победу - ожидаемый результат Эло по MMR обоих игроков прямо перед матчем.",
    "Раунд - заход стороны A и заход стороны B, карту каждого захода выбирает игра. Заход сыгран, если ведущий отметил карту или место или в нём есть киллы.",
    "Место в заходе - по экрану итогов PUBG, от 1 до 16; чикен - первое место.",
    "Победы и поражения - как в таблице лидеров.",
  ];
  return (
    <section className={`sf-sec ${tone} sn-sec sn-how`} id="how">
      <div className="sf-wrap">
        <h2 className="sf-h-big">
          как считали
        </h2>
        <ul className="sn-how-list">
          {items.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        {up && (
          <p className="sn-next">
            Дальше: {up.format === "show" ? "шоу-матч " : ""}
            <Link href={`/tournament/${up.id}`}>{up.title}</Link>
            {up.at ? `, ${dLong(up.at)} в ${hhmm(up.at)}` : ""}
            {up.prize ? `, приз ${up.prize}` : ""}
          </p>
        )}
      </div>
    </section>
  );
}

/** Страница итогов сезона: что было, кто выиграл и как. Разделы без данных (у старых сезонов нет заданий)
    пропускаются, полосы ночь/бумага чередуются по оставшимся. */
export function SurfaceSeason({ recap, no }: { recap: SeasonRecap; no: string }) {
  if (!recap.players.length) {
    return (
      <SurfaceMissing eyebrow={`Сезон ${no}`} title="итогов пока нет" lead="Итоги появятся после первого сыгранного матча сезона.">
        <Link className="sf-btn sf-btn-amber" href="/schedule">
          К матчам
        </Link>
        <Link className="sf-btn sf-btn-line" href="/rating">
          Рейтинг
        </Link>
      </SurfaceMissing>
    );
  }
  const S = recap.summary;
  const parts: Part[] = [
    {
      id: "table",
      nav: "Таблица",
      render: (tone) => (
        <Sec
          id="table"
          tone={tone}
          eyebrow="Итоговая таблица 1×1"
          title="таблица"
          lead={`Рейтинг - Эло с K=${recap.season.kFactor} и стартом с ${S.startMmr}. Нажми на строку, чтобы открыть карточку игрока.`}
        >
          <SeasonTable />
        </Sec>
      ),
    },
  ];
  if (recap.days.length) parts.push({ id: "race", nav: "Гонка", render: (tone) => <RaceSection recap={recap} tone={tone} /> });
  if (recap.decisive >= 0) parts.push({ id: "final", nav: "Финал", render: (tone) => <FinalSection recap={recap} tone={tone} /> });
  if (recap.upsets.length) parts.push({ id: "upsets", nav: "Сенсации", render: (tone) => <UpsetsSection recap={recap} tone={tone} /> });
  if (recap.maps.some((m) => m.heats > 0)) parts.push({ id: "maps", nav: "Карты", render: (tone) => <MapsSection recap={recap} tone={tone} /> });
  if (S.heats > 0) parts.push({ id: "heats", nav: "Заходы", render: (tone) => <HeatsSection recap={recap} tone={tone} /> });
  if (recap.tasks.all[1] > 0) parts.push({ id: "tasks", nav: "Задания", render: (tone) => <TasksSection recap={recap} tone={tone} /> });
  if (recap.days.length) parts.push({ id: "calendar", nav: "Календарь", render: (tone) => <CalendarSection recap={recap} tone={tone} /> });
  parts.push({
    id: "you",
    nav: "Найди себя",
    render: (tone) => (
      <Sec id="you" tone={tone} eyebrow="Карточка любого игрока сезона" title="найди себя" lead="Рейтинг по ходу сезона, все матчи и соперники.">
        <SeasonYou />
      </Sec>
    ),
  });
  parts.push({ id: "how", render: (tone) => <HowSection recap={recap} tone={tone} /> });
  const tones: Tone[] = ["sf-paper", "sf-night"];
  return (
    <SeasonProvider recap={recap}>
      <div className="sn-page">
        <Hero recap={recap} no={no} nav={parts.filter((p) => p.nav).map((p) => [p.id, p.nav!])} />
        {parts.map((p, k) => (
          <div key={p.id}>{p.render(tones[k % 2])}</div>
        ))}
      </div>
    </SeasonProvider>
  );
}
