"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { api, apiFetch, errorText } from "@/lib/api";
import type { ProfileChange, User } from "@/lib/types";

const MAX_MB = 5;
const ACCEPT = "image/jpeg,image/png,image/webp,image/gif";
const MIN_NICK = 2;
const MAX_NICK = 24;

const oneLine = (v: string) => v.trim().replace(/\s+/g, " ");

/** Статус заявки одной строкой: что отправлено и что ответили проверяющие. */
function ChangeRow({ c, onCancel, busy }: { c: ProfileChange; onCancel: (id: string) => void; busy: boolean }) {
  const what = c.kind === "name" ? `Ник «${c.value}»` : "Новое фото";
  return (
    <li className={`pf-change ${c.status}`}>
      {c.kind === "avatar" && (
        // eslint-disable-next-line @next/next/no-img-element -- фото из хранилища медиа
        <img className="pf-change-img" src={c.value} alt="" />
      )}
      <span>
        <b>{what}</b>
        <small>
          {c.status === "pending" && "на проверке у модератора"}
          {c.status === "approved" && "одобрено"}
          {c.status === "rejected" && `отклонено${c.reason ? `: ${c.reason}` : ""}`}
        </small>
      </span>
      {c.status === "pending" && (
        <button type="button" className="sf-btn sf-btn-sm sf-btn-line" disabled={busy} onClick={() => onCancel(c.id)}>
          Отменить
        </button>
      )}
    </li>
  );
}

/** Фото и ник на сайте: у игрока уходят на проверку модератору, у модератора и организатора меняются сразу. */
export function ProfileIdentity({ user, changes: initial }: { user: User; changes: ProfileChange[] }) {
  const router = useRouter();
  const instant = user.role === "moderator" || user.role === "superadmin";
  const [changes, setChanges] = React.useState(initial);
  const [nick, setNick] = React.useState(user.displayName || user.login);
  const [busy, setBusy] = React.useState(false);
  const [note, setNote] = React.useState<{ text: string; bad: boolean } | null>(null);
  const fileId = React.useId();

  const clean = oneLine(nick);
  const nickBad = clean.length < MIN_NICK || clean.length > MAX_NICK;
  const nickDirty = clean !== (user.displayName || user.login);
  const pendingName = changes.find((c) => c.kind === "name" && c.status === "pending");

  async function reload() {
    try {
      setChanges(await api.get<ProfileChange[]>("/me/profile-changes"));
    } catch {
      /* список заявок не критичен */
    }
    router.refresh();
  }

  async function run(fn: () => Promise<{ applied?: boolean } | unknown>, sent: string, applied: string) {
    setBusy(true);
    setNote(null);
    try {
      const res = (await fn()) as { applied?: boolean } | undefined;
      setNote({ text: res?.applied ? applied : sent, bad: false });
      await reload();
    } catch (e) {
      setNote({ text: errorText(e, "Не удалось сохранить."), bad: true });
    } finally {
      setBusy(false);
    }
  }

  function pickFile(f?: File) {
    if (!f) return;
    if (f.size > MAX_MB * 1024 * 1024) {
      setNote({ text: `Файл больше ${MAX_MB} МБ.`, bad: true });
      return;
    }
    void run(
      () =>
        apiFetch(`/me/avatar`, {
          method: "POST",
          body: f,
          headers: { "Content-Type": f.type || "application/octet-stream" },
        }),
      "Фото отправлено на проверку. Оно появится на сайте после одобрения.",
      "Фото обновлено.",
    );
  }

  function cancel(id: string) {
    void run(() => api.del(`/me/profile-changes/${id}`), "Заявка отменена.", "Заявка отменена.");
  }

  return (
    <div className="sf-field pf-ident">
      <p className="sf-field-label">Фото и ник на сайте</p>
      <div className="pf-ident-row">
        <span className="pf-ident-photo" aria-hidden>
          {user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- фото из хранилища медиа
            <img src={user.avatarUrl} alt="" />
          ) : (
            <b>{(user.displayName || user.login).slice(0, 1).toUpperCase()}</b>
          )}
        </span>
        <div className="pf-ident-actions">
          <label htmlFor={fileId} className={`sf-btn sf-btn-sm sf-btn-line ${busy ? "is-disabled" : ""}`}>
            {user.avatarUrl ? "Заменить фото" : "Загрузить фото"}
            <input
              id={fileId}
              type="file"
              accept={ACCEPT}
              className="sr-only"
              disabled={busy}
              onChange={(e) => {
                pickFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </label>
          {user.avatarUrl && (
            <button
              type="button"
              className="sf-btn sf-btn-sm sf-btn-line"
              disabled={busy}
              onClick={() => run(() => api.del(`/me/avatar`), "Фото убрано.", "Фото убрано.")}
            >
              Убрать фото
            </button>
          )}
        </div>
      </div>
      <form
        className="pf-ident-nick"
        onSubmit={(e) => {
          e.preventDefault();
          if (nickBad || !nickDirty) return;
          void run(() => api.post(`/me/name`, { name: clean }), "Ник отправлен на проверку.", "Ник изменён.");
        }}
      >
        <label className="sf-field-label" htmlFor="pf-nick">
          Ник
        </label>
        <input
          id="pf-nick"
          className="sf-input"
          maxLength={MAX_NICK + 8}
          autoComplete="off"
          aria-invalid={nickDirty && nickBad}
          value={nick}
          onChange={(e) => setNick(e.target.value)}
        />
        <button type="submit" className="sf-btn sf-btn-amber sf-btn-sm" disabled={busy || nickBad || !nickDirty}>
          {instant ? "Сменить" : pendingName ? "Заменить заявку" : "Отправить на проверку"}
        </button>
      </form>
      <p className={`sf-field-note ${note?.bad ? "bad" : ""}`} aria-live="polite">
        {note?.text ??
          (instant
            ? `Фото до ${MAX_MB} МБ, ник от ${MIN_NICK} до ${MAX_NICK} знаков. У модераторов и организаторов изменения применяются сразу.`
            : `Фото до ${MAX_MB} МБ, ник от ${MIN_NICK} до ${MAX_NICK} знаков. Изменения появятся на сайте после проверки модератором или организатором. Логин для входа не меняется.`)}
      </p>
      {changes.length > 0 && (
        <ul className="pf-changes" aria-label="Мои заявки на смену фото и ника">
          {changes.map((c) => (
            <ChangeRow key={c.id} c={c} onCancel={cancel} busy={busy} />
          ))}
        </ul>
      )}
    </div>
  );
}
