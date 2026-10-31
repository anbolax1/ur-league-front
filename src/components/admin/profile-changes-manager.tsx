"use client";

import * as React from "react";
import { api, errorText } from "@/lib/api";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { Panel } from "@/components/ui/card";
import { fmtDate } from "@/lib/format";
import type { ProfileChange } from "@/lib/types";

/** Проверка заявок игроков на смену фото и ника: одобрить или отклонить с причиной. Доступна модератору и организатору. */
export function ProfileChangesManager() {
  const [items, setItems] = React.useState<ProfileChange[] | null>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [rejecting, setRejecting] = React.useState<string | null>(null);
  const [reason, setReason] = React.useState("");
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    let active = true;
    api
      .get<ProfileChange[]>("/profile-changes")
      .then((list) => active && setItems(list))
      .catch((e) => {
        if (!active) return;
        setItems([]);
        setError(errorText(e, "Не удалось загрузить заявки."));
      });
    return () => {
      active = false;
    };
  }, []);

  async function decide(c: ProfileChange, approve: boolean) {
    setBusyId(c.id);
    setError("");
    try {
      await api.post(`/profile-changes/${c.id}/decide`, { approve, reason: approve ? "" : reason.trim() });
      setItems((list) => (list ?? []).filter((x) => x.id !== c.id));
      setRejecting(null);
      setReason("");
    } catch (e) {
      setError(errorText(e, "Не удалось сохранить решение."));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h2 className="text-2xl">Проверка профилей</h2>
        <p className="text-sm text-muted">
          Новые фото и ники, которые игроки хотят поставить на сайт. После одобрения они сразу заменят прежние. При отказе игрок увидит
          причину в своём профиле.
        </p>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      {items === null ? (
        <Panel className="px-5 py-10 text-center text-muted">Загрузка…</Panel>
      ) : !items.length ? (
        <EmptyState title="Заявок нет" hint="Все фото и ники проверены." />
      ) : (
        <ul className="space-y-3">
          {items.map((c) => (
            <li key={c.id} className="panel p-4">
              <div className="flex flex-wrap items-start gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar name={c.userDisplayName || c.userLogin || "Игрок"} src={c.userAvatarUrl} size="sm" />
                  <div className="min-w-0">
                    <div className="truncate font-display text-sm uppercase">{c.userDisplayName || c.userLogin}</div>
                    <div className="truncate text-xs text-muted">
                      @{c.userLogin} · {fmtDate(c.createdAt)}
                    </div>
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  {c.kind === "name" ? (
                    <p className="text-sm">
                      <span className="text-muted">Новый ник: </span>
                      <b className="font-display uppercase">{c.value}</b>
                    </p>
                  ) : (
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted">Новое фото:</span>
                      {/* eslint-disable-next-line @next/next/no-img-element -- фото из хранилища медиа */}
                      <img src={c.value} alt="Новое фото профиля" className="h-32 w-32 rounded-md object-cover" />
                    </div>
                  )}
                </div>
                <div className="flex flex-none flex-wrap gap-2">
                  <button type="button" className="btn btn-primary btn-sm" disabled={busyId === c.id} onClick={() => decide(c, true)}>
                    <span>Одобрить</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    disabled={busyId === c.id}
                    onClick={() => {
                      setRejecting(rejecting === c.id ? null : c.id);
                      setReason("");
                    }}
                  >
                    <span>Отклонить</span>
                  </button>
                </div>
              </div>
              {rejecting === c.id && (
                <form
                  className="mt-3 flex flex-wrap gap-2 border-t border-[var(--border)] pt-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void decide(c, false);
                  }}
                >
                  <input
                    className="input min-w-0 flex-1"
                    placeholder="Причина отказа (игрок увидит её в профиле)"
                    maxLength={300}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    autoFocus
                  />
                  <button type="submit" className="btn btn-danger btn-sm" disabled={busyId === c.id}>
                    <span>Отклонить заявку</span>
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
