"use client";

import * as React from "react";
import { api, errorText } from "@/lib/api";

/** Заявка в общий пул с удобными датами. */
export function useJoinRequest() {
  const [note, setNote] = React.useState("");
  const [status, setStatus] = React.useState<"idle" | "sending" | "ok" | "error">("idle");
  const [error, setError] = React.useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError("");
    try {
      await api.post(`/registrations`, { note: note.trim() });
      setStatus("ok");
    } catch (err) {
      setStatus("error");
      setError(errorText(err, "Не удалось отправить заявку."));
    }
  }

  return { note, setNote, status, setStatus, error, onSubmit };
}
