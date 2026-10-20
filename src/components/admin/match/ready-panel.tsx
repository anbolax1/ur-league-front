"use client";

import { Panel } from "@/components/ui/card";
import { FirstSide } from "@/components/admin/match/first-side";
import { roundsLabel } from "@/lib/match";
import type { MatchState, Participant } from "@/lib/types";

/** Матч собран: кто заходит первым и старт первого раунда - задания раздадутся сразу. */
export function ReadyPanel({
  st,
  sides,
  busy,
  onFirst,
  onStart,
}: {
  st: MatchState;
  sides: [Participant | null, Participant | null];
  busy: boolean;
  onFirst: (participantId: string) => void;
  onStart: () => void;
}) {
  const [a, b] = sides;
  const total = st.tournament.rounds?.length ?? st.tournament.totalRounds;
  return (
    <Panel className="space-y-4 p-5">
      <div className="flex flex-wrap items-start gap-x-8 gap-y-3">
        <div className="min-w-[240px] flex-1 space-y-1">
          <span className="field-label">Матч готов</span>
          <p className="text-sm text-muted">
            {roundsLabel(total)}. В каждом раунде сначала заходит {a?.name ?? "сторона A"}, потом {b?.name ?? "сторона B"}. Карту захода
            выбирает игра: отметьте её в пульте, и задание на эту карту выдастся сразу.
          </p>
        </div>
        <FirstSide sides={sides} busy={busy} onPick={onFirst} />
      </div>
      <div className="flex flex-wrap items-center justify-end gap-3">
        <span className="min-w-0 flex-1 text-xs text-muted">Задание и протокол раунда раздадутся обеим сторонам при старте.</span>
        <button type="button" className="btn btn-primary" disabled={busy} onClick={onStart}>
          <span>Начать матч →</span>
        </button>
      </div>
    </Panel>
  );
}
