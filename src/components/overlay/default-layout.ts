import type { OverlayBg, OverlayLayout, WidgetInstance, WidgetType } from "@/lib/types";

const DEFAULT_BG: OverlayBg = { on: true, opacity: 0.85 };

/** Дефолты экземпляра виджета + переопределения. Позиция/размер — долями 1920×1080. */
export function makeWidget(
  id: string,
  type: WidgetType,
  partial: Partial<WidgetInstance> = {},
): WidgetInstance {
  return {
    id,
    type,
    x: 0.04,
    y: 0.04,
    scale: 1,
    z: 1,
    visible: true,
    bg: { ...DEFAULT_BG },
    ...partial,
  };
}

/** Где виджет встаёт по умолчанию: интерфейс наблюдения в PUBG Mobile занимает углы и низ экрана, поэтому
    слева - под списком отряда, справа - под миникартой. */
export const WIDGET_SPOTS: Partial<Record<WidgetType, Partial<WidgetInstance>>> = {
  scoreboard: { x: 0.021, y: 0.306, w: 0.3 },
  tasksV2: { x: 0.021, y: 0.443, w: 0.25 },
  kills: { x: 0.823, y: 0.389, w: 0.156 },
  inFrame: { x: 0.729, y: 0.656, w: 0.25 },
  round: { x: 0.823, y: 0.259, w: 0.156 },
};

/** Дефолтная раскладка: счёт и задания слева под отрядом, киллы захода и «В кадре» справа под миникартой.
    Используется, когда в состоянии нет своей раскладки. */
export const DEFAULT_LAYOUT: OverlayLayout = {
  version: 1,
  stageBg: { on: false, opacity: 0.4 },
  widgets: [
    makeWidget("scoreboard", "scoreboard", { ...WIDGET_SPOTS.scoreboard, z: 2 }),
    makeWidget("tasksV2", "tasksV2", { ...WIDGET_SPOTS.tasksV2, z: 1 }),
    makeWidget("kills", "kills", { ...WIDGET_SPOTS.kills, z: 1 }),
    makeWidget("inFrame", "inFrame", { ...WIDGET_SPOTS.inFrame, z: 1 }),
  ],
};
