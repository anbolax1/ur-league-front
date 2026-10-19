"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { api, errorText } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { User } from "@/lib/types";

/* Вход и регистрация по логину и паролю. mode переключает набор полей
   (подтверждение пароля только при регистрации) и эндпоинт. После успеха обновляем
   контекст авторизации (refresh) и SSR-данные (router.refresh) и уходим на target. */

const LOGIN_RE = /^[A-Za-z0-9_]{3,32}$/;
const MIN_PASSWORD = 8;

/** Вход и регистрация: проверки полей, запрос и переход после успеха. */
export function useAuthForm(mode: "login" | "register", redirectTo?: string) {
  const isRegister = mode === "register";
  const router = useRouter();
  const { refresh } = useAuth();

  const [login, setLogin] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const l = login.trim();

    if (isRegister) {
      if (!LOGIN_RE.test(l)) {
        setError("Логин: 3–32 символа, латиница, цифры и подчёркивание.");
        return;
      }
      if (password.length < MIN_PASSWORD) {
        setError("Пароль должен быть не короче 8 символов.");
        return;
      }
      // Лимит bcrypt — 72 байта (для не-ASCII символ может быть >1 байта).
      if (new TextEncoder().encode(password).length > 72) {
        setError("Пароль слишком длинный (не более 72 байт).");
        return;
      }
      if (password !== confirm) {
        setError("Пароли не совпадают.");
        return;
      }
    } else if (!l || !password) {
      setError("Укажите логин и пароль.");
      return;
    }

    setSending(true);
    try {
      await api.post<User>(isRegister ? "/auth/register" : "/auth/login", {
        login: l,
        password,
      });
      await refresh();
      router.push(redirectTo || (isRegister ? "/profile" : "/"));
      router.refresh();
    } catch (err) {
      setError(errorText(err, "Не удалось выполнить вход. Попробуйте ещё раз."));
      setSending(false);
    }
  }

  return { login, setLogin, password, setPassword, confirm, setConfirm, sending, error, onSubmit };
}
