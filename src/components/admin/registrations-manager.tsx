"use client";

import * as React from "react";
import { api } from "@/lib/api";
import { Avatar } from "@/components/ui/avatar";
import { Panel } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { registrationMatches } from "@/lib/display";
import { fmtDate } from "@/lib/format";
import type { Registration } from "@/lib/types";

/** Показатель из анкеты: подпись сверху, число снизу; «—», если игрок не указал. */
function Stat({ label, value }: { label: string; value?: number | null }) {
  return (
    <div className="min-w-0 rounded-md bg-surface-2 px-2.5 py-1.5">
      <div className="text-[0.62rem] uppercase tracking-wide text-muted">{label}</div>
      <div className="font-display text-base tnum">{value != null ? value : "—"}</div>
    </div>
  );
}

/** Общий пул заявок: сверху «Без очереди», дальше кто подал раньше. Показываются все заявки без ограничения.
    В матч игроков ставят в форме нового матча, здесь лишние заявки только отклоняют. */
export function RegistrationsManager() {
  const [regs, setRegs] = React.useState<Registration[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState("");

  React.useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await api.get<Registration[]>("/registrations/pool");
        if (active) setRegs(data);
      } catch {
        if (active) setRegs([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  async function decline(id: string) {
    setBusyId(id);
    try {
      await api.post(`/registrations/${id}/decide`, { status: "declined" });
      setRegs((xs) => xs.filter((x) => x.id !== id));
    } catch {
      /* оставим как есть */
    } finally {
      setBusyId(null);
    }
  }

  const filtered = regs.filter((r) => registrationMatches(r, query));
  // позиция в очереди по порядку пула (стабильна при поиске)
  const posOf = new Map(regs.map((r, i) => [r.id, i + 1]));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-2xl">Заявки (пул)</h2>
          <p className="text-sm text-muted">
            Общий список желающих сыграть. Кто подал раньше — выше, а с жетоном «Без очереди» — выше всех до конца игрового дня. Игроки из
            заявок стоят первыми в форме нового матча — выбери их там.
          </p>
        </div>
        <span className="whitespace-nowrap text-sm text-muted">
          {query && filtered.length !== regs.length ? `Найдено ${filtered.length} из ${regs.length}` : `Всего: ${regs.length}`}
        </span>
      </div>

      {!loading && regs.length > 0 && (
        <input
          className="input max-w-md"
          placeholder="Поиск по нику, игровому ID, рангу или времени…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      )}

      {loading ? (
        <Panel className="px-5 py-10 text-center text-muted">Загрузка…</Panel>
      ) : !regs.length ? (
        <EmptyState title="Заявок нет" hint="Пока никто не подал заявку на участие." />
      ) : !filtered.length ? (
        <Panel className="px-5 py-10 text-center text-muted">Ничего не найдено.</Panel>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {filtered.map((r) => (
            <li key={r.id} className="panel space-y-3 p-4">
              <div className="flex items-start gap-3">
                <span className="w-7 flex-none pt-1 text-right font-display text-lg tnum text-muted">{posOf.get(r.id)}</span>
                <Avatar name={r.userDisplayName || r.userLogin} src={r.userAvatarUrl} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-display uppercase">{r.userDisplayName || r.userLogin || "—"}</span>
                    {r.priority && (
                      <span className="badge badge-champ">
                        <span>Без очереди</span>
                      </span>
                    )}
                    {r.rank && (
                      <span className="badge badge-org">
                        <span>{r.rank}</span>
                      </span>
                    )}
                  </div>
                  <div className="truncate text-xs text-muted">
                    {r.userLogin ? `@${r.userLogin} · ` : ""}подана {fmtDate(r.createdAt)}
                  </div>
                </div>
                <button type="button" className="btn btn-danger btn-sm flex-none" disabled={busyId === r.id} onClick={() => decline(r.id)}>
                  <span>Отклонить</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="min-w-0 rounded-md bg-surface-2 px-2.5 py-1.5">
                  <div className="text-[0.62rem] uppercase tracking-wide text-muted">Игровой ник</div>
                  <div className="truncate">{r.gameNick || "—"}</div>
                </div>
                <div className="min-w-0 rounded-md bg-surface-2 px-2.5 py-1.5">
                  <div className="text-[0.62rem] uppercase tracking-wide text-muted">PUBG Mobile ID</div>
                  <div className="truncate tnum">{r.gameId || "—"}</div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <Stat label="K/D" value={r.kd} />
                <Stat label="Матчей" value={r.matches} />
                <Stat label="Побед" value={r.wins} />
                <Stat label="Убийств" value={r.kills} />
              </div>

              {(r.playTime || r.note) && (
                <p className="text-sm text-muted">
                  <span className="text-[0.62rem] uppercase tracking-wide">Удобное время: </span>
                  {[r.playTime, r.note].filter(Boolean).join(" · ")}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
