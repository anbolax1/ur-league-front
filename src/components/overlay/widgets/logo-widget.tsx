/* eslint-disable @next/next/no-img-element */
import { Mark } from "@/components/surface/brand";
import { WidgetFrame } from "./frame";
import type { WidgetProps } from "./types";

/** Виджет «Логотип»: картинка по URL из instance.props.url (бренд/спонсор). Обычно
    используется с выключенным фоном. <img> (а не next/image) — произвольный внешний URL. */
export function LogoWidget({ instance }: WidgetProps) {
  const url = typeof instance.props?.url === "string" ? instance.props.url : "";
  if (!url) {
    // Без своей картинки - знак и название лиги: виджет не пустой ни в превью, ни в OBS.
    return (
      <WidgetFrame instance={instance}>
        <div className="flex h-full items-center gap-3 px-4 py-3">
          <span className="block h-11 w-11 flex-none [&>svg]:h-full [&>svg]:w-full">
            <Mark />
          </span>
          <span className="flex min-w-0 flex-col gap-1 leading-none">
            <span className="text-[0.6rem] uppercase tracking-[0.2em] text-muted">Лига · PUBG Mobile</span>
            <span className="truncate font-display text-xl uppercase">Ultimate Royale</span>
          </span>
        </div>
      </WidgetFrame>
    );
  }
  return (
    <WidgetFrame instance={instance}>
      <img
        src={url}
        alt=""
        className="block object-contain"
        style={{
          width: instance.w ? "100%" : "auto",
          height: instance.h ? "100%" : "auto",
          maxWidth: instance.w ? "100%" : 360,
          maxHeight: instance.h ? "100%" : 180,
        }}
      />
    </WidgetFrame>
  );
}
