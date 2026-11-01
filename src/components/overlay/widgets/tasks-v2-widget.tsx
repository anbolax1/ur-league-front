import * as React from "react";
import type { LiveBonus, TaskTag } from "@/lib/types";
import { TIMER_ALERT_MS, TIMER_END_HOLD_MS, formatClock, useTimerLeft } from "@/lib/timer";
import { WidgetFrame } from "./frame";
import type { WidgetProps } from "./types";
import "./tasks-v2-widget.css";

const MAX_ROWS = 8;
const SAMPLE_TIMER_MS = 150_000; // в превью без запущенного таймера - условные 02:30

const TAG_LABELS: Record<TaskTag, string> = { normal: "Обычное", timed: "На время" };

type Row = { label: string; tag: TaskTag; points: number; done: boolean; text: string };

/** Строка блока; задание без тега или с тегом, которого виджет ещё не знает, - «обычное». */
function toRow(r: { tag?: string; label?: string; points: number; done: boolean; text: string }): Row {
  const tag: TaskTag = r.tag === "timed" ? "timed" : "normal";
  return { ...r, tag, label: r.label ?? TAG_LABELS[tag] };
}

/** Знак в квадрате слева: плюс - задание выполнено, минус - ещё нет. Знак 13px в поле 14px:
    чётный размер браузер ставит точно по центру квадрата, нечётный сдвигает на полпикселя. */
function Mark({ done }: { done: boolean }) {
  return (
    <span className="tw-mark">
      <svg viewBox="0 0 14 14" width="14" height="14" aria-hidden>
        <path d={done ? "M4.5.5h5v4h4v5h-4v4h-5v-4h-4v-5h4z" : "M.5 5h13v4H.5z"} fill="currentColor" />
      </svg>
    </span>
  );
}

/** Остаток времени на задание на время: красным в последние секунды и после конца. */
function Timer({ leftMs }: { leftMs: number }) {
  const over = leftMs <= 0;
  return (
    <div className="tw-timer">
      <span className="tw-timer-label">На время</span>
      <span className={`tw-timer-clock ${over ? "tw-timer-over" : leftMs <= TIMER_ALERT_MS ? "tw-timer-alert" : ""}`}>{formatClock(leftMs)}</span>
    </div>
  );
}

/** Виджет «Задания V2»: протокол и задания стороны в кадре одним блоком, у каждого свой тег.
    По опции показываются и задания соперника за +1, и таймер задания на время. */
export function TasksV2Widget({ state, instance, preview }: WidgetProps) {
  const left = useTimerLeft(instance.showTimer ? state.timer : null);
  // Конец таймера держим на экране недолго: ведущему не нужно успевать его сбросить.
  const liveLeft = left !== null && left > -TIMER_END_HOLD_MS ? left : null;
  const timerLeft = liveLeft ?? (instance.showTimer && preview && !state.timer ? SAMPLE_TIMER_MS : null);
  const bonus = (b: LiveBonus) => toRow({ tag: b.tag, label: b.opponent ? "Чужое" : undefined, points: b.points, done: b.times > 0, text: b.text });
  const all: Row[] = [
    ...(state.complications ?? []).map((c) => toRow({ tag: c.tag, points: c.reward ?? 0, done: !!c.done, text: c.text })),
    ...(state.bonusTasks ?? []).filter((b) => !b.opponent).map(bonus),
    // задания соперника - после всего, что выполняет сторона в кадре
    ...(instance.showOpponentContracts ? (state.bonusTasks ?? []).filter((b) => b.opponent).map(bonus) : []),
  ];
  if (!all.length && timerLeft === null) return null;
  const rows = all.slice(0, MAX_ROWS);
  const rest = all.length - rows.length;
  return (
    <WidgetFrame instance={instance} className="tw-panel">
      <div className="tw-list">
        {timerLeft !== null && <Timer leftMs={timerLeft} />}
        {rows.map((r, i) => (
          <React.Fragment key={i}>
            <Mark done={r.done} />
            <span className="tw-kind">{r.label}</span>
            <span className={`tw-pts tw-pts-${r.tag}`}>+{r.points}</span>
            <span className="tw-text">{r.text}</span>
          </React.Fragment>
        ))}
        {rest > 0 && <span className="tw-more">+{rest} ещё</span>}
      </div>
    </WidgetFrame>
  );
}
