"use client";

import type { CatalogLegendary, CatalogTask, MapInfo } from "@/lib/types";

export const KIND_LABEL: Record<string, string> = {
  pve: "PvE",
  pvp: "PvP",
  pvpve: "PvPvE",
};

/** Номер в справочнике и подпись для показа и поиска: название в кавычках, затем текст. */
function numbered<T extends { text: string; name?: string }>(items: T[]): Array<T & { num: number; label: string }> {
  return items.map((t, i) => ({ ...t, num: i + 1, label: t.name ? `«${t.name}» — ${t.text}` : t.text }));
}

/** Фильтр по номеру (точное/префикс) или подстроке текста. */
function matches(it: { num: number; label: string }, q: string): boolean {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  return String(it.num) === s || String(it.num).startsWith(s) || it.label.toLowerCase().includes(s);
}

/** Справочник для показа: задания пула по картам (общие первыми), протоколы и легендарные.
    Номера идут подряд в порядке показа - по ним ищут задание. */
export function rulesCatalog(tasks: CatalogTask[], legendary: CatalogLegendary[], maps: MapInfo[], pool: "pvp" | "pve", q: string) {
  const active = tasks.filter((t) => t.active);
  const groupOrder = ["", ...maps.map((m) => m.code)];
  // Задание на нескольких картах стоит в группе каждой своей карты, со своим номером.
  const poolTasks = numbered(
    active
      .filter((t) => t.category !== "protocol" && (t.kind === pool || t.kind === "pvpve"))
      .flatMap((t) => (t.mapCodes.length ? t.mapCodes : [""]).map((mapCode) => ({ ...t, mapCode })))
      .filter((t) => groupOrder.includes(t.mapCode))
      .sort((x, y) => groupOrder.indexOf(x.mapCode) - groupOrder.indexOf(y.mapCode)),
  );
  return {
    groups: groupOrder
      .map((code) => ({ code, items: poolTasks.filter((t) => t.mapCode === code && matches(t, q)) }))
      .filter((g) => g.items.length),
    protocols: numbered(active.filter((t) => t.category === "protocol")).filter((t) => matches(t, q)),
    legendary: numbered(legendary).filter((l) => matches(l, q)),
  };
}
