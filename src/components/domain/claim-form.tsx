"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { api, errorText } from "@/lib/api";

/** Активация аккаунта по одноразовой ссылке: проверка пароля, запрос и вход. */
export function useClaimForm(token: string) {
  const router = useRouter();
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError("Пароль должен быть не короче 8 символов.");
      return;
    }
    if (password !== confirm) {
      setError("Пароли не совпадают.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await api.post(`/claim/${encodeURIComponent(token)}`, { password });
      router.push("/profile");
      router.refresh();
    } catch (err) {
      setError(errorText(err, "Не удалось активировать аккаунт."));
      setBusy(false);
    }
  }

  return { password, setPassword, confirm, setConfirm, busy, error, submit };
}
