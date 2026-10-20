import type { ComponentType } from "react";
import type { WidgetType } from "@/lib/types";
import { ScoreboardWidget } from "./scoreboard-widget";
import { RoundWidget } from "./round-widget";
import { StandingsWidget } from "./standings-widget";
import { TasksV2Widget } from "./tasks-v2-widget";
import { KillsWidget } from "./kills-widget";
import { InFrameWidget } from "./in-frame-widget";
import { TextWidget } from "./text-widget";
import { LogoWidget } from "./logo-widget";
import type { WidgetProps } from "./types";

/** Реестр виджетов оверлея: тип → компонент. Единый источник для /overlay,
    превью в кабинете и редактора макета. */
export const WIDGET_REGISTRY: Record<WidgetType, ComponentType<WidgetProps>> = {
  scoreboard: ScoreboardWidget,
  round: RoundWidget,
  standings: StandingsWidget,
  tasksV2: TasksV2Widget,
  kills: KillsWidget,
  inFrame: InFrameWidget,
  text: TextWidget,
  logo: LogoWidget,
};

/** Русские названия типов (меню «+ добавить виджет», список «Слои»). */
export const WIDGET_LABELS: Record<WidgetType, string> = {
  scoreboard: "Счёт",
  round: "Раунд",
  standings: "Таблица мест",
  tasksV2: "Задания V2",
  kills: "Киллы захода",
  inFrame: "В кадре",
  text: "Текст",
  logo: "Логотип",
};

/** Порядок типов в меню добавления. */
export const WIDGET_ORDER: WidgetType[] = ["scoreboard", "round", "standings", "tasksV2", "kills", "inFrame", "text", "logo"];
