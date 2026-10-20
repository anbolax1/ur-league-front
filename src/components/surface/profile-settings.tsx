"use client";

import * as React from "react";
import type { CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { api, errorText } from "@/lib/api";
import type { User, UserTag } from "@/lib/types";

// Игровой ID PUBG Mobile - одни цифры (пробелы, как на экране профиля в игре, не мешают).
const GAME_ID_RE = /^\d{6,12}$/;
const MAX_NICK = 32;

const digits = (v: string) => v.replace(/\s+/g, "");
const oneLine = (v: string) => v.trim().replace(/\s+/g, " ");

/** Игровой ID и ник для группы в PUBG Mobile: после сохранения карточка перерисуется с новыми. */
function GameFields({ initialId, initialNick }: { initialId: string; initialNick: string }) {
  const router = useRouter();
  const [id, setId] = React.useState(initialId);
  const [nick, setNick] = React.useState(initialNick);
  const [saved, setSaved] = React.useState({ id: initialId, nick: initialNick });
  const [status, setStatus] = React.useState<"idle" | "saving" | "ok" | "error">("idle");
  const [error, setError] = React.useState("");
  const cleanId = digits(id);
  const cleanNick = oneLine(nick);
  const dirty = cleanId !== saved.id || cleanNick !== saved.nick;
  const badId = cleanId.length > 0 && !GAME_ID_RE.test(cleanId);
  const badNick = cleanNick.length > MAX_NICK;
  const invalid = badId || badNick;
  const done = status === "ok" && !dirty;

  function touch() {
    if (status !== "idle") setStatus("idle");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!dirty || invalid) return;
    setStatus("saving");
    setError("");
    try {
      const u = await api.patch<User>("/me", { gameId: cleanId, gameNick: cleanNick });
      setSaved({ id: u.gameId ?? "", nick: u.gameNick ?? "" });
      setId(u.gameId ?? "");
      setNick(u.gameNick ?? "");
      setStatus("ok");
      router.refresh();
    } catch (err) {
      setStatus("error");
      setError(errorText(err, "Не удалось сохранить."));
    }
  }

  return (
    <form className="sf-field" onSubmit={onSubmit}>
      <div className="pf-game">
        <label className="sf-field-label" htmlFor="pf-game-id">
          Игровой ID
        </label>
        <label className="sf-field-label" htmlFor="pf-game-nick">
          Ник в игре
        </label>
        <input
          id="pf-game-id"
          className="sf-input"
          inputMode="numeric"
          placeholder="5123456789"
          autoComplete="off"
          spellCheck={false}
          aria-invalid={badId}
          aria-describedby="pf-game-note"
          value={id}
          onChange={(e) => {
            setId(e.target.value);
            touch();
          }}
        />
        <input
          id="pf-game-nick"
          className="sf-input"
          placeholder="Ник в PUBG Mobile"
          autoComplete="off"
          spellCheck={false}
          aria-invalid={badNick}
          aria-describedby="pf-game-note"
          value={nick}
          onChange={(e) => {
            setNick(e.target.value);
            touch();
          }}
        />
        <button type="submit" className="sf-btn sf-btn-amber sf-btn-sm" disabled={!dirty || invalid || status === "saving"}>
          {status === "saving" ? "Сохраняем…" : "Сохранить"}
        </button>
      </div>
      <p id="pf-game-note" className={`sf-field-note ${invalid || status === "error" ? "bad" : done ? "good" : ""}`} aria-live="polite">
        {badId
          ? "Игровой ID — только цифры, от 6 до 12."
          : badNick
            ? `Ник в игре — до ${MAX_NICK} символов.`
            : status === "error"
              ? error
              : done
                ? "Сохранено"
                : "ID — в профиле PUBG Mobile, под ником. По нему ведущий позовёт тебя в группу, оба подставятся в заявки."}
      </p>
    </form>
  );
}

/** Какие свои теги показывать в профиле; тег, скрытый организатором, включить нельзя. */
function TagToggles({ initial }: { initial: UserTag[] }) {
  const router = useRouter();
  const [tags, setTags] = React.useState(initial);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");

  async function toggle(t: UserTag) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      setTags(await api.put<UserTag[]>(`/me/tags/${t.id}`, { hidden: !t.hiddenByUser }));
      router.refresh();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="sf-field">
      <p className="sf-field-label" id="pf-tags">
        Теги в профиле
      </p>
      {tags.length ? (
        <div className="pf-tagset" role="group" aria-labelledby="pf-tags" aria-busy={busy}>
          {tags.map((t) => (
            <button
              key={t.id}
              type="button"
              className="pf-tagbtn"
              style={{ "--tag": t.color || undefined } as CSSProperties}
              aria-pressed={t.visible && !t.hiddenByUser}
              disabled={!t.visible}
              title={t.visible ? undefined : "Скрыт организатором"}
              onClick={() => toggle(t)}
            >
              <i aria-hidden />
              {t.name}
            </button>
          ))}
        </div>
      ) : (
        <p className="sf-field-note">Тегов пока нет.</p>
      )}
      {tags.length > 0 && (
        <p className={`sf-field-note ${error ? "bad" : ""}`} aria-live="polite">
          {error ||
            `Нажми на тег, чтобы убрать его с пропуска или вернуть.${tags.some((t) => !t.visible) ? " Бледные скрыл организатор." : ""}`}
        </p>
      )}
    </div>
  );
}

/** Настройки своего профиля под пропуском рейдера. */
export function ProfileSettings({ gameId, gameNick, tags }: { gameId: string; gameNick: string; tags: UserTag[] }) {
  return (
    <section className="pf-desk" aria-label="Настройки профиля">
      <GameFields initialId={gameId} initialNick={gameNick} />
      <TagToggles initial={tags} />
    </section>
  );
}
