import { knocksLabel } from "@/lib/format";
import { KNOCK_POINTS } from "@/lib/match";
import { WidgetFrame } from "./frame";
import type { WidgetProps } from "./types";

/** Виджет «В кадре»: за кем наблюдает ведущий - игрок стороны и его ник в игре, в 2×2 оба. Если сторона
    отстаёт по очкам матча, рядом - сколько киллов нужно, чтобы выйти вперёд. */
export function InFrameWidget({ state, instance }: WidgetProps) {
  if (state.stage !== "round") return null;
  const players = state.inFrame?.length ? state.inFrame : state.currentName ? [{ name: state.currentName }] : [];
  if (!players.length) return null;
  const me = state.standings?.find((s) => s.participantId === state.currentParticipantId);
  const rival = state.standings?.find((s) => s.participantId !== state.currentParticipantId);
  const chase = me && rival && rival.points >= me.points ? Math.floor((rival.points - me.points) / KNOCK_POINTS) + 1 : 0;
  return (
    <WidgetFrame instance={instance}>
      <div className="flex h-full items-center gap-3 px-4 py-3">
        <svg viewBox="0 0 24 24" className="h-6 w-6 flex-none text-primary-2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          {!instance.hideTitle && (
            <span className="text-[0.65rem] uppercase tracking-[0.18em] text-muted">
              Ведущий наблюдает{state.currentMap ? ` · ${state.currentMap}` : ""}
            </span>
          )}
          {players.map((p) => (
            <span key={p.name} className="truncate font-display text-xl uppercase leading-tight">
              {p.name}
              {p.gameNick && p.gameNick !== p.name && <span className="font-sans text-sm normal-case text-muted"> · {p.gameNick}</span>}
            </span>
          ))}
        </span>
        {chase > 0 && (
          <span className="flex-none bg-[var(--primary)] px-2 py-1 font-display text-xs uppercase tracking-wide text-[#141003]">
            обойти: {knocksLabel(chase)}
          </span>
        )}
      </div>
    </WidgetFrame>
  );
}
