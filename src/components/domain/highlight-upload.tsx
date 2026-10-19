"use client";

import * as React from "react";
import { api, ApiError, errorText } from "@/lib/api";

/** Отправка хайлайта на модерацию: ссылкой на твич-клип или своим файлом. */
export function useHighlightUpload({ defaultTournamentId = "", onDone }: { defaultTournamentId?: string; onDone?: () => void }) {
  const [mode, setMode] = React.useState<"link" | "file">("link");
  const [url, setUrl] = React.useState("");
  const [file, setFile] = React.useState<File | null>(null);
  const [title, setTitle] = React.useState("");
  const [tournamentId, setTournamentId] = React.useState(defaultTournamentId);
  const [status, setStatus] = React.useState<"idle" | "sending" | "ok" | "error">("idle");
  const [error, setError] = React.useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError("");
    try {
      if (mode === "link") {
        if (!url.trim()) throw new Error("Вставь ссылку на твич-клип.");
        await api.post("/highlights", {
          twitchClipUrl: url.trim(),
          title: title.trim(),
          tournamentId,
        });
      } else {
        if (!file) throw new Error("Выбери видео-файл.");
        const fd = new FormData();
        fd.append("file", file);
        if (title.trim()) fd.append("title", title.trim());
        if (tournamentId) fd.append("tournamentId", tournamentId);
        // Загрузка файла идёт через свой Next route-handler (стримит тело на бэкенд),
        // а не через apiHref — dev-rewrite Next зависает на потоковом multipart.
        const res = await fetch("/api/highlights/upload", {
          method: "POST",
          body: fd,
          credentials: "include",
        });
        if (!res.ok) throw new ApiError(res.status, await res.text().catch(() => ""));
      }
      setStatus("ok");
      setUrl("");
      setFile(null);
      setTitle("");
      onDone?.();
    } catch (err) {
      setStatus("error");
      setError(err instanceof ApiError ? errorText(err, "Не удалось отправить.") : err instanceof Error ? err.message : "Не удалось отправить.");
    }
  }

  return { mode, setMode, url, setUrl, file, setFile, title, setTitle, tournamentId, setTournamentId, status, error, submit };
}
