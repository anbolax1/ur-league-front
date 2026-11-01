"use client";

import * as React from "react";
import { TIMER_ALERT_MS, formatClock, useTimerLeft } from "@/lib/timer";
import type { LiveTimer } from "@/lib/types";

const DURATIONS_MIN = [1, 2, 3, 5, 10]; // быстрый выбор времени на задание, минут
const DEFAULT_MIN = 5;
const SEC_IN_MIN = 60;

/** Таймер задания на время: ведущий выбирает минуты и запускает, зрители видят остаток в виджете заданий. */
export function TaskTimer({
  timer,
  onStart,
  onStop,
}: {
  timer: LiveTimer | null | undefined;
  onStart: (seconds: number) => void;
  onStop: () => void;
}) {
  const [minutes, setMinutes] = React.useState(DEFAULT_MIN);
  const left = useTimerLeft(timer);
  const running = !!timer && left !== null;
  const over = running && left <= 0;

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[var(--border)] px-5 py-2.5">
      <span className="field-label">Таймер на время</span>
      {running && (
        <span
          className={`font-display text-3xl leading-none tnum ${over ? "text-danger" : left <= TIMER_ALERT_MS ? "text-danger" : "text-ok"}`}
          role="timer"
          aria-label={over ? "Время вышло" : "Осталось времени"}
        >
          {formatClock(left)}
        </span>
      )}
      {over && <span className="text-sm text-danger">время вышло</span>}
      <span className="seg" role="group" aria-label="Время на задание, минут">
        {DURATIONS_MIN.map((m) => (
          <button key={m} type="button" className="seg-btn" aria-pressed={minutes === m} onClick={() => setMinutes(m)}>
            <span>{m} мин</span>
          </button>
        ))}
      </span>
      <div className="ml-auto flex flex-wrap items-center gap-2">
        <button type="button" className="btn btn-sm" onClick={() => onStart(minutes * SEC_IN_MIN)}>
          <span>{timer ? "Запустить заново" : "Запустить"}</span>
        </button>
        {timer && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={onStop}>
            <span>Сбросить</span>
          </button>
        )}
      </div>
    </div>
  );
}
