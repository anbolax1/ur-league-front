"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { api, errorText } from "@/lib/api";
import { TOKEN_HINT, TOKEN_KINDS, TOKEN_LABEL } from "@/lib/tokens";
import { fullDate } from "@/components/surface/fmt";
import type { MyTokens, TokenWallet } from "@/lib/types";

// Сколько держать кнопку сброса: случайное нажатие рейтинг не обнулит.
const HOLD_MS = 5000;

/** Кнопка, которую нужно удерживать: пока держат, она заливается, отпустил - заливка пропала. */
function HoldButton({ disabled, onDone, children }: { disabled: boolean; onDone: () => void; children: React.ReactNode }) {
  const [p, setP] = React.useState(0);
  const start = React.useRef(0);
  const frame = React.useRef(0);

  const stop = React.useCallback(() => {
    cancelAnimationFrame(frame.current);
    start.current = 0;
    setP(0);
  }, []);

  const begin = () => {
    if (disabled || start.current) return;
    start.current = performance.now();
    const tick = (now: number) => {
      const k = Math.min(1, (now - start.current) / HOLD_MS);
      setP(k);
      if (k >= 1) {
        start.current = 0;
        onDone();
        return;
      }
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
  };

  React.useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const left = Math.ceil((HOLD_MS * (1 - p)) / 1000);
  const label = p >= 1 ? "Сбрасываем…" : p > 0 ? `Держите… ${left}` : children;
  return (
    <button
      type="button"
      className="sf-btn sf-btn-line pf-hold"
      style={{ "--p": p } as React.CSSProperties}
      disabled={disabled}
      aria-describedby="pf-reset-note"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        begin();
      }}
      onPointerUp={stop}
      onPointerCancel={stop}
      onLostPointerCapture={stop}
      onKeyDown={(e) => {
        if ((e.key === " " || e.key === "Enter") && !e.repeat) {
          e.preventDefault();
          begin();
        }
      }}
      onKeyUp={stop}
      onContextMenu={(e) => e.preventDefault()}
    >
      <span>{label}</span>
    </button>
  );
}

/** Сколько у игрока жетонов и что с ними делать; сброс рейтинга игрок подтверждает удержанием кнопки. */
export function ProfileTokens({ wallet: initial }: { wallet?: TokenWallet }) {
  const router = useRouter();
  const [extra, setExtra] = React.useState<MyTokens | null>(null);
  const wallet: TokenWallet = extra?.tokens ?? initial ?? { double: 0, priority: 0, reset: 0 };
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState<{ ok: boolean; text: string } | null>(null);

  React.useEffect(() => {
    let live = true;
    api
      .get<MyTokens>("/me/tokens")
      .then((v) => live && setExtra(v))
      .catch(() => {
        /* без причин блокировки кнопка просто остаётся доступной, сервер всё равно проверит */
      });
    return () => {
      live = false;
    };
  }, []);

  async function reset() {
    setBusy(true);
    setMsg(null);
    try {
      await api.post<TokenWallet>("/me/reset");
      setMsg({ ok: true, text: `Рейтинг сброшен: MMR снова ${extra?.startMmr ?? "стартовый"}.` });
      router.refresh();
    } catch (err) {
      setMsg({ ok: false, text: errorText(err, "Не удалось сбросить рейтинг.") });
    } finally {
      setBusy(false);
    }
  }

  const count: Record<(typeof TOKEN_KINDS)[number], number> = { double: wallet.double, priority: wallet.priority, reset: wallet.reset };
  const blocked = extra?.resetBlocked;
  const note =
    msg?.text ??
    (wallet.reset < 1
      ? "Жетонов полного сброса нет - их выдают модераторы и организатор."
      : blocked
        ? `Сейчас нельзя: ${blocked}.`
        : `MMR 1×1 в этом сезоне станет ${extra?.startMmr ?? "стартовым"}${extra ? ` вместо ${extra.mmr}` : ""}. Матчи и нашивки останутся. Удерживайте кнопку 5 секунд.`);

  return (
    <div className="sf-field pf-wide pf-tokens">
      <p className="sf-field-label">Жетоны</p>
      <ul className="pf-token-list">
        {TOKEN_KINDS.map((k) => (
          <li key={k}>
            <b className="pf-token-n">{count[k]}</b>
            <span>
              <b>{TOKEN_LABEL[k]}</b>
              <small>{TOKEN_HINT[k]}</small>
            </span>
          </li>
        ))}
      </ul>
      <p className="sf-field-note">
        Жетоны выдают модераторы и организатор. «Двойной рейтинг» и «Без очереди» активирует ведущий по твоей просьбе
        {wallet.priorityUntil ? ` · «Без очереди» действует до конца игрового дня` : ""}.
      </p>
      <div className="pf-reset">
        <p className="sf-field-label">Сброс рейтинга{wallet.lastReset ? ` · последний ${fullDate(wallet.lastReset)}` : ""}</p>
        <div className="pf-reset-row">
          <HoldButton disabled={busy || wallet.reset < 1 || !!blocked || msg?.ok === true} onDone={reset}>
            {msg?.ok ? "Рейтинг сброшен" : "Сбросить"}
          </HoldButton>
        </div>
        <p id="pf-reset-note" className={`sf-field-note ${msg ? (msg.ok ? "good" : "bad") : ""}`} aria-live="polite">
          {note}
        </p>
      </div>
    </div>
  );
}
