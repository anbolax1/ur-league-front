"use client";

import * as React from "react";
import type { LiveTimer } from "@/lib/types";

const TICK_MS = 250; // чаще секунды: цифра меняется вовремя, а не с опозданием до секунды
export const TIMER_ALERT_MS = 10_000; // последние секунды таймер подсвечивается красным
/** Сколько оверлей держит «00:00» после конца, потом таймер пропадает сам. */
export const TIMER_END_HOLD_MS = 5_000;

/** Часы как внешний источник: подписчики получают новое значение раз в такт, пока таймер идёт. */
function subscribeClock(onTick: () => void): () => void {
  const id = setInterval(onTick, TICK_MS);
  return () => clearInterval(id);
}
const clockNow = () => Math.floor(Date.now() / TICK_MS) * TICK_MS; // одно значение на такт, иначе React видит вечные перемены
const clockServer = () => 0; // на сервере часов нет: страница не расходится с браузером по тексту

function useClock(on: boolean): number {
  const subscribe = React.useCallback((cb: () => void) => (on ? subscribeClock(cb) : () => {}), [on]);
  return React.useSyncExternalStore(subscribe, clockNow, clockServer);
}

/** Сколько миллисекунд осталось до конца таймера; null - таймера нет или часы ещё не считались. */
export function useTimerLeft(timer: LiveTimer | null | undefined): number | null {
  const now = useClock(!!timer);
  if (!timer || now === 0) return null;
  return timer.endsAt - now;
}

/** Остаток как «мм:сс»; неполная секунда округляется вверх, чтобы 00:00 было только на конце. */
export function formatClock(leftMs: number): string {
  const total = Math.max(0, Math.ceil(leftMs / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
