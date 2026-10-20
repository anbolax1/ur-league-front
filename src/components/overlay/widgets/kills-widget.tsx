import { KNOCK_POINTS } from "@/lib/match";
import { WidgetFrame } from "./frame";
import type { WidgetProps } from "./types";

/** Виджет «Киллы захода»: киллы стороны в кадре за этот заход крупно и сколько они дали очков.
    Число пересоздаётся с каждым киллом, поэтому вспышка проигрывается на каждом. */
export function KillsWidget({ state, instance }: WidgetProps) {
  if (state.stage !== "round") return null;
  const kills = state.heatKills ?? 0;
  return (
    <WidgetFrame instance={instance} className="ov-kills">
      <div className="flex h-full flex-col px-5 pb-4 pt-3">
        {!instance.hideTitle && <span className="font-display text-sm uppercase tracking-[0.18em] text-muted">Киллы захода</span>}
        <span key={kills} className="ov-kill-n font-display text-[6.5rem] leading-[0.9] tnum text-primary-2">
          {kills}
        </span>
        <span className="mt-2 flex items-baseline justify-between gap-4 border-t border-white/15 pt-2 font-display text-base uppercase tracking-wide text-muted">
          <span>× {KNOCK_POINTS} очка</span>
          <b className="text-fg tnum">+{kills * KNOCK_POINTS}</b>
        </span>
      </div>
    </WidgetFrame>
  );
}
