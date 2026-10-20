import Link from "next/link";
import { Mark, Wordmark } from "@/components/surface/brand";

/** Сезон для ссылки на его итоги: идущий, а между сезонами - последний. */
export interface FooterSeason {
  number: number;
  active: boolean;
}

const LEAGUE = [
  { href: "/schedule", label: "Матчи" },
  { href: "/archive", label: "Результаты" },
  { href: "/rating", label: "Рейтинг" },
  { href: "/rules", label: "Правила" },
  { href: "/highlights", label: "Лучшие моменты" },
];

function more(season?: FooterSeason | null) {
  return [
    { href: "/news", label: "Новости" },
    { href: "/patches", label: "Нашивки" },
    { href: "/belt", label: "Пояс лиги" },
    ...(season ? [{ href: `/season/${season.number}`, label: season.active ? "Сезон в цифрах" : "Итоги сезона" }] : []),
  ];
}

export function SurfaceFooter({ season }: { season?: FooterSeason | null }) {
  return (
    <footer className="sf-foot">
      <div className="sf-wrap">
        <div className="sf-foot-in">
          <div>
            <Link href="/" className="sf-brand" aria-label="Лига Ultimate Royale, на главную">
              <Mark />
              <Wordmark />
            </Link>
            <p>Соло против сквадов в прямом эфире: матчи 1×1, 2×2 и 3×3, рейтинг MMR, шоу-матчи и пояс лиги.</p>
          </div>
          <div>
            <h3>Лига</h3>
            <nav aria-label="Лига">
              {LEAGUE.map((l) => (
                <Link key={l.href} href={l.href}>
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
          <div>
            <h3>Ещё</h3>
            <nav aria-label="Ещё">
              {more(season).map((l) => (
                <Link key={l.href} href={l.href}>
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
        <div className="sf-legal">
          <p>© {new Date().getFullYear()} Лига Ultimate Royale. Фанатский проект, не связан с KRAFTON и Level Infinite.</p>
          <p>
            Разработка и поддержка — <Link href="/profile/Istwood">Istwood</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
