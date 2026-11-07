"use client";

import Link from "next/link";
import type { User } from "@/lib/types";
import { useAuthForm } from "@/components/domain/auth-form";
import { useClaimForm } from "@/components/domain/claim-form";
import { useJoinRequest } from "@/components/domain/register-form";

/** Вход или регистрация по логину и паролю. */
export function SurfaceAuthForm({ mode, redirectTo }: { mode: "login" | "register"; redirectTo?: string }) {
  const isRegister = mode === "register";
  const f = useAuthForm(mode, redirectTo);

  return (
    <form className="au-form" onSubmit={f.onSubmit}>
      <div className="sf-field">
        <label className="sf-field-label" htmlFor="au-login">
          Логин
        </label>
        <input
          id="au-login"
          name="username"
          className="sf-input"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          maxLength={32}
          placeholder="например, nova_07"
          value={f.login}
          onChange={(e) => f.setLogin(e.target.value)}
          required
        />
        {isRegister && <p className="sf-field-note">3–32 символа: латиница, цифры и подчёркивание</p>}
      </div>
      <div className="sf-field">
        <label className="sf-field-label" htmlFor="au-password">
          Пароль
        </label>
        <input
          id="au-password"
          name="password"
          type="password"
          className="sf-input"
          autoComplete={isRegister ? "new-password" : "current-password"}
          maxLength={128}
          placeholder={isRegister ? "минимум 8 символов" : "••••••••"}
          value={f.password}
          onChange={(e) => f.setPassword(e.target.value)}
          required
        />
      </div>
      {isRegister && (
        <div className="sf-field">
          <label className="sf-field-label" htmlFor="au-confirm">
            Повтори пароль
          </label>
          <input
            id="au-confirm"
            name="confirm-password"
            type="password"
            className="sf-input"
            autoComplete="new-password"
            maxLength={128}
            placeholder="ещё раз"
            value={f.confirm}
            onChange={(e) => f.setConfirm(e.target.value)}
            required
          />
        </div>
      )}
      {f.error && (
        <p className="sf-field-note bad" role="alert">
          {f.error}
        </p>
      )}
      <button type="submit" className="sf-btn sf-btn-amber au-submit" disabled={f.sending}>
        {f.sending ? "Подождите…" : isRegister ? "Зарегистрироваться" : "Войти"}
      </button>
      <p className="au-switch">
        {isRegister ? (
          <>
            Уже есть аккаунт? <Link href="/login">Войти</Link>
          </>
        ) : (
          <>
            Нет аккаунта? <Link href="/register">Регистрация</Link>
          </>
        )}
      </p>
    </form>
  );
}

/** Пароль для аккаунта с историей матчей - по одноразовой ссылке от организатора. */
export function SurfaceClaimForm({ token, login }: { token: string; login: string }) {
  const f = useClaimForm(token);

  return (
    <form className="au-form" onSubmit={f.submit}>
      <div className="sf-field">
        <label className="sf-field-label" htmlFor="au-claim-pass">
          Новый пароль
        </label>
        <input
          id="au-claim-pass"
          type="password"
          className="sf-input"
          autoComplete="new-password"
          placeholder="не короче 8 символов"
          value={f.password}
          onChange={(e) => f.setPassword(e.target.value)}
        />
      </div>
      <div className="sf-field">
        <label className="sf-field-label" htmlFor="au-claim-pass2">
          Повтори пароль
        </label>
        <input id="au-claim-pass2" type="password" className="sf-input" autoComplete="new-password" value={f.confirm} onChange={(e) => f.setConfirm(e.target.value)} />
      </div>
      {f.error && (
        <p className="sf-field-note bad" role="alert">
          {f.error}
        </p>
      )}
      <button type="submit" className="sf-btn sf-btn-amber au-submit" disabled={f.busy}>
        {f.busy ? "Активируем…" : "Задать пароль и войти"}
      </button>
      <p className="au-switch">
        Логин для входа: <b>@{login}</b>
      </p>
    </form>
  );
}

/** Анкета заявки в общий пул: ник, ID, ранг и статистика из игры, удобное время. */
export function SurfaceJoinForm({ user }: { user: User }) {
  const f = useJoinRequest(user);

  if (f.status === "ok") {
    return (
      <div className="au-done" role="status">
        <span className="au-ok" aria-hidden>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="m5 12 5 5 9-10" />
          </svg>
        </span>
        <h2 className="sf-h-up">
          заявка в пуле
        </h2>
        <p className="au-text">
          Ты в общем списке участников. Теперь встань в очередь: ведущий приглашает на стриме в порядке очереди, статус заявки виден в
          профиле.
        </p>
        <div className="au-actions">
          <Link className="sf-btn sf-btn-ink" href="/queue">
            Встать в очередь
          </Link>
          <Link className="sf-btn sf-btn-ink-line" href="/profile">
            В профиль
          </Link>
          <button type="button" className="sf-btn sf-btn-ink-line" onClick={() => f.setStatus("idle")}>
            Изменить заявку
          </button>
        </div>
      </div>
    );
  }

  return (
    <form className="au-form" onSubmit={f.onSubmit}>
      <p className="au-text">
        Вошёл как <b>{user.displayName || user.login}</b>. Заполни анкету из своего профиля в PUBG Mobile — по ней ведущий подберёт тебе
        состав. После заявки встань в очередь: ведущий приглашает на стриме в порядке очереди.
      </p>
      <div className="au-pair">
        <div className="sf-field">
          <label className="sf-field-label" htmlFor="au-nick">
            Игровой ник
          </label>
          <input
            id="au-nick"
            className="sf-input"
            maxLength={32}
            required
            placeholder="Как тебя зовут в игре"
            value={f.gameNick}
            onChange={(e) => f.setGameNick(e.target.value)}
          />
        </div>
        <div className="sf-field">
          <label className="sf-field-label" htmlFor="au-gid">
            PUBG Mobile ID
          </label>
          <input
            id="au-gid"
            className="sf-input"
            inputMode="numeric"
            required
            placeholder="От 6 до 12 цифр"
            aria-invalid={f.bad.gameId}
            value={f.gameId}
            onChange={(e) => f.setGameId(e.target.value)}
          />
        </div>
      </div>
      <div className="au-pair">
        <div className="sf-field">
          <label className="sf-field-label" htmlFor="au-rank">
            Ранг
          </label>
          <input
            id="au-rank"
            className="sf-input"
            maxLength={40}
            placeholder="Впиши свой ранг в игре"
            value={f.rank}
            onChange={(e) => f.setRank(e.target.value)}
          />
        </div>
        <div className="sf-field">
          <label className="sf-field-label" htmlFor="au-kd">
            K/D
          </label>
          <input
            id="au-kd"
            className="sf-input"
            inputMode="decimal"
            placeholder="Например, 2,4"
            aria-invalid={f.bad.kd}
            value={f.kd}
            onChange={(e) => f.setKd(e.target.value)}
          />
        </div>
      </div>
      <div className="au-trio">
        <div className="sf-field">
          <label className="sf-field-label" htmlFor="au-matches">
            Матчей
          </label>
          <input
            id="au-matches"
            className="sf-input"
            inputMode="numeric"
            aria-invalid={f.bad.matches}
            value={f.matches}
            onChange={(e) => f.setMatches(e.target.value)}
          />
        </div>
        <div className="sf-field">
          <label className="sf-field-label" htmlFor="au-wins">
            Побед
          </label>
          <input
            id="au-wins"
            className="sf-input"
            inputMode="numeric"
            aria-invalid={f.bad.wins}
            value={f.wins}
            onChange={(e) => f.setWins(e.target.value)}
          />
        </div>
        <div className="sf-field">
          <label className="sf-field-label" htmlFor="au-kills">
            Убийств
          </label>
          <input
            id="au-kills"
            className="sf-input"
            inputMode="numeric"
            aria-invalid={f.bad.kills}
            value={f.kills}
            onChange={(e) => f.setKills(e.target.value)}
          />
        </div>
      </div>
      <p className={`sf-field-note${f.winsOverMatches ? " bad" : ""}`} role={f.winsOverMatches ? "alert" : undefined}>
        {f.winsOverMatches
          ? "Побед не может быть больше, чем матчей."
          : "Матчи, победы и убийства — из статистики профиля за сезон или за всё время, как удобнее."}
      </p>
      <div className="sf-field">
        <label className="sf-field-label" htmlFor="au-time">
          Удобное время игры
        </label>
        <textarea
          id="au-time"
          className="sf-input"
          rows={3}
          maxLength={300}
          placeholder="Например: будни после 19:00 по Москве, в выходные весь день."
          value={f.playTime}
          onChange={(e) => f.setPlayTime(e.target.value)}
        />
      </div>
      {f.status === "error" && (
        <p className="sf-field-note bad" role="alert">
          {f.error}
        </p>
      )}
      <button type="submit" className="sf-btn sf-btn-amber au-submit" disabled={f.status === "sending" || !f.valid}>
        {f.status === "sending" ? "Отправляем…" : "Подать заявку"}
      </button>
    </form>
  );
}
