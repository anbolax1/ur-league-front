/** Подложка превью оверлея: кадр PUBG Mobile в режиме наблюдения за тиммейтом - в поле или в городе,
    чтобы оценить читаемость поверх игры. На OBS не влияет. */
export type PreviewBg = "field" | "town" | "checker" | "off";

const IMAGES = { field: "/preview-field.jpg", town: "/preview-town.jpg" } as const;

// Клетка 40 px сцены в долях её размера: шахматка одинакова и в редакторе, и в маленьком превью пульта.
const CHECKER = "repeating-conic-gradient(#3a3a42 0% 25%, #24242b 0% 50%) 0 0 / 4.1667% 7.4074%";

const OPTIONS: Array<[PreviewBg, string]> = [
  ["field", "Поле"],
  ["town", "Город"],
  ["checker", "Шахматка"],
  ["off", "Выкл"],
];

/** Где на экране наблюдения стоит интерфейс игры (px сцены 1920×1080): виджеты лучше ставить мимо. */
const GAME_ZONES: Array<{ label: string; x: number; y: number; w: number; h: number }> = [
  { label: "Живые и киллы", x: 0, y: 0, w: 500, h: 60 },
  { label: "Отряд", x: 0, y: 66, w: 290, h: 232 },
  { label: "Компас", x: 600, y: 0, w: 720, h: 106 },
  { label: "Карта, зона, кнопки", x: 1470, y: 0, w: 450, h: 400 },
  { label: "Exit", x: 40, y: 944, w: 272, h: 92 },
  { label: "Наблюдение и здоровье", x: 640, y: 880, w: 630, h: 196 },
  { label: "Игрок и Switch", x: 1370, y: 954, w: 520, h: 82 },
];

export function PreviewBgLayer({ bg }: { bg: PreviewBg }) {
  if (bg === "off") return null;
  if (bg === "checker") return <div aria-hidden className="absolute inset-0" style={{ background: CHECKER }} />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={IMAGES[bg]} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover" />;
}

/** Зоны интерфейса игры поверх превью - рамками с подписью. */
export function GameZonesLayer() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {GAME_ZONES.map((z) => (
        <div
          key={z.label}
          className="absolute border-2 border-dashed border-[rgba(238,90,66,0.9)] bg-[rgba(238,90,66,0.12)]"
          style={{ left: `${(z.x / 1920) * 100}%`, top: `${(z.y / 1080) * 100}%`, width: `${(z.w / 1920) * 100}%`, height: `${(z.h / 1080) * 100}%` }}
        >
          <span className="absolute bottom-1 left-1 bg-[rgba(200,50,35,0.9)] px-1.5 py-0.5 text-[0.6rem] uppercase tracking-wide text-white">
            {z.label}
          </span>
        </div>
      ))}
    </div>
  );
}

export function PreviewBgSwitch({
  value,
  onChange,
  label = "Фон игры в превью:",
}: {
  value: PreviewBg;
  onChange: (v: PreviewBg) => void;
  label?: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-xs text-muted">{label}</span>
      <div className="seg">
        {OPTIONS.map(([k, text]) => (
          <button key={k} type="button" className="seg-btn" aria-pressed={value === k} onClick={() => onChange(k)}>
            <span>{text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
